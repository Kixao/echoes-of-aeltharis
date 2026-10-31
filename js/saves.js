'use strict';

// Emberwild v0.1.29 — js/saves.js

function restoreCombatFields(raw,out,fail){
 
  const allowed=new Set(Object.keys(STATUS_INFO));
  function statuses(list,target){
    if(list==null)return [];
    if(!Array.isArray(list)||list.length>8)fail();
    const seen=new Set();
    return list.map(x=>{
      if(!x||typeof x!=='object'||!allowed.has(x.id)||seen.has(x.id))fail();
      seen.add(x.id);
      if(target==='player'&&!['oil','feared'].includes(x.id)||target==='enemy'&&!['shades','overheat','thorns','fire'].includes(x.id))fail();
      const y={id:x.id};
      for(const key of ['hp','max','stacks','appliedTurn','expiresTurn'])if(x[key]!=null){
        if(!Number.isSafeInteger(x[key])||x[key]<0||x[key]>1e9)fail();
        y[key]=x[key]
      }
      if(x.id==='oil'&&(!y.stacks||y.stacks>2||y.appliedTurn==null))fail();
      if(['fire','thorns'].includes(x.id)&&(!y.hp||!y.max||y.hp>y.max||!out.enemy||y.max>Math.ceil(out.enemy.max*.15)))fail();
      if(['shades','feared'].includes(x.id)&&y.expiresTurn==null)fail();
      return y
    })
  }
 
  out.statuses=statuses(raw.statuses,'player');
  if(out.enemy){
    out.enemy.statuses=statuses(raw.enemy?.statuses,'enemy');
    out.enemy.discoveredSpecial=!!raw.enemy.discoveredSpecial
  }
 
  out.flow=null;
  if(raw.flow!=null){
    const f=raw.flow;
    if(!f||typeof f!=='object'||!out.enemy||f.loc!==out.loc||f.room!==out.room||f.enemy!==out.enemy.name||!Array.isArray(f.events)||f.events.length>20)fail();
    const kinds=['playerHit','enemyHit','mark','retaliation','status','lifeHeal','turnEnd','missileContact','missileResolve'];
    const textKeys=['label','math','id','damageType','defense'],numKeys=['amount','mult','enemyRoll','dodgeRoll','loc','hit','base','rawBase','postMitigation','reduction','index','damageMin','damageMax','critBonus','enemyDodge'];
    out.flow={loc:f.loc,room:f.room,enemy:f.enemy,events:f.events.map(e=>{
      if(!e||!kinds.includes(e.kind)||!Number.isFinite(e.at)||e.at<0||e.at>1e15)fail();
      const n={kind:e.kind,at:e.at};
      for(const k of textKeys)if(e[k]!=null){
        if(typeof e[k]!=='string'||e[k].length>2000)fail();
        n[k]=e[k]
      }
      for(const k of numKeys)if(e[k]!=null){
        if(!Number.isFinite(e[k])||e[k]<0||e[k]>1e9)fail();
        n[k]=e[k]
      }
      if(n.kind==='status'&&!['shades','overheat','thorns','fire'].includes(n.id))fail();
      if(n.damageType!=null&&!['physical','magical'].includes(n.damageType))fail();
      if(n.defense!=null&&!['Armor','Resistance'].includes(n.defense))fail();
      if(n.kind==='missileContact'&&(!Number.isInteger(n.index)||n.index<0||n.index>2))fail();
      if(n.kind==='missileResolve'){
        if(!Number.isInteger(n.damageMin)||!Number.isInteger(n.damageMax)||n.damageMin<0||n.damageMax<n.damageMin||n.critBonus==null||n.critBonus>10000||n.enemyDodge==null||n.enemyDodge>100||!Array.isArray(e.darts)||e.darts.length!==3)fail();
        n.darts=e.darts.map(d=>{if(!d||!Number.isInteger(d.enemyRoll)||d.enemyRoll<1||d.enemyRoll>100||typeof d.hit!=='boolean')fail();return {enemyRoll:d.enemyRoll,hit:d.hit}})
      }
      if(['playerHit','enemyHit','retaliation','mark'].includes(n.kind)&&n.amount==null)fail();
      if(['enemyHit','retaliation'].includes(n.kind)&&(n.dodgeRoll==null||n.dodgeRoll<1||n.dodgeRoll>100))fail();
      if(n.kind==='playerHit'&&(n.enemyRoll==null||n.enemyRoll<1||n.enemyRoll>100||n.mult==null))fail();
      if(e.special!=null&&typeof e.special!=='boolean')fail();
      n.special=!!e.special;
      n.consumeHeat=!!e.consumeHeat;
      return n
    }).sort((a,b)=>a.at-b.at)};
    if(f.visual!=null){
      const v=f.visual;
      if(!v||v.index!==out.loc-1||!Number.isFinite(v.time)||v.time<0||v.time>1e15||!Array.isArray(v.hits)||v.hits.length>6)fail();
      const hits=v.hits.map(h=>{
        if(!h||!Number.isFinite(h.at)||h.at<0||h.at>10||!Number.isFinite(h.amount)||h.amount<0||h.amount>1e9||!Number.isInteger(h.dodgeRoll)||h.dodgeRoll<1||h.dodgeRoll>100)fail();
        return {at:h.at,amount:h.amount,dodgeRoll:h.dodgeRoll}
      });
      if(v.results!=null&&(!Array.isArray(v.results)||v.results.length>6||v.results.some(x=>typeof x!=='boolean')))fail();
      if(v.healing!=null&&(!Number.isFinite(v.healing)||v.healing<0||v.healing>1e9))fail();
      out.flow.visual={index:v.index,time:v.time,empowered:!!v.empowered,hits,results:v.results||[],healing:v.healing||0};
    }
    if(f.lifeDrained!=null){
      if(!Number.isFinite(f.lifeDrained)||f.lifeDrained<0||f.lifeDrained>1e9)fail();
      out.flow.lifeDrained=f.lifeDrained
    }
  }

}

function save(){
  if(!s)return;
  s.saved=Date.now();
  try{
    localStorage.setItem(KEY,JSON.stringify(s))
  }catch(e){
    $('#save').textContent='Saving unavailable'
  }
}

function clearCharacter(){
  effects=[];
  popups=[];
  localStorage.removeItem(KEY);
  s=null;
  draft={name:'',class:'Mage',stats:[9,3,3,3,3],startAbility:null};
  tab='journey';
  selected=1;
  creation()
}

function deleteCharacter(){
  if(!s)return;
  if(!confirm('Permanently delete '+s.name+'? All levels, gold, stats, upgrades and perks will be lost. This cannot be undone.'))return;
  clearCharacter();
  landing=true;
  render()
}

function newHero(){
  if(!s?.dead)return;
  clearCharacter()
}

function exportSave(){
  if(!s)return;
  save();
  let blob=new Blob([JSON.stringify({format:'echoes-of-aeltharis-save',version:1,exportedAt:new Date().toISOString(),character:s},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;
  a.download='aeltharis-'+s.name.replace(/[^a-z0-9_-]/gi,'_')+'.json';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  notify('Save exported. Keep it somewhere safe.')
}

function validateSave(input){
  const fail=()=>{
    throw new Error('This is not a valid Echoes of Aeltharis save.');
  },obj=v=>v&&typeof v==='object'&&!Array.isArray(v),num=(v,min=0,max=1e12)=>Number.isFinite(v)&&v>=min&&v<=max,int=(v,min=0,max=1e12)=>num(v,min,max)&&Number.isInteger(v),str=(v,max=500)=>typeof v==='string'&&v.length<=max;
  if(!obj(input))fail();
  let raw=input.format==='echoes-of-aeltharis-save'?input.character:input;
  if(input.format&& (input.format!=='echoes-of-aeltharis-save'||input.version!==1))fail();
  if(!obj(raw)||raw.version!==4||raw.class!=='Mage'||!str(raw.name,24)||!raw.name.trim())fail();
  if(!Array.isArray(raw.stats)||raw.stats.length!==5||!raw.stats.every(v=>int(v,3,1000000))||!Array.isArray(raw.perks)||raw.perks.length!==10||!raw.perks.every(v=>int(v,0,3)))fail();
  if(!int(raw.level,1,MAX_LEVEL)||!int(raw.points,0,MAX_LEVEL-1)||raw.points+raw.perks.reduce((a,b)=>a+b,0)!==raw.level-1)fail();
  for(let k of ['xp','gold','weapon','kills','clears','runGold'])if(!int(raw[k]))fail();
  if(!int(raw.streak??0))fail();
  if(!int(raw.loc,0,1)||!num(raw.hp,0,raw.stats[4]*20+10000)||!num(raw.mana,0,raw.stats[0]*10+10000)||typeof raw.dead!=='boolean'||typeof raw.complete!=='boolean'||(raw.dead&&raw.hp!==0)||(!raw.dead&&raw.hp<=0&&!raw.eventPopup?.fatal))fail();
  if(!num(raw.cooldown??0,0,1e15)||!num(raw.restUntil??0,0,1e15))fail();
  let out={};
  for(let k of ['version','name','class','stats','perks','points','level','xp','gold','weapon','kills','clears','runGold','loc','hp','mana','dead','complete'])out[k]=raw[k];
  Object.assign(out,normalizeQuickslots(raw,out));
  out.streak=raw.streak||0;
  out.cooldown=raw.cooldown||0;
  out.restUntil=raw.restUntil||0;
  restoreDungeonFields(raw,out,fail);
  out.room=raw.room??0;
  if(!int(out.room,0,6))fail();
  out.inventory={};
  for(let k of Object.keys(SATCHEL_CATALOG)){
    let count=raw.inventory?.[k]??0;
    if(!int(count,0,9999))fail();
    out.inventory[k]=count;
  }
  out.items=Array.isArray(raw.items)?raw.items.slice(0,101).map(validateItem):[];
  out.equipment={};
  for(const slot of EQUIPMENT_SLOTS)out.equipment[slot]=raw.equipment?.[slot]?validateItem(raw.equipment[slot]):null;
  migrateEquipment(raw,out);
  out.buffs={mirror:!!raw.buffs?.mirror,shout:!!raw.buffs?.shout};
  out.log=Array.isArray(raw.log)?raw.log.filter(x=>str(x,1000)).slice(0,80):[];
  out.combatLog=Array.isArray(raw.combatLog)?raw.combatLog.filter(e=>obj(e)&&str(e.message,2000)&&str(e.type,30)&&num(e.time,0,1e15)&&int(e.run,1)).slice(0,80).map(e=>({message:e.message,type:['attack','critical','hurt','heal','gold','notice','dodge'].includes(e.type)?e.type:'notice',time:e.time,run:e.run,math:str(e.math,2000)?e.math:''})):[];
  out.lastHit='';
  out.travel=null;
  out.enemy=null;
  out.pending=null;
  out.rewardPopup=null;
  if(raw.travel!=null){
    if(!obj(raw.travel)||!int(raw.travel.to,0,1)||!num(raw.travel.arrive,0,1e15))fail();
    out.travel={to:raw.travel.to,arrive:raw.travel.arrive};
  }
  if(raw.enemy!=null){
    let e=raw.enemy;
    if(!obj(e)||!out.loc||!['Skeleton','Ghost','Wraith','Death Knight','The Ebon Sentinel','The Mourning Lady','The Nameless Wraith'].includes(e.name)||typeof e.boss!=='boolean'||e.boss!==['The Ebon Sentinel','The Mourning Lady','The Nameless Wraith'].includes(e.name)||!num(e.max,1)||!num(e.hp,0,e.max)||!int(e.attacks??0))fail();
    out.enemy={name:e.name,hp:e.hp,max:e.max,boss:e.boss,attacks:e.attacks||0,guarded:!!e.guarded,mark:num(e.mark,0,1000000)?e.mark:0};
  }
  if(raw.rewardPopup!=null){
    let r=raw.rewardPopup;
    if(!obj(r)||!out.enemy||out.enemy.hp!==0||r.name!==out.enemy.name||r.boss!==out.enemy.boss||!int(r.xp,0,42)||!int(r.gold,0,66))fail();
    out.rewardPopup={name:r.name,boss:r.boss,xp:r.xp,gold:r.gold,item:r.item?validateItem(r.item):null};
  }
  if(raw.pending!=null){
    let q=raw.pending;
    if(!obj(q)||!out.enemy||out.enemy.hp<=0||out.rewardPopup||q.name!==out.enemy.name||!num(q.at,0,1e15)||!num(q.damage,0)||!int(q.dodgeRoll,1,100)||!num(q.dodge,0,75))fail();
    for(const k of ['base','rawBase','reduction'])if(q[k]!=null&&!num(q[k],0,1e9))fail();
    if(q.damageType!=null&&!['physical','magical'].includes(q.damageType)||q.defense!=null&&!['Armor','Resistance'].includes(q.defense))fail();
    out.pending={visualLaunched:!!q.visualLaunched,at:q.at,name:q.name,damage:q.damage,base:q.base,rawBase:q.rawBase,reduction:q.reduction,damageType:q.damageType,defense:q.defense,dodgeRoll:q.dodgeRoll,dodge:q.dodge,math:str(q.math,2000)?q.math:'',special:q.special&&out.enemy.boss?bossSpecial(out.loc):null};
  }
  if(out.travel&&(out.enemy||out.pending||out.rewardPopup)||out.complete&&(out.enemy||out.rewardPopup)||out.restUntil&&(out.loc!==0||out.travel)||!out.dead&&!out.travel&&out.loc>0&&!out.complete&&!out.enemy&&!out.dungeon&&!out.awaitingDifficulty||out.enemy&&out.enemy.hp===0&&!out.rewardPopup)fail();
  restoreCombatFields(raw,out,fail);
  restoreExpeditionFields(raw,out,fail);
  return out;
}

async function importSave(file){
  if(!file)return;
  if(file.size>1000000){
    notify('That save file is too large.');
    return;
  }
  try{
    let imported=validateSave(JSON.parse(await file.text()));
    if(s&&!confirm('Import '+imported.name+' ('+imported.class+', level '+imported.level+')? This will replace '+s.name+' and overwrite the current browser save. Export your current character first if you want to keep it.'))return;
    if(imported.dead&&!imported.defeatPopup){
      imported.dead=false;
      imported.loc=0;
      imported.travel=null;
      imported.enemy=null;
      imported.pending=null;
      imported.rewardPopup=null;
      imported.complete=false;
      imported.runGold=0;
      imported.streak=0;
      imported.hp=imported.stats[4]*20;
      imported.mana=imported.stats[0]*10;
    }
    localStorage.setItem(KEY,JSON.stringify(imported));
    s=imported;
    landing=false;
    effects=[];
    popups=[];
    tab='journey';
    selected=s.loc||1;
    render();
    tick();
    notify('Welcome back, '+s.name+'.');
  }catch(e){
    notify('Could not import: choose a valid Echoes of Aeltharis character JSON. Your saved data was not changed.')
  }
}

function loadSave(){
  try{
    s=JSON.parse(localStorage.getItem(KEY));
    if(s?.version!==4||s.class!=='Mage'||!Array.isArray(s.stats)||s.stats.length!==5)s=null;
  }catch(e){
    s=null
  }
  if(s?.dead&&!s.defeatPopup){
    s.dead=false;
    s.loc=0;
    s.travel=null;
    s.enemy=null;
    s.pending=null;
    s.rewardPopup=null;
    s.complete=false;
    s.runGold=0;
    s.streak=0;
    s.buffs={};
    s.restUntil=0;
    s.hp=s.stats[4]*20;
    s.mana=s.stats[0]*10;
    s.log=(s.log||[]).slice(0,80);
    s.log.unshift('Your adventure continues: permanent death has been removed.');
  }
  if(s){
    s.dungeonCleared=Math.max(0,Math.min(5,s.dungeonCleared??(s.clears>0?1:0)));
    s.dungeonLevel=s.dungeonLevel||1;s.eventMods=s.eventMods||{};
    s.items=s.items||[];s.equipment=s.equipment||{};migrateEquipment(s,s);
    ensureQuickslots();
    s.statuses=s.statuses||[];
    if(s.enemy)s.enemy.statuses=s.enemy.statuses||[];
    s.inventory=s.inventory||{};
    s.streak=s.streak||0;
    s.combatLog=s.combatLog||[];
    s.runXP=s.runXP||0;
    s.defeatPopup=s.defeatPopup||null;
    if(!s.dead&&!s.expeditionXPBase&&(s.loc>0||s.travel?.to>0))beginExpeditionXP();
  }
}

