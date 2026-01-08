'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Plus,
  Send,
  Paperclip,
  MoreVertical,
  Check,
  CheckCheck,
  Phone,
  X,
  Users,
  User,
  GraduationCap,
  Loader2,
  Home,
  MessageSquare,
  CreditCard,
  BarChart3,
  Megaphone,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';

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
}

// Sidebar menü öğeleri
const menuItems = [
  { id: 'ana-sayfa', label: 'Ana Sayfa', icon: Home, href: '/veli', color: 'from-purple-500 to-purple-600' },
  { id: 'mesajlar', label: 'Mesajlar', icon: MessageSquare, href: '/veli/mesajlar', color: 'from-indigo-500 to-indigo-600' },
  { id: 'deneme-sonuclari', label: 'Deneme Sonuçları', icon: GraduationCap, href: '/veli/deneme-sonuclari', color: 'from-blue-500 to-blue-600' },
  { id: 'odemeler', label: 'Ödemeler', icon: CreditCard, href: '/veli/odemeler', color: 'from-emerald-500 to-emerald-600' },
  { id: 'karsilastir', label: 'Karşılaştır', icon: BarChart3, href: '/veli/karsilastir', color: 'from-amber-500 to-amber-600' },
  { id: 'duyurular', label: 'Duyurular', icon: Megaphone, href: '/veli/duyurular', color: 'from-pink-500 to-pink-600' },
];

function VeliMesajlarContent() {
  const { user, token, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const { speak, stop, ttsEnabled } = useAccessibility();
  const isDark = resolvedTheme === 'dark';

  // TTS yardımcı fonksiyonu
  const ttsHandlers = useCallback((text: string) => ({
    onMouseEnter: () => ttsEnabled && speak(text),
    onMouseLeave: () => stop(),
    onFocus: () => ttsEnabled && speak(text),
    onBlur: () => stop(),
    tabIndex: 0,
    'aria-label': text,
  }), [ttsEnabled, speak, stop]);

  // State
  const [konusmalar, setKonusmalar] = useState<Konusma[]>([]);
  const [seciliKonusma, setSeciliKonusma] = useState<Konusma | null>(null);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [aramaText, setAramaText] = useState('');
  const [showYeniMesajModal, setShowYeniMesajModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [showProfilPanel, setShowProfilPanel] = useState(false);
  const [profilUye, setProfilUye] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // API Loading states
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Current user
  const [currentUser, setCurrentUser] = useState<any>(null);

  const mesajListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimeRef = useRef<string | null>(null);
  const seciliKonusmaRef = useRef<Konusma | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // seciliKonusma değiştiğinde ref'i de güncelle
  useEffect(() => {
    seciliKonusmaRef.current = seciliKonusma;
  }, [seciliKonusma]);

  // Token ve kullanıcı bilgisini al
  const getAuthHeaders = useCallback(() => {
    const authToken = token || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };
  }, [token]);

  // Kullanıcı bilgisini al
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Profile menu dışına tıklama
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Polling başlat/durdur
  useEffect(() => {
    if (seciliKonusma) {
      pollingRef.current = setInterval(checkNewMessages, 3000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [seciliKonusma, checkNewMessages]);

  // Mesaj listesini en alta kaydır
  useEffect(() => {
    if (mesajListRef.current) {
      mesajListRef.current.scrollTop = mesajListRef.current.scrollHeight;
    }
  }, [mesajlar]);

  // Mesaj gönder
  const handleMesajGonder = async () => {
    if (!yeniMesaj.trim() || !seciliKonusma || sendingMessage) return;

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
        // Duplicate kontrolü ile mesajı ekle
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

  // Kullanıcıları ara (yeni mesaj için - sadece öğretmenler)
  const searchUsers = useCallback(async (query: string) => {
    setSearchingUsers(true);
    try {
      const params = new URLSearchParams({ type: 'personel' });
      if (query.trim()) {
        params.append('search', query);
      }
      const response = await fetch(`${API_URL}/messages/users?${params}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        // Sadece öğretmenleri filtrele
        const teachers = data.data.filter((u: AvailableUser) => u.rol === 'ogretmen');
        setAvailableUsers(teachers);
      }
    } catch (error) {
      console.error('Kullanıcılar aranamadı:', error);
    } finally {
      setSearchingUsers(false);
    }
  }, [getAuthHeaders]);

  // Yeni mesaj modalı açıldığında kullanıcıları yükle
  useEffect(() => {
    if (showYeniMesajModal) {
      searchUsers(userSearchQuery);
    }
  }, [showYeniMesajModal, userSearchQuery, searchUsers]);

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
        setShowYeniMesajModal(false);
        setShowMobileSidebar(false);
        setUserSearchQuery('');
      }
    } catch (error) {
      console.error('Konuşma oluşturulamadı:', error);
      alert('Konuşma başlatılamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleMesajGonder();
    }
  };

  // Filtrelenmiş ve sıralanmış konuşmalar
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

  // Profil görüntüle
  const handleProfilGoruntule = (uye: any) => {
    setProfilUye(uye);
    setShowProfilPanel(true);
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-slate-50 via-white to-purple-50'} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center animate-pulse">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-slate-50 via-white to-purple-50/30'}`}>
      {/* Mobile Nav Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <aside className={`fixed top-0 left-0 h-full ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200/80'} border-r z-50 transition-all duration-300 shadow-xl lg:shadow-none
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarOpen ? 'w-64' : 'w-20'}
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center justify-between px-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
          <Link href="/veli" className="flex items-center gap-3">
            <img
              src={isDark ? "/logos/Edura-logo-dark-2.png" : "/logos/Edura-logo-nobg.png"}
              alt="Edura Logo"
              className="w-10 h-10 object-contain"
            />
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Edura</h1>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium -mt-0.5`}>Veli Portalı</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className={`p-1.5 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-lg lg:hidden`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-lg hidden lg:block`}
          >
            <Menu className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === 'mesajlar';
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative
                  ${active
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all
                  ${active
                    ? 'bg-white/20'
                    : `bg-gradient-to-br ${item.color} text-white shadow-md group-hover:shadow-lg`
                  }
                `}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                {sidebarOpen && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </Link>
            );
          })}

          {/* Ayarlar */}
          <div className={`pt-4 mt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
            <Link
              href="/veli/ayarlar"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                ${isDark
                  ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all
                ${isDark
                  ? 'bg-slate-700 text-slate-300 shadow-md group-hover:shadow-lg'
                  : 'bg-slate-200 text-slate-600 shadow-md group-hover:shadow-lg'
                }
              `}>
                <Settings className="w-4.5 h-4.5" />
              </div>
              {sidebarOpen && (
                <span className="font-medium text-sm">Ayarlar</span>
              )}
            </Link>
          </div>
        </nav>

        {/* User Profile - Bottom */}
        {sidebarOpen && (
          <div className={`absolute bottom-0 left-0 right-0 p-3 border-t ${isDark ? 'border-slate-700/50 bg-[#1a1f2e]' : 'border-slate-100 bg-white'}`}>
            <div className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user?.ad?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{user?.ad} {user?.soyad}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>Veli</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Top Header */}
        <header className={`sticky top-0 z-30 ${isDark ? 'bg-[#1a1f2e]/80 border-slate-700/50' : 'bg-white/80 border-slate-200/80'} backdrop-blur-md border-b`}>
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Left - Mobile Menu */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className={`p-2 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-xl lg:hidden`}
              >
                <Menu className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </button>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Mesajlar</h2>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <LanguageSelector variant={isDark ? 'dark' : 'light'} />
              <ThemeToggle />

              <button
                className={`relative p-2.5 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'} rounded-xl transition-colors`}
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 p-1.5 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-xl transition-colors ml-1`}
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {user?.ad?.charAt(0)}
                  </div>
                  <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-400'} hidden sm:block transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className={`absolute right-0 top-14 w-64 ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} border rounded-2xl shadow-xl z-50 overflow-hidden`}>
                    <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                      <p className="font-semibold">{user?.ad} {user?.soyad}</p>
                      <p className="text-sm text-white/80">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/veli/ayarlar"
                        onClick={() => setShowProfileMenu(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-800/50' : 'text-slate-700 hover:bg-slate-50'} rounded-xl transition-colors`}
                      >
                        <Settings className="w-4 h-4" />
                        Hesap Ayarları
                      </Link>
                      <hr className={`my-2 ${isDark ? 'border-slate-700/50' : ''}`} />
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'} rounded-xl transition-colors`}
                      >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="h-[calc(100vh-4rem)] flex">
          {/* Konuşmalar Listesi */}
          <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} border-r flex-shrink-0`}>
            {/* Arama ve Yeni Mesaj */}
            <div className={`p-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    placeholder="Konuşma ara..."
                    value={aramaText}
                    onChange={(e) => setAramaText(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-500'} border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>
                <button
                  onClick={() => setShowYeniMesajModal(true)}
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-lg transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Konuşmalar Listesi */}
            <div className="flex-1 overflow-y-auto">
              {filteredKonusmalar.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center mb-4`}>
                    <MessageSquare className={`w-8 h-8 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  </div>
                  <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Henüz konuşma yok</p>
                  <button
                    onClick={() => setShowYeniMesajModal(true)}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
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
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${seciliKonusma?.id === konusma.id
                    ? isDark ? 'bg-slate-800/50' : 'bg-purple-50'
                    : isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {konusma.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    {konusma.tip === 'OZEL' && konusma.uyeler[0]?.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* İçerik */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{konusma.ad}</span>
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} flex-shrink-0`}>
                        {konusma.sonMesaj ? formatTarih(konusma.sonMesaj.tarih) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate pr-2 ${konusma.okunmamis > 0
                        ? isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'
                        : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                        {konusma.sonMesaj?.icerik || 'Yeni sohbet'}
                      </p>
                      {konusma.okunmamis > 0 && (
                        <span className="bg-purple-500 text-white text-[10px] font-medium rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center flex-shrink-0">
                          {konusma.okunmamis}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mesaj Alanı */}
          <div className={`${!showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1 relative`}>
            {seciliKonusma ? (
              <>
                {/* Konuşma Başlığı */}
                <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} border-b px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileSidebar(true)}
                      className={`md:hidden p-2 -ml-2 rounded-xl ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
                    >
                      <ArrowLeft size={20} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
                    </button>
                    <button
                      onClick={() => handleProfilGoruntule(seciliKonusma.uyeler[0])}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {seciliKonusma.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="text-left">
                        <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{seciliKonusma.ad}</h2>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {seciliKonusma.uyeler[0]?.brans || 'Öğretmen'}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Mesajlar */}
                <div
                  ref={mesajListRef}
                  className={`flex-1 overflow-y-auto p-4 ${isDark ? 'bg-[#0f1419]' : 'bg-slate-50'}`}
                >
                  <div className="space-y-3 max-w-3xl mx-auto">
                    {getMesajlarWithDateSeparators().map((item, index) => {
                      // Tarih Ayracı
                      if (item.type === 'date') {
                        return (
                          <div key={`date-${index}`} className="flex justify-center py-2">
                            <span className={`px-3 py-1 ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'} rounded-full text-xs font-medium shadow-sm`}>
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
                          className={`flex ${isBenimMesajim ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2.5 ${isBenimMesajim
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl rounded-br-md'
                              : isDark
                                ? 'bg-slate-800 text-white rounded-2xl rounded-bl-md'
                                : 'bg-white text-slate-900 rounded-2xl rounded-bl-md shadow-sm'
                              }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{mesaj.icerik}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1`}>
                              <span className={`text-[10px] ${isBenimMesajim ? 'text-white/70' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {formatSaat(mesaj.tarih)}
                              </span>
                              {isBenimMesajim && (
                                mesaj.okundu
                                  ? <CheckCheck size={14} className="text-white/70" />
                                  : <Check size={14} className="text-white/70" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mesaj Gönderme */}
                <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} border-t p-4`}>
                  <div className="flex items-center gap-3 max-w-3xl mx-auto">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={yeniMesaj}
                        onChange={(e) => setYeniMesaj(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Mesajınızı yazın..."
                        className={`w-full px-4 py-3 ${isDark
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-500'
                          } border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      />
                    </div>
                    <button
                      onClick={handleMesajGonder}
                      disabled={!yeniMesaj.trim() || sendingMessage}
                      className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className={`flex-1 flex items-center justify-center ${isDark ? 'bg-[#0f1419]' : 'bg-slate-50'}`}>
                <div className="text-center">
                  <div className={`w-24 h-24 mx-auto mb-6 rounded-full ${isDark ? 'bg-slate-800' : 'bg-purple-100'} flex items-center justify-center`}>
                    <MessageSquare className={`w-12 h-12 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                  </div>
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Mesajlaşmaya Başlayın</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-4`}>
                    Çocuğunuzun öğretmenleriyle iletişim kurun
                  </p>
                  <button
                    onClick={() => setShowYeniMesajModal(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
                  >
                    Yeni Mesaj Başlat
                  </button>
                </div>
              </div>
            )}

            {/* Profil Paneli */}
            {showProfilPanel && profilUye && (
              <div className={`absolute top-0 right-0 w-full md:w-80 h-full ${isDark ? 'bg-[#1a1f2e]' : 'bg-white'} shadow-2xl z-50 flex flex-col`}>
                <div className={`p-4 ${isDark ? 'border-slate-700/50' : 'border-slate-200'} border-b flex items-center justify-between`}>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Kişi Bilgisi</h3>
                  <button
                    onClick={() => setShowProfilPanel(false)}
                    className={`p-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} rounded-xl transition-colors`}
                  >
                    <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className={`p-8 text-center ${isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                    <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                      {profilUye.ad?.charAt(0) || '?'}
                    </div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>{profilUye.ad}</h2>
                    <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{profilUye.brans || profilUye.rol || 'Öğretmen'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yeni Mesaj Modal */}
      {showYeniMesajModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className={`${isDark ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden`}>
            <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white flex justify-between items-center">
              <h3 className="text-lg font-semibold">Yeni Mesaj</h3>
              <button
                onClick={() => setShowYeniMesajModal(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-4`}>
                Çocuğunuzun öğretmenleriyle mesajlaşmak için bir öğretmen seçin
              </p>

              {/* Arama */}
              <div className="relative mb-4">
                <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Öğretmen ara..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 ${isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-500'
                    } border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>

              {/* Öğretmen Listesi */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {searchingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    <span className={`ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Yükleniyor...</span>
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Öğretmen bulunamadı</p>
                  </div>
                ) : (
                  availableUsers.map((teacher) => (
                    <button
                      key={teacher.id}
                      onClick={() => handleStartConversation(teacher)}
                      className={`w-full p-3 flex items-center gap-3 ${isDark
                        ? 'hover:bg-slate-800'
                        : 'hover:bg-slate-50'
                        } rounded-xl transition-colors`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {teacher.ad.charAt(0)}{teacher.soyad?.charAt(0) || ''}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {teacher.ad} {teacher.soyad}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {teacher.brans || 'Öğretmen'}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ana export - RoleGuard ile sarmalanmış
export default function VeliMesajlar() {
  return (
    <RoleGuard allowedRoles={['veli']}>
      <VeliMesajlarContent />
    </RoleGuard>
  );
}
