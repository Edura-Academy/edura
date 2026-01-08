'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSocket, useConversation, useOnlineUsers } from '@/hooks/useSocket';
import { socketClient, SocketEvents } from '@/lib/socket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipler
interface Konusma {
  id: string;
  tip: string;
  ad: string;
  resimUrl?: string;
  sonMesaj?: {
    icerik: string;
    gonderenAd: string;
    tarih: string;
  };
  okunmamis: number;
  uyeler: Array<{
    id: string;
    ad: string;
    rol: string;
    brans?: string;
    grupRol?: string;
    online?: boolean;
  }>;
  sabitle: boolean;
  seslesiz: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Mesaj {
  id: string;
  gonderenId: string;
  gonderenAd: string;
  gonderenRol?: string;
  icerik: string;
  dosyaUrl?: string;
  dosyaTip?: string;
  tarih: string;
  okundu: boolean;
  duzenlendi?: boolean;
}

interface AvailableUser {
  id: string;
  ad: string;
  soyad: string;
  rol: string;
  brans?: string;
  sinif?: string;
  sinifId?: string;
  sinifSeviye?: number;
  dersler?: string[];
}

interface GroupedUsers {
  [key: string]: AvailableUser[];
}

export default function OgrenciMesajlar() {
  // State
  const [konusmalar, setKonusmalar] = useState<Konusma[]>([]);
  const [seciliKonusma, setSeciliKonusma] = useState<Konusma | null>(null);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [aramaText, setAramaText] = useState('');
  const [showYeniKonusmaModal, setShowYeniKonusmaModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [yeniKonusmaTip, setYeniKonusmaTip] = useState<'ogretmen' | 'arkadas' | 'grup'>('ogretmen');
  const [showGrupProfil, setShowGrupProfil] = useState(false);
  const [yeniGrupAdi, setYeniGrupAdi] = useState('');
  const [yeniGrupUyeler, setYeniGrupUyeler] = useState<string[]>([]);
  const [showAdminWarning, setShowAdminWarning] = useState(false);
  const [selectedUye, setSelectedUye] = useState<any>(null);
  const [showUyeMenu, setShowUyeMenu] = useState(false);
  const [showProfilPanel, setShowProfilPanel] = useState(false);
  const [profilUye, setProfilUye] = useState<any>(null);
  const [showUyeEkleModal, setShowUyeEkleModal] = useState(false);
  const [secilenYeniUyeler, setSecilenYeniUyeler] = useState<string[]>([]);
  const [showMedyaModal, setShowMedyaModal] = useState(false);
  const [showSikayetModal, setShowSikayetModal] = useState(false);
  const [sikayetMesaj, setSikayetMesaj] = useState('');
  const [engellenenKullanicilar, setEngellenenKullanicilar] = useState<string[]>([]);

  // API Loading states
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [groupedUsers, setGroupedUsers] = useState<GroupedUsers>({});
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  
  // Current user
  const [currentUser, setCurrentUser] = useState<any>(null);

  const mesajListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageTimeRef = useRef<string | null>(null);
  const seciliKonusmaRef = useRef<Konusma | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔌 WebSocket Hook'ları
  const { isConnected } = useSocket();
  const { isUserOnline, onlineUserIds } = useOnlineUsers();
  const { typingUsers, sendTyping, sendStopTyping } = useConversation(seciliKonusma?.id || null);

  // seciliKonusma değiştiğinde ref'i de güncelle
  useEffect(() => {
    seciliKonusmaRef.current = seciliKonusma;
  }, [seciliKonusma]);

  // Token ve kullanıcı bilgisini al
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Kullanıcı bilgisini al
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Konuşmaları API'den çek
  const fetchConversations = useCallback(async (selectFirst: boolean = false) => {
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setKonusmalar(data.data);
        
        const currentSelected = seciliKonusmaRef.current;
        
        if (selectFirst && data.data.length > 0 && !currentSelected) {
          setSeciliKonusma(data.data[0]);
        } else if (currentSelected) {
          const updatedConv = data.data.find((c: Konusma) => c.id === currentSelected.id);
          if (updatedConv) {
            setSeciliKonusma(updatedConv);
          }
        }
      }
    } catch (error) {
      console.error('Konuşmalar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Mesajları API'den çek
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`${API_URL}/messages/conversations/${conversationId}/messages`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setMesajlar(data.data);
        if (data.data.length > 0) {
          lastMessageTimeRef.current = data.data[data.data.length - 1].tarih;
        }
      }
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
    }
  }, [getAuthHeaders]);

  // Yeni mesajları kontrol et (polling)
  const checkNewMessages = useCallback(async () => {
    if (!seciliKonusma || !lastMessageTimeRef.current) return;
    
    try {
      const response = await fetch(
        `${API_URL}/messages/conversations/${seciliKonusma.id}/messages/new?after=${encodeURIComponent(lastMessageTimeRef.current)}`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setMesajlar(prev => {
          const newMessages = data.data.filter(
            (nm: Mesaj) => !prev.some(pm => pm.id === nm.id)
          );
          if (newMessages.length > 0) {
            lastMessageTimeRef.current = newMessages[newMessages.length - 1].tarih;
            return [...prev, ...newMessages];
          }
          return prev;
        });
        fetchConversations();
      }
    } catch (error) {
      console.error('Yeni mesajlar kontrol edilemedi:', error);
    }
  }, [seciliKonusma, getAuthHeaders, fetchConversations]);

  // İlk yüklemede konuşmaları çek
  useEffect(() => {
    fetchConversations(true);
  }, [fetchConversations]);

  // Konuşma değiştiğinde mesajları çek
  useEffect(() => {
    if (seciliKonusma) {
      fetchMessages(seciliKonusma.id);
    }
  }, [seciliKonusma, fetchMessages]);

  // 🔌 WebSocket: Yeni mesajları dinle
  useEffect(() => {
    if (!seciliKonusma) return;

    // Konuşmaya katıl
    socketClient.joinConversation(seciliKonusma.id);

    // Yeni mesaj geldiğinde
    const handleNewMessage = (message: Mesaj) => {
      if (!seciliKonusmaRef.current) return;
      
      // Mesaj bu konuşmaya aitse ekle
      setMesajlar(prev => {
        // Duplicate kontrolü
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      lastMessageTimeRef.current = message.tarih;
      fetchConversations(); // Konuşma listesini güncelle
    };

    const cleanup = socketClient.on<Mesaj>(SocketEvents.MESSAGE_NEW, handleNewMessage);

    return () => {
      cleanup();
      socketClient.leaveConversation(seciliKonusma.id);
    };
  }, [seciliKonusma, fetchConversations]);

  // Mesaj listesini en alta kaydır
  useEffect(() => {
    if (mesajListRef.current) {
      mesajListRef.current.scrollTop = mesajListRef.current.scrollHeight;
    }
  }, [mesajlar]);

  // 🔌 Typing indicator gönder
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYeniMesaj(e.target.value);
    
    if (seciliKonusma && currentUser && e.target.value.trim()) {
      sendTyping(`${currentUser.ad} ${currentUser.soyad}`);
      
      // 2 saniye sonra typing durumunu kaldır
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping();
      }, 2000);
    }
  };

  // Mesaj gönder
  const handleMesajGonder = async () => {
    if (!yeniMesaj.trim() || !seciliKonusma || sendingMessage) return;

    // Typing durumunu hemen durdur
    sendStopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setSendingMessage(true);
    const mesajIcerik = yeniMesaj.trim();
    setYeniMesaj('');

    try {
      const response = await fetch(`${API_URL}/messages/conversations/${seciliKonusma.id}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ icerik: mesajIcerik })
      });
      
      const data = await response.json();
      if (data.success) {
        // WebSocket zaten mesajı broadcast edecek, ama response'u da ekleyelim
        setMesajlar(prev => {
          if (prev.some(m => m.id === data.data.id)) return prev;
          return [...prev, data.data];
        });
        lastMessageTimeRef.current = data.data.tarih;
        fetchConversations();
      } else {
        setYeniMesaj(mesajIcerik);
        alert('Mesaj gönderilemedi: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
      setYeniMesaj(mesajIcerik);
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSendingMessage(false);
      inputRef.current?.focus();
    }
  };

  // Kullanıcıları ara (yeni mesaj için)
  const searchUsers = useCallback(async (query: string, type: 'ogretmen' | 'ogrenci') => {
    setSearchingUsers(true);
    try {
      // Arkadaş araması için gruplanmış endpoint kullan
      if (type === 'ogrenci') {
        const params = new URLSearchParams({ grouped: 'true', type: 'ogrenci' });
        if (query.trim()) {
          params.append('search', query);
        }
        const response = await fetch(`${API_URL}/messages/users?${params}`, {
          headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success) {
          if (data.grouped) {
            setGroupedUsers(data.data);
            // Flat liste için tüm kullanıcıları birleştir
            const allUsers = Object.values(data.data).flat() as AvailableUser[];
            setAvailableUsers(allUsers);
            setTotalUsersCount(data.total || allUsers.length);
          } else {
            setAvailableUsers(data.data);
            setGroupedUsers({});
            setTotalUsersCount(data.total || data.data.length);
          }
        }
      } else {
        // Öğretmen araması için standart endpoint
        const params = new URLSearchParams({ type: 'personel' });
        if (query.trim()) {
          params.append('search', query);
        }
        const response = await fetch(`${API_URL}/messages/users?${params}`, {
          headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success) {
          // Öğretmen aramasında sadece öğretmenleri filtrele
          const teachers = data.data.filter((u: AvailableUser) => u.rol === 'ogretmen');
          setAvailableUsers(teachers);
          setGroupedUsers({});
          setTotalUsersCount(teachers.length);
        }
      }
    } catch (error) {
      console.error('Kullanıcılar aranamadı:', error);
    } finally {
      setSearchingUsers(false);
    }
  }, [getAuthHeaders]);

  // Yeni mesaj modalı açıldığında kullanıcıları yükle
  useEffect(() => {
    if (showYeniKonusmaModal) {
      if (yeniKonusmaTip === 'ogretmen') {
        searchUsers(userSearchQuery, 'ogretmen');
      } else if (yeniKonusmaTip === 'arkadas') {
        searchUsers(userSearchQuery, 'ogrenci');
      } else if (yeniKonusmaTip === 'grup') {
        // Grup için de tüm kullanıcıları yükle (öğrenciler)
        searchUsers(userSearchQuery, 'ogrenci');
      }
    }
  }, [showYeniKonusmaModal, yeniKonusmaTip, userSearchQuery, searchUsers]);

  // Yeni konuşma oluştur ve mesajlaşma başlat
  const handleStartConversation = async (targetUser: AvailableUser) => {
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          targetUserId: targetUser.id,
          tip: 'OZEL'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchConversations();
        
        const newConv: Konusma = {
          id: data.data.id,
          tip: data.data.tip,
          ad: data.data.ad,
          okunmamis: 0,
          uyeler: data.data.uyeler,
          sabitle: false,
          seslesiz: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setSeciliKonusma(newConv);
        setShowYeniKonusmaModal(false);
        setShowMobileSidebar(false);
        setUserSearchQuery('');
      }
    } catch (error) {
      console.error('Konuşma oluşturulamadı:', error);
      alert('Konuşma başlatılamadı. Lütfen tekrar deneyin.');
    }
  };

  // Yeni grup oluştur
  const handleCreateGroup = async () => {
    if (!yeniGrupAdi.trim() || yeniGrupUyeler.length === 0) return;

    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tip: 'OZEL_GRUP',
          ad: yeniGrupAdi.trim(),
          uyeIds: yeniGrupUyeler
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchConversations();
        setYeniGrupAdi('');
        setYeniGrupUyeler([]);
        setShowYeniKonusmaModal(false);
        alert('Grup başarıyla oluşturuldu!');
      }
    } catch (error) {
      console.error('Grup oluşturulamadı:', error);
      alert('Grup oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleMesajGonder();
    }
  };

  // Filtrelenmiş ve sıralanmış konuşmalar (en yeni mesaj en üstte)
  const filteredKonusmalar = konusmalar
    .filter(k => k.ad.toLowerCase().includes(aramaText.toLowerCase()))
    .sort((a, b) => {
      const tarihA = a.sonMesaj?.tarih ? new Date(a.sonMesaj.tarih) : new Date(a.updatedAt);
      const tarihB = b.sonMesaj?.tarih ? new Date(b.sonMesaj.tarih) : new Date(b.updatedAt);
      return tarihB.getTime() - tarihA.getTime();
    });

  // Sadece saat formatı (HH:mm)
  const formatSaat = (tarih: string) => {
    try {
      const date = new Date(tarih);
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Konuşma listesi için kısa tarih
  const formatTarih = (tarih: string) => {
    try {
      const date = new Date(tarih);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Dün';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('tr-TR', { weekday: 'long' });
      } else {
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  // Tarih ayracı için gün etiketi
  const getTarihAyrac = (tarih: string) => {
    try {
      const date = new Date(tarih);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Bugün';
      } else if (diffDays === 1) {
        return 'Dün';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('tr-TR', { weekday: 'long' });
      } else {
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  // Mesajları tarihe göre grupla
  const getMesajlarWithDateSeparators = () => {
    const result: Array<{ type: 'date' | 'message'; content: string | Mesaj }> = [];
    let lastDateKey = '';

    mesajlar.forEach((mesaj) => {
      const date = new Date(mesaj.tarih);
      const dateKey = date.toLocaleDateString('tr-TR');
      
      if (dateKey !== lastDateKey) {
        result.push({ type: 'date', content: getTarihAyrac(mesaj.tarih) });
        lastDateKey = dateKey;
      }
      result.push({ type: 'message', content: mesaj });
    });

    return result;
  };

  // Konuşma tipi ikonu
  const getKonusmaIcon = (tip: string) => {
    switch (tip) {
      case 'SINIF': return '📚';
      case 'OZEL_GRUP': return '👥';
      default: return null;
    }
  };

  // Kullanıcı grup yöneticisi mi kontrolü
  const isGrupYoneticisi = () => {
    if (!seciliKonusma || seciliKonusma.tip === 'OZEL' || !currentUser) return false;
    const member = seciliKonusma.uyeler.find(u => u.id === currentUser.id);
    return member?.grupRol === 'admin';
  };

  // Kullanıcıyla mesajlaşma başlat
  const handleUyeyleMesajlasma = async (uye: any) => {
    setShowUyeMenu(false);
    setShowProfilPanel(false);
    setShowGrupProfil(false);
    
    const mevcutKonusma = konusmalar.find(k => 
      k.tip === 'OZEL' && k.uyeler.some(u => u.ad === uye.ad)
    );

    if (mevcutKonusma) {
      setSeciliKonusma(mevcutKonusma);
      setShowMobileSidebar(false);
    } else {
      try {
        const response = await fetch(`${API_URL}/messages/conversations`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            targetUserId: uye.id,
            tip: 'OZEL'
          })
        });
        
        const data = await response.json();
        if (data.success) {
          await fetchConversations();
          const newConv: Konusma = {
            id: data.data.id,
            tip: data.data.tip,
            ad: data.data.ad,
            okunmamis: 0,
            uyeler: data.data.uyeler,
            sabitle: false,
            seslesiz: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setSeciliKonusma(newConv);
          setShowMobileSidebar(false);
        }
      } catch (error) {
        console.error('Konuşma oluşturulamadı:', error);
      }
    }
  };

  // Profil görüntüle
  const handleProfilGoruntule = (uye: any) => {
    setProfilUye(uye);
    setShowProfilPanel(true);
    setShowUyeMenu(false);
    setShowGrupProfil(false);
  };

  return (
    <div className="h-screen flex bg-[#FAFAFA]">
      {/* Sol Panel - Konuşmalar Listesi */}
      <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[360px] bg-white border-r border-[#EEEEEE]`}>
        {/* Header */}
        <div className="bg-white border-b border-[#EEEEEE]">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <h1 className="text-[23px] font-bold text-black tracking-tight">Mesajlar</h1>
              <button
                onClick={() => setShowYeniKonusmaModal(true)}
                className="w-10 h-10 rounded-full bg-[#27AE60] text-white flex items-center justify-center hover:bg-[#219653] transition-all shadow-lg shadow-[#27AE60]/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Arama */}
          <div className="px-4 py-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#676767]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Ara..."
                value={aramaText}
                onChange={(e) => setAramaText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#EEEEEE] rounded-xl text-sm text-black/85 placeholder:text-black/45 focus:outline-none focus:ring-2 focus:ring-[#27AE60]/30"
              />
            </div>
          </div>

          {/* Sıralama */}
          <div className="px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-black/65">Sırala</span>
            <button className="flex items-center gap-1 text-sm text-[#2D9CDB] font-medium">
              En Yeni
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Konuşmalar Listesi */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#27AE60]"></div>
              <span className="ml-2 text-black/45">Konuşmalar yükleniyor...</span>
            </div>
          ) : filteredKonusmalar.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-[#EEEEEE] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-black/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-black/45 text-center">Henüz konuşma yok</p>
              <button
                onClick={() => setShowYeniKonusmaModal(true)}
                className="mt-4 px-4 py-2 bg-[#27AE60] text-white rounded-lg text-sm font-medium hover:bg-[#219653] transition-colors"
              >
                Yeni Mesaj Başlat
              </button>
            </div>
          ) : filteredKonusmalar.map((konusma) => (
            <button
              key={konusma.id}
              onClick={() => {
                setSeciliKonusma(konusma);
                setShowMobileSidebar(false);
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                seciliKonusma?.id === konusma.id ? 'bg-[#FAFAFA]' : 'hover:bg-[#FAFAFA]'
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {konusma.resimUrl ? (
                  <img 
                    src={konusma.resimUrl} 
                    alt={konusma.ad}
                    className="w-[44px] h-[44px] rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-[44px] h-[44px] rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                    konusma.tip === 'SINIF' || konusma.tip === 'OZEL_GRUP'
                      ? 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
                      : 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                  }`}>
                    {getKonusmaIcon(konusma.tip) || konusma.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
                {/* 🔌 Real-time Online Durumu */}
                {konusma.tip === 'OZEL' && konusma.uyeler.some(u => u.id !== currentUser?.id && isUserOnline(u.id)) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#27AE60] rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* İçerik */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium text-sm text-black/85 truncate">{konusma.ad}</span>
                  <span className="text-xs text-black/65 flex-shrink-0">
                    {konusma.sonMesaj ? formatTarih(konusma.sonMesaj.tarih) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate pr-2 ${
                    konusma.okunmamis > 0 ? 'text-black/85 font-medium' : 'text-black/45'
                  }`}>
                    {konusma.sonMesaj?.icerik || 'Yeni sohbet'}
                  </p>
                  {konusma.okunmamis > 0 ? (
                    <span className="bg-[#27AE60] text-white text-[10px] font-medium rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center flex-shrink-0">
                      {konusma.okunmamis}
                    </span>
                  ) : (
                    <svg className="w-4 h-4 text-[#27AE60] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 6L4 17" strokeLinecap="round" strokeLinejoin="round" opacity={0.5}/>
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Geri Butonu (Mobil) */}
        <div className="p-3 border-t border-[#EEEEEE] md:hidden">
          <Link
            href="/ogrenci"
            className="flex items-center gap-2 text-sm text-black/65 hover:text-black/85 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Geri Dön
          </Link>
        </div>
      </div>

      {/* Sağ Panel - Mesaj Detay */}
      <div className={`${!showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1 relative`}>
        {seciliKonusma ? (
          <>
            {/* Konuşma Başlığı */}
            <div className="bg-white border-b border-[#EEEEEE] shadow-sm">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => setShowMobileSidebar(true)}
                    className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[#FAFAFA] transition-colors"
                  >
                    <svg className="w-5 h-5 text-black/65" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => seciliKonusma.tip !== 'OZEL' && setShowGrupProfil(true)}
                    className={`flex items-center gap-3 ${seciliKonusma.tip !== 'OZEL' ? 'hover:bg-[#FAFAFA] rounded-lg p-2 -m-2 transition-colors cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="relative">
                      {seciliKonusma.resimUrl ? (
                        <img 
                          src={seciliKonusma.resimUrl} 
                          alt={seciliKonusma.ad}
                          className="w-[42px] h-[42px] rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                          seciliKonusma.tip === 'SINIF' || seciliKonusma.tip === 'OZEL_GRUP'
                            ? 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
                            : 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                        }`}>
                          {getKonusmaIcon(seciliKonusma.tip) || seciliKonusma.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="font-medium text-base text-black/85 text-left">{seciliKonusma.ad}</h2>
                      <p className="text-sm text-left">
                        {seciliKonusma.tip !== 'OZEL' ? (
                          <span className="text-black/45">{seciliKonusma.uyeler.length} üye</span>
                        ) : (
                          <span className={seciliKonusma.uyeler[0]?.online ? 'text-[#27AE60]' : 'text-black/45'}>
                            {seciliKonusma.uyeler[0]?.online ? 'Çevrimiçi' : 'Çevrimdışı'}
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                </div>
                
                {/* Header Aksiyonları */}
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-[#FAFAFA] transition-colors text-black/45">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-lg hover:bg-[#FAFAFA] transition-colors text-black/45">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Mesajlar - Arkaplan Resimli */}
            <div 
              ref={mesajListRef}
              className="flex-1 overflow-y-auto relative bg-[#FAFAFA]"
            >
              {/* Arkaplan resmi */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url(/chat-backgrounds/speech-bubbles.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.12,
                }}
              ></div>
              
              {/* Mesaj içerikleri */}
              <div className="relative z-10 p-4 space-y-2">
                {getMesajlarWithDateSeparators().map((item, index) => {
                  // Tarih Ayracı
                  if (item.type === 'date') {
                    return (
                      <div key={`date-${index}`} className="flex justify-center py-2">
                        <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-lg text-xs font-medium text-black/60 shadow-sm">
                          {item.content as string}
                        </span>
                      </div>
                    );
                  }

                  // Mesaj
                  const mesaj = item.content as Mesaj;
                  const isBenimMesajim = currentUser?.id === mesaj.gonderenId;
                  return (
                    <div
                      key={mesaj.id}
                      className={`flex items-end gap-2 ${isBenimMesajim ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Avatar - Sadece gelen mesajlarda */}
                      {!isBenimMesajim && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3498DB] to-[#2980B9] flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                          {mesaj.gonderenAd.charAt(0)}
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[70%] px-3 py-2 ${
                          isBenimMesajim
                            ? 'bg-[#DCF8C6] rounded-[12px] rounded-br-[4px]'
                            : 'bg-white rounded-[12px] rounded-bl-[4px] shadow-sm'
                        }`}
                      >
                        {/* Grup mesajlarında gönderen adı */}
                        {seciliKonusma.tip !== 'OZEL' && !isBenimMesajim && (
                          <p className="text-xs font-semibold text-[#2D9CDB] mb-0.5">{mesaj.gonderenAd}</p>
                        )}
                        <div className="flex items-end gap-2">
                          <p className="text-[15px] text-black/90 whitespace-pre-wrap leading-relaxed">{mesaj.icerik}</p>
                          <div className="flex items-center gap-1 flex-shrink-0 -mb-0.5">
                            <span className="text-[11px] text-black/40">{formatSaat(mesaj.tarih)}</span>
                            {isBenimMesajim && (
                              mesaj.okundu 
                                ? <svg className="w-4 h-4 text-[#53BDEB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M15 6L4 17" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                : <svg className="w-4 h-4 text-black/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M15 6L4 17" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🔌 Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="px-4 py-2 bg-[#FAFAFA] border-t border-[#EEEEEE]">
                <div className="flex items-center gap-2 text-sm text-black/60">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#27AE60] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-[#27AE60] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-[#27AE60] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>
                    {typingUsers.map(u => u.userName).join(', ')} yazıyor...
                  </span>
                </div>
              </div>
            )}

            {/* Mesaj Gönderme */}
            <div className="bg-white border-t border-[#EEEEEE] shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
              <div className="px-4 py-3 flex items-center gap-3">
                <button className="p-2 rounded-lg hover:bg-[#FAFAFA] transition-colors text-black/45">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={yeniMesaj}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Mesajınızı yazın..."
                    className="w-full px-4 py-2.5 bg-[#FAFAFA] rounded-xl text-sm text-black/85 placeholder:text-black/45 focus:outline-none focus:ring-2 focus:ring-[#27AE60]/30 border border-[#EEEEEE]"
                  />
                </div>
                <button
                  onClick={handleMesajGonder}
                  disabled={!yeniMesaj.trim() || sendingMessage}
                  className="text-sm font-medium text-[#27AE60] hover:text-[#219653] transition-colors disabled:text-black/30 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                >
                  {sendingMessage ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-[#27AE60] border-t-transparent"></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    'Gönder'
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#27AE60]/20 to-[#27AE60]/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#27AE60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-black/85 mb-2">Konuşma Seçin</h3>
              <p className="text-sm text-black/45">Mesajlaşmaya başlamak için<br/>soldaki listeden bir kişi seçin</p>
            </div>
          </div>
        )}

        {/* Profil Görüntüleme Paneli */}
        {showProfilPanel && profilUye && (
          <div className="absolute top-0 right-0 w-full md:w-96 h-full bg-white shadow-2xl z-50 flex flex-col animate-slideIn">
            {/* Header */}
            <div className="p-4 flex items-center justify-between bg-white border-b border-[#EEEEEE]">
              <h3 className="text-lg font-bold text-black/85">Kişi Bilgisi</h3>
              <button
                onClick={() => setShowProfilPanel(false)}
                className="p-2 hover:bg-[#FAFAFA] rounded-lg transition-colors text-black/45"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profil Bilgileri */}
            <div className="flex-1 overflow-y-auto">
              {/* Profil Resmi ve İsim */}
              <div className="p-8 text-center bg-[#FAFAFA]">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4 ${
                  profilUye.rol === 'ogretmen' || profilUye.rol === 'Öğretmen'
                    ? 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                    : 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
                }`}>
                  {profilUye.ad.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold text-black/85 mb-1">{profilUye.ad}</h2>
                <p className="text-black/65 mb-2">{profilUye.rol || profilUye.brans || 'Öğrenci'}</p>
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${profilUye.online ? 'bg-[#27AE60]' : 'bg-black/30'}`}></div>
                  <span className={`text-sm ${profilUye.online ? 'text-[#27AE60]' : 'text-black/45'}`}>
                    {profilUye.online ? 'Çevrimiçi' : 'Çevrimdışı'}
                  </span>
                </div>
              </div>

              {/* İletişim Seçenekleri */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-black/85 mb-3">İletişim</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      handleUyeyleMesajlasma(profilUye);
                      setShowProfilPanel(false);
                    }}
                    className="w-full p-3 rounded-xl flex items-center gap-3 transition-all bg-[#27AE60]/10 hover:bg-[#27AE60]/20"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#27AE60]">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-black/85">Mesaj</p>
                      <p className="text-xs text-black/45">Mesaj gönder</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Diğer İşlemler */}
              <div className="p-4 border-t border-[#EEEEEE]">
                <h3 className="text-sm font-semibold text-black/85 mb-3">Diğer İşlemler</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      if (profilUye) {
                        const engelliMi = engellenenKullanicilar.includes(profilUye.ad);
                        if (engelliMi) {
                          setEngellenenKullanicilar(prev => prev.filter(ad => ad !== profilUye.ad));
                          alert(`${profilUye.ad} engeli kaldırıldı`);
                        } else {
                          setEngellenenKullanicilar(prev => [...prev, profilUye.ad]);
                          alert(`${profilUye.ad} engellendi`);
                        }
                      }
                    }}
                    className="w-full p-3 text-left hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3 text-[#E74C3C]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-sm font-medium">
                      {profilUye && engellenenKullanicilar.includes(profilUye.ad) ? 'Engeli Kaldır' : 'Engelle'}
                    </span>
                  </button>
                  <button 
                    onClick={() => setShowSikayetModal(true)}
                    className="w-full p-3 text-left hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3 text-[#E74C3C]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium">Şikayet Et</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Yeni Konuşma Modal */}
      {showYeniKonusmaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 bg-gradient-to-r from-[#27AE60] to-[#219653] text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">✉️ Yeni Mesaj</h3>
              <button
                onClick={() => setShowYeniKonusmaModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Tab Seçimi */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setYeniKonusmaTip('ogretmen')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  yeniKonusmaTip === 'ogretmen' 
                    ? 'text-[#27AE60] border-b-2 border-[#27AE60]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👨‍🏫 Öğretmen
              </button>
              <button
                onClick={() => setYeniKonusmaTip('arkadas')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  yeniKonusmaTip === 'arkadas' 
                    ? 'text-[#27AE60] border-b-2 border-[#27AE60]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👤 Arkadaş
              </button>
              <button
                onClick={() => setYeniKonusmaTip('grup')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  yeniKonusmaTip === 'grup' 
                    ? 'text-[#27AE60] border-b-2 border-[#27AE60]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👥 Yeni Grup
              </button>
            </div>

            <div className="p-4">
              {yeniKonusmaTip === 'grup' ? (
                // Yeni Grup Oluşturma
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grup Adı</label>
                    <input
                      type="text"
                      value={yeniGrupAdi}
                      onChange={(e) => setYeniGrupAdi(e.target.value)}
                      placeholder="Örn: Matematik Çalışma Grubu"
                      className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#27AE60]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Üyeler Seç ({yeniGrupUyeler.length} seçildi)
                    </label>
                    {/* Arama */}
                    <div className="relative mb-3">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                      <input
                        type="text"
                        placeholder="Üye ara..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#27AE60]"
                      />
                    </div>
                    <div className="space-y-1 max-h-[300px] overflow-y-auto border border-gray-100 rounded-xl p-2">
                      {searchingUsers ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#27AE60]"></div>
                          <span className="ml-2 text-gray-500 text-sm">Yükleniyor...</span>
                        </div>
                      ) : Object.keys(groupedUsers).length > 0 ? (
                        // Gruplanmış liste
                        Object.entries(groupedUsers).map(([groupName, users]) => (
                          <div key={groupName} className="mb-3">
                            <div className="sticky top-0 bg-white/95 py-1 px-2 text-xs font-semibold text-gray-500 flex items-center gap-1 border-b border-gray-100">
                              {groupName === 'Sınıf Arkadaşlarım' ? '🎓' : groupName === 'Öğretmenler' ? '👨‍🏫' : '📚'}
                              {groupName} ({users.length})
                            </div>
                            {users.map((user) => (
                              <label
                                key={user.id}
                                className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={yeniGrupUyeler.includes(user.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setYeniGrupUyeler([...yeniGrupUyeler, user.id]);
                                    } else {
                                      setYeniGrupUyeler(yeniGrupUyeler.filter(id => id !== user.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-[#27AE60] rounded"
                                />
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  user.rol === 'ogretmen'
                                    ? 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                                    : groupName === 'Sınıf Arkadaşlarım'
                                    ? 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
                                    : 'bg-gradient-to-br from-[#95a5a6] to-[#7f8c8d]'
                                }`}>
                                  {user.ad.charAt(0)}
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-gray-800 text-sm">{user.ad} {user.soyad}</p>
                                  <p className="text-xs text-gray-500">{user.brans || user.sinif || 'Öğrenci'}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        ))
                      ) : (
                        // Düz liste
                        availableUsers.map((user) => (
                          <label
                            key={user.id}
                            className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={yeniGrupUyeler.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setYeniGrupUyeler([...yeniGrupUyeler, user.id]);
                                } else {
                                  setYeniGrupUyeler(yeniGrupUyeler.filter(id => id !== user.id));
                                }
                              }}
                              className="w-4 h-4 text-[#27AE60] rounded"
                            />
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#27AE60] to-[#219653] flex items-center justify-center text-white font-bold text-sm">
                              {user.ad.charAt(0)}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-gray-800 text-sm">{user.ad} {user.soyad}</p>
                              <p className="text-xs text-gray-500">{user.brans || user.sinif || 'Öğrenci'}</p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    {/* Seçili üyeler özeti */}
                    {yeniGrupUyeler.length > 0 && (
                      <div className="mt-2 p-2 bg-[#27AE60]/10 rounded-lg">
                        <p className="text-xs text-[#27AE60] font-medium">
                          ✓ {yeniGrupUyeler.length} üye seçildi
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCreateGroup}
                    disabled={!yeniGrupAdi.trim() || yeniGrupUyeler.length === 0}
                    className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#27AE60] to-[#219653] text-white hover:shadow-lg"
                  >
                    ✓ Grubu Oluştur
                  </button>
                </div>
              ) : (
                <>
                  {/* Arama */}
                  <div className="relative mb-4">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                      type="text"
                      placeholder={yeniKonusmaTip === 'ogretmen' ? 'Öğretmen ara...' : 'Arkadaş ara...'}
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#27AE60]"
                    />
                  </div>

                  {/* Toplam sayı göster */}
                  {totalUsersCount > 0 && !searchingUsers && (
                    <div className="mb-3 text-xs text-gray-500 flex items-center justify-between">
                      <span>Toplam {totalUsersCount} kişi</span>
                      {yeniKonusmaTip === 'arkadas' && Object.keys(groupedUsers).length > 0 && (
                        <span className="text-[#27AE60]">✓ Sınıf bazlı gruplandı</span>
                      )}
                    </div>
                  )}

                  {/* Liste */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {searchingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#27AE60]"></div>
                        <span className="ml-2 text-gray-500">Yükleniyor...</span>
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Kullanıcı bulunamadı</p>
                      </div>
                    ) : yeniKonusmaTip === 'arkadas' && Object.keys(groupedUsers).length > 0 ? (
                      // Gruplanmış arkadaş listesi
                      Object.entries(groupedUsers).map(([groupName, users]) => (
                        <div key={groupName} className="mb-4">
                          {/* Grup Başlığı */}
                          <div className="sticky top-0 bg-white/95 backdrop-blur-sm py-2 px-1 mb-2 border-b border-gray-100 z-10">
                            <h4 className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                              {groupName === 'Sınıf Arkadaşlarım' ? (
                                <span className="text-[#27AE60]">🎓</span>
                              ) : groupName === 'Öğretmenler' ? (
                                <span className="text-[#3498DB]">👨‍🏫</span>
                              ) : groupName === 'Personel' ? (
                                <span className="text-[#9B59B6]">👤</span>
                              ) : (
                                <span className="text-[#F39C12]">📚</span>
                              )}
                              {groupName}
                              <span className="text-gray-400 font-normal">({users.length})</span>
                            </h4>
                          </div>
                          {/* Grup Üyeleri */}
                          <div className="space-y-1 pl-2">
                            {users.map((user) => (
                              <button
                                key={user.id}
                                onClick={() => handleStartConversation(user)}
                                className="w-full p-2.5 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-colors group"
                              >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  user.rol === 'ogretmen'
                                    ? 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                                    : groupName === 'Sınıf Arkadaşlarım'
                                    ? 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
                                    : 'bg-gradient-to-br from-[#95a5a6] to-[#7f8c8d]'
                                }`}>
                                  {user.ad.charAt(0)}
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-gray-800 text-sm group-hover:text-[#27AE60] transition-colors">
                                    {user.ad} {user.soyad}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {user.brans || user.sinif || 'Öğrenci'}
                                    {user.dersler && user.dersler.length > 0 && (
                                      <span className="text-gray-400 ml-1">
                                        • {user.dersler.slice(0, 2).join(', ')}
                                        {user.dersler.length > 2 && `...`}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <svg className="w-4 h-4 text-gray-300 group-hover:text-[#27AE60] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      // Standart liste (öğretmenler için)
                      availableUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleStartConversation(user)}
                          className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold ${
                            user.rol === 'ogretmen'
                              ? 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                              : 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
                          }`}>
                            {user.ad.charAt(0)}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-800">{user.ad} {user.soyad}</p>
                            <p className="text-xs text-gray-500">{user.brans || user.sinif || 'Öğrenci'}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grup Profil Modal */}
      {showGrupProfil && seciliKonusma && seciliKonusma.tip !== 'OZEL' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-gradient-to-r from-[#27AE60] to-[#219653] text-white">
              <h3 className="text-lg font-bold">Grup Bilgileri</h3>
              <button
                onClick={() => setShowGrupProfil(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Grup Avatar ve İsim */}
            <div className="p-6 text-center border-b border-gray-200">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#27AE60] to-[#219653] flex items-center justify-center text-white text-4xl font-bold mb-4">
                👥
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">{seciliKonusma.ad}</h2>
              <p className="text-sm text-gray-500">Grup • {seciliKonusma.uyeler.length} üye</p>
            </div>

            {/* Üyeler Listesi */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  👥 Grup Üyeleri ({seciliKonusma.uyeler.length})
                </h3>
                <div className="space-y-2">
                  {seciliKonusma.uyeler.map((uye, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedUye(uye);
                        setShowUyeMenu(true);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                        uye.rol === 'ogretmen' || uye.rol === 'Öğretmen'
                          ? 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                          : 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
                      }`}>
                        {uye.ad.charAt(0)}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-800 flex items-center gap-2">
                          {uye.ad}
                          {uye.grupRol === 'admin' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Yönetici</span>}
                        </p>
                        <p className="text-xs text-gray-500">{uye.rol || uye.brans || 'Öğrenci'}</p>
                      </div>
                      {uye.online && (
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Üye Menüsü Modal */}
      {showUyeMenu && selectedUye && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            {/* Üye Bilgisi */}
            <div className="p-6 text-center bg-gradient-to-br from-[#27AE60]/10 to-[#219653]/10">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 ${
                selectedUye.rol === 'ogretmen' || selectedUye.rol === 'Öğretmen'
                  ? 'bg-gradient-to-br from-[#3498DB] to-[#2980B9]'
                  : 'bg-gradient-to-br from-[#27AE60] to-[#219653]'
              }`}>
                {selectedUye.ad.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{selectedUye.ad}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedUye.rol || selectedUye.brans || 'Öğrenci'}</p>
              {selectedUye.grupRol === 'admin' && (
                <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                  👑 Yönetici
                </span>
              )}
            </div>

            {/* İşlem Menüsü */}
            <div className="p-4">
              <div className="space-y-2">
                <button 
                  onClick={() => handleProfilGoruntule(selectedUye)}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-[#27AE60]/10 rounded-full flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Üyeyi Görüntüle</span>
                </button>

                <button 
                  onClick={() => handleUyeyleMesajlasma(selectedUye)}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-[#27AE60]/10 rounded-full flex items-center justify-center">
                    <span className="text-lg">💬</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Mesaj Gönder</span>
                </button>
              </div>

              <button
                onClick={() => setShowUyeMenu(false)}
                className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Şikayet Modal */}
      {showSikayetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-4 bg-red-600 text-white">
              <h3 className="text-lg font-bold">Kullanıcıyı Şikayet Et</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
                <span className="text-xl">ℹ️</span>
                <p className="text-sm text-yellow-800">
                  Şikayetiniz danışman öğretmeninize iletilecektir. Lütfen durumu detaylı bir şekilde açıklayın.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şikayet Edilen: <span className="font-bold">{profilUye?.ad}</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şikayet Nedeni</label>
                <textarea
                  value={sikayetMesaj}
                  onChange={(e) => setSikayetMesaj(e.target.value)}
                  placeholder="Şikayetinizi detaylı olarak yazın..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSikayetModal(false);
                    setSikayetMesaj('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    if (sikayetMesaj.trim()) {
                      alert(`Şikayetiniz danışman öğretmeninize iletildi.\n\nŞikayet Edilen: ${profilUye?.ad}\nMesaj: ${sikayetMesaj}`);
                      setShowSikayetModal(false);
                      setSikayetMesaj('');
                      setShowProfilPanel(false);
                    }
                  }}
                  disabled={!sikayetMesaj.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    sikayetMesaj.trim()
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Şikayet Et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
