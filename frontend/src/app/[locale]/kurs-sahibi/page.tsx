'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Building,
  UserCheck,
  BarChart3,
  Home,
  Menu,
  X,
  ChevronDown,
  Search,
  FileText,
  PieChart,
  Wallet,
  CreditCard,
  UserPlus,
  Crown,
  Phone,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { 
  TTSStatCard, 
  TTSMenuItem, 
  TTSCard, 
  TTSWrapper,
} from '@/components/accessibility';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface KursInfo {
  id: string;
  ad: string;
  adres: string;
  telefon: string;
  aktif: boolean;
}

interface Stats {
  toplamOgrenci: number;
  toplamOgretmen: number;
  toplamSekreter: number;
  toplamSinif: number;
  toplamMudur: number;
  toplamGelir?: number;
  bekleyenOdemeler?: number;
  aylikGelir?: number;
}

interface Mudur {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  aktif: boolean;
  createdAt: string;
}

// Sidebar menü öğeleri
const menuItems = [
  { 
    id: 'ana-sayfa', 
    labelKey: 'homePage', 
    icon: Home, 
    href: '/kurs-sahibi',
    color: 'from-amber-500 to-amber-600'
  },
  { 
    id: 'mudur-yonetimi', 
    labelKey: 'managers', 
    icon: UserCheck, 
    href: '/kurs-sahibi/mudurler',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    id: 'finansal-raporlar', 
    labelKey: 'financialReports', 
    icon: BarChart3, 
    href: '/kurs-sahibi/finansal-raporlar',
    color: 'from-emerald-500 to-emerald-600'
  },
  { 
    id: 'duyurular', 
    labelKey: 'announcements', 
    icon: Bell, 
    href: '/kurs-sahibi/duyurular',
    color: 'from-rose-500 to-rose-600'
  },
  { 
    id: 'mesajlar', 
    labelKey: 'messages', 
    icon: MessageSquare, 
    href: '/kurs-sahibi/mesajlar',
    color: 'from-indigo-500 to-indigo-600'
  },
  { 
    id: 'ayarlar', 
    labelKey: 'settings', 
    icon: Settings, 
    href: '/kurs-sahibi/ayarlar',
    color: 'from-gray-500 to-gray-600'
  },
];

function KursSahibiDashboardContent() {
  const { user, token, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { ttsEnabled, speak, stop } = useAccessibility();
  const [kursInfo, setKursInfo] = useState<KursInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [mudurler, setMudurler] = useState<Mudur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);
  
  // Çeviri desteği (RTL layout kaldırıldı - sadece içerik çevirisi)
  const t = useTranslations('courseOwner');
  
  // TTS yardımcı fonksiyonu - mouse hover/focus'ta okur, leave'de durur
  const ttsHandlers = (text: string) => ({
    onMouseEnter: () => ttsEnabled && speak(text),
    onMouseLeave: () => stop(),
    onFocus: () => ttsEnabled && speak(text),
    onBlur: () => stop(),
    tabIndex: 0,
  });

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
      // Kurs bilgilerini ve istatistikleri çek
      const [kursRes, statsRes, mudurlerRes] = await Promise.all([
        fetch(`${API_URL}/users/kurs-bilgi`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users?role=mudur`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const kursData = await kursRes.json();
      const statsData = await statsRes.json();
      const mudurlerData = await mudurlerRes.json();

      if (kursData.success) {
        setKursInfo(kursData.data);
      }

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (mudurlerData.success) {
        setMudurler(mudurlerData.data.slice(0, 5));
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

  const isActive = (href: string) => {
    if (href === '/kurs-sahibi') {
      return pathname === '/kurs-sahibi' || pathname === '/tr/kurs-sahibi' || pathname === '/en/kurs-sahibi';
    }
    return pathname?.includes(href.replace('/kurs-sahibi', ''));
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-slate-50 via-white to-amber-50'} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-slate-50 via-white to-amber-50/30'}`}>
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200/80'} z-50 transition-all duration-300 shadow-xl lg:shadow-none border-r
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarOpen ? 'w-64' : 'w-20'}
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center justify-between px-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
          <Link href="/kurs-sahibi" className="flex items-center gap-3">
            <img 
              src={isDark ? "/logos/Edura-logo-dark-2.png" : "/logos/Edura-logo-nobg.png"} 
              alt="Edura Logo" 
              className="w-10 h-10 object-contain"
            />
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Edura</h1>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium -mt-0.5`}>{t('panel')}</p>
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
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]" role="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const label = t(`menu.${item.labelKey}`);
            const ttsText = active 
              ? `${label}, ${t('tts.currentPage')}` 
              : `${label} ${t('tts.goToPage')}`;
            return (
              <TTSMenuItem
                key={item.id}
                text={ttsText}
                href={item.href}
                isActive={active}
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
                  <span className="font-medium text-sm">{label}</span>
                )}
              </TTSMenuItem>
            );
          })}
        </nav>

        {/* User Profile - Bottom */}
        {sidebarOpen && (
          <div className={`absolute bottom-0 left-0 right-0 p-3 border-t ${isDark ? 'border-slate-700/50 bg-[#1a1f2e]' : 'border-slate-100 bg-white'}`}>
            <div className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user?.ad?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{user?.ad} {user?.soyad}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>{t('title')}</p>
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
                  placeholder={t('header.search')} 
                  className={`bg-transparent text-sm ${isDark ? 'text-slate-200 placeholder-slate-500' : 'text-slate-600 placeholder-slate-400'} outline-none w-full`}
                />
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <LanguageSelector variant={isDark ? 'dark' : 'light'} />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <button className={`relative p-2.5 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'} rounded-xl transition-colors`}>
                <Bell className="w-5 h-5" />
                <span className={`absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ${isDark ? 'ring-[#1a1f2e]' : 'ring-white'}`}></span>
              </button>

              {/* Messages */}
              <Link
                href="/kurs-sahibi/mesajlar"
                className={`p-2.5 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'} rounded-xl transition-colors`}
              >
                <MessageSquare className="w-5 h-5" />
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 p-1.5 ml-1 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-xl transition-colors`}
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {user?.ad?.charAt(0)}
                  </div>
                  <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-400'} hidden sm:block transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className={`absolute right-0 top-14 w-64 ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} border rounded-2xl shadow-xl z-50 overflow-hidden`}>
                    <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                      <p className="font-semibold">{user?.ad} {user?.soyad}</p>
                      <p className="text-sm text-white/80">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/kurs-sahibi/ayarlar"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-800/50' : 'text-slate-700 hover:bg-slate-50'} rounded-xl transition-colors`}
                      >
                        <Settings className="w-4 h-4" />
                        {t('header.accountSettings')}
                      </Link>
                      <hr className={`my-2 ${isDark ? 'border-slate-700/50' : ''}`} />
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'} rounded-xl transition-colors`}
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
          {/* Welcome Section */}
          <div className="mb-6">
            <TTSWrapper 
              text={t('tts.welcomeMessage', { 
                name: user?.ad || '', 
                courseName: kursInfo?.ad || t('title')
              })}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/10 rounded-full translate-y-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-8 h-8" />
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    {kursInfo?.ad || t('title')} - {t('title')} {user?.ad}
                  </h2>
                </div>
                <p className="text-white/80">{t('welcome.subtitle')}</p>
              </div>
            </TTSWrapper>
          </div>

          {/* Kurs Bilgileri Kartı */}
          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl p-5 border mb-6`}>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
              <Building2 className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
              {t('courseInfo.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Building className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('courseInfo.name')}</span>
                </div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{kursInfo?.ad || '-'}</p>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('courseInfo.address')}</span>
                </div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{kursInfo?.adres || '-'}</p>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('courseInfo.phone')}</span>
                </div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{kursInfo?.telefon || '-'}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <TTSStatCard 
              label={t('stats.totalStudents')} 
              value={stats?.toplamOgrenci || 0} 
              unit={t('stats.student')}
              description={t('tts.totalStudentsDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-green-500/50' : 'bg-white border-slate-100 hover:border-green-200 hover:shadow-lg hover:shadow-green-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>{t('stats.student')}</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.toplamOgrenci || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-green-500/20' : 'shadow-green-200'} group-hover:scale-110 transition-transform`}>
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>
            </TTSStatCard>

            <TTSStatCard 
              label={t('stats.totalTeachers')} 
              value={stats?.toplamOgretmen || 0} 
              unit={t('stats.teacher')}
              description={t('tts.totalTeachersDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-blue-500/50' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>{t('stats.teacher')}</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.toplamOgretmen || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-blue-500/20' : 'shadow-blue-200'} group-hover:scale-110 transition-transform`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </TTSStatCard>

            <TTSStatCard 
              label={t('stats.totalClasses')} 
              value={stats?.toplamSinif || 0} 
              unit={t('stats.class')}
              description={t('tts.totalClassesDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-purple-500/50' : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>{t('stats.class')}</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.toplamSinif || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-purple-500/20' : 'shadow-purple-200'} group-hover:scale-110 transition-transform`}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </TTSStatCard>

            <TTSStatCard 
              label={t('stats.totalManagers')} 
              value={stats?.toplamMudur || mudurler.length} 
              unit={t('stats.manager')}
              description={t('tts.totalManagersDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-amber-500/50' : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>{t('stats.manager')}</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.toplamMudur || mudurler.length}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-amber-500/20' : 'shadow-amber-200'} group-hover:scale-110 transition-transform`}>
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </TTSStatCard>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <TTSCard
              title={t('quickActions.assignManager')}
              description={t('tts.assignManagerDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-blue-500/50' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer`}
            >
              <Link href="/kurs-sahibi/mudurler" className="block">
                <div className={`w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-blue-500/20' : 'shadow-blue-200'} group-hover:scale-110 transition-transform`}>
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{t('quickActions.assignManager')}</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>{t('quickActions.newManager')}</p>
              </Link>
            </TTSCard>

            <TTSCard
              title={t('quickActions.viewFinancials')}
              description={t('tts.viewFinancialsDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-emerald-500/50' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer`}
            >
              <Link href="/kurs-sahibi/finansal-raporlar" className="block">
                <div className={`w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-emerald-500/20' : 'shadow-emerald-200'} group-hover:scale-110 transition-transform`}>
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{t('quickActions.viewFinancials')}</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>{t('quickActions.incomeExpense')}</p>
              </Link>
            </TTSCard>

            <TTSCard
              title={t('quickActions.viewReports')}
              description={t('tts.viewReportsDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-purple-500/50' : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer`}
            >
              <Link href="/kurs-sahibi/finansal-raporlar" className="block">
                <div className={`w-11 h-11 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-purple-500/20' : 'shadow-purple-200'} group-hover:scale-110 transition-transform`}>
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{t('quickActions.viewReports')}</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>{t('quickActions.analysis')}</p>
              </Link>
            </TTSCard>

            <TTSCard
              title={t('quickActions.courseSettings')}
              description={t('tts.courseSettingsDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-amber-500/50' : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer`}
            >
              <Link href="/kurs-sahibi/ayarlar" className="block">
                <div className={`w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-amber-500/20' : 'shadow-amber-200'} group-hover:scale-110 transition-transform`}>
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{t('quickActions.courseSettings')}</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>{t('quickActions.settings')}</p>
              </Link>
            </TTSCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Atanmış Müdürler */}
            <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden`}>
              <TTSWrapper 
                text={t('managers.managerList')}
                className={`p-5 border-b ${isDark ? 'border-slate-700/50 bg-gradient-to-r from-blue-500/10 to-indigo-500/10' : 'border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50'} flex items-center justify-between cursor-pointer`}
              >
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                  <UserCheck className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                  {t('managers.title')}
                </h3>
                <Link href="/kurs-sahibi/mudurler" className={`text-sm ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} font-medium`}>
                  {t('managers.viewAll')} →
                </Link>
              </TTSWrapper>
              <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-50'}`}>
                {mudurler.length > 0 ? (
                  mudurler.map((mudur) => (
                    <TTSWrapper 
                      key={mudur.id} 
                      text={`${t('stats.manager')}: ${mudur.ad} ${mudur.soyad}`}
                      className={`p-4 flex items-center justify-between ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors cursor-pointer`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} ${isDark ? 'text-blue-400' : 'text-blue-600'} font-medium text-sm`}>
                          {mudur.ad?.charAt(0)}{mudur.soyad?.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{mudur.ad} {mudur.soyad}</p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{mudur.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${mudur.aktif 
                        ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                        : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                      }`}>
                        {mudur.aktif ? t('managers.active') : t('managers.passive')}
                      </span>
                    </TTSWrapper>
                  ))
                ) : (
                  <TTSWrapper 
                    text={t('tts.noManagersDesc')}
                    className="p-8 text-center cursor-pointer"
                  >
                    <div className={`w-16 h-16 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                      <UserCheck className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>{t('managers.noManagers')}</p>
                    <Link href="/kurs-sahibi/mudurler" className="text-blue-500 text-sm mt-2 inline-block hover:underline">
                      {t('managers.assignManager')} →
                    </Link>
                  </TTSWrapper>
                )}
              </div>
            </div>

            {/* Hızlı İşlemler Panel */}
            <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden`}>
              <TTSWrapper 
                text={t('tts.ownerActionsDesc')}
                className={`p-5 border-b ${isDark ? 'border-slate-700/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10' : 'border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50'} cursor-pointer`}
              >
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>👑 {t('ownerActions.title')}</h3>
              </TTSWrapper>
              <div className="p-4 space-y-3">
                <TTSCard
                  title={t('ownerActions.managerManagement')}
                  description={t('tts.managerManagerDesc')}
                  className={`flex items-center gap-4 p-4 ${isDark ? 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20' : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-100'} rounded-xl transition-all border group cursor-pointer`}
                >
                  <Link href="/kurs-sahibi/mudurler" className="flex items-center gap-4 w-full">
                    <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-blue-500/20' : 'shadow-blue-200'} group-hover:scale-110 transition-transform`}>
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>{t('ownerActions.managerManagement')}</p>
                      <p className={`text-sm ${isDark ? 'text-blue-400/70' : 'text-blue-600'}`}>{t('ownerActions.managerManagementDesc')}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-400'}`} />
                  </Link>
                </TTSCard>

                <TTSCard
                  title={t('ownerActions.financialReports')}
                  description={t('ownerActions.financialReportsDesc')}
                  className={`flex items-center gap-4 p-4 ${isDark ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20' : 'bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border-emerald-100'} rounded-xl transition-all border group cursor-pointer`}
                >
                  <Link href="/kurs-sahibi/finansal-raporlar" className="flex items-center gap-4 w-full">
                    <div className={`w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-emerald-500/20' : 'shadow-emerald-200'} group-hover:scale-110 transition-transform`}>
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-900'}`}>{t('ownerActions.financialReports')}</p>
                      <p className={`text-sm ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>{t('ownerActions.financialReportsDesc')}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-400'}`} />
                  </Link>
                </TTSCard>

                <TTSCard
                  title={t('ownerActions.courseSettings')}
                  description={t('ownerActions.courseSettingsDesc')}
                  className={`flex items-center gap-4 p-4 ${isDark ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20' : 'bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-amber-100'} rounded-xl transition-all border group cursor-pointer`}
                >
                  <Link href="/kurs-sahibi/ayarlar" className="flex items-center gap-4 w-full">
                    <div className={`w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-amber-500/20' : 'shadow-amber-200'} group-hover:scale-110 transition-transform`}>
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>{t('ownerActions.courseSettings')}</p>
                      <p className={`text-sm ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>{t('ownerActions.courseSettingsDesc')}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-400'}`} />
                  </Link>
                </TTSCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Ana export - RoleGuard ile sarmalanmış
export default function KursSahibiDashboard() {
  return (
    <RoleGuard allowedRoles={['kursSahibi']}>
      <KursSahibiDashboardContent />
    </RoleGuard>
  );
}

