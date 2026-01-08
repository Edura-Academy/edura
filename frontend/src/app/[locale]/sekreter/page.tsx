'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// useLocale RTL için kaldırıldı
import {
  Users,
  GraduationCap,
  CreditCard,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  UserPlus,
  FileText,
  ClipboardList,
  ChevronRight,
  Clock,
  AlertCircle,
  Wallet,
  Search,
  Home,
  Menu,
  X,
  ChevronDown,
  CalendarCheck,
  TrendingUp,
  BadgeDollarSign,
  UserCheck,
  Phone,
  Mail,
  Building2,
  BarChart3,
  HelpCircle,
  Calendar,
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
  bekleyenOdemeler: number;
  bugunDevamsiz: number;
  yeniKayitlar: number;
  aylikTahsilat: number;
  aktifSinif: number;
}

interface BekleyenOdeme {
  id: string;
  ogrenciAd: string;
  tutar: number;
  vadeTarihi: string;
  gecikmeGun?: number;
}

interface SonKayit {
  id: string;
  ad: string;
  soyad: string;
  sinif: string;
  kayitTarihi: string;
}

// Sidebar menü öğeleri
const menuItems = [
  { 
    id: 'ana-sayfa', 
    label: 'Ana Sayfa', 
    icon: Home, 
    href: '/sekreter',
    color: 'from-teal-500 to-teal-600'
  },
  { 
    id: 'ogrenciler', 
    label: 'Öğrenci Yönetimi', 
    icon: GraduationCap, 
    href: '/sekreter/ogrenciler',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    id: 'odemeler', 
    label: 'Ödeme Takibi', 
    icon: Wallet, 
    href: '/sekreter/odemeler',
    color: 'from-emerald-500 to-emerald-600'
  },
  { 
    id: 'yoklama', 
    label: 'Yoklama', 
    icon: ClipboardList, 
    href: '/sekreter/yoklama',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    id: 'sinav-sonuclari', 
    label: 'Sınav Sonuçları', 
    icon: BarChart3, 
    href: '/sekreter/sinav-sonuclari',
    color: 'from-orange-500 to-orange-600'
  },
  { 
    id: 'duyurular', 
    label: 'Duyurular', 
    icon: Bell, 
    href: '/sekreter/duyurular',
    color: 'from-rose-500 to-rose-600'
  },
  { 
    id: 'mesajlar', 
    label: 'Mesajlar', 
    icon: MessageSquare, 
    href: '/sekreter/mesajlar',
    color: 'from-indigo-500 to-indigo-600'
  },
  { 
    id: 'ayarlar', 
    label: 'Ayarlar', 
    icon: Settings, 
    href: '/sekreter/ayarlar',
    color: 'from-slate-500 to-slate-600'
  },
];

function SekreterDashboardContent() {
  const { user, token, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { ttsEnabled, speak, stop } = useAccessibility();
  const [stats, setStats] = useState<Stats | null>(null);
  const [bekleyenOdemeler, setBekleyenOdemeler] = useState<BekleyenOdeme[]>([]);
  const [sonKayitlar, setSonKayitlar] = useState<SonKayit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);
  
  // RTL layout kaldırıldı - sadece içerik çevirisi
  
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
      // İstatistikleri al
      const statsRes = await fetch(`${API_URL}/users/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats({
            toplamOgrenci: statsData.data.toplamOgrenci || 0,
            bekleyenOdemeler: 0, // API'den gelecek
            bugunDevamsiz: 0, // API'den gelecek
            yeniKayitlar: statsData.data.toplamOgrenci || 0, // Bu ay kayıtlı
            aylikTahsilat: 0, // API'den gelecek
            aktifSinif: statsData.data.toplamSinif || 0
          });
        }
      }

      // Mock bekleyen ödemeler
      setBekleyenOdemeler([
        { id: '1', ogrenciAd: 'Ahmet Yılmaz', tutar: 2500, vadeTarihi: '2026-01-15', gecikmeGun: 0 },
        { id: '2', ogrenciAd: 'Ayşe Demir', tutar: 1800, vadeTarihi: '2026-01-10', gecikmeGun: 2 },
        { id: '3', ogrenciAd: 'Mehmet Kaya', tutar: 3200, vadeTarihi: '2026-01-20', gecikmeGun: 0 },
      ]);

      // Mock son kayıtlar
      setSonKayitlar([
        { id: '1', ad: 'Zeynep', soyad: 'Özkan', sinif: '11-A', kayitTarihi: '2026-01-07' },
        { id: '2', ad: 'Can', soyad: 'Yıldız', sinif: '10-B', kayitTarihi: '2026-01-06' },
        { id: '3', ad: 'Elif', soyad: 'Şahin', sinif: '9-A', kayitTarihi: '2026-01-05' },
      ]);

    } catch (error) {
      console.error('Veri alınamadı:', error);
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
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isActive = (href: string) => {
    if (href === '/sekreter') {
      return pathname === '/sekreter' || pathname === '/tr/sekreter' || pathname === '/en/sekreter';
    }
    return pathname?.includes(href.replace('/sekreter', ''));
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-slate-50 via-white to-teal-50'} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Building2 className="w-8 h-8 text-white" />
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

      {/* Sidebar */}
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
          <Link href="/sekreter" className={`flex items-center gap-3 `}>
            <img 
              src={isDark ? "/logos/Edura-logo-dark-2.png" : "/logos/Edura-logo-nobg.png"} 
              alt="Edura Logo" 
              className="w-10 h-10 object-contain"
            />
            {sidebarOpen && (
              <div className={`overflow-hidden `}>
                <h1 className="text-lg font-bold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">Edura</h1>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium -mt-0.5`}>Sekreter Paneli</p>
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
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]" role="menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                {...ttsHandlers(`${item.label}${active ? ', şu an bu sayfadasınız' : ' sayfasına git'}`)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative                   ${active 
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
                aria-current={active ? 'page' : undefined}
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
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>Sekreter</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
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
                  placeholder="Öğrenci ara..." 
                  className={`bg-transparent text-sm ${isDark ? 'text-slate-200 placeholder-slate-500' : 'text-slate-600 placeholder-slate-400'} outline-none w-full `}
                />
              </div>
            </div>

            {/* Right - Actions */}
            <div className={`flex items-center gap-2 `}>
              {/* Quick Add Button */}
              <Link
                href="/sekreter/ogrenciler?action=yeni"
                className={`hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 `}
              >
                <UserPlus className="w-4 h-4" />
                <span>Yeni Kayıt</span>
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
                href="/sekreter/mesajlar"
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
                        href="/sekreter/ayarlar"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-800/50' : 'text-slate-700 hover:bg-slate-50'} rounded-xl transition-colors `}
                      >
                        <Settings className="w-4 h-4" />
                        Hesap Ayarları
                      </Link>
                      <hr className={`my-2 ${isDark ? 'border-slate-700/50' : ''}`} />
                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'} rounded-xl transition-colors `}
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
          {/* Welcome Section */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className={`absolute top-0 right-0 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2`}></div>
              <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/10 rounded-full translate-y-1/2"></div>
              <div className={`relative `}>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Hoş Geldiniz, {user?.ad}! 📋</h2>
                <p className="text-white/80">Günlük işlemlerinizi buradan yönetebilirsiniz.</p>
              </div>
            </div>
          </div>

          {/* Stats Cards - TTS Destekli */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <TTSStatCard label="Toplam Öğrenci" value={stats?.toplamOgrenci || 0} unit="öğrenci" className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-green-500/50' : 'bg-white border-slate-100 hover:border-green-200 hover:shadow-lg hover:shadow-green-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}>
              <div className={`flex items-center justify-between `}>
                <div className="">
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>Toplam Öğrenci</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.toplamOgrenci || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-green-500/20' : 'shadow-green-200'} group-hover:scale-110 transition-transform`}>
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>
            </TTSStatCard>

            <TTSStatCard label="Bekleyen Ödeme" value={bekleyenOdemeler.length} unit="adet" className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-amber-500/50' : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}>
              <div className={`flex items-center justify-between `}>
                <div className="">
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>Bekleyen Ödeme</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{bekleyenOdemeler.length}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-amber-500/20' : 'shadow-amber-200'} group-hover:scale-110 transition-transform`}>
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </TTSStatCard>

            <TTSStatCard label="Bugün Devamsız" value={stats?.bugunDevamsiz || 0} unit="öğrenci" className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-red-500/50' : 'bg-white border-slate-100 hover:border-red-200 hover:shadow-lg hover:shadow-red-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}>
              <div className={`flex items-center justify-between `}>
                <div className="">
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>Bugün Devamsız</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.bugunDevamsiz || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-red-500/20' : 'shadow-red-200'} group-hover:scale-110 transition-transform`}>
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </TTSStatCard>

            <TTSStatCard label="Aktif Sınıf" value={stats?.aktifSinif || 0} unit="sınıf" className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-blue-500/50' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50'} rounded-2xl p-5 border transition-all group cursor-pointer`}>
              <div className={`flex items-center justify-between `}>
                <div className="">
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wide`}>Aktif Sınıf</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>{stats?.aktifSinif || 0}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-blue-500/20' : 'shadow-blue-200'} group-hover:scale-110 transition-transform`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </TTSStatCard>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <Link href="/sekreter/ogrenciler?action=yeni" className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-blue-500/50' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer block `}>
              <div className={`w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-blue-500/20' : 'shadow-blue-200'} group-hover:scale-110 transition-transform `}>
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>Yeni Öğrenci</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Öğrenci kaydı</p>
            </Link>

            <Link href="/sekreter/odemeler?action=al" className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-emerald-500/50' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer block `}>
              <div className={`w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-emerald-500/20' : 'shadow-emerald-200'} group-hover:scale-110 transition-transform `}>
                <BadgeDollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>Ödeme Al</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Tahsilat yap</p>
            </Link>

            <Link href="/sekreter/yoklama" className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-purple-500/50' : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer block `}>
              <div className={`w-11 h-11 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-purple-500/20' : 'shadow-purple-200'} group-hover:scale-110 transition-transform `}>
                <CalendarCheck className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>Yoklama</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Günlük yoklama</p>
            </Link>

            <Link href="/sekreter/mesajlar?action=veli" className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-indigo-500/50' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer block `}>
              <div className={`w-11 h-11 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-indigo-500/20' : 'shadow-indigo-200'} group-hover:scale-110 transition-transform `}>
                <Phone className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>Veli İletişim</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Mesaj gönder</p>
            </Link>

            <Link href="/sekreter/sinav-sonuclari" className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-orange-500/50' : 'bg-white border-slate-100 hover:border-orange-200 hover:shadow-lg'} rounded-2xl p-4 border transition-all group cursor-pointer block `}>
              <div className={`w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-3 shadow-lg ${isDark ? 'shadow-orange-500/20' : 'shadow-orange-200'} group-hover:scale-110 transition-transform `}>
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>Sınav Sonuçları</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>Giriş yap</p>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bekleyen Ödemeler */}
            <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden`}>
              <div className={`p-5 border-b ${isDark ? 'border-slate-700/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10' : 'border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50'} flex items-center justify-between `}>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2 `}>
                  <Clock className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                  Yaklaşan Ödemeler
                </h3>
                <Link href="/sekreter/odemeler" className={`text-sm ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'} font-medium`}>
                  Tümünü Gör →
                </Link>
              </div>
              <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-50'}`}>
                {bekleyenOdemeler.length > 0 ? (
                  bekleyenOdemeler.map((odeme) => (
                    <div key={odeme.id} className={`p-4 flex items-center justify-between ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors `}>
                      <div className={`flex items-center gap-3 `}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          odeme.gecikmeGun && odeme.gecikmeGun > 0 
                            ? 'bg-red-100 text-red-600' 
                            : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                        } font-medium text-sm`}>
                          {odeme.ogrenciAd.charAt(0)}
                        </div>
                        <div className="">
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{odeme.ogrenciAd}</p>
                          <p className={`text-xs ${odeme.gecikmeGun && odeme.gecikmeGun > 0 ? 'text-red-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {odeme.gecikmeGun && odeme.gecikmeGun > 0 
                              ? `${odeme.gecikmeGun} gün gecikmiş` 
                              : `Vade: ${formatDate(odeme.vadeTarihi)}`
                            }
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 `}>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(odeme.tutar)}</span>
                        <button className={`px-3 py-1.5 text-xs font-medium rounded-lg ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'} transition-colors`}>
                          Tahsil Et
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className={`w-16 h-16 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                      <Wallet className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>Bekleyen ödeme bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>

            {/* Son Kayıtlar */}
            <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden`}>
              <div className={`p-5 border-b ${isDark ? 'border-slate-700/50 bg-gradient-to-r from-blue-500/10 to-indigo-500/10' : 'border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50'} flex items-center justify-between `}>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2 `}>
                  <UserCheck className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                  Son Kayıtlar
                </h3>
                <Link href="/sekreter/ogrenciler" className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} font-medium`}>
                  Tümünü Gör →
                </Link>
              </div>
              <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-50'}`}>
                {sonKayitlar.length > 0 ? (
                  sonKayitlar.map((kayit) => (
                    <div key={kayit.id} className={`p-4 flex items-center justify-between ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors `}>
                      <div className={`flex items-center gap-3 `}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} font-medium text-sm`}>
                          {kayit.ad.charAt(0)}{kayit.soyad.charAt(0)}
                        </div>
                        <div className="">
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'} text-sm`}>{kayit.ad} {kayit.soyad}</p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{kayit.sinif} • {formatDate(kayit.kayitTarihi)}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'} `} />
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className={`w-16 h-16 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                      <Users className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>Son kayıt bulunmuyor</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bugünkü Takvim */}
          <div className={`mt-6 ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden`}>
            <div className={`p-5 border-b ${isDark ? 'border-slate-700/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10' : 'border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50'} flex items-center justify-between `}>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2 `}>
                <Calendar className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                Bugünkü Görevler
              </h3>
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} `}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Yoklama Al</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>09:00 - 10:00</p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} `}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Ödeme Takibi</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>3 bekleyen ödeme</p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} `}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Veli Araması</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>2 bekleyen arama</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Ana export - RoleGuard ile sarmalanmış
export default function SekreterDashboard() {
  return (
    <RoleGuard allowedRoles={['sekreter']}>
      <SekreterDashboardContent />
    </RoleGuard>
  );
}
