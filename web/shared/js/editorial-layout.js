/* 《没有剧透的中国》纪实小说排版辅助 V1.0
 * Canonical rules: book/layout-standard.md
 */
(function(){
  function syncMarginNote(container){
    const shape=container.querySelector('.margin-note-shape');
    const note=container.querySelector('.margin-note');
    if(!shape||!note) return;
    const h=container.clientHeight;
    const noteH=Math.ceil(note.getBoundingClientRect().height);
    const start=Math.max(0,h-noteH);
    shape.style.setProperty('--note-start',start+'px');
  }

  function syncMarginNotes(root=document){
    root.querySelectorAll('.prose-with-note').forEach(syncMarginNote);
  }

  function auditLayout(root=document){
    const issues=[];
    root.querySelectorAll('.layout-body').forEach((body,index)=>{
      if(body.scrollHeight>body.clientHeight+2){
        issues.push({page:index+1,type:'overflow',px:body.scrollHeight-body.clientHeight});
      }
      if(body.closest('.scene-opener,[data-allow-underfill="true"]')) return;
      const copy=body.querySelector('.prose-standard');
      if(!copy) return;
      const blocks=[...copy.querySelectorAll(':scope > p')].filter(el=>el.offsetParent!==null);
      const last=blocks.at(-1);
      if(!last) return;
      const bodyBottom=body.getBoundingClientRect().bottom;
      const lastBottom=last.getBoundingClientRect().bottom;
      const line=parseFloat(getComputedStyle(copy).lineHeight)||32;
      const gap=bodyBottom-lastBottom;
      if(gap>line*1.5){
        issues.push({page:index+1,type:'underfill',px:Math.round(gap)});
      }
    });
    if(issues.length) console.warn('[book-layout] review issues',issues);
    return issues;
  }

  function refresh(){
    syncMarginNotes();
    requestAnimationFrame(()=>auditLayout());
  }

  window.BookEditorialLayout={syncMarginNotes,auditLayout,refresh};
  window.addEventListener('load',refresh);
  window.addEventListener('resize',refresh);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(refresh);
})();
