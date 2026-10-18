(function(){"use strict";const $=(s,root=document)=>root.querySelector(s),$$=(s,root=document)=>Array.from(root.querySelectorAll(s));const STORE="mid-drive-sop-v03/";function read(k){try{return localStorage.getItem(STORE+k)}catch(e){return null}}function write(k,v){try{localStorage.setItem(STORE+k,v)}catch(e){}}function page(){let slug=decodeURIComponent((location.hash||"#overview").slice(1));if(!document.getElementById(slug)||!document.getElementById(slug).classList.contains("view"))slug="overview";$$(".view").forEach(x=>x.classList.toggle("active",x.id===slug));$$(".mobile-dock a").forEach(x=>x.classList.toggle("active",x.getAttribute("href")==="#"+slug));$$("video").forEach(x=>{if(!x.closest(".view.active"))try{x.pause()}catch(e){}});window.scrollTo({top:0,behavior:"instant"});document.title=(slug==="overview"?"中置馬達安裝教學":($("#"+CSS.escape(slug)+" h1")?.textContent||"中置馬達安裝教學"))+"｜互動式 SOP"}window.addEventListener("hashchange",page);$$("input[type=checkbox][data-store]").forEach(x=>{x.checked=read(x.dataset.store)==="1";x.addEventListener("change",()=>{write(x.dataset.store,x.checked?"1":"0");update()})});$$("textarea[data-store],textarea[data-note],input[data-store]:not([type=checkbox])").forEach(x=>{const k=x.dataset.store||x.dataset.note;let v=read(k);if(v!==null)x.value=v;x.addEventListener("input",()=>write(k,x.value))});function isDone(i){const sec=document.getElementById("chapter-"+i);if(!sec)return false;const a=$$('input[type=checkbox][data-store]',sec);return a.length>0&&a.every(x=>x.checked)}function update(){let done=0;for(let i=1;i<=12;i++){const v=isDone(i);done+=+v;const label=$("#status-"+i);if(label){label.textContent=v?"已完成":"尚未完成";label.classList.toggle("done",v)}const c=$("#confirm-"+i);if(c){c.textContent=v?"本章已完成，記錄保存在此裝置。":"請核對並勾選上述各項。";c.classList.toggle("done",v)}}const count=$("#progress-count"),pct=$("#pct-large"),ring=$("#progress-ring");if(count)count.textContent=done+" / 12";if(pct)pct.textContent=Math.round(done/12*100)+"%";if(ring)ring.style.setProperty("--percentage",Math.round(done/12*100));const inspect=$$("input[data-store^='inspect-']");const accepted=inspect.length>0&&inspect.every(x=>x.checked);const status=$("#inspection-status");if(status)status.textContent=accepted?"已勾選全部驗收項目。請由安裝者依原廠資料最終覆核。":"驗收尚未完成（"+inspect.filter(x=>x.checked).length+" / "+inspect.length+"）";updateVisibility()}function updateVisibility(){const search=$("#search"),term=(search?.value||"").toLocaleLowerCase().trim();let matches=0;$$(".catalog-card").forEach(card=>{let hay=((card.dataset.search||"")+" "+card.textContent).toLocaleLowerCase();card.hidden=!!term&&!hay.includes(term);if(!card.hidden)matches++});const list=$("#catalog");if(list)list.setAttribute("aria-label",matches+"個符合的章節")}const search=$("#search");if(search)search.addEventListener("input",updateVisibility);const resetSearch=$("#reset-search");if(resetSearch)resetSearch.addEventListener("click",()=>{if(search){search.value="";search.focus();updateVisibility()}});const modal=$("#photo-modal"),big=$("#modal-image");function closePhoto(){if(modal){modal.hidden=true;if(big)big.removeAttribute("src");document.body.style.overflow=""}}$$(".photo-button").forEach(b=>b.addEventListener("click",()=>{if(!modal||!big)return;big.src=b.dataset.photo||$("img",b)?.src||"";big.alt=b.dataset.alt||"安裝細節";modal.hidden=false;document.body.style.overflow="hidden"}));$(".close-modal")?.addEventListener("click",closePhoto);modal?.addEventListener("click",e=>{if(e.target===modal)closePhoto()});window.addEventListener("keydown",e=>{if(e.key==="Escape")closePhoto()});$("#reset-data")?.addEventListener("click",()=>{if(!confirm("確定清除本機的勾選與備註？此操作無法復原。"))return;$$("[data-store],[data-note]").forEach(x=>{const k=x.dataset.store||x.dataset.note;if(x.type==="checkbox")x.checked=false;else x.value="";try{localStorage.removeItem(STORE+k)}catch(e){}});update()});$("#export-record")?.addEventListener("click",()=>{const now=new Date();const lines=["中置馬達安裝｜本機施工紀錄","匯出時間："+now.toLocaleString("zh-TW"),"註：本表是施工者勾選紀錄，不代表原廠檢驗認證。",""];for(let i=1;i<=12;i++){const sec=$("#chapter-"+i),title=$("h1",sec)?.textContent||"章節 "+i;lines.push("第 "+i+" 章 "+title+"： "+(isDone(i)?"已完成":"未完成"));$$("input[type=checkbox][data-store]",sec).forEach(x=>{let t=x.closest("label")?.innerText.replace(/\s+/g," ").trim()||x.dataset.store;lines.push((x.checked?"[V] ":"[ ] ")+t)});$$("textarea",sec).forEach(t=>{if(t.value.trim())lines.push("備註："+t.value.trim())})}lines.push("","工具清單");$$("input[data-store^='tool-']").forEach(x=>lines.push((x.checked?"[V] ":"[ ] ")+(x.closest("label")?.innerText||"").trim()));lines.push("","完工驗收");$$("input[data-store^='inspect-']").forEach(x=>lines.push((x.checked?"[V] ":"[ ] ")+(x.closest("label")?.innerText||"").trim()));try{const b=new Blob(["\ufeff"+lines.join("\n")],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(b),a=document.createElement("a");a.href=url;a.download="LD3800_我的安裝紀錄_"+now.toISOString().slice(0,10)+".txt";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}catch(e){alert("無法下載，請改用 Chrome 或 Samsung Internet 瀏覽器。")}});$$("video").forEach(v=>v.addEventListener("error",()=>{const box=v.closest(".video-card");if(!box||box.querySelector(".video-fallback"))return;const msg=document.createElement("p");msg.className="video-fallback";msg.style.cssText="padding:8px 16px;color:#9a5a0c;font-size:13px";msg.textContent="本章影片暫時無法載入，請先使用右下角的「原始完整影片」連結。";box.appendChild(msg)}));
/* A second, independently-rendered timeline for installation guidance. */
$("video[id^='video-']").forEach(v=>{
  const no=Number(v.id.replace("video-",""));
  const view=document.getElementById("chapter-"+no);
  const text=document.getElementById("hint-copy-"+no);
  const foot=document.getElementById("hint-step-"+no);
  if(!view||!text||!foot)return;
  const title=view.querySelector("h1")?.textContent||"安裝重點";
  const taskTexts=Array.from(view.querySelectorAll(".task-list .task-text")).map(n=>n.textContent.trim());
  const warning=view.querySelector(".warning-box p")?.textContent.trim()||"施工安全須依原廠規格覆核";
  let cues=null,lastIndex=-1;
  const seconds=s=>{const [h,m,t]=s.split(":");return Number(h)*3600+Number(m)*60+Number(t)};
  const draw=()=>{
    const t=v.currentTime||0, dur=(Number.isFinite(v.duration)&&v.duration>1)?v.duration:50;
    if(cues?.length){
      let idx=-1;for(let i=0;i<cues.length;i++)if(t>=cues[i].start)idx=i;
      if(idx<0)idx=0;
      if(idx!==lastIndex){lastIndex=idx;text.textContent=cues[idx].text;foot.textContent="操作重點 · 影片時間 "+Math.floor(t/60)+":"+String(Math.floor(t%60)).padStart(2,"0")+" · 請核對下方清單";}
      return;
    }
    let idx=t/dur>=.89?3:t/dur>=.69?2:t/dur>=.43?1:0;
    if(idx!==lastIndex){lastIndex=idx;text.textContent=idx===3?"安全提醒："+warning:taskTexts[idx]||title;foot.textContent="操作重點（參考進度） · 請核對下方清單";}
  };
  const no2=String(no).padStart(2,"0");
  fetch("assets/captions/chapter-"+no2+".vtt?v=13").then(resp=>{
    if(!resp.ok)throw Error("guidance track unavailable");
    return resp.text();
  }).then(data=>{
    const result=[];
    for(const chunk of data.replace(/\r/g,"").split(/\n\s*\n/)){
      const lines=chunk.split("\n").map(x=>x.trim()).filter(Boolean);
      const idx=lines.findIndex(x=>x.includes(" --> "));
      if(idx<0)continue;
      const time=lines[idx].split(" --> ")[0];
      const message=lines.slice(idx+1).join(" · ");
      if(message)result.push({start:seconds(time),text:message});
    }
    if(result.length){cues=result;lastIndex=-1;draw();}
  }).catch(()=>{});
  v.addEventListener("timeupdate",draw);
  v.addEventListener("seeked",draw);
  v.addEventListener("loadedmetadata",draw);
  draw();
});


/* Choose enhanced speech or original soundtrack without losing chapter progress. */
$(".audio-choice").forEach(group=>{
  const n=String(group.dataset.chapter||"").padStart(2,"0");
  const video=document.getElementById("video-"+Number(n));
  const source=video?.querySelector("source");
  if(!video||!source)return;
  let mode="clean";
  const locations={
    clean:"assets/video-ai/chapter-"+n+".mp4?v=16",
    original:"assets/video/chapter-"+n+".mp4"
  };
  const controls=$(".audio-mode-button",group);
  function activate(next){
    if(!Object.prototype.hasOwnProperty.call(locations,next)||next===mode)return;
    const time=Number(video.currentTime)||0;
    const resume=!video.paused&&!video.ended;
    mode=next;
    controls.forEach(b=>{
      const selected=b.dataset.audio===mode;
      b.classList.toggle("active",selected);
      b.setAttribute("aria-pressed",String(selected));
    });
    const restore=()=>{
      if(time>0&&Number.isFinite(video.duration)&&video.duration>time){
        try{video.currentTime=time}catch(e){}
      }
      try{for(const track of video.textTracks){if(track.kind==="subtitles")track.mode="showing"}}catch(e){}
      if(resume)video.play().catch(()=>{});
    };
    video.addEventListener("loadedmetadata",restore,{once:true});
    source.src=locations[mode];
    video.load();
  }
  controls.forEach(b=>b.addEventListener("click",()=>activate(b.dataset.audio)));
  video.addEventListener("error",()=>{if(mode==="clean"){activate("original");group.title="降噪音軌暫時無法播放，已切換原始音訊。";}});
});

page();update();document.documentElement.classList.add("app-ready")})();