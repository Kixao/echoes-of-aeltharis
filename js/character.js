'use strict';

// Emberwild v0.1.29 — js/character.js

function choose(c){
  draft.class=c;
  creation()
}

function statDraft(i,n){
  if(n<0&&draft.stats[i]<=3||n>0&&draft.stats.reduce((a,b)=>a+b,0)>=21)return;
  draft.stats[i]+=n;
  creation()
}

function rank(key){
  let i=perks[s.class].findIndex(p=>p[2]===key);
  return i<0?0:s.perks[i]
}

function calc(){
  let [int,str,agi,luck,vit]=s.stats,g=itemBonus(),w=weaponRange(),bonus=(int+g.intelligence)*2,factor=(1+rank('damage')*.1+rank('focus')*.05+rank('echo')*.06+rank('strike')*.08)*(1+rank('master')*.12);
  return {hp:Math.max(1,(vit+g.vitality)*20+g.hp),mana:Math.max(0,(int+g.intelligence)*10+g.mana),dodge:Math.max(0,Math.min(.75,(agi+g.agility)*.02+rank('dodge')*.02+(s.buffs?.mirror?.2:0))-(getStatus('player','oil')?.stacks||0)*.15),bonus,physicalBonus:(str+g.strength)*2,factor,armor:Math.max(0,g.armor),resistance:Math.max(0,g.resistance),min:Math.max(0,Math.round((w.min+g.damageMin+bonus)*factor)+(s.eventMods?.attack||0)),max:Math.max(0,Math.round((w.max+g.damageMax+bonus)*factor)+(s.eventMods?.attack||0)),crit:(luck+g.luck)*.6+rank('crit')+rank('critPower')*2,goldChance:Math.min(.85,.22+(luck+g.luck)*.02+rank('gold')*.03+(s.streak||0)*.03)}
}

function xpNeed(){
  return 100+s.level*40
}

function createHero(){
  if(!['magicMissile','earthSpike','mirror'].includes(draft.startAbility))return;
  if(!draft.name.trim()){
    notify('Give your adventurer a name first.');
    document.getElementById('creatorHeroName')?.focus();
    return
  }
  s={version:4,name:draft.name.trim(),class:'Mage',stats:[...draft.stats],perks:Array(10).fill(0),points:0,level:1,xp:0,gold:0,weapon:0,inventory:{},items:[],equipment:Object.fromEntries(EQUIPMENT_SLOTS.map(k=>[k,null])),mana:draft.stats[0]*10,buffs:{},restUntil:0,loc:0,kills:0,clears:0,log:['Welcome to Greyhaven. The Sepulcher of the Forsaken waits beyond the walls.'],hp:draft.stats[4]*20,runGold:0,runXP:0,expeditionXPBase:null,defeatPopup:null,streak:0,combatLog:[],cooldown:0,dead:false,complete:false,travel:null,enemy:null};
  s.learnedAbilities=[draft.startAbility];
  ensureQuickslots();
  landing=false;tab='journey';
  save();
  render()
}

function buyPerk(i){
  if(!city()||!Number.isInteger(i)||i<0||i>9||s.points<=0||s.perks[i]>=3||s.perks.reduce((a,b)=>a+b,0)<Math.floor(i/3)*6)return;
  s.perks[i]++;
  s.points--;
  save();
  render()
}

function resetPerks(){
  if(!city())return;
  s.perks.fill(0);
  s.points=s.level-1;
  save();
  render()
}

function weaponRange(level=s.weapon){
  let base={Mage:[2,8]}[s.class];
  return {min:base[0]+level*2,max:base[1]+level*6}
}

