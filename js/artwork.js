'use strict';

// Emberwild v0.1.29 — js/artwork.js

let bossSpriteInstance=0;

const bossArtCache=new Map();

function bossArtImage(name){
  if(!bossArtCache.has(name)){
    const image=new Image();
    image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(inlineBossSVG[bossPortraitFiles[name]]||'');
    bossArtCache.set(name,image)
  }
  return bossArtCache.get(name)
}

let heroSpriteInstance=0;

const heroImageCache=new Map();

function heroArtImage(cl){
  if(!heroImageCache.has(cl)){
    const im=new Image();
    im.src="data:image/svg+xml;base64,"+btoa(HERO_ART[cl]);
    heroImageCache.set(cl,im)
  }
  return heroImageCache.get(cl)
}

function portrait(cl){
  const suffix="-hero-"+(++heroSpriteInstance);
  return HERO_ART[cl].replace(/\bid="([^"]+)"/g,(_,id)=>'id="'+id+suffix+'"').replace(/#(ewhero_[\w-]+)\)/g,(_,id)=>"#"+id+suffix+")")
}

function bossPortrait(name){
 
  const source=inlineBossSVG[bossPortraitFiles[name]];
  if(!source)return null;
 // Every rendered copy owns its gradient/filter/group IDs, including CSS selectors.
 
  const suffix='-instance-'+(++bossSpriteInstance);
 
  return source.replace(/\bid="([^"]+)"/g,(_,id)=>'id="'+id+suffix+'"')
  .replace(/#(eb\d+_[\w-]+)/g,(_,id)=>'#'+id+suffix);

}

function enemyPortrait(name){
  const custom=bossPortrait(name);
  if(custom)return custom;
  let roster={Skeleton:['skeleton','#c7c1cf',0],Ghost:['ghost','#bb91dc',0],Wraith:['ghost','#db68c8',0],'The Ebon Sentinel':['knight','#d9c37f',1]},[type,c,boss]=roster[name]||['ghost','#a0b0a0',0];
  let shapes={sprout:`<path d="M37 140L44 89L70 66L95 89L104 140Z" fill="${c}"/><path d="M69 73Q24 54 33 28Q67 26 70 60Q76 18 110 22Q113 57 74 73" fill="${c}"/><path d="M51 91L60 95M80 95L89 91" stroke="#f6df9c" stroke-width="5"/>`,boar:`<path d="M19 110L29 67L48 74L70 55L93 74L112 65L124 110L98 142H42Z" fill="${c}"/><path d="M32 78L26 44L53 63M91 65L117 43L110 80" fill="${c}"/><path d="M45 116L34 101L34 132L51 133M96 116L107 100L108 133L91 133" fill="#e6d7b0"/><path d="M54 103H88L91 123H51Z" fill="#42332f"/><path d="M43 88L57 93M85 93L99 88" stroke="#edd082" stroke-width="4"/>`,tree:`<path d="M37 148L46 88L54 42L70 53L89 39L96 94L107 148Z" fill="${c}"/><path d="M47 93L20 66L16 39M92 90L118 59L125 31M56 54L40 30L44 12M83 51L98 20L95 8" stroke="${c}" stroke-width="9"/><path d="M54 80L64 86M79 86L89 79" stroke="#ffe8a3" stroke-width="5"/><path d="M60 110L70 119L82 105" stroke="#283b33" stroke-width="6"/>`,ghost:`<path d="M25 148L38 88L43 54L70 25L98 55L104 102L119 149L91 136L72 151L53 137Z" fill="${c}" opacity=".85"/><path d="M49 76L70 44L92 76L82 108H58Z" fill="#20202f"/><path d="M56 79L64 82M77 82L85 77" stroke="#b1f1ed" stroke-width="5"/><path d="M41 112L20 132M102 111L126 132" stroke="${c}" stroke-width="10"/>`,skeleton:`<path d="M39 148L44 99H96L105 148" fill="#4d5664"/><path d="M47 39L70 27L94 42L90 79L80 91H59L48 76Z" fill="${c}"/><path d="M53 55L65 58L61 70H51M77 58L88 54L91 69H80" fill="#252d37"/><path d="M70 67L65 78H75M58 84H82" stroke="#303845" stroke-width="3"/><path d="M70 99V143M49 108H91M49 120H91M52 132H88" stroke="${c}" stroke-width="5"/><path d="M117 143V39L123 25L128 39V143M108 112H137" stroke="#bab9ad" stroke-width="4"/>`,beast:`<path d="M29 146L34 88L27 33L60 55L79 53L112 28L107 91L115 146Z" fill="${c}"/><path d="M45 72L62 82M81 82L99 70" stroke="#f5d798" stroke-width="5"/><path d="M53 101L71 90L88 101L80 120H62Z" fill="#30303a"/><path d="M57 112L60 129L66 115M77 115L84 129L86 109" fill="#e6dbc5"/>`,brute:`<path d="M20 150L17 99L44 83L46 40L71 29L98 44L101 85L127 101L123 150Z" fill="${c}"/><path d="M25 102L70 127L118 101L113 146H30Z" fill="#45535a"/><path d="M54 61L65 67M80 67L92 61" stroke="#efd69a" stroke-width="5"/><path d="M60 83L60 99L67 87M79 88L86 100L85 82" fill="#e4dbc4"/>`,knight:`<path d="M25 149L25 103L49 88H91L116 103L116 149Z" fill="${c}"/><path d="M49 43L70 27L93 43L96 79L70 99L45 79Z" fill="${c}"/><path d="M49 60H92L86 77H55Z" fill="#242b38"/><path d="M56 66H85" stroke="#ffcd80" stroke-width="4"/><path d="M70 33V93M36 110L70 125L104 110" stroke="#e6cea0" stroke-width="3"/><path d="M12 141V51L19 35L26 51V141M3 110H35" stroke="#c3b8aa" stroke-width="4"/>`,wisp:`<path d="M70 18L96 62L124 77L99 95L104 132L73 115L38 144L43 102L16 80L46 65Z" fill="${c}" opacity=".6"/><path d="M70 40L96 81L70 120L44 81Z" fill="${c}"/><path d="M58 76L65 80M77 80L85 75" stroke="#f5efb9" stroke-width="5"/>`,mage:`<path d="M21 150L39 85L70 49L102 85L120 150Z" fill="${c}"/><path d="M43 82L70 32L98 82L83 103H56Z" fill="#273142"/><path d="M54 75L64 80M78 80L89 74" stroke="#ffe3a8" stroke-width="5"/><path d="M70 105V149M41 120L70 135L101 119" stroke="#dfc19c" stroke-width="4"/><path d="M118 148V44M106 38L118 18L131 38L118 56Z" stroke="${c}" stroke-width="5"/>`,eel:`<path d="M30 134Q105 157 108 109Q110 81 70 90Q29 101 38 65L55 45L76 58L60 75Q135 61 129 113Q121 174 29 148Z" fill="${c}"/><path d="M38 65L41 29L70 47L87 68L60 75Z" fill="${c}"/><path d="M54 54L65 60" stroke="#fff0b0" stroke-width="5"/><path d="M88 95L106 83L117 95M72 134L83 153" stroke="#d1edef" stroke-width="3"/>`,tentacle:`<path d="M43 87Q30 31 70 25Q110 31 99 89Z" fill="${c}"/><path d="M49 85Q12 101 28 146M62 86Q35 119 52 153M80 85Q100 118 84 151M94 84Q131 105 116 146" stroke="${c}" stroke-width="15" fill="none"/><path d="M52 58L64 66M78 66L90 57" stroke="#c8f5e9" stroke-width="6"/>`,flame:`<path d="M70 11Q109 52 98 65L118 50Q145 127 91 148H45Q8 128 22 82L40 97Q33 47 70 11" fill="${c}"/><path d="M70 54L91 89L84 124L70 141L53 120L48 90Z" fill="#c05d49"/><path d="M53 90L65 97M78 97L89 89" stroke="#fff2c0" stroke-width="5"/>`};
  return `<svg viewBox="0 0 140 170" fill="none" role="img" aria-label="${esc(name)}"><circle cx="70" cy="88" r="59" stroke="${c}" opacity=".35"/><path d="M70 8L76 17L70 25L64 17Z" fill="${c}"/>${shapes[type]}${boss?'<path d="M44 31L39 10L58 21L70 4L82 21L102 10L96 32Z" fill="#e8c17b" stroke="#fff0b3" stroke-width="2"/>':''}</svg>`
}

