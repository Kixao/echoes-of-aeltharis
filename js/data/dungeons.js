'use strict';

const bossPortraitFiles={};
function enemyBasicRanged(name){return name==='Ghost'||name==='Wraith';}
const locations=[
  {name:'Greyhaven',icon:'⌂',x:23,y:78,level:1,sub:'A guarded frontier city at the edge of the fallen kingdom.',enemies:[]},
  {name:'Sepulcher of the Forsaken',icon:'☽',x:67,y:36,level:1,sub:'Once a sacred resting place for the nobles, knights, and honored dead of Aeltharis, the Sepulcher was corrupted by the magical energies unleashed during the Calamity. Its ancient burial wards have long since failed, and its forgotten halls now teem with skeletal guardians, restless spirits, and other horrors. Few who venture into its depths return to tell the tale.',subtitle:'Aelthari Burial Ruin',mapIcon:'crypt',enemies:['Skeleton','Ghost','Wraith','The Ebon Sentinel'],travelRegion:'crypt'}
];
