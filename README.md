# Piano Vercel TNB API

Bu API, GitHub Pages üzerindeki araç takip ekranının TNB SOAP web servisine güvenli şekilde bağlanması içindir.

## Vercel Environment Variables

Vercel panelinden Settings > Environment Variables alanına şunları ekleyin:

- TNB_URL = https://ws.ats.tnbmobil.com.tr/webservis.asmx
- TNB_USER = kayaderiwb
- TNB_PASS = TNB şifreniz
- TNB_FIRMA = 3029
- TNB_METHOD = AracListe

URL örneği:
https://PROJE-ADI.vercel.app/api/tnb
