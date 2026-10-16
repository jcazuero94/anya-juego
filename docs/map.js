import { WORLD_SIZE, SPAWN } from './logic.js?v=3';

export const PARTY = { x:1200, y:820 };
export const KITCHEN = { id:'final', x:1330, y:890 };
export const HOUSE = {x:1200,y:620,w:250,h:180};
export const TREES = [
  [90,150,1],[250,140,.8],[470,120,1],[680,100,.85],[930,100,1],[1200,80,.9],[1450,80,.85],[1780,100,1],[2070,100,.8],[2310,150,1],
  [70,970,.8],[85,1220,1],[130,1480,.9],[430,1490,.8],[990,1530,.8],[1550,1510,.9],[2070,1500,.8],[2330,1430,1],[2340,1130,.8],
  [2320,380,.9],[2340,640,1],[70,600,.7],[700,470,.85],[840,920,.8],[1590,580,.9],[1710,840,.75],[640,1460,.7],
  [1210,270,1.6]
].map(([x,y,scale],i)=>({x,y,scale,id:i,type:i===27?'oak':'tree'}));
export const POND = { x:330,y:430,rx:155,ry:110 };
export const BEDS = [{x:1800,y:355,w:120,h:170},{x:1950,y:355,w:120,h:170}];

export function isBlocked(x,y,growth=0,radius=16) {
  if(x<55+radius||y<55+radius||x>WORLD_SIZE.width-55-radius||y>WORLD_SIZE.height-55-radius)return true;
  if(((x-POND.x)/(POND.rx+radius))**2+((y-POND.y)/(POND.ry+radius))**2<1)return true;
  if(BEDS.some(b=>x>b.x-radius&&x<b.x+b.w+radius&&y>b.y-radius&&y<b.y+b.h+radius))return true;
  if(TREES.some(t=>Math.hypot(x-t.x,(y-t.y)*1.2)<20*t.scale+radius))return true;
  if(Math.hypot(x-1200,y-1240)<35+radius)return true;
  if(x>HOUSE.x-HOUSE.w/2-radius&&x<HOUSE.x+HOUSE.w/2+radius&&y>HOUSE.y-80-radius&&y<HOUSE.y+20+radius)return true;
  return x>PARTY.x-35-radius&&x<PARTY.x+35+radius&&y>PARTY.y-22-radius&&y<PARTY.y+15+radius;
}
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const CELL=40,COLS=WORLD_SIZE.width/CELL,ROWS=WORLD_SIZE.height/CELL;
const point=id=>({x:(id%COLS+.5)*CELL,y:(Math.floor(id/COLS)+.5)*CELL});
function nearestCell(pos,growth) {
  const col=Math.max(0,Math.min(COLS-1,Math.floor(pos.x/CELL))),row=Math.max(0,Math.min(ROWS-1,Math.floor(pos.y/CELL)));
  let best=null,bestDistance=Infinity;
  for(let ring=0;ring<8;ring++) {
    for(let y=Math.max(0,row-ring);y<=Math.min(ROWS-1,row+ring);y++)for(let x=Math.max(0,col-ring);x<=Math.min(COLS-1,col+ring);x++) {
      const id=y*COLS+x,p=point(id); if(isBlocked(p.x,p.y,growth))continue;
      const d=distance(pos,p); if(d<bestDistance){best=id;bestDistance=d;}
    }
    if(best!==null)return best;
  }
  return null;
}
export function safePosition(pos,growth=0) { if(!isBlocked(pos.x,pos.y,growth))return {...pos}; const id=nearestCell(pos,growth); return id===null?{...SPAWN}:point(id); }
export function lineClear(a,b,growth=0) {
  const steps=Math.ceil(distance(a,b)/12);
  for(let i=1;i<=steps;i++)if(isBlocked(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps,growth))return false;
  return true;
}
export function findPath(start,goal,growth=0) {
  const from=nearestCell(start,growth),to=nearestCell(goal,growth); if(from===null||to===null)return [];
  const open=new Set([from]),previous=new Map(),scores=new Map([[from,0]]),estimates=new Map([[from,distance(point(from),point(to))]]),blocked=new Map();
  const walkable=id=>{if(!blocked.has(id)){const p=point(id);blocked.set(id,!isBlocked(p.x,p.y,growth));}return blocked.get(id);};
  while(open.size) {
    let current=null,min=Infinity; for(const id of open)if(estimates.get(id)<min){current=id;min=estimates.get(id);}
    if(current===to) {
      const route=[]; for(let id=current;id!==undefined;id=previous.get(id))route.unshift(point(id));
      if(!isBlocked(goal.x,goal.y,growth)&&lineClear(route.at(-1),goal,growth))route.push({...goal});
      const smooth=[]; let anchor={...start};
      for(let i=0;i<route.length;) { let last=i; while(last+1<route.length&&lineClear(anchor,route[last+1],growth))last++; smooth.push(route[last]);anchor=route[last];i=last+1; }
      return smooth;
    }
    open.delete(current); const cx=current%COLS,cy=Math.floor(current/COLS);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const x=cx+dx,y=cy+dy,id=y*COLS+x;
      if(x<0||y<0||x>=COLS||y>=ROWS||!walkable(id))continue;
      if(dx&&dy&&(!walkable(cy*COLS+x)||!walkable(y*COLS+cx)))continue;
      const score=scores.get(current)+(dx&&dy?CELL*Math.SQRT2:CELL);
      if(score>=(scores.get(id)??Infinity))continue;
      previous.set(id,current);scores.set(id,score);estimates.set(id,score+distance(point(id),point(to)));open.add(id);
    }
  }
  return [];
}
export function movePosition(pos,dx,dy,dt,growth=0) {
  const length=Math.hypot(dx,dy);if(!length)return {...pos};
  const speed=225,amount=speed*Math.min(dt,.04)/Math.max(1,length);
  const next={...pos};
  if(!isBlocked(next.x+dx*amount,next.y,growth))next.x+=dx*amount;
  if(!isBlocked(next.x,next.y+dy*amount,growth))next.y+=dy*amount;
  return next;
}
