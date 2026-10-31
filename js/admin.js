'use strict';

// Emberwild v0.1.29 — js/admin.js

function openAdmin(){
  if(!s)return;
  const modal=document.getElementById('adminModal');
  modal.hidden=false;
  refreshAdmin();
  document.getElementById('adminLevelButton').focus()
}

function closeAdmin(){
  document.getElementById('adminModal').hidden=true;
  document.getElementById('adminToggle').focus()
}

function canAdminSkipTurn(){
  return !!(s&&!s.dead&&!city()&&!s.travel&&!s.complete&&!s.rewardPopup&&s.enemy&&s.enemy.hp>0&&!s.pending&&!combatBusy())
}

function adminSkipPlayerTurn(){
  if(!canAdminSkipTurn())return;
  closeAdmin();
  hitFX={enemy:false,player:false};
  combatEvent('You hold your attack and let the enemy take its turn.','notice');
  queueRetaliation();
  s.pending.at=Date.now();
  save();
  resolveRetaliation()
}

function refreshAdmin(){
  if(!s)return;
  document.getElementById('adminLevelText').textContent='Level '+s.level+' / '+MAX_LEVEL+' · '+s.points+' unspent perk points';
  document.getElementById('adminLevelButton').disabled=s.level>=MAX_LEVEL;
  document.getElementById('adminGoldBalance').textContent='Current banked gold: '+s.gold.toLocaleString();
  document.getElementById('adminSkipTurn').disabled=!canAdminSkipTurn();
  document.getElementById('adminRandomLoot').disabled=!!(s.dead||s.eventPopup||dungeonEntering||(s.items?.length||0)>=100)
}

function adminLevelUp(){
  if(!s||s.level>=MAX_LEVEL)return;
  s.level++;
  s.points++;
  if(s.level===MAX_LEVEL)s.xp=0;
  const c=calc();
  s.hp=Math.min(c.hp,s.hp);
  s.mana=Math.min(c.mana,s.mana);
  save();
  render();
  refreshAdmin();
  notify('Level '+s.level+' · +1 perk point')
}

function adminAddGold(){
  if(!s)return;
  const input=document.getElementById('adminGoldAmount'),n=Number(input.value);
  if(!Number.isSafeInteger(n)||n<=0||n>1e12||s.gold+n>1e12){
    notify('Enter a positive whole number (maximum total: 1 trillion).');
    return;
  }
  s.gold+=n;
  save();
  render();
  refreshAdmin();
  notify('Added '+n.toLocaleString()+' gold')
}

function adminRandomLoot(){
 if(!s||s.dead||s.eventPopup||dungeonEntering)return;
 if((s.items?.length||0)>=100){notify('Your equipment pack is full.');return}
 const item=generateItem(true);s.items=s.items||[];s.items.unshift(item);
 log('Admin test loot: '+item.rarity+' '+item.name+'.');save();render();refreshAdmin();
 const result=document.getElementById('adminLootResult');if(result)result.textContent=item.name+' · '+item.rarity+' · '+SLOT_LABELS[item.slot];
 notify('Test loot added: '+item.name);
}
