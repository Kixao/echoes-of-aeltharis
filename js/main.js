'use strict';

// Emberwild v0.1.29 — js/main.js

function tick(){
  if(landing||!s)return;
  if(s.defeatPopup){
    if(!s.defeatPopup.shown&&defeatPopupReady()){
      s.defeatPopup.shown=true;
      save();
      render();
      document.getElementById('resurrectButton')?.focus();
    }
    return;
  }
  if(s.dead)return;
  processCombatTimeline();
  if(defeatPresentation){
    if(Date.now()>=defeatPresentation.end){
      defeatPresentation=null;
      render();
    }else if(!defeatPresentation.hitShown&&Date.now()>=defeatPresentation.contact){
      defeatPresentation.hitShown=true;
      render();
    }
  }
  if(s.pending&&Date.now()>=s.pending.at)resolveRetaliation();
  if(s.dead)return;
  if(s.restUntil&&city()&&Date.now()>=s.restUntil){
    s.hp=calc().hp;
    s.mana=calc().mana;
    s.restUntil=0;
    save();
    render();
    notify("Rest complete. Health and mana restored.")
  }
  if(s.travel&&Date.now()>=s.travel.arrive){
    s.loc=s.travel.to;
    s.travel=null;
    s.cooldown=0;
    if(s.loc){
      s.room=0;
      s.dungeon=null;
    }
    log('Arrived at '+locations[s.loc].name+'.');
    save();
    render()
  }else updateCooldown()
}

function combatFrame(){
  processCombatTimeline();
  paintPlayerAttacks();
  paintTravelAnimation();
  requestAnimationFrame(combatFrame)
}

// Classic scripts deliberately share a global scope: no network loaders, module imports or server required.
installQuickslotEvents();
loadSave();
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!document.getElementById('adminModal').hidden)closeAdmin()
});
document.getElementById('adminModal').addEventListener('click',e=>{
  if(e.target.id==='adminModal')closeAdmin()
});
if(s)save();
render();
tick();
setInterval(tick,100);
window.addEventListener('pagehide',save);
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible')tick()
});
document.addEventListener('pointermove',e=>{
  let el=e.target.closest?.('[data-math]');
  if(el)showMath(el,e.clientX,e.clientY);else hideMath()
});
document.addEventListener('pointerout',e=>{
  if(e.target.closest?.('[data-math]')&&!e.relatedTarget?.closest?.('[data-math]'))hideMath()
});
document.addEventListener('focusin',e=>{
  let el=e.target.closest?.('[data-math]');
  if(el){
    let r=el.getBoundingClientRect();
    showMath(el,r.left,r.bottom);
  }
});
document.addEventListener('focusout',hideMath);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')hideMath()
});
window.addEventListener('resize',positionRangedEffects);
requestAnimationFrame(combatFrame);


document.addEventListener('keydown',combatMenuKeydown);
window.addEventListener('resize',positionCombatMenu);

document.addEventListener('keydown',defeatPopupKeydown);
window.addEventListener('resize',positionDefeatPopup);

document.addEventListener('keydown',victoryPopupKeydown);
window.addEventListener('resize',positionVictoryPopup);
