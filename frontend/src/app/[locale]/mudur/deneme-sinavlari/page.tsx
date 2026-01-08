'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Users,
  GraduationCap,
  BookOpen,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
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
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  Upload,
  Target,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  Award,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface DenemeSinavi {
  id: string;
  ad: string;
  tur: 'TYT' | 'AYT' | 'LGS' | 'YDT' | 'KURUM_ICI';
  kurum: string | null;
  tarih: string;
  sinif?: { id: string; ad: string; seviye?: string };
  hedefSiniflar?: number[]; // Yeni: Sınıf seviyeleri (5, 6, 7, 8, 9, 10, 11, 12)
  olusturan: { id: string; ad: string; soyad: string };
  branslar: Record<string, number>;
  katilimciSayisi: number;
  aktif: boolean;
  aciklama?: string;
}

interface Sinif {
  id: string;
  ad: string;
  seviye?: string;
  ogrenciSayisi?: number;
}

interface BransTanim {
  ad: string;
  soruSayisi: number;
}

// Sidebar menü öğeleri
const menuItems = [
  { id: 'ana-sayfa', label: 'Ana Sayfa', icon: Home, href: '/mudur', color: 'from-teal-500 to-teal-600' },
  { id: 'kullanicilar', label: 'Kullanıcı Yönetimi', icon: Users, href: '/mudur/kullanicilar', color: 'from-blue-500 to-blue-600' },
  { id: 'siniflar', label: 'Sınıf Yönetimi', icon: BookOpen, href: '/mudur/siniflar', color: 'from-emerald-500 to-emerald-600' },
  { id: 'deneme-sinavlari', label: 'Deneme Sınavları', icon: FileText, href: '/mudur/deneme-sinavlari', color: 'from-purple-500 to-purple-600', badge: 'Yeni' },
  { id: 'raporlar', label: 'Raporlar', icon: BarChart3, href: '/mudur/raporlar', color: 'from-amber-500 to-amber-600' },
  { id: 'duyurular', label: 'Duyurular', icon: Bell, href: '/mudur/duyurular', color: 'from-rose-500 to-rose-600' },
  { id: 'mesajlar', label: 'Mesajlar', icon: MessageSquare, href: '/mudur/mesajlar', color: 'from-indigo-500 to-indigo-600' },
  { id: 'sistem-duyurulari', label: 'Sistem Duyuruları', icon: Megaphone, href: '/mudur/sistem-duyurulari', color: 'from-violet-500 to-violet-600' },
  { id: 'destek', label: 'Destek Talebi', icon: LifeBuoy, href: '/mudur/destek', color: 'from-cyan-500 to-cyan-600' },
  { id: 'yardim', label: 'Yardım Merkezi', icon: HelpCircle, href: '/mudur/yardim', color: 'from-gray-500 to-gray-600' },
];

const SINAV_TUR_RENKLERI: Record<string, string> = {
  TYT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  AYT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  LGS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  YDT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  KURUM_ICI: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400',
};

const SINAV_TUR_ACIKLAMA: Record<string, string> = {
  TYT: 'Temel Yeterlilik Testi',
  AYT: 'Alan Yeterlilik Testi',
  LGS: 'Liselere Geçiş Sınavı',
  YDT: 'Yabancı Dil Testi',
  KURUM_ICI: 'Kurum İçi Deneme',
};

// TYT Branş ve Soru Sayıları
const TYT_BRANSLAR = [
  { key: 'turkce', ad: 'Türkçe', soruSayisi: 40 },
  { key: 'sosyal', ad: 'Sosyal Bilimler', soruSayisi: 20 },
  { key: 'temelmat', ad: 'Temel Matematik', soruSayisi: 40 },
  { key: 'fenbilimleri', ad: 'Fen Bilimleri', soruSayisi: 20 },
];

// AYT Branş ve Soru Sayıları (Sayısal)
const AYT_SAYISAL_BRANSLAR = [
  { key: 'matematik', ad: 'Matematik', soruSayisi: 40 },
  { key: 'fizik', ad: 'Fizik', soruSayisi: 14 },
  { key: 'kimya', ad: 'Kimya', soruSayisi: 13 },
  { key: 'biyoloji', ad: 'Biyoloji', soruSayisi: 13 },
];

// AYT Branş ve Soru Sayıları (Eşit Ağırlık)
const AYT_EA_BRANSLAR = [
  { key: 'matematik', ad: 'Matematik', soruSayisi: 40 },
  { key: 'edebiyat', ad: 'Türk Dili ve Edebiyatı', soruSayisi: 24 },
  { key: 'tarih1', ad: 'Tarih-1', soruSayisi: 10 },
  { key: 'cografya1', ad: 'Coğrafya-1', soruSayisi: 6 },
];

// AYT Branş ve Soru Sayıları (Sözel)
const AYT_SOZEL_BRANSLAR = [
  { key: 'edebiyat', ad: 'Türk Dili ve Edebiyatı', soruSayisi: 24 },
  { key: 'tarih1', ad: 'Tarih-1', soruSayisi: 10 },
  { key: 'cografya1', ad: 'Coğrafya-1', soruSayisi: 6 },
  { key: 'tarih2', ad: 'Tarih-2', soruSayisi: 11 },
  { key: 'cografya2', ad: 'Coğrafya-2', soruSayisi: 11 },
  { key: 'felsefe', ad: 'Felsefe Grubu', soruSayisi: 12 },
  { key: 'din', ad: 'Din Kültürü', soruSayisi: 6 },
];

// LGS Branş ve Soru Sayıları
const LGS_BRANSLAR = [
  { key: 'turkce', ad: 'Türkçe', soruSayisi: 20 },
  { key: 'inkilap', ad: 'T.C. İnkılap Tarihi ve Atatürkçülük', soruSayisi: 10 },
  { key: 'din', ad: 'Din Kültürü ve Ahlak Bilgisi', soruSayisi: 10 },
  { key: 'yabancidil', ad: 'Yabancı Dil', soruSayisi: 10 },
  { key: 'matematik', ad: 'Matematik', soruSayisi: 20 },
  { key: 'fen', ad: 'Fen Bilimleri', soruSayisi: 20 },
];

function DenemeSinavlariContent() {
  const { user, token, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const profileRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Data states
  const [sinavlar, setSinavlar] = useState<DenemeSinavi[]>([]);
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTur, setSelectedTur] = useState<string>('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSinav, setSelectedSinav] = useState<DenemeSinavi | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Sınıf seviyeleri tanımları
  const SINIF_SEVIYELERI = {
    LGS: [5, 6, 7, 8],      // Ortaokul: 5-8. sınıf
    TYT: [9, 10, 11, 12],   // Lise: 9-12. sınıf
    AYT: [9, 10, 11, 12],   // Lise: 9-12. sınıf
  };

  // Form states
  const [formData, setFormData] = useState({
    ad: '',
    tur: 'TYT' as 'TYT' | 'AYT' | 'LGS',
    aytTur: 'sayisal' as 'sayisal' | 'ea' | 'sozel',
    kurum: '',
    tarih: new Date().toISOString().split('T')[0],
    hedefSiniflar: [] as number[], // Multi-select sınıf seviyeleri
    aciklama: '',
  });

  // URL'den action parametresini kontrol et
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'yeni') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSinavlar = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedTur) params.append('tur', selectedTur);
      
      const response = await fetch(`${API_URL}/deneme?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSinavlar(data.data);
      }
    } catch (err) {
      setError('Sınavlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [token, selectedTur]);

  const fetchSiniflar = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/siniflar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSiniflar(data.data);
      }
    } catch (err) {
      console.error('Sınıflar yüklenemedi', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSinavlar();
      fetchSiniflar();
    }
  }, [token, fetchSinavlar, fetchSiniflar]);

  // Filtreleme
  const filteredSinavlar = sinavlar.filter(sinav => {
    const searchMatch = sinav.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (sinav.kurum?.toLowerCase().includes(searchTerm.toLowerCase()));
    return searchMatch;
  });

  // Sınav oluştur
  const handleCreateSinav = async () => {
    if (!formData.ad.trim()) {
      setMessage({ type: 'error', text: 'Sınav adı zorunludur' });
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/deneme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ad: formData.ad,
          tur: formData.tur,
          kurum: formData.kurum || null,
          tarih: formData.tarih,
          hedefSiniflar: formData.hedefSiniflar.length > 0 ? formData.hedefSiniflar : null,
          aciklama: formData.aciklama || null,
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Deneme sınavı başarıyla oluşturuldu!' });
        setShowCreateModal(false);
        setFormData({
          ad: '',
          tur: 'TYT',
          aytTur: 'sayisal',
          kurum: '',
          tarih: new Date().toISOString().split('T')[0],
          hedefSiniflar: [],
          aciklama: '',
        });
        fetchSinavlar();
      } else {
        setMessage({ type: 'error', text: data.message || 'Sınav oluşturulamadı' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setProcessing(false);
    }
  };

  // Sınav sil
  const handleDeleteSinav = async (id: string) => {
    if (!confirm('Bu sınavı silmek istediğinize emin misiniz?')) return;
    
    try {
      const response = await fetch(`${API_URL}/deneme/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Sınav başarıyla silindi' });
        fetchSinavlar();
      } else {
        setMessage({ type: 'error', text: data.message || 'Sınav silinemedi' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    }
  };



  // Branş listesini al
  const getBranslar = () => {
    if (formData.tur === 'TYT') return TYT_BRANSLAR;
    if (formData.tur === 'LGS') return LGS_BRANSLAR;
    if (formData.tur === 'AYT') {
      if (formData.aytTur === 'sayisal') return AYT_SAYISAL_BRANSLAR;
      if (formData.aytTur === 'ea') return AYT_EA_BRANSLAR;
      return AYT_SOZEL_BRANSLAR;
    }
    return [];
  };

  const isActive = (href: string) => {
    return pathname?.includes(href.replace('/mudur', ''));
  };

  const handleLogout = () => {
    logout();
  };

  // Message auto-hide
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gradient-to-br from-slate-50 via-white to-teal-50'} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center animate-pulse">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
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
      <aside className={`fixed top-0 left-0 h-full ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200/80'} border-r z-50 transition-all duration-300 shadow-xl lg:shadow-none
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarOpen ? 'w-64' : 'w-20'}
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center justify-between px-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
          <Link href="/mudur" className="flex items-center gap-3">
            <img 
              src={isDark ? "/logos/Edura-logo-dark-2.png" : "/logos/Edura-logo-nobg.png"} 
              alt="Edura Logo" 
              className="w-10 h-10 object-contain"
            />
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">Edura</h1>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium -mt-0.5`}>Müdür Paneli</p>
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
                  <>
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && (
                      <span className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        active ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile - Bottom */}
        {sidebarOpen && (
          <div className={`absolute bottom-0 left-0 right-0 p-3 border-t ${isDark ? 'border-slate-700/50 bg-[#1a1f2e]' : 'border-slate-100 bg-white'}`}>
            <div className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user?.ad?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{user?.ad} {user?.soyad}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>Kurum Müdürü</p>
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
                  placeholder="Sınav ara..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`bg-transparent text-sm ${isDark ? 'text-slate-200 placeholder-slate-500' : 'text-slate-600 placeholder-slate-400'} outline-none w-full`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Yeni Deneme Sınavı</span>
              </button>

              <ThemeToggle />

              <button className={`relative p-2.5 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'} rounded-xl transition-colors`}>
                <Bell className="w-5 h-5" />
              </button>

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
                    <div className="p-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                      <p className="font-semibold">{user?.ad} {user?.soyad}</p>
                      <p className="text-sm text-white/80">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/mudur/ayarlar"
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

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {/* Message Toast */}
          {message && (
            <div className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-xl ${
              message.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            } flex items-center gap-3 animate-slide-in-right`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="ml-2 hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
                <div className={`w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg`}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                Deneme Sınavları
              </h1>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                TYT, AYT ve LGS deneme sınavlarını yönetin, hedef sınıflar belirleyin ve onaylayın
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-3">
              <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} border rounded-xl px-4 py-2`}>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Toplam Sınav</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{sinavlar.length}</p>
              </div>
              <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} border rounded-xl px-4 py-2`}>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aktif Sınav</p>
                <p className={`text-xl font-bold text-green-500`}>{sinavlar.filter(s => s.aktif).length}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} rounded-2xl border p-4 mb-6`}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative md:hidden">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Sınav ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border ${isDark ? 'border-slate-700 bg-slate-800/50 text-white' : 'border-slate-200 bg-slate-50'} rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
              </div>
              <select
                value={selectedTur}
                onChange={(e) => setSelectedTur(e.target.value)}
                className={`px-4 py-2.5 border ${isDark ? 'border-slate-700 bg-slate-800/50 text-white' : 'border-slate-200 bg-slate-50'} rounded-xl focus:ring-2 focus:ring-purple-500`}
              >
                <option value="">Tüm Türler</option>
                <option value="TYT">TYT</option>
                <option value="AYT">AYT</option>
                <option value="LGS">LGS</option>
              </select>
            </div>
          </div>

          {/* Sınavlar Grid */}
          {filteredSinavlar.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSinavlar.map(sinav => (
                <div
                  key={sinav.id}
                  className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-purple-500/50' : 'bg-white border-slate-100 hover:border-purple-200'} border rounded-2xl overflow-hidden transition-all hover:shadow-xl group`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${SINAV_TUR_RENKLERI[sinav.tur]}`}>
                        {sinav.tur}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedSinav(sinav); setShowDetailModal(true); }}
                          className={`p-2 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'} rounded-lg transition-colors`}
                          title="Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSinav(sinav.id)}
                          className={`p-2 ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-2 group-hover:text-purple-500 transition-colors`}>
                      {sinav.ad}
                    </h3>
                    
                    {sinav.kurum && (
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-2 mb-2`}>
                        <Building className="w-4 h-4" /> {sinav.kurum}
                      </p>
                    )}
                    
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center gap-2 mb-3`}>
                      <Calendar className="w-4 h-4" /> {new Date(sinav.tarih).toLocaleDateString('tr-TR')}
                    </p>

                    {/* Hedef Sınıf */}
                    {(sinav.hedefSiniflar && sinav.hedefSiniflar.length > 0) ? (
                      <div className="mb-3">
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-1`}>Hedef Sınıflar:</p>
                        <div className="flex flex-wrap gap-1">
                          {sinav.hedefSiniflar.sort((a, b) => a - b).map(seviye => (
                            <span key={seviye} className={`px-2 py-0.5 text-xs rounded-full ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                              {seviye}. Sınıf
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : sinav.sinif ? (
                      <div className="mb-3">
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-1`}>Hedef Sınıf:</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                          {sinav.sinif.ad}
                        </span>
                      </div>
                    ) : null}

                    {/* Durum ve İstatistik */}
                    <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          sinav.aktif 
                            ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                            : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                        }`}>
                          {sinav.aktif ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {sinav.aktif ? 'Aktif' : 'Pasif'}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {sinav.katilimciSayisi} katılımcı
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-100'} border rounded-2xl p-12 text-center`}>
              <div className={`w-20 h-20 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <FileText className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
              </div>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-2`}>
                Henüz deneme sınavı yok
              </h3>
              <p className={`${isDark ? 'text-slate-500' : 'text-slate-500'} mb-6`}>
                Yeni bir deneme sınavı oluşturarak başlayın
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all shadow-lg"
              >
                <Plus className="inline w-5 h-5 mr-2" /> Yeni Deneme Sınavı
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${isDark ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-2xl my-8`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                Yeni Deneme Sınavı
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-2 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-lg`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              </button>
            </div>
            
            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Sınav Adı */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  Sınav Adı *
                </label>
                <input
                  type="text"
                  value={formData.ad}
                  onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                  placeholder="Örn: Ocak TYT Denemesi"
                  className={`w-full px-4 py-2.5 border ${isDark ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500' : 'border-slate-200 bg-slate-50'} rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
              </div>

              {/* Sınav Türü & Tarih */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                    Sınav Türü *
                  </label>
                  <select
                    value={formData.tur}
                    onChange={(e) => setFormData({ ...formData, tur: e.target.value as any, hedefSiniflar: [] })}
                    className={`w-full px-4 py-2.5 border ${isDark ? 'border-slate-700 bg-slate-800/50 text-white' : 'border-slate-200 bg-slate-50'} rounded-xl focus:ring-2 focus:ring-purple-500`}
                  >
                    <option value="TYT">TYT (Lise)</option>
                    <option value="AYT">AYT (Lise)</option>
                    <option value="LGS">LGS (Ortaokul)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                    Tarih *
                  </label>
                  <input
                    type="date"
                    value={formData.tarih}
                    onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                    className={`w-full px-4 py-2.5 border ${isDark ? 'border-slate-700 bg-slate-800/50 text-white' : 'border-slate-200 bg-slate-50'} rounded-xl focus:ring-2 focus:ring-purple-500`}
                  />
                </div>
              </div>

              {/* AYT Türü */}
              {formData.tur === 'AYT' && (
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                    AYT Türü
                  </label>
                  <div className="flex gap-3">
                    {['sayisal', 'ea', 'sozel'].map((tur) => (
                      <button
                        key={tur}
                        onClick={() => setFormData({ ...formData, aytTur: tur as any })}
                        className={`flex-1 py-2.5 px-4 rounded-xl border-2 transition-all ${
                          formData.aytTur === tur
                            ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`font-medium text-sm ${formData.aytTur !== tur && (isDark ? 'text-slate-400' : 'text-slate-600')}`}>
                          {tur === 'sayisal' ? 'Sayısal' : tur === 'ea' ? 'Eşit Ağırlık' : 'Sözel'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kurum */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  Yayınevi / Kurum (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={formData.kurum}
                  onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
                  placeholder="Örn: Bilgi Sarmal, Limit, 3D, vb."
                  className={`w-full px-4 py-2.5 border ${isDark ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500' : 'border-slate-200 bg-slate-50'} rounded-xl focus:ring-2 focus:ring-purple-500`}
                />
              </div>

              {/* Hedef Sınıf - Multi Select */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  Hedef Sınıf <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>(Opsiyonel - Belirli sınıflar için)</span>
                </label>
                <div className={`border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'} rounded-xl p-3`}>
                  <div className="flex flex-wrap gap-2">
                    {SINIF_SEVIYELERI[formData.tur].map((seviye) => {
                      const isSelected = formData.hedefSiniflar.includes(seviye);
                      return (
                        <button
                          key={seviye}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormData({
                                ...formData,
                                hedefSiniflar: formData.hedefSiniflar.filter(s => s !== seviye)
                              });
                            } else {
                              setFormData({
                                ...formData,
                                hedefSiniflar: [...formData.hedefSiniflar, seviye].sort((a, b) => a - b)
                              });
                            }
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-purple-500 text-white shadow-md'
                              : isDark 
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {seviye}. Sınıf
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-slate-300 dark:border-slate-600">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hedefSiniflar: [...SINIF_SEVIYELERI[formData.tur]] })}
                      className={`text-xs ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} font-medium`}
                    >
                      Tümünü Seç
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hedefSiniflar: [] })}
                      className={`text-xs ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-600'} font-medium`}
                    >
                      Temizle
                    </button>
                  </div>
                </div>
                <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {formData.hedefSiniflar.length === 0 
                    ? 'Boş bırakırsanız sınav tüm sınıflara açık olur' 
                    : `Seçili: ${formData.hedefSiniflar.map(s => `${s}. Sınıf`).join(', ')}`}
                </p>
              </div>

              {/* Açıklama */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  Açıklama (Opsiyonel)
                </label>
                <textarea
                  value={formData.aciklama}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                  rows={2}
                  placeholder="Sınav hakkında ek notlar..."
                  className={`w-full px-4 py-2.5 border ${isDark ? 'border-slate-700 bg-slate-800/50 text-white placeholder-slate-500' : 'border-slate-200 bg-slate-50'} rounded-xl focus:ring-2 focus:ring-purple-500 resize-none`}
                />
              </div>

              {/* Branş Bilgisi */}
              <div className={`${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-100'} border rounded-xl p-4`}>
                <h4 className={`font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'} mb-3 flex items-center gap-2`}>
                  <Target className="w-4 h-4" />
                  {SINAV_TUR_ACIKLAMA[formData.tur]} - Soru Dağılımı
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {getBranslar().map(brans => (
                    <div key={brans.key} className={`flex justify-between items-center p-2 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
                      <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{brans.ad}</span>
                      <span className={`text-sm font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{brans.soruSayisi}</span>
                    </div>
                  ))}
                </div>
                <p className={`mt-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Toplam: {getBranslar().reduce((a, b) => a + b.soruSayisi, 0)} soru
                </p>
              </div>
            </div>

            <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`px-5 py-2.5 border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700/50' : 'border-slate-200 text-slate-700 hover:bg-slate-50'} rounded-xl transition-colors`}
              >
                İptal
              </button>
              <button
                onClick={handleCreateSinav}
                disabled={processing}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:from-purple-600 hover:to-violet-700 disabled:opacity-50 flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Oluştur
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSinav && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${isDark ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-2xl my-8`}>
            <div className={`p-5 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${SINAV_TUR_RENKLERI[selectedSinav.tur]}`}>
                  {selectedSinav.tur}
                </span>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedSinav.ad}
                </h2>
              </div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedSinav.kurum && `${selectedSinav.kurum} • `}
                {new Date(selectedSinav.tarih).toLocaleDateString('tr-TR')}
              </p>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Hedef Sınıf */}
              <div>
                <h3 className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Hedef Sınıflar</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSinav.hedefSiniflar && selectedSinav.hedefSiniflar.length > 0 ? (
                    selectedSinav.hedefSiniflar.sort((a, b) => a - b).map(seviye => (
                      <span key={seviye} className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                        {seviye}. Sınıf
                      </span>
                    ))
                  ) : selectedSinav.sinif ? (
                    <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      {selectedSinav.sinif.ad}
                    </span>
                  ) : (
                    <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tüm sınıflar için açık</span>
                  )}
                </div>
              </div>

              {/* Durum */}
              <div>
                <h3 className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Durum</h3>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                    selectedSinav.aktif 
                      ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                      : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedSinav.aktif ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {selectedSinav.aktif ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>

              {/* İstatistikler */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedSinav.katilimciSayisi}</p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Katılımcı</p>
                </div>
                <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedSinav.hedefSiniflar && selectedSinav.hedefSiniflar.length > 0 
                      ? selectedSinav.hedefSiniflar.length 
                      : selectedSinav.sinif ? 1 : 'Tüm'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hedef Sınıf</p>
                </div>
              </div>

              {/* Oluşturan */}
              <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-xl p-4`}>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-1`}>Oluşturan</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedSinav.olusturan?.ad} {selectedSinav.olusturan?.soyad}
                </p>
              </div>
            </div>

            <div className={`flex justify-end gap-3 p-5 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedSinav(null); }}
                className={`px-5 py-2.5 border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700/50' : 'border-slate-200 text-slate-700 hover:bg-slate-50'} rounded-xl transition-colors`}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function DenemeSinavlariPage() {
  return (
    <RoleGuard allowedRoles={['mudur']}>
      <DenemeSinavlariContent />
    </RoleGuard>
  );
}

