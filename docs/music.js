export const PANDORA_PLAYLIST = Object.freeze([
  { title: 'Pandora tiene hambre', src: 'assets/music/pandora-tiene-hambre.mp3' },
  { title: 'Sácame ya', src: 'assets/music/sacame-ya.mp3' },
  { title: 'Panties', src: 'assets/music/panties.mp3' }
]);

export function readAudioPreferences(raw) {
  try {
    const value = JSON.parse(raw);
    return {
      enabled: typeof value?.enabled === 'boolean' ? value.enabled : true,
      volume: typeof value?.volume === 'number' && Number.isFinite(value.volume)
        ? Math.max(0, Math.min(1, value.volume)) : .3
    };
  } catch { return { enabled: true, volume: .3 }; }
}

// One media element preserves the song's position across pauses and dialogs.
export class MusicPlayer {
  constructor({ audio, tracks = PANDORA_PLAYLIST, enabled = true, volume = .3, onChange = () => {} }) {
    if (!tracks.length) throw new Error('La lista de canciones está vacía.');
    Object.assign(this, { audio, tracks, enabled, onChange });
    this.index = 0;
    this.active = false;
    this.loaded = false;
    this.pending = false;
    this.blocked = false;
    this.unavailable = false;
    this.revision = 0;
    this.failed = new Set();
    audio.preload = 'none';
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.addEventListener('ended', () => this.next(true));
    audio.addEventListener('error', () => { if (audio.error) this.handleError(); });
    audio.addEventListener('playing', () => {
      if (!this.wantsPlayback()) { this.stop(); return; }
      this.blocked = false;
      this.failed.clear();
      this.emit();
    });
    for (const event of ['pause', 'waiting', 'loadedmetadata']) {
      audio.addEventListener(event, () => this.emit());
    }
  }

  snapshot() {
    return {
      title: this.tracks[this.index].title,
      index: this.index, count: this.tracks.length,
      enabled: this.enabled, volume: this.audio.volume,
      playing: !this.audio.paused && !this.audio.ended,
      active: this.active, blocked: this.blocked, unavailable: this.unavailable
    };
  }

  emit() { this.onChange(this.snapshot()); }
  wantsPlayback() { return this.active && this.enabled && this.audio.volume > 0 && !this.unavailable; }

  stop() {
    this.revision++;
    this.pending = false;
    this.audio.pause();
    this.emit();
  }

  loadTrack() {
    this.stop();
    this.audio.src = this.tracks[this.index].src;
    this.audio.load();
    this.loaded = true;
  }

  reconcile() {
    if (!this.wantsPlayback()) { this.stop(); return; }
    if (!this.loaded) this.loadTrack();
    if (this.pending || !this.audio.paused) return;
    const revision = this.revision;
    this.pending = true;
    // Called from Start, Resume or an audio control, within the user's gesture.
    let playback;
    try { playback = this.audio.play(); }
    catch (error) { playback = Promise.reject(error); }
    Promise.resolve(playback).then(() => {
      if (revision !== this.revision) return;
      this.pending = false;
      this.emit();
    }).catch(error => {
      if (revision !== this.revision) return;
      this.pending = false;
      if (!this.wantsPlayback()) return;
      if (error?.name === 'NotAllowedError') this.blocked = true;
      else if (error?.name !== 'AbortError') { this.handleError(); return; }
      this.emit();
    });
  }

  setActive(active) {
    this.active = !!active;
    this.reconcile();
  }

  setEnabled(enabled) {
    this.enabled = !!enabled;
    if (enabled) { this.blocked = false; this.unavailable = false; this.failed.clear(); }
    this.reconcile();
  }

  setVolume(volume) {
    if (!Number.isFinite(volume)) return;
    this.audio.volume = Math.max(0, Math.min(1, volume));
    this.reconcile();
    this.emit();
  }

  next(automatic = false) {
    if (!automatic) { this.failed.clear(); this.unavailable = false; }
    this.blocked = false;
    this.index = (this.index + 1) % this.tracks.length;
    this.loadTrack();
    this.emit();
    this.reconcile();
  }

  handleError() {
    if (this.unavailable) return;
    this.failed.add(this.index);
    if (this.failed.size === this.tracks.length) {
      this.unavailable = true;
      this.stop();
    } else this.next(true);
  }
}
