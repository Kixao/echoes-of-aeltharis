'use strict';

const EQUIPMENT_SLOTS=['weapon','offhand','armor','boots','necklace','ring1'];
const SLOT_LABELS={weapon:'Weapon',armor:'Armor',boots:'Feet',necklace:'Neck',ring1:'Ring',offhand:'Off-hand'};
function validateItem(x){
  if(x?.slot==='ring2')x={...x,slot:'ring1'};
  if(!x||typeof x!=='object'||typeof x.id!=='string'||x.id.length>40||typeof x.name!=='string'||x.name.length>80||!EQUIPMENT_SLOTS.includes(x.slot)||!['basic','common','uncommon','rare','epic'].includes(x.rarity)||x.slot==='weapon'&&!['staff','sword','bow'].includes(x.kind))throw new Error('Invalid item');
  const item={id:x.id,name:x.name,slot:x.slot,kind:x.kind||'',rarity:x.rarity,tier:x.tier===1||x.id.startsWith('t1')?1:null,secondary:null};
  for(const k of ['crit_bonus','damageMin','damageMax','armor','resistance','hp','mana','travel','intelligence','strength','agility','luck','vitality']){const v=x[k]||0;if(!Number.isFinite(v)||v<0||v>1000)throw new Error('Invalid item stat');item[k]=v}
  if(x.secondary){if(!['intelligence','strength','agility','luck','vitality'].includes(x.secondary.stat)||!Number.isInteger(x.secondary.value)||x.secondary.value<1||x.secondary.value>2)throw new Error('Invalid item bonus');item.secondary={stat:x.secondary.stat,value:x.secondary.value}}
  for(const key of ['iconKey','iconSrc'])if(typeof x[key]==='string'&&x[key].length<200000)item[key]=x[key];
  return item;
}
const ITEM_NAMES={offhand:['Mourner’s Grimoire','Burial Ward','Cryptkeeper’s Codex','Book of Quiet Rites'],weapon:['Sepulchral Staff','Cryptglass Staff','Grave-Marked Rod','Aelthari Reliquary Wand','Duskward Staff'],armor:['Tombguard Mantle','Sepulchral Robes','Crypt Warden Vestment','Grave-Sewn Coat'],boots:['Mourner’s Sandals','Boots of the Forsaken Sepulcher','Gravewalker Slippers'],necklace:['Pendant of the Last Rite','Cryptglass Amulet','Aelthari Burial Charm'],ring:['Ring of Quiet Names','Sepulchral Band','Mourner’s Signet','Ring of the Pale Watch']};
function itemBonus(){
  const b={crit_bonus:0,hp:0,mana:0,armor:0,resistance:0,damageMin:0,damageMax:0,travel:0,intelligence:0,strength:0,agility:0,luck:0,vitality:0};
  if(!s)return b;
  for(const item of Object.values(s.equipment||{}))if(item){for(const k of Object.keys(b))b[k]+=item[k]||0;if(item.secondary&&item.secondary.stat)b[item.secondary.stat.toLowerCase()]+=item.secondary.value||0}
  for(const k of Object.keys(b))b[k]+=s.eventMods?.[k]||0;
  return b;
}
function itemNamesFor(slot){return ITEM_NAMES[slot==='ring1'?'ring':slot]||ITEM_NAMES.armor}
function generateItem(boss=false){
  const slot=boss?EQUIPMENT_SLOTS[Math.floor(Math.random()*EQUIPMENT_SLOTS.length)]:['weapon','offhand','armor','boots','necklace','ring1'][Math.floor(Math.random()*6)];
  const uncommon=boss&&Math.random()<Math.min(.7,.2+(s.stats[3]+itemBonus().luck)*.02);
  const piece={weapon:'Staff',armor:'Armor',boots:'Feet',necklace:'Neck',ring1:'Ring',offhand:'Off-hand'}[slot];
  const name=itemNamesFor(slot)[Math.floor(Math.random()*itemNamesFor(slot).length)];
  const item={id:'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),name,slot,kind:slot==='weapon'?['staff','sword','bow'][Math.floor(Math.random()*3)]:'',rarity:uncommon?'rare':'uncommon',damageMin:0,damageMax:0,armor:0,resistance:0,hp:0,mana:0,travel:0,intelligence:0,strength:0,agility:0,luck:0,vitality:0,secondary:null};
  if(slot==='weapon'){item.name=name.replace('Staff',item.kind==='sword'?'Sword':item.kind==='bow'?'Bow':'Staff');item.damageMin=2;item.damageMax=4}
  if(slot==='armor'){item.armor=2;item.hp=8}
  if(slot==='boots'){item.armor=1;item.travel=1}
  if(slot==='offhand'){item.mana=8;item.resistance=1;}
  if(slot==='necklace')item.resistance=2;
  if(slot==='ring1'){const mod=['armor','resistance','hp','mana'][Math.floor(Math.random()*4)];item[mod]=mod==='hp'||mod==='mana'?10:1}
  if(uncommon)item.secondary={stat:'intelligence',value:1};
  return item;
}
function itemDescription(item){let p=[];if(item.damageMin||item.damageMax)p.push(`Weapon damage: ${item.damageMin}–${item.damageMax}`);if(item.armor)p.push(`+${item.armor} armor`);if(item.resistance)p.push(`+${item.resistance} resistance`);if(item.hp)p.push(`+${item.hp} health`);if(item.mana)p.push(`+${item.mana} mana`);if(item.travel)p.push(`−${item.travel}s travel time`);for(const stat of ['intelligence','strength','agility','luck','vitality'])if(item[stat])p.push(`+${item[stat]} ${stat}`);if(item.secondary)p.push(`+${item.secondary.value} ${item.secondary.stat}`);return p.join(' · ')}
function comparisonSlot(item){return item.slot==='ring2'?'ring1':item.slot}
function comparisonStats(item){const out={crit_bonus:item?.crit_bonus||0,damageMin:item?.damageMin||0,damageMax:item?.damageMax||0,armor:item?.armor||0,resistance:item?.resistance||0,hp:item?.hp||0,mana:item?.mana||0,travel:item?.travel||0,intelligence:item?.intelligence||0,strength:item?.strength||0,agility:item?.agility||0,luck:item?.luck||0,vitality:item?.vitality||0};if(item?.secondary)out[item.secondary.stat]+=item.secondary.value;return out}
function itemDetailTags(item){
  if(!item)return '';
  const rarity=['common','uncommon','rare','epic'].includes(item.rarity)?item.rarity:'common';
  const rarityName=rarity[0].toUpperCase()+rarity.slice(1);
  return `<div class="gear-detail-tags"><span class="gear-rarity-tag ${rarity}">${rarityName}</span>${item.tier===1?'<span class="gear-tier-tag">Tier 1</span>':''}</div>`;
}
function itemComparisonView(item,id=''){
  const slot=comparisonSlot(item),worn=s.equipment?.[slot]||null,next=comparisonStats(item),current=comparisonStats(worn),stats=[['damageMin','damageMax','Weapon damage'],['armor',null,'Armor'],['resistance',null,'Resistance'],['hp',null,'Health'],['mana',null,'Mana'],['travel',null,'Travel time'],['intelligence',null,'Intelligence'],['strength',null,'Strength'],['agility',null,'Agility'],['crit_bonus',null,'Critical chance'],['vitality',null,'Vitality']];
  const delta=[];
  for(const [a,b,label] of stats){
    if(a==='damageMin'){
      const lo=next.damageMin-current.damageMin,hi=next.damageMax-current.damageMax;if(!lo&&!hi)continue;
      const signed=n=>n>0?'+'+n:String(n),range=lo&&hi?`${signed(lo)}–${signed(hi)}`:signed(lo||hi);
      delta.push(`<span class="${lo<0||hi<0?'down':''}">${label} ${range}</span>`);continue;
    }
    const change=next[a]-current[a];if(!change)continue;let text;if(a==='travel')text=`${change<0?'−':'+'}${Math.abs(change)}s ${label.toLowerCase()}`;else text=`${change>0?'+':''}${change} ${label.toLowerCase()}`;delta.push(`<span class="${change<0?'down':''}">${esc(text)}</span>`)
  }
  return `<div class="gear-compare" ${id?`id="${esc(id)}"`:''} role="tooltip" aria-label="Equipment comparison"><div class="gear-compare-heading"><span>Equipment comparison</span><small>Replaces ${SLOT_LABELS[slot]}</small></div><div class="gear-compare-pair"><div class="gear-compare-side"><small>New find</small><strong class="${item.rarity}">${esc(item.name)}</strong>${itemDetailTags(item)}<p>${esc(itemDescription(item)||'No item stats')}</p></div><div class="gear-compare-side"><small>Currently worn</small><strong class="${worn?.rarity||''}">${worn?esc(worn.name):'Empty slot'}</strong>${itemDetailTags(worn)}<p>${worn?esc(itemDescription(worn)||'No item stats'):'Nothing equipped'}</p></div></div><div class="gear-compare-deltas">${delta.join('')||'<span class="same">No stat change</span>'}</div>${item.slot==='weapon'&&item.kind!=='staff'?'<p class="gear-compare-unusable">The Mage cannot equip this weapon.</p>':''}</div>`;
}
function gearChangeAllowed(){return !!(s&&city()&&!dungeonEntering&&!s.eventPopup&&!s.enemy)}
function loseWornEquipment(){
 const lost=Object.values(s.equipment||{}).filter(Boolean).length;
 s.equipment=Object.fromEntries(EQUIPMENT_SLOTS.map(slot=>[slot,null]));
 return lost;
}
function itemCanBeEquipped(item){return gearChangeAllowed()&&!(item.slot==='weapon'&&item.kind!=='staff')}
function isItemEquipped(id){return Object.values(s?.equipment||{}).some(item=>item?.id===id)}
function grantDungeonLoot(boss){
  if(!boss)return null;
  const chance=boss?Math.min(.7,.2+(s.stats[3]+itemBonus().luck)*.02):Math.min(.8,.25+(s.stats[3]+itemBonus().luck)*.025);
  if(Math.random()>=chance)return null;
  const item=generateItem(boss);
  if(boss){item.rarity='rare';item.secondary={stat:'intelligence',value:1}}
  s.items=s.items||[];s.items.unshift(item);s.items=s.items.slice(0,100);return item;
}
function equipItem(id){
  if(!gearChangeAllowed())return;const item=s.items.find(x=>x.id===id);if(!item)return;
  if(item.slot==='weapon'&&item.kind!=='staff'){notify('The Mage cannot use '+item.kind+'s. Keep it for a future character.');return;}
  const before=calc();
  const slot=comparisonSlot(item);
  const replaced=s.equipment[slot];s.items=s.items.filter(x=>x.id!==id);if(replaced)s.items.unshift(replaced);s.equipment[slot]=item;
  const after=calc();s.hp=Math.min(after.hp,s.hp+Math.max(0,after.hp-before.hp));s.mana=Math.min(after.mana,s.mana+Math.max(0,after.mana-before.mana));save();render();notify(item.name+' equipped.');
}
function sellItem(id){if(!s||!city())return;const i=s.items.findIndex(x=>x.id===id);if(i<0)return;const [item]=s.items.splice(i,1);const value=item.rarity==='uncommon'?8:4;s.gold+=value;save();render();notify(item.name+' sold for '+value+' gold.');}
function unequipItem(slot){if(!gearChangeAllowed()||!s.equipment?.[slot])return;s.items.push(s.equipment[slot]);s.equipment[slot]=null;const c=calc();s.hp=Math.min(s.hp,c.hp);s.mana=Math.min(s.mana,c.mana);save();render()}
function equipmentView(){return inventoryView()}
// Older saves keep their second ring in the pack; it never becomes an off-hand.
function migrateEquipment(raw,out){
 if(raw.equipment?.ring2){const ring=validateItem(raw.equipment.ring2);if(!out.items.some(i=>i.id===ring.id)&&!Object.entries(out.equipment).some(([slot,i])=>slot!=='ring2'&&i?.id===ring.id))out.items.push(ring)}
 delete out.equipment.ring2;
 for(const slot of EQUIPMENT_SLOTS)if(!out.equipment[slot])out.equipment[slot]=null;
 out.items=out.items.map(i=>i.slot==='ring2'?{...i,slot:'ring1'}:i);
}
