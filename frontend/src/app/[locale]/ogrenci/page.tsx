'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import ClientOnlyDate from '../../../components/ClientOnlyDate';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { GununSorusuWidget, GamificationSummary } from '@/components/GununSorusuWidget';
import { uploadApi } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface DashboardStats {
  toplamDers: number;
  bugunDersSayisi: number;
  bekleyenOdevler: number;
  aktifSinavlar: number;
  devamsizliklar: number;
  genelOrtalama: number;
}

interface BugunDers {
  id: string;
  ad: string;
  sinif: string;
  ogretmen: string;
  saat: string;
  durum: 'bekliyor' | 'devam_ediyor' | 'tamamlandi';
}

interface AktifSinav {
  id: string;
  baslik: string;
  dersAdi: string;
  sure: number;
  baslangicTarihi: string;
  bitisTarihi: string;
  soruSayisi: number;
}

interface Ogretmen {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  brans: string;
  dersler: string[];
}

interface HaftalikDers {
  id: string;
  ad: string;
  ogretmen: string;
  baslangicSaati: string;
  bitisSaati: string;
}

interface HaftalikProgram {
  [gun: string]: HaftalikDers[];
}

interface DenemeSonuc {
  id: string;
  sinavId: string;
  sinavAd: string;
  dersAd: string;
  tarih: string;
  dogru: number;
  yanlis: number;
  bos: number;
  toplam: number;
  yuzde: number;
  toplamPuan: number;
}

interface DevamsizlikData {
  istatistik: {
    toplam: number;
    katildi: number;
    katilmadi: number;
    gecKaldi: number;
    katilimOrani: number;
  };
  sonDevamsizliklar: Array<{
    id: string;
    tarih: string;
    ders: string;
    durum: string;
    aciklama: string | null;
  }>;
}

interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  tarih: string;
  okundu: boolean;
}

interface Mesaj {
  id: string;
  gonderenAd: string;
  baslik: string;
  mesaj: string;
  tarih: string;
  okundu: boolean;
}

function OgrenciDashboardContent() {
  const { user, token, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const { speak, stop, ttsEnabled } = useAccessibility();
  const isDark = resolvedTheme === 'dark';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bugunDersler, setBugunDersler] = useState<BugunDers[]>([]);
  const [aktifSinavlar, setAktifSinavlar] = useState<AktifSinav[]>([]);
  const [ogretmenler, setOgretmenler] = useState<Ogretmen[]>([]);
  const [haftalikProgram, setHaftalikProgram] = useState<HaftalikProgram>({});
  const [denemeSonuclari, setDenemeSonuclari] = useState<DenemeSonuc[]>([]);
  const [devamsizlikData, setDevamsizlikData] = useState<DevamsizlikData | null>(null);
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [mesajlar] = useState<Mesaj[]>([]);
  const [loading, setLoading] = useState(true);
  const [welcomeSpoken, setWelcomeSpoken] = useState(false);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [showSifreModal, setShowSifreModal] = useState(false);
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  
  // Profil fotoğrafı state'leri
  const [profilFoto, setProfilFoto] = useState<string | null>(null);
  const [profilFotoYukleniyor, setProfilFotoYukleniyor] = useState(false);
  const [profilFotoHata, setProfilFotoHata] = useState<string | null>(null);
  const profilFotoInputRef = useRef<HTMLInputElement>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // TTS yardımcı fonksiyonu
  const handleSpeak = useCallback((text: string) => {
    if (ttsEnabled) {
      speak(text);
    }
  }, [ttsEnabled, speak]);

  // TTS handlers - mouse hover/focus'ta okur, leave'de durur
  const ttsHandlers = useCallback((text: string) => ({
    onMouseEnter: () => ttsEnabled && speak(text),
    onMouseLeave: () => stop(),
    onFocus: () => ttsEnabled && speak(text),
    onBlur: () => stop(),
    tabIndex: 0,
    'aria-label': text,
  }), [ttsEnabled, speak, stop]);

  // Bildirim yönetimi
  const unreadBildirimCount = bildirimler.filter(b => !b.okundu).length;
  
  const markBildirimAsRead = useCallback((id: string) => {
    setBildirimler(prev => prev.map(b => b.id === id ? { ...b, okundu: true } : b));
  }, []);
  
  const markAllBildirimlerAsRead = useCallback(() => {
    setBildirimler(prev => prev.map(b => ({ ...b, okundu: true })));
  }, []);
  
  // Sayfa yüklendiğinde hoşgeldin mesajı
  useEffect(() => {
    if (ttsEnabled && !welcomeSpoken && !loading && user) {
      setTimeout(() => {
        speak(`Merhaba ${user.ad}! Öğrenci paneline hoş geldin. ${stats?.toplamDers || 0} dersin ve ${stats?.devamsizliklar || 0} devamsızlık kaydın var. Ortalaman yüzde ${stats?.genelOrtalama?.toFixed(0) || 0}.`);
        setWelcomeSpoken(true);
      }, 500);
    }
  }, [ttsEnabled, welcomeSpoken, loading, user, stats, speak]);

  // Profil fotoğrafını çek
  useEffect(() => {
    const fetchProfilFoto = async () => {
      if (!user?.id) return;
      try {
        const response = await uploadApi.getPhoto('ogrenci', Number(user.id));
        if (response.success && response.data.url) {
          setProfilFoto(response.data.url);
        }
      } catch (err) {
        console.log('Profil fotoğrafı bulunamadı');
      }
    };
    fetchProfilFoto();
  }, [user?.id]);

  // Profil fotoğrafı yükleme fonksiyonu
  const handleProfilFotoYukle = async (file: File) => {
    if (!user?.id) return;
    
    // Dosya validasyonu
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      setProfilFotoHata('Sadece JPG, PNG ve WebP dosyaları yüklenebilir');
      return;
    }
    
    if (file.size > 8 * 1024 * 1024) {
      setProfilFotoHata('Dosya boyutu 8MB\'dan küçük olmalı');
      return;
    }
    
    setProfilFotoYukleniyor(true);
    setProfilFotoHata(null);
    
    try {
      const response = await uploadApi.uploadPhoto('ogrenci', Number(user.id), file);
      if (response.success) {
        setProfilFoto(response.data.url);
      }
    } catch (err) {
      setProfilFotoHata(err instanceof Error ? err.message : 'Fotoğraf yüklenirken hata oluştu');
    } finally {
      setProfilFotoYukleniyor(false);
    }
  };

  // Profil fotoğrafı silme fonksiyonu
  const handleProfilFotoSil = async () => {
    if (!user?.id || !profilFoto) return;
    
    setProfilFotoYukleniyor(true);
    setProfilFotoHata(null);
    
    try {
      await uploadApi.deletePhoto('ogrenci', Number(user.id));
      setProfilFoto(null);
    } catch (err) {
      setProfilFotoHata(err instanceof Error ? err.message : 'Fotoğraf silinirken hata oluştu');
    } finally {
      setProfilFotoYukleniyor(false);
    }
  };

  // Deneme sınavlarını grupla (sınav bazlı)
  const grupluDenemeler = useMemo(() => {
    const gruplar: { [key: string]: DenemeSonuc[] } = {};
    denemeSonuclari.forEach(sonuc => {
      if (!gruplar[sonuc.sinavAd]) {
        gruplar[sonuc.sinavAd] = [];
      }
      gruplar[sonuc.sinavAd].push(sonuc);
    });
    return Object.entries(gruplar).map(([sinavAd, sonuclar]) => ({
      sinavAd,
      sonuclar,
      tarih: sonuclar[0]?.tarih || new Date().toISOString(),
      ortalama: sonuclar.length > 0 ? sonuclar.reduce((acc, s) => acc + s.yuzde, 0) / sonuclar.length : 0,
      toplamDogru: sonuclar.reduce((acc, s) => acc + s.dogru, 0),
      toplamYanlis: sonuclar.reduce((acc, s) => acc + s.yanlis, 0),
      toplamBos: sonuclar.reduce((acc, s) => acc + s.bos, 0),
    }));
  }, [denemeSonuclari]);

  // Veri çekme
  useEffect(() => {
    if (token) {
      fetchDashboardData(token);
    }
  }, [token]);

  const fetchDashboardData = async (token: string) => {
    try {
      const [
        statsRes, 
        derslerRes, 
        sinavlarRes,
        ogretmenlerRes,
        programRes,
        denemeRes,
        devamsizlikRes
      ] = await Promise.all([
        fetch(`${API_URL}/dashboard/ogrenci/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/dashboard/ogrenci/bugun-dersler`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/online-sinav/ogrenci/aktif`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/dashboard/ogrenci/ogretmenler`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/dashboard/ogrenci/haftalik-program`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/dashboard/ogrenci/deneme-sonuclari`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/dashboard/ogrenci/devamsizlik`, {
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

      if (sinavlarRes.ok) {
        const sinavlarData = await sinavlarRes.json();
        if (sinavlarData.success) {
          setAktifSinavlar(sinavlarData.data || []);
        }
      }

      if (ogretmenlerRes.ok) {
        const ogretmenlerData = await ogretmenlerRes.json();
        if (ogretmenlerData.success) {
          setOgretmenler(ogretmenlerData.data || []);
        }
      }

      if (programRes.ok) {
        const programData = await programRes.json();
        if (programData.success) {
          setHaftalikProgram(programData.data || {});
        }
      }

      if (denemeRes.ok) {
        const denemeData = await denemeRes.json();
        if (denemeData.success) {
          setDenemeSonuclari(denemeData.data?.tumSonuclar || []);
        }
      }

      if (devamsizlikRes.ok) {
        const devamsizlikDataRes = await devamsizlikRes.json();
        if (devamsizlikDataRes.success) {
          setDevamsizlikData(devamsizlikDataRes.data);
        }
      }
    } catch (error) {
      console.error('Dashboard verisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownToggle = (dropdownName: string) => {
    setOpenDropdown(prev => (prev === dropdownName ? null : dropdownName));
  };

  const handleLogout = () => {
    logout();
  };

  const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const dersSayisi = stats?.toplamDers || 0;
  const devamsizlikSayisi = stats?.devamsizliklar || devamsizlikData?.istatistik?.katilmadi || 0;
  const ortalamaPuan = stats?.genelOrtalama || (denemeSonuclari.length > 0 
    ? Math.round(denemeSonuclari.reduce((acc, sonuc) => acc + sonuc.yuzde, 0) / denemeSonuclari.length)
    : 0);
  
  // ogrenci değişkenini user'dan oluştur (geriye uyumluluk için)
  const ogrenci = user ? {
    id: user.id,
    ad: user.ad,
    soyad: user.soyad,
    email: user.email,
    sinif: user.sinif?.ad || 'Sınıf Yok',
    seviye: user.sinif?.seviye || 10,
    ogrenciNo: (user as any).ogrenciNo || '',
    kursId: user.kursId || '',
    telefon: (user as any).telefon || ''
  } : { id: '', ad: '', soyad: '', email: '', sinif: '', seviye: 10, ogrenciNo: '', kursId: '', telefon: '' };

  // Kurs bilgisini user'dan al
  const kurs = (user as any)?.kurs || { ad: 'Kurs' };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Deneme numarasını çıkar (örn: "1. Deneme Sınavı" -> 1)
  const getDenemeNo = (sinavAd: string) => {
    const match = sinavAd.match(/(\d+)\./);
    return match ? match[1] : '1';
  };

  // ===================== MODERN ÖĞRENCİ ARAYÜZÜ =====================
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900' : 'bg-gradient-to-br from-orange-50 via-white to-purple-50'}`}>
      {/* Modern Header */}
      <header className={`${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-gray-100'} backdrop-blur-md border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Sol - Logo ve Karşılama */}
            <div className="flex items-center gap-3">
              <img 
                src={isDark ? "/logos/Edura-logo-dark-2.png" : "/logos/Edura-logo-nobg.png"} 
                alt="Edura Logo" 
                className="w-10 h-10 object-contain"
              />
              <div className="hidden sm:block">
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Merhaba, {ogrenci.ad}! 👋</p>
                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{kurs?.ad} • {ogrenci.sinif}</p>
              </div>
            </div>

            {/* Orta - Hızlı Erişim Butonları */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/ogrenci/odevler" className={`flex flex-col items-center px-3 py-1.5 rounded-xl ${isDark ? 'hover:bg-slate-700' : 'hover:bg-blue-50'} transition-all`} {...ttsHandlers('Ödevler')}>
                <span className="text-lg">📝</span>
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Ödevler</span>
              </Link>
              <Link href="/ogrenci/sinavlar" className={`flex flex-col items-center px-3 py-1.5 rounded-xl ${isDark ? 'hover:bg-slate-700' : 'hover:bg-purple-50'} transition-all`} {...ttsHandlers('Sınavlar')}>
                <span className="text-lg">📋</span>
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Sınavlar</span>
              </Link>
              <Link href="/ogrenci/canli-ders" className={`flex flex-col items-center px-3 py-1.5 rounded-xl ${isDark ? 'hover:bg-slate-700' : 'hover:bg-red-50'} transition-all relative`} {...ttsHandlers('Canlı Ders')}>
                <span className="text-lg">🎥</span>
                <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Canlı Ders</span>
              </Link>
              <Link href="/ogrenci/materyaller" className={`flex flex-col items-center px-3 py-1.5 rounded-xl ${isDark ? 'hover:bg-slate-700' : 'hover:bg-cyan-50'} transition-all`} {...ttsHandlers('Materyaller')}>
                <span className="text-lg">📚</span>
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Materyaller</span>
              </Link>
              <Link href="/ogrenci/ders-programi" className={`flex flex-col items-center px-3 py-1.5 rounded-xl ${isDark ? 'hover:bg-slate-700' : 'hover:bg-indigo-50'} transition-all`} {...ttsHandlers('Program')}>
                <span className="text-lg">📅</span>
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Program</span>
              </Link>
              <Link href="/ogrenci/ilerleme" className={`flex flex-col items-center px-3 py-1.5 rounded-xl ${isDark ? 'hover:bg-slate-700' : 'hover:bg-green-50'} transition-all`} {...ttsHandlers('İlerleme')}>
                <span className="text-lg">📊</span>
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>İlerleme</span>
              </Link>
              <Link href="/ogrenci/devamsizlik" className={`flex flex-col items-center px-3 py-1.5 rounded-xl ${isDark ? 'hover:bg-slate-700' : 'hover:bg-orange-50'} transition-all`} {...ttsHandlers('Yoklama')}>
                <span className="text-lg">✅</span>
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Yoklama</span>
              </Link>
              <Link href="/ogrenci/mesajlar" className={`flex flex-col items-center px-3 py-1.5 rounded-xl ${isDark ? 'hover:bg-slate-700' : 'hover:bg-emerald-50'} transition-all`} {...ttsHandlers('Mesajlar')}>
                <span className="text-lg">💬</span>
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Mesajlar</span>
              </Link>
            </div>

            {/* Sağ - Bildirim ve Profil */}
            <div ref={dropdownRef} className="flex items-center gap-2">
              <LanguageSelector variant={isDark ? 'dark' : 'light'} />
              <ThemeToggle />
              
              {/* Bildirimler */}
              <div className="relative">
                <button
                  onClick={() => handleDropdownToggle('bildirim')}
                  className={`relative p-2 rounded-xl ${isDark ? 'hover:bg-slate-700' : 'hover:bg-yellow-50'} transition-colors`}
                  {...ttsHandlers(`Bildirimler. ${unreadBildirimCount} okunmamış bildirim`)}
                >
                  <span className="text-lg">🔔</span>
                  {unreadBildirimCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadBildirimCount}
                    </span>
                  )}
                </button>
                {openDropdown === 'bildirim' && (
                  <div className={`absolute right-0 top-12 w-80 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} border rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto`}>
                    <div className={`p-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'} flex items-center justify-between`}>
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>🔔 Bildirimler</h3>
                      {unreadBildirimCount > 0 && (
                        <button onClick={markAllBildirimlerAsRead} className="text-xs text-blue-600 font-medium">Tümünü Okundu</button>
                      )}
                    </div>
                    <div className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-50'}`}>
                      {bildirimler.length > 0 ? bildirimler.map((bildirim) => (
                        <div 
                          key={bildirim.id} 
                          className={`p-3 cursor-pointer ${!bildirim.okundu ? (isDark ? 'bg-blue-500/10' : 'bg-blue-50/50') : ''} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}
                          onClick={() => !bildirim.okundu && markBildirimAsRead(bildirim.id)}
                        >
                          <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{bildirim.baslik}</p>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{bildirim.mesaj}</p>
                          <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}><ClientOnlyDate dateString={bildirim.tarih} /></p>
                        </div>
                      )) : (
                        <div className={`p-6 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                          <span className="text-3xl block mb-2">🔕</span>
                          Bildirim yok
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profil */}
              <div className="relative">
                <button
                  onClick={() => handleDropdownToggle('profil')}
                  className={`flex items-center gap-2 p-1.5 rounded-xl ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50'} transition-colors`}
                >
                  <div className={`w-9 h-9 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                    {ogrenci.ad.charAt(0)}
                  </div>
                </button>
                {openDropdown === 'profil' && (
                  <div className={`absolute right-0 top-12 w-64 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} border rounded-2xl shadow-2xl z-50 overflow-hidden`}>
                    <div className="p-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold">
                          {ogrenci.ad.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold">{ogrenci.ad} {ogrenci.soyad}</p>
                          <p className="text-xs text-white/80">{ogrenci.sinif}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button onClick={() => { setShowProfilModal(true); setOpenDropdown(null); }} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        👤 Profili Düzenle
                      </button>
                      <Link href="/ogrenci/mesajlar" className={`block w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        💬 Mesajlarım
                      </Link>
                      <Link href="/ogrenci/hesap-ayarlari" className={`block w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                        ⚙️ Ayarlar
                      </Link>
                      <hr className={`my-2 ${isDark ? 'border-slate-700' : ''}`} />
                      <button onClick={handleLogout} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}>
                        🚪 Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Hoşgeldin Kartı - Gradient Banner */}
        <div className="mb-6 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Merhaba, {ogrenci.ad}! 👋</h1>
            <p className="text-white/80 text-sm sm:text-base">Bugün harika bir gün! Öğrenmeye hazır mısın? 🚀</p>
          </div>
        </div>

        {/* İstatistikler - 4 Kart */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className={`${isDark ? 'bg-slate-800/80 border-blue-500/30' : 'bg-white border-blue-100'} rounded-2xl p-4 border-2 hover:shadow-lg transition-all group cursor-pointer`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>📚</div>
              <div>
                <p className={`${isDark ? 'text-blue-400' : 'text-blue-600'} text-xs font-bold uppercase tracking-wide`}>Toplam Ders</p>
                <p className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{dersSayisi}</p>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-slate-800/80 border-orange-500/30' : 'bg-white border-orange-100'} rounded-2xl p-4 border-2 hover:shadow-lg transition-all group cursor-pointer`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>⚠️</div>
              <div>
                <p className={`${isDark ? 'text-orange-400' : 'text-orange-600'} text-xs font-bold uppercase tracking-wide`}>Devamsızlık</p>
                <p className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{devamsizlikSayisi}</p>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-slate-800/80 border-green-500/30' : 'bg-white border-green-100'} rounded-2xl p-4 border-2 hover:shadow-lg transition-all group cursor-pointer`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>📊</div>
              <div>
                <p className={`${isDark ? 'text-green-400' : 'text-green-600'} text-xs font-bold uppercase tracking-wide`}>Ortalama</p>
                <p className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>%{typeof ortalamaPuan === 'number' ? ortalamaPuan.toFixed(0) : ortalamaPuan}</p>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-slate-800/80 border-purple-500/30' : 'bg-white border-purple-100'} rounded-2xl p-4 border-2 hover:shadow-lg transition-all group cursor-pointer`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>📝</div>
              <div>
                <p className={`${isDark ? 'text-purple-400' : 'text-purple-600'} text-xs font-bold uppercase tracking-wide`}>Deneme Sayısı</p>
                <p className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{grupluDenemeler.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Aktif Sınavlar Banner */}
        {aktifSinavlar.length > 0 && (
          <div className={`mb-6 ${isDark ? 'bg-slate-800/80 border-orange-500/30' : 'bg-white border-orange-100'} rounded-2xl border-2 shadow-lg overflow-hidden`}>
            <div className={`p-4 ${isDark ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20' : 'bg-gradient-to-r from-orange-50 to-amber-50'} border-b ${isDark ? 'border-orange-500/30' : 'border-orange-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-bounce">🎯</span>
                  <div>
                    <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>Aktif Sınavlar Var!</h3>
                    <p className={`${isDark ? 'text-orange-400' : 'text-orange-600'} text-sm font-semibold`}>{aktifSinavlar.length} sınav seni bekliyor</p>
                  </div>
                </div>
                <Link href="/ogrenci/sinavlar" className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all">
                  Tümünü Gör →
                </Link>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {aktifSinavlar.slice(0, 3).map((sinav) => (
                <Link key={sinav.id} href={`/ogrenci/sinavlar/${sinav.id}`} className={`${isDark ? 'bg-slate-700/50 border-orange-500/30 hover:border-orange-400' : 'bg-white border-orange-100 hover:border-orange-300'} rounded-xl p-4 hover:shadow-lg transition-all border-2 group`}>
                  <h4 className={`font-bold ${isDark ? 'text-white group-hover:text-orange-400' : 'text-gray-900 group-hover:text-orange-600'} truncate transition-colors`}>{sinav.baslik}</h4>
                  <p className={`${isDark ? 'text-orange-400' : 'text-orange-600'} text-sm mt-0.5 font-medium`}>{sinav.dersAdi}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className={`${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'} px-2 py-1 rounded-lg font-medium`}>⏱ {sinav.sure}dk</span>
                    <span className={`${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'} px-2 py-1 rounded-lg font-medium`}>📝 {sinav.soruSayisi} soru</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Ana İçerik - 3 Kolon Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Sol Kolon - Deneme Sonuçları */}
          <div className="lg:col-span-4">
            <div className={`${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl border overflow-hidden h-full`}>
              <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-gradient-to-r from-purple-500/20 to-pink-500/20' : 'border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50'}`}>
                <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>📊 Deneme Sonuçlarım</h2>
              </div>
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {grupluDenemeler.length > 0 ? grupluDenemeler.map((deneme) => (
                  <Link
                    key={deneme.sinavAd}
                    href={`/ogrenci/deneme/${getDenemeNo(deneme.sinavAd)}`}
                    className={`block ${isDark ? 'bg-slate-700/50 border-slate-600 hover:border-purple-500/50' : 'bg-gray-50 border-gray-100 hover:border-purple-200'} rounded-xl p-3 border hover:shadow-md transition-all group`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`font-bold text-sm ${isDark ? 'text-white group-hover:text-purple-400' : 'text-gray-900 group-hover:text-purple-600'}`}>{deneme.sinavAd}</h3>
                        <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}><ClientOnlyDate dateString={deneme.tarih} /></p>
                      </div>
                      <div className={`text-lg font-black ${deneme.ortalama >= 80 ? 'text-green-500' : deneme.ortalama >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>%{deneme.ortalama.toFixed(0)}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <span className="text-green-500 font-semibold">{deneme.toplamDogru}D</span>
                      <span className="text-red-500 font-semibold">{deneme.toplamYanlis}Y</span>
                      <span className={`${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{deneme.toplamBos}B</span>
                    </div>
                    <div className={`w-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'} rounded-full h-1.5`}>
                      <div className={`h-1.5 rounded-full ${deneme.ortalama >= 80 ? 'bg-green-500' : deneme.ortalama >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${deneme.ortalama}%` }}></div>
                    </div>
                  </Link>
                )) : (
                  <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    <span className="text-4xl block mb-2">📊</span>
                    Henüz deneme sonucu yok
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Orta Kolon - Haftalık Program ve Devamsızlık */}
          <div className="lg:col-span-5 space-y-6">
            {/* Haftalık Ders Programı */}
            <div className={`${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl border overflow-hidden`}>
              <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-gradient-to-r from-indigo-500/20 to-purple-500/20' : 'border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50'} flex items-center justify-between`}>
                <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>📅 Haftalık Program</h2>
                <Link href="/ogrenci/ders-programi" className={`text-xs ${isDark ? 'text-indigo-400' : 'text-indigo-600'} font-medium`}>Tam Görünüm →</Link>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-6 gap-1.5">
                  {gunler.map((gun) => {
                    const gunDersleri = haftalikProgram[gun] || [];
                    const gunRenkleri: Record<string, string> = {
                      'Pazartesi': 'from-blue-400 to-blue-500',
                      'Salı': 'from-purple-400 to-purple-500',
                      'Çarşamba': 'from-pink-400 to-pink-500',
                      'Perşembe': 'from-green-400 to-green-500',
                      'Cuma': 'from-yellow-400 to-orange-500',
                      'Cumartesi': 'from-indigo-400 to-indigo-500',
                    };
                    return (
                      <div key={gun} className="text-center">
                        <div className={`bg-gradient-to-r ${gunRenkleri[gun]} text-white text-[10px] font-bold py-1 rounded-t-lg`}>{gun.slice(0, 3)}</div>
                        <div className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-50'} rounded-b-lg p-1.5 min-h-[80px] space-y-1`}>
                          {gunDersleri.length > 0 ? gunDersleri.slice(0, 3).map((ders: HaftalikDers) => (
                            <div key={ders.id} className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded p-1 text-[9px]`}>
                              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} truncate`}>{ders.ad}</p>
                              <p className={`${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{ders.baslangicSaati}</p>
                            </div>
                          )) : (
                            <p className={`${isDark ? 'text-slate-600' : 'text-gray-300'} text-[10px] pt-6`}>-</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Devamsızlık Kaydı */}
            {devamsizlikData && devamsizlikData.sonDevamsizliklar.length > 0 && (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white relative overflow-hidden">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-20">⚠️</div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📋</span>
                    <h3 className="font-bold">Devamsızlık Kaydın Var!</h3>
                  </div>
                  <p className="text-white/80 text-sm mb-3">{devamsizlikData.sonDevamsizliklar.length} devamsızlık kaydın bulunuyor.</p>
                  <div className="flex flex-wrap gap-2">
                    {devamsizlikData.sonDevamsizliklar.slice(0, 3).map((kayit) => (
                      <div key={kayit.id} className="bg-white/20 rounded-lg px-3 py-1.5 text-xs">
                        <span className="font-semibold">{kayit.ders}</span>
                        <span className="text-white/70 ml-2"><ClientOnlyDate dateString={kayit.tarih} /></span>
                      </div>
                    ))}
                    {devamsizlikData.sonDevamsizliklar.length > 3 && (
                      <Link href="/ogrenci/devamsizlik" className="bg-white/20 rounded-lg px-3 py-1.5 text-xs hover:bg-white/30">
                        +{devamsizlikData.sonDevamsizliklar.length - 3} daha →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sağ Kolon - Günün Sorusu, Gamification, Öğretmenler */}
          <div className="lg:col-span-3 space-y-6">
            {/* Günün Sorusu */}
            {token && <GununSorusuWidget token={token} />}
            
            {/* Gamification */}
            {token && <GamificationSummary token={token} />}

            {/* Öğretmenlerim */}
            <div className={`${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl border overflow-hidden`}>
              <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-gradient-to-r from-blue-500/20 to-cyan-500/20' : 'border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50'}`}>
                <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>👨‍🏫 Öğretmenlerim</h2>
              </div>
              <div className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-50'} max-h-[300px] overflow-y-auto`}>
                {ogretmenler.length > 0 ? ogretmenler.slice(0, 5).map((ogretmen: Ogretmen) => (
                  <div key={ogretmen.id} className={`p-3 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {ogretmen.ad.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{ogretmen.ad} {ogretmen.soyad}</p>
                        <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{ogretmen.brans}</p>
                      </div>
                      <Link href="/ogrenci/mesajlar" className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}>
                        <span className="text-sm">💬</span>
                      </Link>
                    </div>
                  </div>
                )) : (
                  <div className={`p-6 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    <span className="text-3xl block mb-2">👨‍🏫</span>
                    <p className="text-sm">Henüz öğretmen yok</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Profil Düzenleme Modal */}
      {showProfilModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden`}>
            <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profili Düzenle</h2>
              </div>
              <button onClick={() => setShowProfilModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {/* Profil Fotoğrafı - Tıklanabilir */}
                <div 
                  className={`relative w-16 h-16 rounded-full overflow-hidden cursor-pointer group ${profilFotoYukleniyor ? 'opacity-50' : ''}`}
                  onClick={() => profilFotoInputRef.current?.click()}
                >
                  {profilFoto ? (
                    <img src={profilFoto} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                      {ogrenci.ad.charAt(0)}
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  {/* Loading spinner */}
                  {profilFotoYukleniyor && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input
                  ref={profilFotoInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProfilFotoYukle(file);
                    e.target.value = '';
                  }}
                />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Profil Fotoğrafı</p>
                  <div className="flex gap-2 mt-1">
                    <button 
                      onClick={() => profilFotoInputRef.current?.click()}
                      disabled={profilFotoYukleniyor}
                      className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} font-medium disabled:opacity-50`}
                    >
                      {profilFoto ? 'Değiştir' : 'Fotoğraf Yükle'}
                    </button>
                    {profilFoto && (
                      <button 
                        onClick={handleProfilFotoSil}
                        disabled={profilFotoYukleniyor}
                        className={`text-sm ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} font-medium disabled:opacity-50`}
                      >
                        Sil
                      </button>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>JPG, PNG, WebP • Maks 8MB</p>
                  {profilFotoHata && <p className="text-xs text-red-500 mt-1">{profilFotoHata}</p>}
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Ad</label>
                    <input type="text" defaultValue={ogrenci.ad} className={`w-full px-3 py-2.5 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Soyad</label>
                    <input type="text" defaultValue={ogrenci.soyad} className={`w-full px-3 py-2.5 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`} />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>E-posta</label>
                  <input type="email" defaultValue={ogrenci.email} className={`w-full px-3 py-2.5 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Telefon</label>
                  <input type="tel" defaultValue={ogrenci.telefon} className={`w-full px-3 py-2.5 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`} />
                </div>
              </div>
            </div>
            <div className={`p-6 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'} flex gap-3`}>
              <button onClick={() => setShowProfilModal(false)} className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>İptal</button>
              <button onClick={() => setShowProfilModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Şifre Değiştir Modal */}
      {showSifreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 max-w-lg w-full shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>🔐 Şifre Değiştir</h2>
              <button onClick={() => { setShowSifreModal(false); setYeniSifre(''); setYeniSifreTekrar(''); }} className={`text-3xl font-bold ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Mevcut Şifre</label>
                <input type="password" placeholder="Mevcut şifrenizi girin" className={`w-full px-4 py-3 border rounded-xl ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`} />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Yeni Şifre</label>
                <input type="password" value={yeniSifre} onChange={(e) => setYeniSifre(e.target.value)} placeholder="Yeni şifreni girin" className={`w-full px-4 py-3 border rounded-xl ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`} />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Yeni Şifre (Tekrar)</label>
                <input type="password" value={yeniSifreTekrar} onChange={(e) => setYeniSifreTekrar(e.target.value)} placeholder="Yeni şifreni tekrar girin" className={`w-full px-4 py-3 border rounded-xl ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`} />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-xl">💾 Kaydet</button>
              <button onClick={() => { setShowSifreModal(false); setYeniSifre(''); setYeniSifreTekrar(''); }} className={`flex-1 font-bold py-3 rounded-xl ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-900'}`}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ana export - RoleGuard ile sarmalanmış
export default function OgrenciDashboard() {
  return (
    <RoleGuard allowedRoles={['ogrenci']}>
      <OgrenciDashboardContent />
    </RoleGuard>
  );
}
