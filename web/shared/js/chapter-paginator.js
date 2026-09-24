(function(){
  const q=(s,r=document)=>r.querySelector(s);

  function splitSentences(text){
    const out=[]; let buf='';
    for(const ch of text){
      buf+=ch;
      if('。！？；'.includes(ch)){out.push(buf);buf='';}
    }
    if(buf)out.push(buf);
    return out.length?out:[text];
  }

  function flowOf(page){return q('.page-flow',page)}
  function bodyOf(page){return q('.layout-body',page)}
  function hasEditorial(page){return !!q('figure.inline-visual,.inline-visual-rail,.margin-note',page)}

  function contentNodes(page){
    const flow=flowOf(page);
    if(!flow)return [];
    return [...flow.children].filter(el=>
      !el.classList.contains('margin-note-shape') &&
      (el.matches('p')||el.matches('figure.inline-visual')||el.matches('.inline-visual-rail'))
    );
  }

  function pageMetrics(page){
    const body=bodyOf(page);
    const br=body.getBoundingClientRect();
    const nodes=contentNodes(page);
    let bottom=br.top;
    let overflow=false;
    for(const el of nodes){
      const r=el.getBoundingClientRect();
      bottom=Math.max(bottom,r.bottom);
      if(r.bottom>br.bottom+1)overflow=true;
    }
    const note=q('.margin-note',page);
    if(note && note.getBoundingClientRect().top<br.top-1)overflow=true;
    return {overflow,gap:Math.max(0,br.bottom-bottom),nodes};
  }

  function createPage(track,sceneTitle,{sceneStart=false}={}){
    const page=document.createElement('section');
    page.className='book-page'+(sceneStart?' scene-opener':' continuation-page');
    page.dataset.scene=sceneTitle;
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
      if(sceneTitle.length>15)title.classList.add('long');
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
    page._editorialSource={type:'note',source};
    if(window.BookEditorialLayout)window.BookEditorialLayout.syncMarginNote(page);
  }

  function removeEditorial(page){
    const info=page._editorialSource||null;
    q('figure.inline-visual',page)?.remove();
    q('.inline-visual-rail',page)?.remove();
    removeNote(page);
    page._editorialSource=null;
    return info;
  }

  function makeVisual(source){
    const fig=source.cloneNode(true);
    fig.removeAttribute('data-visual');
    const kind=source.dataset.kind||'historical';
    fig.className=('inline-visual '+kind+' '+(source.dataset.class||'')).trim();
    return fig;
  }

  function installVisual(page,source){
    const fig=makeVisual(source);
    flowOf(page).appendChild(fig);
    page._editorialSource={type:'visual',source};
    return fig;
  }

  function makeVisualRail(source){
    const rail=source.cloneNode(true);
    rail.removeAttribute('data-visual-rail');
    rail.className='inline-visual-rail';
    const figures=[...rail.querySelectorAll('figure')];
    rail.dataset.count=String(figures.length);
    figures.forEach(fig=>{
      fig.removeAttribute('data-visual');
      fig.className='';
    });
    return rail;
  }

  function installVisualRail(page,source){
    const rail=makeVisualRail(source);
    flowOf(page).appendChild(rail);
    page._editorialSource={type:'visual-rail',source};
    return rail;
  }

  function tryPlaceEditorial(page,item){
    if(!item||hasEditorial(page))return false;
    if(item.type==='visual'){
      const fig=installVisual(page,item.source);
      if(pageMetrics(page).overflow){
        fig.remove();
        page._editorialSource=null;
        return false;
      }
      return true;
    }
    if(item.type==='visual-rail'){
      const rail=installVisualRail(page,item.source);
      if(pageMetrics(page).overflow){
        rail.remove();
        page._editorialSource=null;
        return false;
      }
      return true;
    }
    installNote(page,item.source);
    if(pageMetrics(page).overflow){
      removeNote(page);
      page._editorialSource=null;
      return false;
    }
    return true;
  }

  function normalizeParagraph(source){
    const p=source.cloneNode(true);
    p.removeAttribute('data-source');
    return p;
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

  function isEmptyPage(page){
    if(page.classList.contains('cover-page'))return false;
    return contentNodes(page).length===0 && !q('.margin-note',page);
  }

  function pruneEmptyPages(track){
    [...track.querySelectorAll('.book-page')].forEach(page=>{
      if(isEmptyPage(page))page.remove();
    });
  }

  function firstMovableParagraph(page){
    return [...flowOf(page).children].find(el=>el.matches('p'));
  }

  function lastMovableParagraph(page){
    const arr=[...flowOf(page).children].filter(el=>el.matches('p'));
    return arr.at(-1)||null;
  }

  function rebalanceScenePages(track,sceneTitle){
    const pages=[...track.querySelectorAll('.book-page')].filter(p=>p.dataset.scene===sceneTitle);
    for(let pass=0;pass<4;pass++){
      let changed=false;
      for(let i=0;i<pages.length-1;i++){
        const a=pages[i], b=pages[i+1];
        if(pageMetrics(a).gap<70)continue;
        let moved=0;
        while(pageMetrics(a).gap>55){
          const p=firstMovableParagraph(b);
          if(!p)break;
          flowOf(a).appendChild(p);
          if(a.classList.contains('has-note')&&window.BookEditorialLayout){
            window.BookEditorialLayout.syncMarginNote(a);
          }
          if(pageMetrics(a).overflow){
            flowOf(b).insertBefore(p,firstMovableParagraph(b)||q('figure.inline-visual',b)||null);
            break;
          }
          moved++; changed=true;
          if(contentNodes(b).filter(n=>n.matches('p')).length<=1 && hasEditorial(b))break;
        }
        if(moved && isEmptyPage(b))b.remove();
      }
      if(!changed)break;
    }
  }

  async function build({sourceSelector='#chapterSource',trackSelector='#bookTrack'}={}){
    const source=q(sourceSelector);
    const track=q(trackSelector);
    if(!source||!track)throw new Error('chapter source/track missing');

    track.innerHTML='';
    createCover(track,source);

    const scenes=[...source.content.querySelectorAll('.scene-source')];

    for(const scene of scenes){
      const sceneTitle=scene.dataset.title;
      const pending=[];
      let current=createPage(track,sceneTitle,{sceneStart:true});

      const startContinuation=()=>{
        const p=createPage(track,sceneTitle,{sceneStart:false});
        if(pending.length && tryPlaceEditorial(p,pending[0]))pending.shift();
        return p;
      };

      const appendParagraph=(sourceP)=>{
        let p=normalizeParagraph(sourceP);
        flowOf(current).appendChild(p);
        if(current.classList.contains('has-note')&&window.BookEditorialLayout){
          window.BookEditorialLayout.syncMarginNote(current);
        }
        if(!pageMetrics(current).overflow)return;

        p.remove();

        const parts=(!sourceP.children.length && sourceP.textContent.length>=34)
          ? splitSentences(sourceP.textContent):[];

        if(parts.length>1){
          const partial=document.createElement('p');
          partial.className=sourceP.className;
          flowOf(current).appendChild(partial);
          let used=0;
          for(let i=0;i<parts.length;i++){
            partial.textContent+=parts[i];
            if(pageMetrics(current).overflow){
              partial.textContent=partial.textContent.slice(0,-parts[i].length);
              break;
            }
            used=i+1;
          }
          if(used===0)partial.remove();

          const rest=parts.slice(used).join('');
          if(!rest)return;
          current=startContinuation();
          const rem=document.createElement('p');
          rem.className=(sourceP.className+' split-continuation').trim();
          rem.textContent=rest;
          flowOf(current).appendChild(rem);
          if(pageMetrics(current).overflow){
            const info=removeEditorial(current);
            if(info)pending.unshift(info);
            if(pageMetrics(current).overflow){
              rem.remove();
              const bare=createPage(track,sceneTitle,{sceneStart:false});
              flowOf(bare).appendChild(rem);
              current=bare;
            }
          }
          return;
        }

        current=startContinuation();
        flowOf(current).appendChild(p);
        if(pageMetrics(current).overflow){
          const info=removeEditorial(current);
          if(info)pending.unshift(info);
        }
      };

      for(const node of [...scene.children]){
        if(node.matches('p')){
          appendParagraph(node);
          continue;
        }

        if(node.matches('figure[data-visual]')){
          const item={type:'visual',source:node};
          if(!tryPlaceEditorial(current,item))pending.push(item);
          continue;
        }

        if(node.matches('[data-visual-rail]')){
          const count=node.querySelectorAll('figure').length;
          if(count<2 || count>3){
            console.warn('[book-layout] visual rail expects 2–3 figures', {count});
          }
          const item={type:'visual-rail',source:node};
          if(!tryPlaceEditorial(current,item))pending.push(item);
          continue;
        }

        if(node.matches('aside[data-note]')){
          const item={type:'note',source:node};
          if(!tryPlaceEditorial(current,item))pending.push(item);
        }
      }

      // Any editorial item still pending must share a page with nearby prose.
      while(pending.length){
        const previous=current;
        current=createPage(track,sceneTitle,{sceneStart:false});
        const item=pending.shift();
        tryPlaceEditorial(current,item);

        let moved=0;
        while(moved<6){
          const tail=lastMovableParagraph(previous);
          if(!tail)break;
          flowOf(current).appendChild(tail);
          if(current.classList.contains('has-note')&&window.BookEditorialLayout){
            window.BookEditorialLayout.syncMarginNote(current);
          }
          if(pageMetrics(current).overflow){
            flowOf(previous).appendChild(tail);
            break;
          }
          moved++;
          if(pageMetrics(current).gap<180)break;
        }
      }

      rebalanceScenePages(track,sceneTitle);
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