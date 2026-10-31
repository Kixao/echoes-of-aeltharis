'use strict';

// Combat-only artwork. Shadow roots isolate SVG IDs and rig CSS from the rest of the UI.
const CombatModelRegistry=Object.create(null);
const COMBAT_MODEL_ENEMIES={Skeleton:'skeleton',Ghost:'ghost',Wraith:'wraith','The Ebon Sentinel':'sentinel'};
const COMBAT_MODEL_TIMING={skeleton:{contact:625,end:1450,death:2400},ghost:{contact:1037,end:1600,death:3100},wraith:{contact:1280,end:2320,death:3900},sentinel:{contact:1050,end:1950,death:3800},mage:{death:5600}};
const COMBAT_RANGED_SPEED=1.25;
const COMBAT_RESULT_DELAY={victory:1600,defeat:2700};
let retainedCombatModels=new Map();
function combatModelKey(side){return [s.loc,s.room,s.dungeon?.active||'',s.enemy?.combatModelId||'',side].join(':');}
function combatModelView(kind,side){return `<eoa-combat-model data-model="${kind}" data-side="${side}" data-key="${esc(combatModelKey(side))}" aria-label="${side==='player'?'Mage':esc(s.enemy?.name||'Enemy')} combat model"></eoa-combat-model>`;}
function combatPlayerArt(){return s.class==='Mage'?combatModelView('mage','player'):portrait(s.class);}
function combatEnemyArt(name){return COMBAT_MODEL_ENEMIES[name]?combatModelView(COMBAT_MODEL_ENEMIES[name],'enemy'):enemyPortrait(name);}
function approvedEnemyTiming(name){return COMBAT_MODEL_TIMING[COMBAT_MODEL_ENEMIES[name]]||{contact:680,end:950,death:1000};}
function retainCombatModels(){
 retainedCombatModels=new Map([...document.querySelectorAll('eoa-combat-model')].map(el=>{
  // Keeping the node alone is insufficient: removing it cancels its CSS animations.
  // Save every clock (including delayed, paused and filled animations) before render.
  el.animationClocks=(el.shadowRoot?.getAnimations()||[]).filter(a=>a.animationName).map(a=>({
   target:a.effect.target,name:a.animationName,time:a.currentTime,rate:a.playbackRate,paused:a.playState==='paused'
  }));
  return [el.dataset.key,el];
 }));
}
function restoreCombatAnimationClocks(el){
 const used=new Set();
 for(const clock of el.animationClocks||[]){
  const animation=clock.target.getAnimations().find(a=>a.animationName===clock.name&&!used.has(a));
  if(!animation)continue;
  used.add(animation);animation.playbackRate=clock.rate;
  if(clock.time!==null)animation.currentTime=clock.time;
  if(clock.paused)animation.pause();
 }
 el.animationClocks=null;
}
class EoaCombatModel extends HTMLElement{
 setup(){
  if(this.controller)return;
  const spec=CombatModelRegistry[this.dataset.model];if(!spec)return;
  const shadow=this.attachShadow({mode:'open'});shadow.innerHTML=spec.html;
  this.modelRoot=shadow.querySelector('div[id]');this.seen=new Set();
  this.controller=spec.init(this.modelRoot,this);
 }
 point(which='chest'){
  const c=this.controller;if(!c?.svg)return null;
  const coords=c.point[which]||c.point.chest,owner=which==='hand'&&c.hand?c.hand:c.svg,m=owner.getScreenCTM();
  return m?new DOMPoint(...coords).matrixTransform(m):null;
 }
 targetPoint(which='chest'){
  const other=document.querySelector(`eoa-combat-model[data-side="${this.dataset.side==='enemy'?'player':'enemy'}"]`),p=other?.point(which),m=this.controller?.svg.getScreenCTM();
  return p&&m?p.matrixTransform(m.inverse()):null;
 }
 play(state){if(this._dead&&state!=='death')return;if(state==='death')this._dead=true;this.controller?.play(state==='attack'&&this.dataset.model==='mage'?'cast':state);}
 once(id,state){if(this.seen.has(id))return;this.seen.add(id);if(this.seen.size>80)this.seen.delete(this.seen.values().next().value);this.play(state);}
}
customElements.define('eoa-combat-model',EoaCombatModel);
function mountCombatModels(){
 for(const placeholder of document.querySelectorAll('eoa-combat-model')){
  const old=retainedCombatModels.get(placeholder.dataset.key);
  if(old&&old.dataset.model===placeholder.dataset.model){placeholder.replaceWith(old);restoreCombatAnimationClocks(old);}
 }
 retainedCombatModels.clear();
 document.querySelectorAll('eoa-combat-model').forEach(el=>el.setup());
 const player=document.querySelector('eoa-combat-model[data-side="player"]'),enemy=document.querySelector('eoa-combat-model[data-side="enemy"]');
 if(!player||!enemy)return;

 // Rendering may happen many times per attack; effects carry stable IDs.
 for(const fx of effects){
  if(Date.now()-fx.time>4500)continue;
  const token=fx.id??fx.time+'-'+fx.type;
  if(['basic-mage','magic-missile','earth-spike','thunder'].includes(fx.type))player.once(token,'attack');
  if(fx.type.startsWith('enemy-themed-'))enemy.once(token,'attack');
  if(fx.type==='boss-special')enemy.once(token,'special');
 }
 if(s.dead||s.defeatPopup)player.once('death','death');else if(hitFX.player)player.play('hit');
 if(s.enemy?.hp<=0&&(s.rewardPopup||defeatPresentation||s.complete))enemy.once('death','death');else if(hitFX.enemy)enemy.play('hit');
}

let combatMageImage;
function combatHeroArtImage(cl){if(cl!=='Mage')return heroArtImage(cl);if(!combatMageImage){combatMageImage=new Image();combatMageImage.src='assets/artwork/players/mage-combat.svg';}return combatMageImage;}
