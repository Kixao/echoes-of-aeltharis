'use strict';

// Emberwild v0.1.29 — js/animations/player-attacks.js

const RANGED_VISUALS=new Set(['basic-mage','basic-ranger','magic-missile','earth-spike','thunder']);

function isRangedVisual(type){
  return RANGED_VISUALS.has(type)
}

function rangedEffectsView(){
  return '<canvas class="player-animation-overlay" aria-hidden="true"></canvas>'
}

function positionRangedEffects(){
  paintPlayerAttacks()
}

function paintPlayerAttacks(){
 
  const canvas=document.querySelector('.player-animation-overlay');
  if(!canvas||!s?.enemy)return;
 
  const arena=canvas.parentElement,player=arena.querySelector('.combat-portrait'),enemy=arena.querySelector('.enemy-portrait'),motion=player?.querySelector('.hero-motion'),playerModel=motion?.querySelector('eoa-combat-model'),enemyModel=enemy?.querySelector('eoa-combat-model'),art=playerModel?.controller?.svg||motion?.querySelector('svg');
  if(!art||!enemy)return;
  const enemyArt=enemyModel||enemy.querySelector('svg');if(enemyArt)enemyArt.style.translate='';
 
  const c=canvas.getContext('2d'),a=arena.getBoundingClientRect(),p=player.getBoundingClientRect(),e=enemy.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 
  const artRect=art.getBoundingClientRect(),extendTop=Math.max(0,a.top-artRect.top+8);
  canvas.width=Math.round(a.width*dpr);
  canvas.height=Math.round((a.height+extendTop)*dpr);
  canvas.style.width=a.width+'px';
  canvas.style.height=(a.height+extendTop)+'px';
  canvas.style.left='0px';
  canvas.style.right='auto';
  canvas.style.top=-extendTop+'px';
  canvas.style.bottom='auto';
  c.setTransform(dpr,0,0,dpr,0,0);
  c.translate(0,extendTop);
 
  const handPoint=playerModel?.point('hand'),targetPoint=enemyModel?.point('chest');
 const now=Date.now(),reduced=window.matchMedia?.('(prefers-reduced-motion:reduce)').matches;
 
  motion.style.transform='';
 
  const active=effects.filter(f=>['basic-mage','basic-ranger','basic-warrior','magic-missile','earth-spike','thunder','mark'].includes(f.type)&&now-f.time<3000);
 
  if(s.buffs?.mirror&&s.enemy.hp>0)active.unshift({type:'mirror',time:effects.findLast(f=>f.type==='mirror')?.time||now-1000});
 
  for(const fx of active){
 
    const type=({'basic-mage':'arcane','basic-ranger':'arrow','basic-warrior':'cleave','magic-missile':'magic-missile',thunder:'thunder',mark:'mark',mirror:'mirror'})[fx.type]||fx.type,
 t=Math.max(0,(now-fx.time)/1000),ranged=isRangedVisual(fx.type),wind=ranged?.18:type==='cleave'?.12:0,contact=ranged?.66:wind,
 landed=type==='mark'||type==='mirror'||fx.impactAt!=null,impactElapsed=fx.impactAt!=null?Math.max(0,(now-fx.impactAt)/1000):t,
 px=p.left-a.left+p.width/2,py=artRect.top-a.top+artRect.height/2,tx=targetPoint?targetPoint.x-a.left:e.left-a.left+e.width/2,ty=targetPoint?targetPoint.y-a.top:e.top-a.top+e.height/2,
 drawH=art.getBoundingClientRect().height,drawW=drawH*.8,
 sx=handPoint?handPoint.x-a.left:px+drawW*.23,sy=handPoint?handPoint.y-a.top:py-12,u=Math.max(0,Math.min(1,(t-wind)/.48)),image=combatHeroArtImage(s.class),
 color={arcane:'#86bbff','magic-missile':'#c58aff',arrow:'#c6c9a3',thunder:'#8ce7ff',mark:'#ef4444',mirror:'#8b5cf6',cleave:'#f4c4a0'}[type];
 
    if(paintApprovedMageSpell(c,{sx,sy,tx,ty,floor:e.bottom-a.top-32,enemyArt,scale:Math.max(.55,Math.min(1,drawH/210))},fx,now,reduced))continue;

    c.save();
    c.shadowColor=color;
    c.shadowBlur=reduced?0:15;
    c.lineCap='round';

    function line(points,width,col){
      c.strokeStyle=col||color;
      c.lineWidth=width;
      c.beginPath();
      points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
      c.stroke();
    }
    function orb(x,y,r,col){
      c.fillStyle=col;
      c.beginPath();
      c.arc(x,y,Math.max(.1,r),0,Math.PI*2);
      c.fill();
    }
    function ring(x,y,r,w,col){
      c.strokeStyle=col||color;
      c.lineWidth=w;
      c.beginPath();
      c.arc(x,y,r,0,Math.PI*2);
      c.stroke();
    }

    if(type==='magic-missile'){
      const arcs=[-58,-12,50];
      (fx.darts||[]).forEach((dart,i)=>{
        const launch=.18+i*.14,flight=.48,progress=Math.max(0,Math.min(1,(t-launch)/flight));
        const dx=tx-sx,dy=ty-sy,p0=[sx,sy],p1=[sx+dx*.34,sy+dy*.34+arcs[i]],p2=[sx+dx*.68,sy+dy*.68+arcs[i]*.72],p3=[tx,ty];
        const point=q=>{const u=1-q;return [u*u*u*p0[0]+3*u*u*q*p1[0]+3*u*q*q*p2[0]+q*q*q*p3[0],u*u*u*p0[1]+3*u*u*q*p1[1]+3*u*q*q*p2[1]+q*q*q*p3[1]]};
        if(dart.contactAt==null&&t>=launch){
          const from=Math.max(0,progress-.23),points=Array.from({length:15},(_,k)=>point(from+(progress-from)*k/14));
          c.save();c.globalAlpha=.88;c.shadowColor='#b985ec';c.shadowBlur=reduced?0:15;c.strokeStyle='#9b65c8';c.lineWidth=8;c.beginPath();points.forEach(([x,y],k)=>k?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
          c.globalAlpha=1;c.strokeStyle='#e5caff';c.lineWidth=3.2;c.beginPath();points.forEach(([x,y],k)=>k?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
          const [x,y]=point(progress),angle=Math.atan2(3*(1-progress)*(1-progress)*(p1[1]-p0[1])+6*(1-progress)*progress*(p2[1]-p1[1])+3*progress*progress*(p3[1]-p2[1]),3*(1-progress)*(1-progress)*(p1[0]-p0[0])+6*(1-progress)*progress*(p2[0]-p1[0])+3*progress*progress*(p3[0]-p2[0]));
          c.translate(x,y);c.rotate(angle);c.shadowBlur=reduced?0:18;c.fillStyle='#fff6ff';c.beginPath();c.ellipse(0,0,8,3.5,0,0,Math.PI*2);c.fill();c.restore()
        }else if(dart.contactAt!=null){
          const age=(now-dart.contactAt)/1000;
          if(age>=0&&age<.48){
            const q=age/.48,radius=28+q*82,flash=c.createRadialGradient(tx,ty,1,tx,ty,radius);c.save();
            flash.addColorStop(0,'rgba(255,255,250,.98)');flash.addColorStop(.12,'rgba(255,238,167,.96)');flash.addColorStop(.32,'rgba(242,190,255,.68)');flash.addColorStop(.62,'rgba(174,100,224,.28)');flash.addColorStop(1,'rgba(174,100,224,0)');
            c.globalAlpha=1-q*.85;c.fillStyle=flash;c.fillRect(tx-radius,ty-radius,radius*2,radius*2);
            c.globalAlpha=1-q;c.shadowColor='#fff0a6';c.shadowBlur=reduced?0:25;ring(tx,ty,8+q*48,4*(1-q*.45),'#fff4bd');ring(tx,ty,5+q*72,2*(1-q*.5),'#d997ff');
            for(let shard=0;shard<10;shard++){const angle=shard*Math.PI/5+Math.PI/10,inner=13+q*9,outer=35+q*51;line([[tx+Math.cos(angle)*inner,ty+Math.sin(angle)*inner],[tx+Math.cos(angle)*outer,ty+Math.sin(angle)*outer]],Math.max(.5,3*(1-q)),'#fff0b1')}
            orb(tx,ty,Math.max(.2,14*(1-q)),'#fff');
            c.restore()
          }
        }
      });
      c.restore();
      continue
    }

    const sway=t<wind?-Math.sin(t/Math.max(.01,wind)*Math.PI)*5:t<contact+.35?(type==='cleave'?28:4)*Math.sin(Math.min(1,(t-wind)/(type==='cleave'?.48:.35))*Math.PI):0;
    if(type!=='mirror')motion.style.transform=reduced?'':`translateX(${sway}px) rotate(${sway*(type==='cleave'?.15:.2)}deg)`;
    motion.style.transformOrigin='50% 92%';

    if(ranged&&t<wind){
      const q=t/wind;
      c.globalAlpha=q;
      ring(sx,sy,7+q*9,1.5);
      for(let i=0;i<5;i++){
        const z=i*1.256+t*9;
        orb(sx+Math.cos(z)*20*(1-q),sy+Math.sin(z)*20*(1-q),2,color);
      }
      c.globalAlpha=1;
    }

    if(ranged&&t>=wind&&!landed){
      const x=sx+(tx-sx)*u,y=sy+(ty-sy)*u,angle=Math.atan2(ty-sy,tx-sx);
      c.save();
      c.translate(x,y);
      c.rotate(angle);
      const trail=type==='arrow'?32:type==='fire'?58:62;
      for(let i=12;i>=1;i--){
        c.globalAlpha=(1-i/13)*.6;
        const yy=Math.sin(i*.65-t*22)*i*.4;
        orb(-i*trail/12,yy,(type==='fire'?5:2.5)*(1-i/15),color);
      }
      c.globalAlpha=1;

      if(type==='arcane'){
        c.save();
        c.scale(1.7,.7);
        orb(-3,0,7,'#6598ff');
        orb(0,0,3,'#f2fdff');
        c.restore();
        for(let j=0;j<2;j++){
          c.strokeStyle=j?'#a6f0ff':'#a28aff';
          c.lineWidth=1.5;
          c.beginPath();
          for(let k=0;k<=24;k++){
            const xx=-48+k*2,yy=Math.sin(k*.5-t*28+j*Math.PI)*6*(1-k/30);
            k?c.lineTo(xx,yy):c.moveTo(xx,yy);
          }
          c.stroke();
        }
      }
else if(type==='fire'){
        orb(0,0,10,'#ff7c1f');
        orb(1,0,5.5,'#fff3cb');
        orb(2,0,3,'#ffffff');
        for(let i=0;i<9;i++){
          const z=(t*75+i*7)%45;
          c.globalAlpha=1-z/45;
          orb(-z,Math.sin(i*3.4+t*7)*z*.2,1.5,'#ffc359');
        }
        c.globalAlpha=1;
      }
else{
        line([[-30,0],[0,0]],2,type==='arrow'?'#c9b381':'#d8faff');
        line([[-7,-4],[0,0],[-7,4]],2);
        line([[-24,0],[-30,-4]],2);
        line([[-24,0],[-30,4]],2);
        if(type==='thunder'){
          for(let j=0;j<3;j++){
            const pts=[];
            for(let k=0;k<8;k++)pts.push([-45+k*6,Math.sin(k*4.3+Math.floor(t*28)+j*7)*7]);
            line(pts,j?1:2,j?'#77a7ff':'#d9ffff');
          }
          orb(-7,0,3,'#ffffff');
        }
      }

      c.restore();
    }

    if(landed){
      const elapsed=impactElapsed,v=Math.min(1,elapsed/.7);
      if(type==='mark'){
        if(elapsed<2){
          c.save();
          c.translate(tx,ty);
          c.shadowBlur=18;
          c.globalAlpha=(.65+Math.sin(t*3)*.15)*Math.min(1,(2-elapsed)/.3);
          ring(0,0,27,2,'#ef4444');
          ring(0,0,20,1,'#ffb28d');
          for(let i=0;i<4;i++){
            const z=i*Math.PI/2;
            c.save();
            c.rotate(z);
            line([[0,-37],[0,-21]],2,'#ff7a6b');
            line([[-5,-31],[0,-25],[5,-31]],2,'#ef4444');
            c.restore();
          }
          c.restore();
        }
      }
else if(type==='mirror'){
        const q=Math.min(1,elapsed/.45);
        for(let j of [-1,1]){
          const off=j*Math.min(32,a.width*.045)*q,yy=Math.sin(t*2+j)*3;
          c.save();
          c.globalAlpha=.35*q;
          c.filter='sepia(1) saturate(2) hue-rotate(185deg)';
          c.shadowColor='#a78bfa';
          c.shadowBlur=22;
          if(image.complete&&image.naturalWidth)c.drawImage(image,px-drawW/2+off,py-drawH/2+yy,drawW,drawH);
          c.restore();
        }
        c.globalAlpha=.3;
        c.shadowColor='#b0a1ff';
        ring(px,py+drawH*.38,22+Math.sin(t)*3,1,'#aa9aff');
        c.globalAlpha=1;
      }
else if(v<1){
        c.globalAlpha=1-v;
        if(type==='cleave'){
          for(let j=0;j<3;j++){
            c.lineWidth=4-j;
            c.strokeStyle=j?'#ffb27b':'#fff0d3';
            c.beginPath();
            c.ellipse(tx,ty,35+j*6,48,-.6,-2.7+v,1+v);
            c.stroke();
          }
        }
else if(type==='fire'){
          const gr=c.createRadialGradient(tx,ty,0,tx,ty,23+v*80);
          gr.addColorStop(0,'#fff4ca');
          gr.addColorStop(.2,'#ffd162');
          gr.addColorStop(.5,'#ff6c25');
          gr.addColorStop(1,'#c83a0000');
          c.fillStyle=gr;
          c.fillRect(tx-110,ty-110,220,220);
          for(let i=0;i<14;i++){
            const z=i*2.4;
            orb(tx+Math.cos(z)*(15+v*80),ty+Math.sin(z)*(15+v*74),6*(1-v),'#ffc45b');
          }
          ring(tx,ty,15+v*80,3,'#ffba63');
        }
else if(type==='thunder'){
          orb(tx,ty,12*(1-v),'#e5ffff');
          for(let i=0;i<8;i++){
            const z=i*Math.PI/4;
            const pts=[[tx,ty]];
            for(let k=1;k<=4;k++){
              const rr=k*(8+v*8),zz=z+Math.sin(i*5+k*7+Math.floor(t*25))*.2;
              pts.push([tx+Math.cos(zz)*rr,ty+Math.sin(zz)*rr]);
            }
            line(pts,2,i%2?'#7db0ff':'#d5ffff');
          }
        }
else{
          ring(tx,ty,8+v*42,2);
          for(let i=0;i<10;i++){
            const z=i*Math.PI/5+t;
            orb(tx+Math.cos(z)*v*50,ty+Math.sin(z)*v*40,2,'#c9eaff');
          }
        }
        c.globalAlpha=1;
      }

    }

    c.restore();
 
  }

}

