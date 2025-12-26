import { Router } from 'express';
import {
  getMudurDashboard,
  getOgretmenRaporlari,
  getOgrenciIlerleme
} from '../controllers/dashboard.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Müdür/Admin dashboard
router.get('/mudur', authenticateToken, authorizeRoles('mudur', 'admin'), getMudurDashboard);

// Öğretmen raporları
router.get('/ogretmen', authenticateToken, authorizeRoles('ogretmen'), getOgretmenRaporlari);

// Öğrenci ilerleme
router.get('/ogrenci', authenticateToken, authorizeRoles('ogrenci'), getOgrenciIlerleme);

export default router;

