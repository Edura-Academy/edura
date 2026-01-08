'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Plus,
  Paperclip,
  MoreVertical,
  CheckCheck,
  Phone,
  X,
  Users,
  User,
  GraduationCap,
  Loader2,
  Home,
  UserPlus,
  CreditCard,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  MessageSquare,
  Bell,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipler
interface Konusma {
  id: string;
  tip: string;
  ad: string;
  resimUrl?: string;
  sonMesaj?: { icerik: string; gonderenAd: string; tarih: string; };
  okunmamis: number;
  uyeler: Array<{ id: string; ad: string; rol: string; brans?: string; grupRol?: string; online?: boolean; }>;
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
}

// Sidebar menü öğeleri
const menuItems = [
  { id: 'anasayfa', href: '/sekreter', icon: Home, label: 'Ana Sayfa' },
  { id: 'kayit', href: '/sekreter/kayit', icon: UserPlus, label: 'Öğrenci Kayıt' },
  { id: 'yoklama', href: '/sekreter/yoklama', icon: ClipboardList, label: 'Yoklama' },
  { id: 'odeme', href: '/sekreter/odeme', icon: CreditCard, label: 'Ödemeler' },
  { id: 'belgeler', href: '/sekreter/belgeler', icon: FileText, label: 'Belgeler' },
  { id: 'mesajlar', href: '/sekreter/mesajlar', icon: MessageSquare, label: 'Mesajlar' },
  { id: 'ayarlar', href: '/sekreter/ayarlar', icon: Settings, label: 'Ayarlar' },
];

export default function MesajlarPage() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isDark = theme === 'dark';

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Mesaj state'leri
  const [konusmalar, setKonusmalar] = useState<Konusma[]>([]);
  const [seciliKonusma, setSeciliKonusma] = useState<Konusma | null>(null);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [aramaText, setAramaText] = useState('');
  const [showYeniMesajModal, setShowYeniMesajModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [filterType, setFilterType] = useState<'hepsi' | 'okunmamis' | 'gruplar'>('hepsi');
  const [yeniMesajTip, setYeniMesajTip] = useState<'personel' | 'ogrenci' | 'grup'>('personel');
  const [showGrupProfil, setShowGrupProfil] = useState(false);
  const [yeniGrupAdi, setYeniGrupAdi] = useState('');
  const [yeniGrupUyeler, setYeniGrupUyeler] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUye, setSelectedUye] = useState<any>(null);
  const [showUyeMenu, setShowUyeMenu] = useState(false);

  const mesajListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimeRef = useRef<string | null>(null);
  const seciliKonusmaRef = useRef<Konusma | null>(null);

  useEffect(() => {
    seciliKonusmaRef.current = seciliKonusma;
  }, [seciliKonusma]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
  }, []);

  const fetchConversations = useCallback(async (selectFirst: boolean = false) => {
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (data.success) {
        setKonusmalar(data.data);
        const currentSelected = seciliKonusmaRef.current;
        if (selectFirst && data.data.length > 0 && !currentSelected) {
          setSeciliKonusma(data.data[0]);
        } else if (currentSelected) {
          const updatedConv = data.data.find((c: Konusma) => c.id === currentSelected.id);
          if (updatedConv) setSeciliKonusma(updatedConv);
        }
      }
    } catch (error) {
      console.error('Konuşmalar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`${API_URL}/messages/conversations/${conversationId}/messages`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (data.success) {
        setMesajlar(data.data);
        if (data.data.length > 0) lastMessageTimeRef.current = data.data[data.data.length - 1].tarih;
      }
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
    }
  }, [getAuthHeaders]);

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
          const newMessages = data.data.filter((nm: Mesaj) => !prev.some(pm => pm.id === nm.id));
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

  useEffect(() => { fetchConversations(true); }, [fetchConversations]);

  useEffect(() => {
    if (seciliKonusma) fetchMessages(seciliKonusma.id);
  }, [seciliKonusma, fetchMessages]);

  useEffect(() => {
    if (seciliKonusma) pollingRef.current = setInterval(checkNewMessages, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [seciliKonusma, checkNewMessages]);

  useEffect(() => {
    if (mesajListRef.current) mesajListRef.current.scrollTop = mesajListRef.current.scrollHeight;
  }, [mesajlar]);

  const handleMesajGonder = async () => {
    if (!yeniMesaj.trim() || !seciliKonusma || sendingMessage) return;
    setSendingMessage(true);
    const mesajIcerik = yeniMesaj.trim();
    setYeniMesaj('');

    try {
      const response = await fetch(`${API_URL}/messages/conversations/${seciliKonusma.id}/messages`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ icerik: mesajIcerik })
      });
      const data = await response.json();
      if (data.success) {
        setMesajlar(prev => [...prev, data.data]);
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

  const searchUsers = useCallback(async (query: string, type: 'personel' | 'ogrenci') => {
    setSearchingUsers(true);
    try {
      const params = new URLSearchParams({ type });
      if (query.trim()) params.append('search', query);
      const response = await fetch(`${API_URL}/messages/users?${params}`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (data.success) setAvailableUsers(data.data);
    } catch (error) {
      console.error('Kullanıcılar aranamadı:', error);
    } finally {
      setSearchingUsers(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (showYeniMesajModal && yeniMesajTip !== 'grup') searchUsers(userSearchQuery, yeniMesajTip);
  }, [showYeniMesajModal, yeniMesajTip, userSearchQuery, searchUsers]);

  const handleStartConversation = async (targetUser: AvailableUser) => {
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ targetUserId: targetUser.id, tip: 'OZEL' })
      });
      const data = await response.json();
      if (data.success) {
        await fetchConversations();
        const newConv: Konusma = {
          id: data.data.id, tip: data.data.tip, ad: data.data.ad, okunmamis: 0, uyeler: data.data.uyeler,
          sabitle: false, seslesiz: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
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

  const handleCreateGroup = async () => {
    if (!yeniGrupAdi.trim() || yeniGrupUyeler.length === 0) return;
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ tip: 'OZEL_GRUP', ad: yeniGrupAdi.trim(), uyeIds: yeniGrupUyeler })
      });
      const data = await response.json();
      if (data.success) {
        await fetchConversations();
        setYeniGrupAdi('');
        setYeniGrupUyeler([]);
        setShowYeniMesajModal(false);
        alert('Grup başarıyla oluşturuldu!');
      }
    } catch (error) {
      console.error('Grup oluşturulamadı:', error);
      alert('Grup oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleMesajGonder(); }
  };

  const filteredKonusmalar = konusmalar
    .filter(k => {
      if (aramaText && !k.ad.toLowerCase().includes(aramaText.toLowerCase())) return false;
      if (filterType === 'okunmamis' && k.okunmamis === 0) return false;
      if (filterType === 'gruplar' && k.tip === 'OZEL') return false;
      return true;
    })
    .sort((a, b) => {
      const tarihA = a.sonMesaj?.tarih ? new Date(a.sonMesaj.tarih) : new Date(a.updatedAt);
      const tarihB = b.sonMesaj?.tarih ? new Date(b.sonMesaj.tarih) : new Date(b.updatedAt);
      return tarihB.getTime() - tarihA.getTime();
    });

  const formatSaat = (tarih: string) => {
    try { return new Date(tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const formatTarih = (tarih: string) => {
    try {
      const date = new Date(tarih);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      if (diffDays === 1) return 'Dün';
      if (diffDays < 7) return date.toLocaleDateString('tr-TR', { weekday: 'long' });
      return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return ''; }
  };

  const getTarihAyrac = (tarih: string) => {
    try {
      const date = new Date(tarih);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Bugün';
      if (diffDays === 1) return 'Dün';
      if (diffDays < 7) return date.toLocaleDateString('tr-TR', { weekday: 'long' });
      return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return ''; }
  };

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

  const getKonusmaIcon = (tip: string) => {
    switch (tip) {
      case 'OGRETMEN': return '👨‍🏫';
      case 'PERSONEL': return '🏫';
      case 'SINIF': return '📚';
      case 'OZEL_GRUP': return '👥';
      default: return null;
    }
  };

  const isGrupYoneticisi = () => {
    if (!seciliKonusma || seciliKonusma.tip === 'OZEL' || !currentUser) return false;
    const currentUserName = `${currentUser.ad} ${currentUser.soyad}`;
    const member = seciliKonusma.uyeler.find(u => u.ad === currentUserName);
    return member?.grupRol === 'admin' || currentUser.role === 'mudur';
  };

  // Renk sınıfları
  const bgMain = isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-rose-50 via-white to-pink-50';
  const bgCard = isDark ? 'bg-[#1a1f2e]' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700/50' : 'border-gray-200';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50';
  const accentColor = 'text-rose-500';
  const accentBg = 'bg-rose-500';
  const accentHover = 'hover:bg-rose-600';

  return (
    <RoleGuard allowedRoles={['sekreter']}>
      <div className={`min-h-screen ${bgMain}`}>
        {/* Sidebar */}
        <aside className={`fixed left-0 top-0 h-full ${sidebarCollapsed ? 'w-20' : 'w-64'} ${bgCard} border-r ${borderColor} z-40 transition-all duration-300 hidden lg:flex flex-col`}>
          {/* Logo */}
          <div className={`h-16 flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-6'} border-b ${borderColor}`}>
            {sidebarCollapsed ? (
              <div className={`w-10 h-10 rounded-xl ${accentBg} flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">E</span>
              </div>
            ) : (
              <Link href="/sekreter" className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${accentBg} flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className={`text-xl font-bold ${textPrimary}`}>Edura</span>
              </Link>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.includes(item.href) && (item.href !== '/sekreter' || pathname === '/tr/sekreter' || pathname === '/en/sekreter');
              return (
                <Link key={item.id} href={item.href}
                  className={`flex items-center gap-3 mx-3 px-3 py-3 rounded-xl transition-all ${isActive ? `${accentBg} text-white shadow-lg shadow-rose-500/25` : `${textSecondary} ${hoverBg}`} ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon size={20} />
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Collapse button */}
          <div className={`p-4 border-t ${borderColor}`}>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg ${hoverBg} ${textSecondary}`}
            >
              <Menu size={20} />
              {!sidebarCollapsed && <span className="text-sm">Daralt</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className={`${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          {/* Header */}
          <header className={`sticky top-0 z-30 ${bgCard} border-b ${borderColor} backdrop-blur-xl bg-opacity-90`}>
            <div className="h-16 px-4 lg:px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setShowMobileMenu(true)} className={`lg:hidden p-2 rounded-lg ${hoverBg}`}>
                  <Menu size={20} className={textSecondary} />
                </button>
                <h1 className={`text-xl font-bold ${textPrimary}`}>Mesajlar</h1>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <button className={`p-2 rounded-lg ${hoverBg} relative`}>
                  <Bell size={20} className={textSecondary} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                </button>
                <div className="relative">
                  <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className={`flex items-center gap-2 p-2 rounded-lg ${hoverBg}`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${accentBg} flex items-center justify-center text-white text-sm font-medium`}>
                      {user?.ad?.[0]}{user?.soyad?.[0]}
                    </div>
                    <ChevronDown size={16} className={textSecondary} />
                  </button>
                  {showProfileMenu && (
                    <div className={`absolute right-0 mt-2 w-48 ${bgCard} rounded-xl shadow-xl border ${borderColor} py-2`}>
                      <div className={`px-4 py-2 border-b ${borderColor}`}>
                        <p className={`font-medium ${textPrimary}`}>{user?.ad} {user?.soyad}</p>
                        <p className={`text-sm ${textSecondary}`}>Sekreter</p>
                      </div>
                      <Link href="/sekreter/ayarlar" className={`flex items-center gap-2 px-4 py-2 ${hoverBg} ${textSecondary}`}>
                        <Settings size={16} /> Ayarlar
                      </Link>
                      <button onClick={logout} className={`w-full flex items-center gap-2 px-4 py-2 ${hoverBg} text-rose-500`}>
                        <LogOut size={16} /> Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Mesajlaşma Alanı */}
          <div className="h-[calc(100vh-64px)] flex">
            {/* Sol Panel - Konuşmalar */}
            <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 ${bgCard} border-r ${borderColor}`}>
              {/* Arama ve Yeni Mesaj */}
              <div className={`p-4 border-b ${borderColor}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
                    <input type="text" placeholder="Konuşma ara..."
                      value={aramaText} onChange={(e) => setAramaText(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-xl text-sm ${textPrimary} placeholder:${textSecondary} focus:outline-none focus:ring-2 focus:ring-rose-500/30`}
                    />
                  </div>
                  <button onClick={() => setShowYeniMesajModal(true)}
                    className={`p-2.5 ${accentBg} text-white rounded-xl ${accentHover} transition-all shadow-lg shadow-rose-500/25`}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {/* Filtreler */}
                <div className="flex gap-2">
                  {[{ key: 'hepsi', label: 'Tümü' }, { key: 'okunmamis', label: 'Okunmamış' }, { key: 'gruplar', label: 'Gruplar' }].map((f) => (
                    <button key={f.key} onClick={() => setFilterType(f.key as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === f.key ? `${accentBg} text-white` : `${isDark ? 'bg-white/5' : 'bg-gray-100'} ${textSecondary}`}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Konuşma Listesi */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className={`w-6 h-6 animate-spin ${accentColor}`} />
                    <span className={`ml-2 ${textSecondary}`}>Yükleniyor...</span>
                  </div>
                ) : filteredKonusmalar.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
                      <Users className={`w-8 h-8 ${textSecondary}`} />
                    </div>
                    <p className={textSecondary}>Henüz konuşma yok</p>
                    <button onClick={() => setShowYeniMesajModal(true)}
                      className={`mt-4 px-4 py-2 ${accentBg} text-white rounded-lg text-sm font-medium ${accentHover} transition-all`}
                    >
                      Yeni Mesaj Başlat
                    </button>
                  </div>
                ) : filteredKonusmalar.map((konusma) => (
                  <button key={konusma.id}
                    onClick={() => { setSeciliKonusma(konusma); setShowMobileSidebar(false); }}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${seciliKonusma?.id === konusma.id ? (isDark ? 'bg-white/10' : 'bg-rose-50') : hoverBg}`}
                  >
                    <div className="relative flex-shrink-0">
                      {konusma.resimUrl ? (
                        <img src={konusma.resimUrl} alt={konusma.ad} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${konusma.tip === 'OGRETMEN' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : konusma.tip === 'PERSONEL' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-rose-500 to-rose-600'}`}>
                          {getKonusmaIcon(konusma.tip) || konusma.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                      {konusma.tip === 'OZEL' && konusma.uyeler[0]?.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`font-medium text-sm truncate ${textPrimary}`}>{konusma.ad}</span>
                        <span className={`text-xs flex-shrink-0 ${textSecondary}`}>
                          {konusma.sonMesaj ? formatTarih(konusma.sonMesaj.tarih) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate pr-2 ${konusma.okunmamis > 0 ? textPrimary + ' font-medium' : textSecondary}`}>
                          {konusma.sonMesaj?.icerik || 'Yeni sohbet'}
                        </p>
                        {konusma.okunmamis > 0 && (
                          <span className={`${accentBg} text-white text-[10px] font-medium rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center flex-shrink-0`}>
                            {konusma.okunmamis}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sağ Panel - Mesaj Detay */}
            <div className={`${!showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1`}>
              {seciliKonusma ? (
                <>
                  {/* Konuşma Header */}
                  <div className={`${bgCard} border-b ${borderColor} px-4 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setShowMobileSidebar(true)} className={`md:hidden p-2 -ml-2 rounded-lg ${hoverBg}`}>
                        <ArrowLeft size={20} className={textSecondary} />
                      </button>
                      <div className="relative">
                        {seciliKonusma.resimUrl ? (
                          <img src={seciliKonusma.resimUrl} alt={seciliKonusma.ad} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${seciliKonusma.tip === 'OGRETMEN' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-rose-500 to-rose-600'}`}>
                            {getKonusmaIcon(seciliKonusma.tip) || seciliKonusma.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className={`font-medium ${textPrimary}`}>{seciliKonusma.ad}</h2>
                        <p className={`text-sm ${textSecondary}`}>
                          {seciliKonusma.tip !== 'OZEL' ? `${seciliKonusma.uyeler.length} üye` : (seciliKonusma.uyeler[0]?.online ? <span className="text-green-500">Çevrimiçi</span> : 'Çevrimdışı')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className={`p-2 rounded-lg ${hoverBg} ${textSecondary}`}><Phone size={20} /></button>
                      <button onClick={() => seciliKonusma.tip !== 'OZEL' && setShowGrupProfil(true)} className={`p-2 rounded-lg ${hoverBg} ${textSecondary}`}><MoreVertical size={20} /></button>
                    </div>
                  </div>

                  {/* Mesajlar */}
                  <div ref={mesajListRef} className={`flex-1 overflow-y-auto p-4 space-y-2 ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-rose-50/50 to-pink-50/50'}`}>
                    {getMesajlarWithDateSeparators().map((item, index) => {
                      if (item.type === 'date') {
                        return (
                          <div key={`date-${index}`} className="flex justify-center py-2">
                            <span className={`px-3 py-1 ${isDark ? 'bg-white/10' : 'bg-white'} rounded-lg text-xs font-medium ${textSecondary} shadow-sm`}>
                              {item.content as string}
                            </span>
                          </div>
                        );
                      }
                      const mesaj = item.content as Mesaj;
                      const isBenimMesajim = currentUser?.id === mesaj.gonderenId;
                      return (
                        <div key={mesaj.id} className={`flex items-end gap-2 ${isBenimMesajim ? 'justify-end' : 'justify-start'}`}>
                          {!isBenimMesajim && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                              {mesaj.gonderenAd.charAt(0)}
                            </div>
                          )}
                          <div className={`max-w-[70%] px-3 py-2 ${isBenimMesajim ? `${accentBg} text-white rounded-2xl rounded-br-md` : `${bgCard} ${textPrimary} rounded-2xl rounded-bl-md shadow-sm`}`}>
                            {seciliKonusma.tip !== 'OZEL' && !isBenimMesajim && (
                              <p className="text-xs font-semibold text-blue-400 mb-0.5">{mesaj.gonderenAd}</p>
                            )}
                            <div className="flex items-end gap-2">
                              <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{mesaj.icerik}</p>
                              <div className="flex items-center gap-1 flex-shrink-0 -mb-0.5">
                                <span className={`text-[11px] ${isBenimMesajim ? 'text-white/70' : textSecondary}`}>{formatSaat(mesaj.tarih)}</span>
                                {isBenimMesajim && <CheckCheck size={14} className={mesaj.okundu ? 'text-blue-300' : 'text-white/50'} />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mesaj Gönderme */}
                  <div className={`${bgCard} border-t ${borderColor} p-4`}>
                    <div className="flex items-center gap-3">
                      <button className={`p-2 rounded-lg ${hoverBg} ${textSecondary}`}><Paperclip size={20} /></button>
                      <input ref={inputRef} type="text" value={yeniMesaj}
                        onChange={(e) => setYeniMesaj(e.target.value)} onKeyPress={handleKeyPress}
                        placeholder="Mesajınızı yazın..."
                        className={`flex-1 px-4 py-2.5 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-xl text-sm ${textPrimary} placeholder:${textSecondary} focus:outline-none focus:ring-2 focus:ring-rose-500/30`}
                      />
                      <button onClick={handleMesajGonder} disabled={!yeniMesaj.trim() || sendingMessage}
                        className={`px-4 py-2.5 ${accentBg} text-white rounded-xl ${accentHover} transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                      >
                        {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gönder'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`flex-1 flex items-center justify-center ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-rose-50/50 to-pink-50/50'}`}>
                  <div className="text-center">
                    <div className={`w-24 h-24 mx-auto mb-6 rounded-full ${isDark ? 'bg-white/5' : 'bg-rose-100'} flex items-center justify-center`}>
                      <MessageSquare size={48} className={accentColor} />
                    </div>
                    <h3 className={`text-lg font-medium ${textPrimary} mb-2`}>Konuşma Seçin</h3>
                    <p className={`text-sm ${textSecondary}`}>Mesajlaşmaya başlamak için<br/>sol taraftan bir kişi seçin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
            <div className={`absolute left-0 top-0 h-full w-64 ${bgCard} shadow-xl`}>
              <div className={`h-16 flex items-center justify-between px-4 border-b ${borderColor}`}>
                <span className={`text-xl font-bold ${textPrimary}`}>Edura</span>
                <button onClick={() => setShowMobileMenu(false)} className={`p-2 rounded-lg ${hoverBg}`}>
                  <X size={20} className={textSecondary} />
                </button>
              </div>
              <nav className="py-4">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname?.includes(item.href);
                  return (
                    <Link key={item.id} href={item.href} onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 mx-3 px-3 py-3 rounded-xl transition-all ${isActive ? `${accentBg} text-white` : `${textSecondary} ${hoverBg}`}`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Yeni Mesaj Modal */}
        {showYeniMesajModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${bgCard} rounded-2xl shadow-2xl w-full max-w-md`}>
              <div className={`p-4 border-b ${borderColor} flex justify-between items-center`}>
                <h3 className={`text-lg font-bold ${textPrimary}`}>Yeni Mesaj</h3>
                <button onClick={() => setShowYeniMesajModal(false)} className={`p-2 ${hoverBg} rounded-lg`}>
                  <X size={20} className={textSecondary} />
                </button>
              </div>
              
              {/* Tabs */}
              <div className={`flex border-b ${borderColor}`}>
                {[{ key: 'personel', label: 'Personel', icon: User }, { key: 'ogrenci', label: 'Öğrenci', icon: GraduationCap }, { key: 'grup', label: 'Yeni Grup', icon: Users }].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.key} onClick={() => setYeniMesajTip(tab.key as any)}
                      className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${yeniMesajTip === tab.key ? `${accentColor} border-b-2 border-rose-500` : `${textSecondary} ${hoverBg}`}`}
                    >
                      <Icon size={16} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-4">
                {yeniMesajTip === 'grup' ? (
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-2`}>Grup Adı</label>
                      <input type="text" value={yeniGrupAdi} onChange={(e) => setYeniGrupAdi(e.target.value)}
                        placeholder="Örn: Proje Ekibi"
                        className={`w-full px-4 py-2.5 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-lg text-sm ${textPrimary} placeholder:${textSecondary} focus:outline-none focus:ring-2 focus:ring-rose-500`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textSecondary} mb-2`}>Üyeler ({yeniGrupUyeler.length} seçildi)</label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableUsers.map((user) => (
                          <label key={user.id} className={`flex items-center gap-3 p-3 ${hoverBg} rounded-lg cursor-pointer`}>
                            <input type="checkbox" checked={yeniGrupUyeler.includes(user.id)}
                              onChange={(e) => setYeniGrupUyeler(e.target.checked ? [...yeniGrupUyeler, user.id] : yeniGrupUyeler.filter(id => id !== user.id))}
                              className="w-5 h-5 text-rose-500 rounded"
                            />
                            <div className={`w-10 h-10 rounded-full ${accentBg} flex items-center justify-center text-white font-semibold text-sm`}>
                              {user.ad[0]}{user.soyad[0]}
                            </div>
                            <div className="flex-1 text-left">
                              <p className={`font-medium ${textPrimary}`}>{user.ad} {user.soyad}</p>
                              <p className={`text-xs ${textSecondary}`}>{user.rol === 'mudur' ? 'Müdür' : user.rol === 'sekreter' ? 'Sekreter' : user.rol === 'ogretmen' ? 'Öğretmen' : 'Öğrenci'}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <button onClick={handleCreateGroup} disabled={!yeniGrupAdi.trim() || yeniGrupUyeler.length === 0}
                      className={`w-full py-3 ${accentBg} text-white rounded-lg font-semibold ${accentHover} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Grubu Oluştur
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mb-4">
                      <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
                      <input type="text" placeholder={yeniMesajTip === 'personel' ? 'Personel ara...' : 'Öğrenci ara...'}
                        value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 ${isDark ? 'bg-white/5' : 'bg-gray-100'} rounded-lg text-sm ${textPrimary} placeholder:${textSecondary} focus:outline-none focus:ring-2 focus:ring-rose-500`}
                      />
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {searchingUsers ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className={`w-6 h-6 animate-spin ${accentColor}`} />
                          <span className={`ml-2 ${textSecondary}`}>Yükleniyor...</span>
                        </div>
                      ) : availableUsers.length === 0 ? (
                        <div className={`text-center py-8 ${textSecondary}`}>Kullanıcı bulunamadı</div>
                      ) : availableUsers.map((user) => (
                        <button key={user.id} onClick={() => handleStartConversation(user)}
                          className={`w-full p-3 flex items-center gap-3 ${hoverBg} rounded-lg transition-colors`}
                        >
                          <div className={`w-10 h-10 rounded-full ${accentBg} flex items-center justify-center text-white font-semibold text-sm`}>
                            {user.ad[0]}{user.soyad[0]}
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`font-medium ${textPrimary}`}>{user.ad} {user.soyad}</p>
                            <p className={`text-xs ${textSecondary}`}>{user.rol === 'mudur' ? 'Müdür' : user.rol === 'sekreter' ? 'Sekreter' : user.rol === 'ogretmen' ? `${user.brans || ''} Öğretmeni` : `Öğrenci${user.sinif ? ` • ${user.sinif}` : ''}`}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grup Profil Panel */}
        {showGrupProfil && seciliKonusma && seciliKonusma.tip !== 'OZEL' && (
          <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowGrupProfil(false)} />
            <div className={`fixed inset-y-0 right-0 w-full sm:w-96 ${bgCard} shadow-2xl z-50`}>
              <div className={`${accentBg} text-white px-4 py-3 flex items-center gap-4`}>
                <button onClick={() => setShowGrupProfil(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
                <span className="text-lg font-medium">Grup Bilgisi</span>
              </div>
              <div className="overflow-y-auto h-[calc(100%-60px)]">
                <div className="p-6 text-center">
                  <div className={`w-32 h-32 mx-auto rounded-full ${accentBg} flex items-center justify-center text-white text-4xl font-bold mb-4`}>
                    {getKonusmaIcon(seciliKonusma.tip) || '👥'}
                  </div>
                  <h2 className={`text-xl font-semibold ${textPrimary}`}>{seciliKonusma.ad}</h2>
                  <p className={`${textSecondary}`}>Grup · {seciliKonusma.uyeler.length} üye</p>
                </div>
                <div className={`border-t ${borderColor}`}>
                  <div className={`px-4 py-3 flex items-center justify-between ${textSecondary}`}>
                    <span className="text-sm font-medium">{seciliKonusma.uyeler.length} üye</span>
                  </div>
                  {seciliKonusma.uyeler.map((uye, index) => (
                    <button key={index} onClick={() => { setSelectedUye(uye); setShowUyeMenu(true); }}
                      className={`w-full px-4 py-3 text-left ${hoverBg} flex items-center gap-3`}
                    >
                      <div className={`w-10 h-10 rounded-full ${accentBg} flex items-center justify-center text-white font-medium`}>
                        {uye.ad.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <span className={textPrimary}>{uye.id === currentUser?.id ? 'Siz' : uye.ad}</span>
                        <p className={`text-sm ${textSecondary}`}>{uye.rol || uye.brans}</p>
                      </div>
                      {uye.grupRol === 'admin' && (
                        <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">Yönetici</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Üye Menu Modal */}
        {showUyeMenu && selectedUye && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className={`${bgCard} rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden`}>
              <div className={`p-6 text-center ${isDark ? 'bg-white/5' : 'bg-rose-50'}`}>
                <div className={`w-20 h-20 mx-auto rounded-full ${accentBg} flex items-center justify-center text-white text-lg font-bold mb-3`}>
                  {selectedUye.ad.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <h3 className={`text-xl font-bold ${textPrimary}`}>{selectedUye.ad}</h3>
                <p className={`text-sm ${textSecondary}`}>{selectedUye.rol || selectedUye.brans}</p>
              </div>
              <div className="p-4 space-y-2">
                <button className={`w-full p-3 text-left ${hoverBg} rounded-lg flex items-center gap-3`}>
                  <User size={20} className={accentColor} />
                  <span className={textPrimary}>Profili Görüntüle</span>
                </button>
                {selectedUye.id !== currentUser?.id && (
                  <button className={`w-full p-3 text-left ${hoverBg} rounded-lg flex items-center gap-3`}>
                    <MessageSquare size={20} className={accentColor} />
                    <span className={textPrimary}>Mesaj Gönder</span>
                  </button>
                )}
              </div>
              <div className={`p-4 border-t ${borderColor}`}>
                <button onClick={() => setShowUyeMenu(false)}
                  className={`w-full py-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'} ${textSecondary} rounded-lg font-semibold ${hoverBg}`}
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
