import { WORDS, CARE, RIDDLES } from './questions.js?v=2';

export const VERSION = 2;
export const MAX_GROWTH = 9;
export const WORLD_SIZE = { width: 2400, height: 1600 };
export const SPAWN = { x: 660, y: 1150 };
export const INGREDIENTS = [
  { id: 'sun', name: 'Rayito de sol' }, { id: 'drop', name: 'Gota de cuidado' },
  { id: 'leaf', name: 'Hoja de las historias' }, { id: 'heart', name: 'Corazón de equipo' },
  { id: 'flower', name: 'Flor de los recuerdos' }, { id: 'star', name: 'Chispa de cumpleaños' }
];
export const ZONES = [
  { id:'meadow', name:'Pradera del sol', short:'Pradera', color:'#c8d89c', icon:'sun', x:430, y:1120, requires:0, types:['math','observe','pattern'], points:[[240,1010],[480,1000],[400,1300]], titles:['El picnic de las sumas','Las flores escondidas','El camino saltarín'] },
  { id:'pond', name:'Estanque de las ideas', short:'Estanque', color:'#a5cbd0', icon:'drop', x:350, y:430, requires:0, types:['memory','care','sequence'], points:[[130,400],[540,280],[510,660]], titles:['Parejas junto al agua','Una decisión con cariño','La canción del estanque'] },
  { id:'library', name:'Biblioteca del roble', short:'Biblioteca', color:'#cdbca0', icon:'leaf', x:1200, y:320, requires:1, types:['word','riddle','order'], points:[[990,290],[1240,470],[1430,240]], titles:['La palabra perdida','El libro de los acertijos','Historias en orden'] },
  { id:'orchard', name:'Huerto de las cuentas', short:'Huerto', color:'#d8bc8f', icon:'heart', x:1940, y:400, requires:2, types:['math','balance','order'], points:[[1690,340],[2050,250],[2180,620]], titles:['La cosecha de Pandora','La balanza curiosa','Macetas en fila'] },
  { id:'butterflies', name:'Rincón de las mariposas', short:'Mariposas', color:'#d6b3be', icon:'flower', x:1940, y:1160, requires:3, types:['observe','symmetry','care'], points:[[1680,1040],[2180,1060],[2050,1370]], titles:['Un jardín de detalles','Las alas del espejo','Cuidar nuestro mundo'] },
  { id:'hill', name:'Colina de las estrellas', short:'Colina', color:'#b9b5d0', icon:'star', x:1200, y:1290, requires:4, types:['pattern','maze','word'], points:[[950,1300],[1240,1430],[1450,1180]], titles:['Las constelaciones','El laberinto lunar','Un último mensaje'] }
];
export const QUESTS = ZONES.flatMap((zone,z) => zone.types.map((type,i) => ({ id:`${zone.id}-${i}`, zone:z, type, title:zone.titles[i], x:zone.points[i][0], y:zone.points[i][1] })));
export const TREASURES = [
  { id:'spark-0', x:730, y:1370, name:'La estrella viajera', text:'Hasta el camino más pequeño puede esconder una sorpresa.' },
  { id:'spark-1', x:170, y:710, name:'El secreto del estanque', text:'Cuando escuchamos con calma, el jardín nos cuenta cosas.' },
  { id:'spark-2', x:760, y:210, name:'Una hoja con historia', text:'Cada persona tiene una historia que merece ser escuchada.' },
  { id:'spark-3', x:1570, y:110, name:'El deseo del roble', text:'Aprender algo nuevo es otra manera de crecer.' },
  { id:'spark-4', x:2250, y:850, name:'El tesoro del huerto', text:'Cuidar juntos hace más bonito nuestro mundo.' },
  { id:'spark-5', x:1800, y:1440, name:'Una mariposa de papel', text:'Las mejores aventuras dejan espacio para la imaginación.' },
  { id:'spark-6', x:780, y:750, name:'El collar de Pandora', text:'Una buena compañera hace más alegre el camino.' },
  { id:'spark-7', x:1530, y:830, name:'La estrella de los ocho', text:'¡Ocho años, ocho descubrimientos y mil aventuras por venir!' }
];
export const GROWTH_MESSAGES = [
  'Alessandro todavía cabe en la fiesta.','¡Los pantalones le quedaron cortos!','Puede ver por encima de los arbustos.',
  'Su sombra ya cruza el sendero.','El paso del centro se está estrechando.','¡Tiene un árbol a la altura del pelo!',
  'Las nubes se acercan a su cabeza. Hay más brisa.','Sus zapatillas ocupan medio camino.',
  '¡La brisa es fuerte! Busca la poción con calma.','¡Demasiado alto! Volvamos al último campamento.'
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

export function makeChallenge(type,random=Math.random,variant=0) {
  if(type==='math') {
    const operation=integer(random,0,2); let a=integer(random,4,12),b=integer(random,2,7);
    if(operation===1&&a<b) [a,b]=[b,a];
    if(operation===2) { a=integer(random,2,4); b=integer(random,2,4); }
    const answer=operation===1?a-b:operation===2?a*b:a+b;
    return { type,a,b,operation,answer,options:numberOptions(answer,random),hint:operation===1?`Empieza en ${a} y cuenta ${b} pasos hacia atrás.`:operation===2?`Cuenta ${a} grupos de ${b}. Puedes sumar ${Array(a).fill(b).join(' + ')}.`:`Empieza en ${a} y cuenta ${b} más.`,explanation:`${a} ${operation===1?'−':operation===2?'×':'+'} ${b} = ${answer}. ¡Cada paso cuenta!` };
  }
  if(type==='pattern') {
    if(random()<.45) {
      const pair=shuffle(symbols,random).slice(0,2),block=random()<.5?[pair[0],pair[1]]:[pair[0],pair[0],pair[1]];
      const values=Array.from({length:5},(_,i)=>block[i%block.length]),answer=block[5%block.length];
      return { type,visual:true,values,answer,options:shuffle([pair[0],pair[1],symbols.find(s=>!pair.includes(s))],random),hint:`Busca el grupo que se repite: ${block.map(s=>({sun:'sol',leaf:'hoja',flower:'flor',drop:'gota',heart:'corazón',star:'estrella'})[s]).join(', ')}.`,explanation:'¡Encontraste el grupo que se repite! Así descubrimos un patrón.' };
    }
    const step=pick([2,3,4,-2],random),start=step<0?integer(random,15,22):integer(random,1,5);
    const values=Array.from({length:4},(_,i)=>start+step*i),answer=start+step*4;
    return { type,values,step,answer,options:numberOptions(answer,random),hint:`En cada salto ${step<0?'restas':'sumas'} ${Math.abs(step)}.`,explanation:`La regla era ${step<0?'restar':'sumar'} ${Math.abs(step)}. ¡Una ruta nueva!` };
  }
  if(type==='memory') { const pairs=random()<.6?3:4,chosen=shuffle(symbols,random).slice(0,pairs); return { type,cards:shuffle([...chosen,...chosen],random),hint:'Mira con calma. Puedes volver a pedirme que te enseñe las cartas.',explanation:'Recordaste dónde estaba cada pareja. ¡Observar con atención hace magia!' }; }
  if(type==='word') { const [word,clue]=WORDS[variant%WORDS.length]; return { type,word,clue,letters:shuffle([...word],random),hint:`La palabra es ${word.split('').join(' - ')}. Busca las letras de una en una.`,explanation:`${word}. Las palabras también son semillas de nuevas historias.` }; }
  if(type==='care'||type==='riddle') { const bank=type==='care'?CARE:RIDDLES; const [question,options,hint,explanation]=bank[variant%bank.length]; return { type,question,answer:options[0],options:shuffle(options,random),hint,explanation }; }
  if(type==='observe') { const target=pick(symbols,random),count=integer(random,4,9),others=symbols.filter(s=>s!==target); return { type,target,items:shuffle([...Array(count).fill(target),...Array.from({length:integer(random,8,13)},()=>pick(others,random))],random),answer:count,options:numberOptions(count,random),hint:'Busca solo el dibujo de la pregunta. Cuenta por filas y deja los demás para después.',explanation:'Separar los detalles importantes nos ayuda a observar y a pensar.' }; }
  if(type==='order') { const values=shuffle(Array.from({length:28},(_,i)=>i+2),random).slice(0,4),descending=random()<.5; return { type,values,descending,answer:[...values].sort((a,b)=>descending?b-a:a-b),hint:`Empieza por el número más ${descending?'grande':'pequeño'} y continúa uno por uno.`,explanation:'¡Todo en su lugar! Comparar nos ayuda a poner las ideas en orden.' }; }
  if(type==='balance') { const a=integer(random,3,9),b=integer(random,2,7),c=a+b+pick([-2,0,2],random),answer=a+b<c?'<':a+b>c?'>':'='; return { type,a,b,c,answer,options:shuffle(['<','=','>'],random),hint:`Primero suma ${a} + ${b}. Compara el resultado con ${c}. La parte abierta mira al número mayor.`,explanation:`${a} + ${b} ${a+b<c?'es menor que':a+b>c?'es mayor que':'es igual a'} ${c}. ¡Encontraste el equilibrio!` }; }
  if(type==='sequence'||type==='recipe') { const length=type==='recipe'?6:integer(random,3,5),pool=type==='recipe'?symbols:shuffle(symbols,random).slice(0,4),recipe=type==='recipe'?shuffle(symbols,random):Array.from({length},()=>pick(pool,random)); return { type,recipe,pool,hint:'Puedes mirar la secuencia todas las veces que quieras. Divídela en grupos pequeños para recordarla.',explanation:type==='recipe'?'¡La poción está lista! La magia fue tu curiosidad y el cariño de tu equipo.':'Recordaste la canción del estanque. ¡Una nota más para tu aventura!' }; }
  if(type==='symmetry') { const pattern=Array.from({length:9},()=>random()<.5); if(!pattern.some(Boolean))pattern[4]=true; return { type,pattern,answer:pattern.map((_,i)=>pattern[Math.floor(i/3)*3+2-i%3]),hint:'Imagina un espejo en el centro. Los cuadros que tocan el centro en un lado también lo tocan en el otro.',explanation:'¡Las dos alas se miran en el espejo! Descubriste la simetría.' }; }
  if(type==='maze') {
    const width=6,height=5; let blocked,solution;
    for(let i=0;i<80;i++) { blocked=Array.from({length:width*height},(_,n)=>n!==0&&n!==width*height-1&&random()<.24); solution=mazePath(blocked,width,0,width*height-1); if(solution.length>=9)break; }
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
  const random=rng(seed),offsets={word:integer(random,0,WORDS.length-1),care:integer(random,0,CARE.length-1),riddle:integer(random,0,RIDDLES.length-1)};
  return Object.fromEntries([...QUESTS,{id:'final',type:'recipe'}].map(q=>[q.id,makeChallenge(q.type,random,offsets[q.type]===undefined?0:offsets[q.type]++)]));
}
export function createGame(seed=Math.floor(Math.random()*0xffffffff)) { return { version:VERSION,seed:seed>>>0,status:'playing',growth:0,mistakes:0,completed:[],treasures:[],spent:0,position:{...SPAWN},checkpoint:[],visited:[],story:0,pets:0 }; }
export function collectedIngredients(state) { return ZONES.map((_,i)=>QUESTS.filter(q=>q.zone===i).every(q=>state.completed.includes(q.id))?i:-1).filter(i=>i>=0); }
export function isUnlocked(state,zone) { return collectedIngredients(state).length>=ZONES[zone].requires; }
export function completeQuest(state,id) {
  const quest=QUESTS.find(q=>q.id===id);
  if(!quest||state.status!=='playing'||!isUnlocked(state,quest.zone)||state.completed.includes(id))return state;
  let next={...state,completed:[...state.completed,id]};
  if(collectedIngredients(next).length>collectedIngredients(state).length)next={...next,growth:Math.max(0,state.growth-1),checkpoint:[...next.completed]};
  return next;
}
export function makeMistake(state) { if(state.status!=='playing')return state; const growth=Math.min(MAX_GROWTH,state.growth+1); return {...state,growth,mistakes:state.mistakes+1,status:growth===MAX_GROWTH?'lost':'playing'}; }
export function collectTreasure(state,id) { return state.status!=='playing'||state.treasures.includes(id)||!TREASURES.some(t=>t.id===id)?state:{...state,treasures:[...state.treasures,id]}; }
export function soothe(state) { return state.status!=='playing'||!state.growth||state.treasures.length-state.spent<3?state:{...state,growth:Math.max(0,state.growth-2),spent:state.spent+3}; }
export function restoreCheckpoint(state) { return {...state,status:'playing',growth:1,completed:[...state.checkpoint],position:{...SPAWN}}; }
export function winGame(state) { return state.status==='playing'&&collectedIngredients(state).length===6?{...state,status:'won',growth:0}:state; }
export function readSave(raw) {
  try {
    const data=JSON.parse(raw);
    if(data?.version!==VERSION||!Number.isInteger(data.seed)||!['playing','lost','won'].includes(data.status))return null;
    const ids=new Set(QUESTS.map(q=>q.id));
    if(!Array.isArray(data.completed)||data.completed.some(id=>!ids.has(id))||!Array.isArray(data.treasures)||data.treasures.some(id=>!TREASURES.some(t=>t.id===id)))return null;
    const base=createGame(data.seed),completed=[...new Set(data.completed)],growth=Math.max(0,Math.min(MAX_GROWTH,Math.floor(Number(data.growth)||0))),treasures=[...new Set(data.treasures)];
    const position=Number.isFinite(data.position?.x)&&Number.isFinite(data.position?.y)?{x:Math.max(60,Math.min(2340,data.position.x)),y:Math.max(60,Math.min(1540,data.position.y))}:base.position;
    return {...base,completed,treasures,growth,position,status:growth>=MAX_GROWTH?'lost':data.status==='won'&&completed.length===QUESTS.length?'won':'playing',spent:Math.max(0,Math.min(treasures.length,Math.floor(Number(data.spent)||0))),checkpoint:Array.isArray(data.checkpoint)?[...new Set(data.checkpoint.filter(id=>completed.includes(id)))]:[],visited:Array.isArray(data.visited)?data.visited.filter(i=>Number.isInteger(i)&&i>=0&&i<6):[],story:Math.max(0,Math.min(3,Math.floor(Number(data.story)||0))),mistakes:Math.max(0,Math.floor(Number(data.mistakes)||0)),pets:Math.max(0,Math.min(3,Math.floor(Number(data.pets)||0)))};
  } catch { return null; }
}
