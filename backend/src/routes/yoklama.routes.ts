import { Router } from 'express';
import {
  getTeacherCourses,
  getTodayAttendance,
  saveAttendance,
  updateSingleAttendance,
  getAttendanceHistory,
  getStudentAttendance,
  generateQRToken,
  submitQRAttendance
} from '../controllers/yoklama.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticateToken);

// Öğretmen route'ları
router.get('/ogretmen/dersler', authorizeRoles('ogretmen', 'mudur'), getTeacherCourses);
router.get('/ogretmen/ders/:courseId', authorizeRoles('ogretmen', 'mudur'), getTodayAttendance);
router.post('/ogretmen/ders/:courseId', authorizeRoles('ogretmen', 'mudur'), saveAttendance);
router.put('/ogretmen/ders/:courseId/ogrenci/:ogrenciId', authorizeRoles('ogretmen', 'mudur'), updateSingleAttendance);
router.get('/ogretmen/ders/:courseId/gecmis', authorizeRoles('ogretmen', 'mudur'), getAttendanceHistory);

// QR kod route'ları
router.post('/qr/olustur/:courseId', authorizeRoles('ogretmen', 'mudur'), generateQRToken);
router.post('/qr/katil', authorizeRoles('ogrenci'), submitQRAttendance);

// Öğrenci route'ları
router.get('/ogrenci', authorizeRoles('ogrenci'), getStudentAttendance);

export default router;

