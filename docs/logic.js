import { WORDS, CARE, RIDDLES, CARE_MEDIUM, CARE_HARD, RIDDLES_HARD } from './questions.js?v=3';

export const VERSION=3;
export const GAME_DURATION=20*60*1000;
export const GROWTH_INTERVAL=2*60*1000;
export const MAX_GROWTH=10;
export const WORLD_SIZE={width:2400,height:1600};
export const SPAWN={x:1060,y:1000};
export const INGREDIENTS=[
  {id:'flour',name:'Harina',required:true,icon:'flour'},
  {id:'eggs',name:'Huevos',required:true,icon:'eggs'},
  {id:'milk',name:'Leche',required:true,icon:'milk'},
  {id:'butter',name:'Mantequilla',icon:'butter'},
  {id:'sugar',name:'Azúcar',icon:'sugar'},
  {id:'vanilla',name:'Vainilla',icon:'vanilla'},
  {id:'cacao',name:'Cacao',icon:'cacao'},
  {id:'berries',name:'Fresas',icon:'berries'}
];
export const ZONES=[
  {id:'meadow',name:'Pradera de las sumas',short:'Pradera',color:'#c8d89c',icon:'sun',x:320,y:1070,ingredient:0,types:['math','order','balance'],gift:'Una cometa de soles'},
  {id:'pond',name:'Estanque de los reflejos',short:'Estanque',color:'#a5cbd0',icon:'drop',x:510,y:350,ingredient:1,types:['observe','memory','sequence'],gift:'Un barquito de papel'},
  {id:'library',name:'Biblioteca del roble',short:'Biblioteca',color:'#cdbca0',icon:'leaf',x:1030,y:330,ingredient:2,types:['word','riddle','pattern'],gift:'Un libro de aventuras'},
  {id:'orchard',name:'Huerto de las cuentas',short:'Huerto',color:'#d8bc8f',icon:'heart',x:1810,y:260,ingredient:3,types:['balance','math','order'],gift:'Una maceta de girasoles'},
  {id:'butterflies',name:'Jardín de las mariposas',short:'Mariposas',color:'#d6b3be',icon:'flower',x:2070,y:1110,ingredient:4,types:['symmetry','observe','memory'],gift:'Unas alas de colores'},
  {id:'hill',name:'Colina de las estrellas',short:'Colina',color:'#b9b5d0',icon:'star',x:1280,y:1410,ingredient:5,types:['pattern','maze','sequence'],gift:'Un telescopio de bolsillo'},
  {id:'music',name:'Claro de las canciones',short:'Canciones',color:'#c6d2b5',icon:'music',x:480,y:1430,ingredient:6,types:['sequence','memory','riddle'],gift:'Un tambor de lunares'},
  {id:'maze',name:'Sendero de los secretos',short:'Sendero',color:'#c9c3a0',icon:'book',x:2100,y:730,ingredient:7,types:['maze','word','care'],gift:'Una lupa de exploradora'}
];
export const LEVEL_NAMES=['Vela · fácil','Ingrediente · medio','Regalo · difícil'];
export const PUZZLE_NAMES={math:'El picnic de las sumas',order:'Macetas en fila',balance:'La balanza curiosa',observe:'Un jardín de detalles',memory:'Parejas escondidas',sequence:'La canción del jardín',word:'La palabra perdida',riddle:'El libro de los acertijos',pattern:'El camino saltarín',symmetry:'Las alas del espejo',maze:'El laberinto de semillas',care:'Una decisión con cariño'};
export const QUESTS=ZONES.flatMap((z,zone)=>[0,1,2].map(level=>({id:`${z.id}-${level}`,zone,level,x:z.x,y:z.y,title:LEVEL_NAMES[level]})));
export const TREASURES=[
  {id:'spark-0',x:730,y:1370,name:'La estrella viajera',text:'Hasta el camino más pequeño puede esconder una sorpresa.'},
  {id:'spark-1',x:170,y:710,name:'El secreto del estanque',text:'Cuando escuchamos con calma, el jardín nos cuenta cosas.'},
  {id:'spark-2',x:760,y:210,name:'Una hoja con historia',text:'Cada persona tiene una historia que merece ser escuchada.'},
  {id:'spark-3',x:1570,y:110,name:'El deseo del roble',text:'Aprender algo nuevo es otra manera de crecer.'},
  {id:'spark-4',x:2250,y:850,name:'El tesoro del huerto',text:'Cuidar juntos hace más bonito nuestro mundo.'},
  {id:'spark-5',x:1800,y:1440,name:'Una mariposa de papel',text:'Las mejores aventuras dejan espacio para la imaginación.'},
  {id:'spark-6',x:780,y:750,name:'El collar de Pandora',text:'Una buena compañera hace más alegre el camino.'},
  {id:'spark-7',x:1530,y:830,name:'La estrella de los ocho',text:'¡Ocho años y mil aventuras por venir!'}
];
export const GROWTH_MESSAGES=[
  'Alessandro espera dentro de casa. ¡Hay un deseo que preparar!',
  '¡Primer estirón! Sus zapatillas ya asoman bajo la mesa.',
  'Ahora alcanza el estante de las galletas sin ponerse de puntillas.',
  '¡La lámpara le hace cosquillas en el pelo!',
  'Alessandro se agacha para mirar por la ventana.',
  'La casa empieza a crujir. ¡Ya pasó la mitad del tiempo!',
  '¡El sombrero de Alessandro roza el techo!',
  'Las ventanas tiemblan con otro estirón.',
  'El tejado se está levantando. ¡Quedan cuatro minutos!',
  '¡Últimos dos minutos! Alyssia espera junto al horno.',
  '¡CRAC! Alessandro creció tanto que la casa se abrió como una caja.'
];
export function rng(seed) {
  let value=seed>>>0;
  return () => { value+=0x6D2B79F5; let t=Math.imul(value^value>>>15,1|value); t^=t+Math.imul(t^t>>>7,61|t); return ((t^t>>>14)>>>0)/4294967296; };
}
export function shuffle(items,random=Math.random) { const copy=[...items]; for(let i=copy.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; } return copy; }
const integer=(r,a,b)=>a+Math.floor(r()*(b-a+1));
const pick=(items,r)=>items[Math.floor(r()*items.length)];
const numberOptions=(answer,r)=>shuffle([answer,answer+1,answer>1?answer-1:answer+2],r);
const symbols=['sun','leaf','flower','drop','heart','star'];

export function makeChallenge(type,random=Math.random,variant=0,level=1) {
  level=Math.max(1,Math.min(3,level));
  if(type==='math') {
    const operation=level===1?0:level===2?integer(random,0,1):2; let a=integer(random,level===1?1:5,level===1?7:15),b=integer(random,1,level===1?5:9);
    if(operation===1&&a<b) [a,b]=[b,a];
    if(operation===2) { a=integer(random,2,6); b=integer(random,2,6); }
    const answer=operation===1?a-b:operation===2?a*b:a+b;
    return { type,a,b,operation,answer,options:numberOptions(answer,random),hint:operation===1?`Empieza en ${a} y cuenta ${b} pasos hacia atrás.`:operation===2?`Cuenta ${a} grupos de ${b}. Puedes sumar ${Array(a).fill(b).join(' + ')}.`:`Empieza en ${a} y cuenta ${b} más.`,explanation:`${a} ${operation===1?'−':operation===2?'×':'+'} ${b} = ${answer}. ¡Cada paso cuenta!` };
  }
  if(type==='pattern') {
    if(level===1) {
      const pair=shuffle(symbols,random).slice(0,2),block=random()<.5?[pair[0],pair[1]]:[pair[0],pair[0],pair[1]];
      const values=Array.from({length:5},(_,i)=>block[i%block.length]),answer=block[5%block.length];
      return { type,visual:true,values,answer,options:shuffle([pair[0],pair[1],symbols.find(s=>!pair.includes(s))],random),hint:`Busca el grupo que se repite: ${block.map(s=>({sun:'sol',leaf:'hoja',flower:'flor',drop:'gota',heart:'corazón',star:'estrella'})[s]).join(', ')}.`,explanation:'¡Encontraste el grupo que se repite! Así descubrimos un patrón.' };
    }
    const step=pick(level===2?[2,3]:[4,5,-3],random),start=step<0?integer(random,18,30):integer(random,1,6);
    const values=Array.from({length:4},(_,i)=>start+step*i),answer=start+step*4;
    return { type,values,step,answer,options:numberOptions(answer,random),hint:`En cada salto ${step<0?'restas':'sumas'} ${Math.abs(step)}.`,explanation:`La regla era ${step<0?'restar':'sumar'} ${Math.abs(step)}. ¡Una ruta nueva!` };
  }
  if(type==='memory') { const pairs=level+2,chosen=shuffle(symbols,random).slice(0,pairs); return { type,cards:shuffle([...chosen,...chosen],random),hint:'Mira con calma. Puedes volver a pedirme que te enseñe las cartas.',explanation:'Recordaste dónde estaba cada pareja. ¡Observar con atención hace magia!' }; }
  if(type==='word') { const bank=WORDS.filter(([word])=>level===1?word.length<=5:level===2?word.length>=5&&word.length<=6:word.length>=6); const [word,clue]=bank[variant%bank.length]; return { type,word,clue,letters:shuffle([...word],random),hint:`La palabra es ${word.split('').join(' - ')}. Busca las letras de una en una.`,explanation:`${word}. Las palabras también son semillas de nuevas historias.` }; }
  if(type==='care'||type==='riddle') { const bank=type==='care'?(level===1?CARE:level===2?CARE_MEDIUM:CARE_HARD):(level===3?RIDDLES_HARD:RIDDLES); const [question,options,hint,explanation]=bank[variant%bank.length]; return { type,question,answer:options[0],options:shuffle(options,random),hint,explanation }; }
  if(type==='observe') { const target=pick(symbols,random),count=integer(random,level+2,level*3+3),others=symbols.filter(s=>s!==target); return { type,target,items:shuffle([...Array(count).fill(target),...Array.from({length:integer(random,level*3+2,level*4+4)},()=>pick(others,random))],random),answer:count,options:numberOptions(count,random),hint:'Busca solo el dibujo de la pregunta. Cuenta por filas y deja los demás para después.',explanation:'Separar los detalles importantes nos ayuda a observar y a pensar.' }; }
  if(type==='order') { const values=shuffle(Array.from({length:level*15},(_,i)=>i+2),random).slice(0,level+2),descending=level>1&&random()<.5; return { type,values,descending,answer:[...values].sort((a,b)=>descending?b-a:a-b),hint:`Empieza por el número más ${descending?'grande':'pequeño'} y continúa uno por uno.`,explanation:'¡Todo en su lugar! Comparar nos ayuda a poner las ideas en orden.' }; }
  if(type==='balance') { const a=integer(random,1,level*5),b=integer(random,1,level*4),c=a+b+pick([-2,0,2],random),answer=a+b<c?'<':a+b>c?'>':'='; return { type,a,b,c,answer,options:shuffle(['<','=','>'],random),hint:`Primero suma ${a} + ${b}. Compara el resultado con ${c}. La parte abierta mira al número mayor.`,explanation:`${a} + ${b} ${a+b<c?'es menor que':a+b>c?'es mayor que':'es igual a'} ${c}. ¡Encontraste el equilibrio!` }; }
  if(type==='sequence'||type==='recipe') { const length=type==='recipe'?6:level+2,pool=type==='recipe'?symbols:shuffle(symbols,random).slice(0,4),recipe=type==='recipe'?shuffle(symbols,random):Array.from({length},()=>pick(pool,random)); return { type,recipe,pool,hint:'Puedes mirar la secuencia todas las veces que quieras. Divídela en grupos pequeños para recordarla.',explanation:'Recordaste la canción del jardín. ¡Una nota más para tu aventura!' }; }
  if(type==='symmetry') { const chosen=new Set(shuffle(Array.from({length:9},(_,i)=>i),random).slice(0,level*2)); const pattern=Array.from({length:9},(_,i)=>chosen.has(i)); return { type,pattern,answer:pattern.map((_,i)=>pattern[Math.floor(i/3)*3+2-i%3]),hint:'Imagina un espejo en el centro. Los cuadros que tocan el centro en un lado también lo tocan en el otro.',explanation:'¡Las dos alas se miran en el espejo! Descubriste la simetría.' }; }
  if(type==='maze') {
    const width=level+3,height=level+3; let blocked,solution;
    for(let i=0;i<80;i++) { blocked=Array.from({length:width*height},(_,n)=>n!==0&&n!==width*height-1&&random()<.12+level*.05); solution=mazePath(blocked,width,0,width*height-1); if(solution.length>=width+height-1)break; }
    if(!solution?.length) { blocked.fill(false); solution=mazePath(blocked,width,0,width*height-1); }
    return { type,width,height,blocked,solution,hint:'Lleva la semilla hasta la estrella. Los setos no se pueden cruzar. Busca los espacios claros.',explanation:'¡Encontraste una ruta! Observar y cambiar de idea también es aprender.' };
  }
  throw new Error(`Tipo de reto desconocido: ${type}`);
}
export function mazePath(blocked,width,start,end) {
  const queue=[start],previous=new Map([[start,null]]);
  for(let i=0;i<queue.length;i++) { const cell=queue[i]; if(cell===end)break; for(const next of [cell-width,cell+width,...(cell%width?[cell-1]:[]),...(cell%width<width-1?[cell+1]:[])]) { if(next<0||next>=blocked.length||blocked[next]||previous.has(next))continue; previous.set(next,cell); queue.push(next); } }
  if(!previous.has(end))return []; const path=[]; for(let cell=end;cell!==null;cell=previous.get(cell))path.unshift(cell); return path;
}
export function generateChallenges(seed) {
  const random=rng(seed),offsets={word:integer(random,0,1000),care:integer(random,0,1000),riddle:integer(random,0,1000)};
  const entries=[];
  for(let zone=0;zone<ZONES.length;zone++) {
    const types=shuffle(ZONES[zone].types,random);
    for(let level=0;level<3;level++) {
      const type=types[level],variant=offsets[type]===undefined?0:offsets[type]++;
      entries.push([`${ZONES[zone].id}-${level}`,{...makeChallenge(type,random,variant,level+1),level:level+1,title:PUZZLE_NAMES[type]}]);
    }
  }
  return Object.fromEntries(entries);
}
export function createGame(seed=Math.floor(Math.random()*0xffffffff)) {
  return {version:VERSION,seed:seed>>>0,status:'playing',elapsedMs:0,clockStarted:false,growth:0,mistakes:0,completed:[],treasures:[],position:{...SPAWN},visited:[],pets:0,cake:'unbaked',candlesBlown:false};
}
export function stationProgress(state,zone) {return QUESTS.filter(q=>q.zone===zone&&state.completed.includes(q.id)).length;}
export function collectedCandles(state) {return QUESTS.filter(q=>q.level===0&&state.completed.includes(q.id)).map(q=>q.zone);}
export function collectedIngredients(state) {return QUESTS.filter(q=>q.level===1&&state.completed.includes(q.id)).map(q=>ZONES[q.zone].ingredient);}
export function collectedGifts(state) {return QUESTS.filter(q=>q.level===2&&state.completed.includes(q.id)).map(q=>q.zone);}
export function canFinish(state) {const ingredients=collectedIngredients(state);return collectedCandles(state).length===8&&INGREDIENTS.every((item,i)=>!item.required||ingredients.includes(i));}
export function isUnlocked(state,zone,level=0) {return !!ZONES[zone]&&(level===0||state.completed.includes(`${ZONES[zone].id}-${level-1}`));}
export function completeQuest(state,id) {
  const q=QUESTS.find(q=>q.id===id);
  return !q||state.status!=='playing'||!state.clockStarted||state.elapsedMs>=GAME_DURATION||!isUnlocked(state,q.zone,q.level)||state.completed.includes(id)?state:{...state,completed:[...state.completed,id]};
}
export function makeMistake(state) {return state.status==='playing'?{...state,mistakes:state.mistakes+1}:state;}
export function advanceTime(state,ms) {
  if(state.status!=='playing'||!state.clockStarted||!Number.isFinite(ms)||ms<=0)return state;
  const elapsedMs=Math.min(GAME_DURATION,state.elapsedMs+ms),growth=Math.floor(elapsedMs/GROWTH_INTERVAL);
  return {...state,elapsedMs,growth,status:elapsedMs>=GAME_DURATION?'lost':'playing'};
}
export function remainingTime(state) {return Math.max(0,GAME_DURATION-state.elapsedMs);}
export function formatTime(ms) {const seconds=Math.ceil(Math.max(0,ms)/1000);return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;}
export function collectTreasure(state,id) {return state.status!=='playing'||state.treasures.includes(id)||!TREASURES.some(t=>t.id===id)?state:{...state,treasures:[...state.treasures,id]};}
export function bakeCake(state) {return state.status==='playing'&&canFinish(state)&&state.elapsedMs<GAME_DURATION?{...state,cake:'baked'}:state;}
export function winGame(state) {return state.status==='playing'&&state.cake==='baked'&&canFinish(state)&&state.elapsedMs<GAME_DURATION?{...state,status:'won',growth:0,candlesBlown:true}:state;}
export function nextRequiredQuest(state) {
  for(const i of [0,1,2])if(!collectedIngredients(state).includes(i)) {
    const zone=ZONES.findIndex(z=>z.ingredient===i);return QUESTS.find(q=>q.zone===zone&&!state.completed.includes(q.id)&&q.level<2);
  }
  return QUESTS.find(q=>q.level===0&&!state.completed.includes(q.id))||null;
}
export function readSave(raw) {
  try {
    const data=JSON.parse(raw);
    if(data?.version!==VERSION||!Number.isInteger(data.seed)||!['playing','lost','won'].includes(data.status)||!Array.isArray(data.completed)||!Array.isArray(data.treasures))return null;
    const ids=new Set(QUESTS.map(q=>q.id));if(data.completed.some(id=>!ids.has(id))||data.treasures.some(id=>!TREASURES.some(t=>t.id===id)))return null;
    const completed=[...new Set(data.completed)];
    if(QUESTS.some(q=>q.level>0&&completed.includes(q.id)&&!completed.includes(`${ZONES[q.zone].id}-${q.level-1}`)))return null;
    const base=createGame(data.seed),elapsedMs=Math.max(0,Math.min(GAME_DURATION,Number(data.elapsedMs)||0));
    const position=Number.isFinite(data.position?.x)&&Number.isFinite(data.position?.y)?{x:Math.max(60,Math.min(2340,data.position.x)),y:Math.max(60,Math.min(1540,data.position.y))}:base.position;
    let next={...base,completed,position,elapsedMs,clockStarted:!!data.clockStarted||completed.length>0||elapsedMs>0,growth:Math.floor(elapsedMs/GROWTH_INTERVAL),treasures:[...new Set(data.treasures)],visited:[...new Set(Array.isArray(data.visited)?data.visited.filter(i=>Number.isInteger(i)&&i>=0&&i<8):[])],pets:Math.max(0,Math.min(3,Math.floor(Number(data.pets)||0))),mistakes:Math.max(0,Math.floor(Number(data.mistakes)||0))};
    if(canFinish(next)&&data.cake==='baked')next.cake='baked';
    if(elapsedMs>=GAME_DURATION)next.status='lost';
    else if(data.status==='won'&&data.candlesBlown&&next.cake==='baked')next=winGame(next);
    return next;
  }catch{return null;}
}

// The clock measures active play; dialogs keep it running, explicit pause and leaving the page stop it.
export class PlayClock {
  constructor(onElapsed,now=()=>performance.now()){this.onElapsed=onElapsed;this.now=now;this.last=null;}
  start(){if(this.last===null)this.last=this.now();}
  tick(){if(this.last===null)return;const current=this.now(),elapsed=Math.max(0,current-this.last);this.last=current;if(elapsed)this.onElapsed(elapsed);}
  stop(){this.tick();this.last=null;}
}
