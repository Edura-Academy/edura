import { bucket } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Dosyayı Firebase Storage'a yükler
 */
export const uploadToFirebase = async (
  file: Express.Multer.File,
  folder: string = 'profiles'
): Promise<UploadResult> => {
  try {
    // Benzersiz dosya adı oluştur
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    // Firebase Storage'a yükle
    const fileUpload = bucket.file(fileName);
    
    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    // Dosyayı public yap
    await fileUpload.makePublic();

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
 * Firebase Storage'dan dosya siler
 */
export const deleteFromFirebase = async (fileUrl: string): Promise<boolean> => {
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
