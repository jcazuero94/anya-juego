import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_GROWTH, TOTAL_CHAPTERS, INGREDIENTS, CARE_QUESTIONS, GROWTH_MESSAGES, createGame, makeMistake, finishChapter, nextChapter, shuffle, makeMath, makePattern, makeMemory, checkRecipe } from '../docs/logic.js';

test('una partida nueva tiene seis ingredientes pendientes y ningún estirón', () => {
  const state = createGame();
  assert.equal(state.growth, 0); assert.equal(state.chapter, 0);
  assert.equal(state.status, 'playing'); assert.deepEqual(state.ingredients, []);
  assert.equal(INGREDIENTS.length, TOTAL_CHAPTERS);
});

test('cada error aumenta el estirón exactamente una vez, sin mutar el estado anterior', () => {
  const state = createGame(); const next = makeMistake(state);
  assert.equal(state.growth, 0); assert.equal(next.growth, 1); assert.equal(next.mistakes, 1);
  assert.equal(next.status, 'playing');
});

test('el quinto error termina la partida y bloquea más crecimiento', () => {
  let state = createGame();
  for (let i = 0; i < MAX_GROWTH; i++) state = makeMistake(state);
  assert.equal(state.status, 'lost'); assert.equal(state.growth, MAX_GROWTH);
  assert.strictEqual(makeMistake(state), state);
  assert.strictEqual(finishChapter(state), state);
  assert.strictEqual(nextChapter(state), state);
});

test('acertar da un solo ingrediente y requiere continuar antes del próximo reto', () => {
  const reward = finishChapter(createGame());
  assert.equal(reward.chapter, 0); assert.equal(reward.status, 'reward');
  assert.deepEqual(reward.ingredients, [0]);
  assert.strictEqual(finishChapter(reward), reward);
  assert.strictEqual(makeMistake(reward), reward);
  const next = nextChapter(reward);
  assert.equal(next.chapter, 1); assert.equal(next.status, 'playing');
});

test('no se pueden saltar capítulos sin conseguir su ingrediente', () => {
  const state = createGame(); assert.strictEqual(nextChapter(state), state);
});

test('seis retos resueltos rompen el hechizo y devuelven a Alessandro a su tamaño', () => {
  let state = makeMistake(makeMistake(createGame()));
  for (let i = 0; i < TOTAL_CHAPTERS; i++) {
    assert.equal(state.chapter, i); state = nextChapter(finishChapter(state));
  }
  assert.equal(state.status, 'won'); assert.equal(state.growth, 0);
  assert.equal(state.ingredients.length, TOTAL_CHAPTERS);
  assert.equal(new Set(state.ingredients).size, TOTAL_CHAPTERS);
  assert.strictEqual(makeMistake(state), state);
});

test('la cuarta equivocación permite seguir jugando y ganar', () => {
  let state = createGame();
  for (let i = 0; i < MAX_GROWTH - 1; i++) state = makeMistake(state);
  for (let i = 0; i < TOTAL_CHAPTERS; i++) state = nextChapter(finishChapter(state));
  assert.equal(state.status, 'won'); assert.equal(state.mistakes, 4);
});

test('volver a jugar no conserva estirones ni ingredientes de la partida anterior', () => {
  const a = finishChapter(makeMistake(createGame())); const b = createGame();
  assert.equal(b.growth, 0); assert.equal(b.ingredients.length, 0);
  assert.notStrictEqual(a.ingredients, b.ingredients);
});

test('las sumas tienen tres opciones distintas y una respuesta correcta dentro de 20', () => {
  for (let i = 0; i < 100; i++) {
    const math = makeMath();
    assert.equal(math.answer, math.a + math.b); assert.ok(math.answer <= 20);
    assert.equal(math.options.length, 3); assert.equal(new Set(math.options).size, 3);
    assert.ok(math.options.includes(math.answer));
  }
});

test('ambas reglas del camino se pueden deducir de cada pareja de números', () => {
  for (const random of [() => 0.2, () => 0.8]) {
    const pattern = makePattern(random);
    for (let i = 1; i < pattern.values.length; i++) assert.equal(pattern.values[i] - pattern.values[i - 1], pattern.step);
    assert.equal(pattern.answer, pattern.values.at(-1) + pattern.step);
    assert.equal(new Set(pattern.options).size, 3); assert.ok(pattern.options.includes(pattern.answer));
  }
});

test('el jardín de memoria siempre contiene exactamente tres parejas identificables', () => {
  for (let i = 0; i < 30; i++) {
    const cards = makeMemory(); const symbols = new Set(cards.map(card => card.symbol));
    assert.equal(cards.length, 6); assert.equal(symbols.size, 3);
    assert.equal(new Set(cards.map(card => card.id)).size, 6);
    for (const symbol of symbols) assert.equal(cards.filter(card => card.symbol === symbol).length, 2);
    cards.forEach((card, index) => assert.equal(card.id, index));
  }
});

test('la receta requiere la longitud y el orden exactos', () => {
  const recipe = ['sun', 'drop', 'leaf', 'star'];
  assert.ok(checkRecipe([...recipe], recipe));
  assert.ok(!checkRecipe(['drop', 'sun', 'leaf', 'star'], recipe));
  assert.ok(!checkRecipe(recipe.slice(0, 3), recipe));
  assert.ok(!checkRecipe([...recipe, 'sun'], recipe));
});

test('mezclar conserva todos los elementos y no modifica el original', () => {
  const original = ['a', 'b', 'c', 'd']; const result = shuffle(original, () => 0);
  assert.deepEqual(original, ['a', 'b', 'c', 'd']);
  assert.deepEqual([...result].sort(), [...original].sort());
  assert.notDeepEqual(result, original);
});

test('los mensajes cubren cada estirón y todas las preguntas tienen una solución única', () => {
  assert.equal(GROWTH_MESSAGES.length, MAX_GROWTH + 1);
  for (const question of CARE_QUESTIONS) {
    assert.equal(question.options.filter(option => option === question.answer).length, 1);
    assert.ok(question.hint.length > 0); assert.ok(question.explanation.length > 0);
  }
});
