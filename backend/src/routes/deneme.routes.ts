import { Router } from 'express';
import {
  getDenemeSinavlari,
  getDenemeSinavi,
  createDenemeSinavi,
  updateDenemeSinavi,
  deleteDenemeSinavi,
  addDenemeSonucu,
  addTopluDenemeSonucu,
  deleteDenemeSonucu,
  getOgrenciDenemeSonuclari,
  getOgrenciDenemeIstatistik,
  getBransTanimlari,
  getSinifDenemeAnalizi,
  importCSV,
  importJSON,
  getCSVTemplate,
  getJSONTemplate,
  setDenemeHedef,
  getDenemeHedef,
  getOgrenciKarsilastirma,
  getBransDetayAnaliz,
  exportToExcel,
} from '../controllers/deneme.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Tüm rotalar authentication gerektirir
router.use(authenticateToken);

// ==================== BRANŞ TANIMLARI ====================
// Herkes görebilir (TYT, AYT, LGS branş ve soru sayıları)
router.get('/brans-tanimlari', getBransTanimlari);

// ==================== DENEME SINAVLARI ====================
// Liste - herkes görebilir (kendi kursuna göre filtrelenmiş)
router.get('/', getDenemeSinavlari);

// Detay - herkes görebilir
router.get('/:id', getDenemeSinavi);

// Oluştur - admin, müdür, öğretmen
router.post('/', authorizeRoles('admin', 'mudur', 'ogretmen'), createDenemeSinavi);

// Güncelle - admin, müdür, öğretmen
router.put('/:id', authorizeRoles('admin', 'mudur', 'ogretmen'), updateDenemeSinavi);

// Sil - admin, müdür
router.delete('/:id', authorizeRoles('admin', 'mudur'), deleteDenemeSinavi);

// ==================== DENEME SONUÇLARI ====================
// Tek sonuç ekle - admin, müdür, öğretmen, sekreter
router.post('/sonuc', authorizeRoles('admin', 'mudur', 'ogretmen', 'sekreter'), addDenemeSonucu);

// Toplu sonuç ekle (Excel/CSV import) - admin, müdür, öğretmen, sekreter
router.post('/sonuc/toplu', authorizeRoles('admin', 'mudur', 'ogretmen', 'sekreter'), addTopluDenemeSonucu);

// CSV Import
router.post('/import/csv', authorizeRoles('admin', 'mudur', 'ogretmen', 'sekreter'), importCSV);

// JSON Import
router.post('/import/json', authorizeRoles('admin', 'mudur', 'ogretmen', 'sekreter'), importJSON);

// Şablonlar
router.get('/template/csv', getCSVTemplate);
router.get('/template/json', getJSONTemplate);

// Sonuç sil - admin, müdür
router.delete('/sonuc/:id', authorizeRoles('admin', 'mudur'), deleteDenemeSonucu);

// ==================== SINIF ANALİZİ ====================
// Sınıf bazlı deneme analizi - admin, müdür, öğretmen
router.get('/:sinavId/sinif-analizi', authorizeRoles('admin', 'mudur', 'ogretmen'), getSinifDenemeAnalizi);

// ==================== ÖĞRENCİ / VELİ GÖRÜNÜMÜ ====================
// Kendi sonuçları
router.get('/ogrenci/sonuclarim', authorizeRoles('ogrenci'), getOgrenciDenemeSonuclari);
router.get('/ogrenci/istatistiklerim', authorizeRoles('ogrenci'), getOgrenciDenemeIstatistik);

// Belirli öğrencinin sonuçları (veli, öğretmen, admin için)
router.get('/ogrenci/:ogrenciId/sonuclari', authorizeRoles('admin', 'mudur', 'ogretmen', 'veli'), getOgrenciDenemeSonuclari);
router.get('/ogrenci/:ogrenciId/istatistikleri', authorizeRoles('admin', 'mudur', 'ogretmen', 'veli'), getOgrenciDenemeIstatistik);

// ==================== HEDEF BELİRLEME ====================
// Hedef belirleme/güncelleme
router.post('/hedef', authenticateToken, setDenemeHedef);

// Hedefleri getir
router.get('/hedef', authenticateToken, getDenemeHedef);

// ==================== KARŞILAŞTIRMALI ANALİZ ====================
// İki öğrenciyi karşılaştır
router.get('/karsilastirma', authorizeRoles('admin', 'mudur', 'ogretmen'), getOgrenciKarsilastirma);

// Branş bazlı detay analizi
router.get('/brans-analiz', authenticateToken, getBransDetayAnaliz);

// ==================== EXCEL EXPORT ====================
// Sınav sonuçlarını Excel'e export et
router.get('/:sinavId/export/excel', authorizeRoles('admin', 'mudur', 'ogretmen', 'sekreter'), exportToExcel);

export default router;

