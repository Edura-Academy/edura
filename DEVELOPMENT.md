# Edura - Geliştirme Kılavuzu

## 🎯 Proje Yapısı

### Frontend (Next.js 15.5.9)
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **i18n:** next-intl
- **State:** React Hooks

### Backend (Express + Prisma)
- **Runtime:** Node.js
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** JWT

## 📁 Dizin Yapısı

```
Edura/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── ogrenci/      # Öğrenci sayfası
│   │   │   │   ├── ogretmen/     # Öğretmen sayfası (TODO)
│   │   │   │   ├── sekreter/     # Sekreter sayfası (TODO)
│   │   │   │   ├── mudur/        # Müdür sayfası (TODO)
│   │   │   │   └── admin/        # Admin sayfası
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ClientOnlyDate.tsx
│   │   │   └── YeniMesajModal.tsx
│   │   └── lib/
│   │       └── mockData.ts       # Mock veriler
│   └── package.json
│
└── backend/
    ├── prisma/
    │   └── schema.prisma         # Database schema
    ├── src/
    │   ├── routes/
    │   │   ├── api.ts           # API dokümantasyonu
    │   │   └── students.example.ts
    │   └── middleware/
    │       └── auth.ts          # Auth middleware
    └── package.json
```

## 🔐 Kullanıcı Rolleri ve Yetkileri

### 1. Admin
- Kurs/Ders oluşturma ve silme
- Sistem ayarları

### 2. Müdür
- Öğretmen oluşturma ve silme
- Sekreter oluşturma ve silme
- Tüm onay taleplerini onaylama/reddetme
- Tüm raporları görüntüleme

### 3. Öğretmen
- Sınav oluşturma ve not girişi
- Öğrenci devamsızlık kaydı
- Öğrencilerle mesajlaşma
- Ders programı görüntüleme

### 4. Sekreter
- Öğrenci oluşturma
- Öğrenci silme (Müdür onayı gerekir)
- Öğrenci kayıt işlemleri
- Mesajlaşma

### 5. Öğrenci
- Kendi ders programını görüntüleme
- Sınav sonuçlarını görüntüleme
- Devamsızlık kayıtlarını görüntüleme
- Öğretmenlerle mesajlaşma
- Öğretmen iletişim bilgilerini görme

## 🗄️ Database Schema Özeti

### Ana Tablolar
1. **User** - Tüm kullanıcılar (role bazlı)
2. **Sinif** - Sınıf bilgileri (8-A, 9-B, etc.)
3. **Course** - Dersler/Kurslar
4. **CourseEnrollment** - Öğrenci-Ders ilişkisi
5. **Exam** - Sınavlar
6. **ExamResult** - Sınav sonuçları
7. **Devamsizlik** - Devamsızlık kayıtları
8. **Message** - Mesajlaşma sistemi
9. **Notification** - Bildirimler ve onay talepleri

## 🚀 Öğrenci Sayfası Özellikleri

### ✅ Tamamlanan
1. **Dashboard İstatistikleri**
   - Toplam ders sayısı
   - Devamsızlık sayısı
   - Ortalama puan
   - Sınav sayısı

2. **Deneme Sonuçları Tablosu**
   - Sınav adı ve tarihi
   - Ders bilgisi
   - Puan ve yüzde
   - Doğru/Yanlış/Boş sayıları
   - Görsel progress bar

3. **Öğretmenler Listesi**
   - Öğretmen adı ve branşı
   - Telefon numarası (tıklanabilir)
   - E-posta adresi (tıklanabilir)
   - Mesaj gönder butonu

4. **Haftalık Ders Programı**
   - Günlere göre renkli kartlar
   - Ders saatleri
   - Öğretmen bilgisi

5. **Devamsızlık Kayıtları**
   - Tarih ve ders bilgisi
   - Açıklama (varsa)
   - Uyarı mesajı

6. **Mesajlaşma Sistemi**
   - Yeni mesaj yazma modal'ı
   - Alıcı seçimi (öğretmenler)
   - Konu ve mesaj alanları

7. **Bildirimler ve Mesajlar**
   - Dropdown menüler
   - Okunmamış sayısı göstergesi
   - Animasyonlu açılma/kapanma

8. **Profil Yönetimi**
   - Profil bilgileri modal'ı
   - Şifre değiştirme modal'ı
   - Güvenli çıkış

### 🎨 Tasarım İyileştirmeleri
1. **Responsive Design**
   - Mobil, tablet ve desktop uyumlu
   - Flexbox/Grid kullanımı
   - Uyarlanabilir font boyutları

2. **Animasyonlar**
   - Fade in animasyonları
   - Slide up/down animasyonlar
   - Hover efektleri
   - Scale animasyonları

3. **UX İyileştirmeleri**
   - Dropdown'ların dışına tıklandığında kapanma
   - Loading states (TODO)
   - Error handling (TODO)
   - Toast notifications (TODO)

## 🔄 İş Akışları

### Öğrenci Oluşturma (Sekreter)
1. Sekreter formu doldurur
2. Sistem öğrenci kaydı oluşturur
3. E-posta/SMS ile bilgilendirme gönderilir

### Öğrenci Silme (Sekreter → Müdür)
1. Sekreter silme talebi oluşturur
2. Müdüre bildirim gider
3. Müdür onaylar/reddeder
4. Onaylanırsa öğrenci silinir

### Mesajlaşma
1. Kullanıcı "Yeni Mesaj" butonuna tıklar
2. Alıcı ve konu seçer
3. Mesajı yazar ve gönderir
4. Alıcıya bildirim gider
5. Alıcı mesajı okur

## 📝 Yapılacaklar (TODO)

### Backend
- [ ] Express server kurulumu
- [ ] Prisma migration'ları
- [ ] Authentication (JWT)
- [ ] API endpoints implementasyonu
- [ ] Email/SMS servisleri

### Frontend
- [ ] Öğretmen sayfası
- [ ] Sekreter sayfası
- [ ] Müdür sayfası
- [ ] API entegrasyonu
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Form validations

### Özellikler
- [ ] Gerçek zamanlı bildirimler (WebSocket)
- [ ] Dosya yükleme (ödev, döküman)
- [ ] Raporlama sistemi
- [ ] Excel export
- [ ] PDF dökümanlar

## 🧪 Test

```bash
# Frontend test
cd frontend
npm test

# Backend test
cd backend
npm test
```

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Railway/Heroku)
```bash
cd backend
# Railway CLI kullan veya git push
```

### Database (Supabase/Neon)
- PostgreSQL instance oluştur
- CONNECTION_STRING'i .env'e ekle
- Prisma migration'ları çalıştır

## 📦 Paketler

### Frontend
- next: ^15.5.9
- react: ^19.0.0
- next-intl: latest
- tailwindcss: latest

### Backend
- express: latest
- prisma: latest
- @prisma/client: latest
- jsonwebtoken: latest
- bcrypt: latest

## 🤝 Katkıda Bulunma

1. Feature branch oluştur (`feat/yeni-ozellik`)
2. Değişikliklerini commit et
3. Branch'i push et
4. Pull Request aç

## 📞 İletişim

Sorular için: [email]

---

Son Güncelleme: 17 Aralık 2024
