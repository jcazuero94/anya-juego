import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VERSION, GAME_DURATION, GROWTH_INTERVAL, MAX_GROWTH, INGREDIENTS, QUESTS, ZONES, TREASURES, SPAWN, PlayClock, createGame, rng, shuffle, makeChallenge, generateChallenges, collectedCandles, collectedIngredients, collectedGifts, completeQuest, makeMistake, isUnlocked, collectTreasure, canFinish, nextRequiredQuest, bakeCake, winGame, readSave, advanceTime, remainingTime, formatTime } from '../docs/logic.js';
import { PARTY, KITCHEN, HOUSE, findPath, isBlocked, lineClear, distance, movePosition, safePosition } from '../docs/map.js';
const active=seed=>({...createGame(seed),clockStarted:true});
function minimumMission(seed=1){let s=active(seed);for(const q of QUESTS.filter(q=>q.level===0))s=completeQuest(s,q.id);for(const q of QUESTS.filter(q=>q.level===1&&ZONES[q.zone].ingredient<3))s=completeQuest(s,q.id);return s;}

test('ocho estaciones con tres niveles y ocho ingredientes, tres de ellos necesarios',()=>{
  assert.equal(VERSION,4);assert.equal(GAME_DURATION,600000);assert.equal(GROWTH_INTERVAL,60000);assert.equal(ZONES.length,8);assert.equal(QUESTS.length,24);assert.equal(TREASURES.length,8);assert.equal(INGREDIENTS.length,8);
  assert.deepEqual(INGREDIENTS.filter(i=>i.required).map(i=>i.id),['flour','eggs','milk']);assert.equal(new Set(ZONES.map(z=>z.ingredient)).size,8);
  assert.equal(new Set(QUESTS.map(q=>q.id)).size,24);for(let i=0;i<8;i++)assert.deepEqual(QUESTS.filter(q=>q.zone===i).map(q=>q.level),[0,1,2]);
});
test('la intro no consume tiempo y todas las estaciones están abiertas desde el principio',()=>{
  const s=createGame(48);assert.deepEqual(s.position,SPAWN);assert.equal(s.clockStarted,false);assert.strictEqual(advanceTime(s,GAME_DURATION),s);assert.equal(remainingTime(s),GAME_DURATION);
  for(let zone=0;zone<8;zone++){assert.ok(isUnlocked(s,zone,0));assert.ok(!isUnlocked(s,zone,1));}assert.ok(!isBlocked(s.position.x,s.position.y));assert.strictEqual(completeQuest(s,'meadow-0'),s);
});
test('cada estación exige vela, ingrediente y regalo en ese orden',()=>{
  let s=active(1);assert.strictEqual(completeQuest(s,'meadow-1'),s);assert.strictEqual(completeQuest(s,'meadow-2'),s);
  s=completeQuest(s,'meadow-0');assert.deepEqual(collectedCandles(s),[0]);assert.deepEqual(collectedIngredients(s),[]);assert.ok(isUnlocked(s,0,1));
  s=completeQuest(s,'meadow-1');assert.deepEqual(collectedIngredients(s),[0]);assert.deepEqual(collectedGifts(s),[]);
  s=completeQuest(s,'meadow-2');assert.deepEqual(collectedGifts(s),[0]);assert.equal(s.completed.length,3);
});
test('los premios no se duplican y rechaza destinos inexistentes',()=>{
  const s=completeQuest(active(1),'pond-0');assert.strictEqual(completeQuest(s,'pond-0'),s);assert.strictEqual(completeQuest(s,'fake'),s);assert.equal(s.completed.length,1);
});
test('se puede explorar cualquier estación primero',()=>{
  let s=active(1);s=completeQuest(s,'maze-0');assert.deepEqual(collectedCandles(s),[7]);s=completeQuest(s,'maze-1');assert.deepEqual(collectedIngredients(s),[7]);assert.ok(!canFinish(s));
});
test('ocho velas y harina, huevos y leche son suficientes; no exige regalos ni extras',()=>{
  const s=minimumMission();assert.equal(s.completed.length,11);assert.equal(collectedCandles(s).length,8);assert.deepEqual(collectedIngredients(s),[0,1,2]);assert.deepEqual(collectedGifts(s),[]);assert.ok(canFinish(s));
  assert.equal(s.status,'playing');assert.strictEqual(winGame(s),s);const cake=bakeCake(s);assert.equal(cake.cake,'baked');const won=winGame(cake);assert.equal(won.status,'won');assert.equal(won.candlesBlown,true);assert.equal(won.growth,0);
});
test('ningún ingrediente extra reemplaza los tres básicos y falta una vela impide hornear',()=>{
  const minimum=minimumMission();for(const id of ['meadow-0','pond-1','library-1','maze-0']){const s={...minimum,completed:minimum.completed.filter(q=>q!==id)};assert.ok(!canFinish(s));assert.strictEqual(bakeCake(s),s);}
  let s=active(2);for(const q of QUESTS)s=completeQuest(s,q.id);assert.equal(collectedIngredients(s).length,8);assert.equal(collectedGifts(s).length,8);assert.ok(canFinish(s));
});
test('la guía encuentra siempre un objetivo necesario, abierto y todavía pendiente',()=>{
  let s=active(3);const targets=[];for(let i=0;i<11;i++){const q=nextRequiredQuest(s);assert.ok(q);assert.ok(isUnlocked(s,q.zone,q.level));assert.ok(q.level<2);targets.push(q.id);s=completeQuest(s,q.id);}
  assert.equal(new Set(targets).size,11);assert.equal(nextRequiredQuest(s),null);assert.ok(canFinish(s));assert.equal(targets[0],'meadow-0');assert.equal(targets[1],'meadow-1');
});
test('el reloj da un estirón exactamente cada dos minutos, nunca por errores',()=>{
  let s=active(2);s=advanceTime(s,GROWTH_INTERVAL-1);assert.equal(s.growth,0);s=advanceTime(s,1);assert.equal(s.growth,1);
  const mistake=makeMistake(s);assert.equal(mistake.growth,1);assert.equal(mistake.elapsedMs,s.elapsedMs);assert.equal(mistake.mistakes,1);
  s=advanceTime(mistake,GROWTH_INTERVAL*3);assert.equal(s.growth,4);assert.equal(s.status,'playing');
});
test('a los veinte minutos pierde incluso con todos los materiales o el pastel listo',()=>{
  let s=bakeCake(minimumMission());s=advanceTime(s,GAME_DURATION-1);assert.equal(s.status,'playing');assert.equal(s.growth,9);assert.equal(formatTime(remainingTime(s)),'00:01');
  s=advanceTime(s,1);assert.equal(s.status,'lost');assert.equal(s.growth,MAX_GROWTH);assert.equal(remainingTime(s),0);assert.strictEqual(winGame(s),s);assert.strictEqual(completeQuest(s,'orchard-1'),s);
});
test('saltar varios intervalos no pierde estirones y el tiempo se limita a veinte minutos',()=>{
  const s=advanceTime(active(2),GAME_DURATION*10);assert.equal(s.elapsedMs,GAME_DURATION);assert.equal(s.status,'lost');assert.equal(s.growth,10);
  for(const ms of [0,-500,NaN,Infinity]){const fresh=active(2);assert.strictEqual(advanceTime(fresh,ms),fresh);}
});
test('soplar a tiempo detiene el reloj y no se pueden ganar más premios tras el final',()=>{
  let s=advanceTime(bakeCake(minimumMission()),GAME_DURATION-1);s=winGame(s);assert.equal(s.status,'won');assert.strictEqual(advanceTime(s,10000),s);assert.strictEqual(makeMistake(s),s);assert.strictEqual(completeQuest(s,'orchard-1'),s);
});
test('el reloj cuenta tiempo real entre fotogramas; pausa y reanuda sin sumar el descanso',()=>{
  let now=0,s=active(3);const clock=new PlayClock(ms=>{s=advanceTime(s,ms);},()=>now);
  clock.tick();now=100;clock.start();clock.start();now=2100;clock.tick();assert.equal(s.elapsedMs,2000);
  now=3100;clock.stop();assert.equal(s.elapsedMs,3000);now=300000;clock.tick();assert.equal(s.elapsedMs,3000);
  clock.start();now+=250;clock.tick();assert.equal(s.elapsedMs,3250);now+=GROWTH_INTERVAL;clock.stop();assert.equal(s.growth,1);
});
test('el formato del reloj redondea hacia arriba y no muestra valores negativos',()=>{assert.equal(formatTime(GAME_DURATION),'10:00');assert.equal(formatTime(60001),'01:01');assert.equal(formatTime(1),'00:01');assert.equal(formatTime(-500),'00:00');});
test('la misma semilla conserva los retos y cada partida tiene 24 retos',()=>{
  const a=generateChallenges(58),b=generateChallenges(58);assert.deepEqual(a,b);assert.notDeepEqual(a,generateChallenges(59));assert.equal(Object.keys(a).length,24);
  for(const q of QUESTS){assert.equal(a[q.id].level,q.level+1);assert.ok(a[q.id].hint);assert.ok(a[q.id].explanation);assert.ok(a[q.id].title);}
});
test('los tipos rotan por estación entre partidas, y aparecen los doce minijuegos',()=>{
  const all=new Set();for(let zone=0;zone<8;zone++){const orders=new Set();for(let seed=1;seed<=40;seed++){const d=generateChallenges(seed);const types=QUESTS.filter(q=>q.zone===zone).map(q=>d[q.id].type);assert.equal(new Set(types).size,3);types.forEach(t=>all.add(t));orders.add(types.join());}assert.ok(orders.size>=5);}
  assert.equal(all.size,12);
});
test('dificultad creciente en memoria, secuencias, laberintos, orden y simetría',()=>{
  for(let level=1;level<=3;level++)for(let seed=1;seed<=30;seed++){
    const memory=makeChallenge('memory',rng(seed),0,level);assert.equal(memory.cards.length,(level+2)*2);for(const s of new Set(memory.cards))assert.equal(memory.cards.filter(v=>v===s).length,2);
    assert.equal(makeChallenge('sequence',rng(seed),0,level).recipe.length,level+2);assert.equal(makeChallenge('maze',rng(seed),0,level).width,level+3);assert.equal(makeChallenge('order',rng(seed),0,level).values.length,level+2);assert.equal(makeChallenge('symmetry',rng(seed),0,level).pattern.filter(Boolean).length,level*2);
  }
});
test('las cuentas crecen en dificultad y siempre ofrecen una respuesta correcta única',()=>{
  for(let level=1;level<=3;level++)for(let seed=1;seed<=100;seed++){
    const d=makeChallenge('math',rng(seed),0,level);assert.ok(d.answer>=0&&d.answer<=36);assert.equal(new Set(d.options).size,3);assert.equal(d.options.filter(n=>n===d.answer).length,1);assert.equal(d.answer,d.operation===1?d.a-d.b:d.operation===2?d.a*d.b:d.a+d.b);assert.ok(level===1?d.operation===0:level===2?d.operation<2:d.operation===2);
  }
});
test('patrones fáciles usan dibujos y los siguientes usan reglas numéricas deducibles',()=>{
  for(let level=1;level<=3;level++)for(let seed=1;seed<=60;seed++){const d=makeChallenge('pattern',rng(seed),0,level);if(level===1){assert.ok(d.visual);assert.ok([2,3].some(period=>d.values.every((v,i)=>v===d.values[i%period])&&d.answer===d.values[d.values.length%period]));}else{assert.ok(!d.visual);assert.equal(d.answer,d.values.at(-1)+d.step);}assert.equal(new Set(d.options).size,3);assert.ok(d.options.includes(d.answer));}
});
test('observación, balanza, orden y simetría calculan respuestas sin ambigüedad',()=>{
  for(let seed=0;seed<60;seed++)for(let level=1;level<=3;level++){
    const d=makeChallenge('observe',rng(seed),0,level);assert.equal(d.items.filter(v=>v===d.target).length,d.answer);
    const o=makeChallenge('order',rng(seed),0,level);assert.equal(new Set(o.values).size,level+2);assert.deepEqual([...o.values].sort((a,b)=>o.descending?b-a:a-b),o.answer);
    const b=makeChallenge('balance',rng(seed),0,level);assert.equal(b.answer,b.a+b.b<b.c?'<':b.a+b.b>b.c?'>':'=');
    const m=makeChallenge('symmetry',rng(seed),0,level);for(let row=0;row<3;row++)assert.deepEqual(m.answer.slice(row*3,row*3+3),m.pattern.slice(row*3,row*3+3).reverse());
  }
});
test('cientos de laberintos de los tres niveles tienen una ruta continua sin setos',()=>{
  for(let level=1;level<=3;level++)for(let seed=0;seed<100;seed++){const d=makeChallenge('maze',rng(seed),0,level);assert.equal(d.solution[0],0);assert.equal(d.solution.at(-1),d.width*d.height-1);d.solution.forEach((cell,i)=>{assert.ok(!d.blocked[cell]);if(i){const prev=d.solution[i-1];assert.equal(Math.abs(cell%d.width-prev%d.width)+Math.abs(Math.floor(cell/d.width)-Math.floor(prev/d.width)),1);}});}
});
test('palabras de longitud gradual se forman con las fichas, incluyendo tildes y letras repetidas',()=>{
  for(let level=1;level<=3;level++)for(let i=0;i<30;i++){const d=makeChallenge('word',rng(i),i,level);assert.deepEqual([...d.word].sort(),[...d.letters].sort());assert.ok(level===1?d.word.length<=5:level===2?d.word.length>=5&&d.word.length<=6:d.word.length>=6);}
});
test('lectura y acertijos tienen respuesta única; canciones solo usan símbolos disponibles',()=>{
  for(const type of ['care','riddle'])for(let i=0;i<12;i++){const d=makeChallenge(type,rng(i),i);assert.equal(d.options.filter(s=>s===d.answer).length,1);assert.ok(d.hint&&d.explanation);}
  for(let i=0;i<30;i++){const d=makeChallenge('sequence',rng(i),i,3);assert.ok(d.recipe.every(s=>d.pool.includes(s)));}
});
test('los secretos no se duplican ni alteran el tiempo o el crecimiento',()=>{
  let s=advanceTime(active(4),GROWTH_INTERVAL*2);for(const t of TREASURES)s=collectTreasure(s,t.id);assert.equal(s.treasures.length,8);assert.equal(s.growth,2);assert.equal(s.elapsedMs,GROWTH_INTERVAL*2);assert.strictEqual(collectTreasure(s,'fake'),s);assert.strictEqual(collectTreasure(s,'spark-0'),s);
});
test('el guardado conserva tiempo, semilla, premios y pastel sin contar el tiempo fuera del juego',()=>{
  let s=advanceTime(bakeCake(minimumMission()),123456);s=collectTreasure(s,'spark-2');s.position={x:480,y:1000};s.visited=[0,2];s.mistakes=2;
  const copy=readSave(JSON.stringify(s));assert.deepEqual(copy,s);assert.deepEqual(generateChallenges(copy.seed),generateChallenges(s.seed));
});
test('guardado final de victoria y derrota recupera el resultado correcto',()=>{
  const won=winGame(bakeCake(minimumMission()));assert.deepEqual(readSave(JSON.stringify(won)),won);const lost=advanceTime(active(2),GAME_DURATION);assert.deepEqual(readSave(JSON.stringify(lost)),lost);
});
test('guardados dañados, antiguos, con premios imposibles o desconocidos se rechazan',()=>{
  for(const raw of ['{bad','null',JSON.stringify({...active(1),version:2}),JSON.stringify({...active(1),completed:['fake']}),JSON.stringify({...active(1),completed:['meadow-1']}),JSON.stringify({...active(1),completed:['meadow-0','meadow-2']})])assert.equal(readSave(raw),null);
  const repaired=readSave(JSON.stringify({...active(1),position:{x:-999,y:99999},elapsedMs:999999999,growth:-5}));assert.equal(repaired.status,'lost');assert.equal(repaired.growth,10);assert.ok(repaired.position.x>=60&&repaired.position.y<=1540);
});
test('no se puede recuperar una victoria sin los materiales y el pastel',()=>{const s=readSave(JSON.stringify({...active(1),status:'won',cake:'baked',candlesBlown:true}));assert.equal(s.status,'playing');assert.equal(s.cake,'unbaked');});
test('cada estación, estrella, Alyssia y el horno son accesibles sin cruzar obstáculos',()=>{
  for(const target of [...ZONES,...TREASURES,{...PARTY,id:'talk'},KITCHEN]){const route=findPath(SPAWN,target,9);assert.ok(route.length,`${target.id}: ruta vacía`);assert.ok(distance(route.at(-1),target)<75,`${target.id}: destino inaccesible`);let prev=SPAWN;for(const p of route){assert.ok(lineClear(prev,p,9),`${target.id}: ruta cruza un obstáculo`);prev=p;}}
});
test('el agua, huertos, casa y Alyssia tienen colisiones; crecer no bloquea estaciones',()=>{
  assert.ok(isBlocked(330,430));assert.ok(isBlocked(1850,400));assert.ok(isBlocked(HOUSE.x,HOUSE.y));assert.ok(isBlocked(PARTY.x,PARTY.y));
  for(let growth=0;growth<=10;growth++)for(const z of ZONES)assert.ok(!isBlocked(z.x,z.y,growth),z.id);
  const pos={x:152,y:430};assert.ok(!isBlocked(pos.x,pos.y));assert.deepEqual(movePosition(pos,1,0,.04),pos);
});
test('caminar en diagonal no acelera, y los fotogramas largos no atraviesan obstáculos',()=>{
  const s=SPAWN,straight=movePosition(s,1,0,.04),diagonal=movePosition(s,1,1,.04);assert.ok(Math.abs(distance(s,straight)-distance(s,diagonal))<.001);assert.deepEqual(movePosition(s,1,0,10),straight);assert.deepEqual(movePosition(s,1,0,.04,9),straight);
});
test('una posición guardada dentro de un obstáculo se reubica en un claro seguro',()=>{for(const p of [{x:330,y:430},HOUSE,PARTY]){const safe=safePosition(p,9);assert.ok(!isBlocked(safe.x,safe.y,9));}});
test('barajar nunca modifica las colecciones originales',()=>{const a=[1,2,3,4];shuffle(a,()=>0);assert.deepEqual(a,[1,2,3,4]);});
