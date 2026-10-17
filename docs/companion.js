import { distance, findPath, isBlocked, safePosition, movePosition } from './map.js?v=3.1';

// Movement is independent of the canvas so pauses, fetch and guiding can be checked without a browser.
export function fetchSpot(owner,facing=1) {
  for(const radius of [155,120,90])for(const angle of [-.2,-.65,.5,-1.1,1.1,Math.PI]) {
    const point={x:owner.x+Math.cos(angle)*radius*facing,y:owner.y+Math.sin(angle)*radius};
    if(isBlocked(point.x,point.y,0,12))continue;
    const route=findPath(owner,point);
    if(route.length&&distance(route.at(-1),point)<12)return point;
  }
  return safePosition({x:owner.x-45*facing,y:owner.y+25});
}
function beside(owner) {
  return [[-42,22],[42,22],[0,46],[0,-46]].map(([x,y])=>({x:owner.x+x,y:owner.y+y})).find(p=>!isBlocked(p.x,p.y))||safePosition(owner);
}
export class Companion {
  constructor(position){this.position={...position};this.route=[];this.job=null;this.ball=null;this.emotion=null;this.walking=false;this.facing=1;}
  cancel(){this.route=[];this.job=null;this.ball=null;}
  cancelGuide(){if(this.job?.type==='guide')this.cancel();}
  lead(route,owner=this.position){
    this.cancel();if(!route.length)return false;
    const far=distance(this.position,owner)>180,first=findPath(this.position,far?owner:route[0]);if(!first.length)return false;
    this.route=[...first,...(far?route:route.slice(1)).map(p=>({...p}))];this.job={type:'guide',ready:false,ownerLength:route.reduce((sum,p,i)=>sum+distance(i?route[i-1]:owner,p),0)};return true;
  }
  get canFollow(){return this.job?.type!=='guide'||this.job.ready;}
  fetch(owner,facing=1){
    this.cancel();const to=fetchSpot(owner,facing);this.job={type:'fetch',phase:'throw',time:0};
    this.ball={from:{...owner},to,x:owner.x,y:owner.y,height:38,phase:'flying'};
  }
  approach(type,owner){this.cancel();this.job={type,phase:'approach',goal:beside(owner),time:0};this.route=findPath(this.position,this.job.goal);}
  sniff(target){this.cancel();this.job={type:'sniff',target};this.route=findPath(this.position,target);}
  advance(dt,speed=260){
    if(!this.route.length)return;
    const target=this.route[0],d=distance(this.position,target),amount=speed*dt;
    if(d<=amount+1){this.position.x=target.x;this.position.y=target.y;this.route.shift();}
    else{this.position.x+=(target.x-this.position.x)/d*amount;this.position.y+=(target.y-this.position.y)/d*amount;}
  }
  update(dt,owner,trail=beside(owner)){
    dt=Math.max(0,Math.min(.04,dt));if(!dt)return null;
    const before={...this.position};let event=null;
    if(this.emotion){this.emotion.time-=dt;if(this.emotion.time<=0)this.emotion=null;}
    const job=this.job;
    if(job?.type==='guide') {
      if(!job.ready||distance(this.position,owner)<145)this.advance(dt,270);
      if(!job.ready){const remaining=this.route.reduce((sum,p,i)=>sum+distance(i?this.route[i-1]:this.position,p),0);if(remaining<job.ownerLength-55||!this.route.length)job.ready=true;}
    } else if(job?.type==='fetch') {
      if(job.phase==='throw') {
        job.time+=dt;const t=Math.min(1,job.time/.65),ball=this.ball;
        ball.x=ball.from.x+(ball.to.x-ball.from.x)*t;ball.y=ball.from.y+(ball.to.y-ball.from.y)*t;ball.height=38*(1-t)+Math.sin(Math.PI*t)*78;
        if(t===1){ball.phase='ground';ball.height=0;job.phase='outbound';this.route=findPath(this.position,ball.to);}
      } else if(job.phase==='outbound') {
        this.advance(dt,285);
        if(distance(this.position,this.ball.to)<16){job.phase='return';job.goal=beside(owner);this.route=findPath(this.position,job.goal);this.ball.phase='carried';}
      } else {
        if(distance(owner,job.goal)>90){job.goal=beside(owner);this.route=findPath(this.position,job.goal);}
        this.advance(dt,265);
        if(distance(this.position,owner)<66){this.cancel();this.emotion={type:'heart',time:2};event='fetch';}
      }
    } else if(job?.type==='treat'||job?.type==='pet') {
      if(job.phase==='approach'){
        if(distance(owner,job.goal)>90){job.goal=beside(owner);this.route=findPath(this.position,job.goal);}
        this.advance(dt,265);
        if(distance(this.position,owner)<70){job.phase='enjoy';job.time=0;this.emotion={type:'heart',time:2.2};}
      } else {
        job.time+=dt;
        if(job.time>1.2){event=job.type;this.cancel();this.emotion={type:'heart',time:1.8};}
      }
    } else if(job?.type==='sniff') {
      if(distance(this.position,owner)>420)this.cancel();else this.advance(dt,240);
    } else if(distance(this.position,trail)>28) {
      if(distance(this.position,trail)>100){if(!this.route.length||distance(this.route.at(-1),trail)>65)this.route=findPath(this.position,trail);this.advance(dt,250);}
      else {const next=movePosition(this.position,trail.x-this.position.x,trail.y-this.position.y,dt);this.position.x=next.x;this.position.y=next.y;}
    } else this.route=[];
    this.walking=distance(before,this.position)>.1;
    if(Math.abs(this.position.x-before.x)>.05)this.facing=this.position.x>before.x?1:-1;
    return event;
  }
}
