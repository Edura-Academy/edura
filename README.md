# Edura Programı

Edura, eğitim kurumları için geliştirilmiş kapsamlı bir kurs takip ve yönetim sistemidir.

## Sahipleri

- **Abdurrahman**
- **Hasan**
- **Ferhat**

## 🏗️ Proje Yapısı

```
Edura/
├── frontend/      # Next.js + React + Tailwind + TypeScript
├── backend/       # Node.js + Express + Prisma + TypeScript
├── figma/         # Tasarım dosyaları
└── README.md
```

## 🛠️ Teknolojiler

### Frontend
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- TypeScript
- Vercel (Deployment)

### Backend
- Node.js
- Express.js
- Prisma ORM
- TypeScript
- Google Cloud Run (Deployment)

### Veritabanı
- MySQL (Google Cloud SQL)

## 👥 Kullanıcı Rolleri

- **Admin**: Sistem yöneticisi (yazılımcı)
- **Müdür**: Kurum yöneticisi
- **Öğretmen**: Eğitmen (bazıları eğitim koçu)
- **Sekreter**: İdari işler
- **Öğrenci**: Ortaokul/Lise öğrencileri

---

## 🚀 Geliştirici Kurulumu

### Gereksinimler
- Node.js 18+
- MySQL 8+ (local development için)
- npm veya pnpm

### 1. Repo'yu Klonla
```bash
git clone https://github.com/Edura-Academy/edura.git
cd edura
```

### 2. Backend Kurulumu
```bash
cd backend
npm install

# .env dosyasını oluştur
cp .env.example .env
# .env dosyasını düzenle (database bilgilerini gir)

# Prisma client oluştur
npx prisma generate

# Development server başlat
npm run dev
```

### 3. Frontend Kurulumu
```bash
cd frontend
npm install

# .env.local dosyasını oluştur
cp .env.example .env.local

# Development server başlat
npm run dev
```

### 4. Erişim
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="mysql://root:password@localhost:3306/edura_dev"
JWT_SECRET="your-development-secret-key"
PORT=5000
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> ⚠️ **Önemli:** `.env` dosyaları Git'e eklenmez! Production değerleri Cloud Run ve Vercel'de tanımlıdır.

---

## 📦 Deployment

### Otomatik Deployment
`main` branch'e push yapıldığında:
- **Frontend** → Vercel'e otomatik deploy
- **Backend** → Google Cloud Run'a otomatik deploy

### Branch Stratejisi
```
main                 # Production - her zaman stabil
├── feat/xxx         # Yeni özellikler
├── fix/xxx          # Bug düzeltmeleri
└── chore/xxx        # Bakım işleri
```

### Geliştirme Akışı
1. Yeni branch oluştur: `git checkout -b feat/yeni-ozellik`
2. Geliştirme yap ve test et
3. Push et: `git push origin feat/yeni-ozellik`
4. GitHub'da Pull Request aç
5. Review sonrası `main`'e merge et
6. Otomatik deployment gerçekleşir

---

## 📋 API Endpoints

### Auth
- `POST /api/auth/login` - Giriş
- `POST /api/auth/register` - Kayıt
- `GET /api/auth/me` - Mevcut kullanıcı
- `POST /api/auth/change-password` - Şifre değiştir

### Users
- `GET /api/users` - Kullanıcıları listele
- `GET /api/users/:id` - Kullanıcı detayı
- `POST /api/users` - Kullanıcı oluştur
- `PUT /api/users/:id` - Kullanıcı güncelle
- `DELETE /api/users/:id` - Kullanıcı sil

### Courses
- `GET /api/courses` - Dersleri listele
- `GET /api/courses/:id` - Ders detayı
- `POST /api/courses` - Ders oluştur
- `PUT /api/courses/:id` - Ders güncelle
- `DELETE /api/courses/:id` - Ders sil

---

## 📄 Lisans

Bu proje özel kullanım içindir.
