import { bucket, firebaseEnabled } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Local uploads klasörü
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Uploads klasörünü oluştur (yoksa)
const ensureUploadsDir = (folder: string) => {
  const fullPath = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

/**
 * Dosyayı local dosya sistemine yükler (fallback)
 */
export const uploadToLocal = async (
  file: Express.Multer.File,
  folder: string = 'profiles'
): Promise<UploadResult> => {
  try {
    // Uploads klasörünü oluştur
    const uploadDir = ensureUploadsDir(folder);
    
    // Benzersiz dosya adı oluştur
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Dosyayı kaydet
    fs.writeFileSync(filePath, file.buffer);

    // API URL'ini belirle
    const apiUrl = process.env.API_URL || 'http://localhost:5000';
    const publicUrl = `${apiUrl}/uploads/${folder}/${fileName}`;

    console.log(`✅ Local upload successful: ${publicUrl}`);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Local upload error:', error);
    return {
      success: false,
      error: 'Dosya yüklenirken bir hata oluştu',
    };
  }
};

/**
 * Local dosya sisteminden dosya siler
 */
export const deleteFromLocal = async (fileUrl: string): Promise<boolean> => {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    const baseUrl = `${apiUrl}/uploads/`;
    
    if (!fileUrl.startsWith(baseUrl)) {
      return false;
    }

    const relativePath = fileUrl.replace(baseUrl, '');
    const filePath = path.join(UPLOADS_DIR, relativePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Local delete error:', error);
    return false;
  }
};

/**
 * Dosyayı Firebase Storage'a veya local'e yükler
 */
export const uploadToFirebase = async (
  file: Express.Multer.File,
  folder: string = 'profiles',
  makePublic: boolean = true
): Promise<UploadResult> => {
  // Firebase etkin değilse local'e yükle
  if (!firebaseEnabled || !bucket) {
    console.log('⚠️ Firebase not configured, using local storage fallback');
    return uploadToLocal(file, folder);
  }

  try {
    // Benzersiz dosya adı oluştur
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    // Firebase Storage'a yükle
    const fileUpload = bucket.file(fileName);
    
    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
        }
      },
    });

    // Dosyayı public yap (opsiyonel)
    if (makePublic) {
      await fileUpload.makePublic();
    }

    // Public URL'i al
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Firebase upload error:', error);
    return {
      success: false,
      error: 'Dosya yüklenirken bir hata oluştu',
    };
  }
};

/**
 * Firebase Storage'dan veya local'den dosya siler
 */
export const deleteFromFirebase = async (fileUrl: string): Promise<boolean> => {
  // Local URL kontrolü
  const apiUrl = process.env.API_URL || 'http://localhost:3001';
  if (fileUrl.startsWith(apiUrl)) {
    return deleteFromLocal(fileUrl);
  }

  // Firebase etkin değilse false döndür
  if (!firebaseEnabled || !bucket) {
    return false;
  }

  try {
    // URL'den dosya yolunu çıkar
    const bucketName = bucket.name;
    const baseUrl = `https://storage.googleapis.com/${bucketName}/`;
    
    if (!fileUrl.startsWith(baseUrl)) {
      return false;
    }

    const filePath = fileUrl.replace(baseUrl, '');
    const file = bucket.file(filePath);

    // Dosyanın var olup olmadığını kontrol et
    const [exists] = await file.exists();
    if (!exists) {
      return false;
    }

    // Dosyayı sil
    await file.delete();
    return true;
  } catch (error) {
    console.error('Firebase delete error:', error);
    return false;
  }
};
