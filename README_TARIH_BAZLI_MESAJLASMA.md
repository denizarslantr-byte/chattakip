# Tarih Bazlı Rezervasyon + Mesajlaşma Güncellemesi

## Yapılan değişiklikler

1. Rezervasyon okuma artık tarih bazlıdır:
   - Eski yük bindiren yapı: `rezervasyonlar/<id>`
   - Yeni optimize yapı: `rezervasyonlar/YYYY-MM-DD/<id>`
   - Yardımcı index: `rezervasyon_index/<id> = YYYY-MM-DD`

2. Merkez ekran otomatik yenileme süresi 5 saniyeye indirildi.
   - Kullanıcı input/select/button üzerinde işlem yapıyorsa refresh bekler.

3. Mesajlaşma yetkileri düzenlendi:
   - Admin → Merkez
   - Admin → Tüm Oteller
   - Admin → Seçili Otel
   - Merkez → Tüm Oteller
   - Merkez → Seçili Otel
   - Otel → Sadece Merkez
   - Otel mesaj gönderme listesinde sadece Merkez görünür.

4. Mesajlar Firebase'de `mesajlar` node altında tutulur.
   - Panel son 80 mesajı dinler.
   - Eski mesajların tamamını canlı dinlemez.

## Firebase içe aktarım dosyası

Ayrı verilen `firebase-import-tarih-bazli-mesajlasma.json` dosyası mevcut verilerinizi korur ve rezervasyonları tarih bazlı yapıya çevirir.

Firebase Console > Realtime Database > üç nokta > Import JSON ile yükleyebilirsiniz.

Önemli: Import öncesi Firebase'den mevcut JSON yedeğini alın.
