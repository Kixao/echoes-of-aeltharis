'use strict';

// Emberwild v0.1.29 — js/ui/journey.js

function journal(){
  return `<div class="panel log adventure-journal"><div class="eyebrow">Adventure journal</div><div class="journal-entries" role="log" aria-label="Adventure journal">${s.log.slice(0,80).map(t=>`<p>› &nbsp;${esc(t)}</p>`).join('')}</div></div>`
}

function journeyView(){
  return `${s.travel?travelView():city()?cityView():s.enemy||s.defeatPopup?battleView():dungeonView()}${mapView()}${s.enemy||s.defeatPopup?'':journal()}`
}

function mapView(){return expeditionPlannerView();}

function travelView(){
  const destination=locations[s.travel.to].name,index=Math.max(1,s.travel.to||s.loc)-1,region=TRAVEL_REGIONS[index];
  const remaining=Math.max(0,Math.ceil((s.travel.arrive-Date.now())/1000));
  return `<section id="emberwild-travel" aria-label="Travelling to ${esc(destination)}"><div class="window"><div class="travel-header"><div><div class="eyebrow">${s.travel.to?'Leaving Greyhaven':'Homeward bound'}</div><h2>Travelling to ${esc(destination)}</h2></div><span>Arriving in <b id="travelTime">${remaining}s</b></span></div><div class="scene ${region[1]} playing" role="img" aria-label="A hooded rider galloping through the moorlands toward the tomb"><div class="moonlight"></div><svg class="land far" viewBox="0 0 8400 330" preserveAspectRatio="none" aria-hidden="true">${travelSceneryLayer(index,'far')}</svg><svg class="land middle" viewBox="0 0 8400 330" preserveAspectRatio="none" aria-hidden="true">${travelSceneryLayer(index,'middle')}</svg><div class="mist"></div><div class="road"></div>${TRAVEL_RIDER}<svg class="land front" viewBox="0 0 8400 330" preserveAspectRatio="none" aria-hidden="true">${travelSceneryLayer(index,'front')}</svg><div class="vignette"></div></div><footer><div class="trip"><span>${s.travel.to?'Greyhaven':esc(locations[s.loc].name)} → ${esc(destination)}</span><span>Travel is safe</span></div><div class="track" role="progressbar" aria-label="Journey progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="fill"></div></div><p class="flavor">${s.travel.to?region[3]:'Greyhaven’s lanterns draw closer. Your journey home is almost over.'}</p></footer></div></section>`;
}
