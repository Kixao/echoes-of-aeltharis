'use strict';
// Magical Mysteries, Greyhaven. Existing player potion inventory and permanent belt are authoritative.
const MYSTERIES_POTION_IDS=['healthPotion','manaPotion'];
const mysteriesQty={healthPotion:1,manaPotion:1};
let mysteriesPendingBelt=null;
function openMagicalMysteries(){if(!s||!city()||s.eventPopup)return false;return openShopModal('mysteries');}
function changeMysteriesQuantity(id,delta){
 if(!city()||!MYSTERIES_POTION_IDS.includes(id)||![-1,1].includes(delta))return false;
 mysteriesQty[id]=Math.min(10,Math.max(1,mysteriesQty[id]+delta));
 render();return true;
}
function mysteriesPotionPrice(id){return BAL.potions.types[id==='healthPotion'?'health':'mana'].gold_price;}
function buyMysteriesPotion(id){
 if(!city()||!MYSTERIES_POTION_IDS.includes(id))return false;
 const n=mysteriesQty[id],cost=n*mysteriesPotionPrice(id);
 if(!Number.isInteger(n)||n<1||n>10||s.gold<cost||!Number.isSafeInteger((s.inventory[id]||0)+n)||s.inventory[id]+n>9999)return false;
 s.gold-=cost;s.inventory[id]=(s.inventory[id]||0)+n;
 log('Purchased '+n+' '+(id==='healthPotion'?'Health':'Mana')+' Potion'+(n===1?'':'s')+' at Magical Mysteries for '+cost+' gold.');
 save();render();notify(n+' '+(id==='healthPotion'?'Health':'Mana')+' Potion'+(n===1?'':'s')+' purchased for '+cost+' gold.');return true;
}
function openMysteriesBeltConfirm(){
 if(!city()||s.beltLevel>=5||mysteriesPendingBelt!==null)return false;
 const next=BAL.potions.potion_belt.levels[s.beltLevel],cost=next.upgrade_gold_cost_from_previous;
 if(s.gold<cost)return false;
 mysteriesPendingBelt={from:s.beltLevel,cost};
 const modal=document.getElementById('mysteriesUpgradeOverlay');
 if(!modal){mysteriesPendingBelt=null;return false;}
 modal.hidden=false;
 const description=document.getElementById('mysteriesUpgradeDescription');
 description.textContent='Upgrade to '+next.slots+' permanent potion slots for '+cost+' gold? This capacity survives defeat.';
 modal.querySelector('[data-mysteries-cancel]')?.focus();return true;
}
function closeMysteriesBeltConfirm(){mysteriesPendingBelt=null;const el=document.getElementById('mysteriesUpgradeOverlay');if(el)el.hidden=true;}
function confirmMysteriesBeltUpgrade(){
 const pending=mysteriesPendingBelt;
 if(!pending||!city()||s.beltLevel!==pending.from||s.beltLevel>=5||s.gold<pending.cost||BAL.potions.potion_belt.levels[s.beltLevel].upgrade_gold_cost_from_previous!==pending.cost){closeMysteriesBeltConfirm();return false;}
 mysteriesPendingBelt=null;
 const cost=pending.cost;upgradeBelt();
 log('Upgraded potion belt to '+beltSlots()+' slots for '+cost+' gold.');
 save();notify('Potion belt upgraded to '+beltSlots()+' slots.');return true;
}
function mysteriesPotionCard(id){
 const health=id==='healthPotion',name=health?'Health':'Mana',qty=mysteriesQty[id],price=mysteriesPotionPrice(id),stored=s.inventory[id]||0;
 return `<article class="mysteries-potion-card">${potionIconSvg(id)}<div class="mysteries-potion-data"><h4>${name} Potion</h4><p>Restores 30% of maximum ${health?'health':'mana'}.</p><div class="mysteries-pills"><span>◈ ${price} gold</span><span>${stored} stored</span><span>30% restoration</span></div><div class="mysteries-buy-row"><div class="mysteries-quantity" role="group" aria-label="${name} potion quantity"><button type="button" onclick="changeMysteriesQuantity('${id}',-1)" ${qty<=1?'disabled':''} aria-label="Decrease ${name} potion quantity">−</button><strong>${qty}</strong><button type="button" onclick="changeMysteriesQuantity('${id}',1)" ${qty>=10?'disabled':''} aria-label="Increase ${name} potion quantity">+</button></div><button type="button" class="primary mysteries-buy" onclick="buyMysteriesPotion('${id}')" ${s.gold<price*qty||stored+qty>9999?'disabled':''}>${s.gold<price*qty?'Not enough gold':'Buy '+qty+' · '+price*qty+' gold'}</button></div></div></article>`;
}
function magicalMysteriesView(){
 const belt=BAL.potions.potion_belt.levels,level=s.beltLevel,slots=beltSlots(),next=belt[level];
 return `<section class="eoa-mysteries-page" aria-label="Magical Mysteries"><div class="eoa-workshop-frame eoa-mysteries-frame"><div class="mysteries-hero"><div class="mysteries-hero-copy"><div class="eyebrow">Greyhaven · The Arcane Quarter</div><h2>Magical Mysteries</h2><p>Arcane supplies, restorative draughts, and a sturdier belt for the road ahead.</p></div></div><div class="mysteries-content"><div class="mysteries-toolbar"><button type="button" class="smith-return-button" onclick="setTab('journey')">← Return to Main Street</button><span class="smith-player-gold">◈ ${s.gold} gold</span></div><div class="mysteries-intro"><div><div class="eyebrow">The emporium counter</div><h2>Potions & preparations</h2></div><small>Town supplies remain in storage until you pack for an expedition.</small></div><div class="mysteries-columns"><section class="mysteries-panel" aria-label="Buy potions"><header><h3>Purchase potions</h3><small>12 gold each</small></header><div class="mysteries-potions">${MYSTERIES_POTION_IDS.map(mysteriesPotionCard).join('')}</div><p class="mysteries-note">One potion can be used between encounters, or as a support action during combat.</p></section><section class="mysteries-panel" aria-label="Potion belt upgrades"><header><h3>Potion belt upgrades</h3><small>Permanent</small></header><div class="mysteries-belt-heading"><span class="eyebrow">Current capacity</span><strong>${slots} / 6 slots</strong></div><div class="mysteries-belt-slots">${Array.from({length:6},(_,i)=>`<span class="${i<slots?'':'locked'}" title="Slot ${i+1} ${i<slots?'unlocked':'locked'}">${i<slots?'✦':'+'}</span>`).join('')}</div><div class="mysteries-belt-track">${belt.map((step,i)=>`<div class="mysteries-belt-step ${i<level-1?'done':i===level-1?'current':''}"><strong>${step.slots}</strong><span>slots</span><small>${i===level-1?'Current':i<level-1?'✓ Owned':step.upgrade_gold_cost_from_previous+'g'}</small></div>`).join('')}</div><div class="mysteries-next">${next?`<strong>Next upgrade · ${next.slots} slots</strong><p>Increase carried capacity from ${slots} to ${next.slots} potion slots. The upgrade remains after defeat.</p><button type="button" class="primary" onclick="openMysteriesBeltConfirm()" ${s.gold<next.upgrade_gold_cost_from_previous?'disabled':''}>${s.gold<next.upgrade_gold_cost_from_previous?'Not enough gold · '+next.upgrade_gold_cost_from_previous:'Upgrade belt · '+next.upgrade_gold_cost_from_previous+' gold'}</button>`:'<strong>Fully upgraded</strong><p>Your belt has reached its permanent maximum of six potion slots.</p><button type="button" class="primary" disabled>Maximum capacity reached</button>'}</div><p class="mysteries-note">Belt capacity controls how many potions you can pack before departure. Buying potions never automatically equips them.</p></section></div></div></div><div class="mysteries-upgrade-overlay" id="mysteriesUpgradeOverlay" hidden><div class="mysteries-upgrade-dialog" role="dialog" aria-modal="true" aria-labelledby="mysteriesUpgradeTitle"><div class="eyebrow">Permanent upgrade</div><h3 id="mysteriesUpgradeTitle">Expand your potion belt?</h3><p id="mysteriesUpgradeDescription"></p><div class="mysteries-confirm-actions"><button type="button" data-mysteries-cancel onclick="closeMysteriesBeltConfirm()">Go back</button><button type="button" class="primary" onclick="confirmMysteriesBeltUpgrade()">Confirm upgrade</button></div></div></div></section>`;
}
