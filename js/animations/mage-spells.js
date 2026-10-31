'use strict';

// Artwork is taken from the approved spell workshops. Coordinates follow actual portraits.
const mageSpellArt=new Map();
function mageSprite(name){
 if(!mageSpellArt.has(name)){const img=new Image();img.src='assets/spells/'+name+'.svg';mageSpellArt.set(name,img)}
 return mageSpellArt.get(name);
}
function paintApprovedMageSpell(c,g,fx,now,reduced){
 if(!['basic-mage','magic-missile','earth-spike'].includes(fx.type))return false;
 if(now<fx.time+480/COMBAT_RANGED_SPEED)return true;
 const t=((now-fx.time)*COMBAT_RANGED_SPEED-480)/1000,{sx,sy,tx,ty,floor,scale:k}=g;
 c.save();c.lineCap='round';
 const sprite=(name,x,y,w,h,alpha=1)=>{const img=mageSprite(name);if(!img.complete||!img.naturalWidth)return;c.save();c.globalAlpha=Math.max(0,Math.min(1,alpha));c.drawImage(img,x,y,w,h);c.restore()};
 const path=(pts,col,width,alpha=1)=>{c.save();c.globalAlpha=Math.max(0,alpha);c.strokeStyle=col;c.lineWidth=width;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore()};
 const halo=(x,y,r,alpha=1)=>{c.save();c.globalAlpha=Math.max(0,alpha);const gr=c.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'#fff8e9');gr.addColorStop(.16,'#edf6ff');gr.addColorStop(.36,'#c4caffcc');gr.addColorStop(.65,'#9b7fdf55');gr.addColorStop(1,'#8b6bce00');c.fillStyle=gr;c.fillRect(x-r,y-r,r*2,r*2);c.restore()};
 const impact=(age,x,y,critical=false)=>{
  if(age<0||age>.55)return;const u=age/.55,pulse=age<.045?age/.045:age<.105?1-(age-.045)*10:age<.16?.8:Math.max(0,1-(age-.16)/.39);
  halo(x,y,(critical?88:72)*k,Math.min(1,pulse));
  c.save();c.globalAlpha=1-u;c.strokeStyle='#ddd3ff';c.lineWidth=2*k;c.beginPath();c.ellipse(x,y,(18+u*38)*k,(27+u*45)*k,0,0,Math.PI*2);c.stroke();
  for(let j=0;j<12;j++){const a=j*2.399,r=(10+u*(35+j*2))*k;path([[x+Math.cos(a)*r,y+Math.sin(a)*r],[x+Math.cos(a)*(r+4*k),y+Math.sin(a)*(r+4*k)]],j%4?'#d9caff':'#f1dba4',1.5*k,1-u)}
  c.restore();
 };
 const charge=(duration,name)=>{if(t>=0&&t<duration&&!reduced){const u=t/duration,z=(.35+.65*Math.sin(u*Math.PI))*k;sprite(name,sx-45*z,sy-45*z,90*z,90*z,Math.sin(u*Math.PI))}};
 if(fx.type==='basic-mage'){
  charge(.32,'arcane-charge');
  const flight=.31,launch=.3,u=Math.max(0,Math.min(1,(t-launch)/flight));
  if(!reduced&&t>=launch&&fx.impactAt==null){const x=sx+(tx-sx)*u,y=sy+(ty-sy)*u;c.save();c.translate(x,y);c.rotate(Math.atan2(ty-sy,tx-sx));sprite('arcane-bolt',-120*k,-50*k,180*k,100*k);c.restore()}
  if(fx.impactAt!=null&&fx.hit!==false){const age=(now-fx.impactAt)/1000;impact(age,tx,ty);if(age<.34)sprite('arcane-impact',tx-90*k,ty-90*k,180*k,180*k,Math.max(0,1-age/.34))}
 }else if(fx.type==='magic-missile'){
  charge(.7,'missile-charge');
  const dx=tx-sx,dy=ty-sy,arcs=[-145,115,-85].map(v=>v*k);
  (fx.darts||[]).forEach((dart,i)=>{
   const launch=.19+i*.155,flight=.65,u=Math.max(0,Math.min(1,(t-launch)/flight));
   const p0=[sx,sy],p1=[sx+dx*.2,sy+dy*.2+arcs[i]],p2=[sx+dx*.76,sy+dy*.75+arcs[i]],p3=[tx,ty+(i-1)*7*k];
   const point=q=>{const v=1-q;return [v*v*v*p0[0]+3*v*v*q*p1[0]+3*v*q*q*p2[0]+q*q*q*p3[0],v*v*v*p0[1]+3*v*v*q*p1[1]+3*v*q*q*p2[1]+q*q*q*p3[1]]};
   if(!reduced&&t>=launch&&dart.contactAt==null){
    const from=Math.max(0,u-.27),pts=Array.from({length:19},(_,j)=>point(from+(u-from)*j/18));
    c.save();c.shadowColor='#9787df';c.shadowBlur=8*k;path(pts,'#9184e366',9*k);path(pts,'#b6c7ff',3.2*k);path(pts,'#f5eaff',k);
    const [x,y]=point(u),[bx,by]=point(Math.max(0,u-.007));c.translate(x,y);c.rotate(Math.atan2(y-by,x-bx));
    halo(0,0,25*k,.6);c.scale(k,k);
    c.fillStyle='#ad9ce9';c.beginPath();[[-29,0],[-12,-5],[-4,-8],[11,-4],[20,0],[8,5],[-5,8],[-13,4]].forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
    c.fillStyle='#fff6df';c.beginPath();[[-17,0],[-5,-4],[11,-2],[19,0],[7,3],[-5,4]].forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();path([[-16,-8],[-5,-11],[8,-7]],'#d6ddff',1.3);path([[-17,8],[-5,11],[7,7]],'#d6ddff',1.3);c.restore();
   }else if(dart.contactAt!=null&&dart.hit)impact((now-dart.contactAt)/1000,tx,p3[1],dart.mult>1);
  });
 }else{
  mageSprite('earth-spike');mageSprite('earth-rupture');
  const base=floor,progress=Math.min(1,Math.max(0,(t-.36)/.16)),sink=t>1.02?Math.min(1,(t-1.02)/.54):0;
  if(t<.36&&!reduced){const u=Math.min(1,t/.35),pts=Array.from({length:18},(_,i)=>{const z=Math.min(u,i/17);return [sx+(tx-sx)*z,base+Math.sin(i*2.4)*5*k]});path(pts,'#0b171b',7*k);path(pts,'#d1af69',1.5*k)}
  if(t>=.36&&t<1.75){
   sprite('earth-rupture',tx-85*k,base-35*k,175*k,70*k,t>1.4?(1.75-t)/.35:1);
   c.save();c.beginPath();c.rect(tx-90*k,base-205*k,190*k,205*k);c.clip();
   const rise=reduced?1:1-Math.pow(1-progress,3),offset=(1-rise)*175*k+sink*175*k;
   sprite('earth-spike',tx-70*k,base-175*k+offset,150*k,175*k,1-sink*.6);c.restore();
   if(!reduced){const age=t-.36,u=age/.9;for(let j=0;j<23&&u<1;j++){const dx=(j%2?-1:1)*(25+(j%13)*5)*k,dy=(-30-(j%7)*12)*k,x=tx+dx*u,y=base+dy*4*u*(1-u)+u*20*k;c.save();c.globalAlpha=1-u;c.translate(x,y);c.rotate(j*1.2+u*5);c.fillStyle=['#b3ad90','#768778','#52655d'][j%3];c.strokeStyle='#364c43';c.lineWidth=.8;c.beginPath();c.moveTo(-4*k,0);c.lineTo(-2*k,-5*k);c.lineTo(4*k,-2*k);c.lineTo(2*k,5*k);c.closePath();c.fill();c.stroke();c.restore()}
    if(u<1){c.save();c.globalAlpha=.3*(1-u);c.fillStyle='#a1a18b';for(let j=0;j<5;j++){c.beginPath();c.ellipse(tx+(j-2)*(17+u*15)*k,base-3*k-u*10*k,(15+u*20)*k,(6+u*7)*k,0,0,Math.PI*2);c.fill()}c.restore()}
   }
   if(fx.hit!==false&&fx.impactAt!=null){const age=(now-fx.impactAt)/1000;if(age<.24)halo(tx,ty,65*k,(1-age/.24)*.7)}
  }
 }
 c.restore();return true;
}
