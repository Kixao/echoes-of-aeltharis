
    function mountDungeon(){
      if(!document.getElementById("sepulcher-enemy-symbol-restored"))return;
      const root=document.getElementById('sepulcher-enemy-symbol-restored'),grid=root.querySelector('#tile-door-grid'),action=root.querySelector('#tile-door-action');
      const cols=8,rows=6,icons={entrance:'door',combat:'enemy',treasure:'chest',boss:'boss'};
      const enemies={skeleton:['Bonebound Guard','Grave Watcher','Tomb Guard'],ghost:['Pale Mourner','Restless Spirit','The Veiled Dead'],wraith:['Ashen Wraith','Wraith of the Vow']};
      const eventData={
        lore:{label:'Lore',short:'LORE',icon:'lore',names:['Aelthari Epitaph','Fragment of the Chronicle','Testament of the Unquiet'],action:'Read the Inscription',description:'An inscription preserves a fragment of the forgotten kingdom.'},
        skill:{label:'Skill Challenge',short:'SKILL',icon:'skill',names:['Collapsed Causeway','Balance of the Tomb','Trial of the Ward'],action:'Attempt the Challenge',description:'A hazardous obstacle tests the party’s skills.'},
        puzzle:{label:'Puzzle',short:'PUZZLE',icon:'puzzle',names:['The Four Seals','Silent Tile Pattern','Crypt’s Lock'],action:'Solve the Puzzle',description:'An ancient mechanism waits for the right sequence.'},
        sacrifice:{label:'Sacrifice',short:'SACRIFICE',icon:'sacrifice',names:['The Bloodless Altar','Ashen Offering','Oathbound Shrine'],action:'Make an Offering',description:'A ritual asks the party to surrender something of value.'}
      };
      const eventTypes=Object.keys(eventData),treasures=['Reliquary at Rest','Knight’s Last Gift'];
      const directions=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];let expedition=(s.streak||0)+1,run=s.dungeon;
      const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,pick=a=>a[rand(0,a.length-1)],shuffle=a=>[...a].sort(()=>Math.random()-.5),key=(c,r)=>`${c},${r}`;
      const svgIcon=name=>name==='relic'?relicIconMarkup(false,'tile-relic-icon'):`<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><use href="#tile-door-${name}"/></svg>`;
      function makeMainRoute(){
        for(let attempt=0;attempt<800;attempt++){
          const start={c:rand(1,6),r:rand(1,4)},cells=[start],occupied=new Set([key(start.c,start.r)]);
          while(cells.length<7){const prev=cells[cells.length-1],options=shuffle(directions).filter(d=>{const c=prev.c+d.x,r=prev.r+d.y,k=key(c,r);if(c<0||c>=cols||r<0||r>=rows||occupied.has(k))return false;const adjacent=directions.map(v=>key(c+v.x,r+v.y)).filter(v=>occupied.has(v));return adjacent.length===1&&adjacent[0]===key(prev.c,prev.r)});if(!options.length)break;const d=options[0],next={c:prev.c+d.x,r:prev.r+d.y};cells.push(next);occupied.add(key(next.c,next.r))}
          if(cells.length===7)return cells;
        }
        return [{c:0,r:2},{c:1,r:2},{c:2,r:2},{c:3,r:2},{c:4,r:2},{c:5,r:2},{c:6,r:2}];
      }
      function buildLayout(){
        const eventCount=rand(2,3),treasureCount=rand(1,2),sideCount=eventCount+treasureCount+1,main=makeMainRoute(),rooms=[],edges=[],occupied=new Set(main.map(p=>key(p.c,p.r)));
        const ordinaryTypes=shuffle([...Array(6).fill('combat'),...Array(eventCount).fill('event')]),sideTypes=ordinaryTypes.splice(5);
        const makeRoom=(id,p,type,optional=false,eventOverride=null)=>{
          const enemyType=type==='combat'?pick(Object.keys(enemies)):null;
          let kind=type==='event'?(eventOverride||pick(eventTypes)):icons[type];
          let name=type==='entrance'?'The Drowned Arch':type==='boss'?'Unknown Guardian Vault':type==='combat'?pick(enemies[enemyType]):type==='event'?pick(eventData[kind].names):treasures.pop()||'Sealed Reliquary';
          return {id,c:p.c,r:p.r,type,kind,enemyType,eventType:type==='event'?kind:null,optional,name,revealed:type==='entrance',cleared:type==='entrance'};
        };
        rooms.push(makeRoom('entry',main[0],'entrance'));
        for(let i=0;i<5;i++){const id=`main-${i}`;rooms.push(makeRoom(id,main[i+1],ordinaryTypes[i]));edges.push({a:i===0?'entry':`main-${i-1}`,b:id,optional:false})}
        rooms.push(makeRoom('boss',main[6],'boss'));edges.push({a:'main-4',b:'boss',optional:false});
        const branchCount=Math.min(rand(2,3),sideCount),lengths=Array(branchCount).fill(1);for(let i=branchCount;i<sideCount;i++)lengths[rand(0,branchCount-1)]++;
        const treasureBranches=new Set(shuffle(Array.from({length:branchCount},(_,i)=>i)).slice(0,treasureCount)),anchors=shuffle(main.map((p,i)=>({p,i})).slice(1,6));let lastAnchor=-9,failed=false;
        for(let branch=0;branch<branchCount;branch++){
          let anchor=null;
          for(const candidate of anchors){if(Math.abs(candidate.i-lastAnchor)<2)continue;const anchorKey=key(candidate.p.c,candidate.p.r),options=shuffle(directions).filter(d=>{const c=candidate.p.c+d.x,r=candidate.p.r+d.y,k=key(c,r);if(c<0||c>=cols||r<0||r>=rows||occupied.has(k))return false;const touching=directions.map(v=>key(c+v.x,r+v.y)).filter(v=>occupied.has(v));return touching.length===1&&touching[0]===anchorKey});if(options.length){anchor={...candidate,d:options[0]};break}}
          if(!anchor){failed=true;break}lastAnchor=anchor.i;let previous=anchor.i===0?'entry':`main-${anchor.i-1}`,parent={c:anchor.p.c,r:anchor.p.r};
          for(let step=1;step<=lengths[branch];step++){const p={c:parent.c+anchor.d.x*step,r:parent.r+anchor.d.y*step},cell=key(p.c,p.r);if(p.c<0||p.c>=cols||p.r<0||p.r>=rows||occupied.has(cell)){failed=true;break}const adjacent=directions.map(d=>key(p.c+d.x,p.r+d.y)).filter(v=>occupied.has(v)),expected=key(parent.c+anchor.d.x*(step-1),parent.r+anchor.d.y*(step-1));if(adjacent.length!==1||adjacent[0]!==expected){failed=true;break}const last=step===lengths[branch],type=last&&treasureBranches.has(branch)?'treasure':sideTypes.pop(),id=`side-${branch}-${step}`;if(!type){failed=true;break}rooms.push(makeRoom(id,p,type,true,last&&type==='event'?'lore':null));occupied.add(cell);edges.push({a:previous,b:id,optional:true});previous=id}
          if(failed)break;
        }
        return failed||rooms.length!==7+sideCount||sideTypes.length?null:{rooms,edges,selected:'entry',complete:false};
      }
      function generate(){let next=null;for(let i=0;i<300&&!next;i++)next=buildLayout();if(!next)return;run=next;s.dungeon=run;assignDungeonEvents(run);save();draw()}
      const room=id=>run.rooms.find(r=>r.id===id),links=id=>run.edges.filter(e=>e.a===id||e.b===id).map(e=>e.a===id?e.b:e.a);
      function unlocked(r){return !r.revealed&&run.rooms.some(source=>source.cleared&&links(source.id).includes(r.id))}
      let entryBusy=false;
      function enterRoom(r){
        if(entryBusy||dungeonEntering||!unlocked(r)||s.eventPopup||s.enemy)return;
        entryBusy=true;dungeonEntering=true;
        const fade=document.createElement('div');fade.className='dungeon-screen-fade';fade.setAttribute('aria-hidden','true');
        const elements=[...document.body.children].map(el=>({el,inert:el.inert}));
        elements.forEach(({el})=>el.inert=true);document.body.append(fade);
        setTimeout(()=>{
          r.revealed=true;run.selected=r.id;run.active=r.id;
          elements.forEach(({el,inert})=>el.inert=inert);
          entryBusy=false;dungeonEntering=false;
          try{startTileEncounter(r)}finally{fade.remove()}
        },500);
      }
      function draw(){
        grid.innerHTML='<svg class="routes" viewBox="0 0 800 600" preserveAspectRatio="none" aria-hidden="true"></svg>';const pathSvg=grid.querySelector('.routes');
        for(const e of run.edges){const a=room(e.a),b=room(e.b),p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',`M ${(a.c+.5)*100} ${(a.r+.5)*100} L ${(b.c+.5)*100} ${(b.r+.5)*100}`);p.setAttribute('class','route'+(e.optional?' optional':'')+(a.cleared||b.cleared?' opened':''));pathSvg.append(p)}
        const at=new Map(run.rooms.map(r=>[key(r.c,r.r),r]));
        for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
          const r=at.get(key(x,y)),b=document.createElement('button');b.type='button';b.className='cell cursor-interaction';b.style.gridColumn=String(x+1);b.style.gridRow=String(y+1);
          if(!r){b.classList.add('blank');b.disabled=true;b.setAttribute('aria-hidden','true');grid.append(b);continue}
          const hidden=!r.revealed,open=unlocked(r),selected=r.id===run.selected;b.classList.add('placed',r.optional?'optional-path':'main-path');if(r.type==='boss')b.classList.add('boss-mark');if(r.type==='entrance')b.classList.add('entry');if(selected)b.classList.add('selected');if(r.cleared&&r.type!=='entrance')b.classList.add('cleared');if(open)b.classList.add('available');
          const canSelect=r.revealed||open||r.type==='boss';b.disabled=!canSelect;
          const glyph=hidden?(r.type==='boss'?'boss':'shroud'):r.cleared&&r.relicDrop?'relic':r.type==='event'?eventData[r.eventType].icon:r.kind,label=hidden?(r.type==='boss'?'BOSS':''):r.type==='entrance'?'ENTRY':r.type==='boss'?'BOSS':r.type==='combat'?'ENEMY':r.type==='event'?eventData[r.eventType].short:r.cleared&&r.relicDrop?'AETHER RELIC':'TREASURE';
          const spoken=hidden?(r.type==='boss'?'Unknown boss chamber':'Sealed chamber'):`${r.type==='boss'?'Unknown boss chamber':r.type==='event'?eventData[r.eventType].label+': '+r.name:r.name}${r.cleared?(r.relicDrop?', relic found':', resolved'):''}${r.optional?', optional branch':''}`;b.setAttribute('aria-label',`${spoken}${open?', available to explore':''}`);
          b.innerHTML=`<span class="chamber"><span class="glyph">${svgIcon(glyph)}</span>${hidden?'<span class="fog" aria-hidden="true"></span>':''}${label?`<span class="nameplate">${label}</span>`:''}</span>`;
          b.addEventListener('click',()=>{if(open){run.selected=r.id;enterRoom(r)}else{run.selected=r.id;draw()}});grid.append(b);
        }
        const statuses=root.querySelector('.dungeon-status-effects');
        statuses.innerHTML=expeditionStatusButtons();
        root.querySelector('.dungeon-status-section').hidden=!statuses.innerHTML;
        details();
      }
      function details(){
        const r=room(run.selected),hidden=!r.revealed,boss=r.type==='boss',open=unlocked(r);root.querySelector('#tile-door-kind').textContent=hidden?(boss?'Unknown boss chamber':r.optional?'Optional passage':'Main route chamber'):r.type==='entrance'?'Entrance':r.type==='event'?eventData[r.eventType].label:r.optional?`Optional ${r.type==='combat'?'encounter':r.type}`:r.type==='combat'?'Combat encounter':r.type;
        root.querySelector('#tile-door-name').textContent=hidden?(boss?'Unknown Guardian Vault':r.optional?'Sealed Side Chamber':'Sealed Chamber'):r.name;root.querySelector('#tile-door-icon').innerHTML=svgIcon(hidden?(boss?'boss':'shroud'):r.cleared&&r.relicDrop?'relic':r.kind);
        const dot=root.querySelector('#tile-door-dot');dot.className='status-dot'+(hidden?' fogged':'')+(r.optional?' side':'');root.querySelector('#tile-door-state').textContent=hidden?(boss?(open?'Boss chamber unlocked · identity unknown':'Boss location · sealed'):open?'Unexplored · ready to reveal':'Unexplored chamber'):r.cleared?'Explored · resolved':r.type==='combat'?'Encounter · unresolved':r.type==='entrance'?'Entrance · explored':`${r.type} · unresolved`;
        const relicsHeld=run.complete?run.rooms.filter(room=>room.relicDrop).length:(s.pendingRelics||0);
        const relicBadge=root.querySelector('#dungeonRelicsHeld');
        relicBadge.hidden=relicsHeld<1;
        relicBadge.innerHTML=relicsHeld>0?`${relicIconMarkup(false,'dungeon-held-icon')}<strong>${relicsHeld}</strong>`:'';
        relicBadge.title=run.complete?'Aether Relics secured from this dungeon':'Aether Relics recovered this dungeon · secure by defeating the boss';
        relicBadge.setAttribute('aria-label',`${relicsHeld} Aether Relic${relicsHeld===1?'':'s'} ${run.complete?'secured':'pending'} in this dungeon`);
        root.querySelector('#tile-door-copy').textContent=hidden?(boss?open?'The seal is open. The guardian within remains unknown.':'The golden skull marks the end of the main route. The occupant is hidden.':open?`This chamber is ready to uncover. ${r.optional?'It lies on an optional branch.':'It lies on the route to the boss.'}`:`This chamber is veiled. ${r.optional?'The blue-green branch is optional.':'It lies along the amber route.'}`):r.type==='entrance'?'Choose any newly unlocked neighboring tile to reveal it. The expedition advances through selections, without tile-to-tile movement.':boss?(run.complete?'The unknown guardian is defeated. The expedition is complete.':'The vault opens onto an unknown guardian.') :r.type==='combat'?`${r.name} guards the burial halls.`:r.type==='event'?eventData[r.eventType].description:r.type==='treasure'?(r.cleared?'A sealed relic was recovered from this burial coffer.':'A burial coffer waits at the dead end of this optional passage.'):`A remnant of the old wards marks this ${r.optional?'optional':'main-route'} chamber.`;
        root.querySelector('#dungeonPotionQuickbar').innerHTML=dungeonPotionControlsView();
        root.querySelector('#tile-door-note').textContent=r.optional?'Optional passages may hold an encounter, an event, or a treasure. Treasure is always at the end of its branch.':'Resolve this chamber to unlock connected tiles. Click the next tile directly on the map; there is no need to move onto this one.';
        action.hidden=!!r.cleared;action.disabled=false;
        if(hidden){action.textContent=open?'Explore Chamber':boss?'Sealed · Follow the Route':'Veiled · Explore an Open Tile';action.disabled=!open;action.onclick=()=>{if(!open)return;enterRoom(r)}}
        else if(!r.cleared){action.textContent='Continue encounter';action.onclick=()=>startTileEncounter(r)}
        else if(boss){action.textContent='Expedition Complete';action.disabled=true;action.onclick=null}
        else{action.textContent=r.type==='entrance'?'Entrance Explored':'Chamber Resolved';action.disabled=true;action.onclick=null}
        root.querySelector('#tile-door-run').innerHTML=expeditionStatus();root.querySelector('#tile-door-new-run').textContent=run.complete?'Return to Greyhaven':'Retreat from dungeon';
        root.querySelector('#dungeonContinuation').innerHTML=dungeonContinuationView();
        root.querySelector('#tile-door-count').innerHTML=`${run.rooms.filter(x=>x.revealed&&x.type!=='entrance').length} EXPLORED OUT OF ${run.rooms.filter(x=>x.type!=='entrance').length} CHAMBERS`;
      }
      root.querySelector('#tile-door-new-run').addEventListener('click',()=>returnHome(!s.complete));if(!run)generate();else draw();
    }
