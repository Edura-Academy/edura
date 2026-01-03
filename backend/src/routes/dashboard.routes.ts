import { Router } from 'express';
import {
  getMudurDashboard,
  getOgretmenRaporlari,
  getOgrenciIlerleme,
  getOgretmenDashboardStats,
  getOgretmenBugunDersler,
  getSekreterDashboardStats,
  getSekreterBekleyenOdemeler,
  getOgrenciDashboardStats,
  getOgrenciBugunDersler,
  getOgrenciBekleyenOdevler
} from '../controllers/dashboard.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Müdür/Admin dashboard
router.get('/mudur', authenticateToken, authorizeRoles('mudur', 'admin'), getMudurDashboard);

// Öğretmen dashboard stats
router.get('/ogretmen/stats', authenticateToken, authorizeRoles('ogretmen'), getOgretmenDashboardStats);

// Öğretmen bugünkü dersler
router.get('/ogretmen/bugun-dersler', authenticateToken, authorizeRoles('ogretmen'), getOgretmenBugunDersler);

// Öğretmen raporları
router.get('/ogretmen', authenticateToken, authorizeRoles('ogretmen'), getOgretmenRaporlari);

// Sekreter dashboard stats
router.get('/sekreter/stats', authenticateToken, authorizeRoles('sekreter'), getSekreterDashboardStats);

// Sekreter bekleyen ödemeler
router.get('/sekreter/bekleyen-odemeler', authenticateToken, authorizeRoles('sekreter'), getSekreterBekleyenOdemeler);

// Öğrenci dashboard stats
router.get('/ogrenci/stats', authenticateToken, authorizeRoles('ogrenci'), getOgrenciDashboardStats);

// Öğrenci bugünkü dersler
router.get('/ogrenci/bugun-dersler', authenticateToken, authorizeRoles('ogrenci'), getOgrenciBugunDersler);

// Öğrenci bekleyen ödevler
router.get('/ogrenci/bekleyen-odevler', authenticateToken, authorizeRoles('ogrenci'), getOgrenciBekleyenOdevler);

// Öğrenci ilerleme (detaylı)
router.get('/ogrenci', authenticateToken, authorizeRoles('ogrenci'), getOgrenciIlerleme);

export default router;

