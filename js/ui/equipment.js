let gearPositionCompare=()=>{};
window.addEventListener('resize',()=>gearPositionCompare());
const gearBrowserState={category:'All',rarity:'All',search:'',sort:'rarity',selected:null};
const GEAR_ARTWORK={}; // Assign an iconKey to an item and register a bundled asset path here.
function gearDisplayItem(item){
 const c=comparisonStats(item),labels={crit_bonus:'Critical chance',armor:'Armor',resistance:'Resistance',hp:'Health',mana:'Mana',travel:'Travel reduction',intelligence:'Intelligence',strength:'Strength',agility:'Agility',luck:'Luck',vitality:'Vitality'};
 const stats={};
 if(c.damageMin||c.damageMax)stats['Weapon damage']=`${c.damageMin}–${c.damageMax}`;
 for(const [key,value] of Object.entries(c))if(value!==0&&labels[key])stats[labels[key]]=value;
 return {...item,stats};
}
function gearTierTag(item){return item?.tier===1?'<span class="gear-tier-tag">Tier 1</span>':''}
function equipmentIcon(slot){const paths={weapon:'M5 21 17 4m-3 1 4-3 3 4-4 3M7 17l3 2',offhand:'M3 4q5-2 9 1 4-3 9-1v15q-5-2-9 1-4-3-9-1zM12 5v15',armor:'m7 3-5 5 4 4v9h12v-9l4-4-5-5-5 3z',boots:'M8 3h8v11l5 3v4H4v-6l4-2zM5 17h6',necklace:'M4 3q0 10 8 12 8-5 8-12M12 13l4 4-4 5-4-5z',ring1:'M8 6l4-4 4 4-4 4zM8 9a7 7 0 1 0 8 0'};return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="${paths[slot]||paths.armor}"/></svg>`}

function mountEquipment(){
document.getElementById("gearFloatingLayer")?.remove();
if(!document.getElementById("eoa-quartermaster-game"))return;
const root=document.getElementById('eoa-quartermaster-game');
const slots=EQUIPMENT_SLOTS;

// Add future artwork by stable iconKey. Embedded PNG/WebP/SVG data URLs work
// in this self-contained workshop. The actual game can use bundled asset paths.
// Example: ITEM_ARTWORK['cryptglass-staff'] = {src: 'data:image/png;base64,...'};
const ITEM_ARTWORK=GEAR_ARTWORK;
const descriptions={quartermaster:'Hover to compare · Click to replace · Tap to inspect on mobile',armory:'Readable item rows · category navigation · six-slot equipment strip',reliquary:'Rarity shelves · paired equipment slots · comparison beneath your character'};
const icon=slot=>equipmentIcon(slot);

function itemArt(item,slot){
 const key=item?.iconKey||item?.name?.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
 const entry=key?ITEM_ARTWORK[key]:null;
 const src=item?.iconSrc||(typeof entry==='string'?entry:entry?.src);
 return src?`<span class="item-art" data-fallback-slot="${slot}" aria-hidden="true"><img src="${esc(src)}" alt="" decoding="async"></span>`:icon(slot);
}
// A failed artwork load restores the category mark; no broken-image placeholder.
root.addEventListener('error',event=>{
 const image=event.target;if(image.tagName!=='IMG')return;
 const wrapper=image.closest('.item-art');if(!wrapper)return;
 wrapper.innerHTML=icon(wrapper.dataset.fallbackSlot);

},true);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
root.querySelectorAll('.gear-stage').forEach(stage=>{
const style=stage.classList.contains('armory')?'armory':stage.classList.contains('reliquary')?'reliquary':'quartermaster';
const state=gearBrowserState;
Object.defineProperties(state,{bag:{configurable:true,get:()=>s.items.map(gearDisplayItem)},worn:{configurable:true,get:()=>Object.fromEntries(EQUIPMENT_SLOTS.map(slot=>[slot,s.equipment[slot]?gearDisplayItem(s.equipment[slot]):null]))}});

const title='Equipment Stash';
const slotsMarkup=()=>slots.map(slot=>`<button type="button" class="slot ${state.worn[slot]?.rarity||''}" data-worn="${slot}" aria-label="${slot}: ${esc(state.worn[slot]?.name||'Empty slot')}" ${state.worn[slot]?'':'disabled'}>${itemArt(state.worn[slot],slot)}<span><small>${SLOT_LABELS[slot]}</small><strong class="${state.worn[slot]?.rarity||''}">${esc(state.worn[slot]?.name||'Empty slot')}</strong></span></button>`).join('');
const toolMarkup=`<div class="toolbar"><label>Search Gear Stash<input type="search" placeholder="Search names or stats…" aria-label="Search Gear Stash"></label><label>Rarity<select aria-label="Filter rarity"><option value="All">Any rarity</option><option value="common">Common</option><option value="uncommon">Uncommon</option><option value="rare">Rare</option><option value="epic">Epic</option></select></label><label>Sort by<select aria-label="Sort equipment"><option value="rarity">Rarity first</option><option value="name">Name</option><option value="category">Category</option></select></label></div>`;
stage.innerHTML=`<header class="gear-top"><div><div class="eyebrow">Echoes of Aeltharis · Equipment</div><h2>${title}</h2><div class="tagline">${descriptions[style]}</div></div><small>${s.class} · Level ${s.level} · ${city()?'Greyhaven':'Expedition'}</small></header>${style==='armory'?'<div class="equipped-ribbon"></div>':''}<div class="main-layout">${style==='armory'?'<nav class="categories" aria-label="Equipment categories"></nav>':'<section class="equipment-panel"><div class="eyebrow">Currently Equipped Gear</div><div class="slots"></div>'+(style==='reliquary'?'<aside class="compare-panel"></aside>':'')+'</section>'}<section class="bag-panel">${toolMarkup}${style!=='armory'?'<nav class="categories" aria-label="Equipment categories"></nav>':''}<div class="result-count"></div><div class="items"></div><div class="rarity-key"><span class="common">Common</span><span class="uncommon">Uncommon</span><span class="rare">Rare</span><span class="epic">Epic</span></div></section>${style!=='reliquary'?'<aside class="compare-panel"></aside>':''}</div><div class="notice" role="status" aria-live="polite">Worn Equipment will be lost on death.</div>`;
const compare=stage.querySelector('.compare-panel');
const floating=document.createElement('div');floating.id='gearFloatingLayer';floating.innerHTML='<div class="quartermaster"></div>';(document.getElementById('equipmentStashDialog')||document.body).append(floating);floating.firstElementChild.append(compare);compare.hidden=true;compare.setAttribute('role','dialog');compare.setAttribute('aria-label','Equipment comparison');
let anchor=null,closeTimer, touchInput=false,suppressFocus=false;
const coarse=()=>matchMedia('(hover: none), (pointer: coarse)').matches||touchInput;
function closeCompare(){clearTimeout(closeTimer);compare.hidden=true;anchor?.removeAttribute('aria-describedby');anchor=null}
function positionCompare(){
 if(!anchor||compare.hidden||!anchor.isConnected)return;
 const frame={width:window.innerWidth},r=anchor.getBoundingClientRect(),w=compare.offsetWidth,h=compare.offsetHeight;
 compare.style.left=Math.max(8,Math.min(frame.width-w-8,r.left+r.width/2-w/2))+'px';
 compare.style.top=Math.max(8,Math.min(window.innerHeight-h-8,r.top>=h+20?r.top-h-12:r.bottom+12))+'px';
}
function equip(id){closeCompare();equipItem(id)}

compare.onpointerenter=()=>clearTimeout(closeTimer);
compare.onpointerleave=()=>{if(!coarse())closeTimer=setTimeout(closeCompare,180)};
stage.addEventListener('keydown',e=>{if(e.key==='Escape'){const button=anchor;closeCompare();suppressFocus=true;button?.focus();suppressFocus=false}});
stage.addEventListener('pointerdown',e=>{if(anchor&&!compare.contains(e.target)&&!e.target.closest('[data-item]'))closeCompare()});
gearPositionCompare=positionCompare;stage.addEventListener('scroll',closeCompare,true);root.closest('.inventory-scroll')?.addEventListener('scroll',closeCompare);
function showCompare(id,button){
 clearTimeout(closeTimer);anchor=button||stage.querySelector(`[data-item="${id}"]`);if(!anchor)return;
 const item=state.bag.find(x=>x.id===id);if(!item)return;
 const worn=state.worn[item.slot],keys=[...new Set([...Object.keys(item.stats),...Object.keys(worn?.stats||{})])];
 compare.innerHTML=`<div class="eyebrow">${item.slot} comparison</div><div class="comparison-pair"><div><small>New find</small><h4 class="${item.rarity}">${esc(item.name)}</h4>${itemDetailTags(item)}</div><div><small>Currently worn</small><h4 class="${worn?.rarity||''}">${esc(worn?.name||'Empty slot')}</h4>${itemDetailTags(worn)}</div></div><div class="compare-stats">${keys.map(k=>{const next=item.stats[k]||0,old=worn?.stats[k]||0,d=typeof next==='number'&&typeof old==='number'?next-old:null;return `<div class="stat-line"><span>${k}</span><span>${next}${k==='Travel reduction'?'s':''} <small>vs ${old||'—'}</small>${d===null?'':` <span class="${d<0?'down':'delta'}">(${d>0?'+':''}${d})</span>`}</span></div>`}).join('')}</div><button type="button" class="equip-button">Equip</button>`;
 compare.querySelector('.equip-button').hidden=!coarse();
 compare.querySelector('.equip-button').textContent=(worn?'Equip · Replace ':'Equip · ')+item.slot;
 compare.querySelector('.equip-button').disabled=!itemCanBeEquipped(item);
 compare.querySelector('.equip-button').onclick=()=>equip(id);
 const close=document.createElement('button');close.type='button';close.className='close-compare';close.textContent='×';close.setAttribute('aria-label','Close comparison');close.onclick=closeCompare;compare.prepend(close);
 compare.insertAdjacentHTML('beforeend',`<div class="replace-hint">${!gearChangeAllowed()?'Equipment can only be changed in Greyhaven.':!itemCanBeEquipped(item)?'The Mage cannot equip this weapon.':coarse()?'Select an item, then tap Equip.':worn?'Click to replace':'Click to equip'}</div>`);
 compare.hidden=false;positionCompare();

}
function unequip(slot){closeCompare();unequipItem(slot)}

function showWorn(slot,button){
 const item=state.worn[slot];if(!item)return;
 clearTimeout(closeTimer);anchor=button;
 compare.innerHTML=`<div class="eyebrow">Currently equipped · ${slot}</div><h3 class="${item.rarity}">${esc(item.name)}</h3>${itemDetailTags(item)}<div class="compare-stats">${Object.entries(item.stats).map(([key,value])=>`<div class="stat-line"><span>${key}</span><span>${key==='Weapon damage'?value:'+'+value}${key==='Travel reduction'?'s':''}</span></div>`).join('')}</div><div class="replace-hint">${!gearChangeAllowed()?'Equipment can only be changed in Greyhaven.':coarse()?'Tap Unequip to return this item to your pack.':'Click to unequip'}</div>${coarse()?'<button type="button" class="equip-button">Unequip</button>':''}`;
 if(compare.querySelector('.equip-button'))compare.querySelector('.equip-button').disabled=!gearChangeAllowed();
 compare.querySelector('.equip-button')?.addEventListener('click',()=>unequip(slot));
 const close=document.createElement('button');close.type='button';close.className='close-compare';close.textContent='×';close.setAttribute('aria-label','Close item details');close.onclick=closeCompare;compare.prepend(close);
 compare.hidden=false;positionCompare();
}
function render(){
 closeCompare();
 stage.querySelector(style==='armory'?'.equipped-ribbon':'.slots').innerHTML=slotsMarkup();
 stage.querySelectorAll('[data-worn]').forEach(b=>{
 b.onpointerdown=e=>{touchInput=e.pointerType==='touch'};
 b.onpointerenter=e=>{if(!b.disabled&&e.pointerType!=='touch'&&!matchMedia('(hover: none)').matches){touchInput=false;showWorn(b.dataset.worn,b)}};
 b.onpointerleave=()=>{if(!coarse())closeTimer=setTimeout(closeCompare,180)};
 b.onfocus=()=>{if(!touchInput&&!suppressFocus)showWorn(b.dataset.worn,b)};
 b.onblur=e=>{if(!compare.contains(e.relatedTarget)&&!coarse())closeTimer=setTimeout(closeCompare,180)};
 b.onclick=()=>{if(coarse())showWorn(b.dataset.worn,b);else unequip(b.dataset.worn)};
 });
 stage.querySelector('.categories').innerHTML=['All',...slots].map(s=>`<button type="button" aria-pressed="${state.category===s}" data-category="${s}">${SLOT_LABELS[s]||s}</button>`).join('');
 stage.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{state.category=b.dataset.category;render()});
 const filtered=state.bag.filter(i=>(state.category==='All'||i.slot===state.category)&&(state.rarity==='All'||i.rarity===state.rarity)&&(i.name+' '+i.slot+' '+Object.keys(i.stats).join(' ')).toLowerCase().includes(state.search));
 filtered.sort((a,b)=>state.sort==='name'?a.name.localeCompare(b.name):state.sort==='category'?a.slot.localeCompare(b.slot):({epic:4,rare:3,uncommon:2,common:1}[b.rarity]-{epic:4,rare:3,uncommon:2,common:1}[a.rarity])||a.name.localeCompare(b.name));
 stage.querySelector('.result-count').innerHTML=`<span>${filtered.length} of ${state.bag.length} items</span><span>${state.category==='All'?'All equipment':SLOT_LABELS[state.category]}</span>`;
 const itemMarkup=i=>`<button type="button" class="item ${i.rarity.toLowerCase()}" data-item="${esc(i.id)}" aria-pressed="${i.id===state.selected}" aria-label="${esc(i.name+', '+i.rarity+', '+i.slot)}">${itemArt(i,i.slot)}<span class="item-name">${esc(i.name)}</span><span class="rarity">${i.rarity==='epic'?'✦':i.rarity==='rare'?'◆':'◇'} ${i.rarity}</span></button>`;
 const items=stage.querySelector('.items');
 items.innerHTML=style==='reliquary'?['epic','rare','uncommon','common'].map(r=>{const list=filtered.filter(i=>i.rarity===r);return list.length?`<div class="group-title"><span>${r==='epic'?'✦':r==='rare'?'◆':'◇'} ${r}</span><small>${list.length} items</small></div><div class="bag-grid">${list.map(itemMarkup).join('')}</div>`:''}).join(''):`<div class="${style==='armory'?'item-list':'bag-grid'}">${filtered.map(itemMarkup).join('')}</div>`;
 if(!filtered.length)items.innerHTML='<div class="empty">No equipment matches these filters.</div>';
 stage.querySelectorAll('[data-item]').forEach(b=>{
 b.onpointerdown=e=>{touchInput=e.pointerType==='touch'};
 b.onpointerenter=e=>{if(e.pointerType!=='touch'&&!matchMedia('(hover: none)').matches){touchInput=false;showCompare(b.dataset.item,b)}};
 b.onpointerleave=()=>{if(!coarse())closeTimer=setTimeout(closeCompare,180)};
 b.onfocus=()=>{if(!touchInput&&!suppressFocus)showCompare(b.dataset.item,b)};
 b.onblur=e=>{if(!compare.contains(e.relatedTarget)&&!coarse())closeTimer=setTimeout(closeCompare,180)};
 b.onclick=e=>{const id=b.dataset.item;state.selected=id;if(coarse()){showCompare(id,b);stage.querySelectorAll('[data-item]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))}else equip(id)};
 });

}
stage.querySelector('input').value=state.search;stage.querySelector('[aria-label="Filter rarity"]').value=state.rarity;stage.querySelector('[aria-label="Sort equipment"]').value=state.sort;
stage.querySelector('input').oninput=e=>{state.search=e.target.value.toLowerCase();render()};
stage.querySelector('[aria-label="Filter rarity"]').onchange=e=>{state.rarity=e.target.value;render()};
stage.querySelector('[aria-label="Sort equipment"]').onchange=e=>{state.sort=e.target.value;render()};render();
});
}
