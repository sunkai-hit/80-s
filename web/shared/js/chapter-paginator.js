(function(){
  const q=(s,r=document)=>r.querySelector(s);

  function splitSentences(text){
    const out=[]; let buf='';
    for(const ch of text){
      buf+=ch;
      if('。！？；'.includes(ch)){ out.push(buf); buf=''; }
    }
    if(buf) out.push(buf);
    return out.length?out:[text];
  }

  function flowOf(page){return q('.page-flow',page)}
  function bodyOf(page){return q('.layout-body',page)}

  function contentNodes(page){
    return [...flowOf(page).children].filter(el=>
      !el.classList.contains('margin-note-shape') &&
      (el.matches('p')||el.matches('figure.inline-visual'))
    );
  }

  function pageOverflow(page){
    const body=bodyOf(page);
    const br=body.getBoundingClientRect();
    for(const el of contentNodes(page)){
      if(el.getBoundingClientRect().bottom>br.bottom+1) return true;
    }
    const note=q('.margin-note',page);
    if(note && note.getBoundingClientRect().top<br.top-1) return true;
    return false;
  }

  function createPage(track,sceneTitle,{sceneStart=false}={}){
    const page=document.createElement('section');
    page.className='book-page'+(sceneStart?' scene-opener':' continuation-page');
    page.innerHTML=
      '<div class="page-head"><span class="scene-running"></span><span>第一章</span></div>'+
      '<div class="layout-body">'+
        (sceneStart?'<div class="scene-kicker">SCENE</div><h2 class="scene-title"></h2>':'')+
        '<div class="page-flow prose-standard"></div>'+
      '</div>'+
      '<div class="page-foot"><span>没有剧透的中国</span><b></b></div>';

    q('.scene-running',page).textContent=sceneStart?'没有剧透的中国':sceneTitle;
    if(sceneStart){
      const title=q('.scene-title',page);
      title.textContent=sceneTitle;
      if(sceneTitle.length>15) title.classList.add('long');
    }
    track.appendChild(page);
    return page;
  }

  function removeNote(page){
    page.classList.remove('has-note');
    q('.margin-note-shape',page)?.remove();
    q('.margin-note',page)?.remove();
  }

  function installNote(page,source){
    removeNote(page);
    const body=bodyOf(page);
    const flow=flowOf(page);

    const shape=document.createElement('span');
    shape.className='margin-note-shape';
    shape.setAttribute('aria-hidden','true');
    flow.insertBefore(shape,flow.firstChild);

    const note=document.createElement('aside');
    note.className='margin-note';
    note.innerHTML=
      '<div class="label">'+(source.dataset.label||'时代旁注')+'</div>'+
      '<h3>'+source.dataset.title+'</h3>'+
      '<div class="note-copy">'+source.innerHTML+'</div>';
    body.appendChild(note);
    page.classList.add('has-note');

    if(window.BookEditorialLayout) window.BookEditorialLayout.syncMarginNote(page);
  }

  function normalizeParagraph(source){
    const p=source.cloneNode(true);
    p.removeAttribute('data-source');
    return p;
  }

  function appendParagraph(page,source,newContinuation){
    const flow=flowOf(page);
    const p=normalizeParagraph(source);
    flow.appendChild(p);
    if(window.BookEditorialLayout && page.classList.contains('has-note')){
      window.BookEditorialLayout.syncMarginNote(page);
    }
    if(!pageOverflow(page)) return page;

    p.remove();

    // Marked-up/short paragraphs move whole; normal long paragraphs may split at sentence boundaries.
    if(source.children.length || source.classList.contains('keep-together') || source.textContent.length<34){
      const next=newContinuation();
      flowOf(next).appendChild(p);
      return next;
    }

    const parts=splitSentences(source.textContent);
    if(parts.length<2){
      const next=newContinuation();
      flowOf(next).appendChild(p);
      return next;
    }

    const partial=document.createElement('p');
    partial.className=source.className;
    flow.appendChild(partial);
    let used=0;
    for(let i=0;i<parts.length;i++){
      partial.textContent+=parts[i];
      if(pageOverflow(page)){
        partial.textContent=partial.textContent.slice(0,-parts[i].length);
        break;
      }
      used=i+1;
    }

    if(used===0){
      partial.remove();
      const next=newContinuation();
      flowOf(next).appendChild(p);
      return next;
    }

    const rest=parts.slice(used).join('');
    if(!rest) return page;

    const next=newContinuation();
    const rem=document.createElement('p');
    rem.className=(source.className+' split-continuation').trim();
    rem.textContent=rest;
    flowOf(next).appendChild(rem);
    return next;
  }

  function makeVisual(source){
    const fig=source.cloneNode(true);
    fig.removeAttribute('data-visual');
    const kind=source.dataset.kind||'historical';
    fig.className=('inline-visual '+kind+' '+(source.dataset.class||'')).trim();
    return fig;
  }

  function appendVisual(page,source,newContinuation){
    // Keep note and visual wrap systems separate, but never create an image-only page intentionally.
    if(q('.margin-note',page)) page=newContinuation();

    let fig=makeVisual(source);
    flowOf(page).appendChild(fig);

    if(pageOverflow(page)){
      fig.remove();
      page=newContinuation();
      fig=makeVisual(source);
      flowOf(page).appendChild(fig);
    }
    return page;
  }

  function moveContextToNewPage(fromPage,toPage,count){
    const candidates=[...flowOf(fromPage).children]
      .filter(el=>el.matches('p') && !el.classList.contains('split-continuation'));
    const moved=candidates.slice(-count);
    for(const el of moved) flowOf(toPage).appendChild(el);
    return moved.length;
  }

  function attachNote(page,source,newContinuation){
    // A page with a visual gets a clean note page, carrying nearby prose with it.
    if(q('figure.inline-visual',page)){
      const next=newContinuation();
      moveContextToNewPage(page,next,Number(source.dataset.context||2));
      page=next;
    }

    installNote(page,source);
    if(!pageOverflow(page)) return page;

    removeNote(page);

    const next=newContinuation();
    const wanted=Math.max(1,Number(source.dataset.context||2));
    moveContextToNewPage(page,next,wanted);
    installNote(next,source);

    // If context + note is still too tall, trim context back to one paragraph.
    while(pageOverflow(next)){
      const paras=[...flowOf(next).children].filter(el=>el.matches('p'));
      if(paras.length<=1) break;
      const first=paras[0];
      flowOf(page).appendChild(first);
      if(window.BookEditorialLayout) window.BookEditorialLayout.syncMarginNote(next);
    }
    return next;
  }

  function createCover(track,source){
    const page=document.createElement('section');
    page.className='book-page cover-page';
    page.innerHTML=
      '<div class="page-head"><span>没有剧透的中国</span><span>第一章</span></div>'+
      '<div class="cover-body">'+
        '<div class="cover-kicker">第一章</div>'+
        '<h1>'+source.dataset.title+'</h1>'+
        '<div class="cover-year">'+(source.dataset.year||'1985')+'</div>'+
        '<div class="cover-sub">'+source.dataset.subtitle+'</div>'+
        '<div class="cover-deck">'+source.dataset.deck.replace(/\\n/g,'<br>')+'</div>'+
      '</div>'+
      '<div class="page-foot"><span>没有剧透的中国</span><b></b></div>';
    track.appendChild(page);
  }

  function isEmptyPage(page){
    if(page.classList.contains('cover-page')) return false;
    const hasText=flowOf(page)?.querySelector('p');
    const hasVisual=flowOf(page)?.querySelector('figure.inline-visual');
    const hasNote=q('.margin-note',page);
    return !hasText && !hasVisual && !hasNote;
  }

  function pruneEmptyPages(track){
    [...track.querySelectorAll('.book-page')].forEach(page=>{
      if(isEmptyPage(page)) page.remove();
    });
  }

  function numberPages(track){
    const pages=[...track.querySelectorAll('.book-page')];
    pages.forEach((p,i)=>{
      p.dataset.page=i+1;
      p.setAttribute('aria-label','第'+(i+1)+'页');
      const n=q('.page-foot b',p);
      if(n)n.textContent=String(i+1).padStart(2,'0');
    });
    return pages;
  }

  async function build({sourceSelector='#chapterSource',trackSelector='#bookTrack'}={}){
    const source=q(sourceSelector);
    const track=q(trackSelector);
    if(!source||!track) throw new Error('chapter source/track missing');

    track.innerHTML='';
    createCover(track,source);

    const scenes=[...source.content.querySelectorAll('.scene-source')];
    for(const scene of scenes){
      const sceneTitle=scene.dataset.title;
      let current=createPage(track,sceneTitle,{sceneStart:true});
      const newContinuation=()=>createPage(track,sceneTitle,{sceneStart:false});

      for(const node of [...scene.children]){
        if(node.matches('p')){
          current=appendParagraph(current,node,newContinuation);
        }else if(node.matches('figure[data-visual]')){
          current=appendVisual(current,node,newContinuation);
        }else if(node.matches('aside[data-note]')){
          current=attachNote(current,node,newContinuation);
        }
        if(window.BookEditorialLayout && current.classList.contains('has-note')){
          window.BookEditorialLayout.syncMarginNote(current);
        }
      }

      // A scene is genuinely ending here, so its final page may be underfilled.
      current.dataset.allowUnderfill='true';
    }

    pruneEmptyPages(track);
    const pages=numberPages(track);

    if(window.BookEditorialLayout){
      window.BookEditorialLayout.syncMarginNotes(track);
      requestAnimationFrame(()=>window.BookEditorialLayout.auditLayout(track));
    }
    return pages;
  }

  window.BookChapterPaginator={build};
})();