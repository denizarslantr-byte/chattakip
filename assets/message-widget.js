
/* Piano Deri - Admin/Merkez/Otel gerçek zamanlı mesajlaşma */
(function(){
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  const esc = (v)=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const nowIso = ()=>new Date().toISOString();
  const timeFmt = (iso)=>{try{return new Date(iso).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});}catch(_){return ''}};
  const dateFmt = (iso)=>{try{return new Date(iso).toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'});}catch(_){return ''}};
  let state={role:'',name:'',hotel:'',key:'',messages:[],hotels:[],tab:'inbox',open:false,lastToastId:''};

  function detectUser(){
    const path = String(location.pathname || '').toLowerCase();
    const title = String(document.title || '').toLowerCase();
    const u = window._pianoUser || (()=>{try{return JSON.parse(sessionStorage.getItem('pianoUser')||'null')}catch(_){return null}})();

    // Sayfa yolunu öncelikli kullan. Merkez sayfasında localStorage'da eski otel kalmışsa
    // önceki sürüm merkez ekranını yanlışlıkla "otel" sanıyordu ve alıcı olarak sadece Merkez gösteriyordu.
    if(path.includes('/admin/') || title.includes('admin')){
      return {role:'admin',name:(u && (u.name||u.username)) || 'Admin',hotel:'',key:'admin'};
    }
    if(path.includes('/center/') || title.includes('merkez')){
      return {role:'merkez',name:(u && (u.name||u.username)) || 'Merkez Operasyon',hotel:'',key:'merkez'};
    }
    if(path.includes('/hotel/') || title.includes('otel')){
      const hotel = localStorage.getItem('hotel') || (u && u.hotel) || '';
      return {role:'otel',name:hotel || 'Otel',hotel:hotel || '',key:'otel_'+(hotel || 'Otel')};
    }

    if(u && (u.role==='admin'||u.role==='merkez')){
      return {role:u.role,name:u.name||u.username||(u.role==='admin'?'Admin':'Merkez Operasyon'),hotel:'',key:u.role};
    }
    const hotel = localStorage.getItem('hotel') || '';
    if(hotel) return {role:'otel',name:hotel,hotel,key:'otel_'+hotel};
    return {role:'merkez',name:'Merkez Operasyon',hotel:'',key:'merkez'};
  }

  async function db(){
    if(typeof window.initFirebase==='function') return await window.initFirebase();
    if(typeof initFirebase==='function') return await initFirebase();
    throw new Error('Firebase başlatılamadı');
  }
  async function read(path){
    if(typeof window.fbGet==='function') return await window.fbGet(path);
    const database=await db(); const snap=await window._fb.get(window._fb.ref(database,path)); return snap.exists()?snap.val():null;
  }
  async function writePush(path,data){
    if(typeof window.fbPush==='function') return await window.fbPush(path,data);
    const database=await db(); const r=await window._fb.push(window._fb.ref(database,path),data); return r.key;
  }
  async function patch(path,data){
    if(typeof window.fbUpdate==='function') return await window.fbUpdate(path,data);
    const database=await db(); return await window._fb.update(window._fb.ref(database,path),data);
  }

  function canReceive(m){
    if(!m) return false;
    if(m.fromKey===state.key) return false;
    // Toplu mesaj sadece otel panellerine gider. Admin/Merkez kendi toplu mesajını gelenlerde görmez.
    if(m.toRole==='all_hotels' || m.toRole==='all') return state.role==='otel';
    if(m.toRole===state.role){
      if(state.role==='otel') return !m.toHotel || String(m.toHotel)===String(state.hotel);
      return true;
    }
    if(m.toKey && m.toKey===state.key) return true;
    return false;
  }
  function isSent(m){ return m && m.fromKey===state.key; }
  function isUnread(m){ return canReceive(m) && !(m.readBy && m.readBy[state.key]); }
  function incoming(){ return state.messages.filter(canReceive).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))); }
  function sent(){ return state.messages.filter(isSent).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))); }
  function unreadCount(){ return state.messages.filter(isUnread).length; }

  async function loadHotels(){
    try{
      let list=[];
      if(typeof window.getHotels==='function') list=await window.getHotels();
      else if(window._fbAPI?.getHotels) list=await window._fbAPI.getHotels();
      else { const data=await read('oteller'); list=data?Object.values(data):[]; }
      state.hotels=(Array.isArray(list)?list:[]).map(h=>h.hotel||h.name||h.otel||'').filter(Boolean).sort((a,b)=>a.localeCompare(b,'tr'));
    }catch(e){ state.hotels=[]; }
  }

  function injectEntryButton(){
    let btn=null;
    if(state.role==='merkez'){
      const side=$('.side-menu');
      if(side && !$('#pianoMsgMenuBtn')){
        btn=document.createElement('button'); btn.id='pianoMsgMenuBtn'; btn.className='btn-dark piano-msg-entry-btn'; btn.innerHTML='💬 MESAJLAR <span class="piano-msg-badge">0</span>'; btn.onclick=togglePanel; side.appendChild(btn);
      }
    } else if(state.role==='admin'){
      const bar=$('.tab-bar');
      if(bar && !$('#pianoMsgMenuBtn')){
        btn=document.createElement('button'); btn.id='pianoMsgMenuBtn'; btn.className='tab-btn piano-msg-entry-btn'; btn.innerHTML='💬 Mesajlar <span class="piano-msg-badge">0</span>'; btn.onclick=togglePanel; bar.appendChild(btn);
      }
    } else if(state.role==='otel'){
      const top=$('.panel-card');
      if(top && !$('#pianoMsgMenuBtn')){
        btn=document.createElement('button'); btn.id='pianoMsgMenuBtn'; btn.className='btn-dark btn-sm piano-msg-entry-btn'; btn.innerHTML='💬 Mesajlar <span class="piano-msg-badge">0</span>'; btn.onclick=togglePanel; const logout=[...top.querySelectorAll('button')].pop(); top.insertBefore(btn, logout || null);
      }
    }
    return !!$('#pianoMsgMenuBtn');
  }

  function buildUI(){
    if($('#pianoMsgPanel')) return;
    injectEntryButton();
    const fab=document.createElement('button'); fab.id='pianoMsgFab'; fab.title='Mesajlar'; fab.innerHTML='💬 <span class="piano-msg-badge">0</span>'; fab.onclick=togglePanel; document.body.appendChild(fab);
    const panel=document.createElement('div'); panel.id='pianoMsgPanel'; panel.innerHTML=`
      <div class="piano-msg-head"><div class="piano-msg-title">MESAJLAR <span class="piano-msg-badge">0</span></div><button class="piano-msg-icon-btn" id="pianoMsgMin">⌃</button><button class="piano-msg-icon-btn" id="pianoMsgClose">×</button></div>
      <div class="piano-msg-tabs"><button data-tab="inbox" class="active">GELEN</button><button data-tab="sent">GÖNDERİLEN</button><button data-tab="new">YENİ MESAJ</button></div>
      <div class="piano-msg-body" id="pianoMsgBody"></div>
      <div class="piano-msg-compose" id="pianoMsgCompose" style="display:none">
        <select id="pianoMsgTo"></select>
        <textarea id="pianoMsgText" placeholder="Mesajınızı yazın..."></textarea>
        <button class="piano-msg-send" id="pianoMsgSend">MESAJ GÖNDER</button>
      </div>`;
    document.body.appendChild(panel);
    const toast=document.createElement('div'); toast.className='piano-msg-toast'; toast.id='pianoMsgToast'; document.body.appendChild(toast);
    // Admin panel bazı sayfalarda sonradan açıldığı için menü butonunu birkaç kez yeniden dene.
    setTimeout(injectEntryButton, 300);
    setTimeout(injectEntryButton, 1000);
    setTimeout(injectEntryButton, 2500);
    $('#pianoMsgClose').onclick=()=>setOpen(false); $('#pianoMsgMin').onclick=()=>setOpen(false);
    $$('.piano-msg-tabs button',panel).forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab; $$('.piano-msg-tabs button',panel).forEach(x=>x.classList.toggle('active',x===b)); render();});
    $('#pianoMsgSend').onclick=sendMessage;
    fillRecipients(); render();
  }

  function fillRecipients(){
    const sel=$('#pianoMsgTo'); if(!sel) return;
    let opts=[];
    if(state.role==='admin'){
      // Admin: merkeze, tüm otellere veya tek tek otellere mesaj atabilir.
      opts.push(['merkez','Merkez Operasyon']);
      opts.push(['all_hotels','Tüm Oteller']);
      state.hotels.forEach(h=>opts.push(['otel:'+h,h]));
    } else if(state.role==='merkez'){
      // Merkez: sadece otellere mesaj atar. Admin'e mesaj göndermez.
      opts.push(['all_hotels','Tüm Oteller']);
      state.hotels.forEach(h=>opts.push(['otel:'+h,h]));
    } else {
      // Otel: listede sadece Merkez görünür ve sadece merkeze mesaj gönderir.
      opts.push(['merkez','Merkez Operasyon']);
    }
    sel.innerHTML=opts.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('');
  }

  function setOpen(v){ state.open=v; $('#pianoMsgPanel')?.classList.toggle('open',v); if(v){ markVisibleRead(); render(); } }
  function togglePanel(){ setOpen(!state.open); }

  function renderBadges(){
    const n=unreadCount();
    $$('.piano-msg-badge').forEach(b=>{ b.textContent=n; b.classList.toggle('show',n>0); });
  }
  function render(){
    renderBadges(); fillRecipients();
    const body=$('#pianoMsgBody'), comp=$('#pianoMsgCompose'); if(!body||!comp) return;
    comp.style.display = state.tab==='new' ? 'block' : 'none';
    if(state.tab==='new'){ body.innerHTML='<div class="piano-msg-empty">Alıcı seçip yeni mesaj yazabilirsiniz.</div>'; return; }
    const list = state.tab==='sent' ? sent() : incoming();
    if(!list.length){ body.innerHTML='<div class="piano-msg-empty">Mesaj yok.</div>'; return; }
    body.innerHTML=list.map(m=>`<div class="piano-msg-item" data-id="${esc(m.id)}">
      <div class="piano-msg-avatar">${state.tab==='sent'?'↗':'✓'}</div><div class="piano-msg-content"><div class="piano-msg-row"><div class="piano-msg-name">${esc(state.tab==='sent' ? (m.toName||m.toRole||'Alıcı') : (m.fromName||m.fromRole||'Gönderen'))}</div><div class="piano-msg-time">${timeFmt(m.createdAt)}</div>${isUnread(m)?'<span class="piano-msg-unread-dot">1</span>':''}</div><div class="piano-msg-text">${esc(m.text||'')}</div><div class="piano-msg-time" style="margin-top:4px">${dateFmt(m.createdAt)}</div></div>
    </div>`).join('');
    $$('.piano-msg-item',body).forEach(el=>el.onclick=()=>markRead(el.dataset.id));
  }

  async function markRead(id){
    const m=state.messages.find(x=>x.id===id); if(!m||!canReceive(m)||!isUnread(m)) return;
    await patch(`mesajlar/${id}/readBy`, {[state.key]: true});
  }
  async function markVisibleRead(){
    const list=incoming().filter(isUnread).slice(0,20);
    for(const m of list){ try{ await patch(`mesajlar/${m.id}/readBy`, {[state.key]: true}); }catch(_){} }
  }
  function recipientInfo(v){
    if(v==='merkez') return {toRole:'merkez',toKey:'merkez',toName:'Merkez Operasyon'};
    if(v==='all_hotels' || v==='all') return {toRole:'all_hotels',toKey:'all_hotels',toName:'Tüm Oteller'};
    if(v.startsWith('otel:')){ const h=v.slice(5); return {toRole:'otel',toHotel:h,toKey:'otel_'+h,toName:h}; }
    // Güvenlik: sadece admin paneli admin alıcısı kullanabilir.
    if(v==='admin' && state.role==='admin') return {toRole:'admin',toKey:'admin',toName:'Admin'};
    return {toRole:'merkez',toKey:'merkez',toName:'Merkez Operasyon'};
  }

  async function sendMessage(){
    const to=$('#pianoMsgTo')?.value||'merkez'; const text=($('#pianoMsgText')?.value||'').trim();
    if(!text){ alert('Mesaj yazın'); return; }
    const info=recipientInfo(to);
    if(state.role==='merkez' && !(info.toRole==='otel' || info.toRole==='all_hotels')) { alert('Merkez sadece otellere mesaj gönderebilir.'); return; }
    if(state.role==='otel' && info.toRole!=='merkez') { alert('Otel sadece merkeze mesaj gönderebilir.'); return; }
    await writePush('mesajlar',{...info,text,fromRole:state.role,fromName:state.name,fromHotel:state.hotel||'',fromKey:state.key,createdAt:nowIso(),readBy:{[state.key]:true}});
    $('#pianoMsgText').value=''; state.tab='sent'; $$('.piano-msg-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab==='sent')); render();
  }

  function toast(m){
    if(!m || state.open) return;
    const el=$('#pianoMsgToast'); if(!el) return;
    el.innerHTML=`<b>✅ Yeni Mesaj Geldi</b><span>${esc(m.fromName||'Gönderen')} tarafından yeni mesaj aldınız.</span>`;
    el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),5500);
  }
  async function listen(){
    try{
      const database=await db();
      const msgRef = window._fb.ref(database,'mesajlar');
      const msgQuery = (window._fb.query && window._fb.limitToLast)
        ? window._fb.query(msgRef, window._fb.limitToLast(80))
        : msgRef;
      window._fb.onValue(msgQuery,snap=>{
        const oldUnread = unreadCount();
        const data=snap.exists()?snap.val():{};
        state.messages=Object.entries(data).map(([id,v])=>({id,...v})).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
        const newest=incoming().find(isUnread);
        render();
        if(unreadCount()>oldUnread && newest && newest.id!==state.lastToastId){ state.lastToastId=newest.id; toast(newest); }
      });
    }catch(e){ console.error('Mesaj dinleme hatası',e); }
  }

  async function init(){
    state={...state,...detectUser()};
    await loadHotels();
    buildUI();
    await listen();
    window.pianoMessages={open:()=>setOpen(true),send:sendMessage,state};
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
