// CYTOPLASM v0.5.1 — GDevelop landscape JS event.
// F grab, E throw, R freeze/thaw. Bind physical keys independently of language layout.
(function(){
'use strict';
if(typeof PIXI==='undefined'||typeof document==='undefined')return;
let s=runtimeScene.__cytoplasmPC;
if(!s){
/* CYTOPLASM v0.5.1 — PC-first carry, leap, throw, freeze.
   No ability menu or mouse targeting needed. F carry/drop, E throw, R stasis/release;
   T tether, N restart, A/D move, Space jump. Slime platforms for every stasis orientation. Objects fly more slowly. Weight-limited carrying.
   Single living material with reclaimable biomass. Landscape 1280x720 Canvas2D. */
function createCytoplasm(canvas) {
'use strict';
const W=1280, H=720, ctx=canvas.getContext('2d');
const c={dark:'#0c111e',violet:'#bd91ee',pale:'#e6d6ff',mint:'#87f2d4',amber:'#ffd69a',red:'#ff8c9b'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const mix=(a,b,t)=>a+(b-a)*t;
const now=()=>Date.now()/1000;
let uid=0;
const body=(type,x,y,w,h,mass=1)=>({id:++uid,type,x,y,w,h,mass,vx:0,vy:0,angle:0,omega:0,held:false,fixed:false,stored:null,cost:0,onGround:false,deleted:false,linked:false,connection:false});
const S={room:1,phase:'play',t:0,elapsed:0,biomass:100,player:{x:120,y:604,vx:0,vy:0,w:30,h:46,grounded:false,riding:null,carrying:null,facing:1},bodies:[],links:[],anchors:[],particles:[],platforms:[],door:null,drag:null,active:null,lastThrown:null,keys:{},lastClick:-100,clickRelease:null,mouse:{x:0,y:0},note:'',noteTimer:0,stats:{throws:0,freezes:0,releases:0,links:0,contractions:0,roomCompleted:0},tutorial:0,settled:false,won:false};
const note=(s,time=2.7)=>{S.note=s;S.noteTimer=time};
const liftLimit=()=>.6+S.biomass*.021; // full biomass lifts up to 2.7 mass units
const throwHint='F — ВЗЯТИ  •  SPACE — СТРИБНУТИ  •  E — КИНУТИ  •  R — ЗУПИНИТИ / ЗВІЛЬНИТИ';
function roomSetup(n){
 S.room=n;S.phase='play';S.biomass=100;S.links=[];S.bodies=[];S.particles=[];S.anchors=[];S.lastClick=-100;S.clickRelease=null;S.drag=null;S.active=null;S.lastThrown=null;S.keys={};S.settled=false;
 S.player={x:113,y:604,vx:0,vy:0,w:30,h:46,grounded:false,riding:null,carrying:null,facing:1};
 if(n===1){
  S.platforms=[{x:0,y:632,w:385,h:88},{x:510,y:662,w:126,h:58},{x:850,y:501,w:430,h:219}];
  S.bodies=[body('chair',238,559,85,78,1.0),body('plank',317,583,138,25,.85),body('box',154,584,64,55,1.3)];
  S.door={x:1184,y:437,w:66,h:64};
  S.anchors=[];
  note('F — ВІЗЬМИ ПРЕДМЕТ. SPACE — СТРИБНИ. E — КИНЬ. R — ЗАФІКСУЙ У ПОЛЬОТІ.',8);
 } else {
  S.platforms=[{x:0,y:628,w:434,h:92},{x:713,y:609,w:120,h:111},{x:959,y:477,w:321,h:243}];
  S.bodies=[body('crate',325,590,106,76,2.45),body('chair',213,556,84,78,1.0),body('plank',405,580,122,25,.85)];
  S.anchors=[{id:'A',x:670,y:224},{id:'B',x:890,y:178},{id:'C',x:1010,y:304}];
  S.door={x:1184,y:412,w:66,h:65};
  note('КІМНАТА 2: ВАЖКА СКРИНЯ. БІОМАСА = СИЛА. R — ФІКСУЙ, T — ПРИКРІПИ НИТКУ.',8);
 }
 S.player.y=S.platforms[0].y-S.player.h/2;
}
// An organic cytoplasm cocoon always exposes one generous FLAT, STICKY top,
// regardless of how far the real furniture has rotated. A fixed or tethered
// object remains physically identifiable; slime is its separate walkable skin.
function slimePlatform(b){
 const ca=Math.cos(b.angle), si=Math.sin(b.angle);
 const extentX=(Math.abs(b.w*ca)+Math.abs(b.h*si))/2;
 const extentY=(Math.abs(b.w*si)+Math.abs(b.h*ca))/2;
 const half=Math.max(91,extentX+37);
 return {left:Math.max(0,b.x-half),right:Math.min(W,b.x+half),y:b.y-extentY-14};
}
function slimeSurface(b,x){
 if(!(b.fixed||b.linked))return null;
 const m=slimePlatform(b);
 return x>=m.left && x<=m.right ? m.y : null;
}
function getSurface(body,x){
 const dx=x-body.x, co=Math.cos(body.angle),si=Math.sin(body.angle);
 // Vertical slices through a rotated rectangle: top-most intersection, for walkable faces.
 const hw=body.w/2,hh=body.h/2, pts=[[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(p=>({x:body.x+p[0]*co-p[1]*si,y:body.y+p[0]*si+p[1]*co}));
 const ys=[];for(let i=0;i<4;i++){const a=pts[i],b=pts[(i+1)%4];if((x>=Math.min(a.x,b.x)-.1)&&(x<=Math.max(a.x,b.x)+.1)&&Math.abs(a.x-b.x)>.001)ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}
 if(ys.length<2)return null;
 // Extremely steep sides unsuitable for walking.
 if(Math.abs(si)>.65)return null;
 return Math.min(...ys);
}
function platformSurface(x){return S.platforms.filter(p=>x>=p.x&&x<=p.x+p.w).map(p=>p.y).sort((a,b)=>a-b)}
function pickBody(x,y){
 let best=null,bestScore=Infinity;
 // Prefer real interior hits to padded hit areas, especially when furniture overlaps.
 for(let i=S.bodies.length-1;i>=0;i--){const b=S.bodies[i];if(b.deleted)continue;
  const co=Math.cos(-b.angle),si=Math.sin(-b.angle),dx=x-b.x,dy=y-b.y;
  const rx=dx*co-dy*si,ry=dx*si+dy*co;
  const inside=Math.abs(rx)<=b.w/2&&Math.abs(ry)<=b.h/2;
  if(Math.abs(rx)>b.w/2+10||Math.abs(ry)>b.h/2+10)continue;
  const score=(inside?0:5)+.5*Math.hypot(rx/(b.w/2),ry/(b.h/2))-(b.fixed?.3:0);
  if(score<bestScore){best=b;bestScore=score;}
 }
 return best;
}
function pickAnchor(x,y){return S.anchors.find(a=>dist(a,{x,y})<31)||null}
function findLink(x,y){let best=null,bestDist=18;
 for(const l of S.links){let b=S.bodies.find(o=>o.id===l.bodyId);let a=S.anchors.find(o=>o.id===l.anchorId);if(!b||!a)continue;
  const vx=a.x-b.x,vy=a.y-b.y,t=clamp(((x-b.x)*vx+(y-b.y)*vy)/(vx*vx+vy*vy||1),0,1);const d=Math.hypot(x-(b.x+vx*t),y-(b.y+vy*t));if(d<bestDist){best=l;bestDist=d;}
 }return best;
}
function freezeActive(){
 const b=S.active&&S.bodies.find(o=>o.id===S.active&&!o.deleted);
 if(!b){note('СПОЧАТКУ КИНЬ ПРЕДМЕТ КЛАВІШЕЮ E.');return false;}
 if(b.fixed){note('ЦЕЙ ПРЕДМЕТ УЖЕ ЗАФІКСОВАНИЙ. НАТИСНИ R ДЛЯ ЗВІЛЬНЕННЯ.');return false;}
 if(b.held){note('СПОЧАТКУ ВІДПУСТИ ПРЕДМЕТ.');return false;}
 const cost=Math.round(8+b.mass*5);
 if(S.biomass<cost+7){note('МАЛО БІОМАСИ. ВІДПУСТИ ІНШИЙ ПРЕДМЕТ.');return false;}
 b.stored={vx:b.vx,vy:b.vy,omega:b.omega};b.vx=0;b.vy=0;b.omega=0;b.fixed=true;b.cost=cost;
 S.biomass-=cost;S.stats.freezes++;note('ЗАФІКСОВАНО! ЛИПКА ОБОЛОНКА — СТІЙ ПІД БУДЬ-ЯКИМ КУТОМ. R — ВІДПУСТИТИ.',2.2);return true;
}
function release(b){if(!b||!b.fixed)return false;
 if(S.player.riding===b.id){S.player.grounded=false;S.player.riding=null;}
 b.fixed=false;b.vx=b.stored?.vx||0;b.vy=b.stored?.vy||0;b.omega=b.stored?.omega||0;b.stored=null;
 S.biomass=clamp(S.biomass+b.cost,0,100);b.cost=0;S.stats.releases++;S.links=S.links.filter(l=>l.bodyId!==b.id);b.linked=false;note('ЦИТОПЛАЗМА ПОВЕРНУЛАСЯ ДО ТЕБЕ.',2);return true;
}
function attach(bodyTarget,anchor){
 if(!bodyTarget||!anchor)return false;
 if(S.links.some(l=>l.bodyId===bodyTarget.id&&l.anchorId===anchor.id)){note('ВЖЕ ЗʼЄДНАНО.');return false;}
 if(S.biomass<12){note('НЕ ВИСТАЧАЄ БІОМАСИ ДЛЯ ЖИВОЇ НИТКИ.');return false;}
 // Thaw a stasis body, retaining resources in the new living tether.
 if(bodyTarget.fixed){bodyTarget.fixed=false;bodyTarget.stored=null;S.biomass=Math.min(100,S.biomass+bodyTarget.cost);bodyTarget.cost=0;bodyTarget.vx=0;bodyTarget.vy=0;}
 S.biomass-=12;
 const length=dist(bodyTarget,anchor);
 S.links.push({bodyId:bodyTarget.id,anchorId:anchor.id,length,minLength:160,strength:1.0,auto:true,cost:12,tension:0});
 bodyTarget.linked=true;S.active=bodyTarget.id;S.stats.links++;note('ЖИВА НИТКА! ВОНА СКОРОЧУЄТЬСЯ Й ПІДІЙМАЄ ПРЕДМЕТ.',3);return true;
}
function nearestCarryable(){
 const p=S.player;let best=null,bd=112;
 for(const b of S.bodies){if(b.deleted||b.held||b.fixed||b.linked)continue;
  const d=Math.hypot(b.x-p.x,(b.y-p.y)*1.15);
  if(d<bd){best=b;bd=d;}
 }
 return best;
}
function carryAction(){
 const p=S.player;
 if(p.carrying){const b=S.bodies.find(x=>x.id===p.carrying);p.carrying=null;
  if(b){b.held=false;b.vx=p.vx*.5;b.vy=10;b.omega=0;b.x=p.x+p.facing*(p.w/2+b.w*.55+13);b.y=p.y-b.h*.1;S.active=b.id;}
  note('ПРЕДМЕТ ОПУЩЕНО. F — ПІДНЯТИ ЗНОВУ.',1.7);return true;
 }
 const b=nearestCarryable();
 if(!b){
  const frozen=S.bodies.filter(b=>!b.deleted&&b.fixed).sort((a,b)=>dist(a,p)-dist(b,p))[0];
  if(frozen&&dist(frozen,p)<95){release(frozen);note('ЦИТОПЛАЗМА ПОВЕРНУЛАСЯ. F — ПІДНЯТИ ПРЕДМЕТ.',2);return true;}
  note('ПІДІЙДИ ДО ПРЕДМЕТА ТА НАТИСНИ F.',1.9);return false;
 }
 const limit=liftLimit();
 if(b.mass>limit){note('ЗАНАДТО ВАЖКО! СИЛА ЗАЛЕЖИТЬ ВІД БІОМАСИ. ЗВІЛЬНИ ФІКСОВАНІ ПРЕДМЕТИ.',3.5);return false;}
 p.carrying=b.id;b.held=true;b.vx=0;b.vy=0;b.omega=0;b.angle=0;S.active=b.id;
 syncCarried();note('ПРЕДМЕТ У РУКАХ. СТРИБАЙ SPACE ТА КИДАЙ E.',2.5);return true;
}
function syncCarried(){
 const p=S.player;if(!p.carrying)return;
 const b=S.bodies.find(x=>x.id===p.carrying&&!x.deleted);
 if(!b){p.carrying=null;return;}
 b.x=clamp(p.x+p.facing*(p.w/2+b.w*.55+12),b.w/2,W-b.w/2);
 b.y=p.y-14; // Follows the player even in the air.
 b.angle=p.facing*.065;b.vx=0;b.vy=0;b.omega=0;b.held=true;
}
function throwCarried(){
 const p=S.player;
 const b=S.bodies.find(x=>x.id===p.carrying&&!x.deleted);
 if(!b){note('СПОЧАТКУ ВІЗЬМИ ПРЕДМЕТ КЛАВІШЕЮ F.',2);return false;}
 p.carrying=null;b.held=false;
 // Slow deliberate arc. Its start height depends on the jump, not mouse precision.
 b.vx=p.facing*(365/Math.sqrt(Math.max(1,b.mass*.72)))+p.vx*.34;
 b.vy=-430+Math.min(0,p.vy)*.08;
 b.omega=p.facing*(.86/Math.sqrt(Math.max(.8,b.mass)));
 b.x=clamp(p.x+p.facing*(p.w/2+b.w/2+12),b.w/2,W-b.w/2);
 b.y=p.y-24;
 S.active=b.id;S.lastThrown=b.id;S.stats.throws++;
 note('У ПОЛЬОТІ! R — ЗУПИНИ, ЩЕ РАЗ R — ВІДПУСТИ.',2.4);
 return true;
}
function freezeToggle(){
 const b=S.bodies.find(x=>x.id===S.lastThrown&&!x.deleted);
 if(!b){note('СПОЧАТКУ КИНЬ ПРЕДМЕТ КЛАВІШЕЮ E.',2);return false;}
 if(b.fixed)return release(b);
 if(b.held)return false;
 S.active=b.id;
 return freezeActive();
}
function connectNearest(){
 if(S.room!==2){note('ЖИВІ НИТКИ ЗʼЯВЛЯТЬСЯ У ДРУГІЙ КІМНАТІ.',2);return false;}
 const b=S.bodies.find(x=>x.id===S.lastThrown&&!x.deleted);
 if(!b||!b.fixed){note('СПОЧАТКУ ЗАФІКСУЙ ПРЕДМЕТ КЛАВІШЕЮ R.',2.5);return false;}
 let best=null,bd=500;
 for(const a of S.anchors){const d=dist(a,b);if(d<bd){bd=d;best=a;}}
 if(!best){note('ПІДКИНЬ ПРЕДМЕТ БЛИЖЧЕ ДО ЗЕЛЕНОЇ ОПОРИ.',2.5);return false;}
 return attach(b,best);
}
function doubleClick(){return freezeToggle();} // Backwards-compatible action name; not needed by controls.
function pointerDown(x,y){S.mouse={x,y};}
function pointerMove(x,y){S.mouse={x,y};}
function pointerUp(x,y){S.mouse={x,y};}
// Physical keys: F=а, E=у, R=к on Ukrainian layouts.
const physicalKey={KeyA:'a',KeyD:'d',KeyW:'w',KeyF:'f',KeyE:'e',KeyR:'r',KeyT:'t',KeyN:'n',ArrowLeft:'arrowleft',ArrowRight:'arrowright',ArrowUp:'arrowup',Space:' '};
const ukrainianKey={'ф':'a','в':'d','ц':'w','а':'f','у':'e','к':'r','е':'t','т':'n'};
function normalizeGameKey(k){
 if(k&&typeof k==='object')return physicalKey[k.code]||normalizeGameKey(k.key||'');
 const key=String(k||'').toLowerCase();
 return physicalKey[k]||ukrainianKey[key]||key;
}
function keyDown(k){
 const key=normalizeGameKey(k);
 if(S.keys[key])return; // one-shot actions on the rising edge only
 S.keys[key]=true;
 if(S.phase==='won'){if(key==='n'||key==='enter')roomSetup(1);return;}
 if([' ','space','arrowup','w'].includes(key)&&S.player.grounded){
   S.player.vy=S.player.carrying?-595:-635;
   S.player.grounded=false;S.player.riding=null;
 }
 if(key==='f')carryAction();
 else if(key==='e')throwCarried();
 else if(key==='r')freezeToggle();
 else if(key==='t')connectNearest();
 else if(key==='n')roomSetup(S.room);
}
function keyUp(k){S.keys[normalizeGameKey(k)]=false;}
function resetKeys(){S.keys={};S.drag=null;S.player.vx=0;}
function updatePlayer(dt){
 const p=S.player,prevFeet=p.y+p.h/2;
 const dir=((S.keys.d||S.keys.arrowright)?1:0)-((S.keys.a||S.keys.arrowleft)?1:0);
 if(dir)p.facing=dir;
 const cargo=S.bodies.find(b=>b.id===p.carrying);
 p.vx=dir*(cargo?255/(1+Math.max(0,cargo.mass-1)*.18):255); // instant stop on key release
 p.x=clamp(p.x+p.vx*dt,p.w/2,W-p.w/2);
 // Sticky guardrail only while the feet are standing on a cytoplasm platform.
 // Jump cancels riding, so a deliberate leap is never blocked.
 const slimeRide=S.bodies.find(b=>b.id===p.riding&&!b.deleted&&(b.fixed||b.linked));
 if(slimeRide&&p.grounded){
  const m=slimePlatform(slimeRide);
  p.x=clamp(p.x,m.left+p.w*.36,m.right-p.w*.36);
 }
 p.vy+=1540*dt;p.y+=p.vy*dt;
 p.grounded=false;p.riding=null;
 const landings=[];
 for(const plat of S.platforms){if(p.x+p.w*.37>plat.x&&p.x-p.w*.37<plat.x+plat.w)landings.push({y:plat.y,id:'ground'});}
 for(const b of S.bodies){
  if(b.deleted||b.held)continue;
  const surface=(b.fixed||b.linked)?slimeSurface(b,p.x):getSurface(b,p.x);
  if(surface!==null)landings.push({y:surface,id:b.id});
 }
 const afterFeet=p.y+p.h/2;
 if(p.vy>=-5){for(const l of landings.sort((a,b)=>a.y-b.y)){
  if(prevFeet<=l.y+14&&afterFeet>=l.y&&afterFeet<l.y+50){p.y=l.y-p.h/2;p.vy=0;p.grounded=true;p.riding=l.id==='ground'?null:l.id;break;}
 }}
 if(p.y>H+90){roomSetup(S.room);note('ПРОБУЙ ЩЕ РАЗ. СТВОРИ ПЛАТФОРМУ ІЗ ПРЕДМЕТА.');return;}
 if(p.x>S.door.x-20&&p.x<S.door.x+S.door.w+20&&Math.abs((p.y+p.h/2)-S.platforms[S.platforms.length-1].y)<90){
  S.stats.roomCompleted++;
  if(S.room===1){roomSetup(2);note('КІМНАТА 2. ВАЖКА СКРИНЯ ПОТРЕБУЄ БІОМАСИ. R — СТОП, T — НИТКА.',6)}
  else{S.phase='won';S.won=true;note('ЕКСПЕРИМЕНТ ПРОЙДЕНО!')}
 }
}
function updateBodies(dt){
 for(const b of S.bodies){if(b.deleted||b.fixed||b.held)continue;
  const oldY=b.y, oldBottom=b.y+b.h/2;
  b.vy+=760*dt; // slower ballistic arc gives time for Q
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.angle+=b.omega*dt;
  b.vx*=Math.pow(.994,dt*60);b.omega*=Math.pow(.989,dt*60);
  if(b.x<b.w/2){b.x=b.w/2;b.vx=Math.abs(b.vx)*.5}if(b.x>W-b.w/2){b.x=W-b.w/2;b.vx=-Math.abs(b.vx)*.5}
  for(const p of S.platforms){
   if(b.x+b.w*.3>p.x&&b.x-b.w*.3<p.x+p.w&&b.vy>=0&&oldBottom<=p.y+18&&b.y+b.h/2>=p.y){
    b.y=p.y-b.h/2;b.vy=0;b.vx*=Math.pow(.84,dt*60);b.omega*=Math.pow(.85,dt*60);b.angle*=Math.pow(.96,dt*60);break;
   }
  }
  if(b.y>H+180){b.deleted=true;S.links=S.links.filter(l=>l.bodyId!==b.id);if(S.active===b.id)S.active=null;if(S.lastThrown===b.id)S.lastThrown=null;note('ПРЕДМЕТ ВПАВ. N — ПОВТОРИТИ КІМНАТУ.');}
 }
}
function updateLinks(dt){
 for(let i=S.links.length-1;i>=0;i--){const l=S.links[i],b=S.bodies.find(z=>z.id===l.bodyId),a=S.anchors.find(z=>z.id===l.anchorId);if(!b||b.deleted||!a){S.links.splice(i,1);continue;}
  if(l.auto){l.length=Math.max(l.minLength,l.length-84*dt);S.stats.contractions++;}
  if(b.held||b.fixed)continue;
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
  l.tension=Math.max(0,d-l.length);
  if(l.tension>0){const nx=dx/d,ny=dy/d;
    const pull=Math.min(l.tension*24,1300)*dt/Math.sqrt(b.mass);
    b.vx-=nx*pull;b.vy-=ny*pull;
    b.x-=nx*Math.min(l.tension*.12,3.3);b.y-=ny*Math.min(l.tension*.12,3.3);
    if(l.tension>280){l.strength-=dt*.4;if(l.strength<=0){S.links.splice(i,1);S.biomass=clamp(S.biomass+4,0,100);note('НИТКА НЕ ВИТРИМАЛА НАВАНТАЖЕННЯ!');}}
  }
 }
}
function update(dt){if(S.phase==='won')return;
 dt=clamp(dt,0,.033);S.t+=dt;S.elapsed+=dt;S.noteTimer=Math.max(0,S.noteTimer-dt);
 
 const oldRiding=S.player.riding;const oldRider=S.bodies.find(b=>b.id===oldRiding);const rx=oldRider?.x,ry=oldRider?.y;
 updateBodies(dt);updateLinks(dt);
 if(oldRider && !oldRider.deleted && S.player.vy>=0){S.player.x+=oldRider.x-rx;S.player.y+=oldRider.y-ry;}
 updatePlayer(dt);syncCarried();
}
function rounded(x,y,w,h,r,fill,stroke,width=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function circle(x,y,r,color,stroke,width=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(color){ctx.fillStyle=color;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function text(s,x,y,size=16,color='#e4e5f0',align='left',weight='500'){ctx.fillStyle=color;ctx.textAlign=align;ctx.font=`${weight} ${size}px system-ui,-apple-system,Arial`;ctx.fillText(s,x,y)}
function line(x1,y1,x2,y2,color,width=2,dash=[]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([])}
const seed=(i)=>{let n=Math.sin(i*94.42+8)*43157.419;return n-Math.floor(n)};
function backdrop(){
 const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#111b29');bg.addColorStop(.45,'#18172d');bg.addColorStop(1,'#0a1521');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 for(let i=0;i<23;i++){const x=seed(i+S.room*20)*W,y=seed(i+57)*H,r=35+seed(i+77)*105;ctx.globalAlpha=.065;circle(x,y,r,i%3?'#b28de1':'#7adac6');ctx.globalAlpha=.08;circle(x,y,r,'',i%3?'#f7d6ff':'#8cd7bf',1.4);ctx.globalAlpha=1;}
 ctx.save();ctx.globalAlpha=.15;for(let i=0;i<13;i++){let x=seed(i+17)*W,yy=seed(i+70)*H;ctx.strokeStyle=i%2?'#ad7ee5':'#6bd6b8';ctx.lineWidth=5+seed(i)*6;ctx.beginPath();ctx.moveTo(x,-30);ctx.bezierCurveTo(x-70,yy*.45,x+60,yy,x,720);ctx.stroke();}ctx.restore();
 for(let i=0;i<80;i++){const x=seed(i+90)*W,y=(seed(i+120)*H+S.t*(5+seed(i+150)*9))%H,r=1+seed(i+3)*2;circle(x,y,r,'#96c4d0');}
 // distant laboratory cells and spectral glassware
 ctx.globalAlpha=.3;line(0,640,W,640,'#315565',2,[3,12]);ctx.globalAlpha=1;
}
function drawPlatforms(){for(const p of S.platforms){
 ctx.fillStyle='#1d3542';ctx.fillRect(p.x,p.y,p.w,p.h);
 const grad=ctx.createLinearGradient(0,p.y,0,p.y+42);grad.addColorStop(0,'#74d8c3');grad.addColorStop(.2,'#407c81');grad.addColorStop(1,'#24394e');ctx.fillStyle=grad;ctx.fillRect(p.x,p.y,p.w,15);
 ctx.fillStyle='rgba(153,221,206,.08)';for(let x=p.x+26;x<p.x+p.w;x+=43){circle(x,p.y+28,3,'#92e9d0')}
 line(p.x,p.y,p.x+p.w,p.y,'#b0e5d9',3);
}}
function drawDoor(){const d=S.door;
 ctx.save();ctx.shadowColor='#a9f9e1';ctx.shadowBlur=23;rounded(d.x,d.y,d.w,d.h,28,'rgba(80,164,158,.17)','#91e7d1',3);ctx.restore();
 rounded(d.x+12,d.y+10,d.w-24,d.h-16,18,'rgba(15,34,48,.82)','#7ed6c9',1);for(let i=0;i<3;i++)circle(d.x+d.w/2,d.y+16+i*16,2,'#a5ffda');text('ВИХІД',d.x+d.w/2,d.y-16,14,'#b2e5dd','center','700');}
function drawAnchors(){for(const a of S.anchors){ctx.save();ctx.shadowColor='#73f5c9';ctx.shadowBlur=22;circle(a.x,a.y,23,'rgba(61,208,170,.16)','#86fbd8',4);circle(a.x,a.y,9,'#8df8d4');ctx.restore();for(let k=0;k<7;k++){const ang=k*2*Math.PI/7+S.t*.5;circle(a.x+31*Math.cos(ang),a.y+31*Math.sin(ang),3,'#83ead1');}}}
function drawSlimeCocoon(b){
 const m=slimePlatform(b),cx=b.x,cy=b.y;
 ctx.save();ctx.shadowColor='#81f6db';ctx.shadowBlur=21;
 ctx.beginPath();ctx.ellipse(cx,cy,Math.max(46,(m.right-m.left)*.44),Math.max(b.h*.76,38),0,0,Math.PI*2);
 ctx.fillStyle='rgba(104,235,199,.13)';ctx.fill();ctx.strokeStyle='rgba(153,255,219,.65)';ctx.lineWidth=2;ctx.stroke();
 ctx.shadowBlur=0;
 for(let i=0;i<5;i++){
  const phi=i*1.27+S.t*.3;
  circle(cx+Math.cos(phi)*((m.right-m.left)*.38),cy+Math.sin(phi)*Math.max(26,b.h*.6),2.6,'rgba(196,255,233,.9)');
 }
 ctx.restore();
}
function drawSlimeTop(b){
 const m=slimePlatform(b),ww=m.right-m.left,yy=m.y;
 ctx.save();ctx.shadowColor='#78efd0';ctx.shadowBlur=20;
 rounded(m.left,yy-10,ww,18,10,'rgba(85,240,194,.34)','#A4FFE1',2.6);
 ctx.shadowBlur=0;line(m.left+13,yy-8,m.right-13,yy-8,'rgba(232,255,248,.73)',1.4);
 for(let i=0;i<Math.max(4,Math.floor(ww/35));i++){
  let xx=m.left+18+i*(ww-36)/Math.max(1,Math.floor(ww/35)-1);
  circle(xx,yy+7+Math.sin(S.t*3+i)*2,1.7,'rgba(181,255,226,.74)');
 }
 ctx.restore();
}
function drawBody(b){if(b.fixed||b.linked)drawSlimeCocoon(b);ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);
 if(b.fixed){ctx.shadowBlur=30;ctx.shadowColor='#c7a1ff';circle(0,0,Math.hypot(b.w,b.h)*.56,'rgba(196,145,243,.11)','#cdabfc',1.5);ctx.shadowBlur=10;}
 ctx.shadowColor='rgba(6,3,18,.6)';ctx.shadowBlur=10;
 if(b.type==='chair'){
  rounded(-b.w*.43,-b.h*.45,b.w*.21,b.h*.64,7,'#bd9b81','#f2d0a9',3);
  rounded(-b.w*.40,-b.h*.00,b.w*.8,b.h*.22,4,'#af806c','#f2d0a9',3);
  line(-b.w*.31,b.h*.16,-b.w*.34,b.h*.48,'#e9bd9e',7);line(b.w*.31,b.h*.16,b.w*.36,b.h*.48,'#e9bd9e',7);
 }else if(b.type==='plank'){
 rounded(-b.w/2,-b.h/2,b.w,b.h,8,'#a98072','#e4bc9c',3);line(-b.w*.2,0,b.w*.2,0,'rgba(255,229,194,.37)',2);
 }else if(b.type==='crate'||b.type==='cabinet'){
 rounded(-b.w/2,-b.h/2,b.w,b.h,7,'#765d75','#d8a4b2',3);
 line(0,-b.h*.43,0,b.h*.43,'#edbbbf',2);
 circle(-23,0,4,'#ffe7a7');circle(23,0,4,'#ffe7a7');
 line(-b.w/2+10,b.h/2-18,b.w/2-10,b.h/2-18,'#f2cbad',2);
 }else{
 rounded(-b.w/2,-b.h/2,b.w,b.h,7,'#8e837b','#d1bb93',3);line(-b.w*.3,-b.h*.17,b.w*.3,b.h*.17,'rgba(255,233,195,.35)',2);
 }
 ctx.shadowBlur=0;
 if(b.fixed){ctx.lineWidth=3;ctx.strokeStyle='#e3c1ff';ctx.setLineDash([6,7]);ctx.strokeRect(-b.w/2-7,-b.h/2-7,b.w+14,b.h+14);ctx.setLineDash([]);}
 ctx.restore();
 if(b.fixed||b.linked)drawSlimeTop(b);
 if(S.active===b.id||b.held){const y=b.y-b.h*.65-28;rounded(b.x-57,y-19,114,25,12,'rgba(17,20,35,.85)','#73899b',1);text(b.held?'У РУКАХ':b.fixed?'ФІКСАЦІЯ':'ОСТАННІЙ КИДОК',b.x,y-2,10,b.fixed?'#e2b5ff':'#c7dadd','center','700');}
}
function drawLinks(){for(const l of S.links){const b=S.bodies.find(z=>z.id===l.bodyId),a=S.anchors.find(z=>z.id===l.anchorId);if(!b||!a)continue;
 ctx.save();ctx.shadowBlur=18;ctx.shadowColor='#81f7d1';line(b.x,b.y,a.x,a.y,'#7df4c9',4);ctx.shadowBlur=0;
 const d=dist(a,b),angle=Math.atan2(a.y-b.y,a.x-b.x);for(let k=0;k<7;k++){const f=((k/7+S.t*.17)%1);circle(mix(b.x,a.x,f),mix(b.y,a.y,f),3.2,'#d4ffe9');}
 ctx.restore();
 if(d>l.length+10)text('НАПРУГА',mix(b.x,a.x,.48),mix(b.y,a.y,.48)-15,10,'#ffd59a','center','800');
 }}
function drawPlayer(){const p=S.player,scale=.63+.37*S.biomass/100;
 ctx.save();ctx.translate(p.x,p.y+15);ctx.scale(scale,scale);ctx.translate(0,-15);
 const bob=p.grounded?Math.sin(S.t*11)*(Math.abs(p.vx)>0?2:1):0;
 ctx.shadowColor='#bc8cff';ctx.shadowBlur=23;
 ctx.beginPath();ctx.moveTo(-18,12+bob);ctx.bezierCurveTo(-29,-16+bob,-15,-34+bob,4,-31+bob);ctx.bezierCurveTo(31,-32+bob,30,-5+bob,17,17+bob);ctx.quadraticCurveTo(0,34+bob,-18,12+bob);ctx.fillStyle='#a681e4';ctx.fill();ctx.strokeStyle='#e7c0ff';ctx.lineWidth=2;ctx.stroke();ctx.shadowBlur=0;
 circle(-5,-5+bob,4,'#f4e9ff');circle(8,-5+bob,4,'#f4e9ff');circle(-5,-5+bob,1.8,'#354052');circle(8,-5+bob,1.8,'#354052');
 ctx.beginPath();ctx.arc(2,7+bob,4,.1,Math.PI-.1);ctx.strokeStyle='#382948';ctx.lineWidth=2;ctx.stroke();
 ctx.restore();
 const b=S.bodies.find(b=>b.id===p.carrying);
 if(b){const sign=p.facing;line(p.x+sign*12,p.y-2,b.x-sign*b.w*.32,b.y+6,'#dab3fe',5);circle(p.x+sign*12,p.y-2,4,'#e9d0ff');}
}
function hud(){
 rounded(20,18,430,64,17,'rgba(9,17,31,.82)','#3d5661',1.5);text('CYTOPLASM',38,48,26,'#eddfff','left','900');text('ЖИВА АРХІТЕКТУРА  /  PC PROTOTYPE 0.5.1',39,68,12,'#97b8c1','left','600');
 rounded(1005,18,252,64,17,'rgba(9,17,31,.85)','#3d5661',1.5);text('КІМНАТА '+S.room+' / 2',1238,43,16,'#bff4df','right','800');
 rounded(1020,54,190,9,5,'#2c3d4f');rounded(1020,54,190*S.biomass/100,9,5,S.biomass>30?'#a8e8ca':'#f49aa5');text(Math.round(S.biomass)+'%',1238,65,12,'#e9e0ff','right','700');
 text('СИЛА: '+liftLimit().toFixed(1),1120,76,10,'#97b8c1','center','600');
 if(S.noteTimer>0){rounded(160,91,960,40,15,'rgba(11,21,36,.89)','#486576',1);text(S.note,640,117,14,'#ebf2ff','center','700');}
 rounded(20,670,1240,36,13,'rgba(7,13,24,.9)','#3b5060',1);
 let hint=S.room===1?'A / D — РУХ    •    SPACE — СТРИБОК    •    F — ВЗЯТИ    •    E — КИНУТИ    •    R — СТОП / ПУСТИТИ':'A / D — РУХ    •    SPACE — СТРИБОК    •    F — ВЗЯТИ    •    E — КИНУТИ    •    R — СТОП / ПУСТИТИ    •    T — НИТКА';
 text(hint,640,693,14,'#d9e7e9','center','650');
 if(S.room===1)text('01  /  ВІЗЬМИ → СТРИБНИ → КИНЬ → ЗАФІКСУЙ',640,59,15,'#d5e4dd','center','800');
 else text('02  /  ВАГА ЗАЛЕЖИТЬ ВІД БІОМАСИ → НИТКА → ПІДЙОМ',640,59,15,'#d5e4dd','center','800');
}
function draw(){ctx.clearRect(0,0,W,H);backdrop();drawPlatforms();drawDoor();drawAnchors();drawLinks();
 for(const b of S.bodies)if(!b.deleted)drawBody(b);drawPlayer();
 // No mouse interaction tools; all actions are on the character.
 hud();
 if(S.phase==='won'){
 rounded(300,165,680,360,24,'rgba(11,16,29,.96)','#8cc9b6',2);text('ОБИДВІ КІМНАТИ ПРОЙДЕНО',640,253,29,'#d8ffe8','center','900');
 text('ТИ ЗМІНИВ СВІТ СВОЄЮ МАТЕРІЄЮ.',640,298,18,'#dedafa','center','600');
 text('КИДКИ: '+S.stats.throws+'   •   ФІКСАЦІЇ: '+S.stats.freezes+'   •   НИТКИ: '+S.stats.links,640,344,17,'#a8c6d5','center');
 text('НАТИСНИ N, ЩОБ ЗІГРАТИ ЗНОВУ',640,427,19,'#a6f8d7','center','800');
 }
}
function step(dt){update(dt);draw()}
function getState(){return {room:S.room,phase:S.phase,biomass:S.biomass,player:{...S.player},bodies:S.bodies.filter(x=>!x.deleted).map(x=>({...x})),links:S.links.map(x=>({...x})),anchors:S.anchors.map(x=>({...x})),active:S.active,lastThrown:S.lastThrown,maxLift:liftLimit(),stats:{...S.stats},slimePlatforms:S.bodies.filter(b=>!b.deleted&&(b.fixed||b.linked)).map(b=>({id:b.id,...slimePlatform(b)})),drag:S.drag?{mode:S.drag.mode}:null};}
roomSetup(1);draw();
return {step,draw,update,getState,pointerDown,pointerMove,pointerUp,doubleClick,keyDown,keyUp,resetKeys,resetRoom:roomSetup,freezeActive,release,attach,carryAction,throwCarried,freezeToggle,connectNearest,_unsafeState:S};
}
if(typeof module!=='undefined' && module.exports) module.exports={createCytoplasm};

const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
const game=createCytoplasm(canvas);
const tex=PIXI.Texture.from(canvas);
const sprite=new PIXI.Sprite(tex);sprite.x=0;sprite.y=0;
runtimeScene.getLayer('').getRendererObject().addChild(sprite);
const hint=runtimeScene.getObjects('EditorHint')[0];if(hint&&hint.hide)hint.hide();
s={game,canvas,texture:tex,sprite,keys:{}};runtimeScene.__cytoplasmPC=s;
const physical={KeyA:'a',KeyD:'d',KeyW:'w',KeyF:'f',KeyE:'e',KeyR:'r',KeyT:'t',KeyN:'n',Space:' ',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight',ArrowUp:'ArrowUp'};
window.addEventListener('keydown',function(e){const k=physical[e.code];if(!k)return;e.preventDefault();if(!e.repeat)game.keyDown(k);},true);
window.addEventListener('keyup',function(e){const k=physical[e.code];if(!k)return;e.preventDefault();game.keyUp(k);},true);
window.addEventListener('blur',function(){game.resetKeys();s.keys={};});
}
const input=gdjs.evtTools.input;
for(const key of ['Left','Right','Up','a','d','w','Space','e','f','r','t','n']){
 const code=key==='Left'?'ArrowLeft':key==='Right'?'ArrowRight':key==='Up'?'ArrowUp':key==='Space'?' ':key;
 const pressed=input.isKeyPressed(runtimeScene,key);
 if(pressed&&!s.keys[key])s.game.keyDown(code);
 if(!pressed&&s.keys[key])s.game.keyUp(code);
 s.keys[key]=pressed;
}
const dt=gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(runtimeScene);
s.game.step(Math.min(.033,Math.max(0,dt||.016)));
s.texture.baseTexture.update();
})();