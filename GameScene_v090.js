/* CYTOPLASM v0.9 — native GDevelop scene, one continuous micro-world. */
(function(){'use strict';if(typeof PIXI==='undefined'||typeof document==='undefined')return;
let st=runtimeScene.__cytoplasm090;
if(!st){
/* CYTOPLASM v0.9 — CELL ESCAPE. Original arcade physics prototype.
   Context-first jelly: body/biomass, bounce, bubble shields, organelles, viruses, heat, electricity.
   All gameplay and graphics are self-contained. */
function createCytoplasm(canvas,opts={}){
const ctx=canvas.getContext('2d',{alpha:false}),VIEW_W=1280,VIEW_H=720,WORLD=7100,PI=Math.PI,TAU=PI*2;
const C={bg:'#0b1122',pale:'#f1d6ff',pink:'#d0a2fa',purple:'#ae7be9',aqua:'#83f3d3',red:'#ff718e',yellow:'#ffd58d',blue:'#8acbff'};
const clamp=(a,b,c)=>Math.max(b,Math.min(c,a)),lerp=(a,b,t)=>a+(b-a)*t,sqr=(x)=>x*x;
const rand=(a,b)=>a+Math.random()*(b-a);
const platforms=[
 {x:0,y:612,w:420},{x:740,y:588,w:310},{x:1375,y:590,w:385},
 {x:2090,y:590,w:360},{x:2765,y:600,w:390},{x:3470,y:565,w:410},
 {x:4195,y:600,w:365},{x:4880,y:570,w:400},{x:5595,y:590,w:365},
 {x:6280,y:550,w:820}];
const chambers=[{x:0,title:'01 / КЛІТИННИЙ РОЗЛОМ',hint:'Великі прірви долаються лише желе. Клік — постріл; W — стрибок.'},
 {x:1350,title:'02 / БАКТЕРІАЛЬНИЙ КАНАЛ',hint:'Бактерії стріляють! Желе перехоплює снаряди, але не заморожує ворогів.'},
 {x:2750,title:'03 / ВІРУСНА ОРАНЖЕРЕЯ',hint:'Влуч у дивний вірус — він роздується й стане небезпечним супербатутом.'},
 {x:4150,title:'04 / СИНАПТИЧНИЙ КЛАПАН',hint:'Цитоплазма на батареї запускає блискавку і відкриває мембранний затвор.'},
 {x:5590,title:'05 / ГАРЯЧА ТКАНИНА',hint:'Термоклітина підпалює желе. Подолай останню прірву й дістанься ядра виходу.'}];
const checkpoints=[{x:110,y:570},{x:1460,y:545},{x:2830,y:550},{x:4270,y:548},{x:5690,y:540}];
let next=1;
let S;
const sound=(type)=>{try{if(!opts.muted&&typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext)){
 if(!S.audio)S.audio=new (window.AudioContext||window.webkitAudioContext)();const a=S.audio;if(a.state==='suspended')a.resume();let o=a.createOscillator(),g=a.createGain(),now=a.currentTime;let cfg={shoot:[480,195,.08,.045],gel:[230,495,.12,.042],bounce:[185,600,.15,.07],blast:[180,42,.24,.11],hurt:[145,60,.25,.08],collect:[360,880,.19,.06],electric:[850,120,.23,.06],win:[330,790,.38,.08]}[type]||[210,400,.12,.04];o.type=type==='blast'||type==='hurt'?'sawtooth':'sine';o.frequency.setValueAtTime(cfg[0],now);o.frequency.exponentialRampToValueAtTime(Math.max(30,cfg[1]),now+cfg[2]);g.gain.setValueAtTime(cfg[3],now);g.gain.exponentialRampToValueAtTime(.001,now+cfg[2]);o.connect(g);g.connect(a.destination);o.start(now);o.stop(now+cfg[2]+.02);
 }}catch(e){} };
function entity(type,x,y,extra={}){return {id:next++,type,x,y,originX:x,originY:y,vx:0,vy:0,alive:true,phase:rand(0,TAU),...extra};}
function start(){
 S={phase:'play',t:0,elapsed:0,cam:0,screenShake:0,flash:0,notice:'',noticeFor:0,section:-1,
 p:{x:108,y:566,vx:0,vy:0,r:19,grounded:false,dir:1,hp:3,invuln:0,combo:0,bounceCd:0,respawn:0},
 bio:5,maxBio:5,boost:0,boostCollected:false,keys:{},mouse:{x:480,y:390,valid:false},
 pads:[],shots:[],bullets:[],objects:[],enemies:[],pickups:[],particles:[],rings:[],walls:[{x:3840,y:393,w:35,h:172,open:false,type:'membrane'}],
 cells:[{x:3763,y:500,type:'battery',used:false},{x:5860,y:510,type:'hot',used:false}],door:{x:6910,y:452},lastPad:0,shotCd:0,stats:{shots:0,blocks:0,falls:0,blasts:0,virusHits:0,enemies:0,pickups:0},audio:null};
 S.objects=[entity('organelle',1195,446,{vx:78,lo:1150,hi:1285,size:29}),entity('organelle',4662,443,{vx:-60,lo:4610,hi:4750,size:30}),entity('organelle',6115,455,{vx:65,lo:6050,hi:6215,size:28})];
 S.enemies=[entity('bacteria',1565,560,{patrol:[1450,1705],vx:40,fireCd:1.8,hp:2}),entity('bacteria',2250,560,{patrol:[2150,2380],vx:-50,fireCd:1.1,hp:2}),
 entity('virus',2930,551,{patrol:[2825,3080],vx:32,hp:2,inflated:0,inflateTime:0}),entity('bacteria',3690,535,{patrol:[3520,3800],vx:43,fireCd:1.7,hp:2}),
 entity('virus',4450,551,{patrol:[4280,4510],vx:-38,hp:2,inflated:0,inflateTime:0}),entity('bacteria',5100,540,{patrol:[4930,5190],vx:-50,fireCd:1.3,hp:2}),
 entity('bacteria',5770,560,{patrol:[5680,5870],vx:30,fireCd:1.8,hp:2}),entity('virus',6590,507,{patrol:[6460,6760],vx:38,hp:2,inflated:0,inflateTime:0})];
 S.pickups=[{x:815,y:515,type:'cell',value:1.2},{x:1515,y:510,type:'cell',value:1.3},{x:2165,y:525,type:'cell',value:1.3},
 {x:2845,y:526,type:'cell',value:1.2},{x:3033,y:514,type:'booster'},
 {x:3525,y:485,type:'cell',value:1.2},{x:4300,y:530,type:'cell',value:1.1},
 {x:4930,y:500,type:'cell',value:1.2},{x:5655,y:516,type:'cell',value:1.3},{x:6440,y:474,type:'cell',value:1.5}].map(x=>({...x,got:false}));
 say('КЛІК — ЦИТОПЛАЗМА • A/D — РУХ • W — СТРИБОК • R — ПІДІРВАТИ НАВЕДЕНЕ ЖЕЛЕ',6);
}
function say(s,t=3){S.notice=s;S.noticeFor=t;}
function particles(x,y,n,color='#d4a0ff',power=230,home=false){n=Math.min(n,40);for(let i=0;i<n;i++){let a=rand(0,TAU),v=rand(.2,1)*power;S.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.25,.65),max:.65,size:rand(2,6),color,home});}if(S.particles.length>270)S.particles.splice(0,S.particles.length-270);}
function ring(x,y,r,col){S.rings.push({x,y,r:6,max:r,color:col,life:.4,total:.4});}
function pSize(){return 10.5+1.9*S.bio+(S.boost>0?1.2:0)}
function rayRect(ax,ay,bx,by,q){let dx=bx-ax,dy=by-ay,low=0,high=1;const pp=[-dx,dx,-dy,dy],qq=[ax-q.x,q.x+q.w-ax,ay-q.y,q.y+q.h-ay];for(let i=0;i<4;i++){if(Math.abs(pp[i])<.000001){if(qq[i]<0)return null;}else{const t=qq[i]/pp[i];if(pp[i]<0)low=Math.max(low,t);else high=Math.min(high,t);if(low>high)return null;}}return low;}
function firstObstacle(ax,ay,bx,by){let hit=null;function probe(r,kind){const t=rayRect(ax,ay,bx,by,r);if(t!==null&&(!hit||t<hit.t))hit={t,kind,x:lerp(ax,bx,t),y:lerp(ay,by,t)};}
 for(const w of S.walls)if(!w.open)probe(w,'wall');for(const p of platforms)probe({x:p.x,y:p.y,w:p.w,h:VIEW_H-p.y},'tissue');return hit;}
function inReach(x,y){const p=S.p;return Math.hypot(x-p.x,y-p.y)<355;}
function shoot(wx,wy){if(S.phase!=='play'||S.shotCd>0)return false;const p=S.p;if(!inReach(wx,wy)){say('ПОСТРІЛ ЗАНАДТО ДАЛЕКО. РУХАЙСЯ ВПЕРЕД, БУДУЙ ПЛАТФОРМИ!',1.6);return false;}
 if(S.bio<.999){say('ЦИТОПЛАЗМИ НЕМАЄ! ДОЧЕКАЙСЯ ПОВЕРНЕННЯ ЖЕЛЕ АБО ЗБЕРИ БІОКАПСУЛУ.',2);return false;}
 const ox=p.x+p.dir*18,oy=p.y-4,dist=Math.hypot(wx-ox,wy-oy);p.dir=wx>=p.x?1:-1;
 S.bio=Math.max(0,S.bio-1);S.shotCd=.18;S.stats.shots++;S.shots.push({x:ox,y:oy,ox,oy,tx:wx,ty:wy,dur:clamp(dist/1900,.12,.28),t:0,trail:[],dead:false});
 particles(ox,oy,7,C.pink,145);sound('shoot');return true;}
function newPad(x,y,kind='basic',ref=null){let gel={id:next++,x,y,kind,ref,age:0,maxAge:kind==='virus'?6.5:kind==='organelle'?7:kind==='electric'?2.6:kind==='fire'?4.6:7.5,
 rx:kind==='virus'?78:kind==='organelle'?68:kind==='electric'?70:kind==='fire'?70:82,ry:kind==='virus'?49:kind==='organelle'?43:41,hp:2,dead:false,pulse:rand(0,TAU),cost:1};
 S.pads.push(gel);S.lastPad=gel.id;particles(x,y,23,kind==='electric'?C.blue:kind==='fire'?'#ffa45a':C.pink,165);ring(x,y,86,C.pink);sound('gel');return gel;}
function refund(pad,fract=1){S.bio=Math.min(S.maxBio,S.bio+fract*pad.cost);particles(pad.x,pad.y,9,C.aqua,130,true);}
function pop(pad,mode='expire'){if(!pad||pad.dead)return;pad.dead=true;let obj=S.objects.find(o=>o.id===pad.ref?.id);if(obj){obj.capturedBy=null;obj.vx=pad.ref.oldVx||65;}
 refund(pad,mode==='blast'?.85:mode==='shield'?.75:1);if(mode!=='blast'){ring(pad.x,pad.y,80,C.aqua);particles(pad.x,pad.y,19,C.pink,220);sound('gel');}}
function damageEnemy(e,amount=1,forceX=0){if(!e||!e.alive)return;e.hp-=amount;e.vx+=forceX;if(e.hp<=0){e.alive=false;S.stats.enemies++;particles(e.x,e.y,32,e.type==='virus'?'#f7a4ff':'#8cffb7',320);ring(e.x,e.y,120,C.aqua);if(e.type==='virus'||Math.random()<.48)S.pickups.push({x:e.x,y:e.y-10,type:'cell',value:1.1,got:false});sound('blast');}else{particles(e.x,e.y,12,C.red,120);}}
function detonate(pad,fromHit=false){if(!pad||pad.dead)return false;pad.dead=true;const rel=S.objects.find(o=>o.id===pad.ref?.id);if(rel){rel.capturedBy=null;rel.vx=pad.ref.oldVx||70;}S.stats.blasts++;ring(pad.x,pad.y,pad.kind==='virus'?290:190,pad.kind==='fire'?'#ffad72':C.pink);particles(pad.x,pad.y,pad.kind==='virus'?42:32,pad.kind==='fire'?'#ffbb70':C.pink,420);refund(pad,.8);S.screenShake=8;S.flash=.20;sound('blast');
 const rad=pad.kind==='virus'?230:pad.kind==='fire'?200:155;const p=S.p;let pd=Math.hypot(p.x-pad.x,p.y-pad.y);if(pd<rad){let nx=(p.x-pad.x)/(pd||1),ny=(p.y-pad.y)/(pd||1);p.vx+=nx*(rad-pd)*1.9;p.vy=Math.min(p.vy,-360-((rad-pd)/rad)*350);}
 for(const e of S.enemies){if(e.alive&&Math.hypot(e.x-pad.x,e.y-pad.y)<rad)damageEnemy(e,1,(e.x>=pad.x?1:-1)*170);}
 for(const b of S.bullets){if(Math.hypot(b.x-pad.x,b.y-pad.y)<rad)b.dead=true;}
 if(pad.kind==='fire'){for(const e of S.enemies)if(e.alive&&Math.abs(e.x-pad.x)<215)damageEnemy(e,1);}
 for(const other of S.pads)if(!other.dead&&other.id!==pad.id&&Math.hypot(other.x-pad.x,other.y-pad.y)<95){other.chainIn=.13+Math.random()*.2;}
 return true;}
function spawnGel(x,y){ // second shot on existing gel => explosion, NOT stacked free modes
 for(const gel of S.pads){if(!gel.dead&&Math.hypot(x-gel.x,y-gel.y)<Math.max(gel.rx,gel.ry)*.93){detonate(gel,true);S.bio=Math.min(S.maxBio,S.bio+.8);return;}}
 for(const enemy of S.enemies){if(enemy.alive&&Math.hypot(x-enemy.x,y-enemy.y)<43){
  if(enemy.type==='virus'){enemy.inflated=Math.min(2.7,(enemy.inflated||0)+1);enemy.inflateTime=5;S.stats.virusHits++;newPad(enemy.x,enemy.y-5,'virus',{id:enemy.id});say('ВІРУС РОЗДУВАЄТЬСЯ! СУПЕРБАТУТ ЗАРЯДЖАЄТЬСЯ.',2.2);}
  else {enemy.vx+=(enemy.x>=S.p.x?165:-165);damageEnemy(enemy,.5);newPad(x,y-25,'basic');say('БАКТЕРІЮ МОЖНА ВІДКИНУТИ, АЛЕ НЕ ЗАМОРОЗИТИ.',2.3);}
  return;
 }}
 for(const c of S.cells){if(Math.hypot(x-c.x,y-c.y)<54){if(c.type==='battery'){newPad(c.x,c.y-20,'electric');c.used=true;c.chargeFx=2.0;S.walls.forEach(w=>w.open=true);ring(c.x,c.y,300,C.blue);S.stats.blocks++;particles(3840,445,32,C.blue,280);for(const e of S.enemies)if(e.alive&&Math.abs(e.x-c.x)<390)damageEnemy(e,1);say('ЕЛЕКТРИЧНИЙ ІМПУЛЬС! МЕМБРАННИЙ КЛАПАН ВІДКРИТО.',3.2);sound('electric');return;}
 if(c.type==='hot'){newPad(c.x,c.y-10,'fire');c.used=true;for(const e of S.enemies)if(e.alive&&Math.abs(e.x-c.x)<180)damageEnemy(e,1);say('ГАРЯЧА КЛІТИНА ЗАПАЛИЛА ЦИТОПЛАЗМУ!',2.1);return;}
 }}
 for(const o of S.objects){if(o.alive&&Math.hypot(x-o.x,y-o.y)<o.size+40){o.oldVx=o.vx;o.vx=0;o.capturedBy=true;newPad(o.x,o.y,'organelle',{id:o.id,oldVx:o.oldVx});say('РУХОМА ОРГАНЕЛА ЗАФІКСОВАНА — ТЕПЕР ЦЕ ПЛАТФОРМА!',2);return;}}
 newPad(x,y);
}
function keyName(k){if(typeof k==='object'){if(k.code==='KeyW')return 'w';if(k.code==='KeyA')return 'a';if(k.code==='KeyD')return 'd';if(k.code==='KeyR')return 'r';if(k.code==='KeyN')return 'n';return (k.key||'').toLowerCase();}return String(k).toLowerCase();}
function keyDown(k){const s=keyName(k);if(s==='n'){start();return;}if(S.keys[s])return;S.keys[s]=true;
 if(S.phase==='win')return;
 if(s==='w'){if(S.p.grounded){S.p.vy=-615;S.p.grounded=false;S.p.bounceCd=.15;sound('bounce');}else{for(const g of S.pads)if(!g.dead&&Math.hypot(S.p.x-g.x,S.p.y-g.y)<g.rx+23){S.p.vy=Math.min(S.p.vy,-450);S.p.bounceCd=.2;break;}}}
 if(s==='r'){const wx=S.mouse.valid?S.mouse.x+S.cam:S.p.x+S.p.dir*100,wy=S.mouse.valid?S.mouse.y:S.p.y-20;let gels=S.pads.filter(g=>!g.dead);gels.sort((a,b)=>Math.hypot(a.x-wx,a.y-wy)-Math.hypot(b.x-wx,b.y-wy));if(gels[0]&&Math.hypot(gels[0].x-wx,gels[0].y-wy)<180)detonate(gels[0]);else say('НАВЕДИ КУРСОР НА ЖЕЛЕ ТА НАТИСНИ R.',1.2);}}
function keyUp(k){S.keys[keyName(k)]=false;}
function pointerMove(x,y){S.mouse={x,y,valid:true};}
function pointerDown(x,y,button=0){pointerMove(x,y);if(button!==0)return false;return shoot(x+S.cam,y);}
function hurt(){const p=S.p;if(p.invuln>0||S.phase!=='play')return;p.hp--;p.invuln=1.2;p.vx=-p.dir*210;p.vy=-310;S.screenShake=13;S.flash=.3;particles(p.x,p.y,23,C.red,220);sound('hurt');say('УКРИТТЯ З ЖЕЛЕ БЛОКУЄ ВОРОЖІ СНАРЯДИ!',2);if(p.hp<=0)respawn();}
function respawn(){S.stats.falls++;const cp=checkpoints[S.p.respawn];const p=S.p;p.x=cp.x;p.y=cp.y;p.vx=0;p.vy=0;p.hp=3;p.invuln=1.2;p.grounded=false;S.bio=Math.max(S.bio,3);if(S.boost>0)S.boost=Math.min(S.boost,15);S.bullets=[];S.shots=[];for(const pad of S.pads)if(!pad.dead)pop(pad,'expire');S.pads=S.pads.filter(g=>!g.dead);S.cam=clamp(p.x-300,0,WORLD-VIEW_W);say('КЛІТИНА ВІДНОВИЛАСЯ. БІОМАСА ПОВЕРНУЛАСЯ — ПРОБУЙ ІНШИЙ ШЛЯХ!',3.2);}
function update(dt){dt=Math.min(.034,Math.max(0,dt));S.t+=dt;S.shotCd=Math.max(0,S.shotCd-dt);S.noticeFor=Math.max(0,S.noticeFor-dt);S.screenShake=Math.max(0,S.screenShake-38*dt);S.flash=Math.max(0,S.flash-dt*1.5);
 if(S.phase!=='play'){for(const f of S.particles){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;}S.particles=S.particles.filter(f=>f.life>0);return;}
 S.elapsed+=dt;for(const c of S.cells)if(c.chargeFx>0)c.chargeFx=Math.max(0,c.chargeFx-dt);S.boost=Math.max(0,S.boost-dt);S.maxBio=S.boost>0?8:5;S.bio=clamp(S.bio+dt*.025,0,S.maxBio);S.p.invuln=Math.max(0,S.p.invuln-dt);S.p.bounceCd=Math.max(0,S.p.bounceCd-dt);
 const p=S.p,oldY=p.y,move=(S.keys.a?-1:0)+(S.keys.d?1:0),speed= S.boost>0?312:282;
 if(move){p.vx=lerp(p.vx,move*speed,clamp(dt*11,0,1));p.dir=move;}else p.vx*=Math.exp(-12*dt);
 p.x=clamp(p.x+p.vx*dt,18,WORLD-24);p.vy=Math.min(1100,p.vy+1480*dt);p.y+=p.vy*dt;p.r=pSize();p.grounded=false;
 for(const plat of platforms){const oldFeet=oldY+p.r,newFeet=p.y+p.r;if(p.vy>=0&&p.x+p.r>plat.x&&p.x-p.r<plat.x+plat.w&&oldFeet<=plat.y+9&&newFeet>=plat.y){p.y=plat.y-p.r;p.vy=0;p.grounded=true;}}
 for(const wall of S.walls){if(!wall.open&&p.y+p.r>wall.y&&p.y-p.r<wall.y+wall.h){if(p.x+p.r>wall.x&&p.x<wall.x+wall.w/2){p.x=wall.x-p.r;p.vx=0;}else if(p.x-p.r<wall.x+wall.w&&p.x>=wall.x+wall.w/2){p.x=wall.x+wall.w+p.r;p.vx=0;}}}
 // Jelly is a small trampoline; it is also a one/two-hit membrane shield.
 if(p.vy>=0&&p.bounceCd<=0){for(const gel of S.pads){if(gel.dead)continue;let rTop=gel.y-gel.ry*.89;if(Math.abs(p.x-gel.x)<gel.rx*.88&&oldY+p.r<=rTop+14&&p.y+p.r>=rTop){p.y=rTop-p.r;p.vy=gel.kind==='virus'?-990:gel.kind==='organelle'?-805:S.keys.w?-790:-670;p.grounded=false;p.bounceCd=.21;p.combo++;gel.pulse=2;sound('bounce');particles(p.x,p.y+p.r,10,C.pink,155);break;}}}
 if(p.y>776)respawn();
 // Dynamic objects drift, unless coated in gel.
 for(const o of S.objects){if(!o.alive||o.capturedBy)continue;o.x+=o.vx*dt;if(o.x<o.lo||o.x>o.hi)o.vx*=-1;o.y=o.originY+Math.sin(S.t*2.1+o.phase)*19;}
 // Bacteria can fire independently. Viruses are roaming hazards, never frozen.
 for(const e of S.enemies){if(!e.alive)continue;const maxSp=e.type==='virus'?34:60;
 e.x+=e.vx*dt;if(e.patrol&&(e.x<e.patrol[0]||e.x>e.patrol[1])){e.vx=clamp(-e.vx,-maxSp,maxSp);e.x=clamp(e.x,e.patrol[0],e.patrol[1]);}
 if(e.type==='virus'){
  e.y=e.originY+Math.sin(S.t*3+e.phase)*8;e.inflateTime=Math.max(0,(e.inflateTime||0)-dt);
  if(e.inflated>0&&e.inflateTime<=0){e.inflated=0;for(const g of S.pads)if(!g.dead&&g.ref?.id===e.id)detonate(g);}
  if(Math.hypot(p.x-e.x,p.y-e.y)<33+e.inflated*16+p.r&&p.invuln<=0)hurt();
 }else{
  e.fireCd-=dt;if(e.fireCd<=0){e.fireCd=rand(1.9,2.9);let dx=p.x-e.x,dy=p.y- e.y;if(Math.abs(dx)<500){let d=Math.hypot(dx,dy)||1;S.bullets.push({x:e.x,y:e.y-8,vx:dx/d*268,vy:dy/d*268,r:8,life:2.7,dead:false});ring(e.x,e.y,28,C.red);}}
  if(Math.hypot(p.x-e.x,p.y-e.y)<27+p.r&&p.invuln<=0)hurt();
 }}
 // Friendly projectiles visibly travel from the character to the click.
 for(const b of S.shots){if(b.dead)continue;const ox=b.x,oy=b.y;b.t=Math.min(1,b.t+dt/b.dur);const a=b.t*b.t*(3-2*b.t);let nx=lerp(b.ox,b.tx,a),ny=lerp(b.oy,b.ty,a)-Math.sin(b.t*PI)*14;
 const obstruction=firstObstacle(ox,oy,nx,ny);if(obstruction){nx=obstruction.x;ny=obstruction.y;}b.x=nx;b.y=ny;b.trail.push([nx,ny]);if(b.trail.length>10)b.trail.shift();
 if(obstruction||b.t>=1){b.dead=true;spawnGel(b.x,b.y);}}
 S.shots=S.shots.filter(b=>!b.dead);
 for(const b of S.bullets){if(b.dead)continue;const bx=b.x,by=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<0){b.dead=true;continue;}
 const wallImpact=firstObstacle(bx,by,b.x,b.y);if(wallImpact){b.dead=true;particles(wallImpact.x,wallImpact.y,6,C.red,60);continue;}
 let blocked=false;for(const g of S.pads)if(!g.dead&&sqr((b.x-g.x)/(g.rx+6))+sqr((b.y-g.y)/(g.ry+6))<1){b.dead=true;g.hp--;S.stats.blocks++;particles(b.x,b.y,15,C.blue,130);ring(b.x,b.y,37,C.blue);sound('gel');if(g.hp<=0)pop(g,'shield');blocked=true;break;}
 if(!blocked&&Math.hypot(b.x-p.x,b.y-p.y)<p.r+b.r){b.dead=true;hurt();}}
 S.bullets=S.bullets.filter(b=>!b.dead&&Math.abs(b.x-p.x)<900);
 for(const g of S.pads){if(g.dead)continue;g.age+=dt;g.pulse*=Math.exp(-dt*4);if(g.ref){const o=S.objects.find(o=>o.id===g.ref.id);if(o){g.x=o.x;g.y=o.y;}const e=S.enemies.find(e=>e.id===g.ref.id);if(e){g.x=e.x;g.y=e.y-10;}}
 if(g.kind==='fire'&&g.age>.3){g.burnCd=(g.burnCd||0)-dt;if(g.burnCd<=0){g.burnCd=.65;for(const e of S.enemies)if(e.alive&&Math.hypot(e.x-g.x,e.y-g.y)<120){damageEnemy(e,.85);}}}
 if(g.chainIn!==undefined){g.chainIn-=dt;if(g.chainIn<=0)detonate(g,true);}
 if(g.age>g.maxAge||g.y>735)pop(g,'expire');}
 S.pads=S.pads.filter(g=>!g.dead);
 for(const item of S.pickups){if(item.got)continue;if(Math.hypot(p.x-item.x,p.y-item.y)<p.r+24){item.got=true;S.stats.pickups++;
 if(item.type==='booster'){S.boost=30;S.maxBio=8;S.bio=Math.min(8,S.bio+4);say('BIO SURGE! 30 СЕКУНД: 8 ЗАРЯДІВ, ВЕЛИКИЙ РОЗМІР, ШВИДШИЙ РУХ.',4);}else{S.bio=Math.min(S.maxBio,S.bio+item.value);say('БІОКАПСУЛА +'+item.value.toFixed(1)+' ЗАРЯДИ',1.4);}particles(item.x,item.y,24,C.aqua,170);sound('collect');}}
 for(let i=0;i<checkpoints.length;i++){if(p.x>=checkpoints[i].x&&i>p.respawn){p.respawn=i;S.bio=Math.max(S.bio,3);S.p.hp=Math.max(S.p.hp,2);say('КОНТРОЛЬНА ТОЧКА — ЦИТОПЛАЗМА ПОПОВНЕНА.',2);}}
 const section=chambers.reduce((idx,ch,i)=>p.x>=ch.x?i:idx,0);if(section!==S.section){S.section=section;say(chambers[section].hint,5);}
 if(p.x>S.door.x-30&&p.y>390&&p.y<620){S.phase='win';S.finish=S.elapsed;particles(S.door.x,480,45,C.aqua,400);sound('win');}
 for(const v of S.particles){v.life-=dt;v.vy+=120*dt;v.x+=v.vx*dt;v.y+=v.vy*dt;if(v.home){v.vx+=(p.x-v.x)*dt*3;v.vy+=(p.y-v.y)*dt*3;}}
 S.particles=S.particles.filter(v=>v.life>0);
 for(const r of S.rings){r.life-=dt;r.r=lerp(r.r,r.max,dt*5);}S.rings=S.rings.filter(r=>r.life>0);
 S.cam=lerp(S.cam,clamp(p.x-340,0,WORLD-VIEW_W),clamp(dt*7,0,1));
}
function txt(s,x,y,sz=16,color=C.pale,align='left',weight='600'){ctx.fillStyle=color;ctx.font=weight+' '+sz+'px system-ui,Arial,sans-serif';ctx.textAlign=align;ctx.fillText(s,x,y);ctx.textAlign='left';}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function circ(x,y,r,color,stroke=null,lw=1){ctx.beginPath();ctx.arc(x,y,Math.max(.2,r),0,TAU);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
function ellipse(x,y,rx,ry,color,stroke=null,lw=1){ctx.beginPath();ctx.ellipse(x,y,Math.max(.2,rx),Math.max(.2,ry),0,0,TAU);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
function line(x,y,x2,y2,col,w=2){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
function rr(x,y,w,h,r,fill,stroke=null,sw=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=sw;ctx.stroke();}}
function drawBackdrop(){let grad=ctx.createLinearGradient(0,0,0,720);grad.addColorStop(0,'#16152a');grad.addColorStop(.65,'#0b1b29');grad.addColorStop(1,'#200e29');rect(0,0,VIEW_W,720,grad);
 // parallax veins, membranes, floating cells (deterministic geometry)
 for(let i=0;i<25;i++){const x=(((i*289-S.cam*.18)%1660)+1660)%1660-180;const y=100+(i*149)%520;circ(x,y,45+(i*41)%100,`rgba(169,106,213,${i%3===0?.09:.035})`,`rgba(180,149,226,.08)`,2);}
 ctx.strokeStyle='rgba(91,220,194,.14)';for(let i=0;i<15;i++){const x=(((i*410-S.cam*.33)%1800)+1800)%1800-120;ctx.lineWidth=4+i%3*2;ctx.beginPath();ctx.moveTo(x,-15);ctx.bezierCurveTo(x+50,220,x-78,490,x+40,740);ctx.stroke();}
 for(let i=0;i<48;i++){let x=(((i*167-S.cam*.09)%1500)+1500)%1500,y=(i*239)%710;circ(x,y,1.6+(i%4)*.6,'rgba(153,241,222,.34)');}}
function drawTissue(){for(const q of platforms){if(q.x+q.w<S.cam-50||q.x>S.cam+VIEW_W+40)continue;
 const g=ctx.createLinearGradient(0,q.y,0,720);g.addColorStop(0,'#39506b');g.addColorStop(.11,'#264052');g.addColorStop(1,'#1b2b39');rr(q.x,q.y,q.w,740-q.y,15,g,'#5f8899',2);line(q.x+7,q.y+1,q.x+q.w-7,q.y+1,C.aqua,4);
 for(let x=q.x+20;x<q.x+q.w;x+=38){circ(x,q.y+23,3.5,'rgba(156,246,223,.31)');line(x,q.y+2,x+Math.sin(x)*4,q.y-7,'rgba(128,247,211,.38)',1.4);}
 }
 // hazard pool visually makes crossings risky
 const pairs=[];for(let i=0;i<platforms.length-1;i++)pairs.push([platforms[i].x+platforms[i].w,platforms[i+1].x]);
 for(const [a,b] of pairs){if(b<S.cam||a>S.cam+VIEW_W)continue;let g=ctx.createLinearGradient(0,585,0,720);g.addColorStop(0,'rgba(237,94,153,.02)');g.addColorStop(1,'rgba(243,63,119,.68)');rect(a,595,b-a,125,g);
 for(let x=a+13;x<b-8;x+=33){line(x,705,x+10,683+Math.sin(S.t*3+x)*6,'rgba(255,145,170,.65)',3);line(x+10,683+Math.sin(S.t*3+x)*6,x+17,705,'rgba(255,145,170,.65)',3);}}
}
function drawCheckpoint(){for(let i=1;i<checkpoints.length;i++){let q=checkpoints[i];if(Math.abs(q.x-S.cam)>VIEW_W+50)continue;line(q.x,460,q.x,588,i<=S.p.respawn?'#93f7d3':'#457f79',3);circ(q.x,458,13,i<=S.p.respawn?'rgba(122,249,215,.45)':'rgba(100,154,145,.25)',C.aqua,2);txt('◈',q.x,463,18,C.aqua,'center');}}
function drawInteract(){for(const ob of S.objects){if(Math.abs(ob.x-S.cam)>800)continue;const cap=!!ob.capturedBy;ellipse(ob.x,ob.y,ob.size+4,ob.size*.73,cap?'#4a7a8e':'#325f73',C.blue,3);circ(ob.x-8,ob.y-7,7,C.blue);circ(ob.x+11,ob.y+3,5,'#d5f4ff');for(let i=0;i<7;i++){let a=i/7*TAU+S.t*.6;circ(ob.x+Math.cos(a)*(ob.size+5),ob.y+Math.sin(a)*(ob.size*.8+5),3,C.aqua);} }
 for(const e of S.enemies){if(!e.alive||Math.abs(e.x-S.cam)>900)continue;
 if(e.type==='bacteria'){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.sin(S.t*3+e.phase)*.13);rr(-24,-14,48,28,15,'#448b78','#a6ffae',2.7);for(let i=0;i<5;i++){let x=-18+i*9;line(x,-14,x-3,-22,'#a1ffb3',2);line(x,14,x+3,22,'#a1ffb3',2);}circ(-7,-2,4,'#efffff');circ(10,-2,4,'#efffff');circ(-6,-1,2,'#0c3329');circ(11,-1,2,'#0c3329');ctx.restore();}
 else{const scale=1+e.inflated*.20,rad=30*scale;ctx.save();ctx.translate(e.x,e.y);ctx.rotate(S.t*.6+e.phase);
 for(let i=0;i<11;i++){const a=i/11*TAU,rx=Math.cos(a)*rad,ry=Math.sin(a)*rad;line(rx*.72,ry*.72,rx*1.4,ry*1.4,C.red,4);circ(rx*1.4,ry*1.4,4,C.pink);}
 ctx.beginPath();for(let i=0;i<22;i++){const a=i/22*TAU,r=rad*(i%2===0?1:.8);i===0?ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r):ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fillStyle='#773b8e';ctx.strokeStyle='#ebb2f7';ctx.lineWidth=3;ctx.fill();ctx.stroke();
 circ(-10,-5,7,'#f2d7fb');circ(12,-5,7,'#f2d7fb');circ(-9,-4,3,'#281a4d');circ(13,-4,3,'#281a4d');ellipse(2,13,9,4,'#e580b3');ctx.restore();}}
 for(const c of S.cells){if(Math.abs(c.x-S.cam)>790)continue;if(c.type==='battery'){rr(c.x-23,c.y-35,46,55,7,'#28436a',C.blue,3);txt('⚡',c.x,c.y+3,32,C.blue,'center');if(c.used){ringStatic(c.x,c.y,52,C.blue);if(c.chargeFx>0){ctx.save();ctx.globalAlpha=Math.min(1,c.chargeFx);ctx.strokeStyle='#baf4ff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(c.x,c.y);for(let z=1;z<7;z++){let t=z/7;ctx.lineTo(lerp(c.x,3840,t)+Math.sin(S.t*21+z*5)*13,lerp(c.y,458,t)+Math.cos(S.t*17+z)*20);}ctx.lineTo(3840,458);ctx.stroke();ctx.restore();}}}else {ellipse(c.x,c.y,26,32,'#7d3540','#ff9b73',3);for(let i=0;i<3;i++)line(c.x-10+i*10,c.y-8,c.x-8+i*10,c.y+11,'#ffcc80',3);}}
 for(const wall of S.walls)if(!wall.open){rr(wall.x,wall.y,wall.w,wall.h,8,'#844765','#ff8bad',3);for(let yy=wall.y+14;yy<wall.y+wall.h-10;yy+=25){line(wall.x+4,yy,wall.x+wall.w-4,yy+9,C.yellow,2);}}
}
function ringStatic(x,y,r,color){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();}
function drawPickups(){for(const item of S.pickups){if(item.got||Math.abs(item.x-S.cam)>760)continue;const y=item.y+Math.sin(S.t*2.7+item.x)*6;if(item.type==='booster'){
 ctx.save();ctx.translate(item.x,y);ctx.rotate(Math.sin(S.t*2)*.10);rr(-18,-25,36,43,6,'#356a77',C.aqua,3);rr(-9,-32,18,12,2,'#c3dadd','#efffff',2);circ(0,-3,9,C.aqua);ctx.restore();txt('30 СЕК',item.x,y-43,12,C.aqua,'center',800);
 }else{circ(item.x,y,15,'#5b9d91',C.aqua,2);circ(item.x-4,y-4,6,'#c8ffe3');txt('+',item.x+18,y-11,13,C.aqua,'center');}}}
function drawGels(){for(const g of S.pads){if(g.dead||Math.abs(g.x-S.cam)>840)continue;const pulse=.03*Math.sin(S.t*6+g.pulse),rx=g.rx*(1+pulse),ry=g.ry*(1-pulse);let color=g.kind==='electric'?'#679fef':g.kind==='fire'?'#dc8a54':g.kind==='virus'?'#c185ee':g.kind==='organelle'?'#a3a4fa':'#ab78e5';
 ctx.save();ctx.globalAlpha=.74;ellipse(g.x,g.y,rx,ry,color,'#e4c2ff',3);ctx.globalAlpha=.27;ellipse(g.x-9,g.y-7,rx*.75,ry*.65,'#ffffff');ctx.globalAlpha=.8;ellipse(g.x-rx*.32,g.y-ry*.35,rx*.29,ry*.17,'#e3caff');ctx.restore();
 const hp=g.hp;for(let i=0;i<hp;i++)circ(g.x-12+i*14,g.y+ry+10,2.6,C.aqua);
 if(g.kind==='electric'){for(let i=0;i<3;i++){let a=S.t*7+i*2;line(g.x+Math.cos(a)*rx,g.y+Math.sin(a)*ry,g.x+Math.cos(a)*rx*1.55,g.y+Math.sin(a)*ry*1.45,C.blue,2);}}
 if(g.kind==='fire'){for(let i=0;i<4;i++){let x=g.x+(i-1.5)*17;ellipse(x,g.y-ry-11-Math.sin(S.t*7+i)*5,8,13,'rgba(255,158,92,.78)');}}
 }}
function drawShotsBullets(){for(const s of S.shots){s.trail.forEach(([x,y],i)=>circ(x,y,2+i*.35,`rgba(210,160,255,${.13+i*.07})`));circ(s.x,s.y,11,C.pink,'#fff0ff',2);}
 for(const b of S.bullets){circ(b.x,b.y,b.r,C.red,'#ffc1d0',2);line(b.x,b.y,b.x-b.vx*.05,b.y-b.vy*.05,'rgba(255,105,153,.65)',4);}}
function drawHero(){const p=S.p;ctx.save();ctx.translate(p.x,p.y);const r=pSize(),squash=p.grounded?.93:1+clamp(Math.abs(p.vy)/1900,0,.18);ctx.globalAlpha=p.invuln>0&&Math.floor(S.t*16)%2===0?.60:1;
 ellipse(0,0,r/squash,r*squash,'#c49cf4','#efd9ff',3);circ(-r*.29,-r*.25,4,'#fff1ff');circ(r*.22,-r*.25,4,'#fff1ff');
 // the nucleus is visible and protected even when biomass runs out
 circ(1,4,Math.max(7,r*.42),'#704290','#f8c8ff',2.5);circ(0,3,3.8,'#ffe8ff');
 for(let i=0;i<4;i++){let a=i*TAU/4+S.t*2;circ(Math.cos(a)*r*.65,Math.sin(a)*r*.6,1.6,C.pale);}ctx.restore();}
function drawDoor(){const {x,y}=S.door;rr(x-25,y,70,98,19,'rgba(65,183,157,.25)',C.aqua,4);circ(x+11,y+45,25,'rgba(87,222,187,.25)',C.aqua,3);circ(x+11,y+45,10,C.aqua);txt('ВИХІД',x+10,y-15,17,C.aqua,'center',800);}
function drawHUD(){rect(0,0,1280,93,'rgba(10,16,32,.91)');rr(16,13,312,67,17,'rgba(25,31,52,.90)','#476780',1.4);txt('CYTOPLASM',32,40,26,C.pale,'left','900');txt('CELL ESCAPE · МІКРОСВІТ',34,62,12,'#aad6db');
 txt('ЦИТОПЛАЗМА',355,29,14,'#bcdeee','left','800');for(let i=0;i<S.maxBio;i++){const xx=355+i*34;rr(xx,40,28,19,6,i+1<=S.bio?'#ab75e8':i<S.bio?'#9569c1':'#34304b','#e1bafa',1);}txt(S.bio.toFixed(1)+' / '+S.maxBio,646,55,15,C.pale,'left','700');
 txt('ЯДРО',755,31,14,C.pale);for(let i=0;i<3;i++)circ(773+i*25,53,8,i<S.p.hp?C.red:'#392a43',C.pale,1);
 if(S.boost>0){rr(876,13,169,67,14,'#1e554d',C.aqua,2);txt('BIO SURGE',959,37,15,C.aqua,'center','800');txt(S.boost.toFixed(0)+' сек',959,62,19,'#effff6','center','800');}
 let progress=clamp(S.p.x/S.door.x,0,1);rr(1068,16,192,11,6,'#263a4a');rr(1068,16,192*progress,11,6,C.aqua);txt(Math.round(progress*100)+'% шляху',1167,51,16,C.aqua,'center');txt('⏱ '+Math.floor(S.elapsed/60)+':'+String(Math.floor(S.elapsed%60)).padStart(2,'0'),1167,73,15,C.pale,'center');
 rr(19,102,605,48,14,'rgba(13,22,37,.83)','rgba(119,195,192,.33)',1);txt(chambers[S.section>=0?S.section:0].title,33,133,19,C.pale,'left','800');
 rect(0,670,1280,50,'rgba(6,13,27,.92)');txt('A/D — РУХ     W — СТРИБОК     КЛІК — ЖЕЛЕ     R — ВИБУХ     N — ЗНОВУ',640,701,15,C.pale,'center','750');
 if(S.noticeFor>0){rr(640-470,605,940,46,14,'rgba(17,25,46,.90)','rgba(193,153,238,.6)',1);txt(S.notice,640,635,15,'#e9dbfa','center','700');}
 if(S.mouse.valid){let wx=S.mouse.x+S.cam,wy=S.mouse.y,ok=inReach(wx,wy);ctx.strokeStyle=ok?'rgba(226,197,255,.72)':'#ff718e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(S.mouse.x,S.mouse.y,12,0,TAU);ctx.stroke();if(!ok)txt('ДАЛЕКО',S.mouse.x,S.mouse.y-23,12,C.red,'center','800');}
 if(S.phase==='win'){rect(0,0,1280,720,'rgba(8,13,28,.82)');rr(249,176,782,360,28,'#1b263d','#8bf3d1',4);txt('ЯДРО ДОСЯГНУТО!',640,257,43,C.aqua,'center','900');txt('КЛІТИНА ВРЯТОВАНА • РІВЕНЬ ПРОЙДЕНО',640,303,18,C.pale,'center');txt('Час '+Math.floor(S.finish/60)+':'+String(Math.floor(S.finish%60)).padStart(2,'0')+'   ·   Пострілів '+S.stats.shots+'   ·   Блоків '+S.stats.blocks+'   ·   Вибухів '+S.stats.blasts,640,371,18,C.pale,'center');txt('N — зіграти ще раз',640,451,22,C.pink,'center');}
}
function render(){ctx.setTransform(canvas.width/VIEW_W,0,0,canvas.height/VIEW_H,0,0);ctx.clearRect(0,0,VIEW_W,VIEW_H);ctx.save();if(S.screenShake>0)ctx.translate(rand(-S.screenShake,S.screenShake),rand(-S.screenShake,S.screenShake)*.5);
 drawBackdrop();ctx.save();ctx.translate(-S.cam,0);drawTissue();drawCheckpoint();drawInteract();drawPickups();drawGels();drawShotsBullets();drawDoor();drawHero();
 for(const part of S.particles){ctx.globalAlpha=clamp(part.life/part.max,0,1);circ(part.x,part.y,part.size,part.color);}ctx.globalAlpha=1;
 for(const r of S.rings){ctx.globalAlpha=clamp(r.life/r.total,0,1);ringStatic(r.x,r.y,r.r,r.color);}ctx.globalAlpha=1;
 ctx.restore();ctx.restore();if(S.flash>0)rect(0,0,1280,720,`rgba(238,168,234,${S.flash*.32})`);drawHUD();}
function step(dt){update(dt);render();}
function getState(){return {phase:S.phase,time:S.elapsed,player:{x:S.p.x,y:S.p.y,hp:S.p.hp,r:pSize(),respawn:S.p.respawn},bio:S.bio,maxBio:S.maxBio,boost:S.boost,camera:S.cam,stats:{...S.stats},pads:S.pads.map(g=>({x:g.x,y:g.y,kind:g.kind,hp:g.hp})),enemies:S.enemies.filter(e=>e.alive).map(e=>({x:e.x,y:e.y,type:e.type,inflated:e.inflated||0})),bullets:S.bullets.length,wallOpen:S.walls[0].open,itemsLeft:S.pickups.filter(i=>!i.got).length};}
start();return {step,render,update,keyDown,keyUp,pointerDown,pointerMove,shoot,detonate,start,getState,_debug:()=>S};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createCytoplasm};

const cvs=document.createElement('canvas');cvs.width=960;cvs.height=540;
const game=createCytoplasm(cvs),tex=PIXI.Texture.from(cvs),sprite=new PIXI.Sprite(tex);
sprite.width=1280;sprite.height=720;sprite.x=0;sprite.y=0;
runtimeScene.getLayer('').getRendererObject().addChild(sprite);
const editorHint=runtimeScene.getObjects('EditorHint')[0];if(editorHint&&editorHint.hide)editorHint.hide();
st={game,cvs,tex,sprite,keys:{},lastMouse:false};runtimeScene.__cytoplasm090=st;}
const input=gdjs.evtTools.input;
const mx=input.getMouseX(runtimeScene,'',0),my=input.getMouseY(runtimeScene,'',0);st.game.pointerMove(mx,my);
const mb=input.isMouseButtonPressed(runtimeScene,'Left');if(mb&&!st.lastMouse)st.game.pointerDown(mx,my,0);st.lastMouse=mb;
for(const [key,code] of [['a','KeyA'],['d','KeyD'],['w','KeyW'],['r','KeyR'],['n','KeyN'],['Left','KeyA'],['Right','KeyD'],['Up','KeyW']]){
const down=input.isKeyPressed(runtimeScene,key);if(down&&!st.keys[key])st.game.keyDown({code});if(!down&&st.keys[key])st.game.keyUp({code});st.keys[key]=down;}
let dt=gdjs.evtTools.runtimeScene.getElapsedTimeInSeconds(runtimeScene);
st.game.step(Math.min(.034,Math.max(0,dt||.016)));st.tex.baseTexture.update();
})();