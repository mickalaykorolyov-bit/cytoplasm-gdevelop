/* CYTOPLASM — Living Reactions v0.8.0
   Fast single-material arcade platformer. No abilities menu.
   A/D run · W jump · LEFT CLICK send gel projectile to cursor · R detonate selected gel. E is disabled.
   Context: Bounce (ground/air), Capture (moving object), Pressure (heavy load), Blast (chain).
   Copyright 2026. Original game logic and generated visuals. */
function createCytoplasm(canvas){
'use strict';
const W=1280,H=720,ctx=canvas.getContext('2d');
const PI=Math.PI,TAU=PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),rnd=(a,b)=>a+Math.random()*(b-a);
let nextId=1;
const C={violet:'#c99aff',bright:'#f1d0ff',mint:'#7cf8d7',yellow:'#ffdb86',red:'#ff8da9',navy:'#0c1122'};
// A single click creates a jelly projectile. The next free jelly personality rotates predictably.
// Every personality still bounces AND explodes on R. Contextual furniture/pressure override the next trait.
const GEL_TRAITS=['spring']; // ONE MATERIAL: context, not a menu, determines every reaction.
const TRAITS={
 spring:{name:'ЗВИЧАЙНЕ ЖЕЛЕ',color:'#c997ff',light:'#f6ddff',symbol:'↥',bounce:1,radius:205,force:540},
 blast:{name:'ФУГАС',color:'#ff91ac',light:'#ffe3e9',symbol:'✹',bounce:1,radius:310,force:1220},
 jet:{name:'РЕАКТИВНЕ',color:'#8fcbff',light:'#e4f5ff',symbol:'↑',bounce:1.07,radius:250,force:910},
 chain:{name:'КАСКАД',color:'#d4a0ff',light:'#fff0ff',symbol:'⚡',bounce:1.08,radius:260,force:870},
 capture:{name:'МЕБЛІ',color:'#ffdb86',light:'#fff4c9',symbol:'↑↑',bounce:1.6,radius:270,force:1030},
 pressure:{name:'ТИСК',color:'#ffa16e',light:'#fff3cc',symbol:'!',bounce:1.1,radius:280,force:1040}
};
const R={room:0,phase:'play',t:0,roomTime:0,biomass:100,p:{x:110,y:580,vx:0,vy:0,dir:1,grounded:false,bounceLock:0,climbing:null,attachCooldown:0,combo:0,comboTime:0,alive:true},pads:[],shots:[],objects:[],particles:[],rings:[],platforms:[],barriers:[],door:{x:1184,y:515,w:58,h:80},spikes:[],keys:{},mouse:{x:500,y:345,active:false},aim:-.7,shotCooldown:0,lastPad:null,jellyIndex:0,muzzleFx:0,notice:'',noticeT:0,respawn:{x:112,y:580},shake:0,flash:0,stats:{shots:0,bounces:0,superBounces:0,blasts:0,captures:0,pressures:0,chains:0,refunds:0,falls:0,rooms:0,barriersBroken:0},tutorialStep:0,winTime:0};
let audioCtx=null;
function tone(kind){try{if(typeof window==='undefined'||!(window.AudioContext||window.webkitAudioContext))return;if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();let o=audioCtx.createOscillator(),g=audioCtx.createGain(),tm=audioCtx.currentTime;
 const par=kind==='pop'?[240,590,.10,.045]:kind==='bounce'?[260,780,.17,.085]:kind==='blast'?[100,40,.29,.12]:kind==='capture'?[350,680,.14,.064]:kind==='pressure'?[80,170,.36,.095]:[320,120,.13,.038];
 o.type=kind==='blast'||kind==='pressure'?'sawtooth':'sine';o.frequency.setValueAtTime(par[0],tm);o.frequency.exponentialRampToValueAtTime(Math.max(20,par[1]),tm+par[2]);g.gain.setValueAtTime(par[3],tm);g.gain.exponentialRampToValueAtTime(.001,tm+par[2]);o.connect(g);g.connect(audioCtx.destination);o.start(tm);o.stop(tm+par[2]+.015);
 }catch(e){} }
function hint(msg,time=2.5){R.notice=msg;R.noticeT=time;}
function pFoot(){return R.p.y+18+Math.round((R.biomass/100)*2)}
function pRadius(){return 14+R.biomass*.045}
function newObject(type,x,y){const o={id:nextId++,type,x,y,spawnX:x,spawnY:y,vx:0,vy:0,angle:0,omega:0,mass:type==='crate'?4:type==='chair'?1.4:2,w:type==='crate'?83:type==='chair'?66:65,h:type==='crate'?75:type==='chair'?67:57,fixed:false,stored:null,capturedBy:null,pressureCooldown:0,alive:true,grounded:false};R.objects.push(o);return o;}
function _oldResetRoom(n=0){R.room=n;R.phase='play';R.t=0;R.roomTime=0;R.biomass=100;R.pads=[];R.shots=[];R.objects=[];R.particles=[];R.rings=[];R.barriers=[];R.keys={};R.lastPad=null;R.jellyIndex=0;R.muzzleFx=0;R.shotCooldown=0;R.mouse.active=false;R.aim=-.7;R.notice='';R.noticeT=0;R.tutorialStep=0;R.shake=0;R.flash=0;
 R.p={x:112,y:581,vx:0,vy:0,dir:1,grounded:false,bounceLock:0,climbing:null,attachCooldown:0,combo:0,comboTime:0,alive:true};
 if(n===0){R.platforms=[{x:0,y:620,w:390,h:100},{x:540,y:595,w:150,h:125},{x:840,y:535,w:440,h:185}];R.respawn={x:98,y:580};R.door={x:1182,y:468,w:66,h:67};hint('КЛІК — ПОСТРІЛ ЖЕЛЕ У ТОЧКУ КУРСОРА! W — СТРИБОК · R — ВИБУХ!',6);}
 else if(n===1){R.platforms=[{x:0,y:620,w:305,h:100},{x:490,y:570,w:120,h:150},{x:772,y:485,w:125,h:235},{x:1055,y:450,w:225,h:270}];R.respawn={x:93,y:580};R.door={x:1177,y:382,w:65,h:68};newObject('crate',555,529);hint('BLAST RUN: КЛІК ПО ВАЖКОМУ ЯЩИКУ → ТИСК → ВИБУХ!',6);}
 else {R.platforms=[{x:0,y:625,w:368,h:95},{x:590,y:605,w:135,h:115},{x:925,y:495,w:355,h:225}];R.respawn={x:105,y:581};R.door={x:1177,y:426,w:66,h:70};newObject('chair',1005,460);R.barriers=[{x:1094,y:402,w:35,h:93,broken:false}];hint('СТІЛЕЦЬ = СУПЕРБАТУТ + СНАРЯД! КЛІК НА СТІЛЕЦЬ → R → ЗЛАМАЙ СТІНУ.',6);}
 R.p.x=R.respawn.x;R.p.y=R.respawn.y;
}
function burst(x,y,n=16,col=C.violet,force=240){for(let i=0;i<n;i++){let a=rnd(0,TAU),s=rnd(.24,1)*force;R.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-30,life:rnd(.25,.75),max:.75,r:rnd(2,6),col,gravity:rnd(130,420)})}}
function sprayBack(x,y,refund,mode='reclaim'){
 if(refund>0){R.biomass=clamp(R.biomass+refund,0,100);R.stats.refunds++;}
 for(let i=0;i<13;i++){let a=rnd(0,TAU),s=rnd(55,225);R.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-45,life:rnd(.45,.8),max:.8,r:rnd(2,6),col:mode==='blast'?C.yellow:C.mint,gravity:20,home:true})}
 R.rings.push({x,y,r:10,max:mode==='blast'?96:60,life:.45,total:.45,color:mode==='blast'?C.red:C.mint});
}
function _oldCreateGel(x,y,options={}){
 if(R.pads.length>=8){const old=R.pads.find(q=>!q.dead&&!q.blastDelay);if(old)reclaim(old,'overflow');}
 let nearObject=R.objects.filter(o=>o.alive&&Math.hypot(o.x-x,o.y-y)<Math.max(o.w,o.h)*.7+42).sort((a,b)=>dist(a,{x,y})-dist(b,{x,y}))[0];
 let context='air',o=null; if(nearObject){o=nearObject;context=o.mass>=3?'pressure':'capture';}
 let pl=R.platforms.filter(q=>x>=q.x-17&&x<=q.x+q.w+17&&Math.abs(y-q.y)<85).sort((a,b)=>Math.abs(a.y-y)-Math.abs(b.y-y))[0];
 if(!o&&pl){context='bounce'; /* click position remains exactly where the user selected */}
 if(o&&o.capturedBy){const existing=R.pads.find(g=>g.id===o.capturedBy&&!g.dead);if(existing)reclaim(existing,'replace');}
 const trait=context==='capture'?'capture':context==='pressure'?'pressure':options.trait||'spring';
 const pad={id:nextId++,trait,x:o?o.x:x,y:o?o.y:y,rx:context==='capture'?88:context==='pressure'?79:64,ry:context==='capture'?72:context==='pressure'?54:40,kind:context,objectId:o?.id||null,life:0,maxAge:context==='capture'?13:context==='pressure'?8:9,pressure:0,bounceGlow:0,dead:false,blastDelay:0,pulse:0,cost:options.cost||14,energy:0,attached:!!o};
 R.pads.push(pad);R.lastPad=pad.id;R.rings.push({x:pad.x,y:pad.y,r:4,max:Math.max(pad.rx,pad.ry)*1.5,life:.29,total:.29,color:TRAITS[trait].color});
 if(o){o.capturedBy=pad.id;
 if(context==='capture'){o.fixed=true;o.stored={vx:o.vx,vy:o.vy,omega:o.omega};o.vx=0;o.vy=0;o.omega=0;R.stats.captures++;hint('СТІЛЕЦЬ У ЖЕЛЕ = СУПЕРБАТУТ! R — ВИСТРІЛИ СТІЛЬЦЕМ У ПЕРЕШКОДУ!',3.5);tone('capture');}
 else if(context==='pressure'){pad.pressure=.15;hint('PRESSURE! ВАЖКИЙ ВАНТАЖ СТИСКАЄ ЖЕЛЕ — ГОТУЙСЯ ДО ВИБУХУ!',2.4);}
 else hint('ЖЕЛЕ ОБВОЛОКЛО ПРЕДМЕТ — ТЕПЕР МОЖНА ВІДСКОЧИТИ!',1.9);
 }
 if(context==='air')hint('ПОВІТРЯНЕ ЖЕЛЕ — ПІДСКОЧИ НА НЬОМУ! R — ВИБУХ.',1.8);
 burst(pad.x,pad.y,23,TRAITS[trait].color,205);tone('pop');
 return pad;
}
function placeGelAt(x,y){
 if(R.phase!=='play'||R.shotCooldown>0)return false;
 if(R.biomass<14){hint('БІОМАСА ВІДНОВЛЮЄТЬСЯ — ВИКОРИСТАЙ ЖЕЛЕ АБО ПІДІРВИ ЙОГО!',1.6);return false;}
 if(!Number.isFinite(x)||!Number.isFinite(y))return false;
 x=clamp(x,0,W);y=clamp(y,0,H);
 const ox=R.p.x+R.p.dir*17,oy=R.p.y-7,dx=x-ox,dy=y-oy,d=Math.hypot(dx,dy);
 const trait=GEL_TRAITS[R.jellyIndex%GEL_TRAITS.length];R.jellyIndex++;
 const duration=clamp(.075+d/3200,.11,.32);
 R.shots.push({id:nextId++,x:ox,y:oy,originX:ox,originY:oy,targetX:x,targetY:y,elapsed:0,duration,cost:14,trait,trail:[[ox,oy]],dead:false});
 R.biomass-=14;R.shotCooldown=.095;R.stats.shots++;R.muzzleFx=.22;
 R.p.dir=dx>=0?1:-1;
 burst(ox,oy,9,TRAITS[trait].color,145);
 R.rings.push({x:ox,y:oy,r:4,max:30,life:.16,total:.16,color:TRAITS[trait].color});
 tone('shoot');
 return true;
}
function shoot(){return placeGelAt(R.mouse.active?R.mouse.x:R.p.x+R.p.dir*145,R.mouse.active?R.mouse.y:R.p.y-95);}
function reclaim(pad,how='expire'){
 if(!pad||pad.dead)return;pad.dead=true;
 const ob=R.objects.find(o=>o.id===pad.objectId);if(ob&&ob.capturedBy===pad.id){ob.capturedBy=null;if(ob.fixed){ob.fixed=false;ob.vx=ob.stored?.vx||0;ob.vy=ob.stored?.vy||0;ob.omega=ob.stored?.omega||0;ob.stored=null;}}
 sprayBack(pad.x,pad.y,pad.cost,how);
 burst(pad.x,pad.y,how==='expire'?12:20,C.mint,160);
 if(how==='expire'||how==='overflow')tone('reclaim');
 if(R.p.climbing===pad.id){R.p.climbing=null;R.p.attachCooldown=.3;}
}
function _oldExplode(pad,chain=false){
 if(!pad||pad.dead)return false;
 pad.dead=true;pad.blastDelay=0;R.stats.blasts++;if(chain)R.stats.chains++;
 const {x,y}=pad,trait=TRAITS[pad.trait]||TRAITS.blast;
 const radius=trait.radius, power=trait.force;
 R.shake=Math.max(R.shake,pad.trait==='blast'?23:pad.trait==='jet'?14:16);R.flash=pad.trait==='blast'?.32:.21;
 sprayBack(x,y,pad.cost*.9,'blast');burst(x,y,pad.trait==='blast'?90:pad.trait==='chain'?75:65,trait.color,power*.52);
 R.rings.push({x,y,r:9,max:radius*.92,life:.44,total:.44,color:trait.color});
 // All jelly personalities explode. Furniture uses its own rocket motion; jets propel mostly upward.
 for(const o of R.objects){if(!o.alive)continue;const d=Math.max(24,Math.hypot(o.x-x,o.y-y));if(d<radius){let force=(1-d/radius)*power/Math.sqrt(o.mass);let nx=(o.x-x)/d,ny=(o.y-y)/d;
   if(o.capturedBy===pad.id){o.fixed=false;o.capturedBy=null;o.vx+=(o.stored?.vx||0)*.25;o.vy+=(o.stored?.vy||0)*.25;o.omega+=(o.stored?.omega||0);o.stored=null;
    if(pad.kind==='capture'){let launchDir=(R.p.x<=o.x)?1:-1;o.vx+=launchDir*1280;o.vy-=400;o.omega+=launchDir*4;hint('МЕБЛІ-РАКЕТА! ОБОЛОНКА ВИБУХНУЛА Й ЗАПУСТИЛА ПРЕДМЕТ.',2.1);}}
   o.vx+=nx*force;o.vy+=pad.trait==='jet'?-Math.max(500,force*1.4):ny*force-Math.max(0,force*.55);
   o.omega+=rnd(-3.5,3.5);
  }}
 const q=R.p,d=Math.max(35,Math.hypot(q.x-x,q.y-y));if(d<radius+35){const force=(1-d/(radius+35))*power, nx=(q.x-x)/d,ny=(q.y-y)/d;
  q.vx+=nx*force*(pad.trait==='blast'?1.25:1);
  const up=pad.trait==='jet'?1000:pad.trait==='spring'?720:pad.trait==='blast'?640:560;
  q.vy=Math.min(q.vy,0)+Math.min(-240,ny*force-up*(1-d/(radius+50)));
  q.grounded=false;q.bounceLock=.20;q.climbing=null;q.attachCooldown=.21;q.combo=Math.min(9,q.combo+1);q.comboTime=3;
 }
 // The cascade personality has a substantially wider auto-chain radius, but any blast can ignite nearby gel.
 const triggerRadius=pad.trait==='chain'?375:pad.trait==='blast'?270:205;
 for(const other of R.pads){if(other.dead||other.id===pad.id||other.blastDelay>0)continue;
  if(Math.hypot(other.x-x,other.y-y)<triggerRadius)other.blastDelay=.09+rnd(.02,.1);
 }
 hint(pad.kind==='capture'?R.notice:pad.trait==='spring'?'ПРУЖНЕ: ВИБУХ-ПІДКИДАННЯ!':pad.trait==='blast'?'ФУГАС: ПОТУЖНА УДАРНА ХВИЛЯ!':pad.trait==='jet'?'РЕАКТИВНЕ: ВИБУХ УГОРУ!':pad.trait==='chain'?'КАСКАД: ЛАНЦЮГОВА ДЕТОНАЦІЯ!':'ТИСК: ВАНТАЖ ВИБУХНУВ!',1.7);
 tone('blast');return true;
}
function detonate(){
 const candidates=R.pads.filter(x=>!x.dead&&x.blastDelay===0);
 if(!candidates.length){hint('КЛІК МИШІ → ЖЕЛЕ ПРИЛЕТИТЬ → R ПІДІРВЕ ЙОГО!',1.6);return false;}
 // R acts on the blob closest to cursor. Move cursor to select any existing blob; repeats can detonate them all.
 const cursor=R.mouse.active?R.mouse:null;
 const nearest=cursor?candidates.slice().sort((a,b)=>dist(a,cursor)-dist(b,cursor))[0]:null;
 const pad=nearest||candidates.find(x=>x.id===R.lastPad)||candidates.at(-1);
 return explode(pad);
}
function keysFromEvent(x){if(x&&typeof x==='object'){const m={KeyA:'a',KeyD:'d',KeyR:'r',KeyW:'w',KeyS:'s',KeyN:'n',Space:'space',ArrowLeft:'a',ArrowRight:'d',ArrowUp:'w',ArrowDown:'s'};return m[x.code]||keysFromEvent(x.key);}
 const map={'ф':'a','в':'d','к':'r','ц':'w','і':'s','т':'n',' ':'space','space':'space','arrowleft':'a','arrowright':'d','arrowup':'w','arrowdown':'s'};
 return map[String(x||'').toLowerCase()]||String(x||'').toLowerCase();}
function keyDown(k){let key=keysFromEvent(k);if(R.keys[key])return;R.keys[key]=true;if(key==='n'){resetRoom(R.room);return}if(R.phase==='win'){if(key==='w')resetRoom(0);return}
 if(key==='r')detonate();if(key==='w'){const p=R.p;if(p.climbing!==null){p.climbing=null;p.attachCooldown=.35;p.vy=-675;p.grounded=false;p.bounceLock=.15;}
 else if(p.grounded||p.coyote>0){p.vy=-805;p.grounded=false;p.coyote=0;tone('bounce');}}}
function keyUp(k){let key=keysFromEvent(k);R.keys[key]=false}
function pointerMove(x,y){R.mouse={x,y,active:true};}
function pointerDown(x,y,button=0){R.mouse={x,y,active:true};if(button===0)return placeGelAt(x,y);return false;}
function pointerUp(x,y){R.mouse={x,y,active:true};}
function resetKeys(){R.keys={};R.p.vx=0;}
function intersectsPad(p,gel){const dx=(p.x-gel.x)/(gel.rx+7),dy=(p.y-gel.y)/(gel.ry+14);return dx*dx+dy*dy<1.05}
function nearestPlatformUnder(x,y,prevFoot,foot){let best=null;for(const s of R.platforms){if(x+13>=s.x&&x-13<=s.x+s.w&&prevFoot<=s.y+9&&foot>=s.y&&y<s.y+50){if(!best||s.y<best.y)best=s;}}return best;}
function hitPadFromAbove(p,pad,prevFoot){let dx=(p.x-pad.x)/pad.rx;if(Math.abs(dx)>=.96)return null;let top=pad.y-pad.ry*Math.sqrt(Math.max(0,1-dx*dx));return prevFoot<=top+12&&pFoot()>=top&&p.vy>20?top:null;}
function startClimb(pad){let p=R.p;if(p.attachCooldown>0||pad.dead)return; p.climbing=pad.id;p.grounded=false;p.vy=0;p.vx*=.35;}
function bounce(pad,arrivalVy){const p=R.p; if(p.bounceLock>0)return;
 let booster=Math.min(245,Math.max(0,arrivalVy-250)*.39);let combo=Math.min(5,p.combo)*18;let superBounce=pad.kind==='capture'||pad.kind==='creature';const trait=TRAITS[pad.trait]||TRAITS.spring;p.vy=-((superBounce?1050:620*trait.bounce)+booster+combo);if(superBounce){R.stats.superBounces++;hint('СУПЕРСТРИБОК! МЕБЛІ В ЖЕЛЕ ПІДКИДАЮТЬ ЗНАЧНО ВИЩЕ!',1.6);}
 p.grounded=false;p.coyote=0;p.bounceLock=.22;pad.bounceGlow=1;pad.energy=Math.min(1,pad.energy+.25);p.combo=Math.min(9,p.combo+1);p.comboTime=3;R.stats.bounces++;R.shake=Math.max(R.shake,6);
 burst(p.x,pad.y-pad.ry+5,pad.kind==='capture'?35:16,pad.kind==='capture'?C.yellow:C.mint,pad.kind==='capture'?270:190);R.rings.push({x:p.x,y:pad.y,r:6,max:96,life:.36,total:.36,color:C.mint});tone('bounce');}
function updatePlayer(dt){let p=R.p;p.bounceLock=Math.max(0,p.bounceLock-dt);p.attachCooldown=Math.max(0,p.attachCooldown-dt);p.comboTime=Math.max(0,p.comboTime-dt);if(!p.comboTime)p.combo=0;
 const dir=(R.keys.d?1:0)-(R.keys.a?1:0);if(dir)p.dir=dir;
 if(p.climbing!==null){const gel=R.pads.find(x=>x.id===p.climbing&&!x.dead);if(!gel){p.climbing=null;p.attachCooldown=.35;}else{
    let moveX=dir*260,moveY=R.keys.s?-295:0; p.x+=moveX*dt;p.y+=moveY*dt;
    // Sticky interior of the entire gel; ability to reach a high frozen blob via its tail.
    const dx=(p.x-gel.x)/(gel.rx-11),dy=(p.y-gel.y)/(gel.ry-12),rr=dx*dx+dy*dy;
    if(rr>1){let a=Math.atan2(dy,dx);p.x=gel.x+(gel.rx-11)*Math.cos(a);p.y=gel.y+(gel.ry-12)*Math.sin(a)}
    p.vy=0;p.vx=0;return;
 }}
 const target=dir*(p.grounded?355:355),accel=p.grounded?2300:1670; p.vx+=clamp(target-p.vx,-accel*dt,accel*dt);
 if(!dir&&p.grounded)p.vx*=Math.exp(-18*dt);
 const prevX=p.x;const prevFoot=pFoot();p.vy+=1520*dt;p.vy=Math.min(910,p.vy);p.x=clamp(p.x+p.vx*dt,12,W-12);p.y+=p.vy*dt;
 for(const b of R.barriers){if(!b.broken&&p.x+18>b.x&&p.x-18<b.x+b.w&&p.y+20>b.y&&p.y-20<b.y+b.h){p.x=prevX<b.x?b.x-19:b.x+b.w+19;p.vx=0;}}
 const ground=nearestPlatformUnder(p.x,p.y,prevFoot,pFoot());if(ground&&p.vy>=0){p.y=ground.y-20;p.vy=0;p.grounded=true;p.coyote=.11;}else {p.coyote=Math.max(0,(p.coyote||0)-dt);p.grounded=false;}
 // Gel platform collision is checked before sticky side adhesion.
 let landed=false;for(const gel of R.pads){if(gel.dead)continue;const top=hitPadFromAbove(p,gel,prevFoot);if(top!==null){p.y=top-20;bounce(gel,p.vy);landed=true;break;}}
 if(!landed&&p.attachCooldown<=0&&!p.grounded&&p.vy>-560&&R.keys.s)for(const gel of R.pads){if(gel.dead)continue;if(intersectsPad(p,gel)){startClimb(gel);break;}}
 if(p.y>H+85){R.stats.falls++;burst(p.x,H-10,35,C.violet,280);p.x=R.respawn.x;p.y=R.respawn.y;p.vx=0;p.vy=-180;p.grounded=false;p.climbing=null;p.attachCooldown=.45;p.combo=0;R.biomass=Math.max(R.biomass,50);hint('ЩЕ ОДНА СПРОБА! ЖЕЛЕ Й БІОМАСА ВІДНОВЛЮЮТЬСЯ.',1.9);tone('reclaim');}
 if(R.door&&p.x>=R.door.x-13&&p.x<=R.door.x+R.door.w+13&&p.y>=R.door.y-40&&p.y<=R.door.y+R.door.h){R.stats.rooms++;if(R.room<5)resetRoom(R.room+1);else {R.phase='win';R.winTime=R.t;tone('bounce');}}
}
function updateObjects(dt){for(const o of R.objects){if(!o.alive)continue;if(o.pressureCooldown>0)o.pressureCooldown-=dt;if(o.fixed){const g=R.pads.find(p=>p.id===o.capturedBy&&!p.dead);if(g){o.x=g.x;o.y=g.y;}else{o.fixed=false;}continue;}
 o.vy=Math.min(1050,o.vy+1380*dt);o.x+=o.vx*dt;o.y+=o.vy*dt;o.angle+=o.omega*dt;o.omega*=Math.exp(-.5*dt);o.vx*=Math.exp(-.22*dt);
 for(const b of R.barriers){if(!b.broken&&Math.abs(o.vx)>260&&o.x+o.w*.37>b.x&&o.x-o.w*.37<b.x+b.w&&o.y+o.h*.4>b.y&&o.y-o.h*.4<b.y+b.h){b.broken=true;R.stats.barriersBroken++;R.shake=Math.max(R.shake,17);burst(b.x+b.w/2,b.y+b.h/2,72,C.yellow,540);R.rings.push({x:b.x+b.w/2,y:b.y+b.h/2,r:15,max:138,life:.42,total:.42,color:C.yellow});hint('СТІНУ РОЗБИТО! МЕБЛІ + ЦИТОПЛАЗМА = СНАРЯД.',3);tone('blast');}}
 o.grounded=false;for(const s of R.platforms){if(o.x+o.w*.37>s.x&&o.x-o.w*.37<s.x+s.w&&o.y+o.h*.5>=s.y&&o.y+o.h*.5-o.vy*dt<=s.y+17&&o.vy>0){o.y=s.y-o.h*.5;o.vy=-Math.abs(o.vy)*.18;o.vx*=.80;o.omega*=.6;o.grounded=true;}}
 if(o.x<-90||o.x>W+90||o.y>H+115){const captured=R.pads.find(p=>p.objectId===o.id&&!p.dead);if(captured)reclaim(captured,'pit');o.x=o.spawnX;o.y=o.spawnY;o.vx=0;o.vy=0;o.omega=0;o.angle=0;o.grounded=false;burst(o.x,o.y,8,C.mint,170);}
 }}
function updateShots(dt){
 for(const s of R.shots){if(s.dead)continue;
  s.elapsed+=dt;
  // A visible and fast hero-to-click-point flight: flight is guided, so click coordinates remain exact.
  const t=clamp(s.elapsed/s.duration,0,1),ease=1-Math.pow(1-t,2);
  s.x=lerp(s.originX,s.targetX,ease);s.y=lerp(s.originY,s.targetY,ease)-Math.sin(t*PI)*Math.min(36,Math.hypot(s.targetX-s.originX,s.targetY-s.originY)*.075);
  s.trail.push([s.x,s.y]);if(s.trail.length>14)s.trail.shift();
  if(t>=1){s.dead=true;createGel(s.targetX,s.targetY,{cost:s.cost,trait:s.trait});}
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
function update(dt){dt=Math.min(.04,Math.max(0,dt));R.t+=dt;R.roomTime+=dt;R.shotCooldown=Math.max(0,R.shotCooldown-dt);R.muzzleFx=Math.max(0,R.muzzleFx-dt);R.noticeT=Math.max(0,R.noticeT-dt);if(R.phase==='play'){R.biomass=Math.min(100,R.biomass+dt*(R.room===0?20:13));updatePlayer(dt);updateObjects(dt);updateShots(dt);updateInteractive(dt);updatePads(dt);}updateEffects(dt);}
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
function drawPad(p){
 const trait=TRAITS[p.trait]||TRAITS.spring;
 const spawn=clamp(p.life/.19,0,1),pop=1+Math.sin(spawn*PI)*.22;
 const size=(.22+.78*(1-Math.pow(1-spawn,3)))*pop;
 const wobble=Math.sin(p.pulse+R.t*3)*3,rx=(p.rx+wobble)*size,ry=(p.ry-wobble*.35)*size;
 ctx.save();ctx.translate(p.x,p.y);ctx.shadowColor=trait.color;ctx.shadowBlur=18+20*p.bounceGlow+16*p.pressure;
 let g=ctx.createRadialGradient(-rx*.35,-ry*.5,6,0,0,rx*1.25);
 g.addColorStop(0,trait.light);g.addColorStop(.28,trait.color);g.addColorStop(1,p.trait==='blast'?'rgba(255,67,106,.15)':p.trait==='jet'?'rgba(50,112,250,.14)':'rgba(95,43,180,.16)');
 ctx.globalAlpha=.71;ctx.beginPath();ctx.ellipse(0,0,rx,ry,Math.sin(R.t+p.id)*.045,0,TAU);ctx.fillStyle=g;ctx.fill();
 ctx.globalAlpha=1;ctx.lineWidth=p.trait==='blast'?4:3;ctx.strokeStyle=trait.light;ctx.stroke();ctx.shadowBlur=0;
 ctx.beginPath();ctx.ellipse(-rx*.38,-ry*.35,rx*.22,ry*.20,-.6,0,TAU);ctx.fillStyle='rgba(255,255,255,.32)';ctx.fill();
 for(let i=0;i<5;i++)circ(Math.cos(i*2.4+R.t*.5)*rx*.6,Math.sin(i*1.6-R.t*.6)*ry*.52,3.5,'rgba(255,255,255,.35)');
 if(p.kind==='pressure'){ctx.strokeStyle=trait.light;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,Math.min(rx,ry)*.83,-PI/2,-PI/2+TAU*p.pressure);ctx.stroke();}
 if(p.trait==='jet'){ctx.strokeStyle='rgba(210,242,255,.9)';ctx.lineWidth=3;line(0,ry*.5,0,-ry*.50,'rgba(228,245,255,.8)',3);}
 if(p.trait==='chain'){for(let i=0;i<3;i++){const a=i*TAU/3+R.t*.7;circ(Math.cos(a)*rx*.92,Math.sin(a)*ry*.92,4,trait.light);}}
 label(trait.symbol,0,10*size,Math.max(16,28*size),trait.light,'center',900);
 ctx.restore();
 // White highlight communicates R's exact target: the gel closest to the mouse cursor.
 if(R.mouse.active&&R.pads.filter(q=>!q.dead&&q.blastDelay===0).slice().sort((a,b)=>dist(a,R.mouse)-dist(b,R.mouse))[0]===p){
  ctx.save();ctx.strokeStyle='rgba(255,255,255,.52)';ctx.lineWidth=1.5;ctx.setLineDash([4,5]);ctx.beginPath();ctx.ellipse(p.x,p.y,p.rx*1.17,p.ry*1.17,0,0,TAU);ctx.stroke();ctx.restore();
 }
}
function drawBarriers(){for(const b of R.barriers){if(b.broken)continue;ctx.save();ctx.shadowBlur=12;ctx.shadowColor=C.red;round(b.x,b.y,b.w,b.h,5,'#804956',C.red,3);for(let y=b.y+14;y<b.y+b.h-8;y+=22){line(b.x+6,y,b.x+b.w-6,y+13,C.yellow,2);}ctx.restore();label('ЛАМАЄТЬСЯ',b.x+b.w/2,b.y-15,12,C.yellow,'center',800);}}
function drawObjects(){for(const o of R.objects){if(!o.alive)continue;ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.angle);ctx.shadowBlur=14;ctx.shadowColor='rgba(0,0,0,.75)';if(o.type==='chair'){
  round(-o.w*.30,-o.h*.3,o.w*.57,o.h*.6,5,'#bc8c72','#ffcfab',3);round(-o.w*.30,-o.h*.53,11,o.h*.47,4,'#b77b62','#f7bca2',2);line(-o.w*.22,o.h*.30,-o.w*.26,o.h*.53,'#e7ad91',6);line(o.w*.18,o.h*.30,o.w*.25,o.h*.52,'#e7ad91',6);
 }else {round(-o.w/2,-o.h/2,o.w,o.h,7,o.type==='crate'?'#966879':'#8c759a','#eac2bd',3);line(-o.w*.33,-o.h*.32,o.w*.33,o.h*.32,'#e6aab0',3);line(o.w*.33,-o.h*.32,-o.w*.33,o.h*.32,'#e6aab0',3);}
 ctx.restore();}}
function drawShots(){for(const s of R.shots){const tr=TRAITS[s.trait]||TRAITS.spring;ctx.save();ctx.shadowBlur=22;ctx.shadowColor=tr.color;
 for(let i=0;i<s.trail.length;i++){const a=s.trail[i],alpha=(i+1)/(s.trail.length+2);
  circ(a[0],a[1],3+10*alpha,`rgba(220,200,255,${alpha*.22})`);
  if(i%3===0)circ(a[0],a[1],2+3*alpha,tr.color);
 }
 const dx=s.targetX-s.originX,dy=s.targetY-s.originY,ang=Math.atan2(dy,dx);
 ctx.translate(s.x,s.y);ctx.rotate(ang);ctx.fillStyle=tr.color;ctx.strokeStyle=tr.light;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,17,10,0,0,TAU);ctx.fill();ctx.stroke();
 circ(-5,-3,4,tr.light);ctx.restore();}}
function drawPlayer(){let p=R.p;if(R.mouse.active&&R.phase==='play'){ctx.save();ctx.strokeStyle='rgba(245,214,255,.68)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(R.mouse.x,R.mouse.y,14,0,TAU);ctx.stroke();line(R.mouse.x-21,R.mouse.y,R.mouse.x-15,R.mouse.y,C.bright,2);line(R.mouse.x+15,R.mouse.y,R.mouse.x+21,R.mouse.y,C.bright,2);ctx.restore();}ctx.save();ctx.translate(p.x,p.y);const scale=.84+.20*R.biomass/100;ctx.scale(scale,scale);
 ctx.shadowBlur=18;ctx.shadowColor='#b87af6';let g=ctx.createRadialGradient(-6,-11,5,0,0,26);g.addColorStop(0,'#dfb6ff');g.addColorStop(.7,'#9a69d9');g.addColorStop(1,'#693aa4');ctx.beginPath();ctx.ellipse(0,0,21,23+Math.sin(R.t*5)*1.3,0,0,TAU);ctx.fillStyle=g;ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#f1d6ff';ctx.stroke();ctx.shadowBlur=0;
 if(R.muzzleFx>0){const m=R.muzzleFx/.22;ctx.save();ctx.shadowBlur=20;ctx.shadowColor=C.bright;ctx.fillStyle='rgba(233,182,255,.85)';ctx.beginPath();ctx.ellipse(p.dir*23,-2,15*m,7*m,0,0,TAU);ctx.fill();ctx.restore();}
 let eyeX=p.dir*5;circ(eyeX-5,-4,4,'#171c2a');circ(eyeX+5,-4,4,'#171c2a');circ(eyeX+6,-5,1.4,'#ffffff');
 ctx.strokeStyle='#e6b8fa';ctx.lineWidth=4;ctx.lineCap='round';let sway=Math.sin(R.t*12)*3;line(-11,17,-15+sway,26,'#c89bea',5);line(11,17,15-sway,26,'#c89bea',5);ctx.restore();
 if(p.climbing!==null){ctx.save();label('S — ЛІЗЬ ВГОРУ  •  W — ВІДШТОВХНИСЬ',p.x,p.y-48,12,C.mint,'center',600);ctx.restore();}}
function drawFX(){for(const r of R.rings){ctx.save();ctx.globalAlpha=clamp(r.life/r.total,0,1);ctx.strokeStyle=r.color;ctx.lineWidth=7*clamp(r.life/r.total,0,1);ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,TAU);ctx.stroke();ctx.restore();}
 for(const p of R.particles){ctx.save();ctx.globalAlpha=clamp(p.life/p.max,0,1);circ(p.x,p.y,p.r,p.col);ctx.restore();}}
function _oldDrawHUD(){round(24,22,288,89,18,'rgba(9,20,36,.82)','rgba(128,174,202,.2)',2);label('CYTOPLASM',43,51,25,C.bright,'left',800);label('BOUNCE & BLAST   •   v0.8.0',44,74,11,C.mint,'left',700);
 round(43,87,230,8,4,'rgba(95,115,135,.5)');round(43,87,230*R.biomass/100,8,4,C.violet);label(`${Math.round(R.biomass)}%`,278,98,11,C.bright,'right',700);
 const titles=['1/3  BOUNCE PLAYGROUND','2/3  BLAST RUN','3/3  FURNITURE ROCKET'];round(366,22,542,57,17,'rgba(9,20,36,.72)','rgba(128,174,202,.2)',1);label(titles[R.room],637,58,18,C.mint,'center',800);
 round(974,22,280,72,16,'rgba(9,20,36,.78)','rgba(128,174,202,.2)',1);label('A / D — РУХ    W — СТРИБОК',991,48,12,C.bright,'left',600);label('КЛІК — ПОСТРІЛ    R — ВИБУХ',991,71,13,C.yellow,'left',800);
 if(R.noticeT>0){round(195,636,890,52,16,'rgba(10,16,30,.90)','rgba(198,150,239,.45)',1);label(R.notice,640,668,16,C.bright,'center',700);}
 if(R.p.combo>=2){ctx.save();ctx.shadowBlur=12;ctx.shadowColor=C.yellow;label(`×${R.p.combo} COMBO!`,640,128,22,C.yellow,'center',850);ctx.restore();}
 // Small, readable HUD shows each new jelly's personality; no extra ability button.
 const next=TRAITS[GEL_TRAITS[R.jellyIndex%4]];
 round(366,84,542,34,10,'rgba(9,20,36,.82)','rgba(128,174,202,.28)',1);
 label('НАСТУПНЕ ЖЕЛЕ: '+next.symbol+' '+next.name+'   •   КОЖНЕ МОЖНА ПІДІРВАТИ',637,107,12,next.color,'center',750);
 if(R.room===0){label('НЕОБМЕЖЕНІ СПРОБИ · БІОМАСА ПОВЕРТАЄТЬСЯ',640,135,11,'#9ad6c6','center',600);}
 if(R.phase==='win'){rect(0,0,W,H,'rgba(8,14,28,.83)');label('ЖИВИЙ ХАОС!',640,290,62,C.bright,'center',900);label('Усі три кімнати пройдено. Ще один стрибок?',640,359,25,C.mint,'center',650);label('W — ПОВТОРИТИ',640,423,25,C.yellow,'center',800);}
}
function draw(){ctx.clearRect(0,0,W,H);ctx.save();const shake=R.shake>0?R.shake:0;ctx.translate(rnd(-shake,shake),rnd(-shake*.6,shake*.6));backdrop();drawPlatforms();drawDoor();drawBarriers();for(const p of R.pads)if(!p.dead)drawPad(p);drawObjects();drawInteractables();drawProjectiles();drawShots();drawPlayer();drawFX();ctx.restore();if(R.flash){rect(0,0,W,H,`rgba(244,199,255,${R.flash*.15})`)}drawHUD();}
function step(dt){update(dt);draw()}
function getState(){return {room:R.room,phase:R.phase,biomass:R.biomass,player:{...R.p},pads:R.pads.filter(p=>!p.dead).map(p=>({...p})),shots:R.shots.map(s=>({...s})),objects:R.objects.filter(o=>o.alive).map(o=>({...o})),stats:{...R.stats},lastPad:R.lastPad,notice:R.notice,roomTime:R.roomTime};}

// === CYTOPLASM v0.8 — CONTEXTUAL MATERIAL REACTION SYSTEM ===
// The material has exactly one default behavior: a small trampoline.
// Interacting with real props gives it new, deterministic reactions.
const RX={
  plain:{name:'БАТУТ',color:'#c997ff',light:'#f8e6ff',symbol:'↥',bounce:1,radius:205,force:540},
  capture:{name:'СТАЗИС',color:'#a3f4dc',light:'#e2fff7',symbol:'❄',bounce:1.3,radius:250,force:850},
  creature:{name:'ЖИВИЙ ВИБУХ',color:'#ffbc76',light:'#fff0c4',symbol:'●',bounce:1.95,radius:315,force:1150},
  fire:{name:'ВОГОНЬ',color:'#ff8557',light:'#ffdec0',symbol:'♨',bounce:1,radius:245,force:760},
  electric:{name:'БЛИСКАВКА',color:'#83dcff',light:'#effaff',symbol:'ϟ',bounce:1,radius:250,force:830},
  pressure:{name:'КАТАПУЛЬТА',color:'#f3b879',light:'#fff4d5',symbol:'!',bounce:1.2,radius:270,force:1080},
  needle:{name:'РЕАКТИВНИЙ СТРУМІНЬ',color:'#ff89c9',light:'#ffe1f4',symbol:'➜',bounce:1,radius:285,force:1250},
  pipe:{name:'ЖЕЛЕЙНА ГАРМАТА',color:'#93f0e4',light:'#e4fffa',symbol:'➤',bounce:1.25,radius:265,force:920},
  magnet:{name:'МАГНІТНИЙ ВИБУХ',color:'#d0bdff',light:'#f1e8ff',symbol:'⊕',bounce:1.2,radius:370,force:1030},
  gear:{name:'ЦЕНТРИФУГА',color:'#f5e696',light:'#fffce1',symbol:'⚙',bounce:1.1,radius:260,force:950}
};
Object.assign(TRAITS,RX);
const LABS=[
 ['01  ОСНОВА + МЕБЛІ','Звичайне желе → батут. Влуч у ЛЕТЮЧИЙ СТІЛЕЦЬ → він завмре. Другий клік по желе → вибух і уламки.'],
 ['02  ЖИВА ЦИТОПЛАЗМА','Влуч у РАВЛИКА або ПАВУКА → живий супербатут набухає, а потім вибухає. Ланцюг: створити → відскочити → підірвати.'],
 ['03  ВОГОНЬ + ГАРМАТА','Влуч у СВІЧКУ → вогонь поширюється. Влуч у ТРУБУ → гарматний постріл. Палаючий заряд підпалює перешкоди.'],
 ['04  ЕЛЕКТРИЧНИЙ ЛАНЦЮГ','Влуч у БАТАРЕЮ → блискавка стрибає через МЕТАЛ, перемикачі та ворогів. Запалюй механізми.'],
 ['05  ТИСК + ШИП + ШЕСТЕРНЯ','Клік по ШИПУ → желе готове. Клік по СЕЙФУ → катапульта → шестерня метає уламок у шип → спрямований вибух.'],
 ['06  МАГНІТНА КАТАПУЛЬТА','Влуч у МАГНІТ → притягни метал. Другий постріл по желе → розліт уламків. Равлик на стелі — живий трамплін.']
];
function addProp(type,x,y,extra={}){
 const z={id:nextId++,type,x,y,homeX:x,homeY:y,alive:true,active:false,charge:0,heat:0,spin:0,cool:0,dir:1,...extra};R.props.push(z);return z;
}
function addEnemy(x,y,extra={}){const e={id:nextId++,x,y,homeX:x,homeY:y,alive:true,stun:0,deadTime:0,hit:0,...extra};R.enemies.push(e);return e;}
function addWall(x,y,w,h,kind='wood'){R.barriers.push({x,y,w,h,kind,broken:false,burn:0,charged:false});}
function resetRoom(n=0){
 n=clamp(Number(n)||0,0,5);_oldResetRoom(0);R.room=n;R.phase='play';R.props=[];R.enemies=[];R.shards=[];R.bolts=[];R.fireballs=[];R.burns=[];R.events=[];R.lastReaction='';R.lastReactionTime=0;R.stats.reactions=R.stats.reactions||{};R.stats.enemyKills=R.stats.enemyKills||0;
 R.pads=[];R.shots=[];R.objects=[];R.barriers=[];R.biomass=100;R.p.climbing=null;R.p.x=92;R.p.y=579;R.p.vx=0;R.p.vy=0;R.respawn={x:92,y:579};R.platforms=[{x:0,y:623,w:315,h:97},{x:420,y:607,w:195,h:113},{x:720,y:575,w:560,h:145}];R.door={x:1187,y:501,w:64,h:73};
 if(n===0){
  const chair=newObject('chair',485,340);chair.vx=195;chair.vy=-270;chair.respawnFly=true;chair.flyingPhase=0;
  addProp('snail',830,534,{ceiling:false,range:85});addEnemy(1095,538);
  addWall(1027,480,29,93,'wood');
 }else if(n===1){
  R.platforms=[{x:0,y:623,w:370,h:97},{x:450,y:562,w:185,h:158},{x:730,y:623,w:550,h:97}];
  addProp('snail',555,310,{ceiling:true,range:105});addProp('spider',882,448,{range:67});addEnemy(1080,584);newObject('chair',1030,530);
 }else if(n===2){
  R.platforms=[{x:0,y:623,w:380,h:97},{x:465,y:591,w:250,h:129},{x:784,y:564,w:496,h:156}];
  addProp('candle',577,543);addProp('pipe',820,515,{dir:1});addProp('wood',1062,505,{hot:0});addEnemy(1182,529);addWall(1125,478,28,85,'wood');
 }else if(n===3){
  R.platforms=[{x:0,y:623,w:440,h:97},{x:525,y:593,w:175,h:127},{x:780,y:545,w:500,h:175}];
  addProp('battery',365,558);addProp('switch',935,455);addProp('switch',1120,458);addEnemy(725,545);addWall(1040,448,28,97,'electric');
  let m1=newObject('metal',545,540);m1.vx=10;let m2=newObject('metal',605,540);m2.vx=-10;
 }else if(n===4){
  R.platforms=[{x:0,y:623,w:480,h:97},{x:570,y:580,w:210,h:140},{x:850,y:531,w:430,h:189}];
  let box=newObject('crate',350,550);box.mass=5;addProp('gear',741,506);addProp('needle',945,473,{dir:-1});addEnemy(1103,493);addWall(1180,436,30,95,'wood');
 }else {
  R.platforms=[{x:0,y:623,w:355,h:97},{x:460,y:576,w:255,h:144},{x:810,y:538,w:470,h:182}];
  addProp('magnet',620,418);addProp('snail',860,274,{ceiling:true,range:100});addEnemy(1108,500);addWall(1045,436,30,103,'wood');
  for(let i=0;i<4;i++){let m=newObject('metal',445+i*108,470+(i%2)*26);m.vx=i%2?-.8:.8;}
 }
 hint('КЛІК → ЦИТОПЛАЗМА + ОБʼЄКТ = НОВА ФІЗИКА! 1–6 — ВИБІР КІМНАТИ',5.5);
}
function event(name,x,y){R.lastReaction=name;R.lastReactionTime=3.3;R.stats.reactions[name]=(R.stats.reactions[name]||0)+1;R.rings.push({x,y,r:8,max:92,life:.4,total:.4,color:'#f6b4ff'});}
function reactionPad(kind,x,y,opt={}){
 const cfg=RX[kind]||RX.plain;const pad={id:nextId++,trait:kind==='plain'?'spring':kind,x,y,rx:kind==='plain'?48:kind==='pressure'?74:kind==='creature'?70:kind==='capture'?74:64,ry:kind==='plain'?31:kind==='pressure'?40:kind==='creature'?67:kind==='capture'?61:51,kind,objectId:opt.objectId||null,targetId:opt.targetId||null,life:0,maxAge:kind==='plain'?10:kind==='creature'?9:kind==='fire'?9:kind==='electric'?8:kind==='magnet'?7:11,pressure:0,bounceGlow:0,dead:false,blastDelay:0,pulse:0,cost:opt.cost||11,energy:0,attached:kind!=='plain',charged:0,ready:false,heat:kind==='fire'?1:0,dir:opt.dir||1};
 R.pads.push(pad);R.lastPad=pad.id;burst(x,y,18,cfg.color,170);R.rings.push({x,y,r:5,max:76,life:.24,total:.24,color:cfg.color});tone('pop');return pad;
}
function createGel(x,y,options={}){
 if(R.pads.filter(p=>!p.dead).length>=13){const old=R.pads.find(p=>!p.dead&&!p.blastDelay);if(old)reclaim(old,'overflow');}
 // Double shot on already existing gel is ALWAYS an explosion with real flying shards.
 const existing=R.pads.filter(p=>!p.dead&&Math.hypot((x-p.x)/p.rx,(y-p.y)/p.ry)<1.2).sort((a,b)=>dist(a,{x,y})-dist(b,{x,y}))[0];
 if(existing){event('ЖЕЛЕ + ЖЕЛЕ → ВИБУХ УЛАМКІВ',x,y);explode(existing);return null;}
 const targets=(R.props||[]).filter(z=>z.alive&&z.type!=='switch'&&z.type!=='wood'&&Math.hypot(z.x-x,z.y-y)<(z.type==='pipe'?78:z.type==='snail'||z.type==='spider'?72:67)).sort((a,b)=>dist(a,{x,y})-dist(b,{x,y}));
 let obj=R.objects.filter(z=>z.alive&&!z.fixed&&Math.abs(z.x-x)<z.w*.6+19&&Math.abs(z.y-y)<z.h*.6+20).sort((a,b)=>dist(a,{x,y})-dist(b,{x,y}))[0];
 // Heavy metal receives magnetized gel from touching magnet, not special classes.
 let target=targets[0]; if(obj&&(!target||dist(obj,{x,y})<dist(target,{x,y})*.86))target=null;
 let kind='plain',tx=x,ty=y,opt={cost:options.cost||11};
 if(target){
  kind=({snail:'creature',spider:'creature',candle:'fire',battery:'electric',needle:'needle',pipe:'pipe',magnet:'magnet',gear:'gear'})[target.type]||'plain';tx=target.x;ty=target.y;opt.targetId=target.id;opt.dir=target.dir||1;
  if(kind==='creature')event('ЖИВА ІСТОТА → СУПЕРБАТУТ',tx,ty);
  if(kind==='fire'){target.heat=1;event('СВІЧКА → ПОЖЕЖА',tx,ty);}
  if(kind==='electric'){target.charge=1;event('ЕЛЕКТРИКА → БЛИСКАВКИ',tx,ty);}
  if(kind==='needle')event('ШИП → СПРЯМОВАНИЙ ВИБУХ',tx,ty);
  if(kind==='pipe'){target.charge=1;event('ТРУБА → ЖЕЛЕЙНА ГАРМАТА',tx,ty);}
  if(kind==='magnet'){target.charge=1;event('МАГНІТ → ПРИТЯГАННЯ МЕТАЛУ',tx,ty);}
  if(kind==='gear')event('ШЕСТЕРНЯ → ОБЕРТАННЯ',tx,ty);
 }else if(obj){
  kind=obj.mass>=3?'pressure':Math.hypot(obj.vx,obj.vy)>55?'capture':'plain';
  tx=obj.x;ty=kind==='pressure'?obj.y+obj.h*.53:obj.y;opt.objectId=obj.id;
  if(kind==='capture'){obj.fixed=true;obj.stored={vx:obj.vx,vy:obj.vy,omega:obj.omega};obj.vx=obj.vy=obj.omega=0;event('РУХОМИЙ ПРЕДМЕТ → СТАЗИС',tx,ty);R.stats.captures++;}
  if(kind==='pressure'){event('СЕЙФ → ПНЕВМАТИЧНА КАТАПУЛЬТА',tx,ty);}
 }
 const pad=reactionPad(kind,tx,ty,opt);
 if(obj&&kind!=='plain')obj.capturedBy=pad.id;
 if(target&&(kind==='creature'||kind==='fire'||kind==='electric'||kind==='magnet'||kind==='pipe'||kind==='needle'||kind==='gear'))target.padId=pad.id;
 return pad;
}
function placeGelAt(x,y){
 if(R.phase!=='play'||R.shotCooldown>0)return false;
 if(R.biomass<10){hint('БІОМАСА ВІДНОВЛЮЄТЬСЯ — ПІДІРВИ ЖЕЛЕ АБО ПОВТОРИ КЛІК',1.7);return false;}
 if(!Number.isFinite(x)||!Number.isFinite(y))return false;
 x=clamp(x,0,W);y=clamp(y,0,H);
 const ox=R.p.x+R.p.dir*18,oy=R.p.y-7,dx=x-ox,dy=y-oy,d=Math.hypot(dx,dy);
 const selectedGel=R.pads.find(z=>!z.dead&&Math.hypot((x-z.x)/z.rx,(y-z.y)/z.ry)<1.2);
 const selectedProp=!selectedGel&&R.props.find(z=>z.alive&&Math.hypot(z.x-x,z.y-y)<65);
 const selectedObject=!selectedGel&&!selectedProp&&R.objects.find(z=>z.alive&&Math.abs(z.x-x)<z.w*.6+19&&Math.abs(z.y-y)<z.h*.6+20);
 R.shots.push({id:nextId++,x:ox,y:oy,originX:ox,originY:oy,targetX:x,targetY:y,lockedGelId:selectedGel?.id,lockedPropId:selectedProp?.id,lockedObjectId:selectedObject?.id,elapsed:0,duration:clamp(.09+d/2450,.13,.46),cost:11,trait:'spring',trail:[[ox,oy]],dead:false});
 R.biomass-=11;R.shotCooldown=.10;R.stats.shots++;R.muzzleFx=.20;R.p.dir=dx>=0?1:-1;
 burst(ox,oy,8,C.violet,140);tone('shoot');return true;
}
function spawnShards(x,y,count=15,force=680,angle=null,color='#e6b0ff'){
 for(let i=0;i<count;i++){
  const a=angle===null?i*TAU/count+rnd(-.2,.2):angle+rnd(-.55,.55),s=force*rnd(.54,1.08);
  R.shards.push({x,y,px:x,py:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-30,life:rnd(.52,1.2),r:rnd(3,7),col:color,damage:1});
 }
}
function emitBolt(x,y,tx,ty,kind='electric'){R.bolts.push({x,y,tx,ty,life:.23,total:.23,kind,jag:rnd(-1,1)});burst(tx,ty,7,kind==='electric'?'#91e6ff':'#ff9b66',150);}
function burnAt(x,y,radius=150){
 R.burns.push({x,y,r:16,max:radius,life:2,total:2});burst(x,y,40,'#ff9661',340);
 for(const b of R.barriers){if(!b.broken&&b.kind==='wood'&&Math.hypot(x-(b.x+b.w/2),y-(b.y+b.h/2))<radius+55){b.burn=Math.max(b.burn,1.3);}}
 for(const e of R.enemies){if(e.alive&&Math.hypot(e.x-x,e.y-y)<radius)killEnemy(e,'ВОГОНЬ');}
 for(const gel of R.pads){if(!gel.dead&&gel.kind!=='fire'&&Math.hypot(gel.x-x,gel.y-y)<radius*.85&&gel.blastDelay===0){gel.blastDelay=.10+rnd(.04,.19);}}
 const pipe=R.props.find(z=>z.type==='pipe'&&Math.hypot(z.x-x,z.y-y)<radius+115);if(pipe)pipe.heat=1;
}
function killEnemy(e,reason='УЛАМОК'){if(!e||!e.alive)return;e.alive=false;e.deadTime=0;R.stats.enemyKills++;burst(e.x,e.y,37,'#ff8dbb',330);R.rings.push({x:e.x,y:e.y,r:5,max:90,life:.34,total:.34,color:'#ff95bd'});event(reason+' → ВОРОГ ЗНЕШКОДЖЕНИЙ',e.x,e.y);}
function explode(pad,chain=false){
 if(!pad||pad.dead)return false;
 const {x,y,kind}=pad;let target=R.props.find(z=>z.id===pad.targetId);
 const obj=R.objects.find(z=>z.id===pad.objectId);
 // A needle turns the blast into a directed jet opposite the sharp tip.
 if(kind==='needle'){
  let dir=target?.dir||pad.dir||1;spawnShards(x,y,24,1100,dir>0?PI:0,'#ffa6d7');
  for(const o of R.objects){if(!o.alive)continue;if(Math.hypot(o.x-x,o.y-y)<350){o.vx+=-dir*1270;o.vy-=450;}}
  if(Math.hypot(R.p.x-x,R.p.y-y)<350){R.p.vx+=-dir*1020;R.p.vy=-Math.max(760,Math.abs(R.p.vy));}
  event('ШИП → РЕАКТИВНИЙ СТРУМІНЬ',x,y);
 }
 if(kind==='creature'){
  spawnShards(x,y,28,850,null,'#ffdb87');
  if(target){target.vx=(R.p.x<target.x?1:-1)*600;target.vy=-620;target.boost=1.5;}
  event('ЖИВА БОМБА → СУПЕРВІДСКОК',x,y);
 }
 if(kind==='fire'){burnAt(x,y,255);event('ВОГОНЬ → ПАЛАЮЧА ХВИЛЯ',x,y);}
 if(kind==='electric'){electricDischarge(x,y,true);event('ЕЛЕКТРОВИБУХ → ЛАНЦЮГ',x,y);}
 if(kind==='magnet'){
  for(const o of R.objects.filter(o=>o.type==='metal'&&o.alive)){
   const d=Math.hypot(o.x-x,o.y-y);if(d<560){const a=Math.atan2(o.y-y,o.x-x);o.vx=Math.cos(a)*1420;o.vy=Math.sin(a)*1220-230;}
  }
  spawnShards(x,y,16,870,null,'#b5a8ff');event('МАГНІТ → МЕТАЛЕВА КАТАПУЛЬТА',x,y);
 }
 if(kind==='pressure'&&obj){obj.vx=(R.room===4?870:390);obj.vy=(R.room===4?-260:-720);obj.omega=4;obj.capturedBy=null;event('ТИСК → СЕЙФ ВИСТРІЛИВ',x,y);}
 if(kind==='gear'){spawnShards(x,y,18,800,null,'#ffe59b');event('ШЕСТЕРНЯ → УЛАМКИ',x,y);}
 if(kind==='pipe'){firePipe(target||{x,y,dir:1},true);event('ГАРМАТА → ПОСТРІЛ',x,y);}
 if(kind==='capture'&&obj){obj.respawnFly=false;obj.vx=obj.vx||750;obj.vy-=240;}
 // Even basic jelly detonates and makes lethal flying shrapnel on second click.
 spawnShards(x,y,kind==='plain'?22:12,kind==='plain'?690:550,null,RX[kind]?.color||'#c997ff');
 return _oldExplode(pad,chain);
}
function electricDischarge(x,y,strong=false){
 const targets=[...R.props.filter(z=>z.alive&&(z.type==='switch'||z.type==='battery')),...R.objects.filter(z=>z.alive&&z.type==='metal'),...R.enemies.filter(z=>z.alive)];
 let linked=targets.filter(z=>Math.hypot(z.x-x,z.y-y)>14).sort((a,b)=>dist(a,{x,y})-dist(b,{x,y}));
 let origin={x,y};let used=0;
 for(const z of linked){if(used>=6)break;const d=Math.hypot(z.x-origin.x,z.y-origin.y);if(d>(strong?780:465))continue;
  emitBolt(origin.x,origin.y,z.x,z.y);used++;
  if(z.type==='switch'){z.active=true;event('БЛИСКАВКА → ПЕРЕМИКАЧ УВІМКНЕНО',z.x,z.y);}
  if(z.type==='metal'){z.vx+=rnd(110,340);z.vy-=420;}
  if('stun'in z){z.stun=2.9;if(strong&&z.hit++>0)killEnemy(z,'ЕЛЕКТРИКА');}
  origin=z;
 }
 if(R.props.filter(z=>z.type==='switch').every(z=>z.active)){for(const b of R.barriers.filter(b=>b.kind==='electric')){b.broken=true;burst(b.x,b.y,40,'#8de1ff',350);}}
}
function firePipe(pipe,fromBlast=false){
 if(!pipe||!pipe.alive)return;
 const dir=pipe.dir||1,hot=pipe.heat>.2||R.burns.some(b=>Math.hypot(b.x-pipe.x,b.y-pipe.y)<260);
 let launched=false;
 if(Math.hypot(R.p.x-pipe.x,R.p.y-pipe.y)<88){R.p.vx=dir*1050;R.p.vy=-660;R.p.grounded=false;launched=true;event('ТРУБА → ГЕРОЙ ВИЛЕТІВ',pipe.x,pipe.y);}
 for(const o of R.objects){if(o.alive&&Math.hypot(o.x-pipe.x,o.y-pipe.y)<105){o.vx=dir*1150;o.vy=-450;launched=true;break;}}
 R.fireballs.push({x:pipe.x+dir*52,y:pipe.y-5,vx:dir*860,vy:-230,life:2.1,hot,dir,scale:launched?.8:1.15});
 burst(pipe.x+dir*42,pipe.y,35,hot?'#ff9c5d':'#acffed',440);R.shake=Math.max(R.shake,10);
 if(hot)event('ПАЛАЮЧА ГАРМАТА → ВОГНЯНИЙ СНАРЯД',pipe.x,pipe.y);
}
function updateInteractive(dt){
 R.lastReactionTime=Math.max(0,R.lastReactionTime-dt);
 for(const z of R.props){if(!z.alive)continue;z.cool=Math.max(0,z.cool-dt);
  if(z.type==='snail'||z.type==='spider'){
   if(!z.boost){z.x=z.homeX+Math.sin(R.t*(z.type==='snail'?.8:1.7)+z.id)*(z.range||65);z.y=z.homeY+(z.ceiling?Math.sin(R.t*1.4)*8:Math.sin(R.t*2.2)*16);}
   else{z.x+= (z.vx||0)*dt;z.y+=(z.vy||0)*dt;z.vy=(z.vy||0)+900*dt;z.boost-=dt;if(z.boost<=0){z.boost=0;z.x=z.homeX;z.y=z.homeY;}}
  }
  const pad=R.pads.find(p=>!p.dead&&p.targetId===z.id);
  if(pad&&(z.type==='snail'||z.type==='spider')){pad.x=z.x;pad.y=z.y;pad.rx=70+pad.life*2.5;pad.ry=65+pad.life*2.9;pad.pressure=Math.min(1,pad.life/3.2);if(pad.life>4.2)explode(pad);}
  if(pad&&z.type==='magnet'){
   const metal=R.objects.filter(o=>o.alive&&o.type==='metal');
   for(const o of metal){const d=Math.max(20,Math.hypot(z.x-o.x,z.y-o.y));if(d<520){let a=(1150/Math.max(1,o.mass))*dt;o.vx+=(z.x-o.x)/d*a;o.vy+=(z.y-o.y)/d*a;o.grounded=false;}}
   if(pad.life>3.2)explode(pad);
  }
  if(pad&&z.type==='battery'){z.charge=Math.min(1,z.charge+dt*.4);if(z.cool<=0){electricDischarge(z.x,z.y,pad.life>2.6);z.cool=.65;}if(pad.life>4.1)explode(pad);}
  if(pad&&z.type==='candle'){if(z.cool<=0){burnAt(z.x,z.y,175+pad.life*25);z.cool=1.1;}if(pad.life>3.8)explode(pad);}
  if(pad&&z.type==='needle'){if(pad.life>2.7)explode(pad);}
  if(pad&&z.type==='pipe'){if(pad.life>.85){explode(pad);}}
  if(pad&&z.type==='gear'){z.spin+=dt*8;
   if(pad.life>1.5){spawnShards(z.x,z.y,22,870,0,'#fff1a4');explode(pad);}}
  if(z.type==='wood'&&z.hot>0){z.hot+=dt;if(z.hot>1.5){z.alive=false;burnAt(z.x,z.y,135);}}
 }
 // Heavy objects compress their gel; after a short, readable delay, a true launch occurs.
 for(const pad of R.pads){if(pad.dead||pad.kind!=='pressure')continue;
  pad.pressure=Math.min(1,pad.pressure+dt*.38);
  if(pad.pressure>=.9)explode(pad);
 }
 for(const e of R.enemies){if(!e.alive)continue;e.stun=Math.max(0,e.stun-dt);
  if(e.stun<=0){e.x=e.homeX+Math.sin(R.t*1.2+e.id)*17;}else{burst(e.x,e.y-12,1,'#8edfff',60);}
  for(const b of R.burns)if(Math.hypot(b.x-e.x,b.y-e.y)<b.r)killEnemy(e,'ВОГОНЬ');
 }
 for(const b of R.barriers){if(b.broken||!b.burn)continue;b.burn-=dt;if(b.burn<=0){b.broken=true;burst(b.x+b.w/2,b.y+b.h/2,48,'#ff9450',365);event('ВОГОНЬ → ДЕРЕВИНА ЗГОРІЛА',b.x,b.y);}}
 for(const s of R.shards){s.life-=dt;s.px=s.x;s.py=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=320*dt;
  for(const e of R.enemies){if(e.alive&&Math.hypot(s.x-e.x,s.y-e.y)<24){killEnemy(e,'УЛАМОК');s.life=0;}}
  for(const b of R.barriers){if(!b.broken&&s.x>b.x-4&&s.x<b.x+b.w+4&&s.y>b.y-4&&s.y<b.y+b.h+4&&Math.abs(s.vx)>220){b.broken=true;burst(b.x,b.y,30,'#e2a8ff',290);s.life=0;event('УЛАМОК → СТІНА РОЗБИТА',b.x,b.y);}}
  for(const z of R.props){if(z.type==='needle'&&z.alive&&Math.hypot(z.x-s.x,z.y-s.y)<39){const pad=R.pads.find(p=>!p.dead&&p.targetId===z.id);if(pad)explode(pad);}}
 }
 R.shards=R.shards.filter(s=>s.life>0&&s.y<H+50&&s.x>-50&&s.x<W+50);
 for(const a of R.bolts)a.life-=dt;R.bolts=R.bolts.filter(z=>z.life>0);
 for(const f of R.fireballs){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=300*dt;
  for(const e of R.enemies){if(e.alive&&Math.hypot(e.x-f.x,e.y-f.y)<42){if(f.hot)killEnemy(e,'ВОГНЯНИЙ СНАРЯД');else{e.stun=1.6;}f.life=0;}}
  for(const b of R.barriers){if(!b.broken&&f.x>b.x-28&&f.x<b.x+b.w+28&&f.y>b.y-28&&f.y<b.y+b.h+28){if(f.hot){b.burn=1.1;burnAt(f.x,f.y,112);}else{b.broken=true;burst(f.x,f.y,35,C.violet,285);}f.life=0;}}
  if(f.life<=0||f.x>W+25||f.x<-25||f.y>H){if(f.hot)burnAt(clamp(f.x,0,W),clamp(f.y,0,H),100);else burst(clamp(f.x,0,W),clamp(f.y,0,H),12,C.violet,170);}
 }
 R.fireballs=R.fireballs.filter(f=>f.life>0&&f.x<W+40&&f.x>-40&&f.y<H+40);
 for(const b of R.burns){b.life-=dt;b.r+=(b.max-b.r)*dt*2.5;}R.burns=R.burns.filter(b=>b.life>0);
 // Spatial interaction: magnet projectiles and flying objects affect enemies or breakable barriers.
 for(const o of R.objects){if(!o.alive)continue;if(o.respawnFly&&!o.fixed){o.x=485+Math.sin(R.t*1.17)*105;o.y=336+Math.sin(R.t*1.6)*32;o.vx=Math.cos(R.t*1.17)*123;o.vy=Math.cos(R.t*1.6)*51;}if(o.type==='metal'&&Math.abs(o.vx)>350){for(const e of R.enemies){if(e.alive&&Math.hypot(e.x-o.x,e.y-o.y)<50)killEnemy(e,'МАГНІТНИЙ СНАРЯД');}}
  if(R.room===4&&o.type==='crate'&&Math.hypot(o.x-741,o.y-506)<94&&Math.hypot(o.vx,o.vy)>230){const gear=R.props.find(p=>p.type==='gear');if(gear&&gear.cool<=0){gear.spin+=11;gear.cool=1.3;spawnShards(741,506,24,1120,0,'#ffe69a');R.shards.push({x:741,y:506,px:741,py:506,vx:1150,vy:-175,life:1,r:8,col:'#fff4ae',damage:1});event('СЕЙФ → ШЕСТЕРНЯ → ШИП',741,506);}}
 }
}
function drawInteractables(){
 for(const z of R.props){if(!z.alive)continue;ctx.save();ctx.translate(z.x,z.y);let glow=12;
  const active=R.pads.some(p=>!p.dead&&p.targetId===z.id);ctx.shadowBlur=active?26:glow;ctx.shadowColor=active?'#d5bbff':'#8dd5c7';
  if(z.type==='snail'){
   ctx.fillStyle='#75c7a8';ctx.strokeStyle='#bbffce';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(5,12,43,13,0,0,TAU);ctx.fill();ctx.stroke();
   circ(-13,-3,22,'#ce9b7d');ctx.strokeStyle='#f5cdb7';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-13,-3,16,0,TAU);ctx.stroke();line(38,4,43,-21,'#c9f7e7',3);line(52,5,54,-22,'#c9f7e7',3);circ(43,-23,5,'#eef9ff');circ(54,-24,5,'#eef9ff');
  }else if(z.type==='spider'){
   for(let i=0;i<4;i++){let dy=i*7-12;line(-7,dy, -29,dy-12,'#b79ee9',3);line(8,dy,30,dy-12,'#b79ee9',3);}circ(0,0,24,'#8c67bb');circ(-7,-6,5,'white');circ(7,-6,5,'white');circ(-7,-6,2,'#181524');circ(7,-6,2,'#181524');
   line(0,-20,0,-145,'rgba(214,197,250,.48)',1.5);
  }else if(z.type==='candle'){
   round(-12,-19,24,48,5,'#e7d7b6','#fff2d7',2);line(0,-19,0,-30,'#6e4c39',2);
   ctx.beginPath();ctx.moveTo(0,-48);ctx.quadraticCurveTo(-16,-29,0,-27);ctx.quadraticCurveTo(17,-30,0,-48);ctx.fillStyle='#ffa64a';ctx.fill();circ(0,-32,6,'#fff5a4');
  }else if(z.type==='pipe'){
   round(-56,-22,91,51,9,'#536b83','#b4d5e4',4);round(23,-32,28,70,8,'#354d66','#89b3cb',4);circ(43,2,10,z.heat>0?'#ff9767':'#3b6683');
   line(-36,-14,20,-14,'#d1eff2',2);
  }else if(z.type==='battery'){
   round(-33,-31,66,66,9,'#243953','#83deff',3);round(-10,-41,20,12,2,'#789fc0','#c5eefa',2);
   label('ϟ',0,15,40,'#9aeaff','center',900);
  }else if(z.type==='switch'){
   round(-27,-30,54,60,10,z.active?'#126b61':'#4f355c',z.active?'#83ffe1':'#f3a8db',3);circ(0,0,10,z.active?'#9bffe5':'#ffaac5');
  }else if(z.type==='needle'){
   ctx.rotate(z.dir>0?0:PI);ctx.beginPath();ctx.moveTo(36,0);ctx.lineTo(-16,-25);ctx.lineTo(-16,25);ctx.closePath();ctx.fillStyle='#c9b5cc';ctx.fill();ctx.strokeStyle='#fff0fd';ctx.lineWidth=3;ctx.stroke();
  }else if(z.type==='gear'){
   ctx.rotate(z.spin||0);for(let i=0;i<12;i++){const a=i*TAU/12;ctx.save();ctx.rotate(a);rect(-8,-46,16,19,'#efc57f');ctx.restore();}circ(0,0,35,'#b68c70');circ(0,0,17,'#302f4b');
  }else if(z.type==='magnet'){
   ctx.strokeStyle='#eab3f5';ctx.lineWidth=19;ctx.beginPath();ctx.arc(0,0,35,0,PI);ctx.stroke();rect(-43,-10,18,15,'#9b76ba');rect(25,-10,18,15,'#9b76ba');
  }else if(z.type==='wood'){round(-25,-26,50,52,4,z.hot?'#a14530':'#795543','#f7c99b',3);line(-12,-15,15,15,'#dbac78',3);}
  ctx.shadowBlur=0;ctx.restore();
  const names={snail:'РАВЛИК',spider:'ПАВУК',candle:'СВІЧКА',pipe:'ТРУБА',battery:'БАТАРЕЯ',switch:z.active?'УВІМКНЕНО':'ПЕРЕМИКАЧ',needle:'ШИП',gear:'ШЕСТЕРНЯ',magnet:'МАГНІТ',wood:'ДЕРЕВИНА'};
  label(names[z.type]||z.type.toUpperCase(),z.x,z.y+(z.type==='switch'?55:58),12,z.type==='switch'&&z.active?'#8cffd7':'#d7e5f4','center',800);
 }
 for(const e of R.enemies){if(!e.alive)continue;ctx.save();ctx.translate(e.x,e.y);ctx.shadowBlur=13;ctx.shadowColor=e.stun?'#8ae8ff':'#ff80a7';circ(0,0,22,e.stun?'#83cadb':'#ba567a');circ(-7,-5,5,'white');circ(7,-5,5,'white');circ(-7,-5,2,'#182031');circ(7,-5,2,'#182031');ctx.restore();label(e.stun?'ОГЛУШЕНИЙ':'ВОРОГ',e.x,e.y+37,11,e.stun?'#8becff':'#ffb2ca','center',700);}
 for(const b of R.burns){ctx.save();ctx.globalAlpha=.26*(b.life/b.total);circ(b.x,b.y,b.r,'#ff9a46');ctx.restore();}
}
function drawProjectiles(){
 for(const s of R.shards){ctx.save();ctx.globalAlpha=clamp(s.life,0,1);ctx.shadowColor=s.col;ctx.shadowBlur=16;line(s.px,s.py,s.x,s.y,s.col,4);circ(s.x,s.y,s.r,s.col);ctx.restore();}
 for(const f of R.fireballs){ctx.save();ctx.shadowColor=f.hot?'#ff9a52':'#d8a4ff';ctx.shadowBlur=30;circ(f.x,f.y,16*f.scale,f.hot?'#ff985b':'#c9a7ff');circ(f.x-6,f.y-5,5*f.scale,'white');ctx.restore();}
 for(const b of R.bolts){ctx.save();ctx.globalAlpha=b.life/b.total;ctx.shadowBlur=20;ctx.shadowColor='#90eaff';ctx.strokeStyle='#e8faff';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(b.x,b.y);
  for(let i=1;i<7;i++){let t=i/7;ctx.lineTo(lerp(b.x,b.tx,t)+Math.sin(i*4+R.t*15+b.jag)*15,lerp(b.y,b.ty,t)+Math.cos(i*3+R.t*15)*15);}
  ctx.lineTo(b.tx,b.ty);ctx.stroke();ctx.restore();}
}
function drawHUD(){
 round(20,18,288,97,17,'rgba(8,19,35,.89)','rgba(151,182,221,.3)',2);
 label('CYTOPLASM',39,51,27,'#edd2ff','left',900);label('LIVING REACTIONS  •  v0.8.0',40,77,11,'#9cefe0','left',800);
 round(39,93,228,8,4,'rgba(104,100,139,.5)');round(39,93,228*R.biomass/100,8,4,'#c09aff');label(Math.round(R.biomass)+'%',286,105,11,'#e5d9ff','right',700);
 round(320,18,635,84,17,'rgba(8,19,35,.85)','rgba(151,182,221,.3)',1);label(LABS[R.room][0],637,51,22,'#b8f9e3','center',850);label('1–6 — КІМНАТИ    •    N — РЕСТАРТ',635,81,13,'#b6b9d2','center',700);
 round(965,18,296,84,17,'rgba(8,19,35,.88)','rgba(151,182,221,.3)',1);label('A / D — РУХ    W — СТРИБОК',982,47,13,'#f0dbff','left',700);label('КЛІК — ЖЕЛЕ  ·  R — ВИБУХ',982,72,13,'#ffcd8e','left',750);
 round(144,116,992,47,11,'rgba(8,20,35,.79)','rgba(151,182,221,.23)',1);label(LABS[R.room][1],640,145,13,'#d4e2ef','center',650);
 if(R.lastReactionTime>0){round(193,639,893,54,14,'rgba(21,14,36,.93)','rgba(233,175,252,.65)',2);label(R.lastReaction,639,673,20,'#f1d6ff','center',800);}
 if(R.noticeT>0&&R.lastReactionTime<=0){round(203,639,878,48,14,'rgba(16,18,32,.92)','rgba(199,176,239,.36)',1);label(R.notice,640,670,15,'#f0d6ff','center',700);}
 if(R.phase==='win'){rect(0,0,W,H,'rgba(8,14,28,.85)');label('ЛАБОРАТОРІЮ ПРОЙДЕНО!',640,295,49,'#f4dbff','center',900);label('1–6 — ПОВЕРНУТИСЯ В БУДЬ-ЯКУ КІМНАТУ',640,376,23,'#bdf5e3','center',750);}
}
// Room select: no ability menu. Number keys only switch the test chambers.
function keysFromEvent(x){const map={'ф':'a','в':'d','к':'r','ц':'w','і':'s','т':'n','arrowleft':'a','arrowright':'d','arrowup':'w','arrowdown':'s'};let z=String((x&&typeof x==='object'?(x.code||x.key):x)||'').toLowerCase();if(z.startsWith('key'))z=z.slice(3);if(z.startsWith('digit'))z=z.slice(5);return map[z]||z;}
function keyDown(k){let key=keysFromEvent(k);if(/^[1-6]$/.test(key)){resetRoom(Number(key)-1);return;}
 if(R.keys[key])return;R.keys[key]=true;if(key==='n'){resetRoom(R.room);return;}
 if(key==='r'){detonate();return;}if(R.phase!=='play')return;
 if(key==='w'){const p=R.p;if(p.climbing!==null){p.climbing=null;p.attachCooldown=.35;p.vy=-675;p.grounded=false;p.bounceLock=.15;}
 else if(p.grounded||p.coyote>0){p.vy=-805;p.grounded=false;p.coyote=0;tone('bounce');}}
}
function getState(){return {room:R.room,phase:R.phase,biomass:R.biomass,player:{...R.p},pads:R.pads.filter(p=>!p.dead).map(p=>({...p})),shots:R.shots.map(s=>({...s})),objects:R.objects.filter(o=>o.alive).map(o=>({...o})),props:R.props.map(o=>({...o})),enemies:R.enemies.map(o=>({...o})),shards:R.shards.map(s=>({...s})),bolts:R.bolts.map(b=>({...b})),fireballs:R.fireballs.map(f=>({...f})),barriers:R.barriers.map(b=>({...b})),stats:{...R.stats},lastPad:R.lastPad,lastReaction:R.lastReaction,roomTime:R.roomTime};}
resetRoom(0);
return {step,update,draw,keyDown,keyUp,resetKeys,pointerDown,pointerMove,pointerUp,shoot,placeGelAt,detonate,getState,resetRoom,createGel,explode,reclaim,_unsafeState:R};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createCytoplasm};