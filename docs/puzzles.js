import { icon, labels } from './icons.js?v=4.1';
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const $=(s,root)=>root.querySelector(s);
const $$=(s,root)=>[...root.querySelectorAll(s)];

export class Puzzle {
  constructor(host,data,callbacks){
    this.host=host;this.data=data;this.callbacks=callbacks;this.timers=new Set();this.locked=false;this.selected=[];this.matched=[];this.preview=false;
    host.innerHTML=`<div class="puzzle-content"></div><div class="feedback" role="status">Puedes pedir una pista. ¡Vamos, exploradora!</div><div class="hint-panel"><img class="hint-portrait" src="assets/characters/pandora.webp" alt="Pandora"><div class="puzzle-hint"><button class="hint-button">Una pista de Pandora ${icon('paw')}</button></div></div>`;
    this.area=$('.puzzle-content',host);$('.hint-button',host).addEventListener('click',()=>this.hint());this.render();
  }
  later(fn,ms){const id=setTimeout(()=>{this.timers.delete(id);if(this.host.isConnected&&!this.destroyed)fn();},ms);this.timers.add(id);}
  feedback(text,type=''){const el=$('.feedback',this.host);if(el){el.className=`feedback ${type}`;el.textContent=text;}}
  success(){if(this.locked)return;this.locked=true;this.callbacks.success(this.data.explanation);}
  wrong(text,reset){if(this.locked)return;this.locked=true;this.feedback(text,'error');const alive=this.callbacks.mistake();if(alive)this.later(()=>{this.locked=false;reset?.();},800);}
  hint(){
    if(this.locked)return;$('.puzzle-hint',this.host).innerHTML=`<p class="hint-copy">${esc(this.data.hint)}</p><button class="hint-button hint-again">${this.data.type==='memory'?'Ver las cartas otra vez':this.data.type==='sequence'||this.data.type==='recipe'?'Mirar la secuencia':'Recordar la pista'} ${icon('paw')}</button>`;
    $('.hint-again',this.host).addEventListener('click',()=>this.hint());this.callbacks.sound('tap');
    if(this.data.type==='memory'){this.locked=true;this.preview=true;this.drawMemory();this.later(()=>{this.preview=false;this.locked=false;this.drawMemory();},4000);}
    if(['sequence','recipe'].includes(this.data.type)){this.studying=true;this.selected=[];this.drawSequence();}
    if(this.data.type==='maze'){this.showRoute=true;this.drawMaze();}
  }
  choices(options,answer,{visual=false,text=false}={}){
    const row=document.createElement('div');row.className=text?'choice-list':'answer-grid';
    row.innerHTML=options.map((value,i)=>`<button class="answer-button" data-choice="${i}" ${visual?`aria-label="${labels[value]}"`:''}>${visual?icon(value):`${text?`<span class="option-dot" aria-hidden="true">${String.fromCharCode(65+i)}</span>`:''}${esc(value)}`}</button>`).join('');
    this.area.append(row);$$('.answer-button',row).forEach(button=>button.addEventListener('click',()=>{if(this.locked)return;const correct=options[Number(button.dataset.choice)]===answer;if(correct)this.success();else{button.disabled=true;button.classList.add('wrong');this.wrong('Prueba otra idea o pide una pista a Pandora.');}}));
  }
  render(){
    const d=this.data;
    if(d.type==='math'){
      const op=d.operation===1?'−':d.operation===2?'×':'+';
      let picture=d.operation===2?Array.from({length:d.a},()=>`<span class="flower-group bunch">${Array(d.b).fill(icon('flower')).join('')}</span>`).join(''):`<div class="flower-group">${Array(d.a).fill(icon('flower')).join('')}</div><span class="math-sign">${op}</span><div class="flower-group">${Array(d.b).fill(icon(d.operation===1?'leaf':'flower')).join('')}</div>`;
      this.area.innerHTML=`<div class="math-garden${d.operation===2?' grouped':''}" role="img" aria-label="${d.a} ${d.operation===1?'menos':d.operation===2?'grupos de':'más'} ${d.b}">${picture}</div><p class="question">${d.operation===1?`Hay ${d.a} semillas y plantamos ${d.b}. ¿Cuántas quedan?`:d.operation===2?`Hay ${d.a} grupos de ${d.b} flores. ¿Cuántas flores hay en total?`:`Tenemos ${d.a} flores y encontramos ${d.b} más. ¿Cuántas hay en total?`}</p>`;
      this.choices(d.options,d.answer);return;
    }
    if(d.type==='pattern'){
      this.area.innerHTML=`<div class="pattern-row" aria-label="Secuencia: ${d.values.map(v=>d.visual?labels[v]:v).join(', ')}"><div class="pattern-items">${d.values.map(v=>`<span class="pattern-stone">${d.visual?icon(v):v}</span>`).join('')}<span class="pattern-stone">?</span></div></div><p class="question">¿Qué sigue en el camino?</p>`;this.choices(d.options,d.answer,{visual:d.visual});return;
    }
    if(d.type==='care'||d.type==='riddle'){this.area.innerHTML=`<p class="question">${esc(d.question)}</p>`;this.choices(d.options,d.answer,{text:true});return;}
    if(d.type==='observe'){
      this.area.innerHTML=`<div class="observation-garden" role="img" aria-label="Jardín de dibujos: ${d.items.map(s=>labels[s]).join(', ')}">${d.items.map(s=>`<span>${icon(s)}</span>`).join('')}</div><p class="question observation-question">¿Cuántos dibujos como este hay? <span class="target-symbol">${icon(d.target)}<span class="sr-only">${labels[d.target]}</span></span></p>`;this.choices(d.options,d.answer);return;
    }
    if(d.type==='balance'){this.area.innerHTML=`<div class="balance-scale"><span>${d.a} + ${d.b}</span><span class="balance-missing">?</span><span>${d.c}</span></div><p class="question">Elige el signo que compara los dos lados.</p><p class="quiet-note comparator-guide">&lt; menor que · = igual a · &gt; mayor que</p>`;this.choices(d.options,d.answer);return;}
    if(d.type==='memory'){this.drawMemory();return;}
    if(d.type==='word'||d.type==='order'){
      const word=d.type==='word';this.area.innerHTML=`<p class="question">${word?esc(d.clue):`Ordena los números de ${d.descending?'mayor a menor':'menor a mayor'}.`}</p><div class="word-slots" role="status" style="--letters:${word?d.word.length:d.values.length}"></div><div class="letter-tiles"></div><div class="word-actions"><button class="text-button erase">Borrar última</button><button class="button secondary check" disabled>Comprobar ${icon('check')}</button></div>`;
      const values=word?d.letters:d.values;
      $('.letter-tiles',this.area).innerHTML=values.map((v,i)=>`<button class="letter-tile" data-index="${i}" aria-label="${word?'Letra':'Número'} ${v}">${v}</button>`).join('');
      $$('.letter-tile',this.area).forEach(button=>button.addEventListener('click',()=>{if(this.locked||button.disabled)return;this.selected.push(Number(button.dataset.index));button.disabled=true;this.updateTiles();this.callbacks.sound('tap');}));
      $('.erase',this.area).addEventListener('click',()=>{if(this.locked||!this.selected.length)return;const i=this.selected.pop();$(`[data-index="${i}"]`,this.area).disabled=false;this.updateTiles();});
      $('.check',this.area).addEventListener('click',()=>{if(this.locked||this.selected.length!==values.length)return;const attempt=this.selected.map(i=>values[i]),correct=word?attempt.join('')===d.word:attempt.every((v,i)=>v===d.answer[i]);if(correct)this.success();else this.wrong('Casi. Puedes borrar y cambiar el orden con calma.');});this.updateTiles();return;
    }
    if(d.type==='sequence'||d.type==='recipe'){this.studying=true;this.drawSequence();return;}
    if(d.type==='symmetry'){
      this.mirror=Array(9).fill(false);this.area.innerHTML=`<p class="question">Completa el ala derecha como si el centro fuera un espejo.</p><div class="symmetry-wings"><div class="symmetry-grid reference" aria-label="Ala izquierda">${d.pattern.map((v,i)=>`<span class="symmetry-cell ${v?'on':''}" role="img" aria-label="Fila ${Math.floor(i/3)+1}, columna ${i%3+1}: ${v?'hoja':'vacío'}">${v?icon('leaf'):''}</span>`).join('')}</div><span class="mirror-line" aria-hidden="true"></span><div class="symmetry-grid editable" aria-label="Ala derecha">${this.mirror.map((_,i)=>`<button class="symmetry-cell" data-cell="${i}" aria-pressed="false" aria-label="Fila ${Math.floor(i/3)+1}, columna ${i%3+1}"></button>`).join('')}</div></div><button class="button secondary check-mirror">Comprobar las alas ${icon('check')}</button>`;
      $$('[data-cell]',this.area).forEach(button=>button.addEventListener('click',()=>{if(this.locked)return;const i=Number(button.dataset.cell);this.mirror[i]=!this.mirror[i];button.classList.toggle('on',this.mirror[i]);button.innerHTML=this.mirror[i]?icon('leaf'):'';button.setAttribute('aria-pressed',String(this.mirror[i]));}));
      $('.check-mirror',this.area).addEventListener('click',()=>{if(this.mirror.every((v,i)=>v===d.answer[i]))this.success();else this.wrong('Mira los cuadros junto al centro. Las alas deben reflejarse.');});return;
    }
    if(d.type==='maze'){
      this.cell=0;this.moves=0;this.drawMaze();this.keydown=e=>{const dirs={ArrowUp:-d.width,ArrowDown:d.width,ArrowLeft:-1,ArrowRight:1};if(e.key in dirs&&!this.destroyed&&this.host.isConnected&&!document.querySelector('#pause-dialog[open]')){e.preventDefault();this.moveMaze(dirs[e.key]);}};window.addEventListener('keydown',this.keydown);return;
    }
  }
  updateTiles(){const d=this.data,word=d.type==='word',values=word?d.letters:d.values,selection=this.selected.map(i=>values[i]);$('.word-slots',this.area).innerHTML=values.map((_,i)=>`<span class="word-slot" aria-hidden="true">${selection[i]??''}</span>`).join('');$('.word-slots',this.area).setAttribute('aria-label',selection.length?`Tu ${word?'palabra':'orden'}: ${selection.join(', ')}`:'Espacios por completar');$('.check',this.area).disabled=selection.length!==values.length;$('.erase',this.area).disabled=!selection.length;}
  drawMemory(){
    const d=this.data;this.area.innerHTML=`<p class="memory-progress">${this.matched.length/2} de ${d.cards.length/2} parejas encontradas</p><div class="memory-grid ${d.cards.length>=8?'four-columns':''}">${d.cards.map((s,i)=>{const matched=this.matched.includes(i),show=this.preview||matched||this.selected.includes(i);return `<button class="memory-card ${show?'revealed':''} ${matched?'matched':''}" data-card="${i}" aria-label="Carta ${i+1}, ${show?labels[s]:'boca abajo'}${matched?', pareja encontrada':''}" aria-pressed="${show}" ${matched?'disabled':''}>${icon(show?s:'paw',show?'':'card-back')}${matched?'<span class="matched-check">✓</span>':''}</button>`;}).join('')}</div>`;
    $$('.memory-card',this.area).forEach(button=>button.addEventListener('click',()=>{const id=Number(button.dataset.card);if(this.locked||this.selected.includes(id)||this.matched.includes(id))return;this.selected.push(id);this.drawMemory();this.callbacks.sound('tap');if(this.selected.length<2)return;const [a,b]=this.selected;if(d.cards[a]===d.cards[b]){this.matched.push(a,b);this.selected=[];if(this.matched.length===d.cards.length)this.success();else{this.drawMemory();this.feedback('¡Una pareja! Guarda su lugar en tu memoria.','success');}}else this.wrong('Son diferentes. Ya sabes dónde están: ¡eso también ayuda!',()=>{this.selected=[];this.drawMemory();});}));
  }
  drawSequence(){
    const d=this.data;
    if(this.studying){this.area.innerHTML=`<p class="question">${d.type==='recipe'?'La receta de los seis ingredientes':'Escucha con los ojos esta pequeña canción'}:</p><div class="recipe-peek">${d.recipe.map((s,i)=>`<div class="recipe-step"><b>${i+1}</b>${icon(s)}<small>${labels[s]}</small></div>`).join('')}</div><p class="recipe-reminder">Mírala sin prisa. Después, toca los dibujos en ese mismo orden.</p><button class="button secondary recipe-study-button">¡Ya me la sé! <span aria-hidden="true">→</span></button>`;$('.recipe-study-button',this.area).addEventListener('click',()=>{this.studying=false;this.selected=[];this.drawSequence();});return;}
    this.area.innerHTML=`<p class="question">¿Recuerdas el orden?</p><div class="recipe-dots" aria-label="${this.selected.length} de ${d.recipe.length}">${d.recipe.map((_,i)=>`<span class="recipe-dot ${i<this.selected.length?'done':''}"></span>`).join('')}</div><div class="recipe-options" style="--options:${d.pool.length}">${d.pool.map(s=>`<button class="recipe-button" data-symbol="${s}">${icon(s)}${labels[s]}</button>`).join('')}</div><button class="text-button study-again">Volver a mirar</button>`;
    $('.study-again',this.area).addEventListener('click',()=>{if(this.locked)return;this.studying=true;this.selected=[];this.drawSequence();});
    $$('.recipe-button',this.area).forEach(button=>button.addEventListener('click',()=>{if(this.locked)return;const s=button.dataset.symbol;if(s!==d.recipe[this.selected.length]){this.wrong('La secuencia se mezcló. Vamos a mirarla otra vez.',()=>{this.studying=true;this.selected=[];this.drawSequence();});return;}this.selected.push(s);this.callbacks.sound('tap');if(this.selected.length===d.recipe.length)this.success();else this.drawSequence();}));
  }
  drawMaze(){
    const d=this.data;this.area.innerHTML=`<p class="question">Guía la semilla hasta la estrella.</p><div class="maze-grid" style="--columns:${d.width}" role="img" aria-label="Laberinto. Semilla en fila ${Math.floor(this.cell/d.width)+1}, columna ${this.cell%d.width+1}. Estrella en fila ${d.height}, columna ${d.width}.">${d.blocked.map((blocked,i)=>`<span class="maze-cell ${blocked?'hedge':''} ${this.showRoute&&d.solution.includes(i)?'route-hint':''}">${i===this.cell?icon('leaf'):i===d.blocked.length-1?icon('star'):blocked?'':i===0?'<span class="maze-start">•</span>':''}</span>`).join('')}</div><div class="maze-directions"><button data-step="${-d.width}" aria-label="Arriba">↑</button><button data-step="-1" aria-label="Izquierda">←</button><button data-step="${d.width}" aria-label="Abajo">↓</button><button data-step="1" aria-label="Derecha">→</button></div><p class="quiet-note">Flechas o botones. Busca otra ruta si encuentras un seto.</p>`;
    $$('[data-step]',this.area).forEach(button=>button.addEventListener('click',()=>this.moveMaze(Number(button.dataset.step))));
  }
  moveMaze(step){if(this.locked)return;const d=this.data,next=this.cell+step;if(next<0||next>=d.blocked.length||(step===-1&&this.cell%d.width===0)||(step===1&&this.cell%d.width===d.width-1)||d.blocked[next]){this.feedback('Por ahí hay un seto. Prueba otro camino.');return;}this.cell=next;this.moves++;this.callbacks.sound('tap');if(next===d.blocked.length-1)this.success();else this.drawMaze();}
  destroy(){this.destroyed=true;this.timers.forEach(clearTimeout);if(this.keydown)window.removeEventListener('keydown',this.keydown);}
}
