import { Router } from 'express';
import { login, register, me, changePassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register (Admin tarafından yeni kullanıcı ekleme)
router.post('/register', authenticateToken, register);

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, changePassword);

// GET /api/auth/me
router.get('/me', authenticateToken, me);

export default router;
