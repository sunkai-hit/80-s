(function(){
  const q=(s,r=document)=>r.querySelector(s);

  function splitSentences(text){
    const out=[];
    let buf='';
    for(const ch of text){
      buf+=ch;
      if('。！？；'.includes(ch)) { out.push(buf); buf=''; }
    }
    if(buf) out.push(buf);
    return out.length?out:[text];
  }

  function pageOverflow(page){
    const body=q('.layout-body',page);
    return body.scrollHeight>body.clientHeight+2;
  }

  function contentAmount(page){
    return q('.layout-body',page).scrollHeight/q('.layout-body',page).clientHeight;
  }

  function createPage(track,sceneTitle,{sceneStart=false}={}){
    const page=document.createElement('section');
    page.className='book-page'+(sceneStart?' scene-opener':' continuation-page');
    page.innerHTML=
      '<div class="page-head"><span class="scene-running"></span><span>第一章</span></div>'+
      '<div class="layout-body">'+
        (sceneStart?'<div class="scene-kicker">SCENE</div><h2 class="scene-title"></h2>':'')+
        '<div class="page-flow prose-with-note prose-standard"></div>'+
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

  function flowOf(page){return q('.page-flow',page)}

  function normalizeParagraph(source){
    const p=source.cloneNode(true);
    p.removeAttribute('data-source');
    return p;
  }

  function appendParagraph(page,source,newContinuation){
    const flow=flowOf(page);
    const p=normalizeParagraph(source);
    flow.appendChild(p);
    if(!pageOverflow(page)) return {page,remainder:null};

    flow.removeChild(p);

    // Short/marked-up paragraphs move as a whole.
    if(source.children.length || source.classList.contains('keep-together') || source.textContent.length<34){
      const next=newContinuation();
      flowOf(next).appendChild(p);
      return {page:next,remainder:null};
    }

    // Try sentence-level split so ordinary pages reach the common last-line zone.
    const parts=splitSentences(source.textContent);
    if(parts.length<2){
      const next=newContinuation();
      flowOf(next).appendChild(p);
      return {page:next,remainder:null};
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
      flow.removeChild(partial);
      const next=newContinuation();
      flowOf(next).appendChild(p);
      return {page:next,remainder:null};
    }

    const rest=parts.slice(used).join('');
    if(!rest) return {page,remainder:null};

    const next=newContinuation();
    const rem=document.createElement('p');
    rem.className=(source.className+' split-continuation').trim();
    rem.textContent=rest;
    flowOf(next).appendChild(rem);
    return {page:next,remainder:null};
  }

  function makeVisual(source){
    const fig=source.cloneNode(true);
    fig.removeAttribute('data-visual');
    const kind=source.dataset.kind||'historical';
    fig.className=('inline-visual '+kind+' '+(source.dataset.class||'')).trim();
    return fig;
  }

  function appendVisual(page,source,newContinuation){
    // Avoid dropping a large visual into the last sliver of a page.
    const body=q('.layout-body',page);
    const used=body.scrollHeight/body.clientHeight;
    if(used>.72) page=newContinuation();

    let fig=makeVisual(source);
    flowOf(page).appendChild(fig);
    if(pageOverflow(page)){
      flowOf(page).removeChild(fig);
      page=newContinuation();
      fig=makeVisual(source);
      flowOf(page).appendChild(fig);
    }
    return page;
  }

  function attachNote(page,source,newContinuation){
    if(q('.margin-note',page)) page=newContinuation();
    if(contentAmount(page)>.80) page=newContinuation();

    const flow=flowOf(page);
    const shape=document.createElement('span');
    shape.className='margin-note-shape';
    shape.setAttribute('aria-hidden','true');

    const note=document.createElement('aside');
    note.className='margin-note';
    note.innerHTML=
      '<div class="label">'+(source.dataset.label||'时代旁注')+'</div>'+
      '<h3>'+source.dataset.title+'</h3>'+
      '<div class="note-copy">'+source.innerHTML+'</div>';

    flow.insertBefore(shape,flow.firstChild);
    flow.appendChild(note);
    if(window.BookEditorialLayout) window.BookEditorialLayout.syncMarginNotes(page);

    if(pageOverflow(page)){
      shape.remove();note.remove();
      page=newContinuation();
      const f=flowOf(page);
      f.insertBefore(shape,f.firstChild);
      f.appendChild(note);
      if(window.BookEditorialLayout) window.BookEditorialLayout.syncMarginNotes(page);
    }
    return page;
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
        '<div class="cover-deck">'+source.dataset.deck.replace(/\n/g,'<br>')+'</div>'+
      '</div>'+
      '<div class="page-foot"><span>没有剧透的中国</span><b></b></div>';
    track.appendChild(page);
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
          const result=appendParagraph(current,node,newContinuation);
          current=result.page;
        }else if(node.matches('figure[data-visual]')){
          current=appendVisual(current,node,newContinuation);
        }else if(node.matches('aside[data-note]')){
          current=attachNote(current,node,newContinuation);
        }
        if(window.BookEditorialLayout) window.BookEditorialLayout.syncMarginNotes(current);
      }
    }

    const pages=numberPages(track);
    if(window.BookEditorialLayout){
      window.BookEditorialLayout.syncMarginNotes(track);
      requestAnimationFrame(()=>window.BookEditorialLayout.auditLayout(track));
    }
    return pages;
  }

  window.BookChapterPaginator={build};
})();