# 🚀 Edura Deployment Rehberi

Bu rehber, Edura projesini production ortamına deploy etmek için adım adım talimatlar içerir.

## 📋 Gereksinimler

- GitHub hesabı
- Vercel hesabı (Frontend için)
- Railway veya Render hesabı (Backend için)
- MySQL veritabanı (Railway MySQL veya PlanetScale)

---

## 🗄️ 1. Veritabanı Kurulumu (Railway MySQL)

### Railway'de MySQL oluşturma:

1. [Railway.app](https://railway.app) adresine gidin
2. "New Project" → "Provision MySQL" seçin
3. MySQL oluşturulduktan sonra "Variables" sekmesinden connection string'i kopyalayın:
   ```
   mysql://root:password@containers-xxx.railway.app:3306/railway
   ```

### Veritabanı Migration:

```bash
# Backend klasöründe
cd backend

# .env dosyasına DATABASE_URL ekleyin
DATABASE_URL="mysql://root:password@containers-xxx.railway.app:3306/railway"

# Migration çalıştırın
npx prisma migrate deploy

# (Opsiyonel) Seed data ekleyin
npx prisma db seed
```

---

## 🖥️ 2. Backend Deployment (Railway)

### Adım 1: Railway'de yeni servis oluşturun

1. Railway dashboard'da "New" → "GitHub Repo" seçin
2. Bu repo'yu seçin
3. Root directory olarak `backend` belirtin

### Adım 2: Environment Variables

Railway dashboard'da şu değişkenleri ekleyin:

| Variable | Değer |
|----------|-------|
| `DATABASE_URL` | Railway MySQL connection string |
| `JWT_SECRET` | Güçlü rastgele string (min 32 karakter) |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `RESEND_API_KEY` | Resend API key (email için) |
| `GEMINI_API_KEY` | Google Gemini API key (chatbot için) |

### JWT Secret Oluşturma:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Adım 3: Deploy

Railway otomatik olarak Dockerfile'ı algılayıp deploy edecektir.

Deploy URL'ini not edin: `https://edura-api-production.up.railway.app`

---

## 🌐 3. Frontend Deployment (Vercel)

### Adım 1: Vercel'e bağlayın

1. [Vercel.com](https://vercel.com) adresine gidin
2. "Add New Project" → GitHub repo'yu seçin
3. Root directory olarak `frontend` belirtin
4. Framework: Next.js (otomatik algılanacak)

### Adım 2: Environment Variables

Vercel dashboard'da şu değişkenleri ekleyin:

| Variable | Değer |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://edura-api-production.up.railway.app/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://edura-api-production.up.railway.app` |

### Adım 3: Deploy

"Deploy" butonuna tıklayın. Vercel otomatik olarak build edip deploy edecektir.

---

## 🔄 4. GitHub Actions CI/CD

### Secrets Ayarlama

GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Açıklama |
|--------|----------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel Project → Settings |
| `NEXT_PUBLIC_API_URL` | Backend API URL |

Her `main` branch'e push'ta otomatik deploy çalışacaktır.

---

## 📱 5. Firebase Ayarları (Opsiyonel)

Push notifications ve dosya yükleme için Firebase gereklidir.

### Firebase Console'da:

1. [Firebase Console](https://console.firebase.google.com) → Yeni proje oluşturun
2. Project Settings → Service Accounts → "Generate new private key"
3. Storage bucket oluşturun

### Backend Environment Variables:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

---

## ✅ 6. Deployment Kontrol Listesi

- [ ] Railway MySQL oluşturuldu
- [ ] Prisma migration çalıştırıldı
- [ ] Backend Railway'e deploy edildi
- [ ] Backend health check çalışıyor (`/api/health`)
- [ ] Frontend Vercel'e deploy edildi
- [ ] Environment variables doğru ayarlandı
- [ ] CORS ayarları kontrol edildi
- [ ] Login/Register çalışıyor
- [ ] WebSocket bağlantısı çalışıyor

---

## 🐛 Troubleshooting

### CORS Hatası
- Backend'de `FRONTEND_URL` doğru ayarlandığından emin olun
- Vercel URL'inin sonunda `/` olmadığından emin olun

### Database Bağlantı Hatası
- `DATABASE_URL` formatını kontrol edin
- SSL gerekiyorsa `?sslaccept=strict` ekleyin

### Build Hatası
```bash
# Local'de test edin
cd frontend && npm run build
cd backend && npm run build
```

### WebSocket Bağlantı Hatası
- `NEXT_PUBLIC_SOCKET_URL` protokolsüz olmalı (wss:// değil https://)

---

## 📞 Destek

Sorularınız için GitHub Issues kullanabilirsiniz.
