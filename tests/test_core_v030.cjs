const assert=require('node:assert/strict');
const {createCytoplasm}=require('../GameCore_v030.js');
const c=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const g=createCytoplasm({getContext:()=>c});const T=Date.now()/1000;
g.keyDown('d');g.update(.016);g.keyUp('d');let x=g.getState().player.x;g.update(.016);assert.equal(g.getState().player.x,x);
let b=g.getState().bodies[0];g.pointerDown(b.x,b.y,T);g.pointerMove(525,370,T+.05);g.pointerUp(525,370,T+.08);
g.pointerDown(1000,200,T+1);g.pointerUp(1000,200,T+1.01);g.pointerDown(1120,360,T+1.2);g.pointerUp(1120,360,T+1.21);
assert.equal(g.getState().bodies[0].fixed,true);console.log('PASS: no drift and global double-click stasis');
