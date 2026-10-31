'use strict';

// Emberwild v0.1.29 — js/status-effects.js

const STATUS_INFO={
 feared:{name:'Feared',icon:'feared',detail:'Dodge chance is reduced by 10 percentage points. Expires after the following enemy turn.'},
 mirror:{name:'Mirror Images',icon:'mirror',detail:'Increases dodge chance by 20% for the rest of the encounter.'},
 shout:{name:'Battle Shout',icon:'shout',detail:'Increases attack damage by 25% for the rest of the encounter.'},
 mark:{name:'Hunter’s Mark',icon:'mark',detail:'Adds bonus damage to each hit against the marked enemy, based on Agility. For the rest of the encounter.'},
 shades:{name:'Spectral Shades',icon:'shades',detail:'Grants 25% dodge chance. Expires after the following enemy turn.'},
 overheat:{name:'Overheated',icon:'overheat',detail:'Next basic attack deals 50% less damage, then this expires.'},
 oil:{name:'Crystal Oil',icon:'oil',detail:'Reduces dodge chance by 15% per stack, up to 2 stacks. One stack expires after each subsequent enemy turn.'},
 thorns:{name:'Thorn Barrier',icon:'thorns',detail:'Absorbs damage. Each damaging hit fires thorns for 25% basic damage, including the breaking hit. Lasts until broken; does not stack.'},
 fire:{name:'Fire Barrier',icon:'fire',detail:'Absorbs damage. Each damaging hit fires a bead for 25% basic damage, including the breaking hit. Expires when broken or at the next special; does not stack.'}
};

const STATUS_ICON_COLORS={"feared": "#C084FC", "mirror": "#8B5CF6", "shout": "#F59E0B", "mark": "#EF4444", "shades": "#A78BFA", "overheat": "#FB923C", "oil": "#38BDF8", "thorns": "#84CC16", "fire": "#F97316"};

function statusIcon(id){
  const paths={feared:'<path d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7z"/><path d="M8 11c0-1 2-2 3-1m5 1c0-1-2-2-3-1M8 17c2-2 6-2 8 0"/>',mirror:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20v-2.5a6.5 6.5 0 0 1 13 0V20zM15 14a5.5 5.5 0 0 1 6.5 5.5V20h-4"/>',shout:'<path d="M4 9h5l10-5v16L9 15H4zM9 15l2 6M22 8v8"/>',mark:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v5m0 12v5M1 12h5m12 0h5"/>',shades:'<path d="M5 21V9a7 7 0 0114 0v12l-4-3-3 3-3-3z"/><path d="M9 10v2m6-2v2"/>',overheat:'<path d="M10 14V5a2 2 0 014 0v9a5 5 0 11-4 0zM12 8v9M4 4l2 2m12-2l2-2"/>',oil:'<path d="M12 2C9 7 5 10 5 15a7 7 0 0014 0c0-5-4-8-7-13zM8 16q0 3 3 3"/>',thorns:'<path d="M12 22V11m0 6c-5 0-8-3-8-8 5 0 8 3 8 8zm0-5c0-5 3-8 8-8 0 5-3 8-8 8z"/>',fire:'<path d="M12 2l8 4v7q-1 6-8 9-7-3-8-9V6zM12 7q6 6 2 10-7 2-5-5l2 2z"/>',heal:'<path d="M12 21L3 12C-2 4 7 0 12 7c5-7 14-3 9 5zM8 12h8m-4-4v8"/>'};
  return '<svg viewBox="0 0 24 24" fill="none" stroke="'+(STATUS_ICON_COLORS[id]||'currentColor')+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[id]||paths.heal)+'</svg>'
}

function effectList(target){
  if(!s)return [];
  if(target==='enemy')return s.enemy?(s.enemy.statuses||(s.enemy.statuses=[])):[];
  return s.statuses||(s.statuses=[])
}

function getStatus(target,id){
  return effectList(target).find(x=>x.id===id)
}

function putStatus(target,id,values={}){
  const list=effectList(target);
  let found=list.find(x=>x.id===id);
  if(!found){
    found={id};
    list.push(found)
  }
  Object.assign(found,values);
  return found
}

function dropStatus(target,id){
  const list=effectList(target),i=list.findIndex(x=>x.id===id);
  if(i>=0)list.splice(i,1)
}

function statusEffectsView(target){
  let list=effectList(target).map(x=>({...x}));
  if(target==='player'){
    if(s.buffs?.mirror)list.unshift({id:'mirror'});
    if(s.buffs?.shout)list.unshift({id:'shout'})
  }else if(s.enemy?.mark)list.unshift({id:'mark',bonus:s.enemy.mark});
  return `<div class="battle-status-row" aria-label="${target==='enemy'?'Enemy':'Player'} status effects">${list.filter(x=>STATUS_INFO[x.id]).map(x=>{
    const a=STATUS_INFO[x.id];
    const stacks=Number(x.stacks)||0;
    const stackLabel=stacks>1?'×'+stacks:'';
    return `<button type="button" class="battle-status ${['oil','overheat','mark','feared'].includes(x.id)?'debuff':''}" data-status="${esc(a.name+': '+a.detail)}" data-math="${esc(a.name+': '+a.detail)}" aria-label="${esc(a.name+(stackLabel?': '+stacks+' stacks':'')+'. '+a.detail)}">${statusIcon(a.icon)}${stackLabel?`<span class="status-stack-count">${stackLabel}</span>`:''}</button>`
  }).join('')}${target==='player'?expeditionStatusButtons():''}</div>`
}


// Expedition modifiers are the source of truth for both calculations and icons.
function expeditionStatusButtons(){
 const labels={attack:'Attack damage',armor:'Armor',resistance:'Resistance',intelligence:'Intelligence',strength:'Strength',agility:'Agility',luck:'Luck',vitality:'Vitality',manaRegen:'Mana regeneration'};
 const icons={attack:'shout',armor:'fire',resistance:'shades',intelligence:'mirror',strength:'shout',agility:'thorns',luck:'mark',vitality:'heal',manaRegen:'oil'};
 return Object.entries(s?.eventMods||{}).filter(([key,value])=>labels[key]&&value!==0).map(([key,value])=>{
 const detail=`${labels[key]} ${value>0?'+':''}${value}${key==='manaRegen'?' mana after each enemy turn':''}. Lasts until you leave this expedition or begin another dungeon level.`;
 return `<button type="button" class="battle-status expedition-status ${value<0?'debuff':''}" data-status="${esc(detail)}" data-math="${esc(detail)}" aria-label="${esc(detail)}">${statusIcon(icons[key])}<span class="status-stack-count">${value>0?'+':''}${value}</span></button>`;
 }).join('');
}
