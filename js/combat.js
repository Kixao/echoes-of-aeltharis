'use strict';

// Emberwild v0.1.29 — js/combat.js

function victoryReady(){
  return !defeatPresentation||Date.now()>=defeatPresentation.end;
}

function displayedEnemyHP(e){
  return defeatPresentation&&Date.now()<defeatPresentation.contact?defeatPresentation.hp:e.hp;
}

function combatBusy(){
  return !!s?.flow?.events?.length
}

function newFlow(events,visual=null){
  s.flow={loc:s.loc,room:s.room,enemy:s.enemy?.name,events:events.sort((a,b)=>a.at-b.at),visual}
}

function addTimelineEvent(kind,at,values={}){
  if(!s.flow)newFlow([]);
  s.flow.events.push({kind,at,...values});
  s.flow.events.sort((a,b)=>a.at-b.at)
}

function prepareDefeat(){
  const now=Date.now();
  defeatPresentation={contact:now,end:now+COMBAT_RESULT_DELAY.victory,hp:0,hitShown:true};
  reward();
}

function playerDefeated(){
  if(s.defeatPopup)return;
  ensureExpeditionXP();
  const enemy=s.enemy?.name||'Your enemy',lostGold=s.runGold,{lostXP,lostLevels}=forfeitExpeditionXP(),lostEquipment=loseWornEquipment();
  s.hp=0;
  s.dead=true;
  s.flow=null;
  s.pending=null;
  s.rewardPopup=null;
  s.statuses=[];
  s.runGold=0;
  s.streak=0;
  s.buffs={};
  s.complete=false;
  s.travel=null;
  s.cooldown=0;
  s.restUntil=0;
  s.defeatPopup={enemy,lostGold,lostXP,lostLevels,lostEquipment,readyAt:Date.now()+COMBAT_RESULT_DELAY.defeat,shown:false};
  defeatPresentation=null;
  combatMenuState.open=false;
  tab='journey';
  combatEvent('You died. Worn equipment lost: '+lostEquipment+'. Carried potions and pending Aether Relics are lost. XP remains permanent.','hurt');
  log('Defeated by '+enemy+'. Worn equipment and carried potions lost; XP and banked gold remain. Resurrect at Greyhaven to continue.');
  save();
}

function hurtPlayer(amount,label,dodged,math='',damageType='physical',reduction=0,defense='Armor'){
  if(dodged){
    hitFX.dodge=true;
    addPopup('DODGED!','No damage taken','dodge');
    combatEvent('You slip clear of '+label+'.','dodge',math);
    return 0
  }
  amount=Math.max(0,Math.round(amount));
  const hpBefore=s.hp;
  s.hp=Math.max(0,s.hp-amount);
  hitFX.player=true;
  addEffect('damage','player','−'+amount);
  const note=reduction?' ('+defense+' reduced '+reduction+')':'';
  combatEvent(label+' hits you for '+amount+' '+damageType+' damage'+note+'.','hurt',math);
  if(!s.hp)playerDefeated();
  return hpBefore-s.hp
}

function healBoss(amount,label){
  if(!s.enemy||s.enemy.hp<=0)return;
  const healed=Math.min(s.enemy.max-s.enemy.hp,Math.max(0,Math.round(amount)));
  if(healed){
    s.enemy.hp+=healed;
    addEffect('heal','enemy','+'+healed);
    combatEvent(label+' restores '+healed+' health.','heal','Actual healing is capped by missing health.')
  }
}

function finishEnemyTurn(){
  if(!s.enemy)return;
  const turn=s.enemy.attacks||0,oil=getStatus('player','oil');
  if(oil&&oil.appliedTurn<turn){
    oil.stacks--;
    if(!oil.stacks)dropStatus('player','oil')
  }
  const fear=getStatus('player','feared');
  if(fear&&turn>=fear.expiresTurn)dropStatus('player','feared');
  const shades=getStatus('enemy','shades');
  if(shades&&turn>=shades.expiresTurn)dropStatus('enemy','shades');
  afterAttackHeal();
  
}

function queueRetaliation(){
  const special=s.enemy.boss&&((s.enemy.attacks||0)+1)%3===0?bossSpecial():null,r=enemyRange(special),hit=rollEnemyDamage(r,special?.mult||1);
  s.pending={at:Date.now()+1000,name:s.enemy.name,damage:hit.amount,base:hit.incoming,rawBase:hit.raw,reduction:hit.reduction,damageType:r.damageType,defense:r.defense,dodgeRoll:rollInt(1,100),dodge:calc().dodge*100,special};
  combatEvent(s.enemy.name+' prepares '+(special?special.name:'a counterattack')+'.','notice')
}

function resolveRetaliation(){
  const p=s.pending;
  if(!p||!s.enemy)return;
  s.pending=null;
  if(s.travel||s.complete||s.rewardPopup)return;
  s.enemy.attacks=(s.enemy.attacks||0)+1;
  const start=Date.now(),idx=s.loc-1;
  let events=[],visual=null;
 
  if(p.special){
    const special=bossSpecial();
    s.enemy.discoveredSpecial=true;
    dropStatus('enemy','fire');
    const empowered=s.loc===7&&s.enemy.hp<s.enemy.max*.5;
    let times=s.loc===1?[s.enemy.name==='The Mourning Lady'?1.830:s.enemy.name==='The Nameless Wraith'?1.28:2.395]:s.loc===2?[.9,1.45,2]:s.loc===3?[1,1.4]:s.loc===4?[]:s.loc===5?Array.from({length:6},(_,k)=>.85+k*.18):s.loc===6?[1.25,1.85]:empowered?[1.2,1.85]:[1.2];
 
    const hits=times.map((t,k)=>{
      const r=enemyRange(special),mult=s.loc===7&&empowered?1:special.mult,hit=rollEnemyDamage(r,mult),dodgeRoll=rollInt(1,100);
      return {at:start+t*1000,kind:'enemyHit',amount:hit.amount,dodgeRoll,label:special.name,loc:s.loc,hit:k,base:hit.incoming,rawBase:hit.raw,postMitigation:hit.amount,reduction:hit.reduction,damageType:r.damageType,defense:r.defense,mult,special:true}
    });
    events.push(...hits);
 
    visual={index:idx,time:start,empowered,hits:hits.map(x=>({at:(x.at-start)/1000,amount:x.amount,dodgeRoll:x.dodgeRoll})),healing:0};
    addEffect('boss-special','player');
    Object.assign(effects[effects.length-1],visual);
 
    if(s.loc===2)events.push({kind:'status',at:start+2050,id:'shades'});
 
    if(s.loc===3)events.push({kind:'status',at:start+1800,id:'overheat'});
 
    if(s.loc===4)events.push({kind:'status',at:start+650,id:'thorns'});
 
    if(s.loc===7)events.push({kind:'status',at:start+800,id:'fire'});
 
    const end=s.loc===1?(s.enemy.name==='The Mourning Lady'?3250:s.enemy.name==='The Nameless Wraith'?2320:4000):s.loc===4?950:s.loc===2?2300:s.loc===3?2050:s.loc===5?2050:2200;
    events.push({kind:'turnEnd',at:start+end});
 
  }else{
    const ranged=enemyBasicRanged(p.name);
    launchEnemyBasic(p);
    const overheated=!!getStatus('enemy','overheat'),mult=overheated?.5:1;
    events.push({kind:'enemyHit',at:start+approvedEnemyTiming(p.name).contact,amount:Math.round(p.damage*mult),dodgeRoll:p.dodgeRoll,label:p.name==='The Mourning Lady'?'Widow’s Grasp':p.name+'’s attack',loc:0,hit:0,base:p.base,rawBase:p.rawBase,postMitigation:p.damage,reduction:p.reduction,damageType:p.damageType,defense:p.defense,mult,consumeHeat:overheated},{kind:'turnEnd',at:start+approvedEnemyTiming(p.name).end});
  }
 
  newFlow(events,visual);
  save();
  render();
  processCombatTimeline()
}

function processCombatTimeline(){
  if(!s?.flow)return;
  const flow=s.flow;
  if(flow.loc!==s.loc||flow.room!==s.room||flow.enemy!==s.enemy?.name){
    s.flow=null;
    return
  }
  let changed=false;
  while(s.flow===flow&&flow.events.length&&flow.events[0].at<=Date.now()){
    const e=flow.events.shift();
    changed=true;
    hitFX={enemy:false,player:false};
 
    if(e.kind==='playerHit')resolvePlayerHit(e);
 else if(e.kind==='missileContact'){
      const fx=effects.findLast(f=>f.type==='magic-missile');
      if(fx?.darts?.[e.index]){fx.darts[e.index].contactAt=Date.now();hitFX.enemy=fx.darts[e.index].hit}
    }
 else if(e.kind==='missileResolve')resolveMagicMissiles(e);
 else if(e.kind==='mark'){
      s.enemy.mark=e.amount;
      combatEvent('Hunter’s Mark fixes your quarry in sight.','notice','Marked target: +'+e.amount+' flat damage per hit for the encounter.')
    }
 else if(e.kind==='enemyHit'){
      const dodge=calc().dodge*100,dodged=e.dodgeRoll<=dodge,wasHP=s.hp;
      const activeFX=effects.findLast(x=>x.type==='boss-special');
      if(activeFX){
        activeFX.results=activeFX.results||[];
        activeFX.results[e.hit]=!dodged
      }
      if(flow.visual){
        flow.visual.results=flow.visual.results||[];
        flow.visual.results[e.hit]=!dodged
      }
      const damageType=e.damageType||(['Ghost','Wraith'].includes(s.enemy.name)?'magical':'physical'),defense=e.defense||(damageType==='magical'?'Resistance':'Armor'),rawBase=e.rawBase??e.base??e.amount,reduction=e.reduction||0,postMitigation=e.postMitigation??e.amount,mult=e.mult??1;
      const formula=e.special?`${rawBase} raw × ${mult} = ${e.base}; ${defense} reduced ${reduction} = ${e.amount}.`:`${rawBase} raw − ${reduction} ${defense} = ${postMitigation}${mult!==1?`; overheat × ${mult} = ${e.amount}`:''}.`;
      const dealt=hurtPlayer(e.amount,e.label,dodged,`${damageType[0].toUpperCase()+damageType.slice(1)} damage: ${formula} Dodge D100 ${e.dodgeRoll} vs ${dodge.toFixed(0)}%.`,damageType,reduction,defense);
      if(['Wraith','The Nameless Wraith'].includes(s.enemy?.name))healBoss(dealt,'Life Drain');
      if(s.flow!==flow)break;
 
      if(s.enemy?.name==='The Mourning Lady'&&e.special&&!dodged&&!s.dead){
        putStatus('player','feared',{expiresTurn:s.enemy.attacks+1});
        combatEvent('Final Lament leaves you Feared. Dodge chance −10 percentage points for one round.','hurt');
      }
      if(e.consumeHeat)dropStatus('enemy','overheat');
      if(e.loc===1){
        flow.lifeDrained=Math.min(wasHP,dealt);
        if(flow.visual)flow.visual.healing=flow.lifeDrained;
        const fx=effects.findLast(x=>x.type==='boss-special');
        if(fx)fx.healing=flow.lifeDrained
      }
 
      if(e.loc===6&&!dodged){
        const oil=getStatus('player','oil');
        putStatus('player','oil',{stacks:Math.min(2,(oil?.stacks||0)+1),appliedTurn:s.enemy.attacks});
        combatEvent('Crystal oil clings to you.','notice','Oil stacks: '+getStatus('player','oil').stacks+'; dodge −15 percentage points each, minimum 0%.')
      }
 
    }
 else if(e.kind==='lifeHeal')healBoss(flow.lifeDrained||0,'Life Drain');
 else if(e.kind==='retaliation'){
      const dodge=calc().dodge*100;
      hurtPlayer(e.amount,e.label,e.dodgeRoll<=dodge,e.math,e.damageType,e.reduction,e.defense)
    }
 else if(e.kind==='status'){
      if(e.id==='shades')putStatus('enemy','shades',{expiresTurn:s.enemy.attacks+1});else if(e.id==='overheat')putStatus('enemy','overheat');else putStatus('enemy',e.id,{hp:Math.ceil(s.enemy.max*.15),max:Math.ceil(s.enemy.max*.15)});
      combatEvent(STATUS_INFO[e.id].name+' takes effect.','notice',STATUS_INFO[e.id].detail)
    }
 else if(e.kind==='turnEnd'){
      finishEnemyTurn();
      if(s.enemy?.boss&&s.enemy.attacks%3===2)combatEvent(s.enemy.name+' gathers power. '+bossSpecial().name+' is coming!','notice')
    }
 
  }
  if(s.flow===flow&&!flow.events.length)s.flow=null;
  if(changed){
    save();
    render()
  }
}

function resolveMagicMissiles(e){
  if(!s.enemy||s.enemy.hp<=0)return;
  const hits=e.darts.filter(d=>d.hit),enemyDodge=e.enemyDodge;
  const detail=[],sharedBase=rollInt(e.damageMin,e.damageMax)*calc().factor,sharedCrit=rollInt(1,100);
  let total=0,critCount=0;
  for(let i=0;i<e.darts.length;i++){
    const dart=e.darts[i];
    if(!dart.hit){detail.push('Dart '+(i+1)+' rolled '+dart.enemyRoll+' vs '+enemyDodge+'% dodge: missed');continue}
    const base=sharedBase,critRoll=sharedCrit,mult=criticalMultiplier(critRoll,e.critBonus),damage=base*(BAL.abilities.definitions.magic_missiles.damage_multiplier/3)*mult;
    dart.base=base;dart.critRoll=critRoll;dart.mult=mult;dart.damage=damage;
    const visual=effects.findLast(f=>f.type==='magic-missile');if(visual?.darts?.[i])visual.darts[i].mult=mult;
    total+=damage;
    if(mult>1){critCount++;addPopup('DART '+(i+1)+' CRITICAL!',damage+' magical damage','critical')}
    detail.push('Dart '+(i+1)+' rolled '+dart.enemyRoll+' vs '+enemyDodge+'% dodge: hit; base '+base+' × 0.5 × critical '+mult+' (D100 '+critRoll+' + '+e.critBonus.toFixed(1)+') = '+damage+' magical damage')
  }
  if(!hits.length){
    combatEvent('All three Magic Missiles darts miss '+s.enemy.name+'.','dodge',detail.join('. ')+'. No damage dealt.');
    queueRetaliation();
    return
  }
  let amount=Math.round(total*100/(100+enemyProfile().resistance)),shield=getStatus('enemy','thorns')||getStatus('enemy','fire'),absorbed=0,guardReduction=0,shieldId=null;
  if(shield&&amount>0){
    shieldId=shield.id;absorbed=Math.min(shield.hp,amount);shield.hp-=absorbed;amount-=absorbed;
    if(shield.hp<=0)dropStatus('enemy',shield.id);
    const range=enemyRange(null,shieldId==='fire'?'magical':'physical'),hit=rollEnemyDamage(range,.25);
    addEffect('barrier-return','player');
    Object.assign(effects[effects.length-1],{fire:shieldId==='fire',born:Date.now(),dodged:false});
    addTimelineEvent('retaliation',Date.now()+450,{amount:hit.amount,damageType:range.damageType,reduction:hit.reduction,defense:range.defense,math:`${range.damageType[0].toUpperCase()+range.damageType.slice(1)} barrier retaliation: ${hit.raw} raw × 0.25 = ${hit.incoming}; ${range.defense} reduced ${hit.reduction} = ${hit.amount}.`,dodgeRoll:rollInt(1,100),label:shieldId==='fire'?'A fire bead':'Retaliating thorns'});
    combatEvent('The '+(shieldId==='fire'?'fire':'thorn')+' barrier absorbs '+absorbed+' damage'+(shield.hp<=0?' and breaks.':'.'),'notice','Shield absorbed '+absorbed+'; '+amount+' damage passes through. Breaking hits still trigger retaliation.')
  }
  if(s.enemy.guarded){const beforeGuard=amount;amount=Math.round(amount*.75);guardReduction=beforeGuard-amount;s.enemy.guarded=false}
  amount=Math.max(0,amount);s.enemy.hp=Math.max(0,s.enemy.hp-amount);
  // Each dart already triggered its reaction at contact; settlement is not another hit.
  addEffect('damage','enemy',amount?'−'+amount:absorbed?'Blocked':'−0');
  const reductions=[];
  if(absorbed)reductions.push(absorbed+' absorbed by '+(shieldId==='fire'?'fire':'thorn')+' barrier');
  if(guardReduction)reductions.push(guardReduction+' reduced by guard');
  combatEvent('Magic Missiles: '+hits.length+' of 3 darts hit '+s.enemy.name+' for '+amount+' magical damage'+(critCount?' ('+critCount+' critical '+(critCount===1?'strike':'strikes')+')':'')+(reductions.length?' ('+reductions.join('; ')+')':'')+'.',critCount?'critical':'attack',detail.join('. ')+'. Total before defenses '+total+'. Magical damage. '+(reductions.length?reductions.join('. ')+'. ':'')+'Actual HP damage '+amount+'.');
  if(s.enemy.hp<=0){prepareDefeat();afterAttackHeal()}else queueRetaliation()
}

function resolvePlayerHit(e){
  if(!s.enemy||s.enemy.hp<=0)return;
  const visual=effects.findLast(f=>isRangedVisual(f.type)||f.type==='basic-warrior');
  if(visual){visual.impactAt=Date.now();visual.hit=!(getStatus('enemy','shades')&&e.enemyRoll<=25);}
  const enemyDodge=getStatus('enemy','shades')?25:0,enemyRoll=e.enemyRoll;
  if(enemyDodge&&enemyRoll<=enemyDodge){
    addPopup('EVADED!','The shades obscure your target','dodge');
    combatEvent(s.enemy.name+' slips behind a spectral shade.','dodge','Enemy dodge: D100 '+enemyRoll+' ≤ 25%; no damage or barrier retaliation.');
    queueRetaliation();
    return
  }
 
  let amount=e.amount,shield=getStatus('enemy','thorns')||getStatus('enemy','fire'),absorbed=0,guardReduction=0;
  if(shield&&amount>0){
    absorbed=Math.min(shield.hp,amount);
    shield.hp-=absorbed;
    amount-=absorbed;
    const id=shield.id;
    if(shield.hp<=0)dropStatus('enemy',id);
    const range=enemyRange(null,id==='fire'?'magical':'physical'),hit=rollEnemyDamage(range,.25);
    addEffect('barrier-return','player');
    Object.assign(effects[effects.length-1],{fire:id==='fire',born:Date.now(),dodged:false});
    addTimelineEvent('retaliation',Date.now()+450,{amount:hit.amount,damageType:range.damageType,reduction:hit.reduction,defense:range.defense,math:`${range.damageType[0].toUpperCase()+range.damageType.slice(1)} barrier retaliation: ${hit.raw} raw × 0.25 = ${hit.incoming}; ${range.defense} reduced ${hit.reduction} = ${hit.amount}.`,dodgeRoll:rollInt(1,100),label:id==='fire'?'A fire bead':'Retaliating thorns'});
    combatEvent('The '+(id==='fire'?'fire':'thorn')+' barrier absorbs '+absorbed+' damage'+(shield.hp<=0?' and breaks.':'.'),'notice','Shield absorbed '+absorbed+'; '+amount+' damage passes through. Breaking hits still trigger retaliation.')
  }
 
  if(s.enemy.guarded){
    const beforeGuard=amount;
    amount=Math.round(amount*.75);
    guardReduction=beforeGuard-amount;
    s.enemy.guarded=false
  }
  amount=Math.max(0,amount);
  s.enemy.hp=Math.max(0,s.enemy.hp-amount);
  hitFX.enemy=true;
  if(e.mult>1){
    addPopup(e.mult+'× CRITICAL!',amount+' damage','critical')
  }
 
  addEffect('damage','enemy',amount?'−'+amount:absorbed?'Blocked':'−0');
  const damageType=e.damageType||classes[s.class].damageType||'physical',reductions=[];
  if(absorbed)reductions.push(absorbed+' absorbed by '+(shield.id==='fire'?'fire':'thorn')+' barrier');
  if(guardReduction)reductions.push(guardReduction+' reduced by guard');
  combatEvent((e.mult>1?'A critical strike! ':'')+e.label+' hits '+s.enemy.name+' for '+amount+' '+damageType+' damage'+(reductions.length?' ('+reductions.join('; ')+')':'')+'.','attack',e.math+' Damage type: '+damageType+'. Enemy dodge roll '+enemyRoll+' vs '+enemyDodge+'%. Shield absorbed '+absorbed+'. Guard reduced '+guardReduction+'. Actual HP damage '+amount+'.');
 
  if(s.enemy.hp<=0){
    prepareDefeat();
    afterAttackHeal();
  
  }else queueRetaliation();
}

function combatAction(id,scroll=false){
  if(id==='attack'){
    if(!s||s.dead||city()||s.travel||s.complete||s.rewardPopup||!s.enemy||s.pending||combatBusy()||Date.now()<s.cooldown)return;
  }else if(!canAbility(id,scroll))return;
  let a=abilityDefs()[id],c=calc();
  s.cooldown=Date.now()+(isSupport(id)?1000:2000);
  if(a){
    if(scroll)s.inventory[id]--;else s.mana-=a.cost
  }
  hitFX={enemy:false,player:false};
  const type=id==='attack'?'basic-'+s.class.toLowerCase():id==='magicMissile'?'magic-missile':id==='earthSpike'?'earth-spike':id;
  addEffect(type,isSupport(id)&&id!=='mark'?'player':'enemy');
 
  if(id==='mark'){
    s.enemy.mark=s.stats[2];
    combatEvent('Hunter’s Mark fixes your quarry in sight.','notice','Marked target: +'+s.stats[2]+' flat damage per hit for the encounter.')
  }
 else if(id==='mirror'||id==='shout'){
    s.buffs[id]=true;
    combatEvent(a.name+' takes effect.','notice',STATUS_INFO[id].detail)
  }
 else if(id==='wind'){
    const n=Math.min(c.hp-s.hp,Math.ceil(c.hp*.05));
    s.hp+=n;
    addEffect('heal','player','+'+n);
    combatEvent('Second Wind restores '+n+' health.','heal','ceil(maximum HP × 5%), capped by missing HP.')
  }
 else if(id==='magicMissile'){
    const start=Date.now(),enemyDodge=getStatus('enemy','shades')?25:0,darts=Array.from({length:3},()=>{const enemyRoll=rollInt(1,100);return {enemyRoll,hit:enemyRoll>enemyDodge}});
    const fx=effects.findLast(f=>f.type==='magic-missile');
    if(fx)fx.darts=darts.map((dart,index)=>({...dart,index,contactAt:null}));
    const events=darts.map((_,index)=>({kind:'missileContact',at:start+(1320+index*155)/COMBAT_RANGED_SPEED,index}));
    events.push({kind:'missileResolve',at:start+1680/COMBAT_RANGED_SPEED,damageMin:weaponRange().min,damageMax:weaponRange().max,critBonus:c.crit,enemyDodge,darts});
    newFlow(events)
  }
 else {
    let w=weaponRange(),weaponRoll=rollInt(w.min,w.max),critRoll=rollInt(1,100),mult=criticalMultiplier(critRoll,c.crit),ability=id==='attack'?BAL.abilities.definitions.basic_attack.damage_multiplier:BAL.abilities.definitions.earth_spike.damage_multiplier,amount=(weaponRoll+c.bonus)*c.factor*ability*mult+(s.enemy.mark||0),contact=(type==='earth-spike'?990:type==='basic-mage'?1090:isRangedVisual(type)?1140:120)/(isRangedVisual(type)?COMBAT_RANGED_SPEED:1);
    const damageType=a?.damageType||classes[s.class].damageType||'physical';
    hitFX.attacking=true;
    newFlow([{kind:'playerHit',at:Date.now()+contact,amount,mult,label:a?a.name:(classes[s.class].basicAttack||'Your attack'),damageType,enemyRoll:rollInt(1,100),math:'Weapon '+weaponRoll+' ('+w.min+'–'+w.max+') + attribute '+c.bonus+'; × buffs/perks '+c.factor.toFixed(2)+' × ability '+ability+' × critical '+mult+'; + mark '+(s.enemy.mark||0)+' = '+amount+'. Critical D100 '+critRoll+' + '+c.crit.toFixed(1)+'.'}])
  }
 
  save();
  render();
  processCombatTimeline()
}

function incoming(){
  return Math.max(1,Math.round(2+dungeonLevel()*.7+(s.enemy?.boss?2:0)))
}

function clickAttack(){
  combatAction('attack')
}

// XP grows by 2 per dungeon level. All dungeon bosses award three regular rewards.
function getEnemyXP(dungeonLevel, isBoss = false) {
  const regularXP = 4 + 2 * dungeonLevel;
  return isBoss ? regularXP * 3 : regularXP;
}

function reward(){
  if(s.rewardPopup)return;
  ensureExpeditionXP();
  let l=locations[s.loc],boss=s.enemy.boss,name=s.enemy.name;
  s.enemy.hp=0;
  s.pending=null;
  s.kills++;
  log('Defeated '+name+'.');
  let xp=s.level<MAX_LEVEL?getEnemyXP(dungeonLevel(),boss):0;
  s.runXP=(s.runXP||0)+xp;
  s.xp+=xp;
  while(s.level<MAX_LEVEL&&s.xp>=xpNeed()){
    s.xp-=xpNeed();
    s.level++;
    s.points++;
    combatEvent('Your legend grows. You reached level '+s.level+' and earned a perk point.','notice');
  }
  if(s.level===MAX_LEVEL)s.xp=0;
  let amount=(boss?12:3)+Math.floor(dungeonLevel()*.7),chance=calc().goldChance,roll=Math.random(),extra=roll<chance?amount:0,gold=(boss?amount:0)+extra;
  s.runGold+=gold;
  const item=boss?grantDungeonLoot(true):null;
  s.rewardPopup={name,boss,xp,gold,item};
  if(boss){
    s.clears++;
    s.dungeonCleared=Math.max(s.dungeonCleared||0,dungeonLevel());
    s.buffs={};
    log('Cleared '+l.name+'. The guardian’s rewards are resolved at victory.');
  }
  combatEvent(name+' falls. '+(xp?xp+' experience earned. ':'')+'Aether Relics replace regular-enemy gold and chest gear; the guardian pays gold.', 'notice','XP: '+xp+'. Aether Relics are secured on boss victory. The boss gold bounty is banked immediately.')
}

function criticalMultiplier(roll,bonus){
  return 1+Math.floor((roll+bonus)/100)
}

function rollInt(min,max){
  return min+Math.floor(Math.random()*(max-min+1))
}

function afterAttackHeal(){
  if(s.dead)return;
  let healed=Math.min(calc().hp-s.hp,rank('heal'));
  s.hp+=healed;
  if(healed)combatEvent('Perks restored '+healed+' health.','heal')
}

function enemyRange(special=null,damageTypeOverride=null){
  const base=incoming(),damageType=damageTypeOverride||special?.damageType||(['Ghost','Wraith'].includes(s.enemy?.name)?'magical':'physical'),defense=damageType==='magical'?'Resistance':'Armor',mitigation=damageType==='magical'?calc().resistance:calc().armor;
  return {rawMin:Math.max(1,base-1),rawMax:base+1,mitigation,damageType,defense}
}

function rollEnemyDamage(range,multiplier=1){
  const raw=rollInt(range.rawMin,range.rawMax),incomingDamage=Math.max(1,Math.round(raw*multiplier)),reduction=Math.min(range.mitigation,Math.max(0,incomingDamage-1));
  return {raw,incoming:incomingDamage,reduction,amount:Math.max(1,incomingDamage-range.mitigation)}
}

function applySpecial(a){
  if(a.mana){
    let lost=Math.min(s.mana,a.mana);
    s.mana-=lost;
    combatEvent(a.name+' drained '+lost+' mana.','hurt')
  }
  if(a.heal){
    let heal=Math.min(s.enemy.max-s.enemy.hp,Math.ceil(s.enemy.max*a.heal));
    s.enemy.hp+=heal;
    addEffect('heal','enemy','+'+heal);
    combatEvent(a.name+' restored '+heal+' health to '+s.enemy.name+'.','notice')
  }
  if(a.guard){
    s.enemy.guarded=true;
    combatEvent('Tidal shield: the boss takes 25% less damage from your next attack.','notice')
  }
}

function continueEncounter(){
  if(!s||s.dead||!s.rewardPopup||!victoryReady())return;
  defeatPresentation=null;
  let boss=s.rewardPopup.boss;
  s.rewardPopup=null;
  effects=[];
  popups=[];
  if(s.dungeon){
    const tile=s.dungeon.rooms.find(r=>r.id===s.dungeon.active);if(tile)tile.cleared=true;
    s.dungeon.active=null;s.enemy=null;s.complete=!!s.dungeon.complete;
    if(boss){s.complete=true;s.dungeon.complete=true;}
  }else if(boss){
    s.complete=true;
    s.enemy=null;
    s.buffs={};
  }else{
    s.room++;
    spawn();
  }
  save();
  render()
}

