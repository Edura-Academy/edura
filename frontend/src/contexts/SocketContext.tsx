'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { socketClient, SocketEvents } from '@/lib/socket';
import { useAuth } from './AuthContext';

interface SocketContextType {
  isConnected: boolean;
  onlineUsers: string[];
  isUserOnline: (userId: string) => boolean;
  typingUsers: Map<string, { userName: string; timeout: NodeJS.Timeout }>;
  // Mesajlaşma
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTyping: (conversationId: string, userName: string) => void;
  sendStopTyping: (conversationId: string) => void;
  // Bildirimler
  markNotificationRead: (notificationId: string) => void;
  // Sınıf
  joinClass: (sinifId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, { userName: string; timeout: NodeJS.Timeout }>>(new Map());

  // Socket bağlantısı
  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketClient.disconnect();
      setIsConnected(false);
      return;
    }

    const socket = socketClient.connect(token);

    const handleConnect = () => {
      setIsConnected(true);
      console.log('🔌 Socket bağlandı');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('🔌 Socket bağlantısı kesildi');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Online kullanıcılar listesi
    socketClient.on<string[]>(SocketEvents.USERS_ONLINE_LIST, (userIds) => {
      setOnlineUsers(userIds);
    });

    // Typing göstergesi
    socketClient.on<{ userId: string; userName: string }>(SocketEvents.MESSAGE_TYPING, (data) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(data.userId);
        if (existing?.timeout) {
          clearTimeout(existing.timeout);
        }
        const timeout = setTimeout(() => {
          setTypingUsers(p => {
            const updated = new Map(p);
            updated.delete(data.userId);
            return updated;
          });
        }, 3000);
        newMap.set(data.userId, { userName: data.userName, timeout });
        return newMap;
      });
    });

    socketClient.on<{ userId: string }>(SocketEvents.MESSAGE_STOP_TYPING, (data) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(data.userId);
        if (existing?.timeout) {
          clearTimeout(existing.timeout);
        }
        newMap.delete(data.userId);
        return newMap;
      });
    });

    // Kullanıcı kendi sınıfına otomatik katıl
    if (user?.sinifId) {
      socketClient.joinClass(user.sinifId);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [isAuthenticated, token, user?.sinifId]);

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  const joinConversation = useCallback((conversationId: string) => {
    socketClient.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketClient.leaveConversation(conversationId);
  }, []);

  const sendTyping = useCallback((conversationId: string, userName: string) => {
    socketClient.sendTyping(conversationId, userName);
  }, []);

  const sendStopTyping = useCallback((conversationId: string) => {
    socketClient.sendStopTyping(conversationId);
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    socketClient.markNotificationRead(notificationId);
  }, []);

  const joinClass = useCallback((sinifId: string) => {
    socketClient.joinClass(sinifId);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        onlineUsers,
        isUserOnline,
        typingUsers,
        joinConversation,
        leaveConversation,
        sendTyping,
        sendStopTyping,
        markNotificationRead,
        joinClass,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}

// Re-export socket events and client for direct use
export { SocketEvents, socketClient };

