/* 《没有剧透的中国》纪实小说排版辅助 V1.1 */
(function(){
  function syncMarginNote(page){
    const body=page.querySelector('.layout-body');
    const shape=page.querySelector('.margin-note-shape');
    const note=page.querySelector('.margin-note');
    if(!body||!shape||!note) return;

    const bodyH=body.clientHeight;
    // IMPORTANT: offsetHeight is unscaled CSS layout height.
    // getBoundingClientRect() is affected by .page-scale transform and caused
    // the wrap zone to start too low, letting prose intrude into the note.
    const noteH=Math.ceil(note.offsetHeight);
    const safety=14;
    const start=Math.max(0,bodyH-noteH-safety);

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
      const figCount=page.querySelectorAll('figure.inline-visual,.inline-visual-pair').length;
      const pCount=page.querySelectorAll('.page-flow > p').length;
      if(figCount>0 && pCount===0) issues.push({page:index+1,type:'visual-only'});

      const visual=page.querySelector('.inline-visual-rail, figure.inline-visual');
      if(visual){
        const body=page.querySelector('.layout-body');
        const br=body.getBoundingClientRect();
        const vr=visual.getBoundingClientRect();
        const topGap=vr.top-br.top;
        const children=[...page.querySelectorAll('.page-flow > *')];
        const vi=children.indexOf(visual);
        const before=vi>=0?children.slice(0,vi).filter(el=>el.matches('p')):[];
        const tail=before.slice(-4);
        const shortRun=tail.length>=2 && tail.every(p=>p.textContent.trim().length<=34);

        // Multi-image rails should start in the upper reading zone.
        // Single images may start lower, but not after only a run of short lines.
        if((visual.classList.contains('inline-visual-rail') && topGap>190) ||
           (!visual.classList.contains('inline-visual-rail') && topGap>270 && shortRun)){
          issues.push({
            page:index+1,
            type:'visual-start-too-low',
            px:Math.round(topGap),
            precedingShortRun:shortRun
          });
        }
      }

      const note=page.querySelector('.margin-note');
      if(note){
        const nr=note.getBoundingClientRect();
        outer:
        for(const p of page.querySelectorAll('.page-flow > p')){
          const range=document.createRange();
          range.selectNodeContents(p);
          for(const lr of range.getClientRects()){
            const overlap=lr.right>nr.left+1 && lr.left<nr.right-1 &&
              lr.bottom>nr.top+1 && lr.top<nr.bottom-1;
            if(overlap){
              issues.push({page:index+1,type:'note-text-overlap'});
              break outer;
            }
          }
        }
      }

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