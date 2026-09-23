(()=>{
  const pages=[...document.querySelectorAll('.page')];
  const stage=document.querySelector('.stage');
  const book=document.querySelector('.book');
  const counter=document.querySelector('.page-counter');
  const bar=document.querySelector('.progress-bar');
  const prevBtn=document.querySelector('.nav-btn.prev');
  const nextBtn=document.querySelector('.nav-btn.next');
  let current=0, locked=false, touchX=0, touchY=0;
  const qs=new URLSearchParams(location.search); if(qs.has('page')) current=Math.max(0,Math.min(pages.length-1,Number(qs.get('page'))-1));
  function fit(){
    const marginX=window.innerWidth<760?18:150;
    const marginY=window.innerWidth<760?70:112;
    const scale=Math.min((innerWidth-marginX)/820,(innerHeight-marginY)/1080,1);
    book.style.transform=`scale(${scale})`;
    stage.style.width=`${820*scale}px`; stage.style.height=`${1080*scale}px`;
    book.style.transformOrigin='top left';
  }
  function fitText(page){
    const copy=page.querySelector('.copy'); if(!copy) return;
    copy.classList.remove('dense','tighter'); copy.style.fontSize=''; copy.style.lineHeight='';
    const max=copy.clientHeight;
    if(copy.scrollHeight>max+3) copy.classList.add('dense');
    if(copy.scrollHeight>max+3) copy.classList.add('tighter');
    let size=parseFloat(getComputedStyle(copy).fontSize);
    while(copy.scrollHeight>max+3 && size>14.5){size-=.25;copy.style.fontSize=size+'px';copy.style.lineHeight='1.64'}
  }
  function show(i,dir=0){
    if(i<0||i>=pages.length||i===current&&pages[i].classList.contains('active'))return;
    pages.forEach((p,idx)=>{p.classList.remove('active','prev-state'); if(idx<i)p.classList.add('prev-state')});
    current=i; pages[current].classList.add('active');
    fitText(pages[current]);
    counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`;
    bar.style.width=((current)/(pages.length-1)*100)+'%';
    prevBtn.disabled=current===0; nextBtn.disabled=current===pages.length-1;
    history.replaceState(null,'',location.pathname+(current?`?page=${current+1}`:''));
  }
  function step(d){if(locked)return;const n=current+d;if(n<0||n>=pages.length)return;locked=true;show(n,d);setTimeout(()=>locked=false,360)}
  addEventListener('resize',()=>{fit();fitText(pages[current])});
  addEventListener('keydown',e=>{if(document.querySelector('.overlay.open')){if(e.key==='Escape')closeOverlays();return}if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();step(1)}else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();step(-1)}else if(e.key==='Home'){show(0)}else if(e.key==='End'){show(pages.length-1)}});
  addEventListener('wheel',e=>{if(document.querySelector('.overlay.open'))return;if(Math.abs(e.deltaY)<14&&Math.abs(e.deltaX)<14)return;step((e.deltaY||e.deltaX)>0?1:-1)},{passive:true});
  addEventListener('touchstart',e=>{touchX=e.touches[0].clientX;touchY=e.touches[0].clientY},{passive:true});
  addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy))step(dx<0?1:-1)},{passive:true});
  prevBtn.onclick=()=>step(-1);nextBtn.onclick=()=>step(1);
  const toc=document.querySelector('#tocOverlay'),src=document.querySelector('#sourcesOverlay');
  document.querySelector('#tocBtn').onclick=()=>toc.classList.add('open');document.querySelector('#sourcesBtn').onclick=()=>src.classList.add('open');
  function closeOverlays(){document.querySelectorAll('.overlay').forEach(x=>x.classList.remove('open'))} window.closeOverlays=closeOverlays;
  document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')}));
  document.querySelectorAll('.toc-item').forEach(x=>x.onclick=()=>{closeOverlays();show(Number(x.dataset.page)-1)});
  fit(); pages.forEach(fitText); pages.forEach(p=>p.classList.remove('active')); show(current);
})();