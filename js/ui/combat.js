'use strict';

// Emberwild v0.1.29 — js/ui/combat.js

function battleView(){
  if(!s.enemy&&!s.complete)spawn();
  if(s.enemy&&!s.enemy.combatModelId)s.enemy.combatModelId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const completedBoss={name:locations[s.loc].enemies[3],hp:0,max:(28+dungeonLevel()*9)*2,boss:true,attacks:0};
  let e=hitFX.defeated||s.enemy||completedBoss,c=calc();
  return `<div class="panel arena ${s.loc===1?'crypt-arena':''}">${combatFX()}<div class="encounter-header combat-round-header" aria-label="Combat actions"><span class="combat-round-indicator ${s.round?.attack?'used':'ready'}"><span class="combat-round-dot" aria-hidden="true"></span>Attack ${s.round?.attack?'Used':'Ready'}</span><span class="combat-round-indicator support ${s.round?.support?'used':'ready'}"><span class="combat-round-dot" aria-hidden="true"></span>Support ${s.round?.support?'Used':'Ready'}</span></div><div class="duel">${rangedEffectsView()}${enemyAttackView()}${bossAnimationView()}<div class="combatant"><div style="${s.defeatPopup?'animation-delay:'+((s.defeatPopup.readyAt-650-Date.now())/1000)+'s':''}" class="combat-portrait ${s.defeatPopup?'player-defeat ':''}${hitFX.dodge?'dodge-step':hitFX.player?'hit-shake':''}"><div class="hero-motion">${combatPlayerArt()}</div>${effectsView('player')}</div><h3>${esc(s.name)}</h3><small>Level ${s.level} ${s.class}</small><div class="combat-resources"><div><span class="tiny">HEALTH</span><div class="bar hp"><i style="width:${s.hp/c.hp*100}%"></i></div><strong>${Math.ceil(s.hp)} / ${c.hp}</strong></div><div><span class="tiny">MANA</span><div class="bar mana"><i style="width:${s.mana/c.mana*100}%"></i></div><strong>${s.mana} / ${c.mana}</strong></div></div>${statusEffectsView("player")}</div><div class="versus">⚔</div><div class="combatant"><div style="${defeatPresentation?'animation-delay:'+((defeatPresentation.contact+200-Date.now())/1000)+'s':s.rewardPopup||s.complete?'animation-delay:-1s':''}" class="enemy-portrait ${s.rewardPopup||s.complete?'enemy-defeat ':''}${hitFX.enemy?'hit-shake'+(effects.some(f=>f.target==='enemy'&&isRangedVisual(f.type)&&Date.now()-f.time<120)?'':''):hitFX.retaliating?'enemy-lunge':''}">${combatEnemyArt(e.name)}${effectsView('enemy')}</div><h3>${e.name}</h3><small>${e.boss?'Dungeon guardian · '+(e.attacks||0)+' attacks made':'Level '+dungeonLevel()+' foe'}</small><div class="bar enemyhp"><i style="width:${displayedEnemyHP(e)/e.max*100}%"></i></div><strong>${Math.max(0,Math.ceil(displayedEnemyHP(e)))} / ${e.max} HP</strong>${statusEffectsView("enemy")}</div></div>${bossWarning()}${s.complete||s.rewardPopup&&victoryReady()?rewardView():''}<div ${s.complete||s.rewardPopup||s.defeatPopup?'inert':''} class="attack-controls combat-actions-shell">${combatActionBarView()}</div>${combatMenuView()}${defeatPopupView()}</div>${combatLogView()}`
}

function updateCooldown(){
  if(!s||s.dead)return;
  document.getElementById('adminSkipTurn').disabled=!canAdminSkipTurn();
  let rt=$('#restTime');
  if(rt){
    let remaining=Math.max(0,(s.restUntil-Date.now())/1000);
    rt.textContent=Math.ceil(remaining)+'s';
    let bar=$('#restFill'),progress=$('#restProgress');
    if(bar)bar.style.width=(100*(30-remaining)/30).toFixed(1)+'%';
    if(progress)progress.setAttribute('aria-valuenow',(30-remaining).toFixed(1));
  }
  document.querySelectorAll('[data-ability]').forEach(b=>b.disabled=!canAbility(b.dataset.ability));
  document.querySelectorAll('[data-consumable]').forEach(b=>b.disabled=!canUseItem(b.dataset.consumable));
  let b=$('#attack');
  if(b){
    let left=Math.max(0,(s.cooldown-Date.now())/1000);
    b.disabled=left>0||!!s.pending||combatBusy()||!!s.rewardPopup;
    b.textContent=combatBusy()?'Casting…':s.pending?'Enemy turn…':left>0?'Recovering · '+left.toFixed(1)+'s':classes[s.class].icon+' '+classes[s.class].basicAttack
  }
  updateCombatMenuControls();
  let t=$('#travelTime');
  if(t&&s.travel)t.textContent=Math.max(0,Math.ceil((s.travel.arrive-Date.now())/1000))+'s'
}

function combatLogView(){
  return `<section class="panel combat-history"><div class="row"><h3>Combat log</h3><small>Hover or focus underlined entries for details</small></div><div class="combat-entries" role="log" aria-label="Combat history">${(s.combatLog||[]).map(e=>`<div class="combat-entry ${e.type}"><span class="event-icon">${{attack:'⚔',critical:'✦',hurt:'♥',heal:'✚',gold:'◈',notice:'◇'}[e.type]||'◇'}</span><span class="${e.math?'math-detail':''}" ${e.math?`tabindex="0" data-math="${esc(e.math)}"`: ''}>${esc(e.message)}<small>Run ${e.run} · ${new Date(e.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</small></span></div>`).join('')||'<p class="tiny">Your attacks, enemy retaliation, healing and rewards will appear here.</p>'}</div></section>`
}

function manaView(){
  let c=calc();
  return `<div class="row tiny"><span>MANA</span><span>${s.mana} / ${c.mana}</span></div><div class="bar mana"><i style="width:${s.mana/c.mana*100}%"></i></div>`
}

function abilityView(){
  return `<div class="abilities">${Object.entries(abilityDefs()).filter(([id,a])=>a.class===s.class).map(([id,a])=>`<button class="${isSupport(id)?'support-ability':'offensive-ability'}" data-ability="${id}" onclick="combatAction('${id}')" ${canAbility(id)?'':'disabled'}><b>${['magicMissile','earthSpike','mirror'].includes(id)?'<span class="ability-status-icon">'+combatMenuIcon(id)+'</span>':''}${a.name} · ${a.cost} mana</b><small>${a.desc}</small>${isSupport(id)?'<span class="support-label">✧ SUPPORT · NO RETALIATION</span>':'<span class="ability-label">ATTACK · ENEMY RETALIATES</span>'}</button>`).join('')}</div>`
}

function bossWarning(){
  if(!s.enemy?.boss||s.rewardPopup)return '';
  const a=bossSpecial(),due=((s.enemy.attacks||0)+1)%3===0,casting=s.flow?.visual;
  return `<details class="boss-warning ${due||casting?'imminent':''}"><summary>${casting?'⚠ Casting':due?'⚠ Incoming':'Next special in '+(3-(s.enemy.attacks||0)%3)+' strikes'} · ${s.enemy.discoveredSpecial||due||casting?esc(a.name):'Unknown power'}</summary><small>${s.enemy.discoveredSpecial||due||casting?a.desc:'You have not seen this guardian’s special yet.'}</small></details>`
}

function rewardView(){
  const r=s.rewardPopup,boss=s.complete||r?.boss;
  const name=r?.name||locations[s.loc].enemies[3];
  const loot=r?.item?`<div class="loot-reveal"><span class="${r.item.rarity}">${r.item.rarity.toUpperCase()} FIND</span><button type="button" class="loot-compare-trigger" aria-describedby="victoryGearCompare" aria-expanded="false"><strong>${esc(r.item.name)}</strong><small>${esc(itemDescription(r.item))}</small><small class="loot-compare-hint">Hover or focus to compare with equipped gear</small></button>${itemCanBeEquipped(r.item)?`<button class="loot-equip" onclick="equipItem('${esc(r.item.id)}')" ${isItemEquipped(r.item.id)?'disabled':''}>${isItemEquipped(r.item.id)?'Equipped':'Equip before next encounter'}</button>`:r.item.slot==='weapon'&&r.item.kind!=='staff'?'<small>The Mage cannot equip this weapon.</small>':''}</div>`:'';
  const rewards=r?`<div class="reward-values"><span>✧ ${r.xp?'+'+r.xp+' XP':'Maximum level'}</span>${r.relics?`<span class="reward-gold reward-relic-icon">${relicIconMarkup(true)} +${r.relics} Aether Relic${r.relics===1?'':'s'}</span>`:'<small>No Aether Relic dropped</small>'}${r.gold?`<span class="reward-gold">◈ +${r.gold} gold banked</span>`:''}</div>${loot}`:'';
  const comparison=r?.item?`<div class="victory-compare-overlay" hidden>${itemComparisonView(r.item,'victoryGearCompare')}</div>`:'';
  return `<div class="victory-result-layer"><div class="victory-result-shade"></div><section class="reward-summary victory-result-dialog" role="dialog" aria-modal="true" aria-labelledby="victoryResultTitle"><div class="victory-result-emblem" aria-hidden="true">${boss?'♛':'✧'}</div><div class="eyebrow">${boss?'Guardian vanquished':'Encounter won'}</div><h2 id="victoryResultTitle">${boss?'Dungeon cleared':'Victory'}</h2><p class="victory-result-subtitle">${esc(name)} defeated.</p>${rewards}<p class="victory-result-note">${boss?'The boss has secured your recovered Aether Relics and banked its gold bounty. Return to Greyhaven to open or sell them.':'Any pending Aether Relics are lost if you flee or die. Defeat the boss to secure them.'}</p>${s.dungeon?`<button id="victoryContinue" class="primary" onclick="continueEncounter()">Return to dungeon tiles →</button>`:boss?`<button id="victoryContinue" class="primary" onclick="finishBossVictory('home')">Return to Greyhaven · Aether Relics secured</button><button onclick="finishBossVictory('again')">Go again · Continue adventuring</button><p class="tiny">No new travel fare. Health and mana carry over.</p>`:`<button id="victoryContinue" class="primary" onclick="continueEncounter()">Return to dungeon tiles →</button><button onclick="returnHome(true)">Flee · Lose pending Aether Relics · Keep XP</button>`}</section>${comparison}</div>`;
}

let victoryCompareCloseTimer=0,victoryComparePinned=false,victoryCompareListenersReady=false;
function positionVictoryComparison(trigger,overlay,popup){
  const arena=trigger.closest('.arena');if(!arena)return;
  const area=overlay.getBoundingClientRect(),item=trigger.getBoundingClientRect();
  popup.style.width=Math.max(0,Math.min(460,area.width-24))+'px';
  const width=popup.offsetWidth,height=popup.offsetHeight;
  const idealLeft=item.left-area.left+(item.width-width)/2;
  const left=Math.max(12,Math.min(area.width-width-12,idealLeft));
  const above=item.top-area.top-height-6;
  const below=item.bottom-area.top+6;
  const top=above>=10?above:Math.max(10,Math.min(area.height-height-10,below));
  popup.style.left=left+'px';popup.style.top=top+'px';
}
function setupVictoryItemComparison(){
  const trigger=document.querySelector('.loot-compare-trigger'),overlay=document.querySelector('.victory-compare-overlay'),popup=overlay?.querySelector('.gear-compare');
  if(!trigger||!overlay||!popup)return;
  const show=()=>{clearTimeout(victoryCompareCloseTimer);overlay.hidden=false;trigger.setAttribute('aria-expanded','true');positionVictoryComparison(trigger,overlay,popup)};
  const close=()=>{overlay.hidden=true;trigger.setAttribute('aria-expanded','false')};
  const scheduleClose=()=>{clearTimeout(victoryCompareCloseTimer);victoryCompareCloseTimer=setTimeout(()=>{if(victoryComparePinned||trigger.matches(':hover')||popup.matches(':hover')||document.activeElement===trigger)return;close()},240)};
  if(!trigger.dataset.compareBound){
    victoryComparePinned=false;
    trigger.dataset.compareBound='true';
    trigger.addEventListener('pointerenter',show);trigger.addEventListener('pointerleave',scheduleClose);
    trigger.addEventListener('focus',show);trigger.addEventListener('blur',scheduleClose);
    trigger.addEventListener('click',()=>{victoryComparePinned=!victoryComparePinned;if(victoryComparePinned)show();else close()});
    popup.addEventListener('pointerenter',()=>clearTimeout(victoryCompareCloseTimer));popup.addEventListener('pointerleave',scheduleClose);
    overlay.addEventListener('pointerdown',event=>{if(event.target===overlay){victoryComparePinned=false;close()}});
  }
  if(!victoryCompareListenersReady){
    victoryCompareListenersReady=true;
    document.addEventListener('pointerdown',event=>{const active=document.querySelector('.victory-compare-overlay:not([hidden])'),activeTrigger=document.querySelector('.loot-compare-trigger');if(active&&activeTrigger&&!active.contains(event.target)&&!activeTrigger.contains(event.target)){victoryComparePinned=false;active.hidden=true;activeTrigger.setAttribute('aria-expanded','false')}});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){const active=document.querySelector('.victory-compare-overlay:not([hidden])'),activeTrigger=document.querySelector('.loot-compare-trigger');if(active&&activeTrigger){victoryComparePinned=false;active.hidden=true;activeTrigger.setAttribute('aria-expanded','false');activeTrigger.focus()}}});
    const reposition=()=>{const active=document.querySelector('.victory-compare-overlay:not([hidden])'),activeTrigger=document.querySelector('.loot-compare-trigger'),activePopup=active?.querySelector('.gear-compare');if(active&&activeTrigger&&activePopup)positionVictoryComparison(activeTrigger,active,activePopup)};
    window.addEventListener('resize',reposition);window.addEventListener('scroll',reposition,{passive:true});
    document.addEventListener('scroll',reposition,true);
  }
  if(!overlay.hidden)positionVictoryComparison(trigger,overlay,popup);
}

// Reuse the existing completion and banking actions; no extra reward is granted here.
function finishBossVictory(action){
  if(!s||s.dead||!['home','again'].includes(action)||!victoryReady())return;
  if(!s.complete){if(!s.rewardPopup?.boss)return;continueEncounter();}
  if(action==='home')returnHome(false);else goAgain();
}
function positionVictoryPopup(){
  const dialog=document.querySelector('.victory-result-dialog'),arena=dialog?.closest('.arena'),versus=arena?.querySelector('.versus');
  if(!dialog||!versus)return;
  const a=arena.getBoundingClientRect(),v=versus.getBoundingClientRect(),half=dialog.offsetHeight/2;
  dialog.style.top=Math.max(half+14,Math.min(a.height-half-14,v.top-a.top+v.height/2))+'px';
}
function focusVictoryPopup(){
  const dialog=document.querySelector('.victory-result-dialog');
  if(dialog&&!dialog.contains(document.activeElement)){
    document.getElementById('victoryContinue')?.focus({preventScroll:true});
    const rect=dialog.getBoundingClientRect();
    if(rect.top<12||rect.bottom>window.innerHeight-12)dialog.scrollIntoView({block:'center',behavior:'smooth'});
  }
}
function victoryPopupKeydown(event){
  const dialog=document.querySelector('.victory-result-dialog');
  if(!dialog||event.key!=='Tab')return;
  const buttons=Array.from(dialog.querySelectorAll('button:not(:disabled)')),first=buttons[0],last=buttons[buttons.length-1];
  if(!dialog.contains(document.activeElement)){event.preventDefault();first?.focus();}
  else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
}

function consumablesView(){
  let items=Object.entries(shopItems()).filter(([id,a])=>(s.inventory?.[id]||0)>0&&a.class!==s.class);
  if(!items.length)return '';
  return `<details class="panel consumables" open><summary>Adventurer’s pack</summary><div class="pack-items">${items.map(([id,a])=>`<button data-consumable="${id}" onclick="useItem('${id}')" ${canUseItem(id)?'':'disabled'}><b>${a.name} ×${s.inventory[id]}</b><small>${id==='potion'?'Restore 30 mana · Support':isSupport(id)?'Support · No retaliation':'Attack · Ends your turn'}</small></button>`).join('')}</div></details>`
}

