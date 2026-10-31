'use strict';

function defeatPopupReady() {return !!s?.defeatPopup && Date.now()>=s.defeatPopup.readyAt;}
function defeatPopupView() {
  if(!defeatPopupReady())return '';
  const d=s.defeatPopup;
  return `<div class="death-result-layer"><div class="death-result-shade"></div><section class="death-result-dialog" role="dialog" aria-modal="true" aria-labelledby="deathResultTitle"><div class="death-result-emblem">${combatMenuIcon('wind')}</div><div class="eyebrow">Your journey continues</div><h2 id="deathResultTitle">You died?!</h2><p>${esc(d.enemy)} overwhelms you.</p><div class="death-result-losses"><span>Worn gear lost</span><span class="gold-symbol">Carried potions lost</span></div><p class="death-result-note">Worn gear, carried potions and pending Aether Relics are lost.<br>XP, banked gold, stored items and belt upgrades remain.</p><button id="resurrectButton" class="primary" onclick="resurrectAtGreyhaven()">Resurrect at Greyhaven</button></section></div>`;
}
function positionDefeatPopup() {
  const dialog=document.querySelector('.death-result-dialog'), arena=dialog?.closest('.arena'), versus=arena?.querySelector('.versus');
  if(!dialog||!versus)return;
  const a=arena.getBoundingClientRect(),v=versus.getBoundingClientRect(),half=dialog.offsetHeight/2;
  dialog.style.top=Math.max(half+14,Math.min(a.height-half-14,v.top-a.top+v.height/2))+'px';
}
function resurrectAtGreyhaven() {
  if(!s?.dead||!defeatPopupReady())return;
  clearDungeonEffects();s.dungeon=null;s.eventPopup=null;
  s.dead=false;
  s.defeatPopup=null;
  s.enemy=null;
  s.pending=null;
  s.flow=null;
  s.rewardPopup=null;
  s.loc=0;
  s.room=0;
  s.travel=null;
  s.complete=false;
  s.cooldown=0;
  s.restUntil=0;
  s.statuses=[];
  s.buffs={};
  s.hp=calc().hp;
  s.mana=calc().mana;
  s.lastHit='';
  effects=[];
  popups=[];
  defeatPresentation=null;
  combatMenuState.open=false;
  bankExpeditionXP();
  tab='journey';
  log('Resurrected at Greyhaven. Your banked progress is safe.');
  save();
  render();
  notify('You awaken in Greyhaven. Health and mana restored.');
}
function defeatPopupKeydown(event) {
  if(!s?.defeatPopup)return;
  if(event.key==='Tab'){
    const button=document.getElementById('resurrectButton');
    if(button){event.preventDefault();button.focus();}
  }
}
