'use strict';
const ABOUT=[{label:'Bio',sub:'Director & Art Director',text:"I'm Flavyen Dupont, a Director & Art Director but also Motion Designer, Editor and Producer. I have worked in digital, cinema, and television and had the opportunity to work with various big names internationally and in France such as Google, YouTube, Coway, Hyundai, Samyang, DCMJ, Mentorshow, Deezer and more."}];
const ABOUT_HTML=`<h1 class="hello" aria-label="Bonjour. Hi. 안녕하세요. Buongiorno."><span>Bonjour.</span> <span>Hi.</span> <span lang="ko">안녕하세요.</span> <span lang="it">Buongiorno.</span></h1>
<p>I'm Flavyen Dupont, a <b>Director &amp; Art Director</b> but also Motion Designer, Editor and Producer.</p>
<p>I have worked in <b>digital, cinema, and television</b> and had the opportunity to work with various big names internationally and in France such as <b>Google, YouTube, Coway, Hyundai, Samyang, DCMJ, Mentorshow, Deezer and more.</b></p>
<p>I am always looking for <b>new challenges</b>, so if you appreciate my work, please don't hesitate to contact me by <a href="mailto:flavyen.dupont@hotmail.com">email</a>, and let's have a coffee. ☕</p>
<p>See you soon!</p>`;
const CONTACT=[{icon:'contact',label:'Email',sub:'flavyen.dupont@hotmail.com',text:'flavyen.dupont@hotmail.com',href:'mailto:flavyen.dupont@hotmail.com'},{icon:'instagram',label:'Instagram',sub:'@flavyen_d',text:'@flavyen_d',href:'https://www.instagram.com/flavyen_d/'},{icon:'vimeo',label:'Vimeo',sub:'vimeo.com/user74346532',text:'vimeo.com/user74346532',href:'https://vimeo.com/user74346532'}];
const CATS=[{id:'all',label:'All',items:FILMS},{id:'ads',label:'Ads',items:FILMS.filter(f=>f.cat.includes('ADS'))},{id:'fiction',label:'Fiction',items:FILMS.filter(f=>f.cat.includes('FICTION'))},{id:'about',label:'About',items:ABOUT,text:true},{id:'contact',label:'Contact',items:CONTACT,text:true}];
const $=id=>document.getElementById(id),cats=$('cats'),list=$('column'),meta=$('meta'),stage=$('stage'),imgA=$('stageImg'),imgB=$('stageImgNext'),player=$('player'),video=$('filmVideo');
const motion=matchMedia('(prefers-reduced-motion:reduce)'),state={c:0,sel:CATS.map(()=>0)};
let front=imgA,stageToken=0,stageTimer=0,categoryTimer=0,closeTimer=0,previewTimer=0,lastFocus=null,drag=null,suppressClickUntil=0;
const preview=$('backgroundPreview');
const mmss=s=>s==null?'':`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<svg aria-hidden="true"><use href="#icon-${name}"/></svg>`;
const filmIcon=f=>f.cat.includes('FICTION')?'fiction':f.cat.includes('ADS')?'ads':'all';
const current=()=>CATS[state.c].items[state.sel[state.c]];
const cache=new Map();
function loadImage(src){if(cache.has(src))return cache.get(src);const promise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Image unavailable'));img.src=src;});cache.set(src,promise);promise.catch(()=>cache.delete(src));return promise;}
// Resolve the actual responsive selection anchor, including max()/calc() values.
function length(name){const e=document.createElement('div');e.style.cssText=`position:fixed;visibility:hidden;pointer-events:none;width:var(${name});height:0`;document.body.append(e);const n=e.getBoundingClientRect().width;e.remove();return n;}
// Menu ported from aoxo (github.com/Kenshi0905/aoxo-portfolio, MIT): category slots and entry distances, CSS does the motion
function renderCats(){cats.innerHTML=CATS.map((c,i)=>`<button class="category" id="category-${c.id}" role="tab" aria-label="${c.label}" aria-controls="column" data-i="${i}"><span class="category-icon">${icon(c.id)}</span><span class="category-label">${c.label}</span></button>`).join('');cats.addEventListener('click',e=>{const b=e.target.closest('.category');if(b&&performance.now()>suppressClickUntil)setCat(Number(b.dataset.i));});}
function renderList(){const cat=CATS[state.c];list.setAttribute('aria-label',cat.label);list.innerHTML=cat.items.map((f,i)=>{const film=!cat.text,credits=film?(LOCAL_MEDIA[f.folder]?.credits||'').split('\n').filter(Boolean).slice(0,3).map(esc).join('<br>'):'';
 return `<div class="entry-position" role="listitem" data-i="${i}"><button class="entry" id="entry-${cat.id}-${i}" data-i="${i}" aria-label="${esc(film?f.title:f.label)}"><span class="entry-icon${film?' is-film':''}">${film?`<img src="media/${f.n}_s.jpg" alt="" decoding="async">`:icon(f.icon||cat.id)}</span><span class="entry-label"><strong>${esc(film?f.title:f.label)}</strong><small>${esc(film?[f.sub||(f.cat==='All'?'':f.cat.toLowerCase()),mmss(f.dur)].filter(Boolean).join(' · '):f.sub)}</small>${credits?`<small class="entry-credits">${credits}</small>`:''}</span></button></div>`;}).join('');}
list.addEventListener('click',e=>{const b=e.target.closest('.entry');if(!b||performance.now()<suppressClickUntil)return;const i=Number(b.dataset.i);if(i===state.sel[state.c])openFilm();else select(i);});
function updateCats(){const n=CATS.length;cats.querySelectorAll('.category').forEach((b,i)=>{const slot=(i-state.c+n)%n,on=i===state.c;b.style.setProperty('--slot',slot===n-1?-1:slot);b.style.setProperty('--mobile-slot',slot);b.classList.toggle('is-active',on);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});}
function layout(){const selected=state.sel[state.c];updateCats();list.querySelectorAll('.entry-position').forEach(p=>{const i=Number(p.dataset.i),d=i-selected,on=d===0,btn=p.firstElementChild;p.hidden=d<-1||d>3;p.dataset.distance=d;p.style.setProperty('--after-index',Math.max(0,d-1));btn.classList.toggle('is-selected',on);if(on)btn.setAttribute('aria-current','true');else btn.removeAttribute('aria-current');btn.tabIndex=on?0:-1;});$('selectionCount').textContent=`${String(selected+1).padStart(2,'0')} / ${String(CATS[state.c].items.length).padStart(2,'0')}`;}
function announce(){const f=current();$('announcement').textContent=`${CATS[state.c].label}, ${state.sel[state.c]+1} sur ${CATS[state.c].items.length}, ${f.title||f.label}`;}
function stopPreview(){clearTimeout(previewTimer);preview.pause();preview.style.opacity='0';preview.removeAttribute('src');preview.load();}
function startPreview(token){if(motion.matches||player.open||CATS[state.c].text)return;const f=current(),local=LOCAL_MEDIA[f.folder];if(!local?.src)return;previewTimer=setTimeout(()=>{if(token!==stageToken||player.open)return;preview.poster=`media/${f.n}.jpg`;preview.src=local.src;preview.muted=true;preview.play().then(()=>{if(token===stageToken&&!player.open)preview.style.opacity='1';else preview.pause();}).catch(()=>{});},700);}
preview.addEventListener('timeupdate',()=>{if(preview.currentTime>=8)preview.currentTime=0;});preview.addEventListener('ended',()=>{preview.currentTime=0;preview.play().catch(()=>{});});preview.addEventListener('error',()=>{preview.style.opacity='0';});
function updateStage(immediate=false){clearTimeout(stageTimer);stopPreview();const token=++stageToken,cat=CATS[state.c],f=current();document.body.classList.toggle('text-category',Boolean(cat.text));if(cat.text){stage.classList.add('text-mode');stage.classList.remove('pending');imgA.style.opacity=imgB.style.opacity='0';$('textStage').hidden=cat.id==='contact';$('textStage').innerHTML=f.label==='Bio'?ABOUT_HTML:`<h1 class="text-heading">${esc(f.label)}</h1><p>${f.href?`<a href="${esc(f.href)}" ${f.href.startsWith('mailto:')?'':'target="_blank" rel="noopener"'}>${esc(f.text)}</a>`:esc(f.text)}</p>`;return;}
 stage.classList.remove('text-mode');$('textStage').hidden=true;$('openFilm').setAttribute('aria-label',`Lire ${f.title}${f.sub?' — '+f.sub:''}`);stage.classList.add('pending');const src=`media/${f.n}.jpg`;
 stageTimer=setTimeout(async()=>{try{await loadImage(src);if(token!==stageToken)return;const back=front===imgA?imgB:imgA;if(front.getAttribute('src')===src){front.style.opacity='1';}else{back.src=src;back.alt=`${f.title}${f.sub?' — '+f.sub:''}`;await back.decode().catch(()=>{});if(token!==stageToken)return;back.style.opacity='1';front.style.opacity='0';front=back;}
 meta.innerHTML=`<span class="n">${esc(f.n)}</span><span class="t">${esc(f.title)}</span><span class="dur">${mmss(f.dur)}</span><span></span><span class="sub">${esc([f.sub,f.cat==='All'?'':f.cat.toLowerCase()].filter(Boolean).join(', '))}</span><span class="credits">${(LOCAL_MEDIA[f.folder]?.credits||'').split('\n').filter(Boolean).slice(0,3).map(esc).join('<br>')}</span>`;stage.classList.remove('pending');startPreview(token);for(const offset of [-1,1]){const next=cat.items[state.sel[state.c]+offset];if(next)loadImage(`media/${next.n}.jpg`).catch(()=>{});}
 }catch{if(token===stageToken){imgA.style.opacity=imgB.style.opacity='0';meta.textContent=`${f.title} — image indisponible`;stage.classList.remove('pending');}}},immediate||motion.matches?0:140);
}
function select(i){const next=Math.max(0,Math.min(CATS[state.c].items.length-1,i));if(next===state.sel[state.c])return;const focused=document.activeElement.closest?.('#column');state.sel[state.c]=next;layout();if(focused)list.querySelector(`.entry[data-i="${next}"]`).focus({preventScroll:true});updateStage();announce();}
// Looping past the last category back to the first plays a short light sweep (XMB wrap)
let wrapTimer=0;function wrapFx(dir){const b=document.body;b.classList.remove('xmb-wrap','wrap-left');void b.offsetWidth;b.classList.add('xmb-wrap');if(dir<0)b.classList.add('wrap-left');clearTimeout(wrapTimer);wrapTimer=setTimeout(()=>b.classList.remove('xmb-wrap','wrap-left'),900);}
function setCat(i){const n=CATS.length,next=((i%n)+n)%n,wrapped=i<0||i>=n;if(wrapped)wrapFx(i<0?-1:1);if(next===state.c)return;const focused=document.activeElement.closest?.('#cats');clearTimeout(categoryTimer);clearTimeout(stageTimer);stopPreview();++stageToken;state.c=next;list.classList.add('changing');updateCats();if(focused)cats.querySelector(`[data-i="${next}"]`).focus({preventScroll:true});
 categoryTimer=setTimeout(()=>{renderList();list.style.transition='none';layout();void list.offsetHeight;list.classList.remove('changing');list.style.transition='';updateStage();announce();},motion.matches?0:110);
}
function openFilm(){if(performance.now()<suppressClickUntil)return;clearTimeout(categoryTimer);if(list.classList.contains('changing')){renderList();layout();list.classList.remove('changing');}const cat=CATS[state.c],f=current();if(cat.text){if(f.href){if(f.href.startsWith('mailto:'))location.href=f.href;else window.open(f.href,'_blank','noopener');}return;}lastFocus=document.activeElement;preview.pause();preview.style.opacity='0';clearTimeout(previewTimer);const local=LOCAL_MEDIA[f.folder];video.pause();video.removeAttribute('src');video.load();video.poster=`media/${f.n}.jpg`;$('playerTitle').textContent=[f.title,f.sub].filter(Boolean).join(' / ');$('playerSubtitle').textContent=local?.credits?.split('\n').slice(0,2).join('\n')||[f.sub,f.cat==='All'?'':f.cat].filter(Boolean).join(' / ');$('vimeoLink').href=f.vimeo;$('videoMissing').hidden=Boolean(local?.src);video.hidden=!local?.src;clearTimeout(closeTimer);if(!player.open)player.showModal();window.pwRefresh?.();requestAnimationFrame(()=>player.classList.add('visible'));if(local?.src){video.src=local.src;video.play().catch(()=>{});}}
function closeFilm(){video.pause();player.classList.remove('visible');clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(player.open)player.close();video.removeAttribute('src');video.load();if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});startPreview(stageToken);},motion.matches?0:230);}
$('openFilm').addEventListener('click',openFilm);$('closePlayer').addEventListener('click',closeFilm);player.addEventListener('cancel',e=>{e.preventDefault();closeFilm();});player.addEventListener('close',()=>video.pause());video.addEventListener('error',()=>{if(player.open){$('videoMissing').hidden=false;$('videoMissing').querySelector('p').textContent='Ce fichier ne peut pas être lu ici. Le film reste accessible sur Vimeo.';}});
let lastKey=0,repeatGap=380;addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey)return;if(player.open){if(e.code==='Space'&&e.target!==video&&!e.target.closest('button,a,input')){e.preventDefault();video.paused?video.play().catch(()=>{}):video.pause();}return;}const actions={ArrowUp:()=>select(state.sel[state.c]-1),ArrowDown:()=>select(state.sel[state.c]+1),ArrowLeft:()=>setCat(state.c-1),ArrowRight:()=>setCat(state.c+1)};if(actions[e.key]){e.preventDefault();const now=performance.now();if(!e.repeat)repeatGap=380;else{if(now-lastKey<repeatGap)return;repeatGap=Math.max(55,repeatGap*.72);}lastKey=now;actions[e.key]();}else if(e.key==='Enter'&&!e.target.closest('button,a')){e.preventDefault();openFilm();}});
let wheelAcc=0,wheelAt=0,wheelStep=0,wheelAxis='y';addEventListener('wheel',e=>{if(player.open||e.ctrlKey||e.metaKey||e.target.closest('.text-stage'))return;e.preventDefault();const now=performance.now(),axis=Math.abs(e.deltaX)>Math.abs(e.deltaY)?'x':'y';if(now-wheelAt>160||axis!==wheelAxis)wheelAcc=0;wheelAt=now;wheelAxis=axis;if(now-wheelStep<180){wheelAcc=0;return;}const unit=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;wheelAcc+=(axis==='x'?e.deltaX:e.deltaY)*unit;if(Math.abs(wheelAcc)<38)return;const direction=Math.sign(wheelAcc);wheelAcc=0;wheelStep=now;if(axis==='x'||e.shiftKey)setCat(state.c+direction);else select(state.sel[state.c]+direction);},{passive:false});
// Touch: axis locks after 10px, vertical drag steps one film per 64px (follows the finger), a quick flick steps one,
// horizontal steps one category once per gesture. Taps stay taps.
let tg=null;const STEP=64,LOCK=10;
addEventListener('touchstart',e=>{if(player.open||e.touches.length>1||e.target.closest('a,input,.text-stage'))return;const t=e.touches[0];tg={x:t.clientX,y:t.clientY,t:performance.now(),axis:null,base:t.clientY,done:false,steps:0};},{passive:true});
addEventListener('touchmove',e=>{if(!tg)return;const t=e.touches[0],dx=t.clientX-tg.x,dy=t.clientY-tg.y;
 if(!tg.axis){if(Math.hypot(dx,dy)<LOCK)return;tg.axis=Math.abs(dx)>Math.abs(dy)*1.3?'x':'y';}
 e.preventDefault();
 if(tg.axis==='y'){const d=t.clientY-tg.base;if(Math.abs(d)>=STEP){const n=Math.trunc(d/STEP);select(state.sel[state.c]-n);tg.base+=n*STEP;tg.steps+=Math.abs(n);navigator.vibrate?.(4);}}
 else if(!tg.done&&Math.abs(dx)>=50){tg.done=true;setCat(state.c+(dx<0?1:-1));navigator.vibrate?.(6);}},{passive:false});
addEventListener('touchend',e=>{if(!tg)return;const g=tg;tg=null;if(!g.axis)return;suppressClickUntil=performance.now()+350;
 if(g.axis==='y'&&g.steps===0){const t=e.changedTouches[0],dy=t.clientY-g.y,v=Math.abs(dy)/(performance.now()-g.t);if(Math.abs(dy)>24&&v>.35)select(state.sel[state.c]+(dy<0?1:-1));}},{passive:true});
addEventListener('touchcancel',()=>{tg=null;});
let resizeFrame=0;addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(layout);});
function tick(){$('clock').textContent=new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Paris'}).format(new Date()).replace(' ',' ');}tick();setInterval(tick,30000);
motion.addEventListener('change',()=>{if(motion.matches)stopPreview();else startPreview(stageToken);});document.addEventListener('visibilitychange',()=>{if(document.hidden){preview.pause();video.pause();}else if(!player.open&&!motion.matches&&preview.currentSrc)preview.play().catch(()=>{});});
renderCats();renderList();layout();updateStage(true);


// Player: Poolsuite controls (strip, timer, bars, keys, channel, volume, fullscreen)
(()=>{const pw=$('pw'),st=$('pwState'),seek=$('pwSeek'),vol=$('pwVol'),bars=$('pwBars'),ctx=bars.getContext('2d');let seeking=false,an=null,data=null,raf=0;
const pad=s=>{s=Math.max(0,Math.floor(s||0));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const sync=()=>{const p=!video.paused&&!video.ended;pw.classList.toggle('is-playing',p);$('pwLive').hidden=!p;
 st.textContent=video.hidden?'Indisponible':p||video.currentTime>0?pad(video.currentTime):'Stopped';
 $('pwPause').classList.toggle('is-armed',!p&&video.currentTime>0);if(p)draw();};
['play','pause','ended','emptied','loadeddata','seeked'].forEach(e=>video.addEventListener(e,sync));
video.addEventListener('loadedmetadata',()=>{$('pwDims').textContent=video.videoWidth?`${video.videoWidth}x${video.videoHeight}`:'';});
video.addEventListener('timeupdate',()=>{if(!video.paused)st.textContent=pad(video.currentTime);if(!seeking&&video.duration){seek.value=String(Math.round(video.currentTime/video.duration*1000));seek.style.setProperty('--p',seek.value/10+'%');}});
seek.addEventListener('input',()=>{seeking=true;seek.style.setProperty('--p',seek.value/10+'%');if(video.duration)video.currentTime=seek.value/1000*video.duration;});seek.addEventListener('change',()=>{seeking=false;});
// audio bars from the film's real sound (Web Audio), drawn right-to-left like Poolsuite
function audio(){if(an)return;try{const AC=window.AudioContext||window.webkitAudioContext,ac=new AC(),src=ac.createMediaElementSource(video);an=ac.createAnalyser();an.fftSize=128;src.connect(an);an.connect(ac.destination);data=new Uint8Array(an.frequencyBinCount);video.addEventListener('play',()=>ac.resume());ac.resume();}catch{an=false;}}
function draw(){cancelAnimationFrame(raf);const W=bars.width,H=bars.height,n=Math.floor(W/4);ctx.clearRect(0,0,W,H);if(an)an.getByteFrequencyData(data);ctx.fillStyle='#e9f1fc';
 for(let i=0;i<n;i++){const v=an&&data?data[Math.floor(i/n*data.length*.7)]/255:(.25+.2*Math.sin(performance.now()/180+i*.7))*(Math.random()*.5+.5);const h=Math.max(2,Math.round(v*H));ctx.fillRect(W-4-i*4,H-h,2,h);}
 if(!video.paused)raf=requestAnimationFrame(draw);}
$('pwPlay').onclick=()=>{audio();video.play().catch(()=>{});};
$('pwPause').onclick=()=>video.pause();
$('pwStop').onclick=()=>{video.pause();video.currentTime=0;seek.value='0';seek.style.setProperty('--p','0%');sync();};
$('pwBack').onclick=()=>{video.currentTime=Math.max(0,video.currentTime-5);};
$('pwFwd').onclick=()=>{if(video.duration)video.currentTime=Math.min(video.duration-.1,video.currentTime+5);};
$('pwFull').onclick=()=>{const el=$('pwVideo');document.fullscreenElement?document.exitFullscreen():(el.requestFullscreen||el.webkitRequestFullscreen).call(el);};
$('pwFav').onclick=e=>{const b=e.currentTarget;b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'));};
const hop=d=>{const n=CATS[state.c].items.length,i=state.sel[state.c]+d;if(i<0||i>=n)return;select(i);openFilm();};
$('pwPrev').onclick=()=>hop(-1);$('pwNext').onclick=()=>hop(1);
// Category menu, Poolsuite channel dropdown: opens upward, pick a category, its first film starts
const menu=$('pwMenu'),chBtn=$('pwChannel');
const closeMenu=()=>{menu.hidden=true;chBtn.setAttribute('aria-expanded','false');};
chBtn.onclick=e=>{e.stopPropagation();if(!menu.hidden)return closeMenu();
 menu.innerHTML=CATS.map((c,i)=>c.text?'':`<li role="option" data-i="${i}" aria-selected="${i===state.c}"><span>${c.label}</span><em>${c.items.length}</em></li>`).join('');
 menu.hidden=false;chBtn.setAttribute('aria-expanded','true');};
menu.onclick=e=>{const li=e.target.closest('li');if(!li)return;closeMenu();const i=Number(li.dataset.i);if(i===state.c)return;setCat(i);setTimeout(()=>{state.sel[state.c]=0;layout();openFilm();},160);};
player.addEventListener('click',e=>{if(!e.target.closest('.pw-chwrap'))closeMenu();});player.addEventListener('close',closeMenu);
const setVol=()=>{video.volume=Number(vol.value);video.muted=video.volume===0;vol.parentElement.style.setProperty('--v',vol.value*100+'%');};vol.addEventListener('input',setVol);setVol();
video.addEventListener('click',()=>video.paused?$('pwPlay').click():video.pause());
window.pwRefresh=()=>{const f=current(),cat=CATS[state.c],i=state.sel[state.c];audio();
 $('pwFile').textContent=`${[f.title,f.sub].filter(Boolean).join('_').replace(/[^\p{L}\p{N}]+/gu,'_')}.mp4`;$('pwDims').textContent='';
 $('playerTitle').textContent=[f.title,f.sub].filter(Boolean).join(' | ');
 $('playerSubtitle').textContent=(LOCAL_MEDIA[f.folder]?.credits||'').split('\n').map(s=>s.trim()).filter(s=>/[\p{L}\p{N}]/u.test(s)).slice(0,2).join(' · ')||[f.cat==='All'?'':f.cat.toLowerCase(),mmss(f.dur)].filter(Boolean).join(' · ');
 seek.value='0';seek.style.setProperty('--p','0%');$('pwChannelName').textContent=cat.label;$('pwCount').textContent=`${String(i+1).padStart(2,'0')}/${String(cat.items.length).padStart(2,'0')}`;
 $('pwPrev').disabled=i===0;$('pwNext').disabled=i===cat.items.length-1;setVol();sync();};
addEventListener('keydown',e=>{if(!player.open)return;if(e.key==='f'){e.preventDefault();$('pwFull').click();}if(e.key==='ArrowRight'&&!e.target.closest('input')){e.preventDefault();$('pwFwd').click();}if(e.key==='ArrowLeft'&&!e.target.closest('input')){e.preventDefault();$('pwBack').click();}});
})();
