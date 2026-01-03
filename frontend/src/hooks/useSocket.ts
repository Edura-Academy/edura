'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketClient, SocketEvents } from '@/lib/socket';
import { showToast } from '@/components/ToastProvider';

// Socket bağlantı hook'u
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = socketClient.connect(token);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  const disconnect = useCallback(() => {
    socketClient.disconnect();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    disconnect,
    socket: socketClient,
  };
}

// Socket event listener hook'u
export function useSocketEvent<T = unknown>(
  event: SocketEvents | string,
  callback: (data: T) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const cleanup = socketClient.on(event, callback);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}

// Bildirimler için hook
interface Notification {
  id: string;
  baslik: string;
  mesaj: string;
  tip: string;
  okundu: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Yeni bildirim geldiğinde
  useSocketEvent<Notification>(SocketEvents.NOTIFICATION, (notification) => {
    setNotifications((prev) => [notification, ...prev]);
    showToast.info(notification.baslik, notification.mesaj);
  });

  // Okunmamış sayısı güncellendiğinde
  useSocketEvent<number>(SocketEvents.NOTIFICATION_COUNT, (count) => {
    setUnreadCount(count);
  });

  const markAsRead = useCallback((notificationId: string) => {
    socketClient.markNotificationRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, okundu: true } : n
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    notifications.forEach((n) => {
      if (!n.okundu) {
        socketClient.markNotificationRead(n.id);
      }
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, okundu: true })));
    setUnreadCount(0);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    setNotifications,
    setUnreadCount,
  };
}

// Online kullanıcılar için hook
export function useOnlineUsers() {
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useSocketEvent<string[]>(SocketEvents.USERS_ONLINE_LIST, (userIds) => {
    setOnlineUserIds(userIds);
  });

  const isUserOnline = useCallback(
    (userId: string) => onlineUserIds.includes(userId),
    [onlineUserIds]
  );

  return {
    onlineUserIds,
    isUserOnline,
    onlineCount: onlineUserIds.length,
  };
}

// Mesajlaşma için hook
interface Message {
  id: string;
  gonderenId: string;
  gonderenAd: string;
  icerik: string;
  createdAt: Date;
}

interface TypingUser {
  userId: string;
  userName: string;
}

export function useConversation(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Konuşmaya katıl
  useEffect(() => {
    if (!conversationId) return;
    socketClient.joinConversation(conversationId);

    return () => {
      socketClient.leaveConversation(conversationId);
    };
  }, [conversationId]);

  // Yeni mesaj
  useSocketEvent<Message>(SocketEvents.MESSAGE_NEW, (message) => {
    setMessages((prev) => [...prev, message]);
  }, [conversationId]);

  // Yazıyor...
  useSocketEvent<TypingUser>(SocketEvents.MESSAGE_TYPING, (data) => {
    setTypingUsers((prev) => {
      if (prev.some((u) => u.userId === data.userId)) return prev;
      return [...prev, data];
    });

    // 3 saniye sonra typing durumunu kaldır
    const existingTimeout = typingTimeouts.current.get(data.userId);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(() => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      typingTimeouts.current.delete(data.userId);
    }, 3000);

    typingTimeouts.current.set(data.userId, timeout);
  }, []);

  // Yazmayı bıraktı
  useSocketEvent<{ userId: string }>(SocketEvents.MESSAGE_STOP_TYPING, (data) => {
    setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    const timeout = typingTimeouts.current.get(data.userId);
    if (timeout) {
      clearTimeout(timeout);
      typingTimeouts.current.delete(data.userId);
    }
  }, []);

  const sendTyping = useCallback(
    (userName: string) => {
      if (conversationId) {
        socketClient.sendTyping(conversationId, userName);
      }
    },
    [conversationId]
  );

  const sendStopTyping = useCallback(() => {
    if (conversationId) {
      socketClient.sendStopTyping(conversationId);
    }
  }, [conversationId]);

  return {
    messages,
    setMessages,
    typingUsers,
    sendTyping,
    sendStopTyping,
  };
}

// Duyurular için hook
interface Announcement {
  id: string;
  baslik: string;
  icerik: string;
  oncelik: string;
}

export function useAnnouncements() {
  const [newAnnouncement, setNewAnnouncement] = useState<Announcement | null>(null);

  useSocketEvent<Announcement>(SocketEvents.ANNOUNCEMENT_NEW, (announcement) => {
    setNewAnnouncement(announcement);
    
    // Önemli duyurular için farklı toast göster
    if (announcement.oncelik === 'ACIL') {
      showToast.warning('🚨 Acil Duyuru', announcement.baslik);
    } else if (announcement.oncelik === 'ONEMLI') {
      showToast.info('📢 Önemli Duyuru', announcement.baslik);
    } else {
      showToast.info('📢 Yeni Duyuru', announcement.baslik);
    }
  });

  const clearNewAnnouncement = useCallback(() => {
    setNewAnnouncement(null);
  }, []);

  return {
    newAnnouncement,
    clearNewAnnouncement,
  };
}

// Canlı ders için hook
interface LiveClassEvent {
  dersId: string;
  baslik: string;
  ogretmenAd: string;
}

export function useLiveClass(sinifId: string | null) {
  const [liveClassStarted, setLiveClassStarted] = useState<LiveClassEvent | null>(null);

  useEffect(() => {
    if (!sinifId) return;
    socketClient.joinClass(sinifId);
  }, [sinifId]);

  useSocketEvent<LiveClassEvent>(SocketEvents.LIVE_CLASS_STARTED, (data) => {
    setLiveClassStarted(data);
    showToast.success('🎥 Canlı Ders Başladı', `${data.ogretmenAd} canlı dersi başlattı!`);
  });

  useSocketEvent<{ dersId: string }>(SocketEvents.LIVE_CLASS_ENDED, () => {
    setLiveClassStarted(null);
    showToast.info('Canlı Ders Sona Erdi');
  });

  return {
    liveClassStarted,
    clearLiveClass: () => setLiveClassStarted(null),
  };
}

