import { Router } from 'express';
import {
  getAllDuyurular,
  createDuyuru,
  updateDuyuru,
  deleteDuyuru,
  getMyDuyurular,
  markAsRead,
  getDuyuruById,
  getSiniflar,
  togglePin,
  archiveDuyuru,
  unarchiveDuyuru,
  getArchivedDuyurular,
  getKategoriler
} from '../controllers/duyuru.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticateToken);

// Yönetim route'ları (personel)
router.get('/yonetim', authorizeRoles('mudur', 'ogretmen', 'sekreter'), getAllDuyurular);
router.post('/', authorizeRoles('mudur', 'ogretmen', 'sekreter'), createDuyuru);
router.put('/:duyuruId', authorizeRoles('mudur', 'ogretmen', 'sekreter'), updateDuyuru);
router.delete('/:duyuruId', authorizeRoles('mudur', 'ogretmen', 'sekreter'), deleteDuyuru);
router.get('/siniflar', authorizeRoles('mudur', 'ogretmen', 'sekreter'), getSiniflar);

// Kategori listesi
router.get('/kategoriler', getKategoriler);

// Pin işlemleri (personel)
router.post('/:duyuruId/pin', authorizeRoles('mudur', 'ogretmen', 'sekreter'), togglePin);

// Arşiv işlemleri (personel)
router.get('/arsiv', authorizeRoles('mudur', 'ogretmen', 'sekreter'), getArchivedDuyurular);
router.post('/:duyuruId/arsivle', authorizeRoles('mudur', 'ogretmen', 'sekreter'), archiveDuyuru);
router.post('/:duyuruId/arsivden-cikar', authorizeRoles('mudur', 'ogretmen', 'sekreter'), unarchiveDuyuru);

// Kullanıcı route'ları (herkes)
router.get('/benim', getMyDuyurular);
router.post('/:duyuruId/oku', markAsRead);
router.get('/:duyuruId', getDuyuruById);

export default router;

