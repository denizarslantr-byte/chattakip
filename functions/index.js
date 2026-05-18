const { onRequest } = require('firebase-functions/v2/https');
const xml2js = require('xml2js');

function esc(s='') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function soapEnvelope(method, body) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://tempuri.org/">
      ${body}
    </${method}>
  </soap:Body>
</soap:Envelope>`;
}

function userXml(username, password, companyCode) {
  return `<User><UserName>${esc(username)}</UserName><Password>${esc(password)}</Password><CompanyCode>${esc(companyCode)}</CompanyCode></User>`;
}

async function callSoap(tnbUrl, method, body) {
  const xml = soapEnvelope(method, body);
  const r = await fetch(tnbUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': `"http://tempuri.org/${method}"`
    },
    body: xml
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`TNB HTTP ${r.status}: ${text.slice(0,200)}`);
  const obj = await xml2js.parseStringPromise(text, { explicitArray: false, ignoreAttrs: true });
  return obj;
}

function findDeep(obj, key) {
  if (!obj || typeof obj !== 'object') return null;
  if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
  for (const k of Object.keys(obj)) {
    const v = findDeep(obj[k], key);
    if (v) return v;
  }
  return null;
}

function asArray(x) { return Array.isArray(x) ? x : (x ? [x] : []); }

function normalizeLocation(x) {
  return {
    deviceId: x.DeviceId || x.DeviceID || '',
    plaka: x.License_Plate || x.Plate || '',
    address: x.Address || '',
    lat: Number(String(x.Lat || '').replace(',', '.')) || 0,
    lng: Number(String(x.Lng || '').replace(',', '.')) || 0,
    hiz: Number(String(x.Speed || '').replace(',', '.')) || 0,
    angle: Number(String(x.Agnle || x.Angle || '').replace(',', '.')) || 0,
    gunlukKm: Number(String(x.Mileage || '').replace(',', '.')) || 0,
    sofor: x.Driver || '',
    kontak: String(x.Ignition || '').toLowerCase().includes('true') || String(x.Ignition || '').includes('1') || String(x.Ignition || '').toLowerCase().includes('aç'),
    workingHour: x.WorkingHour || '',
    sonGuncelleme: new Date().toISOString()
  };
}

exports.tnbLiveVehicles = onRequest({ cors: true, timeoutSeconds: 60, memory: '256MiB' }, async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    const body = req.body || {};
    const tnbUrl = body.tnbUrl || 'https://ws.ats.tnbmobil.com.tr/webservis.asmx';
    const companyCode = body.companyCode || body.tnbCompany;
    const username = body.username || body.tnbUsername;
    const password = body.password || body.tnbPassword;
    if (!companyCode || !username || !password) throw new Error('TNB kullanıcı bilgileri eksik');

    // TNB dokümanına göre canlı konum için wsGetLastLocations kullanılır.
    // DeviceID boş gönderildiğinde tüm araçları döndürmezse, önce wsGetAllVehicles ile araçları alıp tek tek konum sorgular.
    let locations = [];
    try {
      const locObj = await callSoap(tnbUrl, 'wsGetLastLocations', userXml(username, password, companyCode) + '<DeviceID></DeviceID>');
      const loc = findDeep(locObj, 'Location');
      const items = asArray(loc && loc.Location ? loc.Location : loc);
      locations = items.map(normalizeLocation).filter(v => v.plaka && v.lat && v.lng);
    } catch (e) {
      locations = [];
    }

    if (!locations.length) {
      const vehObj = await callSoap(tnbUrl, 'wsGetAllVehicles', userXml(username, password, companyCode));
      const vehNode = findDeep(vehObj, 'Vehicles');
      const vehicles = asArray(vehNode && vehNode.Vehicles ? vehNode.Vehicles : vehNode);
      for (const v of vehicles) {
        const deviceId = v.DeviceId || v.DeviceID || '';
        if (!deviceId) continue;
        const locObj = await callSoap(tnbUrl, 'wsGetLastLocations', userXml(username, password, companyCode) + `<DeviceID>${esc(deviceId)}</DeviceID>`);
        const loc = findDeep(locObj, 'Location');
        const items = asArray(loc && loc.Location ? loc.Location : loc);
        locations.push(...items.map(normalizeLocation));
      }
    }

    res.json({ success: true, count: locations.length, vehicles: locations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
