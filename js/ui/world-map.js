'use strict';

let expeditionPlannerOpen=false;
function worldMapIcon(name){
  const paths={
    house:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    'tree-deciduous':'<path d="M12 22v-7m-4 4h8M8 15a4 4 0 0 1-3-7 4 4 0 0 1 6-5 4 4 0 0 1 7 4 4 4 0 0 1-1 8Z"/>',
    castle:'<path d="M3 21V3h4v4h3V3h4v4h3V3h4v18ZM9 21v-6a3 3 0 0 1 6 0v6M3 11h18"/>',
    crypt:'<path d="M4 21V9a8 8 0 0 1 16 0v12ZM8 21v-6h8v6M12 3v3M3 12h3m12 0h3"/>',
    pickaxe:'<path d="m4 20 10-10M3 7c5-5 11-3 17 3l-3 3C11 7 7 5 3 7Zm14 6 3 3"/>',
    trees:'<path d="M7 22v-6m10 6v-7M7 3 1 13h3l-3 5h12l-3-5h3ZM15 3a5 5 0 0 1 6 7 4 4 0 0 1-4 6h-3"/>',
    mountain:'<path d="m2 21 8-16 5 9 3-5 5 12ZM7 11l3 2 3-2M17 12l2 2 2-1"/>',
    waves:'<path d="M2 6q3-4 6 0t6 0 8 0M2 12q3-4 6 0t6 0 8 0M2 18q3-4 6 0t6 0 8 0"/>',
    'flame-kindling':'<path d="M12 2c3 5 6 7 5 11 5-2 5 6-1 6H8c-6 0-6-7-2-7-1-5 4-5 6-10ZM3 22l18-3M3 19l18 3"/>',
    lock:'<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5Z"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    anvil:'<path d="M2 8h20l-5 5h-4v4l5 3H5l5-3v-4H6ZM4 8V4h6v4"/>',
    sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.compass}</svg>`;
}
function canDepartExpedition(id=selected){return !!(s&&!s.dead&&city()&&id>0&&locations[id]&&!s.restUntil&&s.level>=locations[id].level);}
function expeditionPinsView(){
  return WORLD_MAP_LOCATIONS.map((d,id)=>{
    const locked=s.level<locations[id].level;
    return `<button type="button" class="expedition-pin ${id===0?'home':locked?'locked':''}" style="--x:${d.x}%;--y:${d.y}%" data-destination="${id}" aria-pressed="${id===selected}" aria-label="${esc(d.name)} · ${id===0?'Safe haven':locked?'Locked until level '+locations[id].level:'Unlocked · Level '+locations[id].level}" data-math="${esc(d.name)} · ${id===0?'Safe haven':locked?'Locked until level '+locations[id].level:'Unlocked'}" onclick="selectExpedition(${id})">${worldMapIcon(d.mapIcon)}${id&&locked?`<span class="lock-badge">${worldMapIcon('lock')}</span><span class="level-label">Lv. ${locations[id].level}</span>`:id?'<span class="open-dot" aria-hidden="true"></span>':''}</button>`;
  }).join('');
}
function expeditionDetailsView(){
  const d=WORLD_MAP_LOCATIONS[selected],locked=s.level<locations[selected].level;
  const label=!selected?'You are here':locked?'Requires level '+locations[selected].level:s.restUntil?'Finish resting first':'Depart →';
  return `<div><div class="eyebrow">${!selected?'Your sanctuary':(locked?'Locked':'Unlocked')+' · Levels 1–5'}</div><h3>${esc(d.name)}</h3><div class="expedition-subtitle">${esc(d.subtitle)}</div><p>${esc(d.sub)}</p>${selected?`<div class="expedition-facts"><span>${duration(selected)}s travel</span><span>No travel fare</span></div><p class="difficulty-summary">Dungeon levels: 1–5 · Unlocked: 1–${Math.min(5,s.level)}</p>`:'<div class="expedition-facts">Rest, reforge, and prepare for the road ahead.</div>'}</div><button type="button" class="primary expedition-depart" onclick="departExpedition()" ${canDepartExpedition()?'':'disabled'}>${label}</button>`;
}
function expeditionPlannerView(){
  if(!city()){expeditionPlannerOpen=false;return '';}
  return `<dialog id="expeditionPlanner" class="expedition-dialog" aria-labelledby="expeditionTitle" oncancel="closeExpeditionPlanner(event)" onclick="if(event.target===this)closeExpeditionPlanner()"><div class="expedition-window"><div class="expedition-heading"><div><div class="eyebrow">Greyhaven · Expeditions</div><h2 id="expeditionTitle">Choose your destination</h2></div><button type="button" class="expedition-close" aria-label="Close expedition planner" onclick="closeExpeditionPlanner()">${worldMapIcon('close')}</button></div><div class="expedition-world-map aeltharis-map"><div class="map-moor-lines" aria-hidden="true"></div><div class="expedition-pins">${expeditionPinsView()}</div><span class="map-label greyhaven-label">GREYHAVEN</span><span class="map-label sepulchre-label">SEPULCHER OF THE FORSAKEN</span></div><div class="expedition-legend"><span><i class="available" aria-hidden="true"></i>Available</span><span>Sepulcher · Levels 1–5</span></div><div class="expedition-details" aria-live="polite">${expeditionDetailsView()}</div><div class="expedition-summary">Mage · Level ${s.level} / ${MAX_LEVEL} · ${locations.length-1} dungeon available</div><p class="expedition-lore">One road leads from Greyhaven into the burial ruins of Aeltharis. More destinations will follow.</p></div></dialog>`;
}
function mountExpeditionPlanner(){
  const dialog=document.getElementById('expeditionPlanner');
  if(expeditionPlannerOpen&&dialog&&!dialog.open){dialog.showModal();dialog.querySelector('.expedition-close')?.focus();}
}
function openExpeditionPlanner(){
  if(!city())return;
  expeditionPlannerOpen=true;
  if(!Number.isInteger(selected)||selected<0||selected>=locations.length)selected=1;
  mountExpeditionPlanner();
}
function closeExpeditionPlanner(event){
  event?.preventDefault();expeditionPlannerOpen=false;
  document.getElementById('expeditionPlanner')?.close();hideMath();
  document.getElementById('startExpedition')?.focus();
}
function selectExpedition(id){
  if(!city()||!Number.isInteger(id)||id<0||id>=locations.length)return;
  selected=id;
  const dialog=document.getElementById('expeditionPlanner');if(!dialog)return;
  dialog.querySelectorAll('[data-destination]').forEach(el=>el.setAttribute('aria-pressed',String(+el.dataset.destination===id)));
  dialog.querySelector('.expedition-details').innerHTML=expeditionDetailsView();
}
function finishExpeditionDeparture(){
 if(!canDepartExpedition())return false;
 closeExpeditionPlanner();travel(selected);return true;
}
function closeUnarmedDepartureWarning(event){
 event?.preventDefault();const d=document.getElementById('eoaUnarmedWarning');
 if(d){if(d.open)d.close();d.remove();}
 document.querySelector('#expeditionPlanner .expedition-depart')?.focus({preventScroll:true});
}
function continueUnarmedDeparture(){closeUnarmedDepartureWarning();finishExpeditionDeparture();}
function departExpedition(){
 if(!canDepartExpedition())return;
 if(s.equipment?.weapon){finishExpeditionDeparture();return;}
 if(document.getElementById('eoaUnarmedWarning'))return;
 document.body.insertAdjacentHTML('beforeend',`<dialog id="eoaUnarmedWarning" class="eoa-unarmed-dialog" aria-labelledby="eoaUnarmedTitle" oncancel="closeUnarmedDepartureWarning(event)"><div class="eyebrow">Before you depart</div><h2 id="eoaUnarmedTitle">Leave without a weapon?</h2><p>You have no weapon equipped. You can still depart, but you'll face the Sepulcher without your staff. The Blacksmith can provide a free Common weapon if you don't own one.</p><div class="eoa-unarmed-buttons"><button type="button" onclick="closeUnarmedDepartureWarning()">Go back</button><button type="button" class="primary" onclick="continueUnarmedDeparture()">Depart without a weapon</button></div></dialog>`);
 const warning=document.getElementById('eoaUnarmedWarning');warning.showModal();warning.querySelector('button')?.focus();
}
