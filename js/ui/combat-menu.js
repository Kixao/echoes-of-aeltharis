'use strict';

// Combat menus are UI state only. Existing ability/item functions own all effects and costs.
const combatMenuState = {
  open: false, kind: 'skills', filter: 'all', selected: null,
  view: window.matchMedia?.('(max-width:600px), (pointer:coarse)').matches ? 'list' : 'grid'
};

function combatMenuIcon(id) {
  if(id==='healthPotion'||id==='manaPotion')return potionIconSvg(id);
  // Original user-supplied spell art; SVG stays external to avoid duplicate gradient IDs.
  const spellAssets={magicMissile:'magic-missiles',earthSpike:'earth-spike',mirror:'mirror-images'};
  if(spellAssets[id])return `<img class="spell-ability-icon" src="assets/icons/spells/${spellAssets[id]}.svg" alt="" aria-hidden="true" draggable="false">`;
  const paths = {
    backpack:'<path d="M8 5V4a4 4 0 0 1 8 0v1M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><path d="M8 6v5h8V6M8 16h8v6M4 13H2v6h2m16-6h2v6h-2"/>',
    book:'<path d="M12 6C9 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v15"/>',
    magicMissile:'<path d="M3 6 16 3l-6 5 10 1-8 4 5 8-9-5-5 3 3-7-3-6Zm1 0 2 3m4-1-2 4m5 0-2 4"/>',
    earthSpike:'<path d="m2 21 4-7 2 4 6-16 3 14 3-4 2 9H2Zm12-19-2 19m-8 0 4-3m9 3-3-5"/>',
    thunder:'<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',
    mirror:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3"/>',
    shout:'<path d="m3 10 13-6v16L3 14v-4Zm13-2h3v8h-3M6 15l1 6h4l-2-5m12-8 2-2m-2 10 2 2"/>',
    wind:'<path d="M12 21 3 12C-3 5 7-1 12 6c5-7 15-1 9 6l-9 9Z"/><path d="M12 8v8m-4-4h8"/>',
    mark:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v5m0 12v5M1 12h5m12 0h5"/>',
    potion:'<path d="M9 2h6m-5 0v7L5 17a3 3 0 0 0 3 5h8a3 3 0 0 0 3-5l-5-8V2M7 15h10"/>',
    scroll:'<path d="M6 3h12a3 3 0 0 1 3 3v2h-5V6a3 3 0 0 1 5 0M6 3v15a3 3 0 1 1-3-3h12v3a3 3 0 0 1-3 3H6M9 8h4m-4 4h4"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list:'<path d="M8 5h13M8 12h13M8 19h13M3 5h.1M3 12h.1M3 19h.1"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id] || paths.scroll}</svg>`;
}

function combatMenuActive() {
  return !!(s && !s.dead && tab === 'journey' && s.loc > 0 && !s.travel && !s.complete && !s.rewardPopup && s.enemy?.hp > 0);
}

function combatMenuEntries(kind = combatMenuState.kind) {
  if (!s) return [];
  if (kind === 'skills') return Object.entries(abilityDefs()).filter(([,a]) => a.class === s.class).map(([id,a]) => ({id, name:a.name, desc:a.desc, support:isSupport(id), cost:a.cost+' mana', icon:id, item:false}));
  return Object.entries(shopItems()).filter(([id,a]) => (s.inventory?.[id] || 0) > 0 && a.class !== s.class).map(([id,a]) => ({id, name:a.name, desc:a.desc, support:id==='potion'||isSupport(id), cost:'×'+s.inventory[id], icon:id==='potion'?'potion':id, item:true, group:id==='potion'?'potions':'scrolls'}));
}

function combatMenuCanUse(entry) {
  return !!entry && combatMenuActive() && (entry.item ? canUseItem(entry.id) : canAbility(entry.id));
}

function combatMenuDetail(entry) {
  return entry.name+' · '+entry.cost+' · '+entry.desc+' · '+(entry.support?'Support · No retaliation · 1s recovery':'Attack · Ends your turn');
}

function combatActionBarView() {
  return `${quickslotsView()}<div class="combat-command-bar"><button id="openBackpack" aria-haspopup="dialog" aria-expanded="${combatMenuState.open&&combatMenuState.kind==='items'}" onclick="openCombatMenu('items')">${combatMenuIcon('backpack')}<span>Backpack</span></button><button id="attack" class="primary" onclick="clickAttack()">${classes[s.class].icon} ${classes[s.class].basicAttack||'Attack'}</button><button id="openSkills" aria-haspopup="dialog" aria-expanded="${combatMenuState.open&&combatMenuState.kind==='skills'}" onclick="openCombatMenu('skills')">${combatMenuIcon('book')}<span>Skills</span></button><button class="combat-flee" onclick="returnHome(true)" data-math="Flee to Greyhaven. Lose pending Aether Relics and return unused carried potions; XP and banked gold remain."><span aria-hidden="true">↪</span> Flee</button></div>`;
}

function combatMenuView() {
  if (!combatMenuState.open) return '';
  if (!combatMenuActive()) { combatMenuState.open=false; return ''; }
  const state=combatMenuState, entries=combatMenuEntries(), labels=state.kind==='skills'?[['all','All skills'],['attack','Attack'],['support','Support']]:[['all','All items'],['potions','Potions'],['scrolls','Scrolls']];
  const matches=entry=>state.filter==='all'||state.filter==='attack'&&!entry.support||state.filter==='support'&&entry.support||state.filter===entry.group;
  const visible=entries.filter(matches);
  const selected=entries.find(entry=>entry.id===state.selected), isList=state.view==='list';
  return `<div class="combat-menu-layer"><div class="combat-menu-shade" onclick="closeCombatMenu()"></div><section class="combat-menu-dialog" role="dialog" aria-modal="true" aria-labelledby="combatMenuTitle"><header class="combat-menu-head"><h3 id="combatMenuTitle">${combatMenuIcon(state.kind==='items'?'backpack':'book')}${state.kind==='items'?'Backpack':'Skills'} <small>${entries.length}</small></h3><button class="combat-menu-close" aria-label="Close combat menu" onclick="closeCombatMenu()">${combatMenuIcon('close')}</button></header><div class="combat-menu-toolbar"><div class="combat-menu-filters" role="group" aria-label="Categories">${labels.map(([id,label])=>`<button aria-pressed="${state.filter===id}" onclick="filterCombatMenu('${id}')">${label}</button>`).join('')}</div><div class="combat-menu-views" role="group" aria-label="Display mode"><button aria-label="Icon view" aria-pressed="${!isList}" onclick="setCombatMenuView('grid')">${combatMenuIcon('grid')}Icons</button><button aria-label="List view" aria-pressed="${isList}" onclick="setCombatMenuView('list')">${combatMenuIcon('list')}List</button></div></div>${quickslotsView(true)}<div class="combat-menu-entries ${isList?'list':'grid'}" role="group" aria-label="${state.kind==='items'?'Items':'Skills'}"><div class="combat-menu-entry-grid">${visible.map(entry=>`<button class="combat-menu-entry ${entry.support?'support':''}" data-menu-entry="${entry.id}" draggable="true" aria-label="${esc(combatMenuDetail(entry))}" ${isList?`aria-pressed="${state.selected===entry.id}"`:''} data-math="${esc(combatMenuDetail(entry))}" onclick="chooseCombatMenuEntry('${entry.id}')" aria-disabled="${!combatMenuCanUse(entry)&&quickslotTarget===null}"><span class="combat-menu-glyph">${combatMenuIcon(entry.item&&!['potion','healthPotion','manaPotion'].includes(entry.id)?'scroll':entry.icon)}${entry.item&&!['potion','healthPotion','manaPotion'].includes(entry.id)?`<span class="combat-menu-scroll-glyph">${combatMenuIcon(entry.icon)}</span>`:''}</span><span class="combat-menu-copy"><b>${esc(entry.name)}</b><small>${esc(entry.desc)}</small><small class="combat-menu-kind">${entry.support?'Support · No retaliation':'Attack · Ends your turn'}</small></span><span class="combat-menu-cost">${esc(entry.cost)}</span></button>`).join('')||`<p class="combat-menu-empty">${entries.length?'No matching actions.':'Your backpack is empty.'}</p>`}</div></div>${isList?`<footer class="combat-menu-selection"><div><b>${selected?esc(selected.name):'Select '+(state.kind==='items'?'an item':'a skill')}</b><small>${selected?esc(selected.desc)+' · '+(selected.support?'Support · No retaliation':'Attack · Ends your turn'):''}</small></div><button id="combatMenuUse" class="primary" onclick="confirmCombatMenuSelection()" ${!combatMenuCanUse(selected)?'disabled':''}>${state.kind==='items'?'Use item':'Cast skill'}</button></footer>`:'<div class="combat-menu-hint">Choose an icon to '+(state.kind==='items'?'use the item':'cast the skill')+'.</div>'}</section></div>`;
}

function positionCombatMenu() {
  const layer=document.querySelector('.combat-menu-layer'), arena=layer?.parentElement, dialog=layer?.querySelector('.combat-menu-dialog'), versus=arena?.querySelector('.versus');
  if (!dialog || !versus) return;
  const a=arena.getBoundingClientRect(),v=versus.getBoundingClientRect(),half=dialog.offsetHeight/2;
  dialog.style.top=Math.max(half+14,Math.min(a.height-half-14,v.top-a.top+v.height/2))+'px';
}

function refreshCombatMenu() {
  const previous=document.querySelector('.combat-menu-layer');
  const scroll=previous?.querySelector('.combat-menu-entries')?.scrollTop || 0;
  if (previous) previous.outerHTML=combatMenuView();
  positionCombatMenu();
  const next=document.querySelector('.combat-menu-entries');
  if (next) next.scrollTop=scroll;
}

function openCombatMenu(kind) {
  if (!combatMenuActive() || !['items','skills'].includes(kind)) return;
  Object.assign(combatMenuState,{open:true,kind,filter:'all',selected:null});
  quickslotTarget=null;
  render();
  document.querySelector('.combat-menu-close')?.focus();
}

function closeCombatMenu() {
  const kind=combatMenuState.kind;
  combatMenuState.open=false;
  quickslotTarget=null;
  document.querySelector('.combat-menu-layer')?.remove();
  hideMath();
  document.getElementById(kind==='items'?'openBackpack':'openSkills')?.focus();
  for (const id of ['openBackpack','openSkills']) document.getElementById(id)?.setAttribute('aria-expanded','false');
}

function setCombatMenuView(view) {
  if (!['grid','list'].includes(view)) return;
  combatMenuState.view=view;
  refreshCombatMenu();
  document.querySelector(`.combat-menu-views button[aria-pressed="true"]`)?.focus();
}
function filterCombatMenu(filter) {
  if (!['all','attack','support','potions','scrolls'].includes(filter)) return;
  combatMenuState.filter=filter;
  refreshCombatMenu();
  document.querySelector('.combat-menu-filters button[aria-pressed="true"]')?.focus();
}


function chooseCombatMenuEntry(id) {
  if(Date.now()<quickslotIgnoreClickUntil)return;
  const entry=combatMenuEntries().find(entry=>entry.id===id);
  if (!entry) return;
  if(quickslotTarget!==null){assignQuickslot(quickslotTarget,{kind:combatMenuState.kind,id});return;}
  if (combatMenuState.view==='grid') { executeCombatMenuEntry(entry); return; }
  combatMenuState.selected=id;
  const scroll=document.querySelector('.combat-menu-entries')?.scrollTop||0;
  refreshCombatMenu();
  const next=document.querySelector('.combat-menu-entries');if(next)next.scrollTop=scroll;
  document.querySelector(`[data-menu-entry="${id}"]`)?.focus();
}
function confirmCombatMenuSelection() { executeCombatMenuEntry(combatMenuEntries().find(entry=>entry.id===combatMenuState.selected)); }
function executeCombatMenuEntry(entry) {
  if (!combatMenuCanUse(entry)) return;
  closeCombatMenu();
  if (entry.item) useItem(entry.id); else combatAction(entry.id);
}

function updateCombatMenuControls() {
  updateQuickslotControls();
  if (!combatMenuState.open) return;
  if (!combatMenuActive()) {closeCombatMenu();return;}
  const entries=combatMenuEntries();
  document.querySelectorAll('[data-menu-entry]').forEach(button=>{button.setAttribute('aria-disabled',String(quickslotTarget===null&&!combatMenuCanUse(entries.find(entry=>entry.id===button.dataset.menuEntry))));});
  const use=document.getElementById('combatMenuUse');if(use)use.disabled=!combatMenuCanUse(entries.find(entry=>entry.id===combatMenuState.selected));
}

function combatMenuKeydown(event) {
  if (!combatMenuState.open) return;
  if (event.key==='Escape') {event.preventDefault();closeCombatMenu();return;}
  if (event.key!=='Tab') return;
  const dialog=document.querySelector('.combat-menu-dialog');
  const nodes=Array.from(dialog?.querySelectorAll('button:not(:disabled), input')||[]);
  if (!nodes.length) return;
  const first=nodes[0],last=nodes[nodes.length-1];
  if (event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}
