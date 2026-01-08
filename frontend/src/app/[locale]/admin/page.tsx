'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import type { User } from '@/contexts/AuthContext';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { uploadApi } from '@/lib/api';
import { 
  Home, 
  Building2, 
  BarChart3, 
  Bell, 
  LifeBuoy, 
  FileText, 
  HelpCircle, 
  Settings,
  Menu,
  X,
  Plus,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Building,
  Users,
  GraduationCap,
  School
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Kurs {
  id: string;
  ad: string;
  adres: string;
  telefon: string;
  aktif: boolean;
  createdAt: string;
}

interface KursStats {
  ogrenciSayisi: number;
  ogretmenSayisi: number;
  sinifSayisi: number;
  mudurSayisi: number;
  sekreterSayisi: number;
}

interface SystemStats {
  toplamKurs: number;
  toplamOgrenci: number;
  toplamOgretmen: number;
  toplamSekreter: number;
  toplamSinif: number;
}

interface Mudur {
  id: string;
  kursId: string;
  ad: string;
  soyad: string;
  email: string;
  telefon: string;
  aktif: boolean;
}

interface Ogretmen {
  id: string;
  kursId: string;
  brans: string;
  ad: string;
  soyad: string;
  email: string;
  telefon: string;
  aktif: boolean;
}

interface Sekreter {
  id: string;
  kursId: string;
  ad: string;
  soyad: string;
  email: string;
  telefon: string;
  aktif: boolean;
}

// Sidebar menü öğeleri
const menuItems = [
  { 
    id: 'ana-sayfa', 
    label: 'Ana Sayfa', 
    icon: Home, 
    href: '/admin',
    color: 'from-red-500 to-red-600'
  },
  { 
    id: 'kurslar', 
    label: 'Kurs Yönetimi', 
    icon: Building2, 
    href: '/admin',
    action: 'kurs',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    id: 'raporlar', 
    label: 'Raporlar', 
    icon: BarChart3, 
    href: '/admin',
    action: 'rapor',
    color: 'from-amber-500 to-amber-600'
  },
  { 
    id: 'duyurular', 
    label: 'Duyurular', 
    icon: Bell, 
    href: '/admin/duyurular',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    id: 'destek', 
    label: 'Destek Talepleri', 
    icon: LifeBuoy, 
    href: '/admin/destek-talepleri',
    color: 'from-teal-500 to-teal-600'
  },
  { 
    id: 'changelog', 
    label: 'Changelog', 
    icon: FileText, 
    href: '/admin/changelog',
    color: 'from-indigo-500 to-indigo-600'
  },
  { 
    id: 'faq', 
    label: 'Yardım Merkezi', 
    icon: HelpCircle, 
    href: '/admin/faq',
    color: 'from-rose-500 to-rose-600'
  },
  { 
    id: 'ayarlar', 
    label: 'Ayarlar', 
    icon: Settings, 
    href: '/admin/ayarlar',
    color: 'from-slate-500 to-slate-600'
  },
];

function AdminPageContent() {
  const { user, token, logout, updateUser } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { speak, stop, ttsEnabled } = useAccessibility();
  const isDark = resolvedTheme === 'dark';
  const [kurslar, setKurslar] = useState<Kurs[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('ana-sayfa');

  // TTS yardımcı fonksiyonu
  const ttsHandlers = useCallback((text: string) => ({
    onMouseEnter: () => ttsEnabled && speak(text),
    onMouseLeave: () => stop(),
    onFocus: () => ttsEnabled && speak(text),
    onBlur: () => stop(),
    tabIndex: 0,
    'aria-label': text,
  }), [ttsEnabled, speak, stop]);

  // Modal states
  const [showKursModal, setShowKursModal] = useState(false);
  const [showRaporModal, setShowRaporModal] = useState(false);
  const [showKursDetayModal, setShowKursDetayModal] = useState(false);
  const [showKursDuzenleModal, setShowKursDuzenleModal] = useState(false);
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [showProfilDropdown, setShowProfilDropdown] = useState(false);
  const [showBildirimDropdown, setShowBildirimDropdown] = useState(false);
  const [showMesajDropdown, setShowMesajDropdown] = useState(false);
  
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations();
  
  const [selectedKurs, setSelectedKurs] = useState<Kurs | null>(null);
  const [kursStats, setKursStats] = useState<KursStats | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [kursForm, setKursForm] = useState({
    kursAdi: '',
    adres: '',
    telefon: '',
    email: '',
    kullaniciAdi: '',
    sifre: '',
  });

  const [duzenleForm, setDuzenleForm] = useState({
    kursAdi: '',
    adres: '',
    telefon: '',
    email: '',
    aktifMi: true,
  });

  const [profilForm, setProfilForm] = useState({
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
    mevcutSifre: '',
    yeniSifre: '',
    yeniSifreTekrar: '',
    profilFoto: '',
  });
  const [profilTab, setProfilTab] = useState<'bilgiler' | 'sifre'>('bilgiler');
  const [profilFotoPreview, setProfilFotoPreview] = useState<string | null>(null);
  const [profilFotoYukleniyor, setProfilFotoYukleniyor] = useState(false);
  const [profilFotoHata, setProfilFotoHata] = useState<string | null>(null);

  // Rapor data
  const [raporData, setRaporData] = useState<{
    mudurler: Mudur[];
    ogretmenler: Ogretmen[];
    sekreterler: Sekreter[];
  }>({ mudurler: [], ogretmenler: [], sekreterler: [] });
  const [raporTab, setRaporTab] = useState<'kurslar' | 'mudurler' | 'ogretmenler' | 'sekreterler'>('kurslar');

  useEffect(() => {
    if (token) {
      fetchInitialData(token);
    }
  }, [token]);

  // Profil fotoğrafını çek
  useEffect(() => {
    const fetchProfilFoto = async () => {
      if (!user?.id) return;
      try {
        const response = await uploadApi.getPhoto('admin', Number(user.id));
        if (response.success && response.data.url) {
          setProfilFotoPreview(response.data.url);
        }
      } catch (err) {
        console.log('Profil fotoğrafı bulunamadı');
      }
    };
    fetchProfilFoto();
  }, [user?.id]);

  const fetchInitialData = async (token: string) => {
    try {
      const [kurslarRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/users/kurslar`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const kurslarData = await kurslarRes.json();
      const statsData = await statsRes.json();

      if (kurslarData.success) {
        const kurslarArray = Array.isArray(kurslarData.data) ? kurslarData.data : kurslarData.data?.kurslar || [];
        setKurslar(kurslarArray);
      }
      if (statsData.success) setSystemStats(statsData.data);
    } catch (error) {
      console.error('Veri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleCreateKurs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/users/kurslar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(kursForm),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Kurs başarıyla oluşturuldu!' });
        setKurslar([...kurslar, data.data.kurs]);
        setTimeout(() => {
          setShowKursModal(false);
          setKursForm({ kursAdi: '', adres: '', telefon: '', email: '', kullaniciAdi: '', sifre: '' });
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Kurs oluşturulamadı' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateKurs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKurs) return;
    
    setSubmitLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/users/kurslar/${selectedKurs.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(duzenleForm),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Kurs başarıyla güncellendi!' });
        setKurslar(kurslar.map(k => k.id === selectedKurs.id ? data.data.kurs : k));
        setTimeout(() => {
          setShowKursDuzenleModal(false);
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Kurs güncellenemedi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const openKursDetay = async (kurs: Kurs) => {
    setSelectedKurs(kurs);
    setShowKursDetayModal(true);
    
    try {
      const response = await fetch(`${API_URL}/users/kurslar/${kurs.id}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setKursStats(data.data);
      }
    } catch (error) {
      console.error('Kurs istatistikleri alınamadı:', error);
    }
  };

  const openKursDuzenle = (kurs: Kurs) => {
    setSelectedKurs(kurs);
    setDuzenleForm({
      kursAdi: kurs.ad,
      adres: kurs.adres || '',
      telefon: kurs.telefon || '',
      email: '',
      aktifMi: kurs.aktif,
    });
    setShowKursDuzenleModal(true);
  };

  const openProfil = () => {
    setProfilForm({
      ad: user?.ad || '',
      soyad: user?.soyad || '',
      email: '',
      telefon: '',
      mevcutSifre: '',
      yeniSifre: '',
      yeniSifreTekrar: '',
      profilFoto: '',
    });
    setProfilFotoPreview(null);
    setProfilTab('bilgiler');
    setShowProfilDropdown(false);
    setMessage(null);
    setShowProfilModal(true);
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    
    // Dosya validasyonu
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      setProfilFotoHata('Sadece JPG, PNG ve WebP dosyaları yüklenebilir');
      return;
    }
    
    if (file.size > 8 * 1024 * 1024) {
      setProfilFotoHata('Dosya boyutu 8MB\'dan küçük olmalıdır');
      return;
    }
    
    setProfilFotoYukleniyor(true);
    setProfilFotoHata(null);
    
    try {
      const response = await uploadApi.uploadPhoto('admin', Number(user.id), file);
      if (response.success) {
        setProfilFotoPreview(response.data.url);
      }
    } catch (err) {
      setProfilFotoHata(err instanceof Error ? err.message : 'Fotoğraf yüklenirken hata oluştu');
    } finally {
      setProfilFotoYukleniyor(false);
      e.target.value = '';
    }
  };

  const handleFotoKaldir = async () => {
    if (!user?.id || !profilFotoPreview) return;
    
    setProfilFotoYukleniyor(true);
    setProfilFotoHata(null);
    
    try {
      await uploadApi.deletePhoto('admin', Number(user.id));
      setProfilFotoPreview(null);
    } catch (err) {
      setProfilFotoHata(err instanceof Error ? err.message : 'Fotoğraf silinirken hata oluştu');
    } finally {
      setProfilFotoYukleniyor(false);
    }
  };

  const handleProfilUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/users/profil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ad: profilForm.ad,
          soyad: profilForm.soyad,
          email: profilForm.email,
          telefon: profilForm.telefon,
          profilFoto: profilForm.profilFoto,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
        if (user) {
          const updatedUserData = { ...user, ad: profilForm.ad, soyad: profilForm.soyad };
          updateUser(updatedUserData);
        }
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Profil güncellenemedi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSifreUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profilForm.yeniSifre !== profilForm.yeniSifreTekrar) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor!' });
      return;
    }

    if (profilForm.yeniSifre.length < 6) {
      setMessage({ type: 'error', text: 'Şifre en az 6 karakter olmalıdır!' });
      return;
    }

    setSubmitLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mevcutSifre: profilForm.mevcutSifre,
          yeniSifre: profilForm.yeniSifre,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Şifre başarıyla güncellendi!' });
        setProfilForm(prev => ({ ...prev, mevcutSifre: '', yeniSifre: '', yeniSifreTekrar: '' }));
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Şifre güncellenemedi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const openRaporlar = async () => {
    setShowRaporModal(true);
    
    try {
      const [mudurlerRes, ogretmenlerRes, sekreterlerRes] = await Promise.all([
        fetch(`${API_URL}/users/mudurler`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users/ogretmenler`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users/sekreterler`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const mudurlerData = await mudurlerRes.json();
      const ogretmenlerData = await ogretmenlerRes.json();
      const sekreterlerData = await sekreterlerRes.json();

      setRaporData({
        mudurler: mudurlerData.success ? mudurlerData.data.mudurler : [],
        ogretmenler: ogretmenlerData.success ? ogretmenlerData.data.ogretmenler : [],
        sekreterler: sekreterlerData.success ? sekreterlerData.data.sekreterler : [],
      });
    } catch (error) {
      console.error('Rapor verileri alınamadı:', error);
    }
  };

  const getKursAdi = (kursId: string) => {
    const kurs = kurslar.find(k => k.id === kursId);
    return kurs?.ad || '-';
  };

  const handleMenuClick = (item: typeof menuItems[0]) => {
    setActiveMenu(item.id);
    setMobileSidebarOpen(false);
    
    if (item.action === 'kurs') {
      setShowKursModal(true);
    } else if (item.action === 'rapor') {
      openRaporlar();
    }
  };

  if (!user || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0f1117]' : 'bg-slate-50'}`}>
        <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1117]' : 'bg-slate-100'}`}>
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full ${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} border-r z-50 transition-all duration-300 shadow-xl lg:shadow-none
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarOpen ? 'w-64' : 'w-20'}
      `}>
        {/* Logo */}
        <div className={`h-16 flex items-center justify-between px-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
          <Link href="/admin" className="flex items-center gap-3">
            <img 
              src={isDark ? "/logos/Edura-logo-dark-2.png" : "/logos/Edura-logo-nobg.png"} 
              alt="Edura Logo" 
              className="w-10 h-10 object-contain"
            />
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">Edura</h1>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium -mt-0.5`}>Admin Paneli</p>
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
            const isActive = activeMenu === item.id;
            
            if (item.action) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                      : isDark 
                        ? 'text-slate-300 hover:bg-slate-700/50 hover:text-white' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <div className={`${sidebarOpen ? '' : 'mx-auto'} ${isActive ? '' : `p-1.5 rounded-lg bg-gradient-to-r ${item.color} bg-opacity-10`}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  </div>
                  {sidebarOpen && (
                    <>
                      <span className="font-medium flex-1 text-left">{item.label}</span>
                      <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`} />
                    </>
                  )}
                </button>
              );
            }
            
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setActiveMenu(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                    : isDark 
                      ? 'text-slate-300 hover:bg-slate-700/50 hover:text-white' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <div className={`${sidebarOpen ? '' : 'mx-auto'} ${isActive ? '' : `p-1.5 rounded-lg bg-gradient-to-r ${item.color} bg-opacity-10`}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                </div>
                {sidebarOpen && (
                  <>
                    <span className="font-medium flex-1">{item.label}</span>
                    <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`} />
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info at Bottom */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 border-t ${isDark ? 'border-slate-700/50 bg-[#1a1f2e]' : 'border-slate-200 bg-white'}`}>
          <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {user.ad?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.ad} {user.soyad}</p>
                <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sistem Yöneticisi</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300`}>
        {/* Header */}
        <header className={`sticky top-0 z-30 ${isDark ? 'bg-[#1a1f2e]/95 border-slate-700/50' : 'bg-white/95 border-slate-200'} border-b backdrop-blur-xl`}>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className={`p-2 rounded-lg lg:hidden ${isDark ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Page Title */}
              <div className="hidden lg:block">
                <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('admin.welcome')}, {user.ad}! 👋
                </h1>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-2">
                <LanguageSelector variant={isDark ? 'dark' : 'light'} />
                <ThemeToggle />

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowBildirimDropdown(!showBildirimDropdown);
                      setShowMesajDropdown(false);
                      setShowProfilDropdown(false);
                    }}
                    className={`relative p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700/50 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">4</span>
                  </button>

                  {showBildirimDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowBildirimDropdown(false)} />
                      <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-20 border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Bildirimler</h3>
                          <button className="text-xs text-red-500 hover:text-red-600">Tümünü okundu işaretle</button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          <div className={`px-4 py-3 border-l-4 border-red-500 ${isDark ? 'hover:bg-slate-700/50 bg-red-500/10' : 'hover:bg-slate-50 bg-red-50/50'}`}>
                            <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Yeni kurs kaydı: <strong>Ataşehir Kurs</strong></p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>2 dakika önce</p>
                          </div>
                          <div className={`px-4 py-3 border-l-4 border-transparent ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Maltepe Gül Kurs şifresini değiştirdi</p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>1 saat önce</p>
                          </div>
                        </div>
                        <div className={`px-4 py-3 border-t text-center ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                          <button className="text-sm text-red-500 hover:text-red-600 font-medium">Tüm bildirimleri gör</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowProfilDropdown(!showProfilDropdown);
                      setShowBildirimDropdown(false);
                      setShowMesajDropdown(false);
                    }}
                    className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold hover:scale-105 transition-transform"
                  >
                    {user.ad?.charAt(0).toUpperCase()}
                  </button>

                  {showProfilDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowProfilDropdown(false)} />
                      <div className={`absolute right-0 mt-3 w-64 rounded-xl shadow-2xl z-20 border py-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`px-4 pb-3 flex items-center gap-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                            {user.ad?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.ad} {user.soyad}</p>
                            <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
                          </div>
                        </div>
                        
                        <div className={`py-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                          <button
                            onClick={openProfil}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'}`}
                          >
                            <UserIcon className="w-4 h-4" />
                            Profili düzenle
                          </button>
                          <button
                            onClick={() => {
                              setShowProfilDropdown(false);
                              router.push('/admin/ayarlar');
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'}`}
                          >
                            <Settings className="w-4 h-4" />
                            Hesap ayarları
                          </button>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={handleLogout}
                            className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:text-red-600 transition-colors ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                          >
                            <LogOut className="w-4 h-4" />
                            Çıkış yap
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Welcome Card */}
          <div className={`rounded-2xl p-6 mb-6 ${isDark ? 'bg-gradient-to-r from-red-600/20 to-rose-600/20 border border-red-500/20' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-white'}`}>
                  Hoş Geldin, {user.ad}! 🛡️
                </h2>
                <p className={isDark ? 'text-red-200/70' : 'text-white/80'}>
                  Sistem yöneticisi olarak tüm kursları ve ayarları buradan yönetebilirsiniz.
                </p>
              </div>
              <button
                onClick={() => setShowKursModal(true)}
                className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'}`}
              >
                <Plus className="w-5 h-5" />
                Yeni Kurs Ekle
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          {systemStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1a1f2e] border border-slate-700/50' : 'bg-white border border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Building className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{systemStats.toplamKurs}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Toplam Kurs</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1a1f2e] border border-slate-700/50' : 'bg-white border border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                    <GraduationCap className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{systemStats.toplamOgrenci}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Toplam Öğrenci</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1a1f2e] border border-slate-700/50' : 'bg-white border border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <Users className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{systemStats.toplamOgretmen}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Toplam Öğretmen</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1a1f2e] border border-slate-700/50' : 'bg-white border border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                    <School className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{systemStats.toplamSinif}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Toplam Sınıf</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <button 
              onClick={() => setShowKursModal(true)}
              className={`rounded-xl p-5 text-left transition-all group ${isDark ? 'bg-[#1a1f2e] border border-slate-700/50 hover:border-blue-500/50' : 'bg-white border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Plus className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Yeni Kurs Ekle</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sisteme yeni kurs kaydı oluştur</p>
            </button>

            <button 
              onClick={openRaporlar}
              className={`rounded-xl p-5 text-left transition-all group ${isDark ? 'bg-[#1a1f2e] border border-slate-700/50 hover:border-amber-500/50' : 'bg-white border border-slate-200 hover:border-amber-300 shadow-sm hover:shadow-md'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                <BarChart3 className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Raporlar</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sistem raporlarını görüntüle</p>
            </button>

            <button 
              onClick={() => router.push('/admin/duyurular')}
              className={`rounded-xl p-5 text-left transition-all group ${isDark ? 'bg-[#1a1f2e] border border-slate-700/50 hover:border-purple-500/50' : 'bg-white border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                <Bell className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Duyuru Sistemi</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Müdürlere duyuru gönder</p>
            </button>

            <button 
              onClick={() => router.push('/admin/destek-talepleri')}
              className={`rounded-xl p-5 text-left transition-all group ${isDark ? 'bg-[#1a1f2e] border border-slate-700/50 hover:border-teal-500/50' : 'bg-white border border-slate-200 hover:border-teal-300 shadow-sm hover:shadow-md'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${isDark ? 'bg-teal-500/20' : 'bg-teal-100'}`}>
                <LifeBuoy className={`w-6 h-6 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              </div>
              <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Destek Talepleri</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Teknik destek taleplerini yönet</p>
            </button>

            <button 
              onClick={() => router.push('/admin/changelog')}
              className={`rounded-xl p-5 text-left transition-all group ${isDark ? 'bg-[#1a1f2e] border border-slate-700/50 hover:border-indigo-500/50' : 'bg-white border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                <FileText className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Changelog</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sistem güncellemelerini yönet</p>
            </button>

            <button 
              onClick={() => router.push('/admin/faq')}
              className={`rounded-xl p-5 text-left transition-all group ${isDark ? 'bg-[#1a1f2e] border border-slate-700/50 hover:border-rose-500/50' : 'bg-white border border-slate-200 hover:border-rose-300 shadow-sm hover:shadow-md'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${isDark ? 'bg-rose-500/20' : 'bg-rose-100'}`}>
                <HelpCircle className={`w-6 h-6 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
              </div>
              <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Yardım Merkezi (FAQ)</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sık sorulan soruları yönet</p>
            </button>
          </div>

          {/* Kurslar Tablosu */}
          <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1f2e] border border-slate-700/50' : 'bg-white border border-slate-200 shadow-sm'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('admin.registeredCourses')}</h2>
              <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                {kurslar.length} Kurs
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Kurs Adı
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Adres
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Telefon
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Durum
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                  {kurslar.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`px-6 py-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Henüz kayıtlı kurs bulunmamaktadır.
                      </td>
                    </tr>
                  ) : (
                    kurslar.map((kurs) => (
                      <tr key={kurs.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                              {kurs.ad.charAt(0)}
                            </div>
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{kurs.ad}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{kurs.adres || '-'}</td>
                        <td className={`px-6 py-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{kurs.telefon || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            kurs.aktif 
                              ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                              : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                          }`}>
                            {kurs.aktif ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => openKursDetay(kurs)}
                            className={`mr-3 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                          >
                            Görüntüle
                          </button>
                          <button 
                            onClick={() => openKursDuzenle(kurs)}
                            className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}
                          >
                            Düzenle
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Yeni Kurs Modal */}
      <Modal isOpen={showKursModal} onClose={() => setShowKursModal(false)} title="Yeni Kurs Ekle" size="lg">
        <form onSubmit={handleCreateKurs} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kurs Adı *</label>
              <input
                type="text"
                value={kursForm.kursAdi}
                onChange={(e) => setKursForm({ ...kursForm, kursAdi: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={kursForm.email}
                onChange={(e) => setKursForm({ ...kursForm, email: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
            <input
              type="text"
              value={kursForm.adres}
              onChange={(e) => setKursForm({ ...kursForm, adres: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
            <input
              type="text"
              value={kursForm.telefon}
              onChange={(e) => setKursForm({ ...kursForm, telefon: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="border-t border-slate-200 pt-4 mt-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Giriş Bilgileri</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kullanıcı Adı *</label>
                <input
                  type="text"
                  value={kursForm.kullaniciAdi}
                  onChange={(e) => setKursForm({ ...kursForm, kullaniciAdi: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Şifre *</label>
                <input
                  type="password"
                  value={kursForm.sifre}
                  onChange={(e) => setKursForm({ ...kursForm, sifre: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowKursModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Oluşturuluyor...' : 'Kurs Oluştur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Kurs Detay Modal */}
      <Modal isOpen={showKursDetayModal} onClose={() => setShowKursDetayModal(false)} title="Kurs Detayları" size="lg">
        {selectedKurs && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                {selectedKurs.ad.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{selectedKurs.ad}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedKurs.aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedKurs.aktif ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Adres</p>
                <p className="text-slate-900">{selectedKurs.adres || '-'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Telefon</p>
                <p className="text-slate-900">{selectedKurs.telefon || '-'}</p>
              </div>
            </div>

            {kursStats && (
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-3">İstatistikler</h4>
                <div className="grid grid-cols-5 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{kursStats.ogrenciSayisi}</p>
                    <p className="text-xs text-slate-500">Öğrenci</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{kursStats.ogretmenSayisi}</p>
                    <p className="text-xs text-slate-500">Öğretmen</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{kursStats.sinifSayisi}</p>
                    <p className="text-xs text-slate-500">Sınıf</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{kursStats.mudurSayisi}</p>
                    <p className="text-xs text-slate-500">Müdür</p>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-teal-600">{kursStats.sekreterSayisi}</p>
                    <p className="text-xs text-slate-500">Sekreter</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowKursDetayModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  setShowKursDetayModal(false);
                  openKursDuzenle(selectedKurs);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Düzenle
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Kurs Düzenle Modal */}
      <Modal isOpen={showKursDuzenleModal} onClose={() => setShowKursDuzenleModal(false)} title="Kurs Düzenle" size="lg">
        <form onSubmit={handleUpdateKurs} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kurs Adı *</label>
            <input
              type="text"
              value={duzenleForm.kursAdi}
              onChange={(e) => setDuzenleForm({ ...duzenleForm, kursAdi: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
            <input
              type="text"
              value={duzenleForm.adres}
              onChange={(e) => setDuzenleForm({ ...duzenleForm, adres: e.target.value })}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input
                type="text"
                value={duzenleForm.telefon}
                onChange={(e) => setDuzenleForm({ ...duzenleForm, telefon: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={duzenleForm.email}
                onChange={(e) => setDuzenleForm({ ...duzenleForm, email: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={duzenleForm.aktifMi}
                onChange={(e) => setDuzenleForm({ ...duzenleForm, aktifMi: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-500"
              />
              Aktif
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowKursDuzenleModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Raporlar Modal */}
      <Modal isOpen={showRaporModal} onClose={() => setShowRaporModal(false)} title="Sistem Raporları" size="xl">
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200 pb-3">
            {(['kurslar', 'mudurler', 'ogretmenler', 'sekreterler'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRaporTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  raporTab === tab
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'kurslar' && 'Kurslar'}
                {tab === 'mudurler' && 'Müdürler'}
                {tab === 'ogretmenler' && 'Öğretmenler'}
                {tab === 'sekreterler' && 'Sekreterler'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-h-96 overflow-y-auto">
            {raporTab === 'kurslar' && (
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Kurs Adı</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Adres</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Telefon</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kurslar.map((kurs) => (
                    <tr key={kurs.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{kurs.ad}</td>
                      <td className="px-4 py-3 text-slate-600">{kurs.adres || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{kurs.telefon || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${kurs.aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {kurs.aktif ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {raporTab === 'mudurler' && (
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Ad Soyad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Kurs</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Telefon</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {raporData.mudurler.map((mudur) => (
                    <tr key={mudur.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{mudur.ad} {mudur.soyad}</td>
                      <td className="px-4 py-3 text-slate-600">{getKursAdi(mudur.kursId)}</td>
                      <td className="px-4 py-3 text-slate-600">{mudur.email || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{mudur.telefon || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${mudur.aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {mudur.aktif ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {raporData.mudurler.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Kayıtlı müdür bulunmamaktadır.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {raporTab === 'ogretmenler' && (
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Ad Soyad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Kurs</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Branş</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {raporData.ogretmenler.map((ogretmen) => (
                    <tr key={ogretmen.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{ogretmen.ad} {ogretmen.soyad}</td>
                      <td className="px-4 py-3 text-slate-600">{getKursAdi(ogretmen.kursId)}</td>
                      <td className="px-4 py-3 text-slate-600">{ogretmen.brans || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${ogretmen.aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {ogretmen.aktif ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {raporData.ogretmenler.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Kayıtlı öğretmen bulunmamaktadır.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {raporTab === 'sekreterler' && (
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Ad Soyad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Kurs</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Telefon</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {raporData.sekreterler.map((sekreter) => (
                    <tr key={sekreter.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{sekreter.ad} {sekreter.soyad}</td>
                      <td className="px-4 py-3 text-slate-600">{getKursAdi(sekreter.kursId)}</td>
                      <td className="px-4 py-3 text-slate-600">{sekreter.email || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{sekreter.telefon || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${sekreter.aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {sekreter.aktif ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {raporData.sekreterler.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Kayıtlı sekreter bulunmamaktadır.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              onClick={() => setShowRaporModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </Modal>

      {/* Profil Düzenleme Modal */}
      <Modal isOpen={showProfilModal} onClose={() => setShowProfilModal(false)} title="Profili Düzenle" size="md" variant="light">
        <form onSubmit={handleProfilUpdate} className="p-2">
          {message && (
            <div className={`mb-4 p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {/* Profile Photo */}
          <div className="flex items-center gap-6 mb-6">
            <div className={`relative group ${profilFotoYukleniyor ? 'opacity-50' : ''}`}>
              {profilFotoPreview ? (
                <img 
                  src={profilFotoPreview} 
                  alt="Profil" 
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {profilForm.ad?.charAt(0)?.toUpperCase() || user?.ad?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/jpg,image/webp" 
                  className="hidden" 
                  onChange={handleFotoChange}
                  disabled={profilFotoYukleniyor}
                />
              </label>
              {/* Loading spinner */}
              {profilFotoYukleniyor && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Profil Fotoğrafı</p>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP • Maks 8MB</p>
              {profilFotoPreview && (
                <button 
                  type="button" 
                  onClick={handleFotoKaldir}
                  disabled={profilFotoYukleniyor}
                  className="text-xs text-red-500 hover:text-red-600 mt-2 disabled:opacity-50"
                >
                  Fotoğrafı kaldır
                </button>
              )}
              {profilFotoHata && <p className="text-xs text-red-500 mt-1">{profilFotoHata}</p>}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
              <input
                type="text"
                value={profilForm.ad}
                onChange={(e) => setProfilForm({ ...profilForm, ad: e.target.value })}
                placeholder="Adınız"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
              <input
                type="text"
                value={profilForm.soyad}
                onChange={(e) => setProfilForm({ ...profilForm, soyad: e.target.value })}
                placeholder="Soyadınız"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowProfilModal(false)}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Ana export - RoleGuard ile sarmalanmış
export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminPageContent />
    </RoleGuard>
  );
}
