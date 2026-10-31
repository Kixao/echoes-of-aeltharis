'use strict';

// Legacy expedition XP ledger retained for old-save compatibility.
// Active Tier 1 adapters preserve all earned XP on retreat and death.
function beginExpeditionXP() {
  s.expeditionXPBase={level:s.level,xp:s.xp,points:s.points};
  s.runXP=0;
}
function ensureExpeditionXP() {
  if (!s.expeditionXPBase) beginExpeditionXP();
}
function bankExpeditionXP() {
  s.expeditionXPBase=null;
  s.runXP=0;
}
function forfeitExpeditionXP() {
  const lostXP=s.runXP||0, base=s.expeditionXPBase;
  const lostLevels=base?Math.max(0,s.level-base.level):0;
  if(base){s.level=base.level;s.xp=base.xp;s.points=base.points;}
  bankExpeditionXP();
  return {lostXP,lostLevels};
}
function restoreExpeditionFields(raw,out,fail) {
  const whole=(n,max=1e12)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
  out.runXP=raw.runXP??0;
  if(!whole(out.runXP))fail();
  out.expeditionXPBase=null;
  if(raw.expeditionXPBase!=null){
    const b=raw.expeditionXPBase;
    if(!b||!whole(b.level,MAX_LEVEL)||b.level<1||b.level>out.level||!whole(b.xp)||!whole(b.points,MAX_LEVEL-1)||b.points+out.perks.reduce((a,v)=>a+v,0)!==b.level-1||b.level===MAX_LEVEL&&b.xp!==0||b.level<MAX_LEVEL&&b.xp>=100+b.level*40)fail();
    out.expeditionXPBase={level:b.level,xp:b.xp,points:b.points};
  }else if(out.runXP!==0)fail();
  out.defeatPopup=null;
  if(raw.defeatPopup!=null){
    const d=raw.defeatPopup;
    if(!d||!out.dead||out.hp!==0||!out.enemy||out.enemy.hp<=0||!out.loc||out.travel||out.complete||out.pending||out.rewardPopup||out.runGold!==0||out.runXP!==0||out.expeditionXPBase||raw.flow!=null||d.enemy!==out.enemy.name||!whole(d.lostGold)||!whole(d.lostXP)||!whole(d.lostLevels,29)||!Number.isFinite(d.readyAt)||d.readyAt<0||d.readyAt>1e15||typeof d.shown!=='boolean')fail();
    out.defeatPopup={enemy:d.enemy,lostGold:d.lostGold,lostXP:d.lostXP,lostLevels:d.lostLevels,readyAt:d.readyAt,shown:d.shown};
  }
  // Existing v3 expeditions have no ledger. Treat progress already earned in
  // those saves as banked, then track future rewards from this point onward.
  if(!out.dead&&!out.expeditionXPBase&&(out.loc>0||out.travel?.to>0))out.expeditionXPBase={level:out.level,xp:out.xp,points:out.points};
}
