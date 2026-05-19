const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const TNB_URL = process.env.TNB_URL || 'https://ws.ats.tnbmobil.com.tr/webservis.asmx';
const TNB_USER = process.env.TNB_USER || '';
const TNB_PASS = process.env.TNB_PASS || '';
const TNB_FIRMA = process.env.TNB_FIRMA || '';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function soapEnvelope(methodName) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${methodName} xmlns="http://tempuri.org/">
      <kullanici>${TNB_USER}</kullanici>
      <sifre>${TNB_PASS}</sifre>
      <firmaKodu>${TNB_FIRMA}</firmaKodu>
    </${methodName}>
  </soap:Body>
</soap:Envelope>`;
}

function findPossibleResult(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const keys = Object.keys(obj);
  for (const key of keys) {
    if (/Result$/i.test(key) || /sonuc/i.test(key) || /Liste/i.test(key)) return obj[key];
  }
  for (const key of keys) {
    const val = findPossibleResult(obj[key]);
    if (val !== undefined && val !== null && val !== obj[key]) return val;
  }
  return obj;
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (!TNB_USER || !TNB_PASS || !TNB_FIRMA) {
      return res.status(500).json({
        ok: false,
        error: 'Vercel Environment Variables eksik: TNB_USER, TNB_PASS, TNB_FIRMA'
      });
    }

    // TNB metod adı firmaya göre değişebiliyor. Çalışmazsa METHOD değerini Vercel env içine ekleyin.
    const methodName = process.env.TNB_METHOD || 'AracListe';
    const soapAction = process.env.TNB_SOAP_ACTION || `http://tempuri.org/${methodName}`;

    const response = await axios.post(TNB_URL, soapEnvelope(methodName), {
      timeout: 20000,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': soapAction
      }
    });

    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
    const parsed = parser.parse(response.data);
    const result = findPossibleResult(parsed);

    return res.status(200).json({
      ok: true,
      method: methodName,
      rawXml: response.data,
      parsed,
      result
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
      details: err.response ? err.response.data : null
    });
  }
};
