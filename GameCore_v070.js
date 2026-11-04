
/* CYTOPLASM — Bounce & Blast v0.7.0
   Fast single-material arcade platformer. No abilities menu.
   A/D run · Space jump · E shoot · R detonate last gel · mouse or W/S aim.
   Context: Bounce (ground/air), Capture (moving object), Pressure (heavy load), Blast (chain).
   Copyright 2026. Original game logic and generated visuals. */
function createCytoplasm(canvas){
'use strict';
const W=1280,H=720,ctx=canvas.getContext('2d');
const PI=Math.PI,TAU=PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),rnd=(a,b)=>a+Math.random()*(b-a);
let nextId=1;
const C={violet:'#c99aff',bright:'#f1d0ff',mint:'#7cf8d7',yellow:'#ffdb86',red:'#ff8da9',navy:'#0c1122'};
const R={room:0,phase:'play',t:0,roomTime:0,biomass:100,p:{x:110,y:580,vx:0,vy:0,dir:1,grounded:false,bounceLock:0,climbing:null,attachCooldown:0,combo:0,comboTime:0,alive:true},pads:[],shots:[],objects:[],particles:[],rings:[],platforms:[],door:{x:1184,y:515,w:58,h:80},spikes:[],keys:{},mouse:{x:500,y:345,active:false},aim:-.7,shotCooldown:0,lastPad:null,notice:'',noticeT:0,respawn:{x:112,y:580},shake:0,flash:0,stats:{shots:0,bounces:0,blasts:0,captures:0,pressures:0,chains:0,refunds:0,falls:0,rooms:0},tutorialStep:0,winTime:0};
let audioCtx=null;
function tone(kind){try{if(typeof window==='undefined'||!(window.AudioContext||window.webkitAudioContext))return;if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();let o=audioCtx.createOscillator(),g=audioCtx.createGain(),tm=audioCtx.currentTime;
 const par=kind==='pop'?[240,590,.10,.045]:kind==='bounce'?[260,780,.17,.085]:kind==='blast'?[100,40,.29,.12]:kind==='capture'?[350,680,.14,.064]:kind==='pressure'?[80,170,.36,.095]:[320,120,.13,.038];
 o.type=kind==='blast'||kind==='pressure'?'sawtooth':'sine';o.frequency.setValueAtTime(par[0],tm);o.frequency.exponentialRampToValueAtTime(Math.max(20,par[1]),tm+par[2]);g.gain.setValueAtTime(par[3],tm);g.gain.exponentialRampToValueAtTime(.001,tm+par[2]);o.connect(g);g.connect(audioCtx.destination);o.start(tm);o.stop(tm+par[2]+.015);
 }catch(e){} }
function hint(msg,time=2.5){R.notice=msg;R.noticeT=time;}
function pFoot(){return R.p.y+18+Math.round((R.biomass/100)*2)}
function pRadius(){return 14+R.biomass*.045}
function newObject(type,x,y){const o={id:nextId++,type,x,y,spawnX:x,spawnY:y,vx:0,vy:0,angle:0,omega:0,mass:type==='crate'?4:type==='chair'?1.4:2,w:type==='crate'?83:type==='chair'?66:65,h:type==='crate'?75:type==='chair'?67:57,fixed:false,stored:null,capturedBy:null,pressureCooldown:0,alive:true,grounded:false};R.objects.push(o);return o;}
function resetRoom(n=0){R.room=n;R.phase='play';R.t=0;R.roomTime=0;R.biomass=100;R.pads=[];R.shots=[];R.objects=[];R.particles=[];R.rings=[];R.keys={};R.lastPad=null;R.shotCooldown=0;R.mouse.active=false;R.aim=-.7;R.notice='';R.noticeT=0;R.tutorialStep=0;R.shake=0;R.flash=0;
 R.p={x:112,y:581,vx:0,vy:0,dir:1,grounded:false,bounceLock:0,climbing:null,attachCooldown:0,combo:0,comboTime:0,alive:true};
 if(n===0){R.platforms=[{x:0,y:620,w:390,h:100},{x:540,y:595,w:150,h:125},{x:840,y:535,w:440,h:185}];R.respawn={x:98,y:580};R.door={x:1182,y:468,w:66,h:67};hint('БОЙОВЕ ЖЕЛЕ! E — СТВОРИ · SPACE — СТРИБАЙ · R — ВИБУХ!',6);}
 else if(n===1){R.platforms=[{x:0,y:620,w:305,h:100},{x:490,y:570,w:120,h:150},{x:772,y:485,w:125,h:235},{x:1055,y:450,w:225,h:270}];R.respawn={x:93,y:580};R.door={x:1177,y:382,w:65,h:68};newObject('crate',430,340);newObject('crate',716,300);hint('BLAST RUN — ВИБУХИ ПІДКИДАЮТЬ ГЕРОЯ, А ЖЕЛЕ ЗАПУСКАЄ ЛАНЦЮГ.',6);}
 else {R.platforms=[{x:0,y:625,w:368,h:95},{x:590,y:605,w:135,h:115},{x:925,y:495,w:355,h:225}];R.respawn={x:105,y:581};R.door={x:1177,y:426,w:66,h:70};let chair=newObject('chair',316,541);chair.vx=30;newObject('crate',748,398);newObject('box',555,180);hint('FLYING JUNK — ВЛУЧ У МЕБЛІ, ЗАХОПИ ЇХ ЖЕЛЕ, ПОТІМ ПІДІРВИ!',6);}
 R.p.x=R.respawn.x;R.p.y=R.respawn.y;
}
function burst(x,y,n=16,col=C.violet,force=240){for(let i=0;i<n;i++){let a=rnd(0,TAU),s=rnd(.24,1)*force;R.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-30,life:rnd(.25,.75),max:.75,r:rnd(2,6),col,gravity:rnd(130,420)})}}
function sprayBack(x,y,refund,mode='reclaim'){
 if(refund>0){R.biomass=clamp(R.biomass+refund,0,100);R.stats.refunds++;}
 for(let i=0;i<13;i++){let a=rnd(0,TAU),s=rnd(55,225);R.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-45,life:rnd(.45,.8),max:.8,r:rnd(2,6),col:mode==='blast'?C.yellow:C.mint,gravity:20,home:true})}
 R.rings.push({x,y,r:10,max:mode==='blast'?96:60,life:.45,total:.45,color:mode==='blast'?C.red:C.mint});
}
function createGel(x,y,options={}){
 if(R.pads.length>=8){const old=R.pads.find(q=>!q.dead&&!q.blastDelay);if(old)reclaim(old,'overflow');}
 let nearObject=R.objects.filter(o=>o.alive&&Math.hypot(o.x-x,o.y-y)<Math.max(o.w,o.h)*.7+42).sort((a,b)=>dist(a,{x,y})-dist(b,{x,y}))[0];
 let context='air',o=null; if(nearObject){o=nearObject;context=o.mass>=3?'pressure':((Math.hypot(o.vx,o.vy)>85&&!o.grounded)?'capture':'coat');}
 let pl=R.platforms.filter(q=>x>=q.x-17&&x<=q.x+q.w+17&&Math.abs(y-q.y)<85).sort((a,b)=>Math.abs(a.y-y)-Math.abs(b.y-y))[0];
 if(!o&&pl){context='bounce'; y=Math.min(y,pl.y-33);}
 const pad={id:nextId++,x:o?o.x:x,y:o?o.y:y,rx:context==='capture'?83:context==='pressure'?79:64,ry:context==='capture'?64:context==='pressure'?54:40,kind:context,objectId:o?.id||null,life:0,maxAge:context==='capture'?10:context==='pressure'?9:8.5,pressure:0,bounceGlow:0,dead:false,blastDelay:0,pulse:0,cost:options.cost||14,energy:0,attached:!!o};
 R.pads.push(pad);R.lastPad=pad.id;
 if(o){o.capturedBy=pad.id;
 if(context==='capture'){o.fixed=true;o.stored={vx:o.vx,vy:o.vy,omega:o.omega};o.vx=0;o.vy=0;o.omega=0;R.stats.captures++;hint('CAPTURE! МЕБЛІ ЗАВИСЛИ. СТРИБАЙ НА ОБОЛОНКУ АБО R — ВИБУХ!',2.4);tone('capture');}
 else if(context==='pressure'){pad.pressure=.15;hint('PRESSURE! ВАЖКИЙ ВАНТАЖ СТИСКАЄ ЖЕЛЕ — ГОТУЙСЯ ДО ВИБУХУ!',2.4);}
 else hint('ЖЕЛЕ ОБВОЛОКЛО ПРЕДМЕТ — ТЕПЕР МОЖНА ВІДСКОЧИТИ!',1.9);
 }
 if(context==='air')hint('ПОВІТРЯНЕ ЖЕЛЕ — ПІДСКОЧИ НА НЬОМУ! R — ВИБУХ.',1.8);
 burst(pad.x,pad.y,18,C.violet,160);tone('pop');
 return pad;
}
function shoot(){if(R.phase!=='play'||R.shotCooldown>0)return false;const p=R.p;
 if(R.biomass<15){hint('БІОМАСА ВІДНОВЛЮЄТЬСЯ — МОЖНА СТРИБАТИ НА ВЖЕ СТВОРЕНОМУ ЖЕЛЕ.',1.8);return false;}
 let ax,ay;if(R.mouse.active){let dx=R.mouse.x-p.x,dy=R.mouse.y-(p.y-8),len=Math.max(1,Math.hypot(dx,dy));ax=dx/len;ay=dy/len;p.dir=ax>0?1:-1;}else{ax=p.dir*Math.cos(R.aim);ay=Math.sin(R.aim);}
 // Prevent shots directly downward through player's feet when the cursor is very close.
 const s={id:nextId++,x:p.x+p.dir*20,y:p.y-12,vx:ax*970+p.vx*.2,vy:ay*970+p.vy*.04,life:0,maxLife:R.mouse.active?.47:.20,trail:[],cost:14};
 R.biomass-=14;R.shots.push(s);R.shotCooldown=.16;R.stats.shots++;burst(s.x,s.y,5,C.mint,80);tone('shoot');return true;}
function reclaim(pad,how='expire'){
 if(!pad||pad.dead)return;pad.dead=true;
 const ob=R.objects.find(o=>o.id===pad.objectId);if(ob&&ob.capturedBy===pad.id){ob.capturedBy=null;if(ob.fixed){ob.fixed=false;ob.vx=ob.stored?.vx||0;ob.vy=ob.stored?.vy||0;ob.omega=ob.stored?.omega||0;ob.stored=null;}}
 sprayBack(pad.x,pad.y,pad.cost,how);
 burst(pad.x,pad.y,how==='expire'?12:20,C.mint,160);
 if(how==='expire'||how==='overflow')tone('reclaim');
 if(R.p.climbing===pad.id){R.p.climbing=null;R.p.attachCooldown=.3;}
}
function explode(pad,chain=false){if(!pad||pad.dead)return false;
 pad.dead=true;pad.blastDelay=0;R.stats.blasts++;if(chain)R.stats.chains++;
 const {x,y}=pad;R.shake=Math.max(R.shake,15);R.flash=.22;
 sprayBack(x,y,pad.cost*.85,'blast');burst(x,y,65,chain?C.mint:C.violet,490);
 for(const o of R.objects){if(!o.alive)continue;const d=Math.max(24,Math.hypot(o.x-x,o.y-y));if(d<236){let force=(1-d/236)*780/Math.sqrt(o.mass);let nx=(o.x-x)/d,ny=(o.y-y)/d;
  // A captured object also receives stored flight momentum on blast.
  if(o.capturedBy===pad.id){o.fixed=false;o.capturedBy=null;o.vx+=(o.stored?.vx||0)*.65;o.vy+=(o.stored?.vy||0)*.65;o.omega+=(o.stored?.omega||0);o.stored=null;}
  o.vx+=nx*force;o.vy+=ny*force-Math.max(0,force*.55);o.omega+=rnd(-3.5,3.5);
 }}
 const q=R.p,d=Math.max(35,Math.hypot(q.x-x,q.y-y));if(d<266){const force=(1-d/266)*800;const nx=(q.x-x)/d,ny=(q.y-y)/d;
  q.vx+=nx*force*1.05; q.vy=Math.min(q.vy,0)+Math.min(-240,ny*force-550*(1-d/340));q.grounded=false;q.bounceLock=.2;q.climbing=null;q.attachCooldown=.2;q.combo=Math.min(9,q.combo+1);q.comboTime=3;
 }
 for(const other of R.pads){if(other.dead||other.id===pad.id||other.blastDelay>0)continue;if(Math.hypot(other.x-x,other.y-y)<218)other.blastDelay=.1+Math.random()*.1;}
 tone('blast');return true;
}
function detonate(){const candidates=R.pads.filter(x=>!x.dead&&x.blastDelay===0);if(!candidates.length){hint('СТВОРИ ЖЕЛЕ КЛАВІШЕЮ E — ТОДІ R ЗАПУСТИТЬ ВИБУХ!',1.5);return false;}const pad=candidates.find(x=>x.id===R.lastPad)||candidates.at(-1);return explode(pad)}
function keysFromEvent(x){if(x&&typeof x==='object'){const m={KeyA:'a',KeyD:'d',KeyE:'e',KeyR:'r',KeyW:'w',KeyS:'s',KeyN:'n',Space:'space',ArrowLeft:'a',ArrowRight:'d',ArrowUp:'w',ArrowDown:'s'};return m[x.code]||keysFromEvent(x.key);}
 const map={'ф':'a','в':'d','у':'e','к':'r','ц':'w','і':'s','т':'n',' ':'space','space':'space','arrowleft':'a','arrowright':'d','arrowup':'w','arrowdown':'s'};
 return map[String(x||'').toLowerCase()]||String(x||'').toLowerCase();}
function keyDown(k){let key=keysFromEvent(k);if(R.keys[key])return;R.keys[key]=true;if(key==='n'){resetRoom(R.room);return}if(R.phase==='win'){if(key==='space'||key==='e')resetRoom(0);return}
 if(key==='e')shoot();if(key==='r')detonate();if(key==='space'){const p=R.p;if(p.climbing!==null){p.climbing=null;p.attachCooldown=.35;p.vy=-675;p.grounded=false;p.bounceLock=.15;}
 else if(p.grounded||p.coyote>0){p.vy=-805;p.grounded=false;p.coyote=0;tone('bounce');}}}
function keyUp(k){let key=keysFromEvent(k);R.keys[key]=false}
function pointerMove(x,y){R.mouse={x,y,active:true};}
function pointerDown(x,y){R.mouse={x,y,active:true};}
function pointerUp(x,y){R.mouse={x,y,active:true};}
function resetKeys(){R.keys={};R.p.vx=0;}
function intersectsPad(p,gel){const dx=(p.x-gel.x)/(gel.rx+7),dy=(p.y-gel.y)/(gel.ry+14);return dx*dx+dy*dy<1.05}
function nearestPlatformUnder(x,y,prevFoot,foot){let best=null;for(const s of R.platforms){if(x+13>=s.x&&x-13<=s.x+s.w&&prevFoot<=s.y+9&&foot>=s.y&&y<s.y+50){if(!best||s.y<best.y)best=s;}}return best;}
function hitPadFromAbove(p,pad,prevFoot){let dx=(p.x-pad.x)/pad.rx;if(Math.abs(dx)>=.96)return null;let top=pad.y-pad.ry*Math.sqrt(Math.max(0,1-dx*dx));return prevFoot<=top+12&&pFoot()>=top&&p.vy>20?top:null;}
function startClimb(pad){let p=R.p;if(p.attachCooldown>0||pad.dead)return; p.climbing=pad.id;p.grounded=false;p.vy=0;p.vx*=.35;}
function bounce(pad,arrivalVy){const p=R.p; if(p.bounceLock>0)return;
 let booster=Math.min(245,Math.max(0,arrivalVy-250)*.39);let combo=Math.min(5,p.combo)*18; p.vy=-(620+booster+combo);
 p.grounded=false;p.coyote=0;p.bounceLock=.22;pad.bounceGlow=1;pad.energy=Math.min(1,pad.energy+.25);p.combo=Math.min(9,p.combo+1);p.comboTime=3;R.stats.bounces++;R.shake=Math.max(R.shake,6);
 burst(p.x,pad.y-pad.ry+5,16,C.mint,190);R.rings.push({x:p.x,y:pad.y,r:6,max:96,life:.36,total:.36,color:C.mint});tone('bounce');}
function updatePlayer(dt){let p=R.p;p.bounceLock=Math.max(0,p.bounceLock-dt);p.attachCooldown=Math.max(0,p.attachCooldown-dt);p.comboTime=Math.max(0,p.comboTime-dt);if(!p.comboTime)p.combo=0;
 const dir=(R.keys.d?1:0)-(R.keys.a?1:0);if(dir)p.dir=dir;
 if(p.climbing!==null){const gel=R.pads.find(x=>x.id===p.climbing&&!x.dead);if(!gel){p.climbing=null;p.attachCooldown=.35;}else{
    let moveX=dir*260,moveY=((R.keys.s?1:0)-(R.keys.w?1:0))*280; p.x+=moveX*dt;p.y+=moveY*dt;
    // Sticky interior of the entire gel; ability to reach a high frozen blob via its tail.
    const dx=(p.x-gel.x)/(gel.rx-11),dy=(p.y-gel.y)/(gel.ry-12),rr=dx*dx+dy*dy;
    if(rr>1){let a=Math.atan2(dy,dx);p.x=gel.x+(gel.rx-11)*Math.cos(a);p.y=gel.y+(gel.ry-12)*Math.sin(a)}
    p.vy=0;p.vx=0;return;
 }}
 const target=dir*(p.grounded?355:355),accel=p.grounded?2300:1670; p.vx+=clamp(target-p.vx,-accel*dt,accel*dt);
 if(!dir&&p.grounded)p.vx*=Math.exp(-18*dt);
 const prevFoot=pFoot();p.vy+=1520*dt;p.vy=Math.min(910,p.vy);p.x=clamp(p.x+p.vx*dt,12,W-12);p.y+=p.vy*dt;
 const ground=nearestPlatformUnder(p.x,p.y,prevFoot,pFoot());if(ground&&p.vy>=0){p.y=ground.y-20;p.vy=0;p.grounded=true;p.coyote=.11;}else {p.coyote=Math.max(0,(p.coyote||0)-dt);p.grounded=false;}
 // Gel platform collision is checked before sticky side adhesion.
 let landed=false;for(const gel of R.pads){if(gel.dead)continue;const top=hitPadFromAbove(p,gel,prevFoot);if(top!==null){p.y=top-20;bounce(gel,p.vy);landed=true;break;}}
 if(!landed&&p.attachCooldown<=0&&!p.grounded&&p.vy>-560&&(R.keys.w||R.keys.s))for(const gel of R.pads){if(gel.dead)continue;if(intersectsPad(p,gel)){startClimb(gel);break;}}
 if(p.y>H+85){R.stats.falls++;burst(p.x,H-10,35,C.violet,280);p.x=R.respawn.x;p.y=R.respawn.y;p.vx=0;p.vy=-180;p.grounded=false;p.climbing=null;p.attachCooldown=.45;p.combo=0;R.biomass=Math.max(R.biomass,50);hint('ЩЕ ОДНА СПРОБА! ЖЕЛЕ Й БІОМАСА ВІДНОВЛЮЮТЬСЯ.',1.9);tone('reclaim');}
 if(R.door&&p.x>=R.door.x-13&&p.x<=R.door.x+R.door.w+13&&p.y>=R.door.y-40&&p.y<=R.door.y+R.door.h){R.stats.rooms++;if(R.room<2)resetRoom(R.room+1);else {R.phase='win';R.winTime=R.t;tone('bounce');}}
}
function updateObjects(dt){for(const o of R.objects){if(!o.alive)continue;if(o.pressureCooldown>0)o.pressureCooldown-=dt;if(o.fixed){const g=R.pads.find(p=>p.id===o.capturedBy&&!p.dead);if(g){o.x=g.x;o.y=g.y;}else{o.fixed=false;}continue;}
 o.vy=Math.min(1050,o.vy+1380*dt);o.x+=o.vx*dt;o.y+=o.vy*dt;o.angle+=o.omega*dt;o.omega*=Math.exp(-.5*dt);o.vx*=Math.exp(-.22*dt);
 o.grounded=false;for(const s of R.platforms){if(o.x+o.w*.37>s.x&&o.x-o.w*.37<s.x+s.w&&o.y+o.h*.5>=s.y&&o.y+o.h*.5-o.vy*dt<=s.y+17&&o.vy>0){o.y=s.y-o.h*.5;o.vy=-Math.abs(o.vy)*.18;o.vx*=.80;o.omega*=.6;o.grounded=true;}}
 if(o.x<-90||o.x>W+90||o.y>H+115){const captured=R.pads.find(p=>p.objectId===o.id&&!p.dead);if(captured)reclaim(captured,'pit');o.x=o.spawnX;o.y=o.spawnY;o.vx=0;o.vy=0;o.omega=0;o.angle=0;o.grounded=false;burst(o.x,o.y,8,C.mint,170);}
 }}
function updateShots(dt){for(const s of R.shots){if(s.dead)continue;let ox=s.x,oy=s.y;s.life+=dt;s.vy+=180*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.trail.push([s.x,s.y]);if(s.trail.length>8)s.trail.shift();
 let hit=null;for(const o of R.objects){if(o.alive&&Math.abs(o.x-s.x)<o.w*.57+17&&Math.abs(o.y-s.y)<o.h*.57+20){hit={type:'obj',x:o.x,y:o.y};break;}}
 if(!hit){for(const pl of R.platforms){if(s.x>=pl.x-12&&s.x<=pl.x+pl.w+12&&oy<=pl.y&&s.y>=pl.y){hit={type:'platform',x:s.x,y:pl.y-28};break;}if(ox<pl.x&&s.x>=pl.x&&s.y>pl.y&&s.y<H){hit={type:'wall',x:pl.x-24,y:s.y};break;}}}
 if(!hit&&s.life>=s.maxLife)hit={type:'air',x:clamp(s.x,40,W-40),y:clamp(s.y,60,H-120)};
 if(hit){s.dead=true;createGel(hit.x,hit.y,{cost:s.cost});}
 }
 R.shots=R.shots.filter(s=>!s.dead);
}
function updatePads(dt){for(const pad of R.pads){if(pad.dead)continue;pad.life+=dt;pad.pulse+=dt*4;pad.bounceGlow=Math.max(0,pad.bounceGlow-dt*2.3);
 const o=R.objects.find(z=>z.id===pad.objectId&&z.alive);if(o){pad.x=o.x;pad.y=o.y;}
 if(pad.blastDelay>0){pad.blastDelay-=dt;if(pad.blastDelay<=0){explode(pad,true);continue;}}
 // Pressure only arises when the heavy object touches its own living coating.
 if(pad.kind==='pressure'&&o){pad.pressure=clamp(pad.pressure+dt*(o.grounded?1.15:3.0),0,1);if(pad.pressure>=1){R.stats.pressures++;burst(pad.x,pad.y,24,C.yellow,210);tone('pressure');explode(pad);continue;}}
 // All exit paths (age, pit, overcap, manual) produce particles and return biomass.
 if(pad.life>=pad.maxAge){reclaim(pad,'expire');continue;}
 if(pad.y>H+65||pad.x<-100||pad.x>W+100)reclaim(pad,'pit');
 }
 R.pads=R.pads.filter(p=>!p.dead || p.life<0); // fully retired pads are no longer collidable
 if(R.lastPad&&!R.pads.some(p=>p.id===R.lastPad))R.lastPad=R.pads.at(-1)?.id||null;
}
function updateEffects(dt){for(const p of R.particles){p.life-=dt;p.vx*=Math.exp(-.8*dt);p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.home){const dx=R.p.x-p.x,dy=R.p.y-p.y;const d=Math.max(1,Math.hypot(dx,dy));p.vx+=dx/d*230*dt;p.vy+=dy/d*230*dt;}}R.particles=R.particles.filter(p=>p.life>0);
 for(const ring of R.rings){ring.life-=dt;ring.r+=((ring.max-ring.r)*7*dt);}R.rings=R.rings.filter(r=>r.life>0);R.shake*=Math.exp(-14*dt);R.flash=Math.max(0,R.flash-dt*2.4);
}
function update(dt){dt=Math.min(.04,Math.max(0,dt));R.t+=dt;R.roomTime+=dt;R.shotCooldown=Math.max(0,R.shotCooldown-dt);R.noticeT=Math.max(0,R.noticeT-dt);if(R.phase==='play'){R.biomass=Math.min(100,R.biomass+dt*(R.room===0?20:13));updatePlayer(dt);updateObjects(dt);updateShots(dt);updatePads(dt);}updateEffects(dt);}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function circ(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=color;ctx.fill()}
function round(x,y,w,h,r,fill,stroke,lw=1){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function label(s,x,y,font=16,color='#eaf1ff',align='left',weight=600){ctx.textAlign=align;ctx.fillStyle=color;ctx.font=`${weight} ${font}px system-ui,Arial`;ctx.fillText(s,x,y)}
function line(x1,y1,x2,y2,color,lw=2){ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function backdrop(){let g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#081322');g.addColorStop(.58,'#142032');g.addColorStop(1,'#121020');rect(0,0,W,H,g);
 // Bioluminescent microscopic chamber: soft shafts, vessels, and floating cell dust.
 ctx.save();for(let i=0;i<6;i++){const x=(i*235+120+Math.sin(R.t*.12+i)*13)%W;const grd=ctx.createLinearGradient(x-80,0,x+80,H);grd.addColorStop(0,'rgba(82,154,170,.10)');grd.addColorStop(1,'rgba(100,99,172,0)');ctx.fillStyle=grd;ctx.beginPath();ctx.moveTo(x-100,0);ctx.lineTo(x+95,0);ctx.lineTo(x+210,H);ctx.lineTo(x+80,H);ctx.fill();}
 for(let i=0;i<36;i++){let x=(i*149+31+R.t*(i%3+1)*3)%W,y=70+((i*89)%480);ctx.globalAlpha=.15+.15*Math.sin(i+R.t*.6);circ(x,y,2+i%4,i%3?'#7be5cf':'#b38bff');}
 ctx.globalAlpha=1;ctx.strokeStyle='rgba(138,159,205,.05)';ctx.lineWidth=1;for(let x=20;x<W;x+=40)line(x,0,x,H,'rgba(150,170,203,.05)');for(let y=20;y<H;y+=40)line(0,y,W,y,'rgba(150,170,203,.05)');ctx.restore();}
function drawPlatforms(){for(const pl of R.platforms){let grad=ctx.createLinearGradient(0,pl.y,0,H);grad.addColorStop(0,'#364b64');grad.addColorStop(.12,'#263748');grad.addColorStop(1,'#152331');round(pl.x,pl.y,pl.w,Math.min(H-pl.y+20,300),11,grad,'#496e83',2);rect(pl.x,pl.y+14,pl.w,7,'rgba(33,56,75,.65)');line(pl.x+2,pl.y+1,pl.x+pl.w-4,pl.y+1,'#91dccb',3);for(let x=pl.x+25;x<pl.x+pl.w-15;x+=44){circ(x,pl.y+23,2.3,'rgba(145,225,194,.22)');}}
 // Falling is safe, not a game over.
 ctx.save();let pit=ctx.createLinearGradient(0,600,0,720);pit.addColorStop(0,'rgba(202,102,225,0)');pit.addColorStop(1,'rgba(180,85,255,.22)');rect(0,600,W,120,pit);ctx.restore();}
function drawDoor(){const q=R.door;ctx.save();ctx.shadowBlur=24;ctx.shadowColor=C.mint;round(q.x,q.y,q.w,q.h,14,'rgba(38,151,136,.24)',C.mint,3);round(q.x+11,q.y+8,q.w-22,q.h-16,8,'rgba(102,245,210,.16)',C.bright,1);ctx.shadowBlur=0;label('↗',q.x+q.w/2,q.y+q.h/2+8,31,C.mint,'center',700);ctx.restore();}
function drawPad(p){const wobble=Math.sin(p.pulse+R.t*3)*3,rx=p.rx+wobble,ry=p.ry-wobble*.35;ctx.save();ctx.translate(p.x,p.y);ctx.shadowColor=p.kind==='pressure'?C.yellow:C.violet;ctx.shadowBlur=16+14*p.bounceGlow+16*p.pressure;
 let g=ctx.createRadialGradient(-rx*.35,-ry*.5,8,0,0,rx*1.25);g.addColorStop(0,p.kind==='pressure'?'rgba(255,214,135,.74)':'rgba(244,196,255,.65)');g.addColorStop(.57,p.kind==='pressure'?'rgba(245,151,142,.5)':'rgba(175,99,239,.48)');g.addColorStop(1,'rgba(92,44,184,.18)');ctx.beginPath();ctx.ellipse(0,0,rx,ry,Math.sin(R.t+p.id)*.025,0,TAU);ctx.fillStyle=g;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=p.kind==='pressure'?C.yellow:C.bright;ctx.stroke();ctx.shadowBlur=0;
 ctx.beginPath();ctx.ellipse(-rx*.36,-ry*.35,rx*.21,ry*.20,-.6,0,TAU);ctx.fillStyle='rgba(255,255,255,.29)';ctx.fill();
 for(let i=0;i<5;i++)circ(Math.cos(i*2.4+R.t*.5)*rx*.54,Math.sin(i*1.6-R.t*.6)*ry*.55,3.6,'rgba(247,211,255,.3)');
 if(p.kind==='pressure'){ctx.strokeStyle=C.yellow;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,Math.min(rx,ry)*.75,-PI/2,-PI/2+TAU*p.pressure);ctx.stroke();label('!',0,7,22,C.yellow,'center',800);}
 if(p.kind==='capture'){label('✦',0,10,23,'#f6d5ff','center',800);}
 ctx.restore();}
function drawObjects(){for(const o of R.objects){if(!o.alive)continue;ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.angle);ctx.shadowBlur=14;ctx.shadowColor='rgba(0,0,0,.75)';if(o.type==='chair'){
  round(-o.w*.30,-o.h*.3,o.w*.57,o.h*.6,5,'#bc8c72','#ffcfab',3);round(-o.w*.30,-o.h*.53,11,o.h*.47,4,'#b77b62','#f7bca2',2);line(-o.w*.22,o.h*.30,-o.w*.26,o.h*.53,'#e7ad91',6);line(o.w*.18,o.h*.30,o.w*.25,o.h*.52,'#e7ad91',6);
 }else {round(-o.w/2,-o.h/2,o.w,o.h,7,o.type==='crate'?'#966879':'#8c759a','#eac2bd',3);line(-o.w*.33,-o.h*.32,o.w*.33,o.h*.32,'#e6aab0',3);line(o.w*.33,-o.h*.32,-o.w*.33,o.h*.32,'#e6aab0',3);}
 ctx.restore();}}
function drawShots(){for(const s of R.shots){ctx.save();ctx.shadowBlur=15;ctx.shadowColor=C.violet;for(let i=0;i<s.trail.length;i++){const a=s.trail[i];circ(a[0],a[1],2+5*i/Math.max(1,s.trail.length),`rgba(205,151,255,${.15+.50*i/s.trail.length})`);}circ(s.x,s.y,12,C.violet);circ(s.x-3,s.y-4,4.2,C.bright);ctx.restore();}}
function drawPlayer(){let p=R.p;if(R.mouse.active&&R.phase==='play'){let a=Math.atan2(R.mouse.y-p.y+8,R.mouse.x-p.x),len=180;ctx.save();ctx.setLineDash([3,13]);ctx.lineWidth=2;ctx.strokeStyle='rgba(239,195,255,.65)';ctx.beginPath();ctx.moveTo(p.x+20*Math.cos(a),p.y-12+20*Math.sin(a));ctx.lineTo(p.x+len*Math.cos(a),p.y-12+len*Math.sin(a));ctx.stroke();ctx.setLineDash([]);ctx.restore();}ctx.save();ctx.translate(p.x,p.y);const scale=.84+.20*R.biomass/100;ctx.scale(scale,scale);
 ctx.shadowBlur=18;ctx.shadowColor='#b87af6';let g=ctx.createRadialGradient(-6,-11,5,0,0,26);g.addColorStop(0,'#dfb6ff');g.addColorStop(.7,'#9a69d9');g.addColorStop(1,'#693aa4');ctx.beginPath();ctx.ellipse(0,0,21,23+Math.sin(R.t*5)*1.3,0,0,TAU);ctx.fillStyle=g;ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#f1d6ff';ctx.stroke();ctx.shadowBlur=0;
 let eyeX=p.dir*5;circ(eyeX-5,-4,4,'#171c2a');circ(eyeX+5,-4,4,'#171c2a');circ(eyeX+6,-5,1.4,'#ffffff');
 ctx.strokeStyle='#e6b8fa';ctx.lineWidth=4;ctx.lineCap='round';let sway=Math.sin(R.t*12)*3;line(-11,17,-15+sway,26,'#c89bea',5);line(11,17,15-sway,26,'#c89bea',5);ctx.restore();
 if(p.climbing!==null){ctx.save();label('W / S — ЛАЗЬ  •  SPACE — СТРИБАЙ',p.x,p.y-48,12,C.mint,'center',600);ctx.restore();}}
function drawFX(){for(const r of R.rings){ctx.save();ctx.globalAlpha=clamp(r.life/r.total,0,1);ctx.strokeStyle=r.color;ctx.lineWidth=7*clamp(r.life/r.total,0,1);ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,TAU);ctx.stroke();ctx.restore();}
 for(const p of R.particles){ctx.save();ctx.globalAlpha=clamp(p.life/p.max,0,1);circ(p.x,p.y,p.r,p.col);ctx.restore();}}
function drawHUD(){round(24,22,288,89,18,'rgba(9,20,36,.82)','rgba(128,174,202,.2)',2);label('CYTOPLASM',43,51,25,C.bright,'left',800);label('BOUNCE & BLAST   •   v0.7',44,74,11,C.mint,'left',700);
 round(43,87,230,8,4,'rgba(95,115,135,.5)');round(43,87,230*R.biomass/100,8,4,C.violet);label(`${Math.round(R.biomass)}%`,278,98,11,C.bright,'right',700);
 const titles=['1/3  BOUNCE PLAYGROUND','2/3  BLAST RUN','3/3  FLYING JUNK'];round(366,22,542,57,17,'rgba(9,20,36,.72)','rgba(128,174,202,.2)',1);label(titles[R.room],637,58,18,C.mint,'center',800);
 round(974,22,280,72,16,'rgba(9,20,36,.78)','rgba(128,174,202,.2)',1);label('A / D — РУХ    SPACE — СТРИБОК',991,48,12,C.bright,'left',600);label('E — ЖЕЛЕ    R — ВИБУХ',991,71,13,C.yellow,'left',800);
 if(R.noticeT>0){round(195,636,890,52,16,'rgba(10,16,30,.90)','rgba(198,150,239,.45)',1);label(R.notice,640,668,16,C.bright,'center',700);}
 if(R.p.combo>=2){ctx.save();ctx.shadowBlur=12;ctx.shadowColor=C.yellow;label(`×${R.p.combo} COMBO!`,640,128,22,C.yellow,'center',850);ctx.restore();}
 if(R.room===0){label('НЕОБМЕЖЕНІ СПРОБИ · БІОМАСА ПОВЕРТАЄТЬСЯ',641,103,11,'#9ad6c6','center',600);}
 if(R.phase==='win'){rect(0,0,W,H,'rgba(8,14,28,.83)');label('ЖИВИЙ ХАОС!',640,290,62,C.bright,'center',900);label('Усі три кімнати пройдено. Ще один стрибок?',640,359,25,C.mint,'center',650);label('SPACE — ПОВТОРИТИ',640,423,25,C.yellow,'center',800);}
}
function draw(){ctx.clearRect(0,0,W,H);ctx.save();const shake=R.shake>0?R.shake:0;ctx.translate(rnd(-shake,shake),rnd(-shake*.6,shake*.6));backdrop();drawPlatforms();drawDoor();for(const p of R.pads)if(!p.dead)drawPad(p);drawObjects();drawShots();drawPlayer();drawFX();ctx.restore();if(R.flash){rect(0,0,W,H,`rgba(244,199,255,${R.flash*.15})`)}drawHUD();}
function step(dt){update(dt);draw()}
function getState(){return {room:R.room,phase:R.phase,biomass:R.biomass,player:{...R.p},pads:R.pads.filter(p=>!p.dead).map(p=>({...p})),shots:R.shots.map(s=>({...s})),objects:R.objects.filter(o=>o.alive).map(o=>({...o})),stats:{...R.stats},lastPad:R.lastPad,notice:R.notice,roomTime:R.roomTime};}
resetRoom(0);
return {step,update,draw,keyDown,keyUp,resetKeys,pointerDown,pointerMove,pointerUp,shoot,detonate,getState,resetRoom,createGel,explode,reclaim,_unsafeState:R};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createCytoplasm};
