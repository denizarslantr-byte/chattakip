// ══════════════════════════════════════════════════════════════════
// Piano Deri — TNB Araç Takip Senkronizasyonu
// Dosya: apps-script/tnb-sync.gs
// Trigger: Her 1 dakikada bir syncTNBToFirebase() çalışır
// ══════════════════════════════════════════════════════════════════

// ── TNB Servis Bilgileri ─────────────────────────────────────────
const TNB_URL      = 'https://ws.ats.tnbmobil.com.tr/webservis.asmx';
const TNB_NS       = 'http://tempuri.org/';          // WSDL'den kontrol et
const TNB_METHOD   = 'GetSonKonumlar';                // ⚠️ WSDL'den doğrula!
const FIRMA_KOD    = '3029';
const TNB_USER     = 'kayaderiwb';
const TNB_PASS     = '1234';

// ── Firebase Bağlantısı ──────────────────────────────────────────
const FB_URL = 'https://rezervasyon-3f1b7-default-rtdb.europe-west1.firebasedatabase.app';

// ── Uyarı Tekrar Süresi (dakika) ─────────────────────────────────
const ALERT_COOLDOWN_MIN = 10;

// ════════════════════════════════════════════════════════════════
// ANA FONKSİYON — Trigger bu fonksiyonu çağırır
// ════════════════════════════════════════════════════════════════
function syncTNBToFirebase() {
  try {
    // 1. Firebase'den araç tanımlarını al
    const araclar = fbGet('arac_takip/araclar');
    if (!araclar || typeof araclar !== 'object') {
      Logger.log('Araç tanımı bulunamadı. Admin panelinden araç ekleyin.');
      return;
    }
    const aracList = Object.values(araclar).filter(a => a && a.aktif !== false);
    if (!aracList.length) { Logger.log('Aktif araç yok.'); return; }

    // 2. TNB'den son konumları çek
    const tnbKonumlar = fetchTNBPositions();
    if (!tnbKonumlar.length) { Logger.log('TNB verisi alınamadı.'); return; }

    // 3. TNB plakasını kısa plakaya eşle ve Firebase'e yaz
    const konumlar = {};
    for (const tk of tnbKonumlar) {
      const arac = aracList.find(a => {
        const ap = String(a.tnb_plaka||'').replace(/\s/g,'').toUpperCase();
        const tp = String(tk.plaka||'').replace(/\s/g,'').toUpperCase();
        const ac = String(a.cihaz_id||a.device_id||'').trim();
        const tc = String(tk.cihaz_id||tk.device_id||'').trim();
        return (ap && tp && ap === tp) || (ac && tc && ac === tc);
      });
      if (!arac) continue;
      const kp = arac.kisa_plaka;
      konumlar[kp] = {
        lat:        parseFloat(tk.lat)  || 0,
        lng:        parseFloat(tk.lng)  || 0,
        hiz:        parseInt(tk.hiz)    || 0,
        km:         parseInt(tk.km)     || 0,
        yon:        parseInt(tk.yon)    || 0,
        guncelleme: tk.zaman || new Date().toISOString(),
        durum:      (parseInt(tk.hiz)||0) > 3 ? 'HAREKET' : 'BEKLIYOR'
      };
    }
    fbPut('arac_takip/konumlar', konumlar);
    Logger.log(`${Object.keys(konumlar).length} araç Firebase'e yazıldı.`);

    // 4. Yakınlık uyarılarını kontrol et
    if (Object.keys(konumlar).length > 0) checkProximity(konumlar);

  } catch(e) {
    Logger.log('syncTNBToFirebase HATA: ' + e.message);
  }
}

// ════════════════════════════════════════════════════════════════
// TNB SOAP İsteği
// ════════════════════════════════════════════════════════════════
function fetchTNBPositions() {
  const soap = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="${TNB_NS}">
  <soap:Body>
    <tns:${TNB_METHOD}>
      <tns:firmaKod>${FIRMA_KOD}</tns:firmaKod>
      <tns:kullanici>${TNB_USER}</tns:kullanici>
      <tns:sifre>${TNB_PASS}</tns:sifre>
    </tns:${TNB_METHOD}>
  </soap:Body>
</soap:Envelope>`;

  try {
    const res = UrlFetchApp.fetch(TNB_URL, {
      method:      'post',
      contentType: 'text/xml; charset=utf-8',
      headers:     { 'SOAPAction': `"${TNB_NS}${TNB_METHOD}"` },
      payload:     soap,
      muteHttpExceptions: true
    });

    if (res.getResponseCode() !== 200) {
      Logger.log('TNB HTTP hatası: ' + res.getResponseCode() + ' → ' + res.getContentText().substring(0,300));
      return [];
    }
    return parseTNBXml(res.getContentText());

  } catch(e) {
    Logger.log('TNB istek hatası: ' + e.message);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════
// SOAP XML Ayrıştırma
// ⚠️ Gerçek XML yapısına göre düzenle (WSDL'e bak)
// ════════════════════════════════════════════════════════════════
function parseTNBXml(xmlText) {
  try {
    const doc  = XmlService.parse(xmlText);
    const root = doc.getRootElement(); // soap:Envelope
    const body = findChild(root, 'Body');
    if (!body) return [];
    const respEl = body.getChildren()[0];
    if (!respEl) return [];
    const resultEl = respEl.getChildren()[0];
    if (!resultEl) return [];

    const sonuclar = [];
    // Araç elementlerini topla — element adı WSDL'e göre değişir
    const aracEls  = resultEl.getChildren() || [];
    for (const el of aracEls) {
      const plaka = getElText(el, 'Plaka') || getElText(el, 'plaka') || getElText(el, 'PLAKA');
      const lat   = getElText(el, 'Enlem') || getElText(el, 'Lat')   || getElText(el, 'Latitude');
      const lng   = getElText(el, 'Boylam')|| getElText(el, 'Lon')   || getElText(el, 'Longitude');
      if (!plaka || !lat || !lng) continue;
      sonuclar.push({
        plaka,
        cihaz_id: getElText(el, 'CihazId') || getElText(el, 'CihazID') || getElText(el, 'DeviceId') || getElText(el, 'ID') || '',
        lat:  lat.replace(',', '.'),
        lng:  lng.replace(',', '.'),
        hiz:  getElText(el, 'Hiz')      || getElText(el, 'Speed')  || '0',
        km:   getElText(el, 'KmSayaci') || getElText(el, 'Km')     || '0',
        yon:  getElText(el, 'Yon')      || getElText(el, 'Direction') || '0',
        zaman:getElText(el, 'Zaman')    || getElText(el, 'Time')   || new Date().toISOString()
      });
    }
    Logger.log('TNB parse: ' + sonuclar.length + ' araç bulundu');
    return sonuclar;
  } catch(e) {
    Logger.log('XML parse hatası: ' + e.message + '\n' + xmlText.substring(0, 500));
    return [];
  }
}

// XML yardımcıları
function findChild(el, localName) {
  const ch = el.getChildren();
  return ch.find(c => c.getName().split(':').pop() === localName) || null;
}
function getElText(el, name) {
  const ch = el.getChildren();
  const found = ch.find(c => c.getName().split(':').pop() === name);
  return found ? found.getText().trim() : null;
}

// ════════════════════════════════════════════════════════════════
// Yakınlık Uyarıları
// ════════════════════════════════════════════════════════════════
function checkProximity(konumlar) {
  const merkez     = fbGet('arac_takip/merkez_magaza');
  const otelKonums = fbGet('arac_takip/otel_konumlar') || {};
  const bugununRez = getTodaysPlakalar(); // {plaka → [hotel, ...]}

  for (const [kisa_plaka, konum] of Object.entries(konumlar)) {
    if (!konum.lat || !konum.lng) continue;

    // Merkez Mağaza yakınlık
    if (merkez && merkez.aktif && merkez.lat && merkez.lng) {
      const d = haversine(konum.lat, konum.lng, merkez.lat, merkez.lng);
      if (d <= (merkez.yaklasma_m || 500)) {
        createAlertIfNew(kisa_plaka, 'MAGAZA_YAKIN', null,
          `🏬 ${kisa_plaka} — Merkez Mağaza'ya ${Math.round(d)}m yaklaştı`);
      }
    }

    // Otel yakınlık (rezervasyonu olan araçlar)
    const oteller = bugununRez[kisa_plaka] || [];
    for (const otelAdi of oteller) {
      const otelKey = slugify(otelAdi);
      const ok = otelKonums[otelKey];
      if (!ok || !ok.lat || !ok.lng) continue;
      const d = haversine(konum.lat, konum.lng, ok.lat, ok.lng);
      if (d <= (ok.yaklasma_m || 300)) {
        createAlertIfNew(kisa_plaka, 'OTEL_YAKIN', otelAdi,
          `🏨 ${kisa_plaka} — ${otelAdi}'a ${Math.round(d)}m yaklaştı`);
      }
    }
  }
}

// Bugün atanmış araçların otellerini getir: {plaka: [hotel, ...]}
function getTodaysPlakalar() {
  try {
    const s  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reservations');
    if (!s) return {};
    const d  = s.getDataRange().getValues();
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const map = {};
    for (let i = 1; i < d.length; i++) {
      if (!d[i][0]) continue;
      const tarih  = Utilities.formatDate(new Date(d[i][1]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      const durum  = String(d[i][9] || '');
      const plaka  = String(d[i][11] || '').trim();  // AYAK sütunu
      const hotel  = String(d[i][3] || '').trim();
      if (tarih !== today) continue;
      if (durum === 'CANCELLED') continue;
      if (!plaka || !hotel) continue;
      if (!map[plaka]) map[plaka] = [];
      if (!map[plaka].includes(hotel)) map[plaka].push(hotel);
    }
    return map;
  } catch(e) {
    Logger.log('getTodaysPlakalar hata: ' + e.message);
    return {};
  }
}

function createAlertIfNew(plaka, tip, otel, mesaj) {
  try {
    const uyarilar = fbGet('arac_takip/uyarilar') || {};
    const cooldown = ALERT_COOLDOWN_MIN * 60 * 1000;
    const now      = Date.now();
    const dupe = Object.values(uyarilar).find(a =>
      a && a.plaka === plaka && a.tip === tip &&
      (otel ? a.otel === otel : true) &&
      (now - new Date(a.zaman||0).getTime()) < cooldown
    );
    if (dupe) return;
    const id = `u_${now}_${Math.random().toString(36).slice(2,6)}`;
    fbPut(`arac_takip/uyarilar/${id}`, {
      plaka, tip, otel: otel || null, mesaj,
      zaman: new Date().toISOString(), okundu: false
    });
    Logger.log('Uyarı oluşturuldu: ' + mesaj);
  } catch(e) {
    Logger.log('createAlertIfNew hata: ' + e.message);
  }
}

// ════════════════════════════════════════════════════════════════
// Firebase REST API Yardımcıları
// ════════════════════════════════════════════════════════════════
function fbGet(path) {
  const r = UrlFetchApp.fetch(`${FB_URL}/${path}.json`, { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  const txt = r.getContentText();
  return txt === 'null' ? null : JSON.parse(txt);
}

function fbPut(path, data) {
  UrlFetchApp.fetch(`${FB_URL}/${path}.json`, {
    method: 'put', contentType: 'application/json',
    payload: JSON.stringify(data), muteHttpExceptions: true
  });
}

function fbPost(path, data) {
  UrlFetchApp.fetch(`${FB_URL}/${path}.json`, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(data), muteHttpExceptions: true
  });
}

// ════════════════════════════════════════════════════════════════
// Yardımcı Fonksiyonlar
// ════════════════════════════════════════════════════════════════
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const p = Math.PI / 180;
  const a = 0.5 - Math.cos((lat2-lat1)*p)/2 +
            Math.cos(lat1*p)*Math.cos(lat2*p)*(1-Math.cos((lng2-lng1)*p))/2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function slugify(s) {
  return String(s||'')
    .toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
}

// ════════════════════════════════════════════════════════════════
// Trigger Kurma Fonksiyonu — Bir kez çalıştır
// ════════════════════════════════════════════════════════════════
function setupTrigger() {
  // Önce mevcut trigger'ları temizle
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'syncTNBToFirebase') ScriptApp.deleteTrigger(t);
  });
  // Yeni 1 dakikalık trigger kur
  ScriptApp.newTrigger('syncTNBToFirebase')
    .timeBased().everyMinutes(1).create();
  Logger.log('✅ Trigger kuruldu: syncTNBToFirebase her 1 dakikada çalışacak');
}

// Manuel test için
function testTNBConnection() {
  const sonuclar = fetchTNBPositions();
  Logger.log('Test sonucu: ' + JSON.stringify(sonuclar));
}
