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
  getOgrenciBekleyenOdevler,
  getOgrenciHaftalikProgram,
  getOgrenciOgretmenler,
  getOgrenciDenemeSonuclari,
  getOgrenciDevamsizlik,
  getSinifKarsilastirma,
  getOgretmenPerformans,
  getGenelRapor
} from '../controllers/dashboard.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Müdür/Admin dashboard
router.get('/mudur', authenticateToken, authorizeRoles('mudur', 'admin'), getMudurDashboard);

// Sınıf karşılaştırma raporu
router.get('/sinif-karsilastirma', authenticateToken, authorizeRoles('mudur', 'admin'), getSinifKarsilastirma);

// Öğretmen performans raporu
router.get('/ogretmen-performans', authenticateToken, authorizeRoles('mudur', 'admin'), getOgretmenPerformans);

// Genel rapor (PDF export için)
router.get('/genel-rapor', authenticateToken, authorizeRoles('mudur', 'admin'), getGenelRapor);

// Öğretmen dashboard stats
router.get('/ogretmen/stats', authenticateToken, authorizeRoles('ogretmen'), getOgretmenDashboardStats);

// Öğretmen bugünkü dersler
router.get('/ogretmen/bugun-dersler', authenticateToken, authorizeRoles('ogretmen'), getOgretmenBugunDersler);

// Öğretmen raporları (detaylı)
router.get('/ogretmen/rapor', authenticateToken, authorizeRoles('ogretmen'), getOgretmenRaporlari);
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

// Öğrenci haftalık program
router.get('/ogrenci/haftalik-program', authenticateToken, authorizeRoles('ogrenci'), getOgrenciHaftalikProgram);

// Öğrenci öğretmenler
router.get('/ogrenci/ogretmenler', authenticateToken, authorizeRoles('ogrenci'), getOgrenciOgretmenler);

// Öğrenci deneme sonuçları
router.get('/ogrenci/deneme-sonuclari', authenticateToken, authorizeRoles('ogrenci'), getOgrenciDenemeSonuclari);

// Öğrenci devamsızlık
router.get('/ogrenci/devamsizlik', authenticateToken, authorizeRoles('ogrenci'), getOgrenciDevamsizlik);

// Öğrenci ilerleme (detaylı)
router.get('/ogrenci', authenticateToken, authorizeRoles('ogrenci'), getOgrenciIlerleme);

export default router;

