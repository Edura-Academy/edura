import { Router } from 'express';
import { sendMessage, healthCheck } from '../controllers/chatbot.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Chatbot sağlık kontrolü (public)
router.get('/health', healthCheck);

// Mesaj gönder (authenticated)
router.post('/message', authenticateToken, sendMessage);

export default router;

