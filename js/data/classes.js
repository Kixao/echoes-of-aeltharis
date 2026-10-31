'use strict';

const MAX_LEVEL=5;
const classes={
  Mage:{primary:0,icon:'✧',basicAttack:'Arcane Blast',damageType:'magical',desc:'A scholar of Aeltharis who turns forgotten magic against the restless dead.',role:'Available · Arcane'}
};
const unavailableClasses=[
  {name:'Paladin',icon:'✦',desc:'A sworn protector whose light holds the dark at bay.'},
  {name:'Ranger',icon:'➶',desc:'A watchful pathfinder who knows every shadowed trail.'}
];
const perks={Mage:[['Arcane Study','Increase spell damage.','damage'],['Focused Mind','Sharpen the force of your magic.','focus'],['Illusory Step','Improve your chance to dodge.','dodge'],['Spell Echo','Increase damage dealt.','echo'],['Starfire','Improve critical strikes.','critPower'],['Precision Runes','Find weak points more often.','crit'],['Fortune','Improve item drop chance.','gold'],['Lifeweaving','Restore a little health after attacks.','heal'],['Focused Invocation','Increase attack damage.','strike'],['Archmage','Increase all damage.','master']]};
