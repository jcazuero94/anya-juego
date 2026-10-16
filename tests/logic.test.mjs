import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VERSION, MAX_GROWTH, QUESTS, ZONES, TREASURES, SPAWN, createGame, rng, shuffle, makeChallenge, generateChallenges, collectedIngredients, completeQuest, makeMistake, isUnlocked, collectTreasure, soothe, restoreCheckpoint, winGame, readSave } from '../docs/logic.js';
import { PARTY, CAULDRON, findPath, isBlocked, lineClear, distance, movePosition, safePosition } from '../docs/map.js';

test('el jardín tiene seis zonas, 18 retos y ocho secretos únicos',()=>{
  assert.equal(ZONES.length,6);assert.equal(QUESTS.length,18);assert.equal(TREASURES.length,8);
  assert.equal(new Set(QUESTS.map(q=>q.id)).size,18);
  assert.equal(new Set(QUESTS.map(q=>q.type)).size,12);
  for(let zone=0;zone<6;zone++)assert.equal(QUESTS.filter(q=>q.zone===zone).length,3);
});
test('una aventura empieza en un claro libre con las primeras dos zonas abiertas',()=>{
  const state=createGame(48);assert.equal(state.version,VERSION);assert.equal(state.seed,48);assert.deepEqual(state.position,SPAWN);
  assert.ok(!isBlocked(state.position.x,state.position.y));assert.deepEqual(collectedIngredients(state),[]);
  assert.equal(isUnlocked(state,0),true);assert.equal(isUnlocked(state,1),true);assert.equal(isUnlocked(state,2),false);
});
test('no se completan retos desconocidos, repetidos ni de zonas cerradas',()=>{
  const state=createGame(1);assert.strictEqual(completeQuest(state,'nothing'),state);assert.strictEqual(completeQuest(state,'hill-0'),state);
  const next=completeQuest(state,'meadow-0');assert.deepEqual(state.completed,[]);assert.strictEqual(completeQuest(next,'meadow-0'),next);
});
test('cada zona necesita sus tres retos; el ingrediente abre un rincón y reduce un estirón',()=>{
  let state=makeMistake(makeMistake(createGame(1)));
  state=completeQuest(state,'meadow-2');state=completeQuest(state,'meadow-0');assert.equal(collectedIngredients(state).length,0);
  state=completeQuest(state,'meadow-1');assert.deepEqual(collectedIngredients(state),[0]);assert.equal(state.growth,1);
  assert.ok(isUnlocked(state,2));assert.ok(!isUnlocked(state,3));assert.deepEqual(state.checkpoint,state.completed);
});
test('las zonas se pueden completar en un orden elegido por la exploradora',()=>{
  let state=createGame(1);for(const q of QUESTS.filter(q=>q.zone===1))state=completeQuest(state,q.id);
  assert.deepEqual(collectedIngredients(state),[1]);assert.ok(isUnlocked(state,2));
  for(const q of QUESTS.filter(q=>q.zone===2))state=completeQuest(state,q.id);
  assert.deepEqual(collectedIngredients(state),[1,2]);assert.ok(isUnlocked(state,3));assert.ok(!state.completed.includes('meadow-0'));
});
test('18 retos resueltos habilitan la receta; solo la receta termina la aventura',()=>{
  let state=createGame(5);assert.strictEqual(winGame(state),state);
  for(const q of QUESTS)state=completeQuest(state,q.id);
  assert.equal(state.completed.length,18);assert.equal(state.status,'playing');assert.equal(collectedIngredients(state).length,6);
  state=winGame(state);assert.equal(state.status,'won');assert.equal(state.growth,0);assert.strictEqual(makeMistake(state),state);
});
test('el noveno error termina la partida y los estados finales no aceptan más retos',()=>{
  let state=createGame(5);for(let i=0;i<MAX_GROWTH;i++)state=makeMistake(state);
  assert.equal(state.status,'lost');assert.equal(state.growth,9);assert.equal(state.mistakes,9);
  assert.strictEqual(makeMistake(state),state);assert.strictEqual(completeQuest(state,'meadow-0'),state);assert.strictEqual(winGame(state),state);
});
test('un campamento conserva ingredientes y secretos y descarta solo los retos posteriores',()=>{
  let state=createGame(1);for(const q of QUESTS.slice(0,3))state=completeQuest(state,q.id);
  state=collectTreasure(state,'spark-0');state=completeQuest(state,'pond-0');const restored=restoreCheckpoint({...state,status:'lost',growth:9});
  assert.equal(restored.completed.length,3);assert.equal(restored.treasures.length,1);assert.equal(restored.growth,1);assert.equal(restored.status,'playing');assert.deepEqual(collectedIngredients(restored),[0]);
});
test('las estrellas no se duplican y tres calman exactamente dos estirones',()=>{
  let state=makeMistake(makeMistake(makeMistake(createGame(1))));
  assert.strictEqual(collectTreasure(state,'fake'),state);assert.strictEqual(soothe(state),state);
  for(const t of TREASURES.slice(0,3))state=collectTreasure(state,t.id);
  assert.strictEqual(collectTreasure(state,'spark-0'),state);const healed=soothe(state);
  assert.equal(healed.growth,1);assert.equal(healed.spent,3);assert.equal(healed.treasures.length,3);assert.strictEqual(soothe(healed),healed);
});
test('la misma semilla conserva cada reto al volver a abrir la aventura',()=>{
  assert.deepEqual(generateChallenges(58),generateChallenges(58));assert.notDeepEqual(generateChallenges(58),generateChallenges(59));
  const data=generateChallenges(58);assert.equal(Object.keys(data).length,19);assert.equal(data.final.recipe.length,6);
  assert.notEqual(data['library-0'].word,data['hill-2'].word);assert.notEqual(data['pond-1'].question,data['butterflies-2'].question);
});
test('distintas partidas generan números, palabras, dibujos y recetas variadas',()=>{
  const words=new Set(),math=new Set(),recipes=new Set(),mazes=new Set();
  for(let seed=1;seed<=100;seed++){const data=generateChallenges(seed);words.add(data['library-0'].word);math.add(JSON.stringify(data['meadow-0']));recipes.add(data.final.recipe.join());mazes.add(data['hill-1'].blocked.join());}
  assert.ok(words.size>=18);assert.ok(math.size>70);assert.ok(recipes.size>80);assert.ok(mazes.size>90);
});
test('las cuentas nunca son negativas y ofrecen una sola respuesta correcta',()=>{
  const operations=new Set();for(let seed=1;seed<=150;seed++){const d=makeChallenge('math',rng(seed));operations.add(d.operation);assert.ok(d.answer>=0&&d.answer<=20);assert.equal(new Set(d.options).size,3);assert.equal(d.options.filter(n=>n===d.answer).length,1);assert.equal(d.answer,d.operation===1?d.a-d.b:d.operation===2?d.a*d.b:d.a+d.b);}
  assert.equal(operations.size,3);
});
test('los patrones numéricos y visuales siguen reglas deducibles',()=>{
  let visual=0,numeric=0;for(let seed=0;seed<120;seed++){const d=makeChallenge('pattern',rng(seed));if(d.visual){visual++;assert.ok([2,3].some(period=>d.values.every((v,i)=>v===d.values[i%period])&&d.answer===d.values[d.values.length%period]));}else{numeric++;assert.equal(d.answer,d.values.at(-1)+d.step);assert.ok(d.values.every((v,i)=>v===d.values[0]+d.step*i));}assert.equal(new Set(d.options).size,3);assert.ok(d.options.includes(d.answer));}
  assert.ok(visual>20&&numeric>20);
});
test('las cartas contienen tres o cuatro parejas exactas',()=>{
  for(let i=0;i<60;i++){const d=makeChallenge('memory',rng(i));assert.ok([6,8].includes(d.cards.length));for(const s of new Set(d.cards))assert.equal(d.cards.filter(v=>v===s).length,2);}
});
test('la observación cuenta solo el símbolo elegido y el orden usa números distintos',()=>{
  for(let i=0;i<60;i++){const d=makeChallenge('observe',rng(i));assert.equal(d.items.filter(v=>v===d.target).length,d.answer);const order=makeChallenge('order',rng(i));assert.equal(new Set(order.values).size,4);assert.deepEqual([...order.values].sort((a,b)=>order.descending?b-a:a-b),order.answer);}
});
test('las balanzas tienen comparadores correctos y la simetría refleja cada fila',()=>{
  for(let i=0;i<60;i++){const d=makeChallenge('balance',rng(i));assert.equal(d.answer,d.a+d.b<d.c?'<':d.a+d.b>d.c?'>':'=');const s=makeChallenge('symmetry',rng(i));for(let row=0;row<3;row++)assert.deepEqual(s.answer.slice(row*3,row*3+3),s.pattern.slice(row*3,row*3+3).reverse());assert.ok(s.pattern.some(Boolean));}
});
test('cada laberinto tiene una ruta que no atraviesa setos ni salta casillas',()=>{
  for(let seed=0;seed<100;seed++){const d=makeChallenge('maze',rng(seed));assert.equal(d.solution[0],0);assert.equal(d.solution.at(-1),d.width*d.height-1);assert.ok(d.solution.length>=d.width+d.height-1);d.solution.forEach((cell,i)=>{assert.ok(!d.blocked[cell]);if(i){const prev=d.solution[i-1];assert.equal(Math.abs(cell%d.width-prev%d.width)+Math.abs(Math.floor(cell/d.width)-Math.floor(prev/d.width)),1);}});}
});
test('las palabras se forman exactamente con sus fichas, incluidas letras repetidas',()=>{
  for(let i=0;i<20;i++){const d=makeChallenge('word',rng(i),i);assert.deepEqual([...d.word].sort(),[...d.letters].sort());assert.ok(d.word.length>=4&&d.word.length<=7);}
});
test('las preguntas de lectura tienen una respuesta única y todas llevan pista',()=>{
  for(const type of ['care','riddle'])for(let i=0;i<12;i++){const d=makeChallenge(type,rng(i),i);assert.equal(d.options.filter(s=>s===d.answer).length,1);assert.ok(d.hint&&d.explanation);}
});
test('recetas y canciones varían y sus símbolos están disponibles en los botones',()=>{
  for(const type of ['recipe','sequence'])for(let i=0;i<60;i++){const d=makeChallenge(type,rng(i));assert.ok(d.recipe.every(s=>d.pool.includes(s)));if(type==='recipe')assert.equal(new Set(d.recipe).size,6);else assert.ok(d.recipe.length>=3&&d.recipe.length<=5);}
});
test('el guardado recupera la semilla, la posición y los avances sin depender del DOM',()=>{
  let state=createGame(24);state=completeQuest(state,'meadow-0');state=collectTreasure(state,'spark-2');state.position={x:480,y:1000};const copy=readSave(JSON.stringify(state));assert.deepEqual(copy,state);assert.deepEqual(generateChallenges(copy.seed),generateChallenges(state.seed));
});
test('los guardados dañados, de otra versión o con retos desconocidos se ignoran',()=>{
  assert.equal(readSave('{bad'),null);assert.equal(readSave('null'),null);assert.equal(readSave(JSON.stringify({...createGame(1),version:1})),null);assert.equal(readSave(JSON.stringify({...createGame(1),completed:['fake']})),null);
  const valid=readSave(JSON.stringify({...createGame(1),position:{x:-999,y:99999},growth:999,spent:-3}));assert.equal(valid.status,'lost');assert.ok(valid.position.x>=60&&valid.position.y<=1540);assert.equal(valid.spent,0);
});
test('todos los destinos son accesibles con cada tamaño de Alessandro',()=>{
  for(let growth=0;growth<MAX_GROWTH;growth++)for(const target of [...QUESTS,...TREASURES,CAULDRON]){const route=findPath(SPAWN,target,growth);assert.ok(route.length,`${target.id}, estirón ${growth}`);assert.ok(distance(route.at(-1),target)<75);let prev=SPAWN;for(const p of route){assert.ok(lineClear(prev,p,growth),`${target.id}: ruta cruza obstáculo`);prev=p;}}
});
test('el estanque, los huertos y Alessandro tienen colisiones reales',()=>{
  assert.ok(isBlocked(330,430));assert.ok(isBlocked(1850,400));assert.ok(isBlocked(PARTY.x,PARTY.y));
  assert.ok(!isBlocked(PARTY.x+110,PARTY.y,0));assert.ok(isBlocked(PARTY.x+110,PARTY.y,8));
  const pos={x:152,y:430};assert.ok(!isBlocked(pos.x,pos.y));const next=movePosition(pos,1,0,.04);assert.deepEqual(next,pos);
});
test('caminar diagonalmente no da ventaja y el tiempo de un fotograma está limitado',()=>{
  const start={x:660,y:1150},straight=movePosition(start,1,0,.04),diagonal=movePosition(start,1,1,.04);
  assert.ok(Math.abs(distance(start,straight)-distance(start,diagonal))<.001);assert.deepEqual(movePosition(start,1,0,10),straight);assert.ok(distance(start,movePosition(start,1,0,.04,8))<distance(start,straight));
});
test('un guardado dentro de un obstáculo encuentra un punto seguro',()=>{const point=safePosition({x:330,y:430},5);assert.ok(!isBlocked(point.x,point.y,5));});
test('la mezcla no modifica la colección original',()=>{const values=[1,2,3,4];assert.notDeepEqual(shuffle(values,()=>0),values);assert.deepEqual(values,[1,2,3,4]);});
