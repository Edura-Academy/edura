'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  GraduationCap,
  BookOpen,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  FileText,
  ClipboardList,
  ChevronRight,
  Clock,
  CheckCircle,
  Video,
  PenTool,
  BarChart3,
  FolderOpen,
  PlayCircle,
  Calendar,
  Home,
  Menu,
  X,
  ChevronDown,
  Search,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAccessibility } from '@/contexts/AccessibilityContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Stats {
  toplamOgrenci: number;
  toplamDers: number;
  bekleyenOdevler: number;
  bugunDersSayisi: number;
}

interface BugunDers {
  id: string;
  ad: string;
  sinif: string;
  saat: string;
  durum: 'bekliyor' | 'devam_ediyor' | 'tamamlandi';
}

// Sidebar menü öğeleri
const menuItems = [
  { 
    id: 'ana-sayfa', 
    label: 'Ana Sayfa', 
    icon: Home, 
    href: '/ogretmen',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    id: 'derslerim', 
    label: 'Derslerim', 
    icon: BookOpen, 
    href: '/ogretmen/ders-programi',
    color: 'from-emerald-500 to-emerald-600'
  },
  { 
    id: 'odevler', 
    label: 'Ödevler', 
    icon: PenTool, 
    href: '/ogretmen/odevler',
    color: 'from-amber-500 to-amber-600'
  },
  { 
    id: 'sinavlar', 
    label: 'Sınavlar', 
    icon: FileText, 
    href: '/ogretmen/sinavlar',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    id: 'yoklama', 
    label: 'Yoklama', 
    icon: ClipboardList, 
    href: '/ogretmen/yoklama',
    color: 'from-cyan-500 to-cyan-600'
  },
  { 
    id: 'materyaller', 
    label: 'Materyaller', 
    icon: FolderOpen, 
    href: '/ogretmen/materyaller',
    color: 'from-green-500 to-green-600'
  },
  { 
    id: 'canli-ders', 
    label: 'Canlı Ders', 
    icon: Video, 
    href: '/ogretmen/canli-ders',
    color: 'from-red-500 to-red-600',
    badge: 'Canlı'
  },
  { 
    id: 'mesajlar', 
    label: 'Mesajlar', 
    icon: MessageSquare, 
    href: '/ogretmen/mesajlar',
    color: 'from-indigo-500 to-indigo-600'
  },
  { 
    id: 'raporlar', 
    label: 'Raporlar', 
    icon: BarChart3, 
    href: '/ogretmen/raporlar',
    color: 'from-teal-500 to-teal-600'
  },
];

function OgretmenDashboardContent() {
  const { user, token, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const { speak, stop, ttsEnabled } = useAccessibility();
  const isDark = resolvedTheme === 'dark';
  const [stats, setStats] = useState<Stats | null>(null);
  const [bugunDersler, setBugunDersler] = useState<BugunDers[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);

  // TTS yardımcı fonksiyonu - mouse hover/focus'ta okur, leave'de durur
  const ttsHandlers = useCallback((text: string) => ({
    onMouseEnter: () => ttsEnabled && speak(text),
    onMouseLeave: () => stop(),
    onFocus: () => ttsEnabled && speak(text),
    onBlur: () => stop(),
    tabIndex: 0,
    'aria-label': text,
  }), [ttsEnabled, speak, stop]);

  useEffect(() => {
    if (token) {
      fetchData(token);
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async (token: string) => {
    try {
      const [statsRes, derslerRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/ogretmen/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/dashboard/ogretmen/bugun-dersler`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      if (derslerRes.ok) {
        const derslerData = await derslerRes.json();
        if (derslerData.success) {
          setBugunDersler(derslerData.data);
        }
      }
    } catch (error) {
      console.error('Veri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getDurumBadge = (durum: string) => {
    switch (durum) {
      case 'tamamlandi':
        return <span className={`px-2.5 py-1 ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'} text-xs font-medium rounded-full`}>Tamamlandı</span>;
      case 'devam_ediyor':
        return <span className={`px-2.5 py-1 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'} text-xs font-medium rounded-full animate-pulse`}>Devam Ediyor</span>;
      default:
        return <span className={`px-2.5 py-1 ${isDark ? 'bg-slate-500/20 text-slate-400' : 'bg-slate-100 text-slate-600'} text-xs font-medium rounded-full`}>Bekliyor</span>;
    }
  };

  const isActive = (href: string) => {
    if (href === '/ogretmen') {
      return pathname === '/ogretmen' || pathname === '/tr/ogretmen' || pathname === '/en/ogretmen';
    }
    return pathname?.includes(href.replace('/ogretmen', ''));
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50'} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50/30'}`}>
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200/80'} border-r z-50 transition-all duration-300 shadow-xl lg:shadow-none
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarOpen ? 'w-64' : 'w-20'}
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center justify-between px-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
          <Link href="/ogretmen" className="flex items-center gap-3">
            <img 
              src={isDark ? "/logos/Edura-logo-dark-2.png" : "/logos/Edura-logo-nobg.png"} 
              alt="Edura Logo" 
              className="w-10 h-10 object-contain"
            />
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Edura</h1>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium -mt-0.5`}>Öğretmen Paneli</p>
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

        {/* Menu Items - TTS Destekli */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
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
                {...ttsHandlers(`${item.label}${item.badge ? `. ${item.badge}` : ''}. ${active ? 'Şu an bu sayfadasınız.' : 'Sayfaya gitmek için tıklayın.'}`)}
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
                  <>
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && (
                      <span className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        active ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600 animate-pulse'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {!sidebarOpen && item.badge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile - Bottom - TTS Destekli */}
        {sidebarOpen && (
          <div className={`absolute bottom-0 left-0 right-0 p-3 border-t ${isDark ? 'border-slate-700/50 bg-[#1a1f2e]' : 'border-slate-100 bg-white'}`}>
            <div 
              className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} cursor-pointer`}
              {...ttsHandlers(`Giriş yapan kullanıcı: ${user?.ad} ${user?.soyad}. Branş: ${user?.brans || 'Öğretmen'}.`)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user?.ad?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{user?.ad} {user?.soyad}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>{user?.brans || 'Öğretmen'}</p>
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
            {/* Left - Mobile Menu & Search */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className={`p-2 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-xl lg:hidden`}
              >
                <Menu className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </button>
              <div className={`hidden md:flex items-center gap-2 ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'} rounded-xl px-4 py-2 w-72`}>
                <Search className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input 
                  type="text" 
                  placeholder="Ara..." 
                  className={`bg-transparent text-sm ${isDark ? 'text-slate-200 placeholder-slate-500' : 'text-slate-600 placeholder-slate-400'} outline-none w-full`}
                />
              </div>
            </div>

            {/* Right - Actions - TTS Destekli */}
            <div className="flex items-center gap-2">
              {/* Quick Add */}
              <Link
                href="/ogretmen/canli-ders"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/40"
                {...ttsHandlers('Canlı Ders Başlat. Video ders başlatmak için tıklayın.')}
              >
                <Video className="w-4 h-4" />
                <span>Canlı Ders</span>
              </Link>

              {/* Language Selector */}
              <LanguageSelector variant={isDark ? 'dark' : 'light'} />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <button 
                className={`relative p-2.5 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'} rounded-xl transition-colors`}
                {...ttsHandlers('Bildirimler. Yeni bildirimleriniz var.')}
              >
                <Bell className="w-5 h-5" />
                <span className={`absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ${isDark ? 'ring-[#1a1f2e]' : 'ring-white'}`}></span>
              </button>

              {/* Messages */}
              <Link
                href="/ogretmen/mesajlar"
                className={`p-2.5 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'} rounded-xl transition-colors`}
                {...ttsHandlers('Mesajlar. Mesajlarınızı görüntülemek için tıklayın.')}
              >
                <MessageSquare className="w-5 h-5" />
              </Link>

              {/* Profile Dropdown - TTS Destekli */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 p-1.5 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-xl transition-colors ml-1`}
                  {...ttsHandlers(`Profil menüsü. ${user?.ad} ${user?.soyad}. Menüyü açmak için tıklayın.`)}
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {user?.ad?.charAt(0)}
                  </div>
                  <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-400'} hidden sm:block transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className={`absolute right-0 top-14 w-64 ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} border rounded-2xl shadow-xl z-50 overflow-hidden`}>
                    <div 
                      className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer"
                      {...ttsHandlers(`${user?.ad} ${user?.soyad}. E-posta: ${user?.email}`)}
                    >
                      <p className="font-semibold">{user?.ad} {user?.soyad}</p>
                      <p className="text-sm text-white/80">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/ogretmen/ayarlar"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-800/50' : 'text-slate-700 hover:bg-slate-50'} rounded-xl transition-colors`}
                        {...ttsHandlers('Hesap Ayarları. Hesap ayarlarına gitmek için tıklayın.')}
                      >
                        <Settings className="w-4 h-4" />
                        Hesap Ayarları
                      </Link>
                      <hr className={`my-2 ${isDark ? 'border-slate-700/50' : ''}`} />
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'} rounded-xl transition-colors`}
                        {...ttsHandlers('Çıkış Yap. Hesaptan çıkış yapmak için tıklayın.')}
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

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {/* Welcome Section - TTS Destekli */}
          <div className="mb-6">
            <div 
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer"
              {...ttsHandlers(`Hoş geldiniz ${user?.ad} Hocam! Bugün ${stats?.bugunDersSayisi || 0} dersiniz var. ${stats?.toplamOgrenci || 0} öğrenciniz ve ${stats?.bekleyenOdevler || 0} bekleyen ödeviniz bulunmaktadır. Harika bir gün olsun!`)}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/10 rounded-full translate-y-1/2"></div>
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Hoş Geldiniz, {user?.ad} Hocam! 👋</h2>
                <p className="text-white/80">Bugün {stats?.bugunDersSayisi || 0} dersiniz var. Harika bir gün olsun!</p>
              </div>
            </div>
          </div>

          {/* Stats Cards - TTS Destekli */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div 
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-emerald-500/50' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}
              {...ttsHandlers(`Toplam öğrenci sayısı: ${stats?.toplamOgrenci || 0}. Derslerinize kayıtlı öğrenci sayısı.`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>Öğrencilerim</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.toplamOgrenci || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-emerald-500/20' : 'shadow-emerald-200'} group-hover:scale-110 transition-transform`}>
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div 
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-blue-500/50' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}
              {...ttsHandlers(`Toplam ders sayısı: ${stats?.toplamDers || 0}. Verdiğiniz aktif ders sayısı.`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>Derslerim</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.toplamDers || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-blue-500/20' : 'shadow-blue-200'} group-hover:scale-110 transition-transform`}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div 
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-amber-500/50' : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}
              {...ttsHandlers(`Bekleyen ödev sayısı: ${stats?.bekleyenOdevler || 0}. Değerlendirme bekleyen ödevler.`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>Bekleyen Ödev</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.bekleyenOdevler || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-amber-500/20' : 'shadow-amber-200'} group-hover:scale-110 transition-transform`}>
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div 
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-purple-500/50' : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}
              {...ttsHandlers(`Bugün ${stats?.bugunDersSayisi || 0} dersiniz var.`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>Bugün Ders</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.bugunDersSayisi || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-purple-500/20' : 'shadow-purple-200'} group-hover:scale-110 transition-transform`}>
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - TTS Destekli */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <Link
              href="/ogretmen/yoklama"
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-cyan-500/50' : 'bg-white border-slate-100 hover:border-cyan-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group`}
              {...ttsHandlers('Yoklama Al. Günlük yoklama işlemleri için tıklayın.')}
            >
              <div className={`w-11 h-11 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-cyan-500/20' : 'shadow-cyan-200'} group-hover:scale-110 transition-transform`}>
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>Yoklama Al</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Günlük yoklama</p>
            </Link>

            <Link
              href="/ogretmen/odevler?action=yeni"
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-amber-500/50' : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group`}
              {...ttsHandlers('Ödev Ver. Öğrencilerinize yeni ödev oluşturmak için tıklayın.')}
            >
              <div className={`w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-amber-500/20' : 'shadow-amber-200'} group-hover:scale-110 transition-transform`}>
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>Ödev Ver</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Yeni ödev oluştur</p>
            </Link>

            <Link
              href="/ogretmen/sinavlar?action=yeni"
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-purple-500/50' : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group`}
              {...ttsHandlers('Sınav Oluştur. Online çoktan seçmeli sınav hazırlamak için tıklayın.')}
            >
              <div className={`w-11 h-11 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-purple-500/20' : 'shadow-purple-200'} group-hover:scale-110 transition-transform`}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>Sınav Oluştur</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Online sınav</p>
            </Link>

            <Link
              href="/ogretmen/materyaller"
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-green-500/50' : 'bg-white border-slate-100 hover:border-green-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group`}
              {...ttsHandlers('Materyaller. Ders materyallerini paylaşmak için tıklayın.')}
            >
              <div className={`w-11 h-11 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-green-500/20' : 'shadow-green-200'} group-hover:scale-110 transition-transform`}>
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>Materyaller</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Dosya paylaş</p>
            </Link>

            <Link
              href="/ogretmen/raporlar"
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-teal-500/50' : 'bg-white border-slate-100 hover:border-teal-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group`}
              {...ttsHandlers('Raporlar. Öğrenci performans analizlerini görüntülemek için tıklayın.')}
            >
              <div className={`w-11 h-11 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-teal-500/20' : 'shadow-teal-200'} group-hover:scale-110 transition-transform`}>
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>Raporlar</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Performans analizi</p>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Classes - TTS Destekli */}
            <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden`}>
              <div 
                className={`p-5 border-b ${isDark ? 'border-slate-700/50 bg-gradient-to-r from-blue-500/10 to-indigo-500/10' : 'border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50'} flex items-center justify-between cursor-pointer`}
                {...ttsHandlers(`Bugünkü Dersler. Bugün ${bugunDersler.length} dersiniz ${bugunDersler.length > 0 ? 'bulunmaktadır' : 'bulunmamaktadır'}.`)}
              >
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                  <Calendar className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                  Bugünkü Dersler
                </h3>
                <Link 
                  href="/ogretmen/ders-programi" 
                  className={`text-sm ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} font-medium`}
                  {...ttsHandlers('Tüm ders programını görüntülemek için tıklayın.')}
                >
                  Tüm Program →
                </Link>
              </div>
              <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-50'}`}>
                {bugunDersler.length > 0 ? bugunDersler.map((ders) => (
                  <div 
                    key={ders.id} 
                    className={`p-4 flex items-center justify-between ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors cursor-pointer`}
                    {...ttsHandlers(`${ders.ad} dersi. Sınıf: ${ders.sinif}. Saat: ${ders.saat}. Durum: ${ders.durum === 'tamamlandi' ? 'Tamamlandı' : ders.durum === 'devam_ediyor' ? 'Devam ediyor' : 'Bekliyor'}.`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        ders.durum === 'devam_ediyor' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 
                        ders.durum === 'tamamlandi' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 
                        'bg-gradient-to-br from-slate-400 to-slate-500'
                      } shadow-md`}>
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{ders.ad}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ders.sinif} • {ders.saat}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getDurumBadge(ders.durum)}
                      {ders.durum === 'devam_ediyor' && (
                        <Link
                          href={`/ogretmen/canli-ders/${ders.id}`}
                          className="p-2 bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg transition-colors shadow-md"
                          {...ttsHandlers('Canlı derse katılmak için tıklayın.')}
                        >
                          <PlayCircle className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                )) : (
                  <div 
                    className="p-8 text-center cursor-pointer"
                    {...ttsHandlers('Bugün için planlanmış ders bulunmamaktadır.')}
                  >
                    <div className={`w-16 h-16 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                      <Calendar className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>Bugün için planlanmış ders yok</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Panel - TTS Destekli */}
            <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden`}>
              <div 
                className={`p-5 border-b ${isDark ? 'border-slate-700/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10' : 'border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50'} cursor-pointer`}
                {...ttsHandlers('Hızlı İşlemler. Sık kullanılan işlemlere buradan hızlıca erişebilirsiniz.')}
              >
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>⚡ Hızlı İşlemler</h3>
              </div>
              <div className="p-4 space-y-3">
                <Link
                  href="/ogretmen/canli-ders"
                  className={`flex items-center gap-4 p-4 ${isDark ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20' : 'bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-red-100'} rounded-xl transition-all border group`}
                  {...ttsHandlers('Canlı Ders Başlat. Anında video ders başlatmak için tıklayın.')}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-red-500/20' : 'shadow-red-200'} group-hover:scale-110 transition-transform`}>
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-900'}`}>Canlı Ders Başlat</p>
                    <p className={`text-sm ${isDark ? 'text-red-400/70' : 'text-red-600'}`}>Anında video ders başlat</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-400'} group-hover:translate-x-1 transition-transform`} />
                </Link>

                <Link
                  href="/ogretmen/odevler?action=yeni"
                  className={`flex items-center gap-4 p-4 ${isDark ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20' : 'bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border-amber-100'} rounded-xl transition-all border group`}
                  {...ttsHandlers('Yeni Ödev Ver. Öğrencilerinize ödev atamak için tıklayın.')}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-amber-500/20' : 'shadow-amber-200'} group-hover:scale-110 transition-transform`}>
                    <PenTool className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>Yeni Ödev Ver</p>
                    <p className={`text-sm ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>Öğrencilere ödev ata</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-400'} group-hover:translate-x-1 transition-transform`} />
                </Link>

                <Link
                  href="/ogretmen/sinavlar?action=yeni"
                  className={`flex items-center gap-4 p-4 ${isDark ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20' : 'bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border-purple-100'} rounded-xl transition-all border group`}
                  {...ttsHandlers('Online Sınav Oluştur. Çoktan seçmeli sınav hazırlamak için tıklayın.')}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-purple-500/20' : 'shadow-purple-200'} group-hover:scale-110 transition-transform`}>
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-900'}`}>Online Sınav Oluştur</p>
                    <p className={`text-sm ${isDark ? 'text-purple-400/70' : 'text-purple-600'}`}>Çoktan seçmeli sınav hazırla</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-400'} group-hover:translate-x-1 transition-transform`} />
                </Link>

                <Link
                  href="/ogretmen/mesajlar"
                  className={`flex items-center gap-4 p-4 ${isDark ? 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20' : 'bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border-indigo-100'} rounded-xl transition-all border group`}
                  {...ttsHandlers('Mesaj Gönder. Öğrenci veya veliye mesaj göndermek için tıklayın.')}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-indigo-500/20' : 'shadow-indigo-200'} group-hover:scale-110 transition-transform`}>
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-900'}`}>Mesaj Gönder</p>
                    <p className={`text-sm ${isDark ? 'text-indigo-400/70' : 'text-indigo-600'}`}>Öğrenci veya veliye mesaj at</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-400'} group-hover:translate-x-1 transition-transform`} />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Ana export - RoleGuard ile sarmalanmış
export default function OgretmenDashboard() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <OgretmenDashboardContent />
    </RoleGuard>
  );
}
