'use strict';

function rest(){if(!city()||s.restUntil)return;s.restUntil=Date.now()+30000;save();render()}
function priestRestoreCost(){if(!s)return 0;const c=calc();return Math.ceil(Math.max(0,c.hp-s.hp)/10)+Math.ceil(Math.max(0,c.mana-s.mana)/10)}
function payPriestToRestore(){
  if(!s||!city()||s.restUntil)return;
  const c=calc(),healed=Math.max(0,c.hp-s.hp),manaRestored=Math.max(0,c.mana-s.mana),cost=Math.ceil(healed/10)+Math.ceil(manaRestored/10);
  if(!healed&&!manaRestored){notify('Your health and mana are already full.');return}
  if(s.gold<cost){notify('You need '+cost+' gold to pay the priest.');return}
  s.gold-=cost;s.hp=c.hp;s.mana=c.mana;log('Paid a priest '+cost+' gold to restore '+Math.ceil(healed)+' health and '+manaRestored+' mana.');save();render();notify('The priest restored your health and mana instantly.');
}
// Retained as an empty registry for the existing combat-menu shell. This first
// build has no shop stock, consumables, or scrolls.
function shopItems(){return {}}
