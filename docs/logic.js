export const MAX_GROWTH = 5;
export const TOTAL_CHAPTERS = 6;
export const INGREDIENTS = [
  { id: 'sun', name: 'Rayito de sol', icon: 'sun' },
  { id: 'leaf', name: 'Hoja curiosa', icon: 'leaf' },
  { id: 'flower', name: 'Flor de memoria', icon: 'flower' },
  { id: 'drop', name: 'Gota de cuidado', icon: 'drop' },
  { id: 'heart', name: 'Corazón de equipo', icon: 'heart' },
  { id: 'star', name: 'Chispa de cumpleaños', icon: 'star' }
];

export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createGame() {
  return { chapter: 0, growth: 0, ingredients: [], status: 'playing', mistakes: 0 };
}

export function makeMistake(state) {
  if (state.status !== 'playing') return state;
  const growth = Math.min(MAX_GROWTH, state.growth + 1);
  return { ...state, growth, mistakes: state.mistakes + 1, status: growth === MAX_GROWTH ? 'lost' : 'playing' };
}

export function finishChapter(state) {
  if (state.status !== 'playing' || state.ingredients.includes(state.chapter)) return state;
  return { ...state, ingredients: [...state.ingredients, state.chapter], status: 'reward' };
}

export function nextChapter(state) {
  if (state.status !== 'reward') return state;
  if (state.chapter === TOTAL_CHAPTERS - 1) return { ...state, growth: 0, status: 'won' };
  return { ...state, chapter: state.chapter + 1, status: 'playing' };
}

export function makeMath(random = Math.random) {
  const a = 4 + Math.floor(random() * 5);
  const b = 3 + Math.floor(random() * 5);
  const answer = a + b;
  return { a, b, answer, options: shuffle([answer, answer + 2, answer - 2], random) };
}

export function makePattern(random = Math.random) {
  const step = random() < 0.5 ? 2 : 3;
  const start = step === 2 ? 2 : 3;
  const values = Array.from({ length: 4 }, (_, i) => start + step * i);
  const answer = start + step * 4;
  return { values, step, answer, options: shuffle([answer, answer + 1, answer - 1], random) };
}

export function makeMemory(random = Math.random) {
  return shuffle(['sun', 'leaf', 'flower', 'sun', 'leaf', 'flower'], random)
    .map((symbol, id) => ({ id, symbol }));
}

export function checkRecipe(selected, recipe) {
  return selected.length === recipe.length && selected.every((item, i) => item === recipe[i]);
}

export const CARE_QUESTIONS = [
  { question: 'Pandora quiere explorar el jardín. ¿Cómo la acompañamos?', options: ['Con agua, correa y compañía', 'La dejamos salir sola', 'Sin parar a descansar'], answer: 'Con agua, correa y compañía', hint: 'Un paseo es mejor cuando estamos juntos, seguros y podemos beber agua.', explanation: '¡Buen equipo! Pandora explora acompañada y tiene agua cuando la necesita.' },
  { question: 'Hay una mariposa sobre una flor. ¿Qué hacemos?', options: ['La observamos sin tocarla', 'La guardamos en una caja', 'Le quitamos la flor'], answer: 'La observamos sin tocarla', hint: 'Podemos disfrutar de los animales pequeños y dejar que sigan su camino.', explanation: 'Observar con calma nos permite descubrir la naturaleza y cuidarla.' },
  { question: 'El jardín quedó lleno de papeles de la fiesta. ¿Qué hacemos?', options: ['Los recogemos entre todos', 'Los escondemos entre las flores', 'Esperamos a que se los lleve el viento'], answer: 'Los recogemos entre todos', hint: 'Si cada uno ayuda un poquito, el jardín queda limpio.', explanation: 'Cuidar los lugares que compartimos también es una aventura en equipo.' }
];

export const GROWTH_MESSAGES = [
  'Todo tranquilo… por ahora.',
  '¡Uy! Los pantalones le quedaron cortos.',
  '¡Su pelo ya hace cosquillas al árbol!',
  'Tiene que agacharse para pasar por el jardín.',
  '¡Las nubes le están haciendo un sombrero!',
  '¡Demasiado alto! La fiesta tendrá que esperar.'
];
