import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import uploadRoutes from './routes/upload.routes';
import messageRoutes from './routes/message.routes';
import odevRoutes from './routes/odev.routes';
import yoklamaRoutes from './routes/yoklama.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Edura API is running' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Sunucu hatası' });
});

// Start server - Cloud Run requires 0.0.0.0 binding
const HOST = '0.0.0.0';
app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
});

export default app;

