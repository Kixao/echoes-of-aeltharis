'use strict';

// Capacity is data-driven so later upgrades can unlock more slots without a new bar.
const QUICK_SLOT_BASE = 4, QUICK_SLOT_MAX = 12;
let quickslotTarget = null, quickslotDrag = null, quickslotIgnoreClickUntil = 0;
function quickslotEntry(ref) {
  if (!s || !ref || !['skills','items'].includes(ref.kind)) return null;
  const item=ref.kind==='items',defs=item?shopItems():abilityDefs(),a=Object.hasOwn(defs,ref.id)?defs[ref.id]:null;
  if (!a || (item ? a.class===s.class : a.class!==s.class) || (!item&&!knowsAbility(ref.id))) return null;
  return {id:ref.id, name:a.name, desc:a.desc, item, support:ref.id==='potion'||isSupport(ref.id), icon:ref.id,
    cost:item?'×'+(s.inventory?.[ref.id]||0):a.cost+' mana'};
}
function normalizeQuickslots(raw, hero=s) {
  const count=Number.isInteger(raw?.quickslotCount)&&raw.quickslotCount>=QUICK_SLOT_BASE&&raw.quickslotCount<=QUICK_SLOT_MAX?raw.quickslotCount:QUICK_SLOT_BASE;
  return {quickslotCount:count,quickslots:Array.from({length:count},(_,i)=>{
    const ref=raw?.quickslots?.[i];
    if(!ref||!['skills','items'].includes(ref.kind))return null;
    const item=ref.kind==='items',defs=item?shopItems():abilityDefs(),a=Object.hasOwn(defs,ref.id)?defs[ref.id]:null;
    return a&&(item?a.class!==hero.class:a.class===hero.class)?{kind:ref.kind,id:ref.id}:null;
  })};
}
function ensureQuickslots() {if(s)Object.assign(s,normalizeQuickslots(s));}
function quickslotsView(editing=false) {
  ensureQuickslots();
  return `<section class="quickslots ${editing?'editing':''}" data-quickslot-bar="${editing?'menu':'combat'}" aria-label="Quickslots"><div class="quickslots-heading"><span>Quickslots</span>${editing?'<small>Select a slot, then an action · or drag an icon</small>':'<small>Favorite skills & items</small>'}</div><div class="quickslot-grid" role="group" aria-label="Favorite actions">${s.quickslots.map((ref,i)=>{
    const entry=quickslotEntry(ref),detail=entry?combatMenuDetail(entry):'Empty slot · Open Skills to assign a favorite';
    return `<div class="quickslot-wrap ${editing&&quickslotTarget===i?'assigning':''}" data-quickslot-drop="${i}"><button type="button" class="quickslot ${entry?.support?'support':''}" data-quickslot="${i}" data-editing="${editing}" ${entry?'draggable="true"':''} ${editing?`aria-pressed="${quickslotTarget===i}"`:''} aria-label="Quickslot ${i+1}: ${esc(detail)}" data-math="${esc(detail)}" onclick="clickQuickslot(${i},${editing})" ${!editing&&entry&&!combatMenuCanUse(entry)?'disabled':''}><span class="quickslot-number">${i+1}</span>${entry?`<span class="combat-menu-glyph">${combatMenuIcon(entry.item&&!['potion','healthPotion','manaPotion'].includes(entry.id)?'scroll':entry.icon)}${entry.item&&!['potion','healthPotion','manaPotion'].includes(entry.id)?`<span class="combat-menu-scroll-glyph">${combatMenuIcon(entry.icon)}</span>`:''}</span><small class="quickslot-cost">${esc(entry.cost)}</small>`:'<span class="quickslot-plus">+</span>'}</button>${editing&&entry?`<button type="button" class="quickslot-remove" aria-label="Clear quickslot ${i+1}" onclick="clearQuickslot(${i})">×</button>`:''}</div>`;
  }).join('')}</div><span class="quickslot-feedback" role="status">${editing&&quickslotTarget!==null?'Choose an action for slot '+(quickslotTarget+1):''}</span></section>`;
}
function refreshQuickslots() {
  document.querySelectorAll('[data-quickslot-bar]').forEach(el=>{el.outerHTML=quickslotsView(el.dataset.quickslotBar==='menu');});
}
function assignQuickslot(index,ref,from=null) {
  ensureQuickslots();
  if(!Number.isInteger(index)||index<0||index>=s.quickslotCount||!quickslotEntry(ref))return false;
  const old=s.quickslots[index];
  s.quickslots[index]={kind:ref.kind,id:ref.id};
  if(Number.isInteger(from)&&from>=0&&from<s.quickslotCount&&from!==index)s.quickslots[from]=old;
  quickslotTarget=null;save();refreshQuickslots();return true;
}
function clearQuickslot(index) {
  ensureQuickslots();if(index<0||index>=s.quickslotCount)return;
  s.quickslots[index]=null;quickslotTarget=null;save();refreshQuickslots();
}
function clickQuickslot(index,editing=false) {
  if(Date.now()<quickslotIgnoreClickUntil)return;
  ensureQuickslots();
  if(editing){quickslotTarget=quickslotTarget===index?null:index;refreshQuickslots();document.querySelector(`[data-quickslot-bar="menu"] [data-quickslot="${index}"]`)?.focus();return;}
  const entry=quickslotEntry(s.quickslots[index]);
  if(!entry){openCombatMenu('skills');quickslotTarget=index;refreshQuickslots();return;}
  executeCombatMenuEntry(entry);
}
function updateQuickslotControls() {
  if(!s)return;
  document.querySelectorAll('[data-quickslot]').forEach(button=>{
    const entry=quickslotEntry(s.quickslots?.[+button.dataset.quickslot]);
    if(button.dataset.editing!=='true')button.disabled=!!entry&&!combatMenuCanUse(entry);
    const cost=button.querySelector('.quickslot-cost');if(cost&&entry)cost.textContent=entry.cost;
  });
}
function quickslotDragRef(element) {
  const source=element?.closest?.('[data-menu-entry], [data-quickslot]');
  if(!source)return null;
  if(source.dataset.menuEntry)return {kind:combatMenuState.kind,id:source.dataset.menuEntry,from:null};
  const from=+source.dataset.quickslot,ref=s?.quickslots?.[from];return ref?{...ref,from}:null;
}
function finishQuickslotDrag() {
  quickslotDrag=null;document.querySelectorAll('.quickslot-drop-hover').forEach(e=>e.classList.remove('quickslot-drop-hover'));
  document.querySelector('.quickslot-drag-ghost')?.remove();
}
function quickslotDrop(event) {
  const target=event.target.closest?.('[data-quickslot-drop]');
  if(!target||!quickslotDrag)return;
  event.preventDefault();const drag=quickslotDrag;finishQuickslotDrag();
  assignQuickslot(+target.dataset.quickslotDrop,drag,drag.from);quickslotIgnoreClickUntil=Date.now()+450;
}
function installQuickslotEvents() {
  document.addEventListener('dragstart',event=>{
    if(quickslotDrag){event.preventDefault();return;}
    const ref=quickslotDragRef(event.target);if(!ref)return;
    quickslotDrag=ref;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',ref.kind+':'+ref.id);hideMath();
  });
  document.addEventListener('dragover',event=>{
    if(!quickslotDrag)return;const slot=event.target.closest?.('[data-quickslot-drop]');
    document.querySelectorAll('.quickslot-drop-hover').forEach(e=>e.classList.remove('quickslot-drop-hover'));
    if(slot){event.preventDefault();event.dataTransfer.dropEffect='move';slot.classList.add('quickslot-drop-hover');}
  });
  document.addEventListener('drop',quickslotDrop);
  document.addEventListener('dragend',()=>{quickslotIgnoreClickUntil=Date.now()+450;finishQuickslotDrag();});
  // Touch users may tap slot → action, or hold an icon and drag it.
  let touch=null,hold=null;
  function beginPointerDrag(){
    if(!touch)return;quickslotDrag=touch.ref;hideMath();
    const ghost=document.createElement('div');ghost.className='quickslot-drag-ghost';ghost.innerHTML=touch.element.querySelector('.combat-menu-glyph')?.outerHTML||'✦';document.body.appendChild(ghost);
    ghost.style.left=touch.x+'px';ghost.style.top=touch.y+'px';
  }
  document.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const ref=quickslotDragRef(event.target);if(!ref)return;
    touch={id:event.pointerId,mouse:event.pointerType==='mouse',x:event.clientX,y:event.clientY,ref,element:event.target.closest('[data-menu-entry], [data-quickslot]')};
    if(!touch.mouse)hold=setTimeout(beginPointerDrag,280);
  });
  document.addEventListener('pointermove',event=>{
    if(!touch||event.pointerId!==touch.id)return;
    if(!quickslotDrag){if(Math.hypot(event.clientX-touch.x,event.clientY-touch.y)>7){if(touch.mouse)beginPointerDrag();else {clearTimeout(hold);touch=null;}}if(!quickslotDrag)return;}
    event.preventDefault();const ghost=document.querySelector('.quickslot-drag-ghost');if(ghost){ghost.style.left=event.clientX+'px';ghost.style.top=event.clientY+'px';}
    document.querySelectorAll('.quickslot-drop-hover').forEach(e=>e.classList.remove('quickslot-drop-hover'));
    document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-quickslot-drop]')?.classList.add('quickslot-drop-hover');
  },{passive:false});
  document.addEventListener('pointerup',event=>{
    if(!touch||event.pointerId!==touch.id)return;clearTimeout(hold);
    if(quickslotDrag){const slot=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-quickslot-drop]'),ref=quickslotDrag;finishQuickslotDrag();if(slot)assignQuickslot(+slot.dataset.quickslotDrop,ref,ref.from);quickslotIgnoreClickUntil=Date.now()+450;event.preventDefault();}
    touch=null;
  });
  document.addEventListener('pointercancel',()=>{clearTimeout(hold);touch=null;finishQuickslotDrag();});
}
