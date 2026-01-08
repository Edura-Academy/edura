import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import {
  recordActivity,
  getUserStats,
  getGunlukGorevler,
  updateGorevIlerleme,
  getGununSorusu,
  answerGununSorusu,
  getLeaderboard,
  getUserRozetler,
  getSinifYarismasi,
  getSeviyeler,
  getXpKazanimLog,
  getKurumIciSiralama,
  getOgrenciProfil
} from '../controllers/gamification.controller';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

// İstatistikler
router.get('/stats', getUserStats);

// Aktivite kaydet
router.post('/aktivite', recordActivity);

// Günlük görevler
router.get('/gunluk-gorevler', getGunlukGorevler);
router.post('/gunluk-gorevler/ilerleme', updateGorevIlerleme);

// Günün sorusu
router.get('/gunun-sorusu', getGununSorusu);
router.post('/gunun-sorusu/cevapla', answerGununSorusu);

// Leaderboard
router.get('/leaderboard', getLeaderboard);

// Kurum İçi Sıralama (Detaylı - yeni)
router.get('/kurum-siralama', getKurumIciSiralama);

// Öğrenci Profil (sıralama sayfasından erişim)
router.get('/ogrenci/:ogrenciId', getOgrenciProfil);

// Sınıf Yarışması
router.get('/sinif-yarismasi', getSinifYarismasi);

// Seviyeler
router.get('/seviyeler', getSeviyeler);

// XP Kazanım Logları
router.get('/xp-log', getXpKazanimLog);

// Rozetler
router.get('/rozetler', getUserRozetler);

export default router;

