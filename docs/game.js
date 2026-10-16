import { MAX_GROWTH, TOTAL_CHAPTERS, INGREDIENTS, GROWTH_MESSAGES, CARE_QUESTIONS, createGame, makeMistake, finishChapter, nextChapter, makeMath, makePattern, makeMemory, checkRecipe, shuffle } from './logic.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const main = $('#main');
const timers = new Set();
let state = null;
let challenge = null;
let locked = false;
let hintUsed = false;
let soundEnabled = false;
let audioContext;
let lastFocus;
let wins = readWins();

const art = (name, extra = '') => `<img class="character ${name} ${extra}" src="assets/characters/${name}.webp" alt="" draggable="false">`;
const labels = { sun: 'Sol', leaf: 'Hoja', flower: 'Flor', drop: 'Gota', heart: 'Corazón', star: 'Estrella' };
const paths = {
  star: '<path d="m16 3 3.7 8 8.8 1-6.5 6 1.8 9-7.8-4.5L8.2 27l1.8-9-6.5-6 8.8-1Z" fill="#e6b34e" stroke="#b68634" stroke-width="1.2"/>',
  sun: '<circle cx="16" cy="16" r="6" fill="#efc35f" stroke="#c39743" stroke-width="1.2"/><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M6 26l3-3M23 9l3-3" stroke="#d7a447" stroke-width="2" stroke-linecap="round"/>',
  leaf: '<path d="M27 5C8 3 2 16 7 23c8 10 22 0 20-18Z" fill="#90aa70" stroke="#5b7d4c" stroke-width="1.3"/><path d="M4 29 23 10m-9 9-1-8m7 2 4 1" stroke="#5b7d4c" stroke-width="1.5" stroke-linecap="round"/>',
  flower: '<path d="M16 21v9m0-4 7-4" stroke="#72864f" stroke-width="2" stroke-linecap="round"/><g fill="#d88b80" stroke="#b97770" stroke-width=".6"><ellipse cx="16" cy="8" rx="5" ry="6"/><ellipse cx="22" cy="13" rx="6" ry="5"/><ellipse cx="20" cy="20" rx="5" ry="6"/><ellipse cx="11" cy="20" rx="5" ry="6"/><ellipse cx="9" cy="12" rx="6" ry="5"/></g><circle cx="16" cy="14" r="4" fill="#f5d681"/>',
  drop: '<path d="M16 3S6 15 6 21a10 10 0 0 0 20 0C26 15 16 3 16 3Z" fill="#8bbcc2" stroke="#61979f" stroke-width="1.3"/><path d="M10 21c0 3 2 5 5 6" stroke="#e1f0df" stroke-width="2" stroke-linecap="round"/>',
  heart: '<path d="M16 28S3 20 3 11a7 7 0 0 1 13-3 7 7 0 0 1 13 3c0 9-13 17-13 17Z" fill="#d68f82" stroke="#b67467" stroke-width="1.3"/>',
  paw: '<ellipse cx="16" cy="22" rx="8" ry="7" fill="currentColor"/><ellipse cx="6" cy="13" rx="3.5" ry="4.5" fill="currentColor"/><ellipse cx="13" cy="7" rx="3.5" ry="4.5" fill="currentColor"/><ellipse cx="22" cy="8" rx="3.5" ry="4.5" fill="currentColor"/><ellipse cx="28" cy="15" rx="3.5" ry="4.5" fill="currentColor"/>',
  clock: '<circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 8v9l6 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  check: '<circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m10 16 4 4 8-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  pause: '<path d="M11 7v18M21 7v18" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  sound: '<path d="M5 12h5l8-6v20l-8-6H5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M23 10c4 3 4 9 0 12m4-16c7 6 7 14 0 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  mute: '<path d="M5 12h5l8-6v20l-8-6H5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m24 12 6 8m0-8-6 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  book: '<path d="M16 8C11 4 6 5 3 6v21c4-2 9-2 13 1 4-3 9-3 13-1V6c-4-1-9-2-13 2Zm0 0v20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
};
function icon(name, extra = '') { return `<svg class="symbol ${extra}" viewBox="0 0 32 32" aria-hidden="true">${paths[name] || paths.star}</svg>`; }
function readWins() { try { return Math.max(0, Math.min(999, Number(localStorage.getItem('anya-adventure-wins')) || 0)); } catch { return 0; } }
function saveWin() { wins++; try { localStorage.setItem('anya-adventure-wins', String(wins)); } catch { /* El juego también funciona sin almacenamiento. */ } }
function announce(text) { $('#announcer').textContent = text; }
function clearTimers() { timers.forEach(clearTimeout); timers.clear(); }
function later(callback, ms) {
  const timer = setTimeout(() => {
    timers.delete(timer);
    if (document.hidden || $$('dialog[open]').length) { later(callback, 250); return; }
    callback();
  }, ms);
  timers.add(timer);
  return timer;
}
function focusHeading() { const heading = $('h1, h2', main); if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); } }
function topOfMain() { window.scrollTo({ top: 0, behavior: 'instant' }); }
function playSound(kind = 'tap') {
  if (!soundEnabled || document.hidden) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    const notes = kind === 'win' ? [523, 659, 784, 1047] : kind === 'success' ? [523, 659, 784] : kind === 'error' ? [294, 262] : [587];
    notes.forEach((frequency, i) => {
      const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
      const start = audioContext.currentTime + i * 0.1;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.045, start + 0.015); gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(start); oscillator.stop(start + 0.3);
    });
  } catch { soundEnabled = false; updateSoundButton(); }
}
function updateSoundButton() {
  const button = $('#sound-button');
  button.innerHTML = icon(soundEnabled ? 'sound' : 'mute');
  button.setAttribute('aria-pressed', String(soundEnabled));
  button.setAttribute('aria-label', soundEnabled ? 'Desactivar sonido' : 'Activar sonido');
  button.title = soundEnabled ? 'Desactivar sonido' : 'Activar sonido';
}

function welcome() {
  clearTimers(); state = null; challenge = null; locked = false;
  main.innerHTML = `<section class="welcome appear" aria-label="Bienvenida a la aventura"><div class="hero"><div class="hero-copy"><span class="eyebrow">PARA UNA NIÑA CON UNA GRAN IMAGINACIÓN</span><h1>Anya y el<br>hechizo<br> <em class="title-accent">estirón</em></h1><p>¡Alessandro no para de crecer! Un hechizo se ha colado en tu cumpleaños. Por suerte, tú y Pandora tienen un plan.</p><button class="button primary" id="start-button">¡Vamos a la aventura! <span aria-hidden="true">↗</span></button><div class="hero-note">${icon('clock')} Una partida cortita · Sin prisa · A tu ritmo</div></div><div class="hero-art" role="img" aria-label="Anya con su flor mágica, Pandora con un pañuelo verde y Alessandro, muy alto, con un globo de cumpleaños"><img class="garden-bg" src="assets/garden.svg" alt="">${art('alessandro')}${art('anya')}${art('pandora')}<div class="speech-bubble">Anya… ¡creo que me pasé de alto!</div><div class="birthday-sticker" aria-label="Felices 8 años"><span>¡FELICES</span><b>8</b><span>AÑOS!</span></div><span class="art-label anya-label">Anya, la aventurera</span><span class="art-label pandora-label">Pandora, tu cómplice</span><span class="art-label alessandro-label">Alessandro ↑</span>${icon('star', 'hero-spark')}${icon('star', 'hero-spark small')}</div></div><div class="adventure-details"><div class="detail-item"><span class="detail-number">06</span><div><b>Pequeños retos</b><small>Números, memoria e imaginación</small></div></div><div class="detail-item">${icon('paw')}<div><b>Una compañera especial</b><small>Pandora siempre tiene una pista</small></div></div><div class="detail-item">${icon('heart')}<div><b>Un regalo para ti</b><small>Hecho para celebrar tus 8 años</small></div></div></div><div class="welcome-bottom">${wins ? `<span class="saved-medal">${icon('star')} Ya rompiste el hechizo ${wins} ${wins === 1 ? 'vez' : 'veces'}. ¡Gran equipo!</span>` : '<p>Un poquito de magia, un poquito de ingenio y muchas ganas de ayudar.</p>'}<p>Crecer está bien. ¡Este estirón es solo cosa de la magia!</p></div></section>`;
  $('#start-button').addEventListener('click', startGame);
}

function startGame() { clearTimers(); state = createGame(); playSound('tap'); renderChapter(); topOfMain(); }
const chapterInfo = [
  ['EL CLARO DE LOS RAYITOS', 'Un poquito de sol', 'Las flores guardan el primer ingrediente. Cuenta sus rayitos para abrir el camino.'],
  ['EL SENDERO SALTARÍN', 'Cada piedra, un salto', 'Este camino tiene un secreto. Descubre cómo cambian los números para cruzarlo.'],
  ['EL JARDÍN DE LOS RECUERDOS', 'Dos de cada uno', 'Las flores esconden parejas. Encuentra las tres para despertar la flor de memoria.'],
  ['EL RINCÓN DE PANDORA', 'Cuidar también es magia', 'Los pequeños gestos hacen que el jardín sea un lugar mejor para todos.'],
  ['EL ÁRBOL DE LAS PALABRAS', 'La palabra que nos une', 'Una palabra se desordenó entre las hojas. Pon sus letras en su lugar.'],
  ['EL TALLER DE LA MAGIA', 'La receta antiestirón', '¡Ya casi! Recuerda el orden de la receta y prepara la poción para Alessandro.']
];

function worldMarkup() {
  return `<aside class="world-panel" aria-label="El jardín y el progreso del hechizo"><div class="world-scene ${state.growth >= 4 ? 'high-growth' : ''}" style="--growth:${state.growth}" role="img" aria-label="Alessandro lleva ${state.growth} de ${MAX_GROWTH} estirones mágicos"><img class="garden-bg" src="assets/garden.svg" alt="">${art('alessandro')}${art('anya')}${art('pandora')}<span class="scene-name">EL JARDÍN DE ANYA</span><span class="cloud-hat" aria-hidden="true">☁</span></div><div class="growth-panel"><span class="growth-heading">EL ESTIRÓN DE ALESSANDRO</span><span class="growth-count">${state.growth} / ${MAX_GROWTH}</span><div class="growth-track" aria-hidden="true">${Array.from({ length: MAX_GROWTH }, (_, i) => `<span class="growth-tick ${i < state.growth ? 'filled' : ''} ${i < state.growth && state.growth >= 4 ? 'danger' : ''}"></span>`).join('')}</div><p class="growth-caption">${GROWTH_MESSAGES[state.growth]}</p></div><div class="tray-caption">TU POCIÓN · ${state.ingredients.length} DE ${TOTAL_CHAPTERS}</div><div class="ingredient-tray" aria-label="Ingredientes de la poción">${INGREDIENTS.map((item, i) => `<div class="ingredient-slot ${state.ingredients.includes(i) ? 'collected' : ''} ${i === state.chapter ? 'current' : ''}" title="${item.name}${state.ingredients.includes(i) ? ': conseguido' : ': pendiente'}" role="img" aria-label="${item.name}: ${state.ingredients.includes(i) ? 'conseguido' : 'pendiente'}">${icon(item.icon)}</div>`).join('')}</div></aside>`;
}
function updateWorld() { const world = $('.world-panel'); if (world) world.outerHTML = worldMarkup(); }

function renderChapter() {
  clearTimers(); locked = false; hintUsed = false;
  const [eyebrow, title, intro] = chapterInfo[state.chapter];
  main.innerHTML = `<section class="game-screen appear"><div class="game-topline"><span class="chapter-label"><span class="chapter-n">${state.chapter + 1}</span> CAPÍTULO ${state.chapter + 1} DE ${TOTAL_CHAPTERS}</span><button class="pause-button" id="pause-button">${icon('pause')} Pausar</button></div><div class="game-layout">${worldMarkup()}<section class="challenge-panel" aria-label="Reto actual"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2><p class="challenge-intro">${intro}</p><div class="challenge-area"></div><div class="feedback" id="feedback" aria-live="polite">Puedes tomarte todo el tiempo que quieras.</div><div class="hint-panel"><img class="hint-portrait" src="assets/characters/pandora.webp" alt="Pandora"><div id="hint-content"><button class="hint-button" id="hint-button">Una pista de Pandora ${icon('paw')}</button></div></div></section></div></section>`;
  $('#pause-button').addEventListener('click', () => openDialog($('#pause-dialog')));
  $('#hint-button').addEventListener('click', showHint);
  if (state.chapter === 0) renderMath();
  if (state.chapter === 1) renderPattern();
  if (state.chapter === 2) renderMemory();
  if (state.chapter === 3) renderCare();
  if (state.chapter === 4) renderWord();
  if (state.chapter === 5) renderRecipe();
  focusHeading();
}

function setFeedback(message, type = '') {
  const feedback = $('#feedback');
  if (feedback) { feedback.className = `feedback ${type}`; feedback.innerHTML = `${icon(type === 'success' ? 'check' : type === 'error' ? 'leaf' : 'paw')}<span>${message}</span>`; }
}
function wrong(message, after) {
  if (locked || state.status !== 'playing') return;
  locked = true; state = makeMistake(state); updateWorld(); playSound('error');
  setFeedback(message, 'error'); announce(`${message} ${GROWTH_MESSAGES[state.growth]} Estirón ${state.growth} de ${MAX_GROWTH}.`);
  const scene = $('.world-scene'); scene?.classList.add('shake');
  later(() => {
    if (state.status === 'lost') { showEnd(false); return; }
    scene?.classList.remove('shake'); locked = false; after?.();
  }, state.status === 'lost' ? 1400 : 900);
}
function complete(message) {
  if (state.status !== 'playing') return;
  state = finishChapter(state); locked = true; clearTimers(); updateWorld(); playSound('success');
  const item = INGREDIENTS[state.chapter];
  $('.challenge-panel').innerHTML = `<div class="reward"><div class="reward-icon">${icon(item.icon)}</div><span class="eyebrow">INGREDIENTE ${state.chapter + 1} DE ${TOTAL_CHAPTERS} CONSEGUIDO</span><h2>¡${item.name}!</h2><p>${message}</p><button class="button primary" id="next-button">${state.chapter === 5 ? '¡Romper el hechizo!' : 'Seguimos explorando'} <span aria-hidden="true">→</span></button>${state.chapter === 2 ? '<p class="break-note">Pausa de exploradora: mueve los hombros y mira algo que esté lejos. El jardín te espera.</p>' : '<p class="break-note">Cada descubrimiento nos acerca un poquito más.</p>'}</div>`;
  $('#next-button').addEventListener('click', () => { if (state.status !== 'reward') return; state = nextChapter(state); if (state.status === 'won') showEnd(true); else renderChapter(); });
  announce(`¡${item.name} conseguido! ${message}`); focusHeading();
}

function bindChoices(correct, success, hint) {
  challenge.hint = hint;
  $$('.answer-button').forEach(button => button.addEventListener('click', () => {
    if (locked || state.status !== 'playing' || button.disabled) return;
    if (button.dataset.value === String(correct)) { button.classList.add('correct'); complete(success); }
    else { button.classList.add('wrong'); button.disabled = true; wrong('Ese no era. Alessandro dio un estirón. ¡Prueba otra idea!'); }
  }));
}
function numberOptions(options) { return `<div class="answer-grid">${options.map(number => `<button class="answer-button" data-value="${number}">${number}</button>`).join('')}</div>`; }
function renderMath() {
  challenge = { ...makeMath() };
  const { a, b, answer, options } = challenge;
  $('.challenge-area').innerHTML = `<div class="math-garden" role="img" aria-label="Un grupo de ${a} flores y otro de ${b} flores"><div class="flower-group">${Array.from({ length: a }, () => icon('flower')).join('')}</div><span class="math-sign" aria-hidden="true">+</span><div class="flower-group">${Array.from({ length: b }, () => icon('flower')).join('')}</div></div><p class="question">Hay ${a} flores y brotan ${b} más.<br>¿Cuántas flores hay en total?</p>${numberOptions(options)}`;
  bindChoices(answer, `${a} + ${b} = ${answer}. Al sumar, juntamos los dos grupos. ¡El primer rayito es tuyo!`, `Empieza en ${a} y cuenta ${b} pasos más. También puedes contar las flores de una en una.`);
}
function renderPattern() {
  challenge = { ...makePattern() };
  const { values, answer, options, step } = challenge;
  $('.challenge-area').innerHTML = `<div class="pattern-row" role="img" aria-label="Secuencia: ${values.join(', ')}, y un número desconocido">${[...values, '?'].map(value => `<span class="pattern-stone">${value}</span>`).join('')}</div><p class="question">¿Qué número sigue en el camino?</p>${numberOptions(options)}`;
  bindChoices(answer, `¡Descubriste la regla! Cada salto suma ${step}. Después de ${values.at(-1)} viene ${answer}.`, `Cada piedra aumenta ${step}. Cuenta ${step} más desde la última: ${values.at(-1)}.`);
}
function renderMemory() {
  challenge = { cards: makeMemory(), selected: [], matched: [], hint: 'Mira bien dónde está cada dibujo. Voy a enseñarte todas las cartas un momentito.' };
  $('.challenge-area').innerHTML = `<p class="memory-progress" id="memory-progress">0 de 3 parejas encontradas</p><div class="memory-grid">${challenge.cards.map(card => `<button class="memory-card" data-card="${card.id}" aria-label="Carta ${card.id + 1}, boca abajo" aria-pressed="false">${icon('paw', 'card-back')}</button>`).join('')}</div>`;
  $$('.memory-card').forEach(button => button.addEventListener('click', () => flipCard(Number(button.dataset.card))));
}
function drawCard(id, reveal) {
  const card = challenge.cards.find(card => card.id === id);
  const button = $(`[data-card="${id}"]`); if (!button) return;
  const matched = challenge.matched.includes(id);
  button.innerHTML = reveal ? `${icon(card.symbol)}${matched ? '<span class="matched-check" aria-hidden="true">✓</span>' : ''}` : icon('paw', 'card-back');
  button.classList.toggle('revealed', reveal); button.classList.toggle('matched', matched);
  button.setAttribute('aria-label', `Carta ${id + 1}, ${reveal ? labels[card.symbol] : 'boca abajo'}${matched ? ', pareja encontrada' : ''}`);
  button.setAttribute('aria-pressed', String(reveal)); button.disabled = matched;
}
function flipCard(id) {
  if (locked || state.status !== 'playing' || challenge.matched.includes(id) || challenge.selected.includes(id)) return;
  challenge.selected.push(id); drawCard(id, true); playSound();
  if (challenge.selected.length < 2) return;
  const [a, b] = challenge.selected;
  if (challenge.cards[a].symbol === challenge.cards[b].symbol) {
    challenge.matched.push(a, b); challenge.selected = []; drawCard(a, true); drawCard(b, true);
    $('#memory-progress').textContent = `${challenge.matched.length / 2} de 3 parejas encontradas`;
    if (challenge.matched.length === 6) complete('Encontraste las tres parejas. Observar con calma ayuda a recordar. ¡Tu memoria hizo magia!');
    else { setFeedback('¡Una pareja! Sigue mirando con calma.', 'success'); playSound('success'); }
  } else wrong('Son diferentes. Recuerda sus lugares para la próxima.', () => { drawCard(a, false); drawCard(b, false); challenge.selected = []; });
}
function renderCare() {
  const care = CARE_QUESTIONS[Math.floor(Math.random() * CARE_QUESTIONS.length)];
  challenge = { ...care };
  $('.challenge-area').innerHTML = `<p class="question">${care.question}</p><div class="choice-list">${shuffle(care.options).map((answer, i) => `<button class="answer-button" data-value="${answer}"><span class="option-dot" aria-hidden="true">${String.fromCharCode(65 + i)}</span>${answer}</button>`).join('')}</div>`;
  bindChoices(care.answer, care.explanation, care.hint);
}
function renderWord() {
  challenge = { word: 'EQUIPO', letters: shuffle([...('EQUIPO')]), selected: [], hint: 'La palabra es E-Q-U-I-P-O. Busca primero la E y después la Q. ¡Juntos llegamos más lejos!' };
  $('.challenge-area').innerHTML = `<p class="question">Cuando nos ayudamos, somos un…<br><span class="quiet-note">Ordena las 6 letras para descubrirlo.</span></p><div class="word-slots" id="word-slots" role="status" aria-label="Palabra por formar"></div><div class="letter-tiles">${challenge.letters.map((letter, i) => `<button class="letter-tile" data-letter="${i}" aria-label="Letra ${letter}">${letter}</button>`).join('')}</div><div class="word-actions"><button class="text-button" id="erase-button">Borrar última</button><button class="button secondary" id="check-word" disabled>Comprobar ${icon('check')}</button></div>`;
  $$('.letter-tile').forEach(button => button.addEventListener('click', () => { if (locked || challenge.selected.length === 6) return; challenge.selected.push(Number(button.dataset.letter)); button.disabled = true; updateWord(); playSound(); }));
  $('#erase-button').addEventListener('click', () => { if (locked || !challenge.selected.length) return; const index = challenge.selected.pop(); $(`[data-letter="${index}"]`).disabled = false; updateWord(); });
  $('#check-word').addEventListener('click', () => {
    if (locked || challenge.selected.length !== 6) return;
    if (challenge.selected.map(i => challenge.letters[i]).join('') === challenge.word) complete('E-Q-U-I-P-O. Ayudarnos, escucharnos y compartir las ideas nos hace un gran equipo. ¡Tú, Pandora y Alessandro!');
    else wrong('Las letras quieren cambiar de sitio. ¡Pandora puede darte una pista!', () => { challenge.selected = []; $$('.letter-tile').forEach(button => { button.disabled = false; }); updateWord(); });
  }); updateWord();
}
function updateWord() {
  const text = challenge.selected.map(i => challenge.letters[i]);
  $('#word-slots').innerHTML = Array.from({ length: 6 }, (_, i) => `<span class="word-slot" aria-hidden="true">${text[i] || ''}</span>`).join('');
  $('#word-slots').setAttribute('aria-label', text.length ? `Tu palabra: ${text.join(', ')}` : 'Palabra por formar, seis letras');
  $('#check-word').disabled = text.length !== 6; $('#erase-button').disabled = !text.length;
}
function renderRecipe() {
  challenge = { recipe: shuffle(['sun', 'drop', 'leaf', 'star']), selected: [], studying: true, hint: '' };
  challenge.hint = `El orden es: ${challenge.recipe.map(key => labels[key].toLowerCase()).join(', ')}. Puedes volver a mirar la receta cuando quieras.`;
  drawRecipe();
}
function drawRecipe() {
  const area = $('.challenge-area');
  if (challenge.studying) {
    area.innerHTML = `<p class="question">Mira la receta, en este orden:</p><div class="recipe-peek">${challenge.recipe.map((key, i) => `<div class="recipe-step"><b>${i + 1}</b>${icon(key)}<small>${labels[key]}</small></div>`).join('')}</div><p class="recipe-reminder">Mírala todo el tiempo que necesites. Después, toca los ingredientes en el mismo orden.</p><button class="button secondary recipe-study-button" id="remember-recipe">¡Ya me la sé! <span aria-hidden="true">→</span></button>`;
    $('#remember-recipe').addEventListener('click', () => { challenge.studying = false; challenge.selected = []; drawRecipe(); });
  } else {
    area.innerHTML = `<p class="question">Toca los ingredientes en el orden de la receta.</p><div class="recipe-dots" aria-label="${challenge.selected.length} de 4 ingredientes en orden">${Array.from({ length: 4 }, (_, i) => `<span class="recipe-dot ${i < challenge.selected.length ? 'done' : ''}"></span>`).join('')}</div><div class="recipe-options">${['sun', 'drop', 'leaf', 'star'].map(key => `<button class="recipe-button" data-ingredient="${key}">${icon(key)}${labels[key]}</button>`).join('')}</div><button class="text-button" id="study-again" style="margin-top:18px">Volver a mirar la receta</button>`;
    $('#study-again').addEventListener('click', () => { if (locked) return; challenge.studying = true; challenge.selected = []; drawRecipe(); });
    $$('.recipe-button').forEach(button => button.addEventListener('click', () => {
      if (locked || state.status !== 'playing') return;
      const choice = button.dataset.ingredient;
      if (choice !== challenge.recipe[challenge.selected.length]) {
        wrong('La receta se mezcló. ¡Vamos a mirarla otra vez!', () => { challenge.studying = true; challenge.selected = []; drawRecipe(); }); return;
      }
      challenge.selected.push(choice); playSound();
      if (checkRecipe(challenge.selected, challenge.recipe)) complete('Sol, agua, naturaleza y tu chispa especial. ¡La poción antiestirón está lista para romper el hechizo!');
      else { drawRecipe(); setFeedback(`¡Bien! ${challenge.selected.length} de 4 ingredientes en su lugar.`, 'success'); }
    }));
  }
}
function showHint() {
  if (hintUsed || locked || state?.status !== 'playing') return;
  hintUsed = true;
  $('#hint-content').innerHTML = `<p class="hint-copy">${challenge.hint}</p>`;
  announce(`Pandora dice: ${challenge.hint}`); playSound();
  if (state.chapter === 2) {
    locked = true;
    challenge.cards.forEach(card => drawCard(card.id, true));
    later(() => { challenge.cards.forEach(card => drawCard(card.id, challenge.matched.includes(card.id) || challenge.selected.includes(card.id))); locked = false; }, 3000);
  }
}

function showEnd(won) {
  clearTimers(); locked = true;
  if (won) { saveWin(); playSound('win'); }
  const title = won ? 'Un hechizo menos.<br><em class="title-accent">¡Un cumpleaños más!</em>' : 'Se nos fue<br>un poquito<br><em class="title-accent">de las manos…</em>';
  main.innerHTML = `<section class="end-screen appear"><div class="end-copy"><span class="eyebrow">${won ? 'MISIÓN CUMPLIDA, PEQUEÑA AVENTURERA' : 'EL HECHIZO GANÓ ESTA VEZ'}</span>${won ? `<div class="end-badge">${icon('star')} GUARDIANA DEL JARDÍN · 6 DE 6 INGREDIENTES</div>` : ''}<h1>${title}</h1><p>${won ? '¡Lo lograste, Anya! Alessandro volvió a su tamaño de siempre. Pandora mueve la cola y el jardín está listo para tu fiesta.' : 'Alessandro creció tanto que las nubes le hacen cosquillas. La fiesta tendrá que esperar un momentito. ¡Con tus ideas y las pistas de Pandora pueden intentarlo otra vez!'}</p>${won ? '<div class="birthday-message">Que tus 8 estén llenos de curiosidad,<br>aventuras y personas que te quieran.</div>' : ''}<button class="button primary" id="replay-button">${won ? 'Otra pequeña aventura' : '¡Lo intentamos otra vez!'} <span aria-hidden="true">↗</span></button><button class="text-button" id="end-home-button">Volver al inicio</button><p class="end-note">${won ? 'Ahora toca celebrar fuera de la pantalla. ¡Un abrazo para tu gran equipo!' : 'Cada intento enseña algo. Puedes descansar y volver cuando quieras.'}</p></div><div class="end-art ${won ? '' : 'lost'}" role="img" aria-label="${won ? 'Anya, Pandora y Alessandro celebran juntos en el jardín' : 'Alessandro toca las nubes mientras Anya y Pandora preparan un nuevo plan'}"><img class="garden-bg" src="assets/garden.svg" alt="">${art('alessandro')}${art('anya')}${art('pandora')}${won ? '<div class="birthday-sticker"><span>¡FELICES</span><b>8</b><span>ANYA!</span></div>' : '<span class="cloud-hat" style="opacity:1;right:5%;top:3%" aria-hidden="true">☁</span>'}</div></section>`;
  $('#replay-button').addEventListener('click', startGame);
  $('#end-home-button').addEventListener('click', () => { welcome(); topOfMain(); focusHeading(); });
  if (won) confetti(); announce(won ? '¡Felicidades, Anya! Rompiste el hechizo y Alessandro volvió a su tamaño. ¡Felices ocho años!' : 'El hechizo ganó esta vez. Puedes volver a intentarlo con las pistas de Pandora.');
  focusHeading(); topOfMain();
}
function confetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const confetti = document.createElement('div'); confetti.className = 'confetti'; confetti.setAttribute('aria-hidden', 'true');
  const colors = ['#d7a14a', '#8ca47a', '#ca8a75', '#9fbabc'];
  confetti.innerHTML = Array.from({ length: 36 }, (_, i) => `<span style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.8}s;border-radius:${i % 2 ? '50%' : '1px'}"></span>`).join('');
  document.body.append(confetti); setTimeout(() => confetti.remove(), 4500);
}
function openDialog(dialog) { if (dialog.open) return; lastFocus = document.activeElement; dialog.showModal(); }
function closeDialog(dialog) { dialog.close(); lastFocus?.focus({ preventScroll: true }); }
$('#sound-button').addEventListener('click', () => { soundEnabled = !soundEnabled; updateSoundButton(); if (soundEnabled) playSound(); else audioContext?.suspend(); });
$('#help-button').addEventListener('click', () => openDialog($('#help-dialog')));
$$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
$('#resume-button').addEventListener('click', () => closeDialog($('#pause-dialog')));
$('#quit-button').addEventListener('click', () => { $('#pause-dialog').close(); welcome(); topOfMain(); focusHeading(); });
$('#home-link').addEventListener('click', event => { event.preventDefault(); if (state && ['playing', 'reward'].includes(state.status)) openDialog($('#pause-dialog')); else { welcome(); topOfMain(); focusHeading(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) { audioContext?.suspend(); if (state && ['playing', 'reward'].includes(state.status) && !$$('dialog[open]').length) openDialog($('#pause-dialog')); } });
updateSoundButton(); welcome();
