'use strict';
let selectedDifficulty=1, dungeonEntering=false;
function dungeonLevel(){return s?.dungeonLevel||1}
function difficultyAllowed(n){return Number.isInteger(n)&&n>=1&&n<=Math.min(5,s?.level||1)}
function difficultyPicker(){
 if(!difficultyAllowed(selectedDifficulty))selectedDifficulty=1;
 return `<fieldset class="difficulty-picker"><legend>Dungeon difficulty · Level 1–5</legend><div>${[1,2,3,4,5].map(n=>`<button type="button" aria-pressed="${n===selectedDifficulty}" onclick="chooseDifficulty(${n})" ${difficultyAllowed(n)?'':'disabled'}>${n}${difficultyAllowed(n)?'':' · Locked'}</button>`).join('')}</div><small>Level up to access higher dungeons. Unlocked levels remain replayable.</small></fieldset>`;
}
function chooseDifficulty(n){if(!difficultyAllowed(n))return;selectedDifficulty=n;render()}
function clearDungeonEffects(){s.eventMods={};const c=calc();s.hp=Math.min(s.hp,c.hp);s.mana=Math.min(s.mana,c.mana)}
function assignDungeonEvents(run){
 const used=new Set();
 for(const r of run.rooms){
  if(r.type!=='event')continue;
  const category={lore:'Lore',skill:'Skill Challenge',puzzle:'Puzzle',sacrifice:'Sacrifice'}[r.eventType];
  const pool=SEPULCHER_EVENTS.filter(e=>e.category===category&&!used.has(e.id));
  const e=pool[rollInt(0,pool.length-1)];r.eventId=e.id;r.name=e.title;used.add(e.id);
 }
}
function beginDungeon(){
 if(!s?.awaitingDifficulty||s.travel||!s.loc||!difficultyAllowed(selectedDifficulty))return;
 s.dungeonLevel=selectedDifficulty;s.awaitingDifficulty=false;s.dungeon=null;save();render();
}
function expeditionStatus(){return `<strong>Difficulty ${dungeonLevel()} · ${s.dungeon?.complete?'Boss defeated':'Expedition in progress'}</strong><span>XP is permanent</span>`}

function dungeonView(){
 if(s.awaitingDifficulty)return `<section class="panel dungeon-arrival"><div class="eyebrow">You have arrived</div><h2>${esc(locations[s.loc].name)}</h2><p>Choose the level of your expedition.</p>${difficultyPicker()}<button class="primary" onclick="beginDungeon()">Enter dungeon</button><button onclick="returnHome(true)">Return to Greyhaven</button></section>`;
 return DUNGEON_TEMPLATE;
}
function activeDungeonRoom(){return s?.dungeon?.rooms.find(r=>r.id===s.dungeon.active)}
function startTileEncounter(r){
 if(!s||s.dead||s.enemy||s.eventPopup||r.cleared)return;
 s.dungeon.active=r.id;r.revealed=true;
 if(r.type==='combat'||r.type==='boss'){
   s.room=r.type==='boss'?5:s.dungeon.rooms.filter(x=>x.type==='combat'&&x.cleared).length;
   s.complete=false;spawn();if(r.type==='combat')r.name=s.enemy.name;
 }else if(r.type==='treasure'){
   log('Found a treasure chest.');
   const item=generateItem(false);s.items.unshift(item);s.items=s.items.slice(0,100);
   const gold=rollInt(2,5)*dungeonLevel();s.runGold+=gold;
   s.eventPopup={kind:'treasure',room:r.id,item,gold,resolved:true,result:`You found ${item.name} and ${gold} gold. The equipment has been added to your pack.`,heading:'Treasure recovered'};
 }else{
   const e=SEPULCHER_EVENTS.find(e=>e.id===r.eventId);
   s.eventPopup={kind:r.eventType,eventId:e.id,room:r.id,resolved:false};
   log('Discovered '+e.title+' ('+e.category.toLowerCase()+').');
   if(r.eventType==='sacrifice')s.eventPopup.choices=[e.a,e.b,e.c].filter(Boolean).map(effectPlan);
 }
 save();render();
}
function skillCheck(e){
 const i=STATS.indexOf(e.attribute),bonus=Math.max(0,(s.stats[i]||0)+(itemBonus()[e.attribute.toLowerCase()]||0)),dc=10+2*dungeonLevel();
 return {bonus,dc,chance:Math.max(0,Math.min(20,21-dc+bonus))*5};
}
function effectPlan(text){
 const c=calc(),p={text,ops:[]};let m;
 if((m=text.match(/(Lose|Restore) (\d+)% max (HP and MP|HP|MP)/i))){
   for(const resource of m[3].includes('and')?['hp','mana']:[m[3]==='HP'?'hp':'mana'])p.ops.push({key:resource,amount:Math.ceil(c[resource]*Number(m[2])/100)*(m[1]==='Lose'?-1:1)});
 }else if(text.includes('gold'))p.ops.push({key:'gold',amount:-rollInt(1,4)*dungeonLevel()});
 else if(text.includes('random stat')){const key=['intelligence','agility','vitality'][rollInt(0,2)];p.ops.push({key,amount:1,temporary:true})}
 else if(text.startsWith('+(')||text.startsWith('Reduce ')){
  const key=text.includes('Attack Damage')?'attack':text.includes('Armor')?'armor':text.includes('Resistance')?'resistance':text.includes('Mana Regeneration')?'manaRegen':'intelligence';
  const current=key==='attack'?c.min:key==='intelligence'?s.stats[0]+itemBonus().intelligence:c[key]||0;
  p.ops.push({key,amount:text.startsWith('Reduce')?-Math.min(dungeonLevel(),current):rollInt(1,4)+dungeonLevel(),temporary:true});
 }
 return p;
}
function planSummary(p){
 return p.ops.map(o=>`${o.amount>0?'+':''}${o.amount} ${{hp:'HP',mana:'mana',attack:'attack damage',manaRegen:'mana per combat turn'}[o.key]||o.key}${o.temporary?' until this expedition ends':''}`).join(' · ')||p.text;
}
function applyEventPlan(p){
 const details=[];
 for(const o of p.ops){
  if(o.temporary){s.eventMods[o.key]=(s.eventMods[o.key]||0)+o.amount;details.push(planSummary({ops:[o]}));}
  else if(o.key==='gold'){s.gold+=o.amount;details.push(`${o.amount} banked gold`)}
  else{const before=s[o.key];s[o.key]=Math.max(0,Math.min(calc()[o.key],before+o.amount));details.push(`${s[o.key]-before>0?'+':''}${s[o.key]-before} ${o.key==='hp'?'HP':'mana'}`)}
 }
 const c=calc();s.hp=Math.min(s.hp,c.hp);s.mana=Math.min(s.mana,c.mana);
 return details.join(' · ')||'You pass safely.';
}
function chooseEvent(index=0){
 const p=s?.eventPopup;if(!p||p.resolved||p.kind==='lore')return;
 const e=SEPULCHER_EVENTS.find(e=>e.id===p.eventId);let plan;
 if(p.kind==='skill'){
   const check=skillCheck(e),roll=rollInt(1,20),success=roll+check.bonus>=check.dc;
   p.heading=success?'Challenge overcome':'Challenge failed';
   p.roll=`Rolled ${roll} + ${check.bonus} ${e.attribute} = ${roll+check.bonus} against ${check.dc}.`;
   plan=effectPlan(success?e.success:e.failure);
 }else if(p.kind==='puzzle'){
   if(!Number.isInteger(index)||index<0||index>2||![e.a,e.b,e.c][index])return;
   const success=index+1===e.correct;p.heading=success?'The mechanism yields':'The answer was wrong';
   p.roll='You chose: '+[e.a,e.b,e.c][index];plan=effectPlan(success?e.success:e.failure);
 }else if(p.kind==='sacrifice'){
   plan=p.choices[index];if(!plan||plan.ops.some(o=>o.key==='gold'&&s.gold+o.amount<0))return;
   p.heading='The price is paid';
 }else return;
 p.resolved=true;p.result=plan.text;p.applied=applyEventPlan(plan);
 if(s.hp<=0){p.fatal=true;p.heading='The dungeon claims you';}
 log(e.title+': '+p.applied);save();render();
}
function acknowledgeEvent(){
 const p=s?.eventPopup;if(!p||(!p.resolved&&p.kind!=='lore'))return;
 const r=activeDungeonRoom();if(r)r.cleared=true;
 s.eventPopup=null;s.dungeon.active=null;
 if(p.fatal){
  const loss=forfeitExpeditionXP();const lostEquipment=loseWornEquipment();const gold=s.runGold;s.runGold=0;
  clearDungeonEffects();s.dungeon=null;s.loc=0;s.complete=false;s.enemy=null;s.buffs={};
  s.hp=calc().hp;s.mana=calc().mana;
  log(`You awaken in Greyhaven. Lost ${lostEquipment} worn equipment items and any pending Aether Relics; your XP and banked gold remain permanent.`);
 }
 save();render();
}
function eventPopupView(){
 const p=s.eventPopup,e=SEPULCHER_EVENTS.find(e=>e.id===p.eventId);
 const title=e?.title||'A sealed reliquary';
 let controls='';
 if(p.resolved||p.kind==='lore')controls=`<button class="primary" onclick="acknowledgeEvent()">${p.fatal?'Awaken in Greyhaven':'Continue'}</button>`;
 else if(p.kind==='skill'){
  const c=skillCheck(e);controls=`<div class="check-odds">${esc(e.attribute)} challenge<strong>${c.chance}% success chance</strong></div><button class="primary" onclick="chooseEvent()">Roll ${esc(e.attribute)} check</button>`;
 }else if(p.kind==='puzzle')controls=[e.a,e.b,e.c].map((t,i)=>t?`<button onclick="chooseEvent(${i})">${esc(t)}</button>`:'').join('');
 else controls=p.choices.map((plan,i)=>`<button onclick="chooseEvent(${i})" ${plan.ops.some(o=>o.key==='gold'&&s.gold+o.amount<0)?'disabled':''}>${esc(planSummary(plan))}${plan.ops.some(o=>o.key==='gold')?`<small>${s.gold} banked gold available</small>`:''}</button>`).join('');
 return `<dialog class="event-dialog" aria-labelledby="eventTitle" oncancel="event.preventDefault()"><div class="event-layout">${e?`<img class="event-art" src="assets/events/${e.art}" alt="${esc(title)}" width="512" height="512">`:'<img class="event-art treasure-art" src="assets/events/TreasureChest.png" alt="An ancient treasure chest in the Sepulcher" width="512" height="512">'}<section class="event-content"><div class="eyebrow">${esc(e?.category||'Treasure')} · Sepulcher level ${dungeonLevel()}</div><h2 id="eventTitle">${esc(title)}</h2><p class="event-story">${esc(e?.description||'A forgotten burial coffer opens at your touch.')}</p>${p.resolved?`<section class="event-result" role="status">${p.kind==='treasure'?`<div class="relic-treasure-award">${relicIconMarkup(true)}<b>+1 Aether Relic</b></div>`:''}<h3>${esc(p.heading)}</h3>${p.kind==='puzzle'&&p.roll?`<p>${esc(p.roll)}</p>`:''}<p>${esc(p.applied||p.result)}</p>${p.fatal?'<p>Your expedition ends here. Worn equipment, carried potions and pending Aether Relics will be lost. Your XP and banked gold remain.</p>':''}</section>`:''}${p.item?`<div class="event-loot"><strong>${esc(p.item.name)}</strong><p>${esc(itemDescription(p.item))}</p>${itemComparisonView(p.item)}</div>`:''}<div class="event-choices">${controls}</div>${p.kind==='sacrifice'&&!p.resolved?'<small class="tiny">Choose the price you accept. HP costs can be fatal.</small>':''}</section></div></dialog>`;
}
function mountEventPopup(){
 document.querySelectorAll('body > .event-dialog').forEach(d=>d.remove());
 if(!s?.eventPopup||landing)return;
 document.body.insertAdjacentHTML('beforeend',eventPopupView());
 const dialog=document.querySelector('body > .event-dialog');dialog.showModal();dialog.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
}
// Imported games retain the exact map, resolved outcomes and rolled sacrifice costs.
function restoreDungeonFields(raw,out,fail){
 const integer=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
 out.awaitingDifficulty=!!raw.awaitingDifficulty;
 out.dungeonLevel=raw.dungeonLevel??1;out.dungeonCleared=raw.dungeonCleared??(raw.clears>0?1:0);
 if(!integer(out.dungeonLevel,1,5)||!integer(out.dungeonCleared,0,5))fail();
 out.eventMods={};
 for(const [k,v] of Object.entries(raw.eventMods||{})){
  if(!['intelligence','strength','agility','luck','vitality','armor','resistance','attack','manaRegen'].includes(k)||!integer(v,-1000,1000))fail();out.eventMods[k]=v;
 }
 out.dungeon=null;out.eventPopup=null;
 if(raw.dungeon==null){if(raw.eventPopup!=null)fail();return}
 const d=raw.dungeon;if(!Array.isArray(d.rooms)||d.rooms.length<10||d.rooms.length>13||!Array.isArray(d.edges)||d.edges.length!==d.rooms.length-1)fail();
 const ids=new Set(),coords=new Set();
 const rooms=d.rooms.map(r=>{
  if(!r||typeof r.id!=='string'||r.id.length>40||ids.has(r.id)||!integer(r.c,0,7)||!integer(r.r,0,5)||coords.has(r.c+','+r.r)||!['entrance','boss','combat','event','treasure'].includes(r.type)||typeof r.revealed!=='boolean'||typeof r.cleared!=='boolean'||r.cleared&&!r.revealed)fail();
  ids.add(r.id);coords.add(r.c+','+r.r);
  const n={id:r.id,c:r.c,r:r.r,type:r.type,optional:!!r.optional,revealed:r.revealed,cleared:r.cleared,relicDrop:!!r.relicDrop,kind:{entrance:'door',boss:'boss',combat:'enemy',treasure:'chest'}[r.type],name:{entrance:'The Drowned Arch',boss:'Unknown Guardian Vault',combat:'Burial guardian',treasure:'Sealed Reliquary'}[r.type]};
  if(r.type==='event'){
   const e=SEPULCHER_EVENTS.find(e=>e.id===r.eventId);if(!e)fail();n.eventId=e.id;n.name=e.title;n.eventType={Lore:'lore','Skill Challenge':'skill',Puzzle:'puzzle',Sacrifice:'sacrifice'}[e.category];n.kind=n.eventType;
  }
  return n;
 });
 for(const [type,min,max] of [['entrance',1,1],['boss',1,1],['combat',5,6],['event',2,3],['treasure',1,2]])if(!integer(rooms.filter(r=>r.type===type).length,min,max))fail();
 const pairs=new Set();const edges=d.edges.map(e=>{
  if(!e||!ids.has(e.a)||!ids.has(e.b)||e.a===e.b)fail();const a=rooms.find(r=>r.id===e.a),b=rooms.find(r=>r.id===e.b),key=[e.a,e.b].sort().join('|');if(Math.abs(a.c-b.c)+Math.abs(a.r-b.r)!==1||pairs.has(key))fail();pairs.add(key);return {a:e.a,b:e.b,optional:!!e.optional};
 });
 const visited=new Set([rooms[0].id]);for(let i=0;i<rooms.length;i++)for(const e of edges)if(visited.has(e.a)||visited.has(e.b)){visited.add(e.a);visited.add(e.b)}if(visited.size!==rooms.length)fail();
 for(const r of rooms){const degree=edges.filter(e=>e.a===r.id||e.b===r.id).length;if(r.type==='treasure'&&(!r.optional||degree!==1)||degree===1&&r.type==='event'&&r.eventType!=='lore')fail()}
 if(!ids.has(d.selected)||d.active!=null&&!ids.has(d.active))fail();
 out.dungeon={rooms,edges,selected:d.selected,active:d.active||null,complete:!!d.complete};
 if(raw.eventPopup!=null){
  const p=raw.eventPopup,r=rooms.find(r=>r.id===d.active);if(!r||r.cleared||!r.revealed||p.room!==r.id||p.kind!==(r.type==='treasure'?'treasure':r.eventType)||r.type==='event'&&p.eventId!==r.eventId)fail();
  out.eventPopup={kind:p.kind,room:r.id,eventId:r.eventId,resolved:!!p.resolved,fatal:!!p.fatal};
  for(const k of ['result','applied','heading','roll'])if(p[k]!=null){if(typeof p[k]!=='string'||p[k].length>2000)fail();out.eventPopup[k]=p[k]}
  if(p.kind==='treasure'){if(!p.resolved||!integer(p.gold,0,25))fail();out.eventPopup.gold=p.gold;out.eventPopup.item=p.item?validateItem(p.item):null}
  if(p.kind==='sacrifice'){
   if(!Array.isArray(p.choices)||p.choices.length!==2)fail();out.eventPopup.choices=p.choices.map(plan=>{
    if(typeof plan.text!=='string'||plan.text.length>500||!Array.isArray(plan.ops)||plan.ops.length>2)fail();
    return {text:plan.text,ops:plan.ops.map(o=>{if(!['hp','mana','gold','attack','armor','resistance'].includes(o.key)||!integer(o.amount,-10000000,0))fail();return {key:o.key,amount:o.amount,temporary:!!o.temporary}})};
   });
  }
 }
}

const TREASURE_ART="<svg viewBox=\"0 0 512 512\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"An ancient treasure chest\"><defs><radialGradient id=\"chest-haze\"><stop stop-color=\"#52696b\"/><stop offset=\"1\" stop-color=\"#12232e\"/></radialGradient><linearGradient id=\"chest-wood\" x2=\"0.5\" y2=\"1\"><stop stop-color=\"#88603b\"/><stop offset=\"1\" stop-color=\"#3b3027\"/></linearGradient><linearGradient id=\"chest-gold\" x2=\"0.6\" y2=\"1\"><stop stop-color=\"#ffe19a\"/><stop offset=\"1\" stop-color=\"#9f7334\"/></linearGradient></defs><path fill=\"url(#chest-haze)\" d=\"M0 0h512v512H0z\"/><path d=\"M0 400h512M0 450h512M100 400v50m150 0v62m140-112v50\" stroke=\"#527079\" opacity=\".25\" stroke-width=\"3\"/><ellipse cx=\"256\" cy=\"395\" rx=\"188\" ry=\"35\" fill=\"#080e17\" opacity=\".7\"/><path d=\"m95 265 220-23 104 35-16 102-220 28-88-47z\" fill=\"#352b24\" stroke=\"#101b20\" stroke-width=\"7\"/><path d=\"m95 265 88 38 220-26v102l-220 28V303\" fill=\"url(#chest-wood)\" stroke=\"#b18d50\" stroke-width=\"4\"/><path d=\"M95 265v-39q3-88 99-88l123 25q82 4 102 114l-236 26Z\" fill=\"url(#chest-wood)\" stroke=\"#18252b\" stroke-width=\"7\"/><path d=\"M183 303v-42q0-89 85-105M112 211l218-22M101 240l255-20M212 340l168-20m-174 48 172-20\" fill=\"none\" stroke=\"#c09c65\" stroke-width=\"3\" opacity=\".55\"/><path d=\"m120 186 29 10q-17 25-18 59l-27-11zm80 109 27-4v110l-27 4zm155-112 27 19q21 30 29 72l-28 4q-6-58-28-95zm5 103 27-4v98l-27 4z\" fill=\"url(#chest-gold)\" stroke=\"#59482e\" stroke-width=\"3\"/><path d=\"m271 293 46-5v50l-46 5z\" fill=\"url(#chest-gold)\" stroke=\"#413a2c\" stroke-width=\"3\"/><circle cx=\"294\" cy=\"311\" r=\"7\" fill=\"#1a2429\"/><path d=\"M294 311v15\" stroke=\"#1a2429\" stroke-width=\"6\"/><g fill=\"#e9c578\"><circle cx=\"212\" cy=\"318\" r=\"4\"/><circle cx=\"212\" cy=\"384\" r=\"4\"/><circle cx=\"373\" cy=\"303\" r=\"4\"/><circle cx=\"373\" cy=\"363\" r=\"4\"/></g><path d=\"m247 118 4-19 5 19 17 5-17 4-5 18-4-18-18-4zm112 17 3-12 4 12 10 3-10 3-4 12-3-12-11-3z\" fill=\"#f2d27e\" opacity=\".8\"/></svg>";

function continueDungeonLevel(level){
 if(!s||s.dead||s.travel||s.enemy||s.eventPopup||dungeonEntering||!s.dungeon?.complete||!s.complete||!difficultyAllowed(level)||![dungeonLevel(),dungeonLevel()+1].includes(level))return;
 s.dungeonLevel=level;s.awaitingDifficulty=false;goAgain();
}

function dungeonContinuationView(){
 if(!s.dungeon?.complete)return '';
 return `${dungeonLevel()<5&&difficultyAllowed(dungeonLevel()+1)?`<button class="primary" onclick="continueDungeonLevel(${dungeonLevel()+1})">Descend to level ${dungeonLevel()+1}</button>`:''}<button onclick="continueDungeonLevel(${dungeonLevel()})">Run level ${dungeonLevel()} again</button>`;
}
