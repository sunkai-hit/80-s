/* 《没有剧透的中国》纪实小说排版辅助 V1.1 */
(function(){
  function syncMarginNote(page){
    const body=page.querySelector('.layout-body');
    const shape=page.querySelector('.margin-note-shape');
    const note=page.querySelector('.margin-note');
    if(!body||!shape||!note) return;

    const bodyH=body.clientHeight;
    const noteH=Math.ceil(note.getBoundingClientRect().height);
    const start=Math.max(0,bodyH-noteH);

    shape.style.setProperty('--note-body-height',bodyH+'px');
    shape.style.setProperty('--note-start',start+'px');
  }

  function syncMarginNotes(root=document){
    root.querySelectorAll('.book-page.has-note').forEach(syncMarginNote);
  }

  function contentNodes(page){
    const flow=page.querySelector('.page-flow');
    if(!flow) return [];
    return [...flow.children].filter(el=>
      !el.classList.contains('margin-note-shape') &&
      (el.matches('p')||el.matches('figure.inline-visual'))
    );
  }

  function layoutMetrics(page){
    const body=page.querySelector('.layout-body');
    if(!body) return {overflow:false,empty:true,gap:0};
    const br=body.getBoundingClientRect();
    const nodes=contentNodes(page);
    let maxBottom=br.top;
    let overflow=false;
    for(const el of nodes){
      const r=el.getBoundingClientRect();
      maxBottom=Math.max(maxBottom,r.bottom);
      if(r.bottom>br.bottom+1) overflow=true;
    }
    const note=page.querySelector('.margin-note');
    if(note && note.getBoundingClientRect().top<br.top-1) overflow=true;
    return {
      overflow,
      empty:nodes.length===0,
      gap:Math.max(0,br.bottom-maxBottom),
      nodeCount:nodes.length
    };
  }

  function auditLayout(root=document){
    const issues=[];
    root.querySelectorAll('.book-page:not(.cover-page)').forEach((page,index)=>{
      const m=layoutMetrics(page);
      if(m.empty) issues.push({page:index+1,type:'empty'});
      if(m.overflow) issues.push({page:index+1,type:'overflow'});
      if(!page.dataset.allowUnderfill && m.gap>50){
        issues.push({page:index+1,type:'underfill',px:Math.round(m.gap)});
      }
      const figCount=page.querySelectorAll('figure.inline-visual').length;
      const pCount=page.querySelectorAll('.page-flow > p').length;
      if(figCount>0 && pCount===0) issues.push({page:index+1,type:'visual-only'});
      if(page.classList.contains('scene-opener') && pCount===0){
        issues.push({page:index+1,type:'title-only'});
      }
    });
    if(issues.length) console.warn('[book-layout] review issues',issues);
    return issues;
  }

  window.BookEditorialLayout={
    syncMarginNote,
    syncMarginNotes,
    layoutMetrics,
    auditLayout
  };

  window.addEventListener('resize',()=>syncMarginNotes());
  if(document.fonts&&document.fonts.ready){
    document.fonts.ready.then(()=>syncMarginNotes());
  }
})();