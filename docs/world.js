import { WORLD_SIZE, ZONES, QUESTS, TREASURES, collectedCandles, canFinish, stationProgress, rng } from './logic.js?v=3.1';
import { PARTY, KITCHEN, HOUSE, TREES, POND, BEDS, distance, isBlocked, safePosition, findPath, movePosition } from './map.js?v=3.1';

import { Companion } from './companion.js?v=3.1';

const TAU=Math.PI*2;
function ellipse(ctx,x,y,rx,ry,fill) { ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fillStyle=fill;ctx.fill(); }
function rounded(ctx,x,y,w,h,r,fill) { ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill(); }
function star(ctx,x,y,size,fill) { ctx.beginPath();for(let i=0;i<10;i++){const angle=-Math.PI/2+i*Math.PI/5,r=i%2?size*.45:size;ctx.lineTo(x+Math.cos(angle)*r,y+Math.sin(angle)*r);}ctx.closePath();ctx.fillStyle=fill;ctx.fill(); }
function flower(ctx,x,y,size,color) { for(let i=0;i<5;i++)ellipse(ctx,x+Math.cos(i*TAU/5)*size*.6,y+Math.sin(i*TAU/5)*size*.6,size*.5,size*.5,color);ellipse(ctx,x,y,size*.3,size*.3,'#f2d586'); }
function label(ctx,text,x,y,{small=false,color='#365643',paper=true}={}) { ctx.font=`${small?'700 12':'800 14'}px Nunito, sans-serif`;const width=ctx.measureText(text).width+22;if(paper){rounded(ctx,x-width/2,y-12,width,27,8,'#fffbedee');}ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,x,y+2); }

export class Garden {
  constructor(canvas,getState,callbacks) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.getState=getState;this.callbacks=callbacks;
    this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;this.player=safePosition(getState().position,getState().growth);this.companion=new Companion(safePosition({x:this.player.x-48,y:this.player.y+30}));this.dog=this.companion.position;
    this.camera={...this.player};this.path=[];this.keys=new Set();this.walk=0;this.facing=1;this.zoom=1;this.revealed=new Set();this.history=[];this.last=0;this.uiTime=0;this.saveTime=0;this.target=null;
    this.images={};for(const name of ['anya','pandora','alessandro','alyssia']){const img=new Image();img.src=`assets/characters/${name}.webp`;this.images[name]=img;}
    this.ground=this.paintGround();
    this.keydown=e=>{
      if(this.paused()||e.ctrlKey||e.metaKey||e.altKey)return;
      const key=e.key.toLowerCase();
      if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)){e.preventDefault();this.keys.add(key);this.path=[];this.target=null;this.companion.cancelGuide();}
      if((key==='e'||key===' ')&&!e.repeat&&e.target.tagName!=='BUTTON'){e.preventDefault();this.interact();}
    };
    this.keyup=e=>this.keys.delete(e.key.toLowerCase());this.blur=()=>this.keys.clear();
    window.addEventListener('keydown',this.keydown);window.addEventListener('keyup',this.keyup);window.addEventListener('blur',this.blur);
    this.pointer=e=>{if(this.paused())return;const box=canvas.getBoundingClientRect(),sx=e.clientX-box.left,sy=e.clientY-box.top;if(sx>this.width-146&&sx<this.width-14&&sy>14&&sy<102){this.travelTo({x:(sx-this.width+138)/116*2400,y:(sy-21)/74*1600});}else{this.tap({x:(sx-this.width/2)/this.scale+this.camera.x,y:(sy-this.height/2)/this.scale+this.camera.y});}canvas.focus({preventScroll:true});};
    canvas.addEventListener('pointerup',this.pointer);
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
    this.tick=t=>{if(this.destroyed)return;const dt=Math.min(.04,(t-this.last)/1000||.016);this.last=t;if(!this.paused())this.update(dt,t/1000);this.draw(t/1000);this.frame=requestAnimationFrame(this.tick);};
    this.frame=requestAnimationFrame(this.tick);
  }
  paused(){return this.destroyed||document.hidden||document.querySelector('dialog[open]')||this.getState()?.status!=='playing';}
  resize(){const box=this.canvas.getBoundingClientRect();this.width=box.width;this.height=box.height;const dpr=Math.min(2,window.devicePixelRatio||1);this.canvas.width=Math.round(box.width*dpr);this.canvas.height=Math.round(box.height*dpr);this.dpr=dpr;this.scale=(box.width<600?.82:.95)*this.zoom;}
  setZoom(delta){this.zoom=Math.max(.65,Math.min(1.25,this.zoom+delta));this.resize();}
  setDirection(key,pressed){if(pressed){this.keys.add(key);this.path=[];this.target=null;this.companion.cancelGuide();}else this.keys.delete(key);}
  stop(){this.keys.clear();this.path=[];this.target=null;this.companion.cancelGuide();}
  sync(){this.player=safePosition(this.player,this.getState().growth);Object.assign(this.dog,safePosition(this.dog,this.getState().growth));this.companion.cancel();this.path=[];}
  nudge(direction){this.companion.cancelGuide();const [dx,dy]=({arrowup:[0,-1],arrowdown:[0,1],arrowleft:[-1,0],arrowright:[1,0]})[direction];const target={x:this.player.x+dx*48,y:this.player.y+dy*48};if(!isBlocked(target.x,target.y,this.getState().growth)){this.path=findPath(this.player,target,this.getState().growth);this.target=null;}}
  travelTo(target,{guided=false}={}){
    this.companion.cancel();
    const growth=this.getState().growth,station=QUESTS.some(q=>q.id===target.id)||target.id?.startsWith('station-')||target.id==='final'||target.id==='talk';
    const approach=station?[[70,25],[-70,25],[0,85],[70,-25],[-70,-25],[0,-85]].map(([dx,dy])=>({x:target.x+dx,y:target.y+dy})).find(p=>!isBlocked(p.x,p.y,growth)):null;
    const route=findPath(this.player,approach||target,growth);
    if(!route.length){this.callbacks.message('Pandora busca otra ruta. Toca un claro cercano.');return false;}
    this.path=route;this.target=target;this.keys.clear();if(guided)this.companion.lead(route,this.player);this.callbacks.message(`Vamos hacia ${target.title||target.name||'ese rincón'}. Puedes cambiar de camino cuando quieras.`);
    const box=this.canvas.getBoundingClientRect();if(box.top<0||box.bottom>window.innerHeight)this.canvas.scrollIntoView({block:'center',behavior:this.reduced?'instant':'smooth'});return true;
  }
  guideTo(target){const moved=this.travelTo(target,{guided:true});if(moved)this.callbacks.message(`¡Guau! Pandora te guía hacia ${target.title||target.name}. Anya la sigue por el sendero.`);return moved;}
  throwBall(){this.stop();this.history=[];this.companion.fetch(this.player,this.facing);this.callbacks.message('¡Ahí va la pelota! Pandora corre a buscarla y te la traerá.');this.canvas.scrollIntoView({block:'center',behavior:this.reduced?'instant':'smooth'});}
  giveTreat(){this.stop();this.history=[];this.companion.approach('treat',this.player);this.callbacks.message('¡Ven, Pandora! Anya tiene un premio para ti.');this.canvas.scrollIntoView({block:'center',behavior:this.reduced?'instant':'smooth'});}
  cuddle(){this.stop();this.history=[];this.companion.approach('pet',this.player);this.callbacks.message('Pandora se acerca para recibir una caricia de Anya.');}
  tap(point){
    if(distance(point,this.dog)<38){this.callbacks.pet();return;}
    const quest=ZONES.map((z,i)=>({...z,id:`station-${i}`,zone:i,title:z.name})).find(q=>distance(q,point)<65);
    if(quest){this.travelTo(quest);return;}
    if(distance(point,KITCHEN)<55){this.travelTo({...KITCHEN,title:'el horno de Alyssia'});return;}
    if(distance(point,PARTY)<80){this.travelTo({...PARTY,id:'talk',title:'Alyssia'});return;}
    const treasure=TREASURES.find(t=>!this.getState().treasures.includes(t.id)&&this.revealed.has(t.id)&&distance(t,point)<45);
    this.travelTo(treasure||point);
  }
  nearest(){
    const state=this.getState();
    const items=[...ZONES.map((z,i)=>({...z,id:`station-${i}`,zone:i,title:z.name})),{...KITCHEN,title:'Preparar el pastel'}, {...PARTY,id:'talk',title:'Hablar con Alyssia'}];
    return items.filter(item=>distance(item,this.player)<92).sort((a,b)=>distance(a,this.player)-distance(b,this.player))[0]||null;
  }
  interact(){const target=this.nearest();if(target)this.callbacks.interact(target);else this.callbacks.guide();}
  sniff(){
    const available=TREASURES.filter(t=>!this.getState().treasures.includes(t.id)).sort((a,b)=>distance(a,this.player)-distance(b,this.player));
    const target=available[0];if(!target){this.callbacks.message('¡Guau! Encontramos las ocho estrellas. Pandora está muy orgullosa de su equipo.');return;}
    this.revealed.add(target.id);this.companion.sniff(target);
    this.callbacks.message('¡Pandora encontró un olor curioso! Sigue sus huellitas doradas.');
  }
  advance(actor,route,dt,speed){
    if(!route.length)return false;const target=route[0],d=distance(actor,target),amount=speed*dt;
    if(d<amount+2){actor.x=target.x;actor.y=target.y;route.shift();}else{actor.x+=(target.x-actor.x)/d*amount;actor.y+=(target.y-actor.y)/d*amount;}return true;
  }
  update(dt,time){
    const state=this.getState(),before={...this.player};
    const dx=Number(this.keys.has('arrowright')||this.keys.has('d'))-Number(this.keys.has('arrowleft')||this.keys.has('a'));
    const dy=Number(this.keys.has('arrowdown')||this.keys.has('s'))-Number(this.keys.has('arrowup')||this.keys.has('w'));
    if(dx||dy)this.player=movePosition(this.player,dx,dy,dt,state.growth);
    else if(this.companion.canFollow)this.advance(this.player,this.path,dt,225);
    const moved=distance(before,this.player)>.1;
    if(moved){this.walk+=dt*9;if(Math.abs(this.player.x-before.x)>.1)this.facing=this.player.x>before.x?1:-1;this.history.push({...this.player});if(this.history.length>80)this.history.shift();}
    const trail=moved&&this.history.length>12?this.history[this.history.length-12]:{x:this.player.x-45,y:this.player.y+22};
    const dogEvent=this.companion.update(dt,this.player,trail);if(dogEvent)this.callbacks.companion(dogEvent);
    this.camera.x+=(this.player.x-this.camera.x)*Math.min(1,dt*6);this.camera.y+=(this.player.y-40-this.camera.y)*Math.min(1,dt*6);
    const halfW=this.width/this.scale/2,halfH=this.height/this.scale/2;
    this.camera.x=Math.max(halfW,Math.min(WORLD_SIZE.width-halfW,this.camera.x));this.camera.y=Math.max(halfH,Math.min(WORLD_SIZE.height-halfH,this.camera.y));
    for(const treasure of TREASURES){if(state.treasures.includes(treasure.id))continue;if(distance(treasure,this.player)<95)this.revealed.add(treasure.id);if(distance(treasure,this.player)<30){if(this.companion.job?.type==='sniff'&&this.companion.job.target.id===treasure.id)this.companion.cancel();this.callbacks.collect(treasure);}}
    if(this.target&&!this.path.length){const target=this.target;this.target=null;if(target.id&&!target.id.startsWith('spark-')&&distance(this.player,target)<100)this.callbacks.interact(target);}
    this.uiTime+=dt;this.saveTime+=dt;
    if(this.uiTime>.25){this.uiTime=0;const zone=ZONES.map((z,i)=>({...z,i})).sort((a,b)=>distance(a,this.player)-distance(b,this.player))[0];this.callbacks.position({...this.player},zone.i,this.nearest(),this.companion);this.canvas.setAttribute('aria-label',`Jardín explorable. Anya en ${zone.name}. Usa flechas o WASD, toca un lugar para caminar y E para explorar.`);this.canvas.dataset.x=Math.round(this.player.x);this.canvas.dataset.y=Math.round(this.player.y);}
    if(this.saveTime>5){this.saveTime=0;this.callbacks.save();}
  }
  paintGround(){
    const canvas=document.createElement('canvas');canvas.width=WORLD_SIZE.width;canvas.height=WORLD_SIZE.height;const c=canvas.getContext('2d'),random=rng(88);
    c.fillStyle='#b8cca0';c.fillRect(0,0,canvas.width,canvas.height);
    for(let i=0;i<340;i++)ellipse(c,random()*2400,random()*1600,30+random()*120,20+random()*65,i%2?'#c5d5ac55':'#a0b98e33');
    for(const z of ZONES)ellipse(c,z.x,z.y,310,250,z.color+'66');
    const roads=[[[420,1160],[400,850],[440,500]],[[430,1160],[850,1100],[1200,1250],[1990,1160]],[[400,450],[830,520],[1180,350],[1950,390]],[[1200,350],[1150,780],[1200,1250]],[[1940,390],[2040,790],[1990,1160]],[[420,900],[1180,800],[2050,830]]];
    for(const road of roads){c.beginPath();c.moveTo(...road[0]);for(let i=1;i<road.length;i++)c.lineTo(...road[i]);c.lineCap='round';c.lineJoin='round';c.strokeStyle='#a9977044';c.lineWidth=77;c.stroke();c.strokeStyle='#e3d6b0';c.lineWidth=68;c.stroke();c.strokeStyle='#eddfbc';c.lineWidth=48;c.stroke();}
    for(let i=0;i<1100;i++){const x=80+random()*2240,y=80+random()*1440;if(isBlocked(x,y,0,0))continue;if(i%4===0)flower(c,x,y,3+random()*3,['#f2dc9c','#e6b5a3','#fff2d4','#d4b2bf'][Math.floor(i/4)%4]);else{c.strokeStyle='#7e9b6866';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x-2,y-5);c.moveTo(x,y);c.lineTo(x+3,y-4);c.stroke();}}
    ellipse(c,POND.x,POND.y,174,128,'#91ac8580');ellipse(c,POND.x,POND.y,161,116,'#c8c09a');ellipse(c,POND.x,POND.y,155,110,'#89b8bb');ellipse(c,POND.x-20,POND.y-20,126,81,'#a5cdd0');
    for(let i=0;i<4;i++){c.strokeStyle='#d3e3d199';c.lineWidth=2;c.beginPath();c.ellipse(310,430,40+i*25,16+i*12,0,0,TAU);c.stroke();}
    for(const [x,y]of[[245,410],[380,470],[295,495]]){ellipse(c,x,y,18,8,'#6f9d79');flower(c,x-3,y-4,7,'#e7b4be');}
    for(const b of BEDS){rounded(c,b.x-6,b.y-6,b.w+12,b.h+12,10,'#a08c64');rounded(c,b.x,b.y,b.w,b.h,7,'#8f7657');for(let y=b.y+24;y<b.y+b.h;y+=37)for(let x=b.x+20;x<b.x+b.w;x+=36){ellipse(c,x,y,10,7,'#83a464');ellipse(c,x-5,y-4,7,5,'#a8bf7a');}}
    ellipse(c,1950,1190,130,90,'#a9bd8e');for(let i=0;i<80;i++){const a=random()*TAU,r=random()*120;flower(c,1950+Math.cos(a)*r,1190+Math.sin(a)*r*.7,5+random()*5,['#e6adab','#f0d499','#c3b5d3'][i%3]);}
    for(let i=0;i<7;i++){c.strokeStyle='#d0c4a2';c.lineWidth=4;c.beginPath();c.moveTo(1300+i*25,880);c.lineTo(1310+i*25,940);c.stroke();}rounded(c,1110,865,160,85,5,'#e1a98a');for(let i=0;i<6;i++){c.fillStyle='#fff1d633';c.fillRect(1110+i*28,865,11,85);}for(let i=0;i<4;i++){c.fillStyle='#fff1d633';c.fillRect(1110,865+i*24,160,9);}
    c.strokeStyle='#758868';c.lineWidth=8;c.beginPath();c.moveTo(1200,1240);c.lineTo(1170,1290);c.moveTo(1200,1240);c.lineTo(1235,1290);c.moveTo(1200,1240);c.lineTo(1200,1285);c.stroke();c.save();c.translate(1200,1220);c.rotate(-.45);rounded(c,-10,-45,23,70,7,'#b59e67');rounded(c,-14,-48,31,10,4,'#5c7769');c.restore();
    for(let i=0;i<1000;i++)ellipse(c,random()*2400,random()*1600,random()+.2,random()+.2,'#fff9dd18');
    return canvas;
  }
  drawTree(c,tree,time){
    const {x,y,scale:s}=tree;c.save();c.translate(x,y);c.scale(s,s);ellipse(c,5,2,48,17,'#536b4b26');
    c.strokeStyle='#8b7959';c.lineWidth=15;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(-3,-100);c.moveTo(-2,-62);c.lineTo(-29,-88);c.moveTo(-3,-75);c.lineTo(23,-104);c.stroke();
    const sway=Math.sin(time*.7+tree.id)*1.5*(this.getState().growth>5?2:1);c.translate(sway,0);
    for(const [ox,oy,r,col]of[[-33,-109,35,'#718f66'],[28,-122,41,'#7c9b6c'],[-3,-147,44,'#8ba675'],[-37,-143,30,'#91aa78'],[9,-101,40,'#78996b']])ellipse(c,ox,oy,r,r*.8,col);
    for(let i=0;i<8;i++)ellipse(c,Math.sin(i*5.3)*45,-125+Math.cos(i*3.7)*26,8,4,'#b7c78b55');
    if(tree.type==='oak'){rounded(c,-31,-72,63,38,5,'#b99a6e');c.strokeStyle='#8d7552';c.lineWidth=3;c.beginPath();c.moveTo(-31,-53);c.lineTo(31,-53);c.stroke();for(let i=0;i<7;i++){c.fillStyle=['#c7846b','#dac182','#7e9e87'][i%3];c.fillRect(-24+i*7,-67,5,27);}}
    c.restore();
  }
  drawAvatar(c,name,pos,height,time,walking=false,facing=1){
    walking=walking&&!this.reduced;const image=this.images[name];ellipse(c,pos.x,pos.y+2,height*.21,height*.07,'#41543d22');if(!image.complete||!image.naturalWidth)return;
    c.save();c.translate(pos.x,pos.y+(walking?Math.sin(time*14)*2:0));c.scale(facing,1);if(walking)c.rotate(Math.sin(time*13)*.018);
    const w=height*image.naturalWidth/image.naturalHeight;c.drawImage(image,-w/2,-height,w,height);c.restore();
  }
  draw(time){
    if(this.reduced)time=0;
    if(!this.width||!this.height)return;const c=this.ctx,state=this.getState();c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);c.fillStyle='#b8cca0';c.fillRect(0,0,this.width,this.height);c.translate(this.width/2,this.height/2);c.scale(this.scale,this.scale);c.translate(-this.camera.x,-this.camera.y);c.drawImage(this.ground,0,0);
    for(let i=0;i<3;i++){const a=time*.3+i*2;ellipse(c,330+Math.cos(a)*80,430+Math.sin(a)*45,8,3,'#dfb57899');}
    const dogLeading=['guide','sniff'].includes(this.companion.job?.type),route=dogLeading?[this.dog,...this.companion.route]:[this.player,...this.path];
    if(route.length>1){c.strokeStyle=dogLeading?'#d49b3dbb':'#6e8c6588';c.lineWidth=3;c.setLineDash([3,12]);c.lineCap='round';c.beginPath();route.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.setLineDash([]);}
    for(const z of ZONES){const done=collectedCandles(state).includes(ZONES.indexOf(z));label(c,z.name,z.x,z.y-210,{color:done?'#587c49':'#52654c'});}
    for(const treasure of TREASURES){if(state.treasures.includes(treasure.id)||!this.revealed.has(treasure.id))continue;ellipse(c,treasure.x,treasure.y+3,20,8,'#eed19555');star(c,treasure.x,treasure.y-15+Math.sin(time*2)*4,13,'#f6d77a');if(this.companion.job?.type==='sniff'&&this.companion.job.target.id===treasure.id)label(c,'Le huele a tesoro…',treasure.x,treasure.y-48,{small:true});}
    const objects=TREES.map(tree=>({y:tree.y,draw:()=>this.drawTree(c,tree,time)}));
    objects.push({y:HOUSE.y,draw:()=>this.drawHouse(c,state,time)});
    objects.push({y:PARTY.y,draw:()=>{this.drawAvatar(c,'alyssia',PARTY,136,time);label(c,'Alyssia · tu guía',PARTY.x,PARTY.y+26,{small:true});}});
    objects.push({y:this.player.y,draw:()=>{this.drawAvatar(c,'anya',this.player,102,time,this.keys.size>0||this.path.length>0,this.facing);label(c,'Anya',this.player.x,this.player.y+20,{small:true});}});
    objects.push({y:this.dog.y,draw:()=>{this.drawAvatar(c,'pandora',this.dog,52,time,this.companion.walking,this.companion.facing);if(state.treasures.length===8)star(c,this.dog.x,this.dog.y-59,7,'#f5cf65');}});
    for(let i=0;i<ZONES.length;i++){
      const quest=ZONES[i],progress=stationProgress(state,i),done=progress===3,near=distance(quest,this.player)<100;
      ellipse(c,quest.x,quest.y+5,31,11,'#927a4a33');
      if(this.target?.zone===i){c.strokeStyle='#fff8d6';c.lineWidth=3;c.beginPath();c.ellipse(quest.x,quest.y,40+Math.sin(time*3)*3,27,0,0,TAU);c.stroke();}
      rounded(c,quest.x-25,quest.y-59,50,51,13,done?'#749562':'#fff8e3');
      c.textAlign='center';c.textBaseline='middle';c.font='900 22px Nunito, sans-serif';c.fillStyle=done?'#fff5d8':'#ac7b37';c.fillText(done?'✓':String(i+1),quest.x,quest.y-34);
      for(let level=0;level<3;level++)ellipse(c,quest.x-14+level*14,quest.y+4,4,4,progress>level?'#638954':'#f8f1dd');
      if(near||this.target?.zone===i)label(c,progress===0?'Nivel 1 · una vela':progress===1?'Nivel 2 · ingrediente':progress===2?'Nivel 3 · regalo':'¡Los tres premios!',quest.x,quest.y-112,{small:true});
    }
    this.drawCompanionExtras(c,objects,time);
    objects.sort((a,b)=>a.y-b.y).forEach(object=>object.draw());
    rounded(c,KITCHEN.x-30,KITCHEN.y-45,60,49,9,'#c28c63');rounded(c,KITCHEN.x-23,KITCHEN.y-27,46,25,6,'#685e49');ellipse(c,KITCHEN.x,KITCHEN.y-13,13,7,'#efb452');
    if(canFinish(state))for(let i=0;i<3;i++)star(c,KITCHEN.x+Math.sin(time+i)*28,KITCHEN.y-61-i*12,5,'#edcc70');
    if(distance(KITCHEN,this.player)<170||canFinish(state))label(c,canFinish(state)?'¡A hornear tu deseo!':'El horno de Alyssia',KITCHEN.x,KITCHEN.y-90,{small:true});
    for(let i=0;i<8;i++){const x=1930+Math.sin(time*.35+i*5)*150,y=1130+Math.cos(time*.5+i*3)*90,wing=3+Math.abs(Math.sin(time*6+i))*6;ellipse(c,x-wing/2,y,wing,4,i%2?'#e8b2a7':'#f5d580');ellipse(c,x+wing/2,y,wing,4,i%2?'#e8b2a7':'#f5d580');}
    if(state.growth>=6){c.strokeStyle='#fff6d466';c.lineWidth=2;for(let i=0;i<12;i++){const x=(time*70+i*223)%2400,y=150+i*110;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+30,y-10,x+70,y);c.stroke();}}
    c.setTransform(this.dpr,0,0,this.dpr,0,0);this.drawMinimap(c,state);
  }
  drawCompanionExtras(c,objects,time){
    const companion=this.companion,ball=companion.ball,job=companion.job;
    if(ball){const carried=ball.phase==='carried',x=carried?this.dog.x+companion.facing*16:ball.x,y=carried?this.dog.y-17:ball.y,z=carried?0:ball.height;
      objects.push({y:carried?this.dog.y+1:y+2,draw:()=>{if(!carried)ellipse(c,x,y+3,8,3,'#596e4233');ellipse(c,x,y-z-7,8,8,'#dc9271');c.strokeStyle='#fff0ce';c.lineWidth=2;c.beginPath();c.arc(x,y-z-7,5,-1,2);c.stroke();}});
    }
    if(job?.type==='treat'&&job.phase==='approach')objects.push({y:this.player.y+1,draw:()=>{const x=this.player.x+21,y=this.player.y-36;rounded(c,x-8,y-4,16,8,4,'#cbaa69');for(const dx of [-8,8])for(const dy of [-3,3])ellipse(c,x+dx,y+dy,4,4,'#dec387');}});
    if(companion.emotion)objects.push({y:this.dog.y+2,draw:()=>{for(let i=0;i<3;i++){c.font='800 17px Nunito,sans-serif';c.fillStyle='#cc8975';c.textAlign='center';c.fillText('♥',this.dog.x-21+i*21,this.dog.y-62-(this.reduced?0:Math.sin(time*3+i)*7));}}});
    if(job?.type==='guide')label(c,'¡Sígueme, Anya!',this.dog.x,this.dog.y-78,{small:true,color:'#94713d'});
  }
  drawHouse(c,state,time){
    const {x,y,w}=HOUSE,g=state.growth,lift=g*4,shake=g>=7&&!this.reduced?Math.sin(time*8)*1.5:0;
    c.save();c.translate(shake,0);ellipse(c,x,y+8,155,28,'#536b4b25');
    rounded(c,x-w/2,y-175-lift,w,184+lift,12,'#ebcf9d');rounded(c,x-w/2+20,y-151-lift,w-40,151+lift,8,'#ad9870');
    c.save();c.beginPath();c.rect(x-w/2+22,y-150-lift,w-44,150+lift);c.clip();this.drawAvatar(c,'alessandro',{x,y:y-1},133+g*7,time);c.restore();
    c.fillStyle='#c77d65';c.beginPath();c.moveTo(x-w/2-18,y-174-lift);c.lineTo(x,y-263-lift);c.lineTo(x+w/2+18,y-174-lift);c.closePath();c.fill();
    c.strokeStyle='#9d6954';c.lineWidth=5;c.lineJoin='round';c.stroke();
    rounded(c,x+w/2-42,y-238-lift,21,46,3,'#a97e60');
    if(g>=5){c.strokeStyle='#9c785b';c.lineWidth=3;c.beginPath();c.moveTo(x-110,y-132);c.lineTo(x-97,y-108);c.lineTo(x-110,y-92);c.lineTo(x-100,y-70);c.stroke();}
    if(g>=8){c.strokeStyle='#9c785b';c.lineWidth=3;c.beginPath();c.moveTo(x+110,y-146);c.lineTo(x+97,y-110);c.lineTo(x+111,y-80);c.lineTo(x+99,y-37);c.stroke();}
    label(c,'Casa de Alessandro',x,y+31,{small:true});
    if(distance(HOUSE,this.player)<330)label(c,g<5?'«¡Anya, confío en ti!»':'«¡El techo me hace cosquillas!»',x,y-290-lift,{small:true});c.restore();
  }
  drawMinimap(c,state){const width=132,height=88,x=this.width-width-14,y=14;rounded(c,x,y,width,height,11,'#fffbeeeb');c.save();c.translate(x+8,y+7);c.scale((width-16)/2400,(height-14)/1600);for(let i=0;i<ZONES.length;i++){const zone=ZONES[i];ellipse(c,zone.x,zone.y,155,145,zone.color);ellipse(c,zone.x,zone.y,25,25,collectedCandles(state).includes(i)?'#5c8051':'#9b8248');}rounded(c,HOUSE.x-95,HOUSE.y-100,190,125,10,'#b77861');ellipse(c,PARTY.x,PARTY.y,38,38,'#c68b65');ellipse(c,this.player.x,this.player.y,46,46,'#c46f55');c.restore();}
  destroy(){this.destroyed=true;cancelAnimationFrame(this.frame);this.observer.disconnect();window.removeEventListener('keydown',this.keydown);window.removeEventListener('keyup',this.keyup);window.removeEventListener('blur',this.blur);this.canvas.removeEventListener('pointerup',this.pointer);}
}
