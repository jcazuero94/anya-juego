import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { MusicPlayer, PANDORA_PLAYLIST, readAudioPreferences } from '../docs/music.js';

class AudioStub extends EventTarget {
  paused = true;
  ended = false;
  volume = 1;
  currentTime = 0;
  src = '';
  error = null;
  playCalls = 0;
  rejectNext = null;
  play() {
    this.playCalls++;
    if (this.rejectNext) {
      const error = this.rejectNext;
      this.rejectNext = null;
      return Promise.reject(error);
    }
    this.paused = false;
    this.ended = false;
    this.dispatchEvent(new Event('playing'));
    return Promise.resolve();
  }
  pause() {
    const changed = !this.paused;
    this.paused = true;
    if (changed) this.dispatchEvent(new Event('pause'));
  }
  load() { this.currentTime = 0; this.error = null; this.ended = false; }
  finish() { this.ended = true; this.paused = true; this.dispatchEvent(new Event('ended')); }
  fail() { this.error = { code: 4 }; this.paused = true; this.dispatchEvent(new Event('error')); }
}
const settle = () => new Promise(resolve => setImmediate(resolve));
function setup(options = {}) {
  const audio = new AudioStub();
  return { audio, player: new MusicPlayer({ audio, ...options }) };
}

test('las tres canciones de Pandora existen en los recursos públicos y no se descargan al abrir la portada', async () => {
  assert.equal(PANDORA_PLAYLIST.length, 3);
  for (const track of PANDORA_PLAYLIST) await access(new URL('../docs/' + track.src, import.meta.url));
  const { audio, player } = setup();
  assert.equal(audio.src, '');
  assert.equal(audio.preload, 'none');
  assert.equal(audio.volume, .3);
  assert.equal(player.snapshot().playing, false);
});

test('la lista reproduce las tres canciones y vuelve a la primera al terminar la última', async () => {
  const { audio, player } = setup();
  player.setActive(true);
  assert.equal(audio.src, PANDORA_PLAYLIST[0].src);
  await settle();
  for (const index of [1, 2, 0]) {
    audio.finish();
    await settle();
    assert.equal(player.snapshot().index, index);
    assert.equal(audio.src, PANDORA_PLAYLIST[index].src);
    assert.equal(audio.paused, false);
  }
});

test('pausar o salir conserva la posición y reanudar continúa sin reiniciar la canción', async () => {
  const { audio, player } = setup();
  player.setActive(true);
  await settle();
  audio.currentTime = 51.5;
  player.setActive(false);
  assert.equal(audio.paused, true);
  assert.equal(audio.currentTime, 51.5);
  player.setActive(true);
  await settle();
  assert.equal(audio.paused, false);
  assert.equal(audio.currentTime, 51.5);
  assert.equal(player.snapshot().index, 0);
});

test('silenciar detiene la música y pasar de canción respeta el silencio y la pausa', async () => {
  const { audio, player } = setup();
  player.setActive(true);
  await settle();
  player.setEnabled(false);
  player.next();
  await settle();
  assert.equal(player.snapshot().index, 1);
  assert.equal(audio.paused, true);
  player.setEnabled(true);
  await settle();
  assert.equal(audio.paused, false);
  player.setActive(false);
  player.next();
  await settle();
  assert.equal(player.snapshot().index, 2);
  assert.equal(audio.paused, true);
});

test('el volumen se limita a su rango y llegar a cero pausa hasta subirlo', async () => {
  const { audio, player } = setup();
  player.setActive(true);
  await settle();
  player.setVolume(0);
  assert.equal(audio.paused, true);
  player.setVolume(.47);
  await settle();
  assert.equal(audio.volume, .47);
  assert.equal(audio.paused, false);
  player.setVolume(4);
  assert.equal(audio.volume, 1);
  player.setVolume(NaN);
  assert.equal(audio.volume, 1);
});

test('un bloqueo de reproducción se puede recuperar al tocar el altavoz', async () => {
  const { audio, player } = setup();
  audio.rejectNext = Object.assign(new Error('Hace falta un toque'), { name: 'NotAllowedError' });
  player.setActive(true);
  await settle();
  assert.equal(player.snapshot().blocked, true);
  assert.equal(audio.paused, true);
  player.setEnabled(true);
  await settle();
  assert.equal(player.snapshot().blocked, false);
  assert.equal(audio.paused, false);
});

test('una promesa antigua no vuelve a activar la música después de pausar', async () => {
  const { audio, player } = setup();
  let rejectPlayback;
  audio.play = () => new Promise((resolve, reject) => { rejectPlayback = reject; });
  player.setActive(true);
  player.setActive(false);
  rejectPlayback(Object.assign(new Error('Cancelado'), { name: 'NotAllowedError' }));
  await settle();
  assert.equal(player.snapshot().active, false);
  assert.equal(player.snapshot().blocked, false);
  assert.equal(audio.paused, true);
});

test('un archivo que falla se salta y tres errores consecutivos detienen los reintentos', async () => {
  const { audio, player } = setup();
  audio.play = () => Promise.resolve();
  player.setActive(true);
  await settle();
  for (let i = 0; i < 3; i++) { audio.fail(); await settle(); }
  assert.equal(player.snapshot().unavailable, true);
  assert.equal(audio.paused, true);
  const index = player.snapshot().index;
  audio.fail();
  assert.equal(player.snapshot().index, index);
  player.setEnabled(true);
  assert.equal(player.snapshot().unavailable, false);
});

test('las preferencias guardadas conservan silencio y volumen con valores seguros', () => {
  assert.deepEqual(readAudioPreferences(null), { enabled: true, volume: .3 });
  assert.deepEqual(readAudioPreferences('{'), { enabled: true, volume: .3 });
  assert.deepEqual(readAudioPreferences('{"enabled":false,"volume":0.12}'), { enabled: false, volume: .12 });
  assert.deepEqual(readAudioPreferences('{"enabled":"no","volume":9}'), { enabled: true, volume: 1 });
});
