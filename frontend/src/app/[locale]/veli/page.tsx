'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, BookOpen, Calendar, FileText, Bell, 
  TrendingUp, AlertCircle, Clock, ChevronRight,
  GraduationCap, MessageSquare, Settings, LogOut,
  CheckCircle, XCircle, AlertTriangle, User,
  Home, Menu, X, ChevronDown, CreditCard, BarChart3,
  Megaphone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useTranslations } from 'next-intl';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Cocuk {
  id: string;
  ad: string;
  soyad: string;
  ogrenciNo: string;
  sinif: {
    id: string;
    ad: string;
    seviye: number;
    tip: string;
  };
  kurs: {
    id: string;
    ad: string;
  };
  ozet: {
    devamsizlikSayisi: number;
    bekleyenOdevler: number;
    teslimEdilmemisOdevler: number;
    sinavOrtalamasi: number | null;
  };
}

interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  okundu: boolean;
  createdAt: string;
}

interface Duyuru {
  id: string;
  baslik: string;
  oncelik: string;
  createdAt: string;
}

interface DashboardData {
  cocuklar: Cocuk[];
  bildirimler: Bildirim[];
  duyurular: Duyuru[];
}

// Sidebar menü öğeleri - labelKey ile çeviri destekli
const menuItems = [
  { 
    id: 'ana-sayfa', 
    labelKey: 'homePage', 
    icon: Home, 
    href: '/veli',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    id: 'mesajlar', 
    labelKey: 'messages', 
    icon: MessageSquare, 
    href: '/veli/mesajlar',
    color: 'from-indigo-500 to-indigo-600'
  },
  { 
    id: 'deneme-sonuclari', 
    labelKey: 'examResults', 
    icon: GraduationCap, 
    href: '/veli/deneme-sonuclari',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    id: 'odemeler', 
    labelKey: 'payments', 
    icon: CreditCard, 
    href: '/veli/odemeler',
    color: 'from-emerald-500 to-emerald-600'
  },
  { 
    id: 'karsilastir', 
    labelKey: 'compare', 
    icon: BarChart3, 
    href: '/veli/karsilastir',
    color: 'from-amber-500 to-amber-600'
  },
  { 
    id: 'duyurular', 
    labelKey: 'announcements', 
    icon: Megaphone, 
    href: '/veli/duyurular',
    color: 'from-pink-500 to-pink-600'
  },
];

function VeliDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const { speak, stop, ttsEnabled } = useAccessibility();
  const t = useTranslations('parent');
  const isDark = resolvedTheme === 'dark';
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
      fetchDashboard(token);
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

  const fetchDashboard = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/veli/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Dashboard yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrtalamaRenk = (ortalama: number | null) => {
    if (ortalama === null) return 'text-gray-400';
    if (ortalama >= 80) return 'text-emerald-500';
    if (ortalama >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const isActive = (href: string) => {
    if (href === '/veli') {
      return pathname === '/veli' || pathname === '/tr/veli' || pathname === '/en/veli';
    }
    return pathname?.includes(href.replace('/veli', ''));
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-slate-50 via-white to-purple-50'} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-slate-50 via-white to-purple-50/30'}`}>
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
            const active = isActive(item.href);
            const label = t(`menu.${item.labelKey}`);
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
                {...ttsHandlers(`${label}. ${active ? t('tts.currentPage') : t('tts.goToPage')}`)}
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
                  <span className="font-medium text-sm">{label}</span>
                )}
              </Link>
            );
          })}

          {/* Ayarlar - Alt kısımda */}
          <div className={`pt-4 mt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
            <Link
              href="/veli/ayarlar"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                ${pathname?.includes('/ayarlar')
                  ? `bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg` 
                  : isDark
                    ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
              {...ttsHandlers(`${t('menu.settings')}. ${t('tts.settingsLink')}`)}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all
                ${pathname?.includes('/ayarlar')
                  ? 'bg-white/20' 
                  : isDark 
                    ? 'bg-slate-700 text-slate-300 shadow-md group-hover:shadow-lg'
                    : 'bg-slate-200 text-slate-600 shadow-md group-hover:shadow-lg'
                }
              `}>
                <Settings className="w-4.5 h-4.5" />
              </div>
              {sidebarOpen && (
                <span className="font-medium text-sm">{t('menu.settings')}</span>
              )}
            </Link>
          </div>
        </nav>

        {/* User Profile - Bottom */}
        {sidebarOpen && (
          <div className={`absolute bottom-0 left-0 right-0 p-3 border-t ${isDark ? 'border-slate-700/50 bg-[#1a1f2e]' : 'border-slate-100 bg-white'}`}>
            <div 
              className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} cursor-pointer`}
              {...ttsHandlers(t('tts.userInfo', { name: `${user?.ad} ${user?.soyad}` }))}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user?.ad?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{user?.ad} {user?.soyad}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>{t('role')}</p>
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
              <div className="hidden md:block">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('welcome.title', { name: user?.ad })}
                </h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('welcome.subtitle')}
                </p>
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <LanguageSelector variant={isDark ? 'dark' : 'light'} />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <button 
                className={`relative p-2.5 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'} rounded-xl transition-colors`}
                {...ttsHandlers('Bildirimler.')}
              >
                <Bell className="w-5 h-5" />
                {data?.bildirimler && data.bildirimler.length > 0 && (
                  <span className={`absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ${isDark ? 'ring-[#1a1f2e]' : 'ring-white'}`}></span>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 p-1.5 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-xl transition-colors ml-1`}
                  {...ttsHandlers(`Profil menüsü. ${user?.ad} ${user?.soyad}. Menüyü açmak için tıklayın.`)}
                >
                  {user?.profilFoto ? (
                    <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md">
                      <Image
                        src={user.profilFoto}
                        alt={`${user.ad} ${user.soyad}`}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {user?.ad?.charAt(0)}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.ad} {user?.soyad}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Veli</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-400'} hidden sm:block transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className={`absolute right-0 top-14 w-64 ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} border rounded-2xl shadow-xl z-50 overflow-hidden`}>
                    <div 
                      className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white cursor-pointer"
                      {...ttsHandlers(`${user?.ad} ${user?.soyad}. E-posta: ${user?.email}`)}
                    >
                      <p className="font-semibold">{user?.ad} {user?.soyad}</p>
                      <p className="text-sm text-white/80">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/veli/ayarlar"
                        onClick={() => setShowProfileMenu(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-800/50' : 'text-slate-700 hover:bg-slate-50'} rounded-xl transition-colors`}
                        {...ttsHandlers(t('tts.settingsLink'))}
                      >
                        <Settings className="w-4 h-4" />
                        {t('header.accountSettings')}
                      </Link>
                      <hr className={`my-2 ${isDark ? 'border-slate-700/50' : ''}`} />
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'} rounded-xl transition-colors`}
                        {...ttsHandlers(t('tts.logoutButton'))}
                      >
                        <LogOut className="w-4 h-4" />
                        {t('header.logout')}
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
          {/* Mobile Welcome */}
          <div className="md:hidden mb-6">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('welcome.title', { name: user?.ad })}
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('welcome.subtitle')}
            </p>
          </div>

          {/* Çocuklar Grid */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
              <Users className="w-5 h-5 text-purple-500" />
              {t('childInfo.myChildren')}
            </h3>
            
            {data?.cocuklar && data.cocuklar.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.cocuklar.map((cocuk) => (
                  <div 
                    key={cocuk.id}
                    className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-purple-500/50' : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50'} rounded-2xl border p-5 transition-all cursor-pointer group`}
                    onClick={() => router.push(`/veli/cocuk/${cocuk.id}`)}
                    {...ttsHandlers(`${cocuk.ad} ${cocuk.soyad}. Sınıf: ${cocuk.sinif?.ad}. Devamsızlık: ${cocuk.ozet.devamsizlikSayisi} gün. Ortalama: ${cocuk.ozet.sinavOrtalamasi !== null ? `yüzde ${cocuk.ozet.sinavOrtalamasi}` : 'henüz yok'}. Bekleyen ödev: ${cocuk.ozet.bekleyenOdevler}.`)}
                  >
                    {/* Çocuk Bilgileri */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
                          {cocuk.ad[0]}{cocuk.soyad[0]}
                        </div>
                        <div>
                          <h4 className={`${isDark ? 'text-white' : 'text-slate-900'} font-semibold`}>{cocuk.ad} {cocuk.soyad}</h4>
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{cocuk.sinif?.ad} • {cocuk.kurs?.ad}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'} group-hover:text-purple-500 transition-colors`} />
                    </div>

                    {/* İstatistikler */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Devamsızlık */}
                      <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-xl p-3`}>
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle className={`w-4 h-4 ${cocuk.ozet.devamsizlikSayisi > 3 ? 'text-red-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Devamsızlık</span>
                        </div>
                        <p className={`text-lg font-bold ${cocuk.ozet.devamsizlikSayisi > 3 ? 'text-red-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                          {cocuk.ozet.devamsizlikSayisi}
                          <span className={`text-xs font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'} ml-1`}>gün</span>
                        </p>
                      </div>

                      {/* Sınav Ortalaması */}
                      <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-xl p-3`}>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className={`w-4 h-4 ${getOrtalamaRenk(cocuk.ozet.sinavOrtalamasi)}`} />
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ortalama</span>
                        </div>
                        <p className={`text-lg font-bold ${getOrtalamaRenk(cocuk.ozet.sinavOrtalamasi)}`}>
                          {cocuk.ozet.sinavOrtalamasi !== null ? `${cocuk.ozet.sinavOrtalamasi}%` : '-'}
                        </p>
                      </div>

                      {/* Bekleyen Ödevler */}
                      <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-xl p-3`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className={`w-4 h-4 ${cocuk.ozet.bekleyenOdevler > 0 ? 'text-amber-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bekleyen</span>
                        </div>
                        <p className={`text-lg font-bold ${cocuk.ozet.bekleyenOdevler > 0 ? 'text-amber-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                          {cocuk.ozet.bekleyenOdevler}
                          <span className={`text-xs font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'} ml-1`}>ödev</span>
                        </p>
                      </div>

                      {/* Teslim Edilmemiş */}
                      <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-xl p-3`}>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className={`w-4 h-4 ${cocuk.ozet.teslimEdilmemisOdevler > 0 ? 'text-red-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Yapılmadı</span>
                        </div>
                        <p className={`text-lg font-bold ${cocuk.ozet.teslimEdilmemisOdevler > 0 ? 'text-red-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                          {cocuk.ozet.teslimEdilmemisOdevler}
                          <span className={`text-xs font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'} ml-1`}>ödev</span>
                        </p>
                      </div>
                    </div>

                    {/* Hızlı Erişim */}
                    <div className={`flex gap-2 mt-4 pt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/veli/cocuk/${cocuk.id}/notlar`); }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-500 rounded-lg text-sm transition-colors font-medium"
                        {...ttsHandlers(`${cocuk.ad} için notları görüntüle.`)}
                      >
                        <BookOpen className="w-4 h-4" />
                        Notlar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/veli/cocuk/${cocuk.id}/devamsizlik`); }}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 ${isDark ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} rounded-lg text-sm transition-colors font-medium`}
                        {...ttsHandlers(`${cocuk.ad} için yoklama ve devamsızlık bilgilerini görüntüle.`)}
                      >
                        <Calendar className="w-4 h-4" />
                        Yoklama
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/veli/cocuk/${cocuk.id}/odevler`); }}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 ${isDark ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} rounded-lg text-sm transition-colors font-medium`}
                        {...ttsHandlers(`${cocuk.ad} için ödevleri görüntüle.`)}
                      >
                        <FileText className="w-4 h-4" />
                        Ödevler
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border p-12 text-center`}>
                <Users className={`w-12 h-12 ${isDark ? 'text-slate-500' : 'text-slate-400'} mx-auto mb-4`} />
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Henüz kayıtlı öğrenci bulunmuyor.</p>
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'} mt-2`}>Lütfen okul yönetimiyle iletişime geçin.</p>
              </div>
            )}
          </div>

          {/* Alt Bölüm - Bildirimler ve Duyurular */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Son Bildirimler */}
            <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                  <Bell className="w-5 h-5 text-purple-500" />
                  {t('notifications.title')}
                </h3>
                <button className="text-sm text-purple-500 hover:text-purple-400 transition-colors font-medium">
                  {t('notifications.markAllRead')}
                </button>
              </div>
              
              {data?.bildirimler && data.bildirimler.length > 0 ? (
                <div className="space-y-2">
                  {data.bildirimler.slice(0, 4).map((bildirim) => (
                    <div 
                      key={bildirim.id}
                      className={`flex items-start gap-3 p-3 ${isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'} rounded-xl transition-colors cursor-pointer`}
                      {...ttsHandlers(`Bildirim: ${bildirim.baslik}. ${bildirim.mesaj}. Tarih: ${formatDate(bildirim.createdAt)}`)}
                    >
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{bildirim.baslik}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} truncate`}>{bildirim.mesaj}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>{formatDate(bildirim.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className={`w-8 h-8 ${isDark ? 'text-slate-600' : 'text-slate-300'} mx-auto mb-2`} />
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('notifications.noNotifications')}</p>
                </div>
              )}
            </div>

            {/* Son Duyurular */}
            <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  {t('announcements.title')}
                </h3>
                <button 
                  onClick={() => router.push('/veli/duyurular')}
                  className="text-sm text-purple-500 hover:text-purple-400 transition-colors font-medium"
                >
                  {t('recentExams.viewAll')}
                </button>
              </div>
              
              {data?.duyurular && data.duyurular.length > 0 ? (
                <div className="space-y-2">
                  {data.duyurular.slice(0, 4).map((duyuru) => (
                    <div 
                      key={duyuru.id}
                      className={`flex items-start gap-3 p-3 ${isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'} rounded-xl transition-colors cursor-pointer`}
                      onClick={() => router.push('/veli/duyurular')}
                      {...ttsHandlers(`Duyuru: ${duyuru.baslik}. ${duyuru.oncelik === 'ACIL' ? 'Acil.' : duyuru.oncelik === 'ONEMLI' ? 'Önemli.' : ''} Tarih: ${formatDate(duyuru.createdAt)}. Tüm duyuruları görmek için tıklayın.`)}
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        duyuru.oncelik === 'ACIL' ? 'bg-red-500' :
                        duyuru.oncelik === 'ONEMLI' ? 'bg-amber-500' : isDark ? 'bg-slate-400' : 'bg-slate-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{duyuru.baslik}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>{formatDate(duyuru.createdAt)}</p>
                      </div>
                      {duyuru.oncelik !== 'NORMAL' && (
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                          duyuru.oncelik === 'ACIL' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
                        }`}>
                          {duyuru.oncelik === 'ACIL' ? 'Acil' : 'Önemli'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className={`w-8 h-8 ${isDark ? 'text-slate-600' : 'text-slate-300'} mx-auto mb-2`} />
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Yeni duyuru yok</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Ana export - RoleGuard ile sarmalanmış
export default function VeliDashboard() {
  return (
    <RoleGuard allowedRoles={['veli']}>
      <VeliDashboardContent />
    </RoleGuard>
  );
}
