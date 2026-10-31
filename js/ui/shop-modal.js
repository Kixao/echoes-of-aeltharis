'use strict';
// Main Street shop dialogs. Source-of-truth remains in each existing shop module;
// modalOpen controls only presentation, not inventory, currency or progression.
const SHOP_MODAL_TITLES={blacksmith:'Blacksmith',studies:'Arcane Studies',mysteries:'Magical Mysteries'};
let shopModalOpen=null,shopModalScroll=0;
function openShopModal(kind){
 if(!SHOP_MODAL_TITLES[kind]||!s||landing||!city()||s.dead||s.travel||s.eventPopup||dungeonEntering||expeditionPlannerOpen||inventoryOpen)return false;
 if(shopModalOpen===kind)return true;
 shopModalOpen=kind;shopModalScroll=0;tab='journey';render();
 document.getElementById('shopModalClose')?.focus({preventScroll:true});return true;
}
function closeShopModal(event){
 event?.preventDefault();
 if(!shopModalOpen)return;
 const old=shopModalOpen;shopModalOpen=null;shopModalScroll=0;
 if(old==='blacksmith')closeSmithCheckout();
 if(old==='mysteries')closeMysteriesBeltConfirm();
 const d=document.getElementById('eoaShopDialog');if(d?.open)d.close();d?.remove();
 document.getElementById(old==='blacksmith'?'mainBlacksmithEntry':old==='studies'?'mainStudiesEntry':'mainMysteriesEntry')?.focus({preventScroll:true});
}
function shopModalView(){
 if(!shopModalOpen||!city())return '';
 const kind=shopModalOpen;
 const html=kind==='blacksmith'?blacksmithView():kind==='studies'?arcaneStudiesView():magicalMysteriesView();
 // Existing Return button becomes a second, contextual close button inside the shop.
 const content=html.replace(/onclick="setTab\('journey'\)">← Return to Main Street/g,'onclick="closeShopModal()">Close Shop');
 return `<dialog id="eoaShopDialog" class="eoa-shop-dialog" aria-label="${SHOP_MODAL_TITLES[kind]}" oncancel="closeShopModal(event)" onclick="if(event.target===this)closeShopModal()"><div class="eoa-shop-dialog-head"><span>${SHOP_MODAL_TITLES[kind]} · Greyhaven</span><button type="button" id="shopModalClose" onclick="closeShopModal()" aria-label="Close ${SHOP_MODAL_TITLES[kind]}">×</button></div><div class="main eoa-location-main eoa-shop-dialog-body">${content}</div></dialog>`;
}
function mountShopModal(){
 const d=document.getElementById('eoaShopDialog');if(!d||!shopModalOpen)return;
 if(!d.open){d.showModal();d.scrollTop=shopModalScroll;}
 d.addEventListener('scroll',()=>{shopModalScroll=d.scrollTop;},{passive:true});
}
