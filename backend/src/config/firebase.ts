import * as admin from 'firebase-admin';
import * as path from 'path';
import dotenv from 'dotenv';

// .env dosyasını yükle (backend klasöründen)
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Service account dosyasının yolu
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

// Bucket adını kontrol et
const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
if (!bucketName) {
  console.error('⚠️ FIREBASE_STORAGE_BUCKET environment variable is not set!');
}

// Firebase'i başlat (henüz başlatılmamışsa)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    storageBucket: bucketName
  });
}

// Storage bucket referansı
const bucket = admin.storage().bucket();

export { admin, bucket };
