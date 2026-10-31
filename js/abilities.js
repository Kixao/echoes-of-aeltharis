'use strict';

function abilityDefs(){return {earthSpike:{name:'Earth Spike',class:'Mage',cost:15,damageType:'physical',desc:'Erupt stone beneath your target for 150% base damage. Scales with Intelligence; deals Physical damage.'},magicMissile:{name:'Magic Missiles',class:'Mage',cost:15,damageType:'magical',desc:'Launch three darts. Each rolls to hit and critically strike independently; every hit deals 75% base magical damage.'},mirror:{name:'Mirror Images',class:'Mage',cost:10,desc:'+20% dodge this encounter'}}}
function canAbility(id,scroll=false){let a=abilityDefs()[id];if(!s||s.dead||!a||s.travel||city()||s.pending||combatBusy()||Date.now()<s.cooldown||s.complete||s.rewardPopup||!s.enemy)return false;if(scroll){if(a.class===s.class||!(s.inventory?.[id]>0))return false}else if(a.class!==s.class||s.mana<a.cost)return false;if(id==='mirror'&&s.buffs?.mirror)return false;return true}
function isSupport(id){return id==='mirror'}
function canUseItem(id){return canUseSatchelItem(id)}
function useItem(id){useSatchelItem(id)}
