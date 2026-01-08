import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';

// Services
import { emailService } from './services/email.service';
import { socketService } from './services/socket.service';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import uploadRoutes from './routes/upload.routes';
import messageRoutes from './routes/message.routes';
import odevRoutes from './routes/odev.routes';
import yoklamaRoutes from './routes/yoklama.routes';
import duyuruRoutes from './routes/duyuru.routes';
import veliRoutes from './routes/veli.routes';
import odemeRoutes from './routes/odeme.routes';
import onlineSinavRoutes from './routes/onlineSinav.routes';
import dersProgramiRoutes from './routes/dersProgrami.routes';
import dashboardRoutes from './routes/dashboard.routes';
import canliDersRoutes from './routes/canliDers.routes';
import materyalRoutes from './routes/materyal.routes';
import birebirDersRoutes from './routes/birebirDers.routes';
import gamificationRoutes from './routes/gamification.routes';
import denemeRoutes from './routes/deneme.routes';
import kurumIciDenemeRoutes from './routes/kurumIciDeneme.routes';
import testRoutes from './routes/test.routes';
import adminSystemRoutes from './routes/admin-system.routes';
import chatbotRoutes from './routes/chatbot.routes';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
socketService.initialize(httpServer);

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://edura.vercel.app', /\.vercel\.app$/]
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
// Body parser limit artırıldı - resimli sorular için (base64 encoded images)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static dosya sunumu (uploads klasörü - local storage fallback için)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/odevler', odevRoutes);
app.use('/api/yoklama', yoklamaRoutes);
app.use('/api/duyurular', duyuruRoutes);
app.use('/api/veli', veliRoutes);
app.use('/api/odeme', odemeRoutes);
app.use('/api/online-sinav', onlineSinavRoutes);
app.use('/api/ders-programi', dersProgramiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/canli-ders', canliDersRoutes);
app.use('/api/materyaller', materyalRoutes);
app.use('/api/birebir-ders', birebirDersRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/deneme', denemeRoutes);
app.use('/api/kurum-ici-deneme', kurumIciDenemeRoutes);
app.use('/api/test', testRoutes);
app.use('/api/admin-system', adminSystemRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Edura API is running' });
});

// Email test endpoint (sadece development için)
app.post('/api/test-email', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email adresi gerekli' });
  }
  
  try {
    const result = await emailService.sendNewHomeworkNotification(email, {
      ogrenciAd: 'Test Kullanıcı',
      dersAd: 'Matematik',
      odevBaslik: 'Deneme Ödevi - Email Test',
      sonTeslimTarihi: new Date().toLocaleDateString('tr-TR'),
      ogretmenAd: 'Edura Sistem'
    });
    
    if (result) {
      res.json({ success: true, message: 'Test e-postası gönderildi!' });
    } else {
      res.status(500).json({ success: false, error: 'E-posta gönderilemedi' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Sunucu hatası' });
});

// Start server - Cloud Run requires 0.0.0.0 binding
const HOST = '0.0.0.0';
httpServer.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
  console.log(`🔌 WebSocket ready for connections`);
});

export default app;
export { socketService };

