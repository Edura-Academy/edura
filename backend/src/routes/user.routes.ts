import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { UserRole } from '../types';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

// GET /api/users - Tüm kullanıcıları getir (Admin ve Müdür)
router.get('/', authorizeRoles(UserRole.ADMIN, UserRole.MUDUR), getAllUsers);

// GET /api/users/:id - Kullanıcı detayı
router.get('/:id', getUserById);

// PUT /api/users/:id - Kullanıcı güncelle
router.put('/:id', updateUser);

// DELETE /api/users/:id - Kullanıcı sil (Sadece Admin)
router.delete('/:id', authorizeRoles(UserRole.ADMIN), deleteUser);

export default router;

