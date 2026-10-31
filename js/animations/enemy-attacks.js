'use strict';

// Emberwild v0.1.29 — js/animations/enemy-attacks.js

function enemyAttackView(){
  if(COMBAT_MODEL_ENEMIES[s.enemy?.name])return "";
  return effects.filter(e=>e.type.startsWith('enemy-themed-')&&Date.now()-e.time<1500).map(e=>`<canvas class="enemy-attack-overlay" data-born="${e.time}" data-dungeon="${e.dungeon}" data-kind="${e.ranged?1:0}" aria-hidden="true"></canvas>`).join('')
}

function launchEnemyBasic(p){
  const ranged=enemyBasicRanged(p.name);
  addEffect('enemy-themed-'+(ranged?'ranged':'melee'),'player');
  Object.assign(effects[effects.length-1],{dungeon:s.loc-1,ranged});
}

function paintEnemyAttacks(){

  const clamp=x=>Math.max(0,Math.min(1,x)),lerp=(a,b,t)=>a+(b-a)*t;

  const polygon=(ctx,points,fill)=>{
    ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.closePath();
    ctx.fillStyle=fill;
    ctx.fill()
  };

  function stroke(ctx,points,color,width){
    ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.strokeStyle=color;
    ctx.lineWidth=width;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.stroke()
  }

  function circle(c,x,y,r,color){
    c.beginPath();
    c.arc(x,y,r,0,Math.PI*2);
    c.fillStyle=color;
    c.fill()
  }

  function shape(c,i,x,y,s,color,angle=0){
    c.save();
    c.translate(x,y);
    c.rotate(angle);
    c.scale(s,s);
    if(i===0){
      polygon(c,[[-13,0],[-6,-10],[4,-8],[12,1],[2,12],[-7,8]],color);
      for(let a=0;a<5;a++){
        c.rotate(1.25);
        polygon(c,[[6,0],[20,5],[10,6]],color)
      }
    }
    if(i===1){
      polygon(c,[[-25,0],[5,-5],[17,-13],[12,-3],[28,0],[12,4],[18,12],[5,5]],color)
    }
    if(i===2){
      for(let k=0;k<3;k++){
        c.save();
        c.translate((k-1)*12,(k%2)*9-4);
        c.rotate(k);
        polygon(c,[[-7,-6],[7,-5],[5,7],[-5,5]],color);
        c.restore()
      }
    }
    if(i===3){
      c.beginPath();
      c.arc(0,0,18,-1.4,1.4);
      c.arc(8,0,15,1.4,-1.4,true);
      c.closePath();
      c.fillStyle=color;
      c.fill()
    }
    if(i===4){
      polygon(c,[[-16,-7],[-5,-15],[12,-10],[18,5],[5,16],[-12,11]],'#7a4735');
      stroke(c,[[-10,-8],[0,-2],[8,-8],[5,8]],color,3)
    }
    if(i===5){
      polygon(c,[[-25,0],[4,-13],[23,-3],[8,13]],color);
      stroke(c,[[-23,0],[8,0],[4,-12]],'#d6f6e9',1)
    }
    if(i===6){
      polygon(c,[[-15,0],[-4,-17],[5,-10],[21,-6],[13,5],[4,18],[-4,10]],color);
      polygon(c,[[-7,0],[3,-8],[9,0],[1,9]],'#362333')
    }
    c.restore()
  }

 
  document.querySelectorAll('.enemy-attack-overlay').forEach(canvas=>{
    const born=Number(canvas.dataset.born),i=Number(canvas.dataset.dungeon),index=Number(canvas.dataset.kind),col=["#a2c777", "#b2dce3", "#e8a461", "#b8b6ee", "#ff9863", "#72d5cf", "#f9bf65"][i];
 
    function frame(){
      if(!canvas.isConnected)return;
      const t=(Date.now()-born)/1000;
      if(t>1.5)return;
      const duel=canvas.parentElement,d=duel.getBoundingClientRect(),player=duel.querySelector('.combat-portrait').getBoundingClientRect(),enemy=duel.querySelector('.enemy-portrait').getBoundingClientRect();
      const tx=player.left-d.left+player.width/2,ty=player.top-d.top+player.height/2,ex=enemy.left-d.left+enemy.width/2,ey=enemy.top-d.top+enemy.height/2;
      const ratio=devicePixelRatio||1;
      canvas.width=d.width*ratio;
      canvas.height=d.height*ratio;
      canvas.style.width=d.width+'px';
      canvas.style.height=d.height+'px';
      const c=canvas.getContext('2d');
      c.scale(ratio,ratio);
      c.transform((ex-tx)/237,(ey-ty)/237,0,1,tx-83*(ex-tx)/237,ty-137-83*(ey-ty)/237);
      const contact=index===0?0:.68,hit=clamp((t-contact)/.32),flight=clamp((t-.2)/.48);

      if(index===1&&t>=.2&&t<contact){
        const x=lerp(278,83,flight),y=137-Math.sin(flight*Math.PI)*(i===0?22:8);
        for(let a=6;a>0;a--){
          c.globalAlpha=(1-a/7)*.35;
          const tx=x+a*12;
          if(i===5)circle(c,tx,y+Math.sin(a)*7,3+a*.25,col);else stroke(c,[[tx,y-3],[tx+10,y+Math.sin(a)*8]],col,Math.max(1,7-a))
        }
        c.globalAlpha=1;
// Soft halo follows the existing projectile; its path and contact time stay unchanged.

        c.save();
        const halo=c.createRadialGradient(x,y,2,x,y,34);
        halo.addColorStop(0,col+'66');
        halo.addColorStop(.4,col+'27');
        halo.addColorStop(1,col+'00');
        c.fillStyle=halo;
        c.fillRect(x-34,y-34,68,68);
        c.restore();

        for(let spark=0;spark<7;spark++){
          const back=10+spark*8,sy=y+Math.sin(flight*15+spark*2.3)*(4+spark);
          c.save();
          c.globalAlpha=(1-spark/8)*.6;
          c.shadowColor=col;
          c.shadowBlur=6;
          if(i===5){
            c.strokeStyle=col;
            c.lineWidth=1;
            c.beginPath();
            c.arc(x+back,sy,1.5+spark*.25,0,Math.PI*2);
            c.stroke()
          }else if(i===1){
            stroke(c,[[x+back,sy],[x+back+5,sy-3]],col,1)
          }else if(i===3){
            circle(c,x+back,sy,1.2,col);
            stroke(c,[[x+back-2,sy],[x+back+2,sy]],col,1)
          }else{
            circle(c,x+back,sy,spark%3===0?1.8:1,col)
          }
          c.restore()
        }

        const rotation=Math.PI+(i===0||i===2||i===3?flight*4:0);

        c.save();
        c.shadowColor=col;
        c.shadowBlur=12;
        shape(c,i,x,y,1,col,rotation);
        c.restore();
// Small internal facets make the original silhouette readable through its halo.

        c.save();
        c.translate(x,y);
        c.rotate(rotation);
        c.globalAlpha=.8;

        if(i===0){
          stroke(c,[[-7,-3],[0,-6],[5,-1]],'#e2edc7',1.3);
          circle(c,-2,3,1.5,'#e2edc7')
        }

        if(i===1){
          stroke(c,[[-19,0],[15,0],[21,0]],'#e5f5ef',1.5)
        }

        if(i===2){
          stroke(c,[[-15,-4],[-9,-5]],'#f6e0b6',1.5);
          stroke(c,[[3,7],[8,10]],'#f6e0b6',1.5);
          stroke(c,[[10,-3],[15,-5]],'#f6e0b6',1)
        }

        if(i===3){
          c.beginPath();
          c.arc(0,0,15,-1.3,1.2);
          c.strokeStyle='#eeebff';
          c.lineWidth=1.3;
          c.stroke()
        }

        if(i===4){
          stroke(c,[[-8,7],[-2,0],[5,2],[8,-5]],'#ffdba0',1.4);
          circle(c,-4,-7,1,'#ffdba0')
        }

        if(i===5){
          stroke(c,[[-19,0],[6,-8],[17,-2]],'#e0fff4',1.3);
          stroke(c,[[5,0],[9,8]],'#e0fff4',1)
        }

        if(i===6){
          stroke(c,[[-9,-1],[-3,-11],[3,-7]],'#ffe1a4',1.6);
          stroke(c,[[2,12],[10,5]],'#ffe1a4',1.2)
        }

        c.restore();
      }


      if(false){
        c.globalAlpha=.4;
        stroke(c,[[280,138],[230,119],[191,125]],col,3);
        c.globalAlpha=1;
      }

      if(t>=contact&&t<contact+.5){
        const p=clamp((t-contact)/.5);
        c.globalAlpha=1-p;

        if(index===0){
// Instant target-local blade ribbons; no projectile, lunge or wind-up.

          const claw=[0,5,6].includes(i),count=claw?3:1;

          for(let j=0;j<count;j++){
 
            c.save();
            c.translate(83+(j-(count-1)/2)*13,137);
            c.rotate(i===1?-.4:i===3?.45:i===4?-.8:-.2);
 
            const sweep=clamp(p/.24),length=lerp(.65,1,sweep);
            c.scale(length,length);
 
            c.beginPath();
            c.moveTo(-30,-41);
            c.quadraticCurveTo(12,-25,24,35);
            c.quadraticCurveTo(1,6,-30,-41);
            c.fillStyle=col;
            c.fill();
 
            c.beginPath();
            c.moveTo(-26,-34);
            c.quadraticCurveTo(9,-18,20,27);
            c.strokeStyle='#f0ead1';
            c.lineWidth=1.5;
            c.stroke();
 
            if(i===3){
              stroke(c,[[-28,-38],[-3,-9],[20,31]],'#e0def5',2)
            }
 
            c.restore();

          }

        }else{
          c.strokeStyle=col;
          c.lineWidth=i===6?5:2;
          c.beginPath();
          c.arc(83,137,9+p*(i===6?44:27),.2,5.6);
          c.stroke()
        }

        for(let k=0;k<12;k++){
          let a=k*2.399,x=83+Math.cos(a)*(9+p*53),y=137+Math.sin(a)*(9+p*40)+p*p*16;
          c.save();
          c.translate(x,y);
          c.rotate(a);
          if(i===5)polygon(c,[[-2,-2],[10,0],[-2,2]],col);else if(i===3)shape(c,3,0,0,.15,col);else if(i===1)stroke(c,[[0,0],[5,-6],[2,-12]],col,2);else c.fillStyle=col,c.fillRect(-2,-2,i===2?5:3,i===0?9:3);
          c.restore()
        }

        c.globalAlpha=Math.max(0,1-hit)*.55;
        circle(c,83,137,19,col);
        c.globalAlpha=1;

      }

 
      requestAnimationFrame(frame);
    }
    frame();
  });
}

