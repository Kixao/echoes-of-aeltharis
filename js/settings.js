'use strict';

function openSettings(){
  if(!s)return;
  const admin=document.getElementById('adminModal');
  if(admin&&!admin.hidden)closeAdmin();
  const modal=document.getElementById('settingsModal');
  modal.hidden=false;
  document.querySelector('.settings-dialog button[aria-label="Close settings"]')?.focus();
}

function closeSettings(){
  const modal=document.getElementById('settingsModal');
  if(!modal||modal.hidden)return;
  modal.hidden=true;
  document.getElementById('settingsToggle')?.focus();
}

function returnToTitleFromSettings(){
  closeSettings();
  openTitleScreen();
}

function deleteFromSettings(){
  closeSettings();
  deleteCharacter();
}

function settingsKeydown(event){
  const modal=document.getElementById('settingsModal');
  if(!modal||modal.hidden)return;
  if(event.key==='Escape'){
    event.preventDefault();
    closeSettings();
    return;
  }
  if(event.key!=='Tab')return;
  const nodes=[...modal.querySelectorAll('button:not(:disabled)')];
  if(!nodes.length)return;
  const first=nodes[0],last=nodes[nodes.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
}

document.addEventListener('keydown',settingsKeydown);
document.getElementById('settingsModal').addEventListener('click',event=>{
  if(event.target.id==='settingsModal')closeSettings();
});
