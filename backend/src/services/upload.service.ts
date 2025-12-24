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

// ==================== KLASÖR YAPISI ====================
/**
 * uploads/
 * ├── profiles/
 * │   ├── admin/
 * │   ├── mudur/
 * │   ├── ogretmen/
 * │   ├── ogrenci/
 * │   └── sekreter/
 * ├── groups/
 * │   └── {groupId}/
 * ├── courses/
 * │   └── {kursId}/
 * │       ├── logo/
 * │       ├── odevler/
 * │       │   └── {odevId}/
 * │       └── belgeler/
 * ├── students/
 * │   └── {ogrenciId}/
 * │       └── belgeler/
 * └── documents/
 *     ├── odev/
 *     ├── sinav/
 *     └── diger/
 */

// ==================== HELPER FONKSİYONLAR ====================

/**
 * Uploads klasörünü oluştur (yoksa)
 */
const ensureUploadsDir = (folder: string) => {
  const fullPath = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

/**
 * Profil fotoğrafı için klasör yolu oluştur
 * @param userType - admin, mudur, ogretmen, ogrenci, sekreter
 * @param userId - Kullanıcı ID'si
 */
export const getProfilePhotoPath = (userType: string, userId: number | string): string => {
  return `profiles/${userType.toLowerCase()}/${userId}`;
};

/**
 * Grup fotoğrafı için klasör yolu oluştur
 * @param groupId - Grup (Conversation) ID'si
 */
export const getGroupPhotoPath = (groupId: string): string => {
  return `groups/${groupId}`;
};

/**
 * Kurs logosu için klasör yolu oluştur
 * @param kursId - Kurs ID'si
 */
export const getCourseLogoPath = (kursId: number | string): string => {
  return `courses/${kursId}/logo`;
};

/**
 * Kurs ödev belgesi için klasör yolu oluştur
 * @param kursId - Kurs ID'si
 * @param odevId - Ödev ID'si (opsiyonel)
 */
export const getCourseHomeworkPath = (kursId: number | string, odevId?: number | string): string => {
  if (odevId) {
    return `courses/${kursId}/odevler/${odevId}`;
  }
  return `courses/${kursId}/odevler`;
};

/**
 * Kurs genel belgeleri için klasör yolu oluştur
 * @param kursId - Kurs ID'si
 */
export const getCourseDocumentPath = (kursId: number | string): string => {
  return `courses/${kursId}/belgeler`;
};

/**
 * Öğrenci belgesi için klasör yolu oluştur
 * @param ogrenciId - Öğrenci ID'si
 */
export const getStudentDocumentPath = (ogrenciId: number | string): string => {
  return `students/${ogrenciId}/belgeler`;
};

/**
 * Genel belge yükleme için klasör yolu oluştur
 * @param documentType - odev, sinav, rapor, diger
 */
export const getDocumentPath = (documentType: string = 'diger'): string => {
  return `documents/${documentType.toLowerCase()}`;
};

// ==================== UPLOAD FONKSİYONLARI ====================

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
    const apiUrl = process.env.API_URL || 'http://localhost:5000';
    const baseUrl = `${apiUrl}/uploads/`;
    
    if (!fileUrl.startsWith(baseUrl)) {
      return false;
    }

    const relativePath = fileUrl.replace(baseUrl, '');
    const filePath = path.join(UPLOADS_DIR, relativePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Local delete successful: ${fileUrl}`);
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

    console.log(`✅ Firebase upload successful: ${publicUrl}`);

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
  const apiUrl = process.env.API_URL || 'http://localhost:5000';
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
    console.log(`✅ Firebase delete successful: ${fileUrl}`);
    return true;
  } catch (error) {
    console.error('Firebase delete error:', error);
    return false;
  }
};

// ==================== HAZIR UPLOAD FONKSİYONLARI ====================

/**
 * Profil fotoğrafı yükle
 */
export const uploadProfilePhoto = async (
  file: Express.Multer.File,
  userType: string,
  userId: number | string
): Promise<UploadResult> => {
  const folder = getProfilePhotoPath(userType, userId);
  return uploadToFirebase(file, folder);
};

/**
 * Grup fotoğrafı yükle
 */
export const uploadGroupPhoto = async (
  file: Express.Multer.File,
  groupId: string
): Promise<UploadResult> => {
  const folder = getGroupPhotoPath(groupId);
  return uploadToFirebase(file, folder);
};

/**
 * Kurs logosu yükle
 */
export const uploadCourseLogo = async (
  file: Express.Multer.File,
  kursId: number | string
): Promise<UploadResult> => {
  const folder = getCourseLogoPath(kursId);
  return uploadToFirebase(file, folder);
};

/**
 * Ödev belgesi yükle
 */
export const uploadHomeworkDocument = async (
  file: Express.Multer.File,
  kursId: number | string,
  odevId?: number | string
): Promise<UploadResult> => {
  const folder = getCourseHomeworkPath(kursId, odevId);
  return uploadToFirebase(file, folder);
};

/**
 * Kurs belgesi yükle
 */
export const uploadCourseDocument = async (
  file: Express.Multer.File,
  kursId: number | string
): Promise<UploadResult> => {
  const folder = getCourseDocumentPath(kursId);
  return uploadToFirebase(file, folder);
};

/**
 * Öğrenci belgesi yükle
 */
export const uploadStudentDocument = async (
  file: Express.Multer.File,
  ogrenciId: number | string
): Promise<UploadResult> => {
  const folder = getStudentDocumentPath(ogrenciId);
  return uploadToFirebase(file, folder);
};

/**
 * Genel belge yükle
 */
export const uploadDocument = async (
  file: Express.Multer.File,
  documentType: string = 'diger'
): Promise<UploadResult> => {
  const folder = getDocumentPath(documentType);
  return uploadToFirebase(file, folder);
};
