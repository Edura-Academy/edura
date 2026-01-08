'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
// useLocale RTL için kaldırıldı
import {
  Users,
  GraduationCap,
  BookOpen,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  TrendingUp,
  UserPlus,
  ClipboardList,
  ChevronRight,
  Building,
  UserCheck,
  BarChart3,
  Megaphone,
  HelpCircle,
  LifeBuoy,
  Home,
  Menu,
  X,
  ChevronDown,
  Search,
  FileText,
  Calendar,
  Target,
  Award,
  PieChart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAccessibility } from '@/contexts/AccessibilityContext';
// rtlLocales kaldırıldı - sadece içerik çevirisi
import { 
  TTSStatCard, 
  TTSMenuItem, 
  TTSCard, 
  TTSWrapper,
  TTSListItem,
  TTSButton,
  TTSLink
} from '@/components/accessibility';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Stats {
  toplamOgrenci: number;
  toplamOgretmen: number;
  toplamSekreter: number;
  toplamSinif: number;
}

interface RecentUser {
  id: string;
  ad: string;
  soyad: string;
  role: string;
  createdAt: string;
}

// Sidebar menü öğeleri - labelKey kullanarak çeviri destekli
const menuItems = [
  { 
    id: 'ana-sayfa', 
    labelKey: 'homePage', 
    icon: Home, 
    href: '/mudur',
    color: 'from-teal-500 to-teal-600'
  },
  { 
    id: 'kullanicilar', 
    labelKey: 'userManagement', 
    icon: Users, 
    href: '/mudur/kullanicilar',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    id: 'siniflar', 
    labelKey: 'classManagement', 
    icon: BookOpen, 
    href: '/mudur/siniflar',
    color: 'from-emerald-500 to-emerald-600'
  },
  { 
    id: 'deneme-sinavlari', 
    labelKey: 'mockExams', 
    icon: FileText, 
    href: '/mudur/deneme-sinavlari',
    color: 'from-purple-500 to-purple-600',
    badgeKey: 'new'
  },
  { 
    id: 'raporlar', 
    labelKey: 'reports', 
    icon: BarChart3, 
    href: '/mudur/raporlar',
    color: 'from-amber-500 to-amber-600'
  },
  { 
    id: 'duyurular', 
    labelKey: 'announcements', 
    icon: Bell, 
    href: '/mudur/duyurular',
    color: 'from-rose-500 to-rose-600'
  },
  { 
    id: 'mesajlar', 
    labelKey: 'messages', 
    icon: MessageSquare, 
    href: '/mudur/mesajlar',
    color: 'from-indigo-500 to-indigo-600'
  },
  { 
    id: 'sistem-duyurulari', 
    labelKey: 'systemAnnouncements', 
    icon: Megaphone, 
    href: '/mudur/sistem-duyurulari',
    color: 'from-violet-500 to-violet-600'
  },
  { 
    id: 'destek', 
    labelKey: 'support', 
    icon: LifeBuoy, 
    href: '/mudur/destek',
    color: 'from-cyan-500 to-cyan-600'
  },
  { 
    id: 'yardim', 
    labelKey: 'helpCenter', 
    icon: HelpCircle, 
    href: '/mudur/yardim',
    color: 'from-gray-500 to-gray-600'
  },
];

function MudurDashboardContent() {
  const { user, token, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);
  
  // Çeviri desteği (RTL layout kaldırıldı - sadece içerik çevirisi)
  const t = useTranslations('manager');

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
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/users/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users?aktif=true`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (usersData.success) {
        setRecentUsers(usersData.data.slice(0, 5));
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

  const getRoleLabel = (role: string) => {
    const roleKeys: Record<string, string> = {
      ogretmen: 'teacher',
      sekreter: 'secretary',
      ogrenci: 'student',
      veli: 'parent',
    };
    const key = roleKeys[role];
    return key ? t(`roles.${key}`) : role;
  };

  const getRoleColor = (role: string, isDark: boolean) => {
    if (isDark) {
      const colors: Record<string, string> = {
        ogretmen: 'bg-blue-500/20 text-blue-400',
        sekreter: 'bg-purple-500/20 text-purple-400',
        ogrenci: 'bg-green-500/20 text-green-400',
        veli: 'bg-amber-500/20 text-amber-400',
      };
      return colors[role] || 'bg-slate-500/20 text-slate-400';
    }
    const colors: Record<string, string> = {
      ogretmen: 'bg-blue-100 text-blue-700',
      sekreter: 'bg-purple-100 text-purple-700',
      ogrenci: 'bg-green-100 text-green-700',
      veli: 'bg-amber-100 text-amber-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const isActive = (href: string) => {
    if (href === '/mudur') {
      return pathname === '/mudur' || pathname === '/tr/mudur' || pathname === '/en/mudur';
    }
    return pathname?.includes(href.replace('/mudur', ''));
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-slate-50 via-white to-teal-50'} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Building className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-slate-50 via-white to-teal-50/30'}`}>
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - RTL desteği */}
      <aside className={`fixed top-0 h-full ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200/80'} z-50 transition-all duration-300 shadow-xl lg:shadow-none
        left-0 border-r
        ${mobileSidebarOpen 
          ? 'translate-x-0' 
          : '-translate-x-full lg:translate-x-0'
        }
        ${sidebarOpen ? 'w-64' : 'w-20'}
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center justify-between px-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
          <Link href="/mudur" className={`flex items-center gap-3 `}>
            <img 
              src={isDark ? "/logos/Edura-logo-dark-2.png" : "/logos/Edura-logo-nobg.png"} 
              alt="Edura Logo" 
              className="w-10 h-10 object-contain"
            />
            {sidebarOpen && (
              <div className={`overflow-hidden `}>
                <h1 className="text-lg font-bold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">Edura</h1>
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

        {/* Menu Items - Sesli Okuma Destekli */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]" role="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const label = t(`menu.${item.labelKey}`);
            const badge = item.badgeKey ? t(`menu.${item.badgeKey}`) : undefined;
            const ttsText = active 
              ? `${label}, ${t('tts.currentPage')}` 
              : `${label} ${t('tts.goToPage')}${badge ? `, ${badge}` : ''}`;
            return (
              <TTSMenuItem
                key={item.id}
                text={ttsText}
                href={item.href}
                isActive={active}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative                   ${active 
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
                  <>
                    <span className="font-medium text-sm">{label}</span>
                    {badge && (
                      <span className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        active ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                      }`}>
                        {badge}
                      </span>
                    )}
                  </>
                )}
                {!sidebarOpen && badge && (
                  <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse`} />
                )}
              </TTSMenuItem>
            );
          })}
        </nav>

        {/* User Profile - Bottom */}
        {sidebarOpen && (
          <div className={`absolute bottom-0 left-0 right-0 p-3 border-t ${isDark ? 'border-slate-700/50 bg-[#1a1f2e]' : 'border-slate-100 bg-white'}`}>
            <div className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} `}>
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user?.ad?.charAt(0)}
              </div>
              <div className={`flex-1 min-w-0 `}>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{user?.ad} {user?.soyad}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>{t('institutionManager')}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content - RTL desteği */}
      <div className={`transition-all duration-300 ${
sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
      }`}>
        {/* Top Header */}
        <header className={`sticky top-0 z-30 ${isDark ? 'bg-[#1a1f2e]/80 border-slate-700/50' : 'bg-white/80 border-slate-200/80'} backdrop-blur-md border-b`}>
          <div className={`flex items-center justify-between h-16 px-4 lg:px-6 `}>
            {/* Left - Mobile Menu & Search */}
            <div className={`flex items-center gap-3 `}>
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className={`p-2 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-xl lg:hidden`}
              >
                <Menu className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </button>
              <div className={`hidden md:flex items-center gap-2 ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'} rounded-xl px-4 py-2 w-72 `}>
                <Search className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input 
                  type="text" 
                  placeholder={t('header.search')} 
                  className={`bg-transparent text-sm ${isDark ? 'text-slate-200 placeholder-slate-500' : 'text-slate-600 placeholder-slate-400'} outline-none w-full `}
                />
              </div>
            </div>

            {/* Right - Actions */}
            <div className={`flex items-center gap-2 `}>
              {/* Quick Add */}
              <Link
                href="/mudur/deneme-sinavlari"
                className={`hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 `}
              >
                <FileText className="w-4 h-4" />
                <span>{t('header.mockExams')}</span>
              </Link>

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
                href="/mudur/mesajlar"
                className={`p-2.5 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'} rounded-xl transition-colors`}
              >
                <MessageSquare className="w-5 h-5" />
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 p-1.5 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-xl transition-colors ml-1`}
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {user?.ad?.charAt(0)}
                  </div>
                  <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-400'} hidden sm:block transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className={`absolute right-0 top-14 w-64 ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} border rounded-2xl shadow-xl z-50 overflow-hidden`}>
                    <div className={`p-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white `}>
                      <p className="font-semibold">{user?.ad} {user?.soyad}</p>
                      <p className="text-sm text-white/80">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/mudur/ayarlar"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-800/50' : 'text-slate-700 hover:bg-slate-50'} rounded-xl transition-colors `}
                      >
                        <Settings className="w-4 h-4" />
                        {t('header.accountSettings')}
                      </Link>
                      <hr className={`my-2 ${isDark ? 'border-slate-700/50' : ''}`} />
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'} rounded-xl transition-colors `}
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
          {/* Welcome Section - Sesli Okuma Destekli */}
          <div className="mb-6">
            <TTSWrapper 
              text={t('tts.welcomeMessage', { 
                name: user?.ad || '', 
                students: stats?.toplamOgrenci || 0,
                teachers: stats?.toplamOgretmen || 0,
                secretaries: stats?.toplamSekreter || 0,
                classes: stats?.toplamSinif || 0
              })}
              className="bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer"
            >
              <div className={`absolute top-0 right-0 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2`}></div>
              <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/10 rounded-full translate-y-1/2"></div>
              <div className={`relative `}>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">{t('welcome.title', { name: user?.ad || '' })} 🏫</h2>
                <p className="text-white/80">{t('welcome.subtitle')}</p>
              </div>
            </TTSWrapper>
          </div>

          {/* Stats Cards - Sesli Okuma Destekli */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <TTSStatCard 
              label={t('stats.totalStudents')} 
              value={stats?.toplamOgrenci || 0} 
              unit={t('stats.student')}
              description={t('stats.activeStudents')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-green-500/50' : 'bg-white border-slate-100 hover:border-green-200 hover:shadow-lg hover:shadow-green-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}
            >
              <div className={`flex items-center justify-between `}>
                <div className="">
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
              description={t('stats.activeTeachers')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-blue-500/50' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}
            >
              <div className={`flex items-center justify-between `}>
                <div className="">
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>{t('stats.teacher')}</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.toplamOgretmen || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-blue-500/20' : 'shadow-blue-200'} group-hover:scale-110 transition-transform`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </TTSStatCard>

            <TTSStatCard 
              label={t('stats.totalSecretaries')} 
              value={stats?.toplamSekreter || 0} 
              unit={t('stats.secretary')}
              description={t('stats.activeSecretaries')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-purple-500/50' : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}
            >
              <div className={`flex items-center justify-between `}>
                <div className="">
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>{t('stats.secretary')}</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.toplamSekreter || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-purple-500/20' : 'shadow-purple-200'} group-hover:scale-110 transition-transform`}>
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </TTSStatCard>

            <TTSStatCard 
              label={t('stats.totalClasses')} 
              value={stats?.toplamSinif || 0} 
              unit={t('stats.class')}
              description={t('stats.activeClasses')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-amber-500/50' : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}
            >
              <div className={`flex items-center justify-between `}>
                <div className="">
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>{t('stats.class')}</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.toplamSinif || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-amber-500/20' : 'shadow-amber-200'} group-hover:scale-110 transition-transform`}>
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </TTSStatCard>
          </div>

          {/* Quick Actions - Sesli Okuma Destekli */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <TTSCard
              title={t('quickActions.addTeacher')}
              description={t('quickActions.addTeacherDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-blue-500/50' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer`}
            >
              <Link href="/mudur/kullanicilar?action=ekle&role=ogretmen" className={`block `}>
                <div className={`w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-blue-500/20' : 'shadow-blue-200'} group-hover:scale-110 transition-transform `}>
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{t('quickActions.addTeacher')}</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>{t('quickActions.newTeacher')}</p>
              </Link>
            </TTSCard>

            <TTSCard
              title={t('quickActions.createClass')}
              description={t('quickActions.createClassDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-emerald-500/50' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer`}
            >
              <Link href="/mudur/siniflar?action=yeni" className={`block `}>
                <div className={`w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-emerald-500/20' : 'shadow-emerald-200'} group-hover:scale-110 transition-transform `}>
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{t('quickActions.createClass')}</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>{t('quickActions.newClass')}</p>
              </Link>
            </TTSCard>

            <TTSCard
              title={t('quickActions.mockExam')}
              description={t('quickActions.mockExamDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-purple-500/50' : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer`}
            >
              <Link href="/mudur/deneme-sinavlari?action=yeni" className={`block `}>
                <div className={`w-11 h-11 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-purple-500/20' : 'shadow-purple-200'} group-hover:scale-110 transition-transform `}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{t('quickActions.mockExam')}</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>{t('quickActions.createTytAyt')}</p>
              </Link>
            </TTSCard>

            <TTSCard
              title={t('quickActions.publishAnnouncement')}
              description={t('quickActions.publishAnnouncementDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-amber-500/50' : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer`}
            >
              <Link href="/mudur/duyurular?action=yeni" className={`block `}>
                <div className={`w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-amber-500/20' : 'shadow-amber-200'} group-hover:scale-110 transition-transform `}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{t('quickActions.publishAnnouncement')}</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>{t('quickActions.toAllStaff')}</p>
              </Link>
            </TTSCard>

            <TTSCard
              title={t('quickActions.reports')}
              description={t('quickActions.reportsDesc')}
              className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-teal-500/50' : 'bg-white border-slate-100 hover:border-teal-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer`}
            >
              <Link href="/mudur/raporlar" className={`block `}>
                <div className={`w-11 h-11 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-teal-500/20' : 'shadow-teal-200'} group-hover:scale-110 transition-transform `}>
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{t('quickActions.reports')}</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>{t('quickActions.performanceAnalysis')}</p>
              </Link>
            </TTSCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Son Eklenen Kullanıcılar - Sesli Okuma Destekli */}
            <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden`}>
              <TTSWrapper 
                text={t('recentUsers.description')}
                className={`p-5 border-b ${isDark ? 'border-slate-700/50 bg-gradient-to-r from-blue-500/10 to-indigo-500/10' : 'border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50'} flex items-center justify-between cursor-pointer `}
              >
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2 `}>
                  <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                  {t('recentUsers.title')}
                </h3>
                <Link href="/mudur/kullanicilar" className={`text-sm ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} font-medium`}>
                  {t('recentUsers.viewAll')} →
                </Link>
              </TTSWrapper>
              <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-50'}`}>
                {recentUsers.length > 0 ? (
                  recentUsers.map((u, index) => (
                    <TTSWrapper 
                      key={u.id} 
                      text={t('tts.userInfo', { index: index + 1, name: `${u.ad} ${u.soyad}`, role: getRoleLabel(u.role) })}
                      className={`p-4 flex items-center justify-between ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors cursor-pointer `}
                    >
                      <div className={`flex items-center gap-3 `}>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-200'} ${isDark ? 'text-slate-300' : 'text-slate-600'} font-medium text-sm`}>
                          {u.ad?.charAt(0)}{u.soyad?.charAt(0)}
                        </div>
                        <div className="">
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{u.ad} {u.soyad}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(u.role, isDark)}`}>
                            {getRoleLabel(u.role)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} `} />
                    </TTSWrapper>
                  ))
                ) : (
                  <TTSWrapper 
                    text={`${t('recentUsers.noUsers')}. ${t('tts.addUserHint')}`}
                    className="p-8 text-center cursor-pointer"
                  >
                    <div className={`w-16 h-16 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                      <Users className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>{t('recentUsers.noUsers')}</p>
                  </TTSWrapper>
                )}
              </div>
            </div>

            {/* Hızlı İşlemler Panel - Sesli Okuma Destekli */}
            <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden`}>
              <TTSWrapper 
                text={t('quickActionsPanel.description')}
                className={`p-5 border-b ${isDark ? 'border-slate-700/50 bg-gradient-to-r from-teal-500/10 to-emerald-500/10' : 'border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50'} cursor-pointer `}
              >
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>⚡ {t('quickActionsPanel.title')}</h3>
              </TTSWrapper>
              <div className="p-4 space-y-3">
                <TTSCard
                  title={t('quickActionsPanel.createMockExam')}
                  description={t('quickActionsPanel.createMockExamDesc')}
                  className={`flex items-center gap-4 p-4 ${isDark ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20' : 'bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border-purple-100'} rounded-xl transition-all border group cursor-pointer `}
                >
                  <Link href="/mudur/deneme-sinavlari?action=yeni" className={`flex items-center gap-4 w-full `}>
                    <div className={`w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-purple-500/20' : 'shadow-purple-200'} group-hover:scale-110 transition-transform`}>
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex-1 `}>
                      <p className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-900'}`}>{t('quickActionsPanel.createMockExam')}</p>
                      <p className={`text-sm ${isDark ? 'text-purple-400/70' : 'text-purple-600'}`}>{t('quickActionsPanel.createMockExamDesc')}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-400'} group-hover:translate-x-1 transition-transform `} />
                  </Link>
                </TTSCard>

                <TTSCard
                  title={t('quickActionsPanel.addNewTeacher')}
                  description={t('quickActionsPanel.addNewTeacherDesc')}
                  className={`flex items-center gap-4 p-4 ${isDark ? 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20' : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-100'} rounded-xl transition-all border group cursor-pointer `}
                >
                  <Link href="/mudur/kullanicilar?action=ekle&role=ogretmen" className={`flex items-center gap-4 w-full `}>
                    <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-blue-500/20' : 'shadow-blue-200'} group-hover:scale-110 transition-transform`}>
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex-1 `}>
                      <p className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>{t('quickActionsPanel.addNewTeacher')}</p>
                      <p className={`text-sm ${isDark ? 'text-blue-400/70' : 'text-blue-600'}`}>{t('quickActionsPanel.addNewTeacherDesc')}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-400'} group-hover:translate-x-1 transition-transform `} />
                  </Link>
                </TTSCard>

                <TTSCard
                  title={t('quickActionsPanel.performanceReports')}
                  description={t('quickActionsPanel.performanceReportsDesc')}
                  className={`flex items-center gap-4 p-4 ${isDark ? 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20' : 'bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 border-teal-100'} rounded-xl transition-all border group cursor-pointer `}
                >
                  <Link href="/mudur/raporlar" className={`flex items-center gap-4 w-full `}>
                    <div className={`w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-teal-500/20' : 'shadow-teal-200'} group-hover:scale-110 transition-transform`}>
                      <PieChart className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex-1 `}>
                      <p className={`font-semibold ${isDark ? 'text-teal-400' : 'text-teal-900'}`}>{t('quickActionsPanel.performanceReports')}</p>
                      <p className={`text-sm ${isDark ? 'text-teal-400/70' : 'text-teal-600'}`}>{t('quickActionsPanel.performanceReportsDesc')}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-teal-400'} group-hover:translate-x-1 transition-transform `} />
                  </Link>
                </TTSCard>

                <TTSCard
                  title={t('quickActions.publishAnnouncement')}
                  description={t('quickActionsPanel.publishAnnouncementDesc')}
                  className={`flex items-center gap-4 p-4 ${isDark ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20' : 'bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border-amber-100'} rounded-xl transition-all border group cursor-pointer `}
                >
                  <Link href="/mudur/duyurular?action=yeni" className={`flex items-center gap-4 w-full `}>
                    <div className={`w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-amber-500/20' : 'shadow-amber-200'} group-hover:scale-110 transition-transform`}>
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex-1 `}>
                      <p className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>{t('quickActions.publishAnnouncement')}</p>
                      <p className={`text-sm ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>{t('quickActionsPanel.publishAnnouncementDesc')}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-400'} group-hover:translate-x-1 transition-transform `} />
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
export default function MudurDashboard() {
  return (
    <RoleGuard allowedRoles={['mudur']}>
      <MudurDashboardContent />
    </RoleGuard>
  );
}
