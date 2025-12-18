import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

// .env dosyasını yükle (backend klasöründen)
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Service account dosyasının yolu
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

// Bucket adını kontrol et
const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let bucket: any = null;

// Firebase service account dosyası var mı kontrol et
const firebaseEnabled = fs.existsSync(serviceAccountPath);

if (firebaseEnabled) {
  // Firebase'i başlat (henüz başlatılmamışsa)
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      storageBucket: bucketName
    });
  }
  
  // Storage bucket referansı
  bucket = admin.storage().bucket();
  console.log('✅ Firebase initialized successfully');
} else {
  console.log('⚠️ Firebase service account not found - Firebase features disabled');
  console.log('   To enable Firebase, add firebase-service-account.json to backend folder');
}

export { admin, bucket, firebaseEnabled };
