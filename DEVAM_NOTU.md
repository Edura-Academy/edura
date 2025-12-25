# Edura Geliştirme Durumu

> ⚠️ **BU DOSYA GEÇİCİDİR - İŞ BİTTİKTEN SONRA SİLİNECEKTİR**

## 📍 Tamamlanan Sistemler

### 1. ✅ Ödev Sistemi (`feat/odev-sistemi`)
- Backend route ve controller
- Öğretmen ödev sayfası (oluştur, değerlendir)
- Öğrenci ödev sayfası (görüntüle, teslim et)
- E-posta ve push notification entegrasyonu

### 2. ✅ Yoklama/Devamsızlık Sistemi (`feat/yoklama-sistemi`)
- Backend route ve controller
- Öğretmen yoklama alma sayfası (QR kod destekli)
- Öğrenci devamsızlık görüntüleme sayfası
- Otomatik veli/öğrenci bildirimi

### 3. ✅ Duyuru Sistemi (`feat/duyuru-sistemi`)
- Backend route ve controller
- Personel duyuru yönetim sayfası
- Genel duyuru görüntüleme sayfası
- Hedef kitle seçimi, öncelik seviyeleri
- Okunma takibi ve push notification

---

## 🚀 KURULUM ADIMLARI (ÜRETİME ALMAK İÇİN)

### 1. Resend - E-posta Servisi
- **URL:** https://resend.com
- **Ücretsiz Limit:** 3000 e-posta/ay, 100 e-posta/gün
- **Adımlar:**
  1. resend.com'a git ve ücretsiz kayıt ol
  2. Dashboard'dan API Key oluştur
  3. Backend `.env` dosyasına ekle: `RESEND_API_KEY=re_xxxxx`
  4. Kendi domain'ini doğrula (isteğe bağlı, yoksa onboarding@resend.dev kullanılır)

### 2. Firebase - Push Notification & Storage
- **URL:** https://console.firebase.google.com
- **Ücretsiz Limit:** Push sınırsız, Storage 5GB
- **Adımlar:**
  1. Firebase Console'da yeni proje oluştur
  2. Project Settings > Service Accounts > "Generate new private key"
  3. JSON dosyasını `backend/firebase-service-account.json` olarak kaydet
  4. Project Settings > Cloud Messaging > Web Push certificates (VAPID key)
  5. Frontend `.env.local` dosyasına Firebase config'i ekle:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=xxx
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
     NEXT_PUBLIC_FIREBASE_APP_ID=xxx
     ```

### 3. Backend .env Dosyası (Tam Liste)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/edura
JWT_SECRET=cok-gizli-bir-anahtar-32-karakter
PORT=5000

# Resend E-posta
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Edura <noreply@yourdomain.com>

# Frontend URL (e-posta linkleri için)
FRONTEND_URL=http://localhost:3000

# Firebase (Service Account JSON dosyası kullanılıyor)
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

### 4. Frontend .env.local Dosyası
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 🔧 Son Yapılan İşlem

Veli Portalı tamamlandı! 4 temel sistem hazır.

**Tamamlanan Sistemler:**
1. ✅ Ödev Sistemi
2. ✅ Yoklama/Devamsızlık
3. ✅ Duyuru Sistemi
4. ✅ Veli Portalı

**Sonraki Sistemler (Sırasıyla):**
1. ⏳ Ödeme Sistemi - iyzico (3-4 gün)
2. ⏳ Online Sınav (4-5 gün)
3. ⏳ Ders Programı - FullCalendar (2-3 gün)
4. ⏳ Dashboard & Raporlar - Recharts (3-4 gün)
5. ⏳ PWA Desteği (1-2 gün)

---

## 📂 Oluşturulan/Değiştirilen Dosyalar

### Backend
- `backend/src/routes/odev.routes.ts` [YENİ]
- `backend/src/services/email.service.ts` [YENİ]
- `backend/src/services/push.service.ts` [YENİ]
- `backend/src/controllers/odev.controller.ts` [GÜNCELLENDİ]
- `backend/src/controllers/user.controller.ts` [GÜNCELLENDİ - FCM token]
- `backend/src/routes/user.routes.ts` [GÜNCELLENDİ - FCM routes]
- `backend/src/index.ts` [GÜNCELLENDİ - odev routes import]
- `backend/prisma/schema.prisma` [GÜNCELLENDİ - fcmToken alanı]

### Frontend
- `frontend/src/app/[locale]/personel/odevler/page.tsx` [YENİ]
- `frontend/src/app/[locale]/ogrenci/odevler/page.tsx` [YENİ]
- `frontend/src/app/[locale]/ogrenci/page.tsx` [GÜNCELLENDİ - ödev linki]
- `frontend/src/app/[locale]/personel/page.tsx` [GÜNCELLENDİ - ödev linki]
- `frontend/public/firebase-messaging-sw.js` [YENİ]

---

## 🎯 Genel Plan (Ödev Sistemi)

### Mimari
```
Frontend (Next.js)
├── Öğretmen: /personel/odevler
│   ├── Ödev listesi
│   ├── Yeni ödev oluşturma
│   └── Değerlendirme
└── Öğrenci: /ogrenci/odevler
    ├── Ödev listesi
    ├── Teslim etme
    └── Puanları görme

Backend (Express)
├── GET /api/odevler/ogretmen - Öğretmenin ödevleri
├── GET /api/odevler/ogrenci - Öğrencinin ödevleri
├── POST /api/odevler - Yeni ödev
├── POST /api/odevler/:id/teslim - Ödev teslim
└── POST /api/odevler/teslim/:id/degerlendir - Değerlendir

Bildirimler
├── Uygulama içi (Notification tablosu)
├── E-posta (Resend - 3000/ay ücretsiz)
└── Push (Firebase FCM - sınırsız ücretsiz)
```

### Bildirim Akışı
| Olay | Alıcı | Kanal |
|------|-------|-------|
| Yeni ödev | Öğrenciler | App + Push + Email |
| Teslim edildi | Öğretmen | App + Push |
| Değerlendirildi | Öğrenci | App + Push + Email |
| Son teslim yaklaşıyor | Teslim etmeyenler | App + Push |

---

## 🔮 Sonraki Özellikler (Genel Yol Haritası)

1. **Ödev Sistemi** ← ŞU AN BURADAYIZ
2. Devamsızlık/Yoklama Sistemi
3. Duyuru Sistemi
4. Veli Portalı
5. Ödeme Sistemi (iyzico)
6. Online Sınav
7. Ders Programı (FullCalendar)
8. Canlı Ders (Jitsi)
9. Dashboard & Raporlar (Recharts)
10. PWA (next-pwa)
11. Mobil Uygulama (React Native)

---

## 💡 Kullanılan Ücretsiz Araçlar

| Araç | Amaç | Limit |
|------|------|-------|
| **Resend** | E-posta | 3000/ay |
| **Firebase FCM** | Push Notification | Sınırsız |
| **Firebase Storage** | Dosya yükleme | 5GB |
| **FullCalendar** | Takvim | Sınırsız |
| **Recharts** | Grafikler | Sınırsız |
| **Jitsi Meet** | Video konferans | Sınırsız |

---

## 🚀 Git Workflow

```bash
# Her özellik için
git checkout -b feat/[ozellik-adi]
# Geliştirme...
git push origin feat/[ozellik-adi]
# Vercel Preview'da test
# PR aç → main'e merge

# Bug fix için
git checkout -b feat/[ozellik-adi]-bug-fixes
```

---

## ⚙️ Environment Variables (Gerekli)

### Backend (.env)
```env
# Mevcut
DATABASE_URL=...
JWT_SECRET=...
FIREBASE_STORAGE_BUCKET=...

# Yeni eklenmeli
RESEND_API_KEY=re_xxxxx  # https://resend.com
EMAIL_FROM=Edura <noreply@yourdomain.com>
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Firebase (Push için)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 📝 Notlar

1. Öğretmen ödev sayfası WhatsApp tarzı yeşil tema kullanıyor
2. Email şablonları HTML olarak hazır (gradient tasarım)
3. Push notification service worker'ı frontend/public'te
4. FCM token User tablosuna eklendi (fcmToken alanı)
5. Controller'larda email gönderimi async (response'u bekletmiyor)

---

**Son Güncelleme:** 25 Aralık 2024
**Sohbet:** Ödev sistemi tamamlandı - frontend sayfaları hazır

