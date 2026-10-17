import { GAME_DURATION, GROWTH_INTERVAL, INGREDIENTS, ZONES, QUESTS, TREASURES, LEVEL_NAMES, GROWTH_MESSAGES, PlayClock, createGame, generateChallenges, collectedCandles, collectedIngredients, collectedGifts, stationProgress, isUnlocked, completeQuest, makeMistake, collectTreasure, advanceTime, remainingTime, formatTime, canFinish, nextRequiredQuest, bakeCake, winGame, readSave, cakeProfile, scoreRun, SCORE_RULES } from './logic.js?v=3.5';
import { Garden } from './world.js?v=3.5';
import { Puzzle } from './puzzles.js?v=3.5';
import { PARTY, KITCHEN } from './map.js?v=3.5';
import { art, icon } from './icons.js?v=3.5';
import { MusicPlayer, readAudioPreferences } from './music.js?v=3.2';

const $=(s,root=document)=>root.querySelector(s),$$=(s,root=document)=>[...root.querySelectorAll(s)];
const main=$('#main'),panel=$('#adventure-dialog'),SAVE_KEY='anya-garden-v3';
const AUDIO_KEY='anya-audio-v1';
let audioPreferences;try{audioPreferences=readAudioPreferences(localStorage.getItem(AUDIO_KEY));}catch{audioPreferences=readAudioPreferences(null);}
let state=null,garden=null,puzzle=null,challenges=null,manualPaused=false,soundEnabled=audioPreferences.enabled,audioContext=null,sceneTimer=null,alertTimer=null,bakingEndsAt=null,hudCounts=null,freshSlots=[],messageTimer=null,pendingGrowth=false,pendingStars=false,cutscene=false;
const music=new MusicPlayer({audio:$('#background-music'),...audioPreferences,onChange:updateSound});
let saved=load(),wins=readWins();
const clock=new PlayClock(ms=>{
  if(!state)return;const previous=state.growth;state=advanceTime(state,ms);updateClock();
  if(state.growth!==previous){updateHud();save();growthAlert();}
  if(state.status==='playing'&&bakingEndsAt!==null&&state.elapsedMs>=bakingEndsAt&&panel.open&&panel.dataset.kind==='baking'){bakingEndsAt=null;state=bakeCake(state);save();showWish();sound('success');}
  if(state.status==='lost')queueMicrotask(()=>{if(state?.status==='lost'&&garden)showEnd(false);});
});
function load(){try{return readSave(localStorage.getItem(SAVE_KEY));}catch{return null;}}
function readWins(){try{return Math.max(0,Math.min(999,Number(localStorage.getItem('anya-adventure-wins'))||0));}catch{return 0;}}
function save(){if(!state)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));saved=state;}catch{/* Jugar también es posible sin almacenamiento. */}}
function announce(text){$('#announcer').textContent=text;}
const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
// Decorative layers shared by the welcome, the story and the finale. Fixed positions keep every visit identical.
const TWINKLES=[[8,14,0],[22,32,.6],[46,9,1.2],[63,26,.3],[84,13,.9],[91,40,1.5],[14,52,1.8],[72,48,.4]];
function twinkles(count=8){return TWINKLES.slice(0,count).map(([x,y,d])=>`<i class="twinkle" style="--x:${x}%;--y:${y}%;--d:${d}s">✦</i>`).join('');}
function balloons(count=3){return ['#e2a24f','#d9826c','#8fae86','#9fbfc2','#e6c36a'].slice(0,count).map((color,i)=>`<i class="balloon" style="--c:${color};--i:${i}"></i>`).join('');}
function sparks(count=12){return Array.from({length:count},(_,i)=>`<i style="--a:${Math.round(i*360/count)}deg"></i>`).join('');}
function storyBackdrop(mood=''){return `<div class="story-sky ${mood}" aria-hidden="true"><span class="story-sun"></span><span class="story-cloud c1"></span><span class="story-cloud c2"></span><span class="story-cloud c3"></span><span class="story-hill back"></span><span class="story-hill front"></span>${twinkles()}</div>`;}
function focusHeading(root=main){const heading=$('h1,h2',root);if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
function sound(kind='tap'){
  if(!soundEnabled||document.hidden)return;
  try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});const notes=kind==='win'?[523,659,784,1047]:kind==='success'?[523,659,784]:kind==='error'?[294,262]:[587];notes.forEach((f,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain(),t=audioContext.currentTime+i*.1;osc.type='sine';osc.frequency.value=f;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.035,t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+.28);osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+.3);});}catch{audioContext=null;}
}
function updateSound(){
  const current=music.snapshot(),label=soundEnabled&&current.blocked?'Reproducir música':soundEnabled?'Silenciar música y efectos':'Activar música y efectos';
  for(const button of $$('#sound-button,#music-toggle')){button.innerHTML=icon(soundEnabled?'sound':'mute');button.setAttribute('aria-pressed',String(soundEnabled));button.setAttribute('aria-label',label);button.title=label;}
  const title=$('#music-title'),titleText=`${current.title} · ${current.index+1}/${current.count}`;
  if(title&&title.textContent!==titleText){title.textContent=titleText;title.title=titleText;}
  const status=$('#music-status'),statusText=current.unavailable?'No se pudo cargar la música':!soundEnabled?'Sonido apagado':current.blocked?'Toca el altavoz para escuchar':!current.active?'En pausa':current.volume===0?'Volumen en cero':current.playing?'Las canciones de Pandora':'Preparando la canción…';
  if(status&&status.textContent!==statusText)status.textContent=statusText;
  const volume=$('#music-volume');if(volume){volume.value=String(Math.round(current.volume*100));volume.setAttribute('aria-valuetext',`${volume.value} por ciento`);}
}
function saveAudioPreferences(){try{localStorage.setItem(AUDIO_KEY,JSON.stringify({enabled:soundEnabled,volume:music.audio.volume}));}catch{}}
function syncMusic(){music.setActive(!!garden&&!!state?.clockStarted&&state.status==='playing'&&!manualPaused&&!document.hidden);}
function toggleSound(){
  if(soundEnabled&&music.blocked){music.setEnabled(true);return;}
  soundEnabled=!soundEnabled;music.setEnabled(soundEnabled);saveAudioPreferences();updateSound();if(!soundEnabled)audioContext?.suspend();
}
function dispose(){clock.stop();music.setActive(false);clearTimeout(sceneTimer);clearTimeout(alertTimer);clearTimeout(messageTimer);puzzle?.destroy();puzzle=null;garden?.destroy();garden=null;for(const dialog of $$('dialog[open]'))dialog.close();manualPaused=false;document.body.classList.remove('game-paused');}
function message(text){const el=$('#garden-message');if(el){el.textContent=text;el.hidden=false;el.classList.remove('fresh');void el.offsetWidth;el.classList.add('fresh');clearTimeout(messageTimer);messageTimer=setTimeout(()=>{el.hidden=true;},6000);}announce(text);}
function openPanel(html,setup,{kind='',wide=false,cls='',clock:showClock=true}={}){
  clearTimeout(sceneTimer);bakingEndsAt=null;puzzle?.destroy();puzzle=null;garden?.stop();if($('#travel-indicator'))$('#travel-indicator').hidden=true;if(panel.open)panel.close();
  panel.className=[wide?'map-dialog':'',cls].filter(Boolean).join(' ');panel.dataset.kind=kind;
  panel.innerHTML=`${kind==='intro'?'':`<button class="dialog-close icon-button" id="panel-close" aria-label="Volver al jardín">×</button>`}${showClock&&state?.clockStarted&&state.status==='playing'?`<div class="panel-clock">${icon('clock')}<span class="live-time" role="timer">${formatTime(remainingTime(state))}</span><span>El reloj sigue</span><button class="text-button" id="panel-pause">Pausar</button></div>`:''}${html}`;
  $('#panel-close',panel)?.addEventListener('click',closePanel);$('#panel-pause',panel)?.addEventListener('click',pause);panel.showModal();setup?.();focusHeading(panel);
}
function closePanel(){if(state?.status==='won'&&garden){showEnd(true);return;}bakingEndsAt=null;clearTimeout(sceneTimer);puzzle?.destroy();puzzle=null;panel.close();garden?.stop();save();$('#garden-canvas')?.focus({preventScroll:true});afterPanel();}
// After any panel closes: resume after a scene, pop new prizes, then show what waited.
function afterPanel(){if(panel.open)return;if(cutscene){cutscene=false;resumeClock();}celebrateFresh();showPending();}
panel.addEventListener('close',afterPanel);
panel.addEventListener('cancel',e=>{if(state?.status==='won'&&garden){e.preventDefault();showEnd(true);return;}bakingEndsAt=null;if(panel.dataset.kind==='intro'){e.preventDefault();return;}clearTimeout(sceneTimer);puzzle?.destroy();puzzle=null;garden?.stop();save();});
function houseScene(extra=''){return `<div class="storybook-house ${extra}" aria-hidden="true"><div class="house-roof"></div><div class="house-walls"><img src="assets/characters/alessandro.webp" alt=""><span class="house-crack">ϟ</span></div><div class="house-ground"></div></div>`;}
function cakeScene(lit=true){
  const cake=cakeProfile(state),butter=cake.ids.includes('butter'),chocolate=cake.ids.includes('cacao'),bread=chocolate?'#a77b61':butter?'#e8bd6d':'#e1bd8d',filling=butter?'#f4d78f':'#faf0d3';
  const stops=[];let cursor=0;const cream=8,sponge=(100-cream*(cake.layers-1))/cake.layers;
  for(let i=0;i<cake.layers;i++){stops.push(`${bread} ${cursor}% ${cursor+sponge}%`);cursor+=sponge;if(i<cake.layers-1){stops.push(`${filling} ${cursor}% ${cursor+cream}%`);cursor+=cream;}}
  return `<div class="birthday-cake cake-level-${cake.level} ${cake.ids.map(id=>'has-'+id).join(' ')} ${lit?'lit':''}" data-cake-count="${cake.count}" data-cake-level="${cake.level}" style="--cake-lift:${cake.lift}px;--cake-filling:${filling};--cake-gradient:linear-gradient(${stops.join(',')});--cake-top:${cake.ids.includes('sugar')?'#fff5df':chocolate?'#ad7b61':'#f4dbd0'}" role="img" aria-label="${cake.name}. ${cake.count} de ocho ingredientes y ocho velas ${lit?'encendidas':'apagadas'}"><div class="cake-candles">${Array.from({length:8},(_,i)=>`<span class="cake-candle" style="--i:${i}"><i class="flame"></i><b></b></span>`).join('')}</div><div class="cake-icing"><span>8</span>${cake.ids.includes('berries')?'<div class="cake-berries">'+Array(4).fill(icon('berries')).join('')+'</div>':''}${cake.ids.includes('vanilla')?'<i class="cake-vanilla">'+icon('vanilla')+'</i>':''}${cake.ids.includes('sugar')?'<div class="cake-pearls">'+Array(9).fill('<i></i>').join('')+'</div>':''}</div><div class="cake-base">${cake.ids.includes('cacao')?'<div class="chocolate-drips"></div>':''}${butter?'<span class="butter-ribbon"></span>':''}${cake.level===5?'<span class="cake-medallion">✦ 8 ✦</span>':''}</div><div class="cake-plate"></div>${cake.level===5?'<div class="cake-sparkles" aria-hidden="true">✧　✦　✧</div>':''}</div>`;
}
function scoreCard(){
  const score=scoreRun(state);
  return `<section class="score-card" aria-labelledby="score-title"><div class="score-heading"><div><span class="eyebrow">TU AVENTURA EN NÚMEROS</span><h2 id="score-title">Tu puntaje</h2></div><strong data-count="${score.total}">${score.total.toLocaleString('es-CO')}<small>de ${score.max.toLocaleString('es-CO')} puntos</small></strong></div><div class="score-progress" role="progressbar" aria-label="Puntaje de la aventura" aria-valuenow="${score.total}" aria-valuemin="0" aria-valuemax="${score.max}"><i style="width:${score.total/score.max*100}%"></i></div><dl class="score-breakdown"><div><dt>${icon('candle')} Velas <b>${score.candles}/8</b></dt><dd><span data-count="${score.candlePoints}">${score.candlePoints}</span> puntos</dd></div><div><dt>${icon('cake')} Ingredientes <b>${score.ingredients}/8</b></dt><dd><span data-count="${score.ingredientPoints}">${score.ingredientPoints}</span> puntos</dd></div><div><dt>${icon('gift')} Regalos <b>${score.gifts}/8</b></dt><dd><span data-count="${score.giftPoints}">${score.giftPoints}</span> puntos</dd></div><div><dt>${icon('star')} Deseo cumplido</dt><dd><span data-count="${score.wishPoints}">${score.wishPoints}</span> puntos</dd></div></dl><p>Una vela: 100 · Un ingrediente: 150 · Un regalo: 250 · Tu deseo: 1.000 puntos.</p></section>`;
}
function openCakePreview(){
  const cake=cakeProfile(state),ingredients=collectedIngredients(state),next=QUESTS.find(q=>q.level===1&&!state.completed.includes(q.id));
  openPanel(`<span class="eyebrow">TU RECETA VA CRECIENDO</span><div class="cake-preview-scene ${cake.ready?'':'recipe-incomplete'}">${cakeScene(false)}</div><h2 id="panel-title">${cake.ready?cake.name:'Un pastel por imaginar'}</h2><p>${cake.ready?`Con ${cake.count} de ocho ingredientes, Alyssia hará un pastel con ${cake.layers===1?'una capa':cake.layers+' capas'}. Cada ingrediente extra le da un detalle especial.`:'Primero busca harina, huevos y leche. Después podrás añadir hasta cinco ingredientes extra para hacer un pastel cada vez más especial.'}</p><div class="cake-level-meter" aria-label="${cake.count} de ocho ingredientes">${INGREDIENTS.map((item,i)=>`<span class="${ingredients.includes(i)?'collected':''}" title="${item.name}">${icon(item.id)}</span>`).join('')}</div><ul class="cake-enhancements">${INGREDIENTS.filter(i=>!i.required).map(item=>{const extra=cake.extras.find(e=>e.id===item.id);return `<li class="${extra?'earned':''}">${icon(item.id)}<span><b>${item.name}</b><small>${extra?extra.detail:'Un nuevo toque para tu pastel'}</small></span><strong>${extra?'✓':'+'}</strong></li>`;}).join('')}</ul>${next?`<button class="button primary" id="cake-next">${cake.ready?'Buscar otro ingrediente':'Buscar los ingredientes básicos'} →</button>`:''}${canFinish(state)?'<button class="text-button" id="cake-bake">Ir con Alyssia a hornear →</button>':''}`,()=>{
    $('#cake-next')?.addEventListener('click',()=>{const q=cake.ready?next:nextRequiredQuest(state);closePanel();if(q)garden.guideTo({...q,title:ZONES[q.zone].name});});$('#cake-bake')?.addEventListener('click',()=>{closePanel();goAlyssia();});
  },{kind:'cake'});
}
function playWithPandora(action){
  if(!garden||state?.status!=='playing')return;
  if(action==='fetch')garden.throwBall();else if(action==='sniff')garden.sniff();
}
function companionFinished(){sound('success');message('¡La trajo! Pandora devuelve la pelota a Anya y mueve la cola. ¡Otro lanzamiento cuando quieras!');}
function welcome(){
  dispose();state=null;document.body.classList.remove('in-adventure');saved=load();const resume=saved?.status==='playing';
  main.innerHTML=`<section class="welcome appear"><div class="hero"><div class="hero-copy"><span class="eyebrow">UNA AVENTURA HECHA PARA TUS OCHO AÑOS</span><h1>Anya y el<br>deseo de las<br><em class="title-accent">ocho velas</em></h1><p>¡Alessandro crece dentro de casa y el techo ya le queda pequeño! Explora con Pandora y reúne lo que Alyssia necesita para hornear el pastel que salvará tu cumpleaños.</p><div class="welcome-actions"><button class="button primary" id="start-button">${resume?'Continuar mi aventura':'¡Que empiece la aventura!'} <span aria-hidden="true">↗</span></button>${resume?'<button class="text-button" id="new-button">Una aventura nueva</button>':''}</div><div class="hero-note">${icon('clock')} 10 minutos · 8 estaciones · un deseo enorme</div>${resume?`<p class="save-note">Te esperan ${collectedCandles(saved).length}/8 velas y ${formatTime(remainingTime(saved))} de aventura.</p>`:''}</div><div class="hero-art birthday-hero" role="img" aria-label="Anya, Alyssia, Pandora y Alessandro en su jardín de cumpleaños"><img class="garden-bg" src="assets/garden.svg" alt=""><div class="hero-balloons" aria-hidden="true">${balloons(3)}</div><div class="hero-twinkles" aria-hidden="true">${twinkles(6)}</div>${growthHouse(1,{after:pose(1,'a'),extra:'hero-casa'})}${art('alyssia')}${art('anya')}${art('pandora')}<div class="speech-bubble">¡Un deseo puede cambiarlo todo!</div><div class="birthday-sticker"><span>¡FELICES</span><b>8</b><span>AÑOS!</span></div><span class="art-label anya-label">Anya, la exploradora</span><span class="art-label pandora-label">Pandora, tu cómplice</span><span class="art-label alyssia-label">Alyssia, la pastelera</span>${icon('star','hero-spark')}</div></div><div class="welcome-bottom"><p>${wins?`Ya celebramos ${wins} ${wins===1?'aventura':'aventuras'}. ¡Cada jardín trae retos diferentes!`:'Toca para caminar · Flechas o WASD · Tu aventura se guarda aquí.'}</p><p>Crecer está bien. Este estirón es cosa de la magia.</p></div></section>`;
  $('#start-button').addEventListener('click',()=>{if(resume){state=readSave(JSON.stringify(saved));challenges=generateChallenges(state.seed);renderGarden();if(!state.clockStarted)showIntro(0);}else newGame();});
  $('#new-button')?.addEventListener('click',()=>openPanel(`<span class="eyebrow">UN JARDÍN NUEVO</span><h2 id="panel-title">¿Empezamos otra aventura?</h2><p>Volverás a tener 10 minutos, con otros retos y todos los premios por descubrir. Se reemplazará la partida guardada.</p><button class="button primary" id="confirm-new">Sí, empezar de nuevo →</button><button class="text-button" id="keep-save">Seguir mi aventura</button>`,()=>{$('#confirm-new').addEventListener('click',newGame);$('#keep-save').addEventListener('click',closePanel);}));
}
function newGame(){
  clock.stop();const previous=saved?.seed??0,values=new Uint32Array(1);if(window.crypto?.getRandomValues)crypto.getRandomValues(values);else values[0]=Date.now();
  const seed=values[0]===previous?(values[0]+1)>>>0:values[0];state=createGame(seed);challenges=generateChallenges(seed);save();renderGarden();showIntro(0);
}
const TRAIL=[[42,214],[112,176],[196,204],[282,172],[350,114],[276,74],[186,92],[104,48]];
function introScene(step){
  if(step===0)return `<div class="story-house">${growthHouse(2,{before:pose(1,'a'),after:pose(2,'b'),animate:true})}<span class="alarm-marks"><i>!</i><i>!</i></span></div><span class="scene-speech">¡Anya! ¡El techo se está acercando!</span><img class="story-anya peeking" src="assets/characters/anya.webp" alt=""><img class="story-pandora peeking" src="assets/characters/pandora.webp" alt="">`;
  if(step===1)return `<img class="story-alyssia" src="assets/characters/alyssia.webp" alt=""><div class="story-cake">${cakeScene()}</div><div class="story-ingredients">${[0,1,2].map(i=>`<span style="--i:${i}">${icon(INGREDIENTS[i].id)}</span>`).join('')}</div>`;
  const points=TRAIL.map(p=>p.join(',')).join(' ');
  return `<svg class="story-trail" viewBox="0 0 400 250" aria-hidden="true"><polyline class="trail-edge" points="${points}" pathLength="1"/><polyline class="trail-path" points="${points}" pathLength="1"/>${TRAIL.map(([x,y],i)=>`<g class="trail-stop" style="--i:${i}"><circle cx="${x}" cy="${y}" r="15"/><text x="${x}" y="${y+5}">${i+1}</text></g>`).join('')}</svg><img class="story-anya walking" src="assets/characters/anya.webp" alt=""><img class="story-pandora walking" src="assets/characters/pandora.webp" alt=""><div class="story-prizes"><span style="--i:0">${icon('candle')}<b>1 · vela</b></span><span style="--i:1">${icon('flour')}<b>2 · ingrediente</b></span><span style="--i:2">${icon('gift')}<b>3 · regalo</b></span></div>`;
}
function showIntro(step){
  const chapters=[
    ['Un estirón… ¡demasiado grande!','Es tu cumpleaños número ocho. Alessandro encontró una vela mágica y deseó crecer un poquito. Pero el hechizo no se detiene… ¡y ahora está atrapado dentro de la casa!'],
    ['El deseo de las ocho velas','«Yo horneo el pastel», dice Alyssia. «Tráeme harina, huevos y leche, y encuentra tus ocho velas. Después podrás soplarlas y desear que Alessandro deje de crecer».'],
    ['Ocho estaciones. Un gran equipo.','Pandora irá contigo: toca su huella y te guiará. En cada estación resuelve los niveles en orden: primero una vela, luego un ingrediente y después un regalo. Solo necesitas ocho velas y los tres ingredientes básicos. Alyssia te espera en el centro.']
  ];const [title,copy]=chapters[step];
  openPanel(`<div class="story-book intro-${step}"><div class="story-stage" aria-hidden="true">${storyBackdrop()}${introScene(step)}</div><div class="story-copy"><span class="eyebrow">EL DESEO DE ANYA · CAPÍTULO ${step+1} DE 3</span><h2 id="panel-title">${title}</h2><p>${copy}</p>${step===2?`<div class="intro-rules">${icon('clock')}<p><b>Tienes 10 minutos de juego.</b> Alessandro crece cada minuto. Si se acaba el tiempo, rompe la casa. Puedes pausar para descansar.</p></div>`:''}<div class="intro-dots" aria-hidden="true">${[0,1,2].map(i=>`<i class="${i===step?'active':i<step?'done':''}"></i>`).join('')}</div><button class="button primary" id="intro-next">${step===2?'¡Vamos, Pandora! · Empezar los 10 min':'Sigue la historia'} <span aria-hidden="true">→</span></button>${step<2?'<button class="text-button" id="intro-skip">Saltar historia y ver la misión</button>':''}</div></div>`,()=>{
    $('#intro-next').addEventListener('click',()=>{if(step<2)showIntro(step+1);else beginAdventure();});$('#intro-skip')?.addEventListener('click',()=>showIntro(2));
  },{kind:'intro',cls:'story-dialog'});
}
function curtain(title,subtitle){
  if(reducedMotion())return;
  const el=document.createElement('div');el.className='adventure-curtain';el.setAttribute('aria-hidden','true');
  el.innerHTML=`<div class="curtain-half left"></div><div class="curtain-half right"></div><div class="curtain-title"><span class="curtain-paw">${icon('paw')}</span><b>${title}</b><small>${subtitle}</small></div>`;
  document.body.append(el);setTimeout(()=>el.remove(),2300);
}
function beginAdventure(){curtain('¡A explorar!','Pandora ya olfatea la primera pista');state={...state,clockStarted:true};closePanel();clock.start();syncMusic();save();message('¡Vamos, Anya! Alyssia espera en el centro. Empieza por la pradera para encontrar harina.');}
function renderGarden(){
  dispose();hudCounts=null;freshSlots=[];pendingGrowth=false;pendingStars=false;cutscene=false;document.body.classList.add('in-adventure');new Image().src='assets/animations/alessandro/casa.webp';preloadGrowth(state.growth+1);
  main.innerHTML=`<section class="garden-game" aria-label="La aventura de las ocho velas"><div class="garden-stage"><canvas id="garden-canvas" tabindex="0" aria-label="Jardín explorable. Usa flechas, WASD o toca un lugar para caminar."></canvas>
  <div class="stage-top"><div class="hud-row"><button class="hud-button" id="menu-button" aria-haspopup="dialog">${icon('menu')}<span>Menú</span></button><span class="hud-chip clock-chip">${icon('clock')}<b class="live-time" role="timer"></b></span><button class="hud-button icon-only" id="pause-button" aria-label="Pausar" title="Pausar">${icon('pause')}</button></div>
  <button class="hud-row hud-progress" id="progress-button" aria-label="Ver mis velas, ingredientes y la casa de Alessandro"><span class="hud-chip" id="hud-candles">${icon('candle')}<b></b></span><span class="hud-chip" id="hud-food">${icon('flour')}<b></b></span><span class="hud-chip" id="hud-growth">${icon('home')}<b></b></span></button><p class="hud-next" id="hud-next"></p></div>
  <div class="zoom-controls"><button id="zoom-out" aria-label="Ver más jardín">−</button><button id="zoom-in" aria-label="Acercar el jardín">+</button></div>
    <div class="stage-feed"><div class="travel-indicator" id="travel-indicator" hidden>Siguiendo el sendero…</div><div class="pandora-activity" id="pandora-activity" role="status" hidden></div><p class="garden-message" id="garden-message" hidden></p></div>
  <div class="walk-pad" aria-label="Controles para caminar"><button data-direction="arrowup" aria-label="Caminar arriba">↑</button><button data-direction="arrowleft" aria-label="Caminar a la izquierda">←</button><button data-direction="arrowdown" aria-label="Caminar abajo">↓</button><button data-direction="arrowright" aria-label="Caminar a la derecha">→</button></div>
  <div class="stage-actions"><div class="pandora-controls" role="group" aria-label="Juega con Pandora"><button class="sniff-button" id="sniff-button" aria-label="Pandora, guíame al siguiente objetivo" title="Pandora, guíame">${icon('paw')}<span>Guíame</span></button>${[['fetch','ball','Pelota','Lanzar la pelota'],['sniff','star','Estrella','Buscar una estrella']].map(([action,symbol,label,name])=>`<button data-pandora-action="${action}" aria-label="${name}" title="${name}">${icon(symbol)}<span>${label}</span></button>`).join('')}</div><button id="interact-button" class="interact-button">Explorar <span>E</span></button></div>
  </div></section>`;
  garden=new Garden($('#garden-canvas'),()=>state,{message,interact:interactWith,collect:findTreasure,guide:goNext,companion:companionFinished,save,position:(position,zone,near,companion)=>{
    state.position=position;if(!state.visited.includes(zone)){state.visited.push(zone);save();}
    $('#interact-button').innerHTML=`${near?(near.id==='final'?'El pastel':near.id==='talk'?'Alyssia':'Explorar'):'Guíame'} <span>E</span>`;
    $('#travel-indicator').hidden=!garden?.path.length;
    $('#sniff-button').classList.toggle('is-guiding',companion.job?.type==='guide');
    const job=companion.job,activity=job?.type==='guide'?'Pandora te guía al siguiente objetivo':job?.type==='fetch'?job.phase==='return'?'Pandora te trae la pelota':job.phase==='throw'?'¡Anya lanza la pelota!':'Pandora va por la pelota':job?.type==='sniff'?'Pandora olfatea una estrella':'';
    const label=$('#pandora-activity');if(label.textContent!==activity)label.textContent=activity;label.hidden=!activity;
  }});
  $('#menu-button').addEventListener('click',openMenu);$('#progress-button').addEventListener('click',openMenu);$('#pause-button').addEventListener('click',pause);
  $('#sniff-button').addEventListener('click',goNext);$$('[data-pandora-action]').forEach(button=>button.addEventListener('click',()=>playWithPandora(button.dataset.pandoraAction)));$('#interact-button').addEventListener('click',()=>garden.interact());
  $('#zoom-in').addEventListener('click',()=>garden.setZoom(.1));$('#zoom-out').addEventListener('click',()=>garden.setZoom(-.1));
  $$('.walk-pad button').forEach(button=>{const dir=button.dataset.direction;let pressed=0;button.addEventListener('pointerdown',e=>{e.preventDefault();pressed=performance.now();button.setPointerCapture(e.pointerId);garden.setDirection(dir,true);});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>garden?.setDirection(dir,false));button.addEventListener('click',()=>{if(performance.now()-pressed<220||!pressed)garden?.nudge(dir);});});
  updateHud();window.scrollTo({top:0,behavior:'instant'});$('#garden-canvas').focus({preventScroll:true});if(state.clockStarted&&!document.hidden)clock.start();syncMusic();updateSound();
  message('Toca el suelo para caminar. Pandora te sigue. Visita las estaciones numeradas del 1 al 8.');
}
function updateClock(){
  if(!state)return;const remaining=remainingTime(state);$$('.live-time').forEach(el=>el.textContent=formatTime(remaining));
  $$('.clock-fill').forEach(el=>el.style.width=`${remaining/GAME_DURATION*100}%`);document.body.classList.toggle('time-urgent',remaining<=2*60*1000&&state.status==='playing');
  const next=$('#next-growth');if(next)next.textContent=state.status==='lost'?'Se acabó el tiempo':`Próximo estirón en ${formatTime(GROWTH_INTERVAL-state.elapsedMs%GROWTH_INTERVAL)}`;
}
function updateHud(){
  if(!garden)return;const candles=collectedCandles(state).length,food=collectedIngredients(state).filter(i=>INGREDIENTS[i].required).length,counts={candles,food,growth:state.growth};
  $('#hud-candles b').textContent=`${candles}/8`;$('#hud-food b').textContent=`${food}/3`;$('#hud-growth b').textContent=`${state.growth}/10`;
  $('#hud-next').textContent=canFinish(state)?'¡Listo! Ve con Alyssia a hornear':nextObjective();
  if(hudCounts){for(const key of Object.keys(counts))if(counts[key]!==hudCounts[key])freshSlots.push(`#hud-${key==='candles'?'candles':key==='food'?'food':'growth'}`);if(!panel.open)celebrateFresh();}
  hudCounts=counts;updateClock();
}
function nextObjective(){const q=nextRequiredQuest(state);return q?`Siguiente: ${rewardName(q).toLowerCase()} en ${ZONES[q.zone].short}`:'Ve con Alyssia a hornear';}
// Prizes won inside a dialog pop once the garden is visible again.
function celebrateFresh(){
  if(!garden||!freshSlots.length)return;
  for(const selector of new Set(freshSlots)){const el=$(selector);if(!el)continue;el.classList.remove('just-earned');void el.offsetWidth;el.classList.add('just-earned');}
  freshSlots=[];
}
// Progress, the house, music and the other screens, gathered in one drawer.
function openMenu(){
  if(!garden||state.status!=='playing')return;
  const candles=collectedCandles(state),ingredients=collectedIngredients(state),required=ingredients.filter(i=>INGREDIENTS[i].required),cake=cakeProfile(state);
  openPanel(`<span class="eyebrow">TU MOCHILA DE EXPLORADORA</span><h2 id="panel-title">${canFinish(state)?'¡Ya puedes hornear!':'Ocho velas. Un deseo.'}</h2><p class="menu-mission">${canFinish(state)?'Tienes las ocho velas, harina, huevos y leche. Vuelve con Alyssia para hornear y soplar.':nextObjective()+'. Los demás ingredientes y los regalos son extras.'}</p>
  <div class="menu-tiles"><button id="menu-map">${icon('leaf')}<b>Mapa</b><small>Elige una estación</small></button><button id="menu-album">${icon('book')}<b>Álbum</b><small>${collectedGifts(state).length} regalos · ${state.treasures.length} estrellas</small></button><button id="menu-alyssia">${icon('cake')}<b>Alyssia</b><small>Pide consejo u hornea</small></button><button id="menu-help">${icon('star')}<b>Cómo jugar</b><small>Controles y reglas</small></button></div>
  <section class="menu-card"><div class="sidebar-heading"><b>Tus velas</b><span>${candles.length} / 8</span></div><div class="candle-tray">${ZONES.map((z,i)=>`<span class="candle-slot ${candles.includes(i)?'collected':''}" role="img" title="Vela de ${z.short}" aria-label="Vela ${i+1}: ${candles.includes(i)?'conseguida':'pendiente'}">${icon('candle')}</span>`).join('')}</div>
  <div class="sidebar-heading ingredient-heading"><b>Para hornear el pastel</b><span>${required.length} / 3</span></div><div class="required-ingredients">${INGREDIENTS.filter(i=>i.required).map((item,i)=>`<span class="food-slot ${ingredients.includes(i)?'collected':''}" aria-label="${item.name}: ${ingredients.includes(i)?'conseguido':'pendiente'}">${icon(item.id)}<b>${item.name}</b><small>${ingredients.includes(i)?'✓ listo':'pendiente'}</small></span>`).join('')}</div><p class="extra-count">${ingredients.length}/8 ingredientes · ${cake.name} · ${state.completed.length}/24 retos</p><button class="text-button" id="menu-cake">Ver cómo va mi pastel →</button></section>
  <section class="menu-card"><div class="sidebar-heading"><b>La casa de Alessandro</b><span>${state.growth} / 10</span></div>${growthHouse(state.growth,{after:state.growth?pose(state.growth,'b'):pose(1,'a'),extra:'menu-house'})}<div class="growth-track">${Array.from({length:10},(_,i)=>`<span class="growth-tick ${i<state.growth?'filled':''} ${state.growth>=8&&i<state.growth?'danger':''}"></span>`).join('')}</div><p class="menu-note">${GROWTH_MESSAGES[state.growth]} <b id="next-growth"></b></p></section>
  <section class="menu-card music-controls" role="group" aria-label="Música de Pandora"><div class="music-now"><span class="music-note" aria-hidden="true">♫</span><span><b id="music-title"></b><small id="music-status"></small></span></div><button class="music-button" id="music-toggle" aria-label="Silenciar música y efectos" aria-pressed="true">${icon('sound')}</button><button class="music-button" id="music-next" aria-label="Siguiente canción" title="Siguiente canción"><span aria-hidden="true">▸▸</span></button><label class="music-volume">Volumen<input type="range" id="music-volume" min="0" max="100" step="1" value="30" aria-label="Volumen de la música"></label></section>
  <p class="autosave-note">${icon('check')} Tu aventura se guarda en este navegador.</p>`,()=>{
    $('#menu-cake').addEventListener('click',openCakePreview);$('#menu-map').addEventListener('click',openMap);$('#menu-album').addEventListener('click',openJournal);
    $('#menu-alyssia').addEventListener('click',()=>{closePanel();goAlyssia();});$('#menu-help').addEventListener('click',()=>{closePanel();$('#help-dialog').showModal();});
    $('#music-toggle').addEventListener('click',toggleSound);$('#music-next').addEventListener('click',()=>music.next());$('#music-volume').addEventListener('keydown',event=>event.stopPropagation());$('#music-volume').addEventListener('input',event=>{music.setVolume(Number(event.target.value)/100);saveAudioPreferences();});
    updateSound();updateClock();
  },{kind:'menu',cls:'menu-dialog'});
}
function growthAlert(){if(!garden||state.status!=='playing')return;sound('error');announce(`¡Otro estirón! ${GROWTH_MESSAGES[state.growth]}`);pendingGrowth=true;preloadGrowth(state.growth+1);showPending();}
// Alessandro's growth poses: before (a) and after (b) each stretch, inside the same house.
const POSES='assets/animations/alessandro/poses/';
const pose=(g,step)=>`${POSES}${String(Math.max(1,Math.min(10,g))).padStart(2,'0')}${step}.webp`;
function preloadGrowth(g){if(g<1||g>9)return;for(const step of ['a','b'])new Image().src=pose(g,step);}
function growthHouse(g,{before='',after=pose(g,'b'),animate=false,extra=''}={}){
  return `<div class="growth-house ${animate?'animate':''} ${extra}" style="--g:${g}" aria-hidden="true"><img class="growth-casa" src="assets/animations/alessandro/casa.webp" alt=""><div class="growth-room">${before?`<img class="pose before" src="${before}" alt="">`:''}<img class="pose after" src="${after}" alt=""></div>${animate?`<span class="growth-sparks">${sparks(12)}</span><span class="growth-dust"><i></i><i></i><i></i></span>`:''}</div>`;
}
function resumeClock(){if(garden&&state?.status==='playing'&&state.clockStarted&&!manualPaused&&!document.hidden&&!$('#pause-dialog').open)clock.start();}
// Short scenes stop the clock so watching them never costs playing time.
function openCutscene(html,kind){
  clock.stop();if(state.status!=='playing')return;
  if(panel.open){if(kind==='stars')pendingStars=true;else pendingGrowth=true;return;}
  cutscene=true;
  openPanel(html,()=>{$('#cutscene-ok').addEventListener('click',closePanel);sceneTimer=setTimeout(closePanel,kind==='growth'?7000:9000);},{kind,cls:`cutscene-dialog ${kind}-dialog`,clock:false});
}
// Scenes wait until the child is back in the garden (after a puzzle, the map or the menu).
function showPending(){
  if(!garden||state?.status!=='playing'||document.querySelector('dialog[open]'))return;
  if(pendingGrowth){pendingGrowth=false;showGrowth(state.growth);}
  else if(pendingStars){pendingStars=false;showStars();}
}
function showGrowth(g){
  if(g<1||g>9)return;
  openCutscene(`<div class="cutscene-stage">${storyBackdrop(g>=7?'dusk':'')}${growthHouse(g,{before:pose(g,'a'),animate:true})}</div><span class="eyebrow">ESTIRÓN ${g} DE 10</span><h2 id="panel-title">¡Otro estirón!</h2><p>${GROWTH_MESSAGES[g]}</p><div class="growth-meter" aria-label="${g} de 10 estirones">${Array.from({length:10},(_,i)=>`<i class="${i<g-1?'filled':i===g-1?'filled new':''}"></i>`).join('')}</div><button class="button primary" id="cutscene-ok">¡A seguir explorando! <span aria-hidden="true">→</span></button>`,'growth');
}
function showStars(){
  openCutscene(`<div class="cutscene-stage stars-stage">${storyBackdrop('festive')}<div class="star-orbit">${Array.from({length:8},(_,i)=>`<i style="--i:${i}">${icon('star')}</i>`).join('')}</div><div class="pandora-party"><img class="pandora-happy" src="assets/characters/pandora.webp" alt=""><span class="pandora-hearts">${Array.from({length:5},(_,i)=>`<i style="--i:${i}">♥</i>`).join('')}</span></div><span class="woof-bubble">¡Guau, guau!</span></div><span class="eyebrow">LOS SECRETOS DE PANDORA · 8 DE 8</span><h2 id="panel-title">¡Pandora encontró todas sus estrellas!</h2><p>Corre, salta y da vueltitas de felicidad con sus ocho estrellas. ¡Gracias por jugar con ella! Las verás en tu álbum.</p><button class="button primary" id="cutscene-ok">¡Bien hecho, Pandora! <span aria-hidden="true">♥</span></button>`,'stars');
}
function goAlyssia(){garden.travelTo({...PARTY,id:'talk',title:'Alyssia'});}
function goNext(){const q=nextRequiredQuest(state);if(q)garden.guideTo({...q,title:ZONES[q.zone].name});else garden.guideTo({...KITCHEN,title:'el horno de Alyssia'});}
function interactWith(target){
  clock.tick();if(state.status!=='playing')return;
  if(target.id==='talk'||target.id==='final'){talk();return;}
  if(target.id?.startsWith('station-')){openStation(Number(target.id.slice(8)));return;}
  const q=QUESTS.find(q=>q.id===target.id);if(q){if(!state.completed.includes(q.id)&&isUnlocked(state,q.zone,q.level))openQuest(q);else openStation(q.zone);}
}
function rewardName(q){return q.level===0?'Una vela de cumpleaños':q.level===1?INGREDIENTS[ZONES[q.zone].ingredient].name:ZONES[q.zone].gift;}
function rewardIcon(q){return q.level===0?'candle':q.level===1?INGREDIENTS[ZONES[q.zone].ingredient].id:'gift';}
function openStation(zone){const z=ZONES[zone];if(!z)return;
  openPanel(`<span class="eyebrow">ESTACIÓN ${zone+1} DE 8 · ${stationProgress(state,zone)} PREMIOS</span><h2 id="panel-title">${z.name}</h2><p>Un reto a la vez. La vela abre el ingrediente; el ingrediente abre el regalo.</p><div class="station-levels">${QUESTS.filter(q=>q.zone===zone).map(q=>{const done=state.completed.includes(q.id),open=isUnlocked(state,zone,q.level);return `<button data-level="${q.id}" class="station-level ${done?'done':''}" ${done||!open?'disabled':''}>${icon(rewardIcon(q))}<span><small>NIVEL ${q.level+1} · ${['FÁCIL','MEDIO','DIFÍCIL'][q.level]}</small><b>${rewardName(q)}</b><em>${challenges[q.id].title}</em></span><strong>${done?'✓':open?'→':icon('lock')}</strong></button>`;}).join('')}</div><p class="quiet-note">${INGREDIENTS[z.ingredient].required?'Este ingrediente es necesario para hornear tu pastel.':'Este ingrediente y el regalo son extras. La vela sí es necesaria.'}</p>`,()=>$$('[data-level]').forEach(b=>b.addEventListener('click',()=>openQuest(QUESTS.find(q=>q.id===b.dataset.level)))));
}
function openQuest(q){
  if(state.status!=='playing'||state.completed.includes(q.id)||!isUnlocked(state,q.zone,q.level))return;
  const data=challenges[q.id];
  openPanel(`<span class="eyebrow">${ZONES[q.zone].short.toUpperCase()} · NIVEL ${q.level+1} · ${['FÁCIL','MEDIO','DIFÍCIL'][q.level]}</span><h2 id="panel-title">${data.title}</h2><div class="prize-preview">${icon(rewardIcon(q))}<span>Tu premio: <b>${rewardName(q)}</b></span></div><div id="puzzle-host"></div><p class="puzzle-exit-note">Las pistas son gratis. El reloj sigue mientras resuelves el reto.</p>`,()=>{
    panel.classList.add('puzzle-dialog');puzzle=new Puzzle($('#puzzle-host'),data,{sound,success:explanation=>complete(q,explanation),mistake:()=>{clock.tick();if(state.status!=='playing')return false;state=makeMistake(state);save();sound('error');return true;}});
  },{kind:'puzzle'});
}
function complete(q,explanation){
  clock.tick();if(state.status!=='playing')return;state=completeQuest(state,q.id);puzzle?.destroy();puzzle=null;updateHud();save();sound('success');
  const ready=canFinish(state),next=QUESTS.find(item=>item.zone===q.zone&&item.level===q.level+1);
  openPanel(`<span class="eyebrow">NIVEL ${q.level+1} SUPERADO · ${ZONES[q.zone].short.toUpperCase()}</span><div class="reward-hero" aria-hidden="true"><span class="reward-rays"></span><span class="reward-sparks">${sparks(10)}</span><div class="reward-icon">${icon(rewardIcon(q))}</div><span class="points-chip">+${[SCORE_RULES.candle,SCORE_RULES.ingredient,SCORE_RULES.gift][q.level]} puntos</span></div><h2 id="panel-title">${q.level===0?'¡Una vela para tu deseo!':q.level===1?'¡'+rewardName(q)+' para el pastel!':'¡Un regalo para Anya!'}</h2><p>${explanation}</p><p class="reward-extra">${q.level===0?`Llevas ${collectedCandles(state).length} de ocho velas.`:q.level===1?INGREDIENTS[ZONES[q.zone].ingredient].required?'Alyssia necesita este ingrediente. ¡Guárdalo con cariño!':'Un ingrediente extra para hacer el pastel aún más especial.':rewardName(q)} ${ready?'¡Ya puedes regresar con Alyssia!':''}</p><div class="reward-actions"><button class="button primary" id="reward-main">${ready?'¡Vamos con Alyssia!':next?'Jugar el nivel '+(next.level+1):'Seguir explorando'} →</button>${next&&!ready?'<button class="text-button" id="reward-other">Buscar otra vela en el mapa</button>':''}${ready?'<button class="text-button" id="reward-cake">Seguir mejorando mi pastel</button>':''}<button class="text-button" id="reward-back">Volver al jardín</button></div>`,()=>{
    $('#reward-main').addEventListener('click',()=>{if(ready){closePanel();goAlyssia();}else if(next)openQuest(next);else{closePanel();goNext();}});$('#reward-other')?.addEventListener('click',openMap);$('#reward-cake')?.addEventListener('click',openCakePreview);$('#reward-back').addEventListener('click',closePanel);
  },{cls:'reward-dialog'});announce(`¡Premio conseguido: ${rewardName(q)}!`);
}
function missingCopy(){const candles=8-collectedCandles(state).length,ingredients=collectedIngredients(state),missing=INGREDIENTS.filter((item,i)=>item.required&&!ingredients.includes(i)).map(i=>i.name.toLowerCase());return [candles?`${candles} ${candles===1?'vela':'velas'}`:'',missing.join(', ')].filter(Boolean).join(' y ');}
function talk(){
  const ready=canFinish(state),next=nextRequiredQuest(state);
  openPanel(`<span class="eyebrow">ALYSSIA · TU HERMANA Y TU GUÍA</span><div class="alyssia-greeting"><img src="assets/characters/alyssia.webp" alt="Alyssia con su cuchara y su bol"><div><h2 id="panel-title">${ready?'¡Vamos a hornear tu deseo!':'¡Hola, mi exploradora!'}</h2><p>${ready?'«¡Ocho velas, harina, huevos y leche! Ya tenemos lo necesario. Yo preparo el pastel y tú piensas en ese deseo tan especial».':`«Yo te espero aquí, en el centro del parque. Todavía necesitamos ${missingCopy()}. Una vela por estación y los tres ingredientes básicos: ¡tú puedes!»`}</p></div></div><div class="alyssia-checklist"><span>${icon('candle')}${collectedCandles(state).length}/8 velas</span>${INGREDIENTS.filter(i=>i.required).map((item,i)=>`<span class="${collectedIngredients(state).includes(i)?'checked':''}">${icon(item.id)}${item.name} ${collectedIngredients(state).includes(i)?'✓':''}</span>`).join('')}</div>${!ready&&next?`<p class="guide-tip">${icon('leaf')} Mi consejo: visita <b>${ZONES[next.zone].name}</b> y juega el nivel ${next.level+1} para conseguir <b>${rewardName(next).toLowerCase()}</b>.</p>`:`<p class="quiet-note">Conseguiste ${collectedIngredients(state).length} de ocho ingredientes. ${cakeProfile(state).name}: ${cakeProfile(state).layers===1?'una capa':cakeProfile(state).layers+' capas'} y ${cakeProfile(state).level} mejoras. No hace falta buscar más para pedir tu deseo.</p>`}<button class="button primary" id="alyssia-action">${ready?state.cake==='baked'?'Llevar las velas al pastel':'Mezclar y hornear el pastel':'¡Llévame al siguiente objetivo!'} →</button>${ready?'<button class="text-button" id="alyssia-cake">Ver y mejorar mi pastel</button>':''}<button class="text-button" id="alyssia-map">Ver las ocho estaciones</button>`,()=>{
    $('#alyssia-action').addEventListener('click',()=>{if(ready){if(state.cake==='baked')showWish();else startBaking();}else{closePanel();goNext();}});$('#alyssia-map').addEventListener('click',openMap);$('#alyssia-cake')?.addEventListener('click',openCakePreview);
  });
}
function startBaking(){
  clock.tick();if(state.status!=='playing'||!canFinish(state))return;
  openPanel(`<span class="eyebrow">EL TALLER DE LOS DESEOS</span><div class="baking-scene"><img src="assets/characters/alyssia.webp" alt="Alyssia horneando"><div class="baking-bowl">${icon('flour')}${icon('eggs')}${icon('milk')}</div><div class="oven-glow"></div></div><h2 id="panel-title">Alyssia está horneando…</h2><p>Harina suave, huevos y leche. Una pizca de cariño y el aroma más rico del cumpleaños.</p><div class="baking-progress" aria-label="Horneando el pastel"><i></i></div>`,()=>{
    bakingEndsAt=state.elapsedMs+2800;
  },{kind:'baking'});
}
function showWish(){
  openPanel(`<span class="eyebrow">OCHO AÑOS · OCHO VELAS · UN DESEO</span><div class="wish-scene">${cakeScene()}<img src="assets/characters/anya.webp" alt="Anya junto a su pastel"><span class="wish-spark">✧</span></div><p class="cake-result-note">${cakeProfile(state).name} · ${cakeProfile(state).count}/8 ingredientes</p><h2 id="panel-title">Cierra los ojos un instante…</h2><p>Alyssia ha puesto tus ocho velas. Pandora espera a tu lado. Alessandro te saluda desde la ventana.</p><label class="wish-choice"><input type="checkbox" id="wish-choice"><span>Deseo que Alessandro deje de crecer<br><small>…¡y que podamos celebrar juntos!</small></span></label><button class="button primary blow-button" id="blow-button" disabled>Soplar las ocho velas ${icon('candle')}</button><p class="quiet-note">Marca tu deseo y toca el botón para soplar.</p>`,()=>{
    $('#wish-choice').addEventListener('change',e=>$('#blow-button').disabled=!e.target.checked);
    $('#blow-button').addEventListener('click',()=>{clock.tick();if(state.status!=='playing')return;state=winGame(state);if(state.status!=='won')return;clock.stop();syncMusic();save();$('#blow-button').disabled=true;$('#blow-button').textContent='¡Fuuuu! Tu deseo está viajando…';$('.birthday-cake',panel).classList.add('blown');$('.birthday-cake',panel).setAttribute('aria-label','Ocho velas apagadas. ¡Deseo pedido!');panel.classList.add('wish-granted');$('.panel-clock>span:nth-of-type(2)',panel).textContent='¡Deseo cumplido!';$('#panel-pause').hidden=true;sound('win');sceneTimer=setTimeout(()=>showEnd(true),1900);});
  },{kind:'wish'});
}
function openMap(){
  openPanel(`<span class="eyebrow">OCHO ESTACIONES · TÚ ELIGES EL CAMINO</span><h2 id="panel-title">El mapa de tu cumpleaños</h2><p class="map-intro">Cada estación tiene tres niveles en orden. Elige un premio abierto y Anya caminará hasta allí. ${collectedCandles(state).length}/8 velas · ${collectedIngredients(state).filter(i=>INGREDIENTS[i].required).length}/3 ingredientes básicos.</p><button class="map-alyssia text-button" id="map-alyssia">${icon('cake')} Volver con Alyssia en el centro →</button><div class="zone-map">${ZONES.map((z,i)=>`<section class="zone-card" style="--zone-color:${z.color}"><div class="zone-card-heading"><span class="station-number">${i+1}</span><h3>${z.name}</h3><span>${stationProgress(state,i)}/3</span></div><p class="station-food">${icon(INGREDIENTS[z.ingredient].id)} ${INGREDIENTS[z.ingredient].name} · ${INGREDIENTS[z.ingredient].required?'necesario para hornear':'ingrediente extra'}</p><div class="zone-quests">${QUESTS.filter(q=>q.zone===i).map(q=>{const done=state.completed.includes(q.id),open=isUnlocked(state,i,q.level);return `<button data-go="${q.id}" ${done||!open?'disabled':''}><span>${done?'✓':icon(rewardIcon(q))}</span><div><small>${LEVEL_NAMES[q.level]}</small><b>${challenges[q.id].title}</b></div><b aria-hidden="true">${done?'✓':open?'→':icon('lock')}</b></button>`;}).join('')}</div></section>`).join('')}</div><p class="quiet-note">Todos los niveles 1 dan una vela. Los regalos del nivel 3 son opcionales.</p>`,()=>{
    $$('[data-go]',panel).forEach(b=>b.addEventListener('click',()=>{const q=QUESTS.find(q=>q.id===b.dataset.go);closePanel();garden.travelTo({...q,title:ZONES[q.zone].name});}));$('#map-alyssia').addEventListener('click',()=>{closePanel();goAlyssia();});
  },{wide:true,kind:'map'});
}
function openJournal(){
  const gifts=collectedGifts(state),ingredients=collectedIngredients(state);
  openPanel(`<span class="eyebrow">RECUERDOS DE UNA AVENTURA EN EQUIPO</span><h2 id="panel-title">El álbum de Anya</h2><div class="journal-stats"><span><b>${collectedCandles(state).length}</b> velas</span><span><b>${ingredients.length}</b> ingredientes</span><span><b>${gifts.length}</b> regalos</span></div><h3 class="journal-section-title">Los ocho ingredientes del pastel</h3><div class="food-album">${INGREDIENTS.map((item,i)=>`<span class="${ingredients.includes(i)?'found':''}">${icon(item.id)}<b>${item.name}</b><small>${item.required?'necesario':'extra'} ${ingredients.includes(i)?'✓':''}</small></span>`).join('')}</div><h3 class="journal-section-title">Los regalos de tus ocho años</h3><div class="discovery-grid gift-album">${ZONES.map((z,i)=>`<article class="discovery-card ${gifts.includes(i)?'discovered':''}">${icon('gift')}<h3>${gifts.includes(i)?z.gift:'Un regalo por descubrir'}</h3><p>${gifts.includes(i)?`Ganaste el nivel difícil en ${z.short}. ¡Un recuerdo de lo que aprendiste!`:`Te espera en el nivel 3 de ${z.name}.`}</p></article>`).join('')}</div><h3 class="journal-section-title">Los secretos de Pandora · ${state.treasures.length}/8</h3><div class="discovery-grid">${TREASURES.map(t=>`<article class="discovery-card ${state.treasures.includes(t.id)?'discovered':''}">${icon(state.treasures.includes(t.id)?'star':'paw')}<h3>${state.treasures.includes(t.id)?t.name:'Un secreto por descubrir'}</h3><p>${state.treasures.includes(t.id)?t.text:'Pídele a Pandora que olfatee y sigue sus huellas.'}</p></article>`).join('')}</div>`,null,{wide:true,kind:'journal'});
}
function findTreasure(t){state=collectTreasure(state,t.id);updateHud();save();sound('success');message(`¡Una estrella secreta! ${t.name}. ${t.text}${state.treasures.length===8?' ¡Encontraste las ocho! Pandora lleva una chispa de oro.':''}`);if(state.treasures.length===8){pendingStars=true;showPending();}}
function pause(){if(!garden||!state.clockStarted||state.status!=='playing'||$('#pause-dialog').open)return;clock.stop();if(state.status!=='playing')return;manualPaused=true;syncMusic();document.body.classList.add('game-paused');garden.stop();save();$('#pause-dialog').showModal();}
function showEnd(won){
  dispose();document.body.classList.remove('in-adventure','time-urgent');if(won){wins++;try{localStorage.setItem('anya-adventure-wins',String(wins));}catch{}sound('win');}
  main.innerHTML=`<section class="end-screen birthday-end ${won?'is-won':'is-lost'}"><div class="end-copy"><span class="eyebrow">${won?'EL DESEO MÁS BONITO SE HACE EN EQUIPO':'A VECES LA MAGIA NECESITA OTRO INTENTO'}</span>${won?`<div class="end-badge">${icon('candle')} 8 VELAS · ${collectedIngredients(state).length} INGREDIENTES · ${collectedGifts(state).length} ${collectedGifts(state).length===1?'REGALO':'REGALOS'}</div>`:''}<h1>${won?'Un deseo cumplido.<br><em class="title-accent">¡Felices ocho, Anya!</em>':'¡CRAC! El estirón<br><em class="title-accent">abrió la casa.</em>'}</h1><p>${won?'¡Fuuuu! Las ocho llamitas se apagaron y tu deseo llegó hasta Alessandro. El hechizo se detuvo, volvió a su tamaño y salió de casa para abrazarte. Alyssia sirve el pastel. Pandora ya mueve la cola.':'Pasaron los diez minutos. Alessandro creció tanto que el tejado salió volando y las paredes se abrieron como una caja de cartón. Todos están bien; ¡pero el hechizo ganó esta vez!'}</p>${scoreCard()}${won?'<div class="birthday-message">Que crezcan tus sueños, tus preguntas<br>y las aventuras que compartes.<br>Te queremos un montón.</div>':`<div class="last-mission">Conseguiste ${collectedCandles(state).length}/8 velas y ${collectedIngredients(state).filter(i=>INGREDIENTS[i].required).length}/3 ingredientes básicos. En otra aventura tendrás otros retos y diez minutos nuevos.</div>`}<button class="button primary" id="end-primary">${won?'Descubrir una aventura nueva':'Volver a intentarlo'} ↗</button><button class="text-button" id="end-home">Volver al inicio</button><p class="end-note">${won?'Ahora toca celebrar fuera de la pantalla. ¡Un abrazo para tu gran equipo!':'Respira, estira los brazos y vuelve cuando estés lista. Anya y Pandora te esperan.'}</p></div><div class="birthday-end-art ${won?'celebration':'collapse-scene'}" role="img" aria-label="${won?'Anya, Alyssia, Alessandro y Pandora celebran con el pastel':'El tejado y las paredes se abren por el estirón de Alessandro'}">${storyBackdrop(won?'festive':'dusk')}${won?`<div class="end-balloons" aria-hidden="true">${balloons(5)}</div><div class="fireworks" aria-hidden="true">${[0,1,2].map(i=>`<span class="firework f${i}">${sparks(12)}</span>`).join('')}</div><span class="celebration-eight">8</span><div class="family-line"><img src="assets/characters/alessandro.webp" alt=""><img src="assets/characters/alyssia.webp" alt=""><img src="assets/characters/anya.webp" alt=""><img src="assets/characters/pandora.webp" alt=""></div>${cakeScene(false)}`:`${houseScene('broken-house')}<div class="debris" aria-hidden="true">${Array.from({length:7},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><div class="dust" aria-hidden="true">${Array.from({length:5},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><img class="loss-anya" src="assets/characters/anya.webp" alt=""><img class="loss-pandora" src="assets/characters/pandora.webp" alt="">`}<span class="end-garden-flower">${icon(won?'flower':'leaf')}</span></div></section>`;
  $('#end-primary').addEventListener('click',newGame);$('#end-home').addEventListener('click',welcome);save();announce(won?'¡Felices ocho años, Anya! Tu deseo detuvo el hechizo de Alessandro.':'Se acabó el tiempo. Alessandro rompió la casa. Puedes empezar otra aventura.');finale(won);countUp(main,won?1700:1100);if(won)sceneTimer=setTimeout(confetti,1400);focusHeading();window.scrollTo({top:0,behavior:'instant'});
}
// A short full-screen moment before the end screen: golden light for the wish, a comic CRAC for the house.
function finale(won){
  if(reducedMotion())return;
  document.body.classList.add('finale-playing');
  const el=document.createElement('div');el.className=`finale ${won?'win':'lose'}`;el.setAttribute('aria-hidden','true');
  el.innerHTML=won?`<div class="finale-ring"></div><div class="finale-sparks">${sparks(16)}</div><div class="finale-title"><small>Ocho velas · un deseo</small><b>¡Deseo cumplido!</b></div>`:`<div class="finale-burst"><b>¡CRAC!</b></div>`;
  document.body.append(el);
  if(!won){const shell=$('.page-shell');shell.classList.add('quake');setTimeout(()=>shell.classList.remove('quake'),900);}
  setTimeout(()=>{el.remove();document.body.classList.remove('finale-playing');},won?2500:1900);
}
function countUp(root,delay=0){
  for(const el of $$('[data-count]',root)){
    const target=Number(el.dataset.count),text=el.firstChild;if(!text)continue;
    if(reducedMotion()||!target){text.textContent=target.toLocaleString('es-CO');continue;}
    text.textContent='0';const start=performance.now()+delay;
    const step=now=>{if(!el.isConnected)return;const t=Math.min(1,Math.max(0,(now-start)/1500));text.textContent=Math.round(target*(1-(1-t)**3)).toLocaleString('es-CO');if(t<1)requestAnimationFrame(step);};
    requestAnimationFrame(step);
  }
}
function confetti(){
  if(reducedMotion()||!$('.birthday-end'))return;const el=document.createElement('div');el.className='confetti';el.setAttribute('aria-hidden','true');
  const colors=['#e2a24f','#8fae86','#d9826c','#9fbfc2','#f0cf72','#c98aa0'];
  el.innerHTML=Array.from({length:110},(_,i)=>`<span class="${['','round','ribbon'][i%3]}" style="--x:${(Math.random()*100).toFixed(1)}%;--drift:${Math.round((Math.random()*2-1)*140)}px;--spin:${Math.round((Math.random()*2-1)*900)}deg;--d:${(Math.random()*1.8).toFixed(2)}s;--t:${(3.2+Math.random()*2.4).toFixed(2)}s;background:${colors[i%colors.length]}"></span>`).join('');
  document.body.append(el);setTimeout(()=>el.remove(),7600);
}
$('#sound-button').addEventListener('click',toggleSound);
$('#help-button').addEventListener('click',()=>{garden?.stop();$('#help-dialog').showModal();});
$$('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
$('#pause-dialog').addEventListener('close',()=>{manualPaused=false;document.body.classList.remove('game-paused');if(!cutscene)resumeClock();syncMusic();showPending();});
$('#help-dialog').addEventListener('close',showPending);
$('#resume-button').addEventListener('click',()=>{$('#pause-dialog').close();$('#garden-canvas')?.focus({preventScroll:true});});
$('#quit-button').addEventListener('click',()=>{save();welcome();});
$('#home-link').addEventListener('click',e=>{e.preventDefault();if(garden)pause();else welcome();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clock.stop();music.setActive(false);audioContext?.suspend();garden?.stop();save();}else if(garden&&state?.clockStarted&&state.status==='playing'&&!manualPaused)pause();});
window.addEventListener('pagehide',()=>{clock.stop();music.setActive(false);save();});
setInterval(()=>{if(garden&&state?.clockStarted&&state.status==='playing'&&!manualPaused&&!document.hidden)clock.tick();},250);
updateSound();welcome();
