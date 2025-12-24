# Firebase Storage Kurulum Kılavuzu

## Hızlı Başlangıç

### 1. Firebase Service Account Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) → Projeniz → ⚙️ Settings → Service Accounts
2. "Generate New Private Key" butonuna tıklayın
3. İndirilen JSON dosyasını `backend/firebase-service-account.json` olarak kaydedin

### 2. Environment Variables

`.env` dosyasına ekleyin:

```env
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### 3. Test

```bash
# Backend'i başlat
npm run dev

# Konsol çıktısını kontrol edin:
# ✅ Firebase initialized successfully
```

## Dosya Yükleme Örnekleri

### cURL ile Test

```bash
# Profil fotoğrafı yükle
curl -X POST http://localhost:3001/api/upload/profile/ogrenci/123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@/path/to/image.jpg"

# Belge yükle
curl -X POST http://localhost:3001/api/upload/document \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@/path/to/document.pdf" \
  -F "documentType=odev"
```

## Sorun Giderme

### Firebase başlatılamadı
- `firebase-service-account.json` dosyasının doğru yerde olduğundan emin olun
- JSON dosyasının geçerli olduğunu kontrol edin

### Yükleme başarısız
- Storage kurallarını kontrol edin (Firebase Console → Storage → Rules)
- Bucket adının doğru olduğunu kontrol edin

Daha fazla bilgi için `docs/FIREBASE_STORAGE.md` dosyasına bakın.

