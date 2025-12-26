import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import {
  recordActivity,
  getUserStats,
  getGunlukGorevler,
  updateGorevIlerleme,
  getGununSorusu,
  answerGununSorusu,
  getLeaderboard,
  getUserRozetler
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

// Rozetler
router.get('/rozetler', getUserRozetler);

export default router;

