import { Router } from 'express';
import {
  getOgretmenDersProgrami,
  getOgrenciDersProgrami,
  getSinifDersProgrami,
  getSiniflar,
  getOgretmenler,
  createDers,
  updateDers,
  deleteDers
} from '../controllers/dersProgrami.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Öğretmen programı
router.get('/ogretmen', authenticateToken, authorizeRoles('ogretmen', 'mudur'), getOgretmenDersProgrami);

// Öğrenci programı
router.get('/ogrenci', authenticateToken, authorizeRoles('ogrenci'), getOgrenciDersProgrami);

// Sınıf programı (personel görüntülemesi)
router.get('/sinif/:sinifId', authenticateToken, authorizeRoles('ogretmen', 'mudur', 'sekreter'), getSinifDersProgrami);

// Sınıf listesi
router.get('/siniflar', authenticateToken, getSiniflar);

// Öğretmen listesi
router.get('/ogretmenler', authenticateToken, authorizeRoles('mudur', 'sekreter'), getOgretmenler);

// Ders CRUD (sadece müdür ve sekreter)
router.post('/ders', authenticateToken, authorizeRoles('mudur', 'sekreter'), createDers);
router.put('/ders/:dersId', authenticateToken, authorizeRoles('mudur', 'sekreter'), updateDers);
router.delete('/ders/:dersId', authenticateToken, authorizeRoles('mudur', 'sekreter'), deleteDers);

export default router;

