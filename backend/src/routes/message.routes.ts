import { Router } from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  getAvailableUsers,
  getNewMessages,
  updateConversationName,
  updateMemberRole,
  removeMember,
  addMember,
} from '../controllers/message.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar için authentication gerekli
router.use(authenticateToken);

// Konuşmalar
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);

// Konuşma ayarları
router.put('/conversations/:conversationId/name', updateConversationName);

// Üye yönetimi
router.post('/conversations/:conversationId/members', addMember);
router.put('/conversations/:conversationId/members/:memberId/role', updateMemberRole);
router.delete('/conversations/:conversationId/members/:memberId', removeMember);

// Kullanıcılar (yeni mesaj için)
router.get('/users', getAvailableUsers);

// Mesajlar
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.get('/conversations/:conversationId/messages/new', getNewMessages);

export default router;

