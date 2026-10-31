'use strict';

function bossAnimationView(){
  if(COMBAT_MODEL_ENEMIES[s.enemy?.name])return "";
  return effects.filter(e=>e.type==='boss-special'&&Date.now()-e.time<1800).map(e=>`<canvas class="boss-animation-overlay" data-born="${e.time}" aria-hidden="true"></canvas>`).join('');
}
function paintBossAnimations(){
  document.querySelectorAll('.boss-animation-overlay').forEach(canvas=>{
    const born=Number(canvas.dataset.born)||Date.now(),elapsed=(Date.now()-born)/1000;
    if(elapsed>1.8)return;
    const arena=canvas.parentElement,enemy=arena?.querySelector('.enemy-portrait'),player=arena?.querySelector('.combat-portrait');if(!enemy||!player)return;
    const a=arena.getBoundingClientRect(),e=enemy.getBoundingClientRect(),p=player.getBoundingClientRect(),ratio=window.devicePixelRatio||1;
    canvas.width=a.width*ratio;canvas.height=a.height*ratio;canvas.style.width=a.width+'px';canvas.style.height=a.height+'px';
    const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);const x1=e.left-a.left+e.width*.28,y1=e.top-a.top+e.height*.45,x2=p.left-a.left+p.width*.72,y2=p.top-a.top+p.height*.45,progress=Math.min(1,elapsed/.65);
    ctx.save();ctx.globalAlpha=Math.max(0,1-elapsed/1.8);ctx.lineCap='round';ctx.shadowBlur=22;ctx.shadowColor='#e168d1';ctx.strokeStyle='#edc7f4';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo((x1+x2)/2,(y1+y2)/2-70*progress,x2,y2);ctx.stroke();ctx.strokeStyle='#a66bdb';ctx.lineWidth=18;ctx.globalAlpha*=.28;ctx.stroke();ctx.restore();
  });
}
