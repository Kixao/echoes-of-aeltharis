'use strict';

const BUILD_VERSION='Alpha Version 1';

// Emberwild v0.1.29 — js/state.js

let defeatPresentation=null;

const $=s=>document.querySelector(s), STATS=['Intelligence','Strength','Agility','Luck','Vitality'], KEY='echoes-aeltharis-v1';

const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let s=null,tab='journey',selected=1,draft={name:'',class:'Mage',stats:[9,3,3,3,3],startAbility:null},toastTimer,landing=true;

let effects=[];

let popups=[];

let hitFX={enemy:false,player:false};

