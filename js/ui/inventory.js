'use strict';
const SATCHEL_CATALOG={
 healthPotion:{name:'Lesser Health Potion',type:'Consumables',hp:30,mana:0,description:'Restores 30 health.',icon:'heal'},
 manaPotion:{name:'Lesser Mana Potion',type:'Consumables',hp:0,mana:20,description:'Restores 20 mana.',icon:'oil'},
 restorationDraught:{name:'Restoration Draught',type:'Consumables',hp:15,mana:15,description:'Restores 15 health and 15 mana.',icon:'mirror'},
 graveDust:{name:'Grave Dust',type:'Resources',description:'A pale residue collected from the burial chambers.',icon:'shades'},
 cryptglassShard:{name:'Cryptglass Shard',type:'Resources',description:'A fragment of cold, faintly luminous crystal.',icon:'fire'},
 ancientBone:{name:'Ancient Bone',type:'Resources',description:'A weathered remnant from the Sepulcher.',icon:'thorns'}
};
let satchelFilter='All',inventoryOpen=false;
function inventoryView(){return `<section id="eoa-inventory-game"><section id="inventoryEquipment" aria-label="Equipment Stash"><div class="inventory-panel-heading"><div><div class="eyebrow">Your equipment</div><h2 class="inventory-panel-title" id="equipmentStashTitle">Equipment Stash</h2></div><button type="button" class="inventory-close" onclick="closeEquipmentStash()">Close Inventory ×</button></div><div class="inventory-scroll"><section id="eoa-quartermaster-game"><section class="gear-stage quartermaster" aria-label="Equipment browser"></section></section></div></section></section>`;}
function openEquipmentStash(){
 if(!s||landing||s.eventPopup||dungeonEntering||shopModalOpen)return;
 inventoryOpen=true;
 // Inventory is an overlay; retain the current Main Street/expedition screen underneath.
 if(tab==='equipment')tab='journey';
 render();
 document.getElementById('equipmentStashDialog')?.querySelector('.inventory-close')?.focus();
}
function closeEquipmentStash(event){
 event?.preventDefault();
 inventoryOpen=false;
 const dialog=document.getElementById('equipmentStashDialog');
 if(dialog?.open)dialog.close();
 dialog?.remove();
 document.getElementById('gearFloatingLayer')?.remove();
 gearPositionCompare=()=>{};
 document.getElementById('mainInventoryEntry')?.focus();
}
function mountEquipmentStash(){
 const dialog=document.getElementById('equipmentStashDialog');
 if(!dialog||dialog.open)return;
 if(typeof dialog.showModal==='function')dialog.showModal();
 else dialog.setAttribute('open','');
}

function canUseSatchelItem(id){
 const item=SATCHEL_CATALOG[id];
 if(!s||!item||item.type!=='Consumables'||!(s.inventory?.[id]>0)||s.dead||s.travel||s.restUntil||s.eventPopup||dungeonEntering||s.enemy&&!s.rewardPopup)return false;
 const c=calc();return !!(item.hp&&s.hp<c.hp||item.mana&&s.mana<c.mana);
}
function useSatchelItem(id){
 if(!canUseSatchelItem(id))return;
 const item=SATCHEL_CATALOG[id],c=calc(),hp=Math.min(item.hp,c.hp-s.hp),mana=Math.min(item.mana,c.mana-s.mana);
 s.hp+=hp;s.mana+=mana;s.inventory[id]--;
 const gains=[hp?`${hp} health`:'',mana?`${mana} mana`:''].filter(Boolean).join(' and '),message=`Used ${item.name}. Restored ${gains}.`;
 log(message);save();render();const feedback=document.querySelector('.satchel-feedback');if(feedback)feedback.textContent=message;notify(message);
}
function paintSatchel(){
 const root=document.getElementById('eoa-inventory-game');if(!root)return;
 const entries=Object.entries(SATCHEL_CATALOG).filter(([id,item])=>(s.inventory?.[id]||0)>0&&(satchelFilter==='All'||item.type===satchelFilter));
 root.querySelectorAll('[data-satchel-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.satchelCategory===satchelFilter)));
 root.querySelector('#satchelList').innerHTML=entries.length?`<div class="satchel-labels"><span>Item & effect</span><span>Owned</span><span>Action</span></div>${entries.map(([id,item])=>`<article class="satchel-row"><div class="satchel-item"><div class="satchel-icon ${id}">${['healthPotion','manaPotion'].includes(id)?potionIconSvg(id):statusIcon(item.icon)}</div><div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><small>${item.type==='Resources'?'Resource':'Consumable'}</small></div></div><span class="satchel-quantity">${s.inventory[id]}</span>${item.type==='Resources'?'<small class="satchel-material">Material</small>':`<button type="button" data-use-satchel="${id}" ${canUseSatchelItem(id)?'':'disabled'} aria-label="Use ${esc(item.name)}">${canUseSatchelItem(id)?'Use':s.travel||s.eventPopup||s.enemy&&!s.rewardPopup?'Unavailable':'Not needed'}</button>`}</article>`).join('')}<p class="satchel-total">${entries.length} item types · ${entries.reduce((n,[id])=>n+s.inventory[id],0)} items</p>`:`<div class="satchel-empty">${satchelFilter==='All'?'Your satchel is empty.':`No ${satchelFilter.toLowerCase()} in your satchel.`}</div>`;
 root.querySelectorAll('[data-use-satchel]').forEach(b=>b.onclick=()=>useSatchelItem(b.dataset.useSatchel));
}
function mountInventory(){
 // Satchel UI was retired in v0.0.41. Potion data/use functions remain for other game systems.
}
