'use strict';

// Emberwild v0.1.29 — js/journey.js

function selectLocation(i){
  selected=i;
  render()
}

function city(){
  return !s.dead&&s.loc===0&&!s.travel
}

function cost(i){
  return 0; // All destinations, including the return journey, have no fare.
}

function duration(i){
  return 5; // Five real-time seconds in either direction, regardless of equipment.
}

function travel(to){
  if(s.restUntil||!city()||!locations[to]||to===0||s.level<locations[to].level||s.gold<cost(to))return;
  s.awaitingDifficulty=true;
  s.dungeonLevel=1; s.dungeon=null;s.eventPopup=null;s.eventMods={};
  beginExpeditionXP();
  s.gold-=cost(to);
  s.travel={to,arrive:Date.now()+duration(to)*1000};
  s.runGold=0;
  s.streak=0;
  s.combatLog=[];
  combatEvent('Entered '+locations[to].name+'. Expedition 1 begins.','notice');
  s.complete=false;
  s.enemy=null;
  s.room=0;
  tab='journey';
  log('Departed for '+locations[to].name+'. Travel takes 5 seconds and is free.');
  save();
  render();
}

function spawn(){
  defeatPresentation=null;
  s.flow=null;
  s.statuses=[];
  s.buffs={};
  s.pending=null;
  s.rewardPopup=null;
  let l=locations[s.loc],boss=s.room===5,base=28+dungeonLevel()*9,hp=boss?base*2:rollInt(Math.round(base*.8),Math.round(base*1.2));
  s.enemy={name:boss?l.enemies[3]:l.enemies[s.room%3],hp,max:hp,boss,attacks:0};
}

function returnHome(flee){
  if(!s||s.dead||city()||s.travel||(!flee&&!s.complete))return;
  if(s.dungeon?.complete)flee=false;
  s.awaitingDifficulty=false;
  s.flow=null;
  s.statuses=[];
  s.pending=null;
  s.rewardPopup=null;
  popups=[];
  effects=[];
  if(s.eventPopup||dungeonEntering)return;
  clearDungeonEffects();s.dungeon=null;
  let amount=s.runGold,keptXP=s.runXP||0;
  bankExpeditionXP();
  if(!flee)s.gold+=amount;
  combatEvent(flee?'Retreated: pending Aether Relics forfeited. XP remains permanent.':'Returned safely to Greyhaven. Secured Aether Relics and banked gold remain yours.','notice');
  s.runGold=0;
  s.streak=0;
  s.buffs={};
  s.enemy=null;
  s.lastHit='';
  s.complete=false;
  s.travel={to:0,arrive:Date.now()+duration(0)*1000};
  log(flee?'Retreated from the Sepulcher; pending Aether Relics lost, XP kept.':'Returned to Greyhaven with secured Aether Relics; boss gold was banked on victory.');
  tab='journey';
  save();
  render();
}

function goAgain(){
  if(!s||s.dead||s.travel||city()||!s.complete)return;
  s.streak=(s.streak||0)+1;
  s.complete=false;
  s.room=0;
  s.lastHit='Run '+(s.streak+1)+' begins. Unsecured Aether Relics remain at risk.';
  clearDungeonEffects();s.dungeon=null;
  combatEvent('Continued deeper. Experience stays earned; unsecured Aether Relics are lost on retreat or defeat.','notice');
  save();
  render()
}

