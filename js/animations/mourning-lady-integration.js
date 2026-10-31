// Integration of the supplied V16 boss-only scene into the classic-script combat engine.
// All HP, damage and status changes remain authoritative in js/combat.js.
'use strict';
let mourningScene=null, mourningKey='',mourningRipple=null,mourningRippleSvg=null;
let mourningClocks=[];
const MOURNING_NAME='The Mourning Lady';
function mourningSceneKey(){return [s?.loc,s?.room,s?.dungeon?.active||'',s?.enemy?.combatModelId||'',s?.enemy?.name].join(':');}
function mourningPlayerRipple(){
 const mage=document.querySelector('eoa-combat-model[data-side="player"]')?.controller?.svg;
 if(!mage)return;
 if(mourningRipple&&mourningRippleSvg!==mage){mourningRipple.destroy();mourningRipple=null;}
 if(!mourningRipple){mourningRipple=EOAMourningLadyV16.createMagePsychicRipple(mage);mourningRippleSvg=mage;}
 return mourningRipple;
}
const mourningRippleProxy={trigger(){mourningPlayerRipple()?.trigger();},stop(){mourningRipple?.stop();}};
function retainMourningScene(){
 if(!mourningScene)return;
 // Moving between two connected parents preserves the instance and its timers;
 // saving animation currentTime also protects CSS fill/delay across redraws.
 const all=mourningScene.v16?.shadowRoot?.getAnimations({subtree:true})||[];
 mourningClocks=all.filter(a=>a.animationName).map(a=>({target:a.effect?.target,name:a.animationName,time:a.currentTime,rate:a.playbackRate,paused:a.playState==='paused'}));
 document.body.appendChild(mourningScene);
}
function restoreMourningClocks(){
 const used=new Set();
 for(const a of mourningClocks){if(!a.target?.isConnected)continue;const current=a.target.getAnimations().find(x=>x.animationName===a.name&&!used.has(x));if(!current)continue;used.add(current);current.playbackRate=a.rate;if(a.time!==null)current.currentTime=a.time;if(a.paused)current.pause();}
 mourningClocks=[];
}
function clearMourningScene(){
 if(mourningScene){mourningScene.v16?.destroy();mourningScene.remove();mourningScene=null;}
 mourningKey='';mourningClocks=[];
 if(mourningRipple){mourningRipple.destroy();mourningRipple=null;mourningRippleSvg=null;}
}
function mourningTarget(){
 const svg=mourningScene?.v16?.svg,player=document.querySelector('eoa-combat-model[data-side="player"]');
 if(!svg||!player)return {x:193,y:251};
 const rect=svg.getBoundingClientRect(),p=player.point('chest');
 if(!p||!rect.width||!rect.height)return {x:193,y:251};
 const scale=Math.min(rect.width/720,rect.height/420),w=720*scale,h=420*scale;
 return {x:Math.max(45,Math.min(350,(p.x-rect.left-(rect.width-w)/2)/scale)),y:Math.max(40,Math.min(380,(p.y-rect.top-(rect.height-h)/2)/scale))};
}
function mountMourningScene(){
 const duel=document.querySelector('.duel'),active=duel&&s?.enemy?.name===MOURNING_NAME;
 if(!active){clearMourningScene();return;}
 const key=mourningSceneKey();
 if(mourningScene&&mourningKey!==key)clearMourningScene();
 if(!mourningScene){
  mourningScene=document.createElement('div');mourningScene.className='mourning-lady-scene';
  mourningScene.innerHTML='<div class="mourning-lady-stage"></div>';
  mourningKey=key;
  duel.appendChild(mourningScene);
  const host=mourningScene.querySelector('.mourning-lady-stage');
  mourningScene.v16=EOAMourningLadyV16.createMourningLady({mount:host,target:{x:193,y:251},playerRipple:mourningRippleProxy});
  const shadow=mourningScene.v16.shadowRoot;
  const style=document.createElement('style');
  style.textContent='.mlduel{width:100%!important;height:100%!important;max-width:none!important;margin:0!important;border:0!important;border-radius:0!important;overflow:visible!important;background:transparent!important;isolation:auto!important}.mlduel .top,.mlduel .buttons,.mlduel .controls,.mlduel header,.mlduel footer{display:none!important}.mlduel .scene{display:block!important;width:100%!important;height:100%!important;max-height:none!important;overflow:visible!important}';
  shadow.appendChild(style);
 }else{duel.appendChild(mourningScene);restoreMourningClocks();}
 // Target is calculated from the actual player SVG, not workshop coordinates.
 mourningScene.v16.setTarget(mourningTarget());
}
function mourningPlay(state){
 if(!mourningScene?.v16)return;
 const key={attack:'widowsGrasp',special:'finalLament',hit:'hit',death:'death'}[state];
 if(!key)return;
 const v16=mourningScene.v16;
 const predicted=s?.flow?.events?.find(e=>e.kind==='enemyHit');
 const didHit=predicted?predicted.dodgeRoll>calc().dodge*100:true;
 v16.play(key, {target:mourningTarget(),hit:didHit});
}
CombatModelRegistry['mourning-lady']={
 html:'<div id="eoa-ml-placeholder"><svg viewBox="0 0 720 420" aria-hidden="true"><circle cx="360" cy="210" r="1" fill="none"/></svg></div><style>:host{display:block;width:100%;height:100%;pointer-events:none}#eoa-ml-placeholder{width:100%;height:100%}#eoa-ml-placeholder svg{width:100%;height:100%;opacity:0;overflow:visible}</style>',
 init(root){return {svg:root.querySelector('svg'),point:{chest:[360,210],floor:[360,400]},play:mourningPlay};}
};
COMBAT_MODEL_ENEMIES[MOURNING_NAME]='mourning-lady';
COMBAT_MODEL_TIMING['mourning-lady']={contact:1060,end:2080,death:3050};
