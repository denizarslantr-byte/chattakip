let vehicleDb = null;
let map = null;
let markers = {};
let storeMarker = null;
let storeCircle = null;
let regionPolygon = null;
let vehicles = [];
let settings = null;
let refreshTimer = null;
let demoMode = true;
let selectedPlate = '';
let lastAlertSave = {};

const DEFAULT_SETTINGS = {
  tnbUrl: 'https://ws.ats.tnbmobil.com.tr/webservis.asmx',
  tnbCompany: '3029',
  tnbUsername: 'kayaderiwb',
  tnbPassword: '1234',
  proxyUrl: '',
  storeLat: 36.5979,
  storeLng: 30.5636,
  alertKm: 1,
  refreshSec: 60,
  regionLat: 36.5979,
  regionLng: 30.5636
};

const REGION_POINTS = [
  { name:'Beldibi', lat:36.7134, lng:30.5658 },
  { name:'Göynük', lat:36.6601, lng:30.5501 },
  { name:'Kemer', lat:36.6014, lng:30.5595 },
  { name:'Kiriş', lat:36.5750, lng:30.5765 },
  { name:'Çamyuva', lat:36.5581, lng:30.5642 },
  { name:'Tekirova', lat:36.5018, lng:30.5273 }
];

function $(id){ return document.getElementById(id); }
function setStatus(text, cls='pending') { const el=$('connectionStatus'); if(el){ el.className='badge '+cls; el.textContent=text; } }
function safeKey(s){ return String(s||'').replace(/[.#$\[\]/]/g,'_'); }

async function initVehicleFirebase(){
  if(vehicleDb) return vehicleDb;
  const cfg = window.FIREBASE_ARAC_CONFIG || (typeof FIREBASE_ARAC_CONFIG !== 'undefined' ? FIREBASE_ARAC_CONFIG : null);
  if(!cfg) throw new Error('FIREBASE_ARAC_CONFIG bulunamadı');
  if(!cfg.apiKey || cfg.apiKey.includes('BURAYA_')) throw new Error('Yeni Firebase bilgileri config/firebase_arac_takip.js içine yazılmalı');
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
  const { getDatabase, ref, get, set, push } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
  const app = initializeApp(cfg, 'aracTakipApp');
  vehicleDb = getDatabase(app);
  window._aracFb = { ref, get, set, push };
  return vehicleDb;
}

async function dbGet(path){ const db=await initVehicleFirebase(); const s=await _aracFb.get(_aracFb.ref(db,path)); return s.exists()?s.val():null; }
async function dbSet(path,data){ const db=await initVehicleFirebase(); await _aracFb.set(_aracFb.ref(db,path),data); }
async function dbPush(path,data){ const db=await initVehicleFirebase(); return (await _aracFb.push(_aracFb.ref(db,path),data)).key; }

async function loadSettings(){
  try{
    const saved = await dbGet('aracTakip/ayarlar');
    settings = { ...DEFAULT_SETTINGS, ...(saved||{}) };
    demoMode = !settings.proxyUrl;
    fillSettingsForm();
    setStatus(demoMode ? 'Demo Mod' : 'TNB Bağlı', demoMode ? 'pending' : 'exited');
  }catch(e){
    settings = { ...DEFAULT_SETTINGS };
    demoMode = true;
    fillSettingsForm();
    setStatus('Firebase ayarı bekliyor', 'cancelled');
    console.warn(e);
  }
}

function fillSettingsForm(){
  $('setTnbUrl').value = settings.tnbUrl || DEFAULT_SETTINGS.tnbUrl;
  $('setTnbCompany').value = settings.tnbCompany || '3029';
  $('setTnbUser').value = settings.tnbUsername || 'kayaderiwb';
  $('setTnbPass').value = settings.tnbPassword || '';
  $('setProxyUrl').value = settings.proxyUrl || '';
  $('setStoreLat').value = settings.storeLat || '';
  $('setStoreLng').value = settings.storeLng || '';
  $('setAlertKm').value = settings.alertKm || 1;
  $('setRefreshSec').value = settings.refreshSec || 60;
  $('setRegionLat').value = settings.regionLat || 36.5979;
  $('setRegionLng').value = settings.regionLng || 30.5636;
}

function readSettingsForm(){
  return {
    tnbUrl: $('setTnbUrl').value.trim(),
    tnbCompany: $('setTnbCompany').value.trim(),
    tnbUsername: $('setTnbUser').value.trim(),
    tnbPassword: $('setTnbPass').value,
    proxyUrl: $('setProxyUrl').value.trim(),
    storeLat: Number($('setStoreLat').value || DEFAULT_SETTINGS.storeLat),
    storeLng: Number($('setStoreLng').value || DEFAULT_SETTINGS.storeLng),
    alertKm: Number($('setAlertKm').value || 1),
    refreshSec: Math.max(15, Number($('setRefreshSec').value || 60)),
    regionLat: Number($('setRegionLat').value || DEFAULT_SETTINGS.regionLat),
    regionLng: Number($('setRegionLng').value || DEFAULT_SETTINGS.regionLng)
  };
}

async function saveSettings(){
  settings = readSettingsForm();
  try{ await dbSet('aracTakip/ayarlar', settings); alert('Ayarlar kaydedildi.'); }
  catch(e){ alert('Firebase kaydı yapılamadı: '+e.message); }
  demoMode = !settings.proxyUrl;
  loadMapFromSettings();
  startAutoRefresh();
}

function openSettings(){ $('settingsModal').style.display='flex'; }
function closeSettings(){ $('settingsModal').style.display='none'; }
function toggleDemoMode(){ demoMode=!demoMode; $('demoBtn').textContent = demoMode ? 'Demo Mod Açık' : 'Canlı Mod'; refreshVehicles(true); }

function loadMapFromSettings(){
  if(!window.L){ setStatus('Leaflet yüklenemedi','cancelled'); return; }
  const center = [Number(settings.regionLat||DEFAULT_SETTINGS.regionLat), Number(settings.regionLng||DEFAULT_SETTINGS.regionLng)];
  if(!map){
    map = L.map('map', { zoomControl:true }).setView(center, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  }else{
    map.setView(center, map.getZoom() || 11);
  }

  if(storeMarker) map.removeLayer(storeMarker);
  if(storeCircle) map.removeLayer(storeCircle);
  if(regionPolygon) map.removeLayer(regionPolygon);

  const storeLatLng = [Number(settings.storeLat), Number(settings.storeLng)];
  const storeIcon = L.divIcon({ className:'', html:'<div class="osm-store-marker">🏬 MAĞAZA</div>', iconSize:null, iconAnchor:[35,16] });
  storeMarker = L.marker(storeLatLng, { icon:storeIcon }).addTo(map).bindPopup('<b>Piano Deri Mağaza</b><br>1 KM yaklaşma uyarı merkezi');
  storeCircle = L.circle(storeLatLng, { radius: Number(settings.alertKm||1)*1000, color:'#d6a63f', weight:2, fillColor:'#d6a63f', fillOpacity:.12 }).addTo(map);

  const polygonPoints = REGION_POINTS.map(p=>[p.lat,p.lng]);
  regionPolygon = L.polygon(polygonPoints, { color:'#22c55e', weight:2, fillColor:'#22c55e', fillOpacity:.08 }).addTo(map);
  REGION_POINTS.forEach(p=>{
    L.circleMarker([p.lat,p.lng], { radius:4, color:'#d6a63f', fillColor:'#d6a63f', fillOpacity:1 }).addTo(map).bindTooltip(p.name, { permanent:false });
  });

  try{ map.fitBounds(regionPolygon.getBounds().pad(.22)); }catch(e){}
  renderMarkers();
}

function distanceKm(lat1, lon1, lat2, lon2){
  const R=6371;
  const dLat=(lat2-lat1)*Math.PI/180;
  const dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function demoVehicles(){
  return [
    {plaka:'07 PNO 101', lat:36.6061, lng:30.5602, hiz:48, kontak:true, musteriIceride:true, otel:'Kemer Hotel', sofor:'Ali', gunlukKm:84, sonGuncelleme:new Date().toISOString()},
    {plaka:'07 PNO 202', lat:36.5840, lng:30.5734, hiz:22, kontak:true, musteriIceride:true, otel:'Kiriş Resort', sofor:'Mehmet', gunlukKm:63, sonGuncelleme:new Date().toISOString()},
    {plaka:'07 PNO 303', lat:36.6601, lng:30.5501, hiz:0, kontak:false, musteriIceride:false, otel:'Göynük', sofor:'Hasan', gunlukKm:41, sonGuncelleme:new Date().toISOString()},
    {plaka:'07 PNO 404', lat:36.5581, lng:30.5642, hiz:36, kontak:true, musteriIceride:false, otel:'Çamyuva', sofor:'Murat', gunlukKm:97, sonGuncelleme:new Date().toISOString()},
    {plaka:'07 PNO 505', lat:36.5018, lng:30.5273, hiz:52, kontak:true, musteriIceride:true, otel:'Tekirova', sofor:'Cem', gunlukKm:128, sonGuncelleme:new Date().toISOString()}
  ];
}

async function fetchTnbVehicles(){
  if(!settings.proxyUrl) throw new Error('Firebase Function URL boş');
  const r = await fetch(settings.proxyUrl, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({
      tnbUrl: settings.tnbUrl,
      companyCode: settings.tnbCompany,
      username: settings.tnbUsername,
      password: settings.tnbPassword
    })
  });
  const data = await r.json();
  if(!r.ok || data.success===false) throw new Error(data.message || 'TNB servis hatası');
  const arr = data.vehicles || data.data || [];
  return arr.map(v=>({
    plaka: v.plaka || v.plate || v.PLAKA || v.License_Plate || '',
    lat: Number(v.lat || v.latitude || v.ENLEM || v.Lat || 0),
    lng: Number(v.lng || v.lon || v.longitude || v.BOYLAM || v.Lng || 0),
    hiz: Number(v.hiz || v.speed || v.HIZ || v.Speed || 0),
    kontak: Boolean(v.kontak ?? v.ignition ?? v.KONTAK),
    musteriIceride: Boolean(v.musteriIceride || v.customerInside || false),
    otel: v.otel || v.hotel || '',
    sofor: v.sofor || v.driver || '',
    gunlukKm: Number(v.gunlukKm || v.dailyKm || v.KM || v.Mileage || 0),
    sonGuncelleme: v.sonGuncelleme || v.lastUpdate || new Date().toISOString()
  })).filter(v=>v.plaka && v.lat && v.lng);
}

async function refreshVehicles(manual=false){
  try{
    vehicles = demoMode ? demoVehicles() : await fetchTnbVehicles();
    await saveLastPositions();
    renderVehicleList();
    renderMarkers();
    renderAlerts();
    renderSummary();
    setStatus(demoMode ? 'Demo Mod' : 'Canlı', demoMode ? 'pending' : 'exited');
  }catch(e){
    setStatus('TNB hata', 'cancelled');
    console.error(e);
    if(manual) alert('Araç verisi alınamadı: '+e.message);
    vehicles = demoVehicles();
    renderVehicleList(); renderMarkers(); renderAlerts(); renderSummary();
  }
}

async function saveLastPositions(){
  try{
    const pack = {}; vehicles.forEach(v=>{ pack[safeKey(v.plaka)]={...v, kayitZamani:new Date().toISOString()}; });
    await dbSet('aracTakip/sonKonumlar', pack);
  }catch(e){ console.warn('son konum yazılamadı', e); }
}

function renderVehicleList(){
  const q=($('vehicleSearch').value||'').toUpperCase();
  const list=vehicles.filter(v=>!q || String(v.plaka).toUpperCase().includes(q));
  $('vehicleCount').textContent=list.length;
  $('vehicleList').innerHTML = list.map(v=>{
    const dist = distanceKm(v.lat,v.lng,settings.storeLat,settings.storeLng);
    const cls = v.hiz>3 ? 'vehicle-moving' : (v.kontak ? 'vehicle-stop':'vehicle-off');
    const st = v.hiz>3 ? 'HAREKETLİ' : (v.kontak ? 'BEKLİYOR':'KONTAK KAPALI');
    return `<div class="vehicle-card ${selectedPlate===v.plaka?'active':''}" onclick="selectVehicle('${String(v.plaka).replace(/'/g,'')}')">
      <div class="vehicle-plate">${v.plaka}</div>
      <div class="vehicle-meta">Şoför: ${v.sofor||'—'} · Hız: ${v.hiz||0} km/h<br>Otel: ${v.otel||'—'}<br>Mağazaya: ${dist.toFixed(2)} km · Günlük: ${v.gunlukKm||0} km</div>
      <span class="vehicle-status ${cls}">${st}</span> ${v.musteriIceride?'<span class="badge entered">MÜŞTERİ İÇERİDE</span>':''}
    </div>`;
  }).join('') || '<div class="vehicle-small">Araç yok.</div>';
}

function selectVehicle(plate){
  selectedPlate=plate; renderVehicleList();
  const v=vehicles.find(x=>x.plaka===plate);
  if(v && map){ map.setView([v.lat,v.lng], 14); if(markers[plate]) markers[plate].openPopup(); }
}

function markerClass(v){
  const dist = distanceKm(v.lat,v.lng,settings.storeLat,settings.storeLng);
  if(v.musteriIceride && dist <= Number(settings.alertKm||1)) return 'near';
  return v.musteriIceride ? 'customer' : '';
}

function renderMarkers(){
  if(!map || !window.L) return;
  Object.values(markers).forEach(m=>map.removeLayer(m)); markers={};
  vehicles.forEach(v=>{
    const dist = distanceKm(v.lat,v.lng,settings.storeLat,settings.storeLng);
    const html = `<div class="osm-vehicle-marker ${markerClass(v)}">🚗 ${v.plaka}</div>`;
    const icon = L.divIcon({ className:'', html, iconSize:null, iconAnchor:[40,16] });
    const marker = L.marker([v.lat,v.lng], { icon, title:v.plaka }).addTo(map);
    marker.bindPopup(`<div style="min-width:190px"><b>${v.plaka}</b><br>Hız: ${v.hiz||0} km/h<br>Şoför: ${v.sofor||'—'}<br>Otel: ${v.otel||'—'}<br>Mağazaya: ${dist.toFixed(2)} km<br>${v.musteriIceride?'✅ Müşteri içeride':'—'}</div>`);
    markers[v.plaka]=marker;
  });
}

function renderAlerts(){
  const near = vehicles.filter(v=>v.musteriIceride && distanceKm(v.lat,v.lng,settings.storeLat,settings.storeLng)<=Number(settings.alertKm||1));
  $('alertList').innerHTML = near.map(v=>{
    const d=distanceKm(v.lat,v.lng,settings.storeLat,settings.storeLng);
    saveAlert(v,d);
    return `<div class="vehicle-alert"><b>🚨 ${v.plaka}</b><br>Mağazaya <b>${Math.round(d*1000)} metre</b> kaldı.<br><span class="vehicle-small">Otel: ${v.otel||'—'} · Şoför: ${v.sofor||'—'} · Hız: ${v.hiz||0} km/h</span></div>`;
  }).join('') || '<div class="vehicle-small">Şu an 1 KM içinde müşteri taşıyan araç yok.</div>';
  if(near.length) beep();
}

async function saveAlert(v,d){
  const k = v.plaka;
  const now = Date.now();
  if(lastAlertSave[k] && now-lastAlertSave[k] < 60000) return;
  lastAlertSave[k]=now;
  try{ await dbPush('aracTakip/uyarilar', { plaka:v.plaka, mesafeKm:d, metre:Math.round(d*1000), otel:v.otel||'', sofor:v.sofor||'', hiz:v.hiz||0, tarih:new Date().toISOString(), durum:'1KM_YAKIN' }); }catch(e){}
}

let lastBeep=0;
function beep(){
  const now=Date.now(); if(now-lastBeep<15000) return; lastBeep=now;
  try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value=880; g.gain.value=.08; o.start(); setTimeout(()=>{o.stop();ctx.close();},350); }catch(e){}
}

function renderSummary(){
  const moving = vehicles.filter(v=>Number(v.hiz)>3).length;
  const inside = vehicles.filter(v=>v.musteriIceride).length;
  const near = vehicles.filter(v=>v.musteriIceride && distanceKm(v.lat,v.lng,settings.storeLat,settings.storeLng)<=Number(settings.alertKm||1)).length;
  const km = vehicles.reduce((s,v)=>s+(Number(v.gunlukKm)||0),0);
  $('sumMoving').textContent=moving;
  $('sumInside').textContent=inside;
  $('sumNear').textContent=near;
  $('sumKm').textContent=Math.round(km);
}

async function testTnbConnection(){
  const old = settings;
  settings = readSettingsForm();
  demoMode = false;
  try{ const arr=await fetchTnbVehicles(); alert('TNB bağlantısı başarılı. Araç sayısı: '+arr.length); }
  catch(e){ alert('TNB bağlantı testi başarısız: '+e.message); }
  finally{ settings=old; demoMode = !settings.proxyUrl; }
}

function exportVehicleDay(){
  const headers = ['PLAKA','SOFOR','OTEL','HIZ','KONTAK','MUSTERI_ICERIDE','GUNLUK_KM','MAGAZAYA_KM','LAT','LNG','SON_GUNCELLEME'];
  const rows = vehicles.map(v=>[
    v.plaka, v.sofor||'', v.otel||'', v.hiz||0, v.kontak?'ACIK':'KAPALI', v.musteriIceride?'EVET':'', v.gunlukKm||0,
    distanceKm(v.lat,v.lng,settings.storeLat,settings.storeLng).toFixed(2), v.lat, v.lng, v.sonGuncelleme||''
  ]);
  const csv = [headers, ...rows].map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(';')).join('\n');
  const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='arac-takip-gunluk-rapor.csv';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function startAutoRefresh(){
  if(refreshTimer) clearInterval(refreshTimer);
  const sec = Math.max(15, Number(settings.refreshSec||60));
  refreshTimer = setInterval(()=>refreshVehicles(false), sec*1000);
  $('demoBtn').textContent = demoMode ? 'Demo Mod Açık' : 'Canlı Mod';
}

window.addEventListener('DOMContentLoaded', async ()=>{
  await loadSettings();
  loadMapFromSettings();
  await refreshVehicles(false);
  startAutoRefresh();
});
