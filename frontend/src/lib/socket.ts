'use client';

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Socket Events (backend ile senkronize)
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

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  
  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message);
    });

    // Tüm mevcut listener'ları yeniden bağla
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback as (...args: unknown[]) => void);
      });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<T = unknown>(event: SocketEvents | string, callback: (data: T) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as (data: unknown) => void);

    if (this.socket) {
      this.socket.on(event, callback as (...args: unknown[]) => void);
    }

    // Cleanup function
    return () => {
      this.off(event, callback);
    };
  }

  off<T = unknown>(event: SocketEvents | string, callback: (data: T) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback as (data: unknown) => void);
    }

    if (this.socket) {
      this.socket.off(event, callback as (...args: unknown[]) => void);
    }
  }

  emit(event: string, data?: unknown) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  // Helper methods
  joinConversation(conversationId: string) {
    this.emit('join:conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.emit('leave:conversation', conversationId);
  }

  joinClass(sinifId: string) {
    this.emit('join:class', sinifId);
  }

  sendTyping(conversationId: string, userName: string) {
    this.emit(SocketEvents.MESSAGE_TYPING, { conversationId, userName });
  }

  sendStopTyping(conversationId: string) {
    this.emit(SocketEvents.MESSAGE_STOP_TYPING, { conversationId });
  }

  markNotificationRead(notificationId: string) {
    this.emit(SocketEvents.NOTIFICATION_READ, notificationId);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const socketClient = new SocketClient();

