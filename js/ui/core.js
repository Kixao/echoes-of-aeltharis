'use strict';

// Emberwild v0.1.29 — js/ui/core.js

function notify(t){
  $('#toast').textContent=t;
  $('#toast').style.display='block';
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$('#toast').style.display='none',3200)
}

function log(t){
  s.log.unshift(t);
  s.log=s.log.slice(0,80)
}

function render(){
  retainCombatModels();
  retainMourningScene();
  hideMath();
  document.getElementById("gearFloatingLayer")?.remove();
  const gold=document.getElementById("bankedGold");gold.hidden=landing||!s;if(s)gold.textContent="◈ "+s.gold.toLocaleString()+" banked gold";
  document.querySelectorAll('body > .event-dialog').forEach(d=>d.remove());
  if(landing){clearMourningScene();document.getElementById('settingsToggle').hidden=true;$('#app').innerHTML=startScreen();return}
  if(s?.defeatPopup)tab='journey';
  document.getElementById('settingsToggle').hidden=!s;
  if(s&&['town','blacksmith','mysteries'].includes(tab)&&!city())tab='journey';
  if(shopModalOpen&&!city())shopModalOpen=null;
  if(shopModalOpen)tab='journey';
  theme(s?.class||draft.class);
  if(!s){clearMourningScene();return creation();}
  let c=calc();
  $('#app').innerHTML=`<div class="layout"><aside><div class="avatar">${portrait(s.class)}</div><div class="hero-name"><div class="eyebrow">Level ${s.level} / ${MAX_LEVEL} · ${s.class}</div><h3>${esc(s.name)}</h3><small>${s.travel?'On the road':locations[s.loc].name}</small></div><div class="sidestats"><div class="row tiny"><span>HEALTH</span><span>${Math.ceil(s.hp)} / ${c.hp}</span></div><div class="bar hp"><i style="width:${s.hp/c.hp*100}%"></i></div>${manaView()}<div class="row tiny"><span>EXPERIENCE</span><span>${s.level===MAX_LEVEL?'MAX LEVEL':s.xp+' / '+xpNeed()}</span></div><div class="bar xp"><i style="width:${s.level===MAX_LEVEL?100:s.xp/xpNeed()*100}%"></i></div></div><div class="combat-stats"><div class="eyebrow">Combat readiness</div><div class="row"><small>Magical damage</small><b>${c.min}–${c.max}</b></div><div class="row"><small>Critical chance</small><b>${c.crit.toFixed(1)}%</b></div><div class="row"><small>Dodge</small><b>${Math.round(c.dodge*100)}%</b></div><div class="row"><small>Armor value</small><b>${c.armor}</b></div><div class="row"><small>Resistance value</small><b>${c.resistance}</b></div></div><div class="sidestats">${STATS.map((n,i)=>[1,3].includes(i)?'':`<div class="row" style="margin:10px 0"><small>${n}</small><b>${Math.max(0,(itemBonus()[n.toLowerCase()]||0))}</b></div>`).join('')}</div><p class="tiny">Your progress saves in this browser.</p><div class="sidebar-bottom"><button type="button" id="adminToggle" class="admin-toggle" onclick="openAdmin()">⚙ Admin menu</button></div></aside><main class="main ${['blacksmith','perks','mysteries'].includes(tab)?'eoa-location-main':tab==='journey'&&city()?'eoa-mainstreet-main':''}"><div class="pagehead ${tab==='equipment'||tab==='journey'&&s.loc>0&&!s.travel&&!s.enemy?'dungeon-pagehead':''}"><div>${s.travel||city()?`<div class="eyebrow">${s.travel?'Journey in progress':'Sanctuary · Prepare your next expedition'}</div>`:''}<h1>${tab==='mysteries'?'Magical Mysteries':tab==='blacksmith'?'The Blacksmith':tab==='town'?'Greyhaven services':tab==='equipment'?'Inventory':tab==='perks'?'Arcane Studies':tab==='guide'?'Field notes':s.travel?'The old road':locations[s.loc].name}</h1></div><div class="header-actions">${city()?`<div class="rest-progress" id="restProgress" role="progressbar" aria-label="Rest recovery" aria-valuemin="0" aria-valuemax="30" aria-valuenow="0" ${s.restUntil?'':'hidden'}><div class="rest-progress-label">✧ Resting <strong id="restTime">30s</strong></div><div class="rest-track"><i id="restFill"></i></div></div>`:''}</div></div>${tab==='mysteries'?magicalMysteriesView():tab==='blacksmith'?blacksmithView():tab==='town'?townView():tab==='equipment'?equipmentView():tab==='perks'?perkView():tab==='guide'?guideView():journeyView()}</main></div>${inventoryOpen?`<dialog class="equipment-stash-modal" id="equipmentStashDialog" aria-labelledby="equipmentStashTitle" oncancel="closeEquipmentStash(event)" onclick="if(event.target===this)closeEquipmentStash()">${inventoryView()}</dialog>`:''}${shopModalView()}`;
  paintGold();
  mountCombatModels();
  mountMourningScene();
  mountExpeditionPlanner();
  mountDungeon();
  mountEquipment();
  mountBlacksmith();
  mountInventory();
  mountEquipmentStash();
  mountShopModal();
  mountEventPopup();
  paintTravelAnimation();
  positionRangedEffects();
  positionCombatMenu();
  positionDefeatPopup();
  positionVictoryPopup();
  setupVictoryItemComparison();
  focusVictoryPopup();
  paintEnemyAttacks();
  paintBossAnimations();
  updateCooldown();
  hitFX={enemy:false,player:false}
}

function setTab(t){
  if(s.eventPopup||dungeonEntering)return;
  if(['town','blacksmith','mysteries'].includes(t)&&!city())return;
  if(t==='equipment'){openEquipmentStash();return;}
  if(t==='perks'&&city()){openShopModal('studies');return;}
  if(t==='blacksmith'&&city()){openBlacksmith();return;}
  if(t==='mysteries'&&city()){openMagicalMysteries();return;}
  if(inventoryOpen)inventoryOpen=false;
  tab=t;
  render()
}

function theme(c){
  document.body.dataset.identity='aeltharis'
}

function paintGold(){
  $('#app').innerHTML=$('#app').innerHTML.replace(/◈/g,'<span class="gold-symbol">◈</span>')
}

function hideMath(){
  let tip=$('#combatMath');
  if(tip)tip.style.display='none'
}

function showMath(el,x,y){
  if(!el?.dataset.math)return hideMath();
  let tip=$('#combatMath');
  if(!tip){
    tip=document.createElement('div');
    tip.id='combatMath';
    tip.setAttribute('role','tooltip');
    document.body.appendChild(tip);
  }
  tip.textContent=el.dataset.math;
  tip.style.display='block';
  tip.style.left=Math.max(8,Math.min(x+14,window.innerWidth-tip.offsetWidth-12))+'px';
  tip.style.top=Math.max(8,Math.min(y+16,window.innerHeight-tip.offsetHeight-12))+'px';
}

