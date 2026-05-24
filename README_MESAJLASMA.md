# Mesajlaşma Sistemi

Bu paket içinde admin, merkez ve otel ekranlarına Firebase Realtime Database üzerinden gerçek zamanlı mesajlaşma eklendi.

## Eklenen dosyalar
- assets/message-widget.css
- assets/message-widget.js

## Güncellenen ekranlar
- center/dashboard.html
- admin/admin.html
- admin/index.html
- hotel/mobile-hotel-panel.html

## Firebase veri yolu
Mesajlar `mesajlar/` altında tutulur.

## Özellikler
- Admin ↔ Merkez
- Admin ↔ Otel
- Merkez ↔ Otel
- Admin/Merkez → tüm otellere duyuru
- Okunmamış mesaj rozeti
- Yeni mesaj toast bildirimi
- Sağ altta hızlı mesaj paneli
