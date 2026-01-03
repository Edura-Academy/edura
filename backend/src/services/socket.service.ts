import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

// Event türleri
export enum SocketEvents {
  // Bildirimler
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_COUNT = 'notification:count',
  
  // Mesajlar
  MESSAGE_NEW = 'message:new',
  MESSAGE_READ = 'message:read',
  MESSAGE_TYPING = 'message:typing',
  MESSAGE_STOP_TYPING = 'message:stop_typing',
  
  // Duyurular
  ANNOUNCEMENT_NEW = 'announcement:new',
  
  // Canlı Ders
  LIVE_CLASS_STARTED = 'live_class:started',
  LIVE_CLASS_ENDED = 'live_class:ended',
  
  // Ödev
  HOMEWORK_NEW = 'homework:new',
  HOMEWORK_GRADED = 'homework:graded',
  
  // Yoklama
  ATTENDANCE_TAKEN = 'attendance:taken',
  
  // Online kullanıcılar
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  USERS_ONLINE_LIST = 'users:online_list',
}

class SocketService {
  private io: Server | null = null;
  private onlineUsers: Map<string, string[]> = new Map(); // userId -> socketId[]

  initialize(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Auth middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string; role: string };
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    console.log('🔌 Socket.IO initialized');
  }

  private handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId;
    if (!userId) return;

    console.log(`✅ User connected: ${userId}`);

    // Kullanıcıyı online listesine ekle
    this.addOnlineUser(userId, socket.id);

    // Kullanıcıyı kendi odasına ekle (özel bildirimler için)
    socket.join(`user:${userId}`);

    // Online kullanıcı listesini gönder
    this.broadcastOnlineUsers();

    // Event listeners
    socket.on('join:conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('join:class', (sinifId: string) => {
      socket.join(`sinif:${sinifId}`);
    });

    socket.on(SocketEvents.MESSAGE_TYPING, (data: { conversationId: string; userName: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit(SocketEvents.MESSAGE_TYPING, {
        userId,
        userName: data.userName,
      });
    });

    socket.on(SocketEvents.MESSAGE_STOP_TYPING, (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit(SocketEvents.MESSAGE_STOP_TYPING, {
        userId,
      });
    });

    socket.on(SocketEvents.NOTIFICATION_READ, async (notificationId: string) => {
      try {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { okundu: true },
        });
        
        // Okunmamış bildirim sayısını güncelle
        const count = await prisma.notification.count({
          where: { userId, okundu: false },
        });
        
        socket.emit(SocketEvents.NOTIFICATION_COUNT, count);
      } catch (error) {
        console.error('Notification read error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${userId}`);
      this.removeOnlineUser(userId, socket.id);
      this.broadcastOnlineUsers();
    });
  }

  private addOnlineUser(userId: string, socketId: string) {
    const sockets = this.onlineUsers.get(userId) || [];
    if (!sockets.includes(socketId)) {
      sockets.push(socketId);
      this.onlineUsers.set(userId, sockets);
    }
  }

  private removeOnlineUser(userId: string, socketId: string) {
    const sockets = this.onlineUsers.get(userId) || [];
    const filtered = sockets.filter((id) => id !== socketId);
    
    if (filtered.length === 0) {
      this.onlineUsers.delete(userId);
    } else {
      this.onlineUsers.set(userId, filtered);
    }
  }

  private broadcastOnlineUsers() {
    if (!this.io) return;
    const onlineUserIds = Array.from(this.onlineUsers.keys());
    this.io.emit(SocketEvents.USERS_ONLINE_LIST, onlineUserIds);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  // ==================== EMIT METHODS ====================

  /**
   * Belirli bir kullanıcıya bildirim gönder
   */
  sendToUser(userId: string, event: SocketEvents, data: unknown) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Birden fazla kullanıcıya bildirim gönder
   */
  sendToUsers(userIds: string[], event: SocketEvents, data: unknown) {
    userIds.forEach((userId) => this.sendToUser(userId, event, data));
  }

  /**
   * Konuşmadaki kullanıcılara mesaj gönder
   */
  sendToConversation(conversationId: string, event: SocketEvents, data: unknown) {
    if (!this.io) return;
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  /**
   * Sınıftaki kullanıcılara bildirim gönder
   */
  sendToClass(sinifId: string, event: SocketEvents, data: unknown) {
    if (!this.io) return;
    this.io.to(`sinif:${sinifId}`).emit(event, data);
  }

  /**
   * Herkese broadcast gönder
   */
  broadcast(event: SocketEvents, data: unknown) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Yeni bildirim gönder ve veritabanına kaydet
   */
  async createAndSendNotification(
    userId: string,
    notification: {
      baslik: string;
      mesaj: string;
      tip?: 'BILDIRIM' | 'ONAY_TALEBI' | 'SISTEM';
    }
  ) {
    try {
      const created = await prisma.notification.create({
        data: {
          userId,
          baslik: notification.baslik,
          mesaj: notification.mesaj,
          tip: notification.tip || 'BILDIRIM',
        },
      });

      this.sendToUser(userId, SocketEvents.NOTIFICATION, created);

      // Okunmamış sayısını güncelle
      const count = await prisma.notification.count({
        where: { userId, okundu: false },
      });
      this.sendToUser(userId, SocketEvents.NOTIFICATION_COUNT, count);

      return created;
    } catch (error) {
      console.error('Create notification error:', error);
      return null;
    }
  }

  /**
   * Yeni mesaj bildirimi gönder
   */
  sendNewMessage(
    conversationId: string,
    message: {
      id: string;
      gonderenId: string;
      gonderenAd: string;
      icerik: string;
      createdAt: Date;
    }
  ) {
    this.sendToConversation(conversationId, SocketEvents.MESSAGE_NEW, message);
  }

  /**
   * Yeni duyuru bildirimi gönder
   */
  async sendNewAnnouncement(duyuru: {
    id: string;
    baslik: string;
    icerik: string;
    hedef: string;
    sinifIds?: string | null;
  }) {
    // Hedef kitleye göre gönder
    if (duyuru.hedef === 'HERKESE') {
      this.broadcast(SocketEvents.ANNOUNCEMENT_NEW, duyuru);
    } else if (duyuru.hedef === 'SINIF' && duyuru.sinifIds) {
      const sinifIds = JSON.parse(duyuru.sinifIds);
      sinifIds.forEach((sinifId: string) => {
        this.sendToClass(sinifId, SocketEvents.ANNOUNCEMENT_NEW, duyuru);
      });
    }
    // Diğer hedef türleri için de benzer mantık eklenebilir
  }

  /**
   * Canlı ders başladı bildirimi
   */
  sendLiveClassStarted(sinifId: string, data: { dersId: string; baslik: string; ogretmenAd: string }) {
    this.sendToClass(sinifId, SocketEvents.LIVE_CLASS_STARTED, data);
  }
}

export const socketService = new SocketService();

