'use strict';

// Emberwild v0.1.29 — js/effects.js

function combatEvent(message,type='notice',math=''){
  s.combatLog=s.combatLog||[];
  s.combatLog.unshift({message,type,math,time:Date.now(),run:(s.streak||0)+1});
  s.combatLog=s.combatLog.slice(0,80)
}

function combatFX(){
  popups=popups.filter(p=>Date.now()-p.time<3200);
  return popups.map((p,i)=>`<div class="combat-popup ${p.kind}-popup" role="status" style="top:${60+i*85}px;animation-delay:${(p.time-Date.now())/1000}s">${esc(p.title)}<small>${esc(p.sub)}</small></div>`).join('')
}

function addPopup(title,sub,kind,delay=0){
  popups=popups.filter(p=>Date.now()-p.time<3200);
  popups.push({title,sub,kind,time:Date.now()+delay});
  popups=popups.slice(-3)
}

let combatEffectSerial=0;
function addEffect(type,target,text=''){
  effects=effects.filter(e=>Date.now()-e.time<3000);
  effects.push({id:++combatEffectSerial,type,target,text,time:Date.now()});
  effects=effects.slice(-12)
}

function effectsView(target){
  return effects.filter(e=>e.target===target&&Date.now()-e.time<3000).map(e=>{
    let elapsed=(Date.now()-e.time)/1000;
    if(['mark','mirror','basic-warrior'].includes(e.type)||e.type==='boss-special'||e.type==='barrier-return'||e.type.startsWith('enemy-themed-')||isRangedVisual(e.type)&&target==='enemy'&&e.type!=='magic-missile')return '';
    if(e.type==='damage'||e.type==='heal'||e.type==='mana'){
      const matchedRanged=effects.find(f=>f.target==='enemy'&&isRangedVisual(f.type)&&Math.abs(f.time-e.time)<120);
      const delay=0;
      const recent=effects.filter(f=>f.type==='damage'&&f.target===target&&Date.now()-f.time<3000),slot=recent.indexOf(e),spread=e.type==='damage'&&recent.length>1;
      return `<span class="hitmarker ${e.type} ${delay?'ranged-damage':''}" style="animation-delay:${delay-elapsed}s;${spread?'font-size:24px;left:calc(50% + '+((slot%3-1)*44)+'px);top:calc(30% + '+(Math.floor(slot/3)*30)+'px)':''}">${esc(e.text)}</span>`
    }
    if(e.type==='magic-missile'&&target==='enemy')return (e.darts||[]).map((dart,index)=>{if(dart.contactAt==null)return '';const age=(Date.now()-dart.contactAt)/1000;if(age<0||age>1.1)return '';const outcome=!dart.hit?'miss':dart.mult>1?'critical':'hit';return `<span class="missile-outcome ${outcome}" role="status" aria-label="Magic Missile dart ${index+1}: ${outcome}" style="left:calc(50% + ${(index-1)*24}px);top:calc(8% + ${index*24}px);animation-delay:-${age}s">${!dart.hit?'× MISS':dart.mult>1?'✦ CRITICAL':'✦ HIT'}</span>`}).join('');
    ;
    if(e.type==='thunder')return `<span aria-hidden="true" class="spell-visual spell-thunder" style="animation-delay:-${elapsed}s">${spellVisual(e.type)}</span>`;
    if(['basic-warrior','basic-mage','basic-ranger'].includes(e.type))return `<span aria-hidden="true" class="basic-visual ${e.type}" style="animation-delay:-${elapsed}s">${basicVisual(e.type)}</span>`;
    let support=isSupport(e.type)||e.type==='mana-cast',basic=e.type.startsWith('basic-')||e.type==='enemy-basic',symbol={'mana-cast':'✧','magic-missile':'✧',thunder:'ϟ',mirror:'◈',shout:'❯',wind:'✚',mark:'⌖','boss-1':'❦','boss-2':'☽','boss-3':'⚒','boss-4':'❀','boss-5':'✹','boss-6':'≋','boss-7':'✸','basic-mage':'✧','basic-warrior':'╱','basic-ranger':'➶','enemy-basic':'╲'}[e.type]||'✦';
    return `<span aria-hidden="true" class="action-effect fx-${e.type} ${basic?'fx-basic':support?'fx-support':'fx-power'}" style="animation-delay:-${elapsed}s"><i>${symbol}</i><b></b></span>`
  }).join('')
}

function spellVisual(type){
  if(type==='thunder')return `<svg viewBox="0 0 220 110"><defs><filter id="thunderGlow"><feGaussianBlur stdDeviation="4"/></filter></defs><path class="thunder-trail" d="M4 55H174" stroke="#7ddcff" stroke-width="9" filter="url(#thunderGlow)"/><path d="M8 55H172" stroke="#e1faff" stroke-width="3"/><path d="M20 55L40 39L37 55L40 71Z" fill="#76aee9"/><path d="M158 44L205 55L158 66L169 55Z" fill="#f1faff"/><path d="M125 55L145 22L139 49L164 38L142 82L149 59Z" fill="#a4dfff"/></svg>`;
  return `<svg viewBox="0 0 220 130" class="ember-bead-svg"><defs><radialGradient id="emberBeadCore"><stop stop-color="#fffdf0"/><stop offset=".3" stop-color="#fff4ac"/><stop offset=".65" stop-color="#ffae32"/><stop offset="1" stop-color="#ff5811" stop-opacity="0"/></radialGradient><linearGradient id="emberTail" x1="1" x2="0"><stop stop-color="#ffbb43" stop-opacity=".85"/><stop offset="1" stop-color="#ff5c0d" stop-opacity="0"/></linearGradient></defs><path d="M32 65Q90 53 172 65Q90 77 32 65Z" fill="url(#emberTail)" opacity=".65"/><path d="M75 65Q125 60 174 65" stroke="#ff9a28" stroke-width="3" opacity=".85" stroke-linecap="round"/><circle cx="178" cy="65" r="17" fill="url(#emberBeadCore)"/><circle cx="178" cy="65" r="6" fill="#ffb62f"/><circle cx="177" cy="64" r="3.5" fill="#fffdec"/><g fill="#ffbd50"><circle cx="130" cy="57" r="2.5"/><circle cx="105" cy="70" r="2"/><circle cx="84" cy="62" r="1.6"/><circle cx="152" cy="73" r="2"/></g></svg>`
}

function basicVisual(type){
  if(type==='basic-warrior')return '<svg viewBox="0 0 180 180" aria-hidden="true"><path class="cleave-glow" d="M30 25Q155 35 145 135Q108 107 35 130Q110 75 30 25Z" fill="#ffd9a533"/><path class="cleave-edge" d="M30 25Q155 35 145 135" fill="none" stroke="#fff0da" stroke-width="9" stroke-linecap="round"/></svg>';
  if(type==='basic-mage')return '<svg viewBox="0 0 180 90" aria-hidden="true"><path d="M5 45L130 30L110 45L130 60Z" fill="#87aaff55"/><path d="M40 45H136" stroke="#9bcfff" stroke-width="5"/><ellipse cx="143" cy="45" rx="23" ry="16" fill="#74b8ff"/><ellipse cx="149" cy="45" rx="12" ry="8" fill="#effaff"/></svg>';
  return '<svg viewBox="0 0 180 90" aria-hidden="true"><path d="M25 45H145" stroke="#d7c69b" stroke-width="5"/><path d="M138 34L165 45L138 56Z" fill="#ecf1e2"/><path d="M42 45L20 29H38L59 45L38 61H20Z" fill="#a7c986"/></svg>'
}

