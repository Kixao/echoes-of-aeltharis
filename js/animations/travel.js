'use strict';

const TRAVEL_REGIONS=[['Sepulcher of the Forsaken','crypt',8,'Greyhaven falls away behind you. Cold mist parts to reveal a low stone entrance.','The tomb doors stand open. The dead have noticed your arrival.'],['Whispering Crypt','crypt',12,'Cold mist rolls over the moors. Somewhere beyond the road, a bell tolls.','Old oaths echo through cold stone.'],['Ironfang Mine','mine',16,'The road climbs into the mountains. A furnace glows beneath the stone.','A forgotten forge still burns.'],['Moonroot Grove','moon',20,'Silver leaves catch the moonlight. The ancient woodland watches your passing.','The ancient forest has teeth.'],['The Ashen Spire','fire',24,'Warm ash settles on your cloak. Beyond the ridge, the sky burns copper.','At the edge of the world, embers rise.'],['Glasswake Depths','coast',28,'Salt rides the wind. Pale crystal glimmers along the darkening shore.','A drowned kingdom beneath crystal waves.'],['Crown of Cinders','fire',32,'The earth is split with fire. Ahead lies the last light of the Sundering.','The final trial of the frontier.']];const treeShapes=[
'M-8 0-4-73-26-105-20-133-14-109 3-88 13-126 28-151 23-117 9-70 9 0ZM-4-58-37-73-55-101-32-87-12-83ZM6-41 34-64 48-99 44-62 13-27Z',
'M-13 0-7-45-22-74-36-79-45-102-24-93-12-78-7-116 2-143 7-116 3-81 25-99 40-98 23-88 9-63 12 0Z',
'M-10 0-3-67-20-87-46-80-62-91-43-91-15-101-10-123 2-153 6-116 25-128 43-122 22-115 9-96 12-67 5-47 13 0Z',
'M-9 0-5-87h12L11 0ZM-41-70Q-61-88-42-108Q-54-143-19-143Q-6-166 19-147Q50-154 48-123Q72-101 46-78Q15-64-41-70Z',
'M-12 0-5-72h12L14 0ZM-54-68Q-68-88-42-103Q-33-124-12-112Q3-135 26-112Q63-121 65-91Q83-74 53-63Z',
'M-7 0-3-101H4L8 0ZM-31-86 0-150 30-86 16-91 39-53 14-61 46-28H-45l30-33-24 8 23-38Z',
'M-16 0-10-61-29-84-20-100-1-86 8-116 18-122 13-89 32-93 44-80 25-82 10-57 13 0ZM-14-39-51-43-62-62-43-52-17-57Z',
'M-6 0-3-63h7L9 0ZM-21-63Q-40-79-21-92Q-32-116-10-124Q6-145 22-126Q44-107 29-89Q43-67 20-60Z',
'M-13 0-7-84H5L15 0ZM-47-74Q-69-113-41-133Q-27-167 3-143Q36-161 54-126Q77-107 57-78Q29-57-4-77Q-27-58-47-74Z'
];
const crystalShapes=[
'M-22 0-32-23-19-54-9-43-2-83 15-107 28-75 17 0ZM18 0 24-29 42-39 48-21 32 0Z',
'M-27 0-37-13-18-29 9-35 31-13 24 0ZM-6-32 3-68 18-74 26-52 15-32Z',
'M-12 0-9-83 6-120 21-83 15 0ZM-31 0-42-54-29-69-12-40-6 0Z',
'M-34 0-43-25-38-51-22-40-9-17-8-66 4-82 16-59 18-18 33-41 49-42 45-20 30 0Z',
'M-29 0-18-15-30-39-21-62-2-71 24-50 21-28 10-15 24 0ZM-8-20 5-35 7-52-8-48-13-35Z',
'M-40 0-21-32 5-38 20-24 35-40 51-14 38 0ZM-11-37-9-61 9-78 24-63 20-24Z'
];
function sceneryFor(region){const L=2800;let far='',mid='',near='',fx='';let seed=1009+region*997;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const shape=(d,e='')=>`<path d="${d}" ${e}/>`;
function ground(y,rough){let d=`M0 ${y}`;for(let x=70;x<L;x+=70)d+=`L${x} ${Math.round(y-rand()*rough)}`;return shape(d+`L${L} ${y}V330H0Z`);}
far+=ground(region===5?218:231,region===2||region===4||region===6?110:28);mid+=ground(279,22);near+=ground(326,9);
const place=(x,y,s,body,flip=false)=>`<g transform="translate(${x} ${y}) scale(${flip?-s:s} ${s})">${body}</g>`;
const tree=(x,y,s,kind)=>place(x,y,s,shape(treeShapes[kind]),rand()>.5);
const rock=(x,y,s,n)=>place(x,y,s,shape(['M-34 0-25-17-8-26 22-15 39 0Z','M-21 0-25-39-4-51 17-27 14 0Z','M-48 0-36-15-9-18 10-10 34-24 49 0Z','M-29 0-13-29 4-37 25-26 31 0Z'][n%4])+shape('M-15-18 1-25 17-14 5-8Z','fill="#b8c4bd" opacity=".1"'));
const crystal=(x,y,s,n)=>place(x,y,s,shape(crystalShapes[n%6],'fill="#8bc7c6" opacity=".55"')+shape('M0-61 5-32 0-4','fill="none" stroke="#c7efdf" opacity=".45"'));
// Different silhouettes and irregular spacing across a four-screen-long strip.
let x=25,n=0;while(x<L-45){let size=.6+rand()*.6;const kind=n%9;
if(region===3){const trees=[3,4,5,8,7];mid+=tree(x,275,size,trees[n%5]);if(n%3===1)mid+=rock(x+38,279,.4+rand()*.5,n);if(n%4===0)near+=place(x+15,329,.6,shape('M0 0q-17-21-39-9l22-15 16 7-7-30 15 13 3 25 25-19-4 15-20 13Z'));}
else if(region===0||region===1){if(n%3===0)mid+=tree(x,275,size,kind%3);else mid+=place(x,276,size,shape(['M-16 0v-39q0-20 16-20t16 20V0Z','M-19 0v-12h12v-36h-13v-10h13v-15H7v15h13v10H7v36h12V0Z','M-27 0v-28l12-14h25l18 13V0Z','M-16 0-5-55 17-51 6 0Z'][n%4]));}
else if(region===2){mid+=rock(x,280,size*(n%4===0?1.6:1),n);if(n%3===1)mid+=place(x+35,279,.8,shape('M-22 0v-61h6V0ZM17 0v-61h6V0ZM-28-62h58v8h-58ZM-18-52 19-6M-17-7 18-52','stroke="var(--mid)" stroke-width="4"'));}
else if(region===5){if(n%3===0)mid+=rock(x,280,size,n);else mid+=crystal(x,279,size,n);if(n%4===1)near+=crystal(x+34,329,.28+rand()*.25,n+2);}
else{mid+=n%4===0?tree(x,277,size,[0,1,6][n%3]):rock(x,280,size*1.3,n);if(n%3===0)near+=rock(x+20,329,.5,n+1);}
x+=75+rand()*125;n++;}
// Four different landmarks per route, distributed over the long strip.
const landmarks=[
['M-60 0q10-61 49-49l65 39-21 10-51-31q-19-2-20 31Z','M-44 0-22-48-37-78-13-66 5-30 41-19 56 0ZM-17-50 17-71 32-64 6-38Z','M-50 0q-9-43 25-50l30-42 42 9 20 51-22 32H27l9-28-15-36-28 2-10 35-14 27Z','M-55 0-43-17-12-22 7-41 33-34 50 0Z'],
['M-68 0v-83h20v-16h19v18H9v-24h21v22h18V0H30v-46q-25-38-51 0V0Z','M-31 0v-51h12v-31l19-37 18 37v31h13V0Z','M-68 0v-10h13v-11h16v-12h78v12h16v11h13V0ZM-35-34v-22q34-40 69 0v22Z','M-55 0v-67h17v-20h12v20h18V0Zm62 0v-32h14v-10h25V0Z'],
['M-64 0v-69h128V0H43v-45q-43-49-85 0V0Z','M-50 0v-17h100V0ZM-38-18v-25h10v25ZM28-18v-25h10v25ZM-55-45h111v8H-55Z','M-45 0-31-43-9-63 31-48 49 0H24v-25H-9V0Z','M-31 0v-90h12v20h36v-34h13V0H18v-56h-36V0ZM-44-77h86v8h-86Z'],
['M-65 0q17-59 56-66l29-43 42 19-22 15-20-9-12 36q-38 4-43 48Z','M-46 0q-19-25-2-42 18-17 38 4 16-32 40-10Q65-20 49 0Z','M-32 0v-78l13-23v57H6v-83l14 24 10 103ZM-47-58q45-42 94 0Z','M-60 0q14-52 55-43 47-9 65 43H38q-18-29-39-22-20-10-35 22Z'],
['M-52 0v-42h11v-63l17-39 17 39v64h19v-81l21-22 17 22V0Z','M-83 0-46-75-13-104 29-100 77 0H43L12-73-6-74-39 0Z','M-47 0-28-22-7-7 19-42 40-34 58 0Z','M-56 0v-24h18v-35h17V0ZM6 0v-73h16v-19h19v36h17V0Z'],
['M-74 0q7-76 72-69Q61-73 75 0H47q-11-46-48-45-36-4-46 45Z','M-57 0-62-36-44-60-26-45-8-91 14-116 32-84 24 0Z','M-49 0v-54h14v-48h17v48H0v-27h18v81Z','M-72 0-48-26-14-18 7-45 37-57 63-22 79 0Z'],
['M-84 0-55-24-22-91 5-111 38-82 72-16 87 0H49L21-56 4-67-15-52-43 0Z','M-52 0-38-55-7-47 11-83 37-74 49 0Z','M-56 0v-41h17v-51l17 28 14-52 15 56 21-23 12 83Z','M-56 0-39-21-17-20-5-45 25-31 44-44 65 0Z']
][region];
landmarks.forEach((d,i)=>{const px=330+i*665;mid+=place(px,279,.8+rand()*.3,shape(d));});
if(region===5)far+=shape('M0 223H2800M0 239H2800M0 254H2800','fill="none" stroke="#b7ddd8" stroke-width="2" opacity=".2"');
if(region===4||region===6){for(let j=0;j<30;j++)fx+=`<circle cx="${Math.round(rand()*L)}" cy="${110+Math.round(rand()*160)}" r="${1+rand()}" fill="#efac70" opacity=".5"/>`;}
if(region===3){for(let j=0;j<24;j++)fx+=`<circle cx="${Math.round(rand()*L)}" cy="${140+Math.round(rand()*125)}" r="2" fill="#c1efd0" opacity=".6"/>`;}
return {far,mid,near,fx};}

// Cache each region once, before its scenery enters view. All artwork is offline.
const travelSceneryCache=Array.from({length:7},(_,i)=>sceneryFor(i));
function travelSceneryLayer(index,layer) {
  const art=travelSceneryCache[index],content=layer==='middle'?art.mid+art.fx:art[layer==='front'?'near':'far'];
  return [0,2800,5600].map(x=>`<g transform="translate(${x} 0)">${content}</g>`).join('');
}
let travelAnimationNode=null,travelAnimationPoses=[],travelAnimationPose=-1;
function paintTravelAnimation(){
  const root=document.getElementById('emberwild-travel');
  if(!root||!s?.travel){travelAnimationNode=null;return;}
  if(root!==travelAnimationNode){travelAnimationNode=root;travelAnimationPoses=Array.from(root.querySelectorAll('.mounted-pose'));travelAnimationPose=-1;}
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const total=duration(s.travel.to)*1000,elapsed=Math.max(0,total-(s.travel.arrive-Date.now()));
  const i=reduced?0:Math.floor(elapsed/50)%travelAnimationPoses.length;
  if(i!==travelAnimationPose){travelAnimationPose=i;travelAnimationPoses.forEach((p,n)=>p.style.display=n===i?'inline':'none');}
  const fill=root.querySelector('.fill'),track=root.querySelector('.track');
  const progress=Math.min(100,elapsed/total*100);
  if(fill)fill.style.width=progress+'%';if(track)track.setAttribute('aria-valuenow',Math.round(progress));
}
