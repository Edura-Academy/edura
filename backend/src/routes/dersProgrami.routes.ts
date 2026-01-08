import { Router } from 'express';
import {
  getOgretmenDersProgrami,
  getOgrenciDersProgrami,
  getSinifDersProgrami,
  getSiniflar,
  getOgretmenler,
  createDers,
  updateDers,
  deleteDers,
  exportToICal,
  updateDersWithNotification,
  cancelDers,
  getAylikTakvim
} from '../controllers/dersProgrami.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

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

// iCal Export
router.get('/export/ical', authenticateToken, exportToICal);

// Aylık takvim görünümü
router.get('/takvim', authenticateToken, getAylikTakvim);

// Ders CRUD (sadece müdür ve sekreter)
router.post('/ders', authenticateToken, authorizeRoles('mudur', 'sekreter'), createDers);
router.put('/ders/:dersId', authenticateToken, authorizeRoles('mudur', 'sekreter'), updateDers);

// Ders güncelleme (bildirimli)
router.put('/ders/:dersId/bildirimli', authenticateToken, authorizeRoles('mudur', 'sekreter'), updateDersWithNotification);

// Ders iptali
router.post('/ders/:dersId/iptal', authenticateToken, authorizeRoles('mudur', 'sekreter', 'ogretmen'), cancelDers);

router.delete('/ders/:dersId', authenticateToken, authorizeRoles('mudur', 'sekreter'), deleteDers);

export default router;

