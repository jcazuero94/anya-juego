import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Companion,fetchSpot} from '../docs/companion.js';
import {createGame,completeQuest,QUESTS,ZONES,SPAWN,scoreRun,cakeProfile,bakeCake,winGame,readSave,collectTreasure} from '../docs/logic.js';
import {findPath,isBlocked,distance,safePosition,KITCHEN} from '../docs/map.js';
const active=()=>({...createGame(71),clockStarted:true});
function minimum(){let s=active();for(const q of QUESTS.filter(q=>q.level===0||q.level===1&&ZONES[q.zone].ingredient<3))s=completeQuest(s,q.id);return s;}
function all(){let s=active();for(const q of QUESTS)s=completeQuest(s,q.id);return s;}
function runDog(dog,owner,limit=1600){const events=[];for(let i=0;i<limit;i++){const event=dog.update(.04,owner);if(event)events.push(event);assert.ok(!isBlocked(dog.position.x,dog.position.y),'Pandora atravesó un obstáculo');if(!dog.job)break;}return events;}
function advanceOwner(owner,path){if(!path.length)return;const p=path[0],d=distance(owner,p),step=225*.04;if(d<=step+1){Object.assign(owner,p);path.shift();}else{owner.x+=(p.x-owner.x)/d*step;owner.y+=(p.y-owner.y)/d*step;}}

test('Pandora lanza, persigue y devuelve la pelota cerca de Anya una sola vez',()=>{
  for(const owner of [SPAWN,...ZONES])for(const facing of [-1,1]){
    const dog=new Companion(safePosition({x:owner.x-45,y:owner.y+24}));dog.fetch(owner,facing);assert.equal(dog.ball.phase,'flying');const states=new Set();const events=[];
    for(let i=0;i<1600&&dog.job;i++){states.add(dog.ball?.phase);const event=dog.update(.04,owner);if(event)events.push(event);assert.ok(!isBlocked(dog.position.x,dog.position.y));}
    assert.deepEqual([...states].sort(),['carried','flying','ground']);assert.deepEqual(events,['fetch']);assert.equal(dog.ball,null);assert.equal(dog.job,null);assert.ok(distance(dog.position,owner)<66);assert.equal(dog.update(.04,owner),null);
  }
});
test('la pelota siempre cae en un claro alcanzable, incluso junto al estanque y la casa',()=>{
  for(const owner of [SPAWN,{x:152,y:430},{x:1380,y:620},{x:1750,y:400},...ZONES])for(const dir of [-1,1]){const spot=fetchSpot(owner,dir);assert.ok(!isBlocked(spot.x,spot.y,0,12));const route=findPath(owner,spot);assert.ok(route.length);assert.ok(distance(route.at(-1),spot)<13);}
});
test('la devolución sigue a Anya cuando cambia de sitio',()=>{
  const owner={...SPAWN},dog=new Companion({x:owner.x-45,y:owner.y+24});dog.fetch(owner);
  for(let i=0;i<500&&dog.job?.phase!=='return';i++)dog.update(.04,owner);
  assert.equal(dog.job.phase,'return');owner.x-=140;const events=runDog(dog,owner);assert.deepEqual(events,['fetch']);assert.ok(distance(dog.position,owner)<66);
});
test('pausar no mueve la pelota ni a Pandora y cambiar de actividad cancela el juego anterior',()=>{
  const dog=new Companion({x:SPAWN.x-45,y:SPAWN.y+24});dog.fetch(SPAWN);dog.update(.04,SPAWN);const before=JSON.stringify({p:dog.position,b:dog.ball,j:dog.job});for(let i=0;i<30;i++)dog.update(0,SPAWN);assert.equal(JSON.stringify({p:dog.position,b:dog.ball,j:dog.job}),before);
  assert.ok(dog.lead(findPath(SPAWN,ZONES[0]),SPAWN));assert.equal(dog.ball,null);assert.equal(dog.job.type,'guide');
});
test('Pandora guía hasta las ocho estaciones y el horno sin cruzar obstáculos',()=>{
  for(const target of [...ZONES,KITCHEN]){const owner={...SPAWN},path=findPath(owner,target),dog=new Companion(safePosition({x:owner.x-48,y:owner.y+30}));assert.ok(dog.lead(path,owner));let steps=0;while(path.length&&steps++<2000){if(dog.canFollow)advanceOwner(owner,path);dog.update(.04,owner);assert.ok(!isBlocked(owner.x,owner.y));assert.ok(!isBlocked(dog.position.x,dog.position.y));}assert.equal(path.length,0,target.id+' quedó bloqueada');assert.ok(distance(owner,target)<12);dog.cancelGuide();assert.equal(dog.job,null);}
});
test('Pandora vuelve primero si estaba olfateando lejos antes de guiar',()=>{
  const owner={...SPAWN},path=findPath(owner,ZONES[0]),dog=new Companion(safePosition({x:1600,y:1050}));dog.lead(path,owner);assert.equal(dog.canFollow,false);for(let i=0;i<2000&&path.length;i++){if(dog.canFollow)advanceOwner(owner,path);dog.update(.04,owner);}assert.equal(path.length,0);assert.ok(distance(owner,ZONES[0])<12);
});
test('cada ingrediente extra mejora el pastel y conserva la identidad de sus ingredientes',()=>{
  let s=minimum(),previous=cakeProfile(s);assert.equal(previous.count,3);assert.equal(previous.level,0);assert.equal(previous.layers,1);assert.ok(previous.ready);
  for(const q of QUESTS.filter(q=>q.level===1&&ZONES[q.zone].ingredient>=3)){s=completeQuest(s,q.id);const cake=cakeProfile(s);assert.equal(cake.count,previous.count+1);assert.equal(cake.level,previous.level+1);assert.ok(cake.layers>=previous.layers);assert.ok(cake.lift>previous.lift);assert.notEqual(cake.name,previous.name);assert.ok(cake.ids.includes(ZONES[q.zone].ingredient===3?'butter':ZONES[q.zone].ingredient===4?'sugar':ZONES[q.zone].ingredient===5?'vanilla':ZONES[q.zone].ingredient===6?'cacao':'berries'));assert.ok(cake.extras.every(e=>e.detail));previous=cake;}
  assert.equal(previous.layers,3);assert.equal(previous.name,'El gran pastel de Anya');
});
test('el pastel depende del ingrediente concreto, no solo de la cantidad',()=>{
  const s=minimum(),butter=cakeProfile(completeQuest(s,'orchard-1')),berries=cakeProfile(completeQuest(s,'maze-1'));assert.equal(butter.count,berries.count);assert.notDeepEqual(butter.ids,berries.ids);assert.equal(butter.extras[0].detail,'Bizcocho dorado y crema de mantequilla');assert.equal(berries.extras[0].detail,'Fresas frescas para decorar');
});
test('recoger otro ingrediente después de hornear permite producir un pastel mejorado',()=>{const s=bakeCake(minimum());assert.equal(s.cake,'baked');const improved=completeQuest(s,'orchard-1');assert.equal(improved.cake,'unbaked');assert.equal(bakeCake(improved).cake,'baked');assert.equal(cakeProfile(improved).count,4);});
test('el puntaje distingue ingredientes y regalos y llega a cinco mil con todo y el deseo',()=>{
  const minimumScore=scoreRun(winGame(bakeCake(minimum())));assert.equal(minimumScore.total,2250);assert.equal(minimumScore.ingredients,3);assert.equal(minimumScore.gifts,0);assert.equal(minimumScore.wishPoints,1000);
  const full=scoreRun(winGame(bakeCake(all())));assert.equal(full.total,5000);assert.equal(full.total,full.max);assert.equal(full.ingredients,8);assert.equal(full.gifts,8);assert.equal(full.total,full.candlePoints+full.ingredientPoints+full.giftPoints+full.wishPoints);
});
test('perder conserva los puntos recogidos; los secretos no se pueden usar para inflar el puntaje',()=>{
  let s=minimum();const before=scoreRun(s);s=collectTreasure(s,'spark-0');assert.deepEqual(scoreRun(s),before);assert.equal(scoreRun({...all(),status:'lost'}).total,4000);
});
test('los guardados anteriores con contadores de Pandora siguen funcionando',()=>{
  const s=active(),old={...s,pets:3,dogPlays:2,dogTreats:1},restored=readSave(JSON.stringify(old));assert.deepEqual(restored,s);assert.equal('pets' in restored,false);
});
