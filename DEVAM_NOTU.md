# Edura Geliştirme Durumu

> ⚠️ **BU DOSYA GEÇİCİDİR - İŞ BİTTİKTEN SONRA SİLİNECEKTİR**

## 📍 Kaldığımız Yer

**Branch:** `feat/odev-sistemi`

**Tamamlanan TODO'lar:**
1. ✅ Backend odev route'ları oluşturuldu (`backend/src/routes/odev.routes.ts`)
2. ✅ Resend ile email servisi oluşturuldu (`backend/src/services/email.service.ts`)
3. ✅ Firebase FCM push notification servisi oluşturuldu (`backend/src/services/push.service.ts`)
4. 🔄 **Öğretmen ödev sayfası** - DEVAM EDİYOR (`frontend/src/app/[locale]/personel/odevler/page.tsx`)

**Yapılması Gerekenler:**
5. ⏳ Öğrenci ödev sayfası (`frontend/src/app/[locale]/ogrenci/odevler/page.tsx`)
6. ⏳ Bildirim entegrasyonu (controller'larda push service kullanımı)

---

## 🔧 Son Yapılan İşlem

Öğretmen ödev sayfası (`frontend/src/app/[locale]/personel/odevler/page.tsx`) oluşturuldu.

**Sonraki Adım:** 
1. Lint kontrolü yapılmalı
2. Commit atılmalı
3. Öğrenci ödev sayfası oluşturulmalı

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
**Sohbet:** Bu sohbetin context'i doldu, yeni sohbette devam edilecek

