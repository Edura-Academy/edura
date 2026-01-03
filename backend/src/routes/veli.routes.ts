import { Router } from 'express';
import {
  getVeliDashboard,
  getCocukDetay,
  getCocukNotlar,
  getCocukDevamsizlik,
  getCocukOdevler,
  getCocukDersProgrami,
  getCocukOgretmenler,
  startConversationWithTeacher,
  addCocukToVeli
} from '../controllers/veli.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Veli rotaları
router.get('/dashboard', authenticateToken, authorizeRoles('veli'), getVeliDashboard);
router.get('/cocuk/:cocukId', authenticateToken, authorizeRoles('veli'), getCocukDetay);
router.get('/cocuk/:cocukId/notlar', authenticateToken, authorizeRoles('veli'), getCocukNotlar);
router.get('/cocuk/:cocukId/devamsizlik', authenticateToken, authorizeRoles('veli'), getCocukDevamsizlik);
router.get('/cocuk/:cocukId/odevler', authenticateToken, authorizeRoles('veli'), getCocukOdevler);
router.get('/cocuk/:cocukId/ders-programi', authenticateToken, authorizeRoles('veli'), getCocukDersProgrami);
router.get('/cocuk/:cocukId/ogretmenler', authenticateToken, authorizeRoles('veli'), getCocukOgretmenler);

// Mesajlaşma
router.post('/mesaj/baslat', authenticateToken, authorizeRoles('veli'), startConversationWithTeacher);

// Admin rotaları (Veli-Öğrenci bağlantısı)
router.post('/cocuk-ekle', authenticateToken, authorizeRoles('admin', 'mudur'), addCocukToVeli);

export default router;

