'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Role'a göre yönlendirilecek sayfa
const roleHomeMap: Record<string, string> = {
  admin: '/admin',
  kursSahibi: '/kurs-sahibi',
  mudur: '/mudur',
  ogretmen: '/ogretmen',
  sekreter: '/sekreter',
  ogrenci: '/ogrenci',
  veli: '/veli',
};

interface Kurs {
  id: string;
  ad: string;
}

interface Sinif {
  id: string;
  ad: string;
  seviye: number;
  kursId: string;
}

interface Cocuk {
  id: string;
  ad: string;
  soyad: string;
  sinif?: string;
}

interface Hesap {
  id: string;
  email: string;
  sifre: string;
  ad: string;
  soyad: string;
  role: string;
  brans?: string;
  ogrenciNo?: string;
  kurs?: Kurs;
  sinif?: Sinif;
  cocuklar?: Cocuk[];
}

interface Stats {
  toplam: number;
  admin: number;
  mudur: number;
  sekreter: number;
  ogretmen: number;
  ogrenci: number;
  veli: number;
}

const roleColors: Record<string, { light: { bg: string; text: string; border: string }; dark: { bg: string; text: string; border: string } }> = {
  admin: { 
    light: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
    dark: { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/50' }
  },
  kursSahibi: { 
    light: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    dark: { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/50' }
  },
  mudur: { 
    light: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    dark: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/50' }
  },
  sekreter: { 
    light: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    dark: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/50' }
  },
  ogretmen: { 
    light: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    dark: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/50' }
  },
  ogrenci: { 
    light: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
    dark: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/50' }
  },
  veli: { 
    light: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    dark: { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/50' }
  },
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  kursSahibi: 'Kurs Sahibi',
  mudur: 'Müdür',
  sekreter: 'Sekreter',
  ogretmen: 'Öğretmen',
  ogrenci: 'Öğrenci',
  veli: 'Veli',
};

const roleIcons: Record<string, string> = {
  admin: '👑',
  kursSahibi: '🏛️',
  mudur: '🏢',
  sekreter: '📋',
  ogretmen: '👨‍🏫',
  ogrenci: '🎓',
  veli: '👪',
};

export default function TestHesapPage() {
  const router = useRouter();
  
  // Şifre doğrulama state'leri
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [pagePassword, setPagePassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Ana sayfa state'leri
  const [hesaplar, setHesaplar] = useState<Hesap[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [kurslar, setKurslar] = useState<Kurs[]>([]);
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [varsayilanSifre, setVarsayilanSifre] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Filtreler
  const [roleFilter, setRoleFilter] = useState('');
  const [kursFilter, setKursFilter] = useState('');
  const [sinifFilter, setSinifFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Mevcut giriş yapmış kullanıcı
  const [currentUser, setCurrentUser] = useState<{ email: string; role: string } | null>(null);

  // Sayfa yüklendiğinde mevcut session'ı kontrol et
  useEffect(() => {
    const savedSession = localStorage.getItem('testPageSession');
    if (savedSession) {
      setSessionToken(savedSession);
      setIsAuthenticated(true);
    }
    setCheckingSession(false);

    // Mevcut kullanıcıyı kontrol et
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser({ email: parsed.email, role: parsed.role });
      } catch {}
    }

    // Dark mode tercihini kontrol et
    const savedDarkMode = localStorage.getItem('testPageDarkMode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  // Authenticated olunca hesapları getir
  useEffect(() => {
    if (isAuthenticated && sessionToken) {
      fetchHesaplar();
    }
  }, [isAuthenticated, sessionToken]);

  // Şifre doğrulama
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordLoading(true);

    try {
      const response = await fetch(`${API_URL}/test/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pagePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Şifre doğrulanamadı');
        setPasswordLoading(false);
        return;
      }

      // Session token'ı kaydet
      const token = data.data.sessionToken;
      localStorage.setItem('testPageSession', token);
      setSessionToken(token);
      setIsAuthenticated(true);
    } catch (err) {
      setPasswordError('Bağlantı hatası. Backend çalışıyor mu?');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Oturumu kapat (test sayfası oturumu)
  const handleSessionLogout = () => {
    localStorage.removeItem('testPageSession');
    setSessionToken(null);
    setIsAuthenticated(false);
    setPagePassword('');
    setHesaplar([]);
  };

  // Dark mode değiştiğinde kaydet
  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('testPageDarkMode', String(newValue));
  };

  const fetchHesaplar = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/test/hesaplar`, {
        headers: {
          'x-test-session': sessionToken || '',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Session geçersiz - yeniden giriş gerekli
          handleSessionLogout();
          return;
        }
        setError(data.error || 'Veriler getirilemedi');
        return;
      }

      setHesaplar(data.data.hesaplar);
      setStats(data.data.stats);
      setKurslar(data.data.kurslar);
      setSiniflar(data.data.siniflar);
      setVarsayilanSifre(data.data.varsayilanSifre);
    } catch (err) {
      setError('Bağlantı hatası. Backend çalışıyor mu?');
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş sınıflar (seçilen kursa göre)
  const filteredSiniflar = useMemo(() => {
    if (!kursFilter) return siniflar;
    return siniflar.filter(s => s.kursId === kursFilter);
  }, [kursFilter, siniflar]);

  // Filtrelenmiş hesaplar
  const filteredHesaplar = useMemo(() => {
    return hesaplar.filter(h => {
      if (roleFilter && h.role !== roleFilter) return false;
      if (kursFilter && h.kurs?.id !== kursFilter) return false;
      if (sinifFilter && h.sinif?.id !== sinifFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${h.ad} ${h.soyad}`.toLowerCase();
        const email = h.email.toLowerCase();
        if (!fullName.includes(query) && !email.includes(query)) return false;
      }
      return true;
    });
  }, [hesaplar, roleFilter, kursFilter, sinifFilter, searchQuery]);

  const copyToClipboard = async (text: string, email: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
    }
  };

  const clearFilters = () => {
    setRoleFilter('');
    setKursFilter('');
    setSinifFilter('');
    setSearchQuery('');
  };

  // Hızlı giriş yap - bir hesaba tıklayınca otomatik giriş ve YENİ SEKMEDE aç
  const quickLogin = async (hesap: Hesap) => {
    setLoginLoading(hesap.id);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kullaniciAdi: hesap.email,
          sifre: hesap.sifre,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Giriş başarısız');
        setLoginLoading(null);
        return;
      }

      // Token ve kullanıcı bilgilerini kaydet
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Mevcut kullanıcıyı güncelle
      setCurrentUser({ email: data.data.user.email, role: data.data.user.role });

      // Role göre YENİ SEKMEDE aç (test sayfası açık kalır)
      const targetPath = roleHomeMap[data.data.user.role] || '/login';
      const fullUrl = `${window.location.origin}${targetPath}`;
      window.open(fullUrl, '_blank');
      
      setLoginLoading(null);
    } catch (err) {
      setError('Bağlantı hatası');
      setLoginLoading(null);
    }
  };

  // Panele git - yeni sekmede
  const goToPanel = () => {
    if (currentUser) {
      const targetPath = roleHomeMap[currentUser.role] || '/login';
      const fullUrl = `${window.location.origin}${targetPath}`;
      window.open(fullUrl, '_blank');
    }
  };

  // Çıkış yap (kullanıcı oturumu)
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // Role renklerini al (dark/light mode'a göre)
  const getRoleColors = (role: string) => {
    const colors = roleColors[role];
    if (!colors) return { bg: '', text: '', border: '' };
    return darkMode ? colors.dark : colors.light;
  };

  // Session kontrol ediliyor
  if (checkingSession) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
          : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30'
      }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4 ${
            darkMode ? 'border-blue-400' : 'border-blue-500'
          }`}></div>
          <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  // Şifre giriş ekranı
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
          : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30'
      }`}>
        {/* Dark mode toggle - sağ üst */}
        <button
          onClick={toggleDarkMode}
          className={`fixed top-4 right-4 p-2.5 rounded-xl transition-all ${
            darkMode 
              ? 'bg-slate-700 hover:bg-slate-600 text-yellow-300' 
              : 'bg-white hover:bg-slate-100 text-slate-600 shadow-lg'
          }`}
          title={darkMode ? 'Açık Mod' : 'Koyu Mod'}
        >
          {darkMode ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        <div className={`w-full max-w-md rounded-2xl p-8 shadow-2xl transition-colors duration-300 ${
          darkMode 
            ? 'bg-slate-800 border border-slate-700' 
            : 'bg-white border border-slate-200'
        }`}>
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/25">
              <span className="text-4xl">🔐</span>
            </div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Test Hesapları
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Bu sayfaya erişmek için şifre gerekli
            </p>
          </div>

          {/* Şifre Formu */}
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Sayfa Şifresi
              </label>
              <input
                type="password"
                value={pagePassword}
                onChange={(e) => setPagePassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className={`w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg ${
                  darkMode 
                    ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>

            {passwordError && (
              <div className={`p-3 rounded-xl text-sm ${
                darkMode 
                  ? 'bg-red-900/30 text-red-300 border border-red-800' 
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                ⚠️ {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading || !pagePassword}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl 
                       hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  Doğrulanıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          {/* Alt bilgi */}
          <div className={`mt-6 text-center text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <p>🔒 Bu sayfa şifre korumalıdır</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading durumu
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
          : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30'
      }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-14 w-14 border-4 border-t-transparent mx-auto mb-4 ${
            darkMode ? 'border-blue-400' : 'border-blue-500'
          }`}></div>
          <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Hesaplar yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
          : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30'
      }`}>
        <div className={`rounded-2xl p-8 max-w-md text-center shadow-xl ${
          darkMode 
            ? 'bg-slate-800 border border-red-500/30' 
            : 'bg-white border border-red-200'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            darkMode ? 'bg-red-900/50' : 'bg-red-100'
          }`}>
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Hata!</h2>
          <p className={`mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{error}</p>
          <button
            onClick={fetchHesaplar}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Ana sayfa
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 backdrop-blur-xl border-b transition-colors duration-300 ${
        darkMode 
          ? 'bg-slate-900/80 border-slate-700' 
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-xl">🔐</span>
              </div>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  Test Hesapları
                </h1>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Varsayılan şifre: <code className={`px-2 py-0.5 rounded font-mono text-xs ${
                    darkMode 
                      ? 'bg-blue-900/50 text-blue-300' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>{varsayilanSifre}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2.5 rounded-xl transition-all ${
                  darkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 text-yellow-300' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title={darkMode ? 'Açık Mod' : 'Koyu Mod'}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              {/* Oturumu Kapat (Sayfa oturumu) */}
              <button
                onClick={handleSessionLogout}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  darkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title="Sayfa oturumunu kapat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Kilitle
              </button>

              {/* Aktif Kullanıcı */}
              {currentUser && (
                <div className={`flex items-center gap-3 rounded-xl px-4 py-2 ${
                  darkMode 
                    ? 'bg-emerald-900/30 border border-emerald-700' 
                    : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{roleIcons[currentUser.role]}</span>
                    <div>
                      <p className={`text-xs font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        Aktif Hesap:
                      </p>
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 ml-2 pl-3 border-l ${
                    darkMode ? 'border-emerald-700' : 'border-emerald-200'
                  }`}>
                    <button
                      onClick={goToPanel}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-medium rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                    >
                      Panele Git →
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        darkMode 
                          ? 'bg-red-900/40 text-red-300 hover:bg-red-900/60' 
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      Çıkış
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className={`flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-dashed ${
              darkMode ? 'border-slate-700' : 'border-slate-200'
            }`}>
              {Object.entries(stats).filter(([key]) => key !== 'toplam').map(([key, value]) => {
                const colors = getRoleColors(key);
                return (
                  <div
                    key={key}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 border transition-colors ${colors.bg} ${colors.text} ${colors.border}`}
                  >
                    <span>{roleIcons[key]}</span>
                    <span>{value}</span>
                  </div>
                );
              })}
              <div className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                darkMode 
                  ? 'bg-slate-700 text-white border-slate-600' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                Toplam: {stats.toplam}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className={`rounded-2xl p-5 mb-6 shadow-lg transition-colors duration-300 ${
          darkMode 
            ? 'bg-slate-800/50 border border-slate-700' 
            : 'bg-white border border-slate-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
            }`}>
              <span className="text-blue-500">🔍</span>
            </div>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Filtreler</h3>
            {(roleFilter || kursFilter || sinifFilter || searchQuery) && (
              <button
                onClick={clearFilters}
                className={`ml-auto text-sm flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                  darkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>✕</span> Temizle
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Arama */}
            <div className="relative">
              <input
                type="text"
                placeholder="İsim veya email ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-2.5 pl-10 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>🔎</span>
            </div>

            {/* Rol filtresi */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`px-4 py-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                darkMode 
                  ? 'bg-slate-700 border border-slate-600 text-white' 
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}
            >
              <option value="">Tüm Roller</option>
              <option value="admin">👑 Admin</option>
              <option value="kursSahibi">🏛️ Kurs Sahibi</option>
              <option value="mudur">🏢 Müdür</option>
              <option value="sekreter">📋 Sekreter</option>
              <option value="ogretmen">👨‍🏫 Öğretmen</option>
              <option value="ogrenci">🎓 Öğrenci</option>
              <option value="veli">👪 Veli</option>
            </select>

            {/* Kurs filtresi */}
            <select
              value={kursFilter}
              onChange={(e) => {
                setKursFilter(e.target.value);
                setSinifFilter('');
              }}
              className={`px-4 py-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                darkMode 
                  ? 'bg-slate-700 border border-slate-600 text-white' 
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}
            >
              <option value="">Tüm Kurslar</option>
              {kurslar.map(kurs => (
                <option key={kurs.id} value={kurs.id}>{kurs.ad}</option>
              ))}
            </select>

            {/* Sınıf filtresi */}
            <select
              value={sinifFilter}
              onChange={(e) => setSinifFilter(e.target.value)}
              className={`px-4 py-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode 
                  ? 'bg-slate-700 border border-slate-600 text-white' 
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}
              disabled={!kursFilter && filteredSiniflar.length === 0}
            >
              <option value="">Tüm Sınıflar</option>
              {filteredSiniflar.map(sinif => (
                <option key={sinif.id} value={sinif.id}>{sinif.ad}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sonuç sayısı */}
        <div className={`text-sm mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-700'}`}>{filteredHesaplar.length}</span> hesap gösteriliyor
          {(roleFilter || kursFilter || sinifFilter || searchQuery) && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
            }`}>filtrelenmiş</span>
          )}
        </div>

        {/* Tablo */}
        <div className={`rounded-2xl overflow-hidden shadow-2xl transition-colors duration-300 ${
          darkMode 
            ? 'bg-slate-800/80 border border-slate-600/50 backdrop-blur-sm' 
            : 'bg-white border border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${
                  darkMode ? 'bg-slate-900/50 border-slate-600' : 'bg-slate-50 border-slate-200'
                }`}>
                  <th className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>Kullanıcı</th>
                  <th className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>Email</th>
                  <th className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>Rol</th>
                  <th className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>Kurs</th>
                  <th className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>Sınıf/Branş/Öğrenci</th>
                  <th className={`px-5 py-4 text-center text-xs font-bold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>Aksiyon</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                {filteredHesaplar.map((hesap, index) => {
                  const colors = getRoleColors(hesap.role);
                  return (
                    <tr 
                      key={hesap.id} 
                      className={`transition-all duration-200 ${
                        darkMode 
                          ? `hover:bg-slate-700/70 ${index % 2 === 0 ? 'bg-slate-800/40' : 'bg-slate-800/20'}` 
                          : `hover:bg-blue-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${
                            darkMode ? `${colors.bg} border ${colors.border}` : colors.bg
                          }`}>
                            <span className="text-lg">{roleIcons[hesap.role] || '👤'}</span>
                          </div>
                          <div>
                            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                              {hesap.ad} {hesap.soyad}
                            </p>
                            {hesap.ogrenciNo && (
                              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                #{hesap.ogrenciNo}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <code className={`text-sm font-mono px-3 py-1.5 rounded-lg ${
                          darkMode 
                            ? 'bg-slate-900/80 text-cyan-300 border border-slate-600' 
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {hesap.email}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}>
                          {roleLabels[hesap.role] || hesap.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                          {hesap.kurs?.ad || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                          {hesap.role === 'veli' && hesap.cocuklar && hesap.cocuklar.length > 0
                            ? hesap.cocuklar.map(c => `${c.ad} ${c.soyad}`).join(', ')
                            : hesap.sinif?.ad || hesap.brans || '-'}
                        </span>
                        {hesap.role === 'veli' && hesap.cocuklar && hesap.cocuklar.length > 0 && (
                          <span className={`block text-xs mt-1 font-medium ${darkMode ? 'text-pink-400' : 'text-pink-500'}`}>
                            👶 {hesap.cocuklar.length === 1 ? 'Velisi' : `${hesap.cocuklar.length} öğrencinin velisi`}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => quickLogin(hesap)}
                            disabled={loginLoading === hesap.id}
                            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 ${
                              currentUser?.email === hesap.email
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-default ring-2 ring-emerald-400/50'
                                : loginLoading === hesap.id
                                ? 'bg-blue-400 text-white cursor-wait'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                            }`}
                          >
                            {currentUser?.email === hesap.email
                              ? '✓ Aktif'
                              : loginLoading === hesap.id
                              ? '⏳ Giriş...'
                              : '🚀 Giriş Yap'}
                          </button>
                          <button
                            onClick={() => copyToClipboard(hesap.email, hesap.email)}
                            className={`p-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
                              copiedEmail === hesap.email
                                ? darkMode 
                                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                                  : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                : darkMode
                                  ? 'bg-slate-700/80 text-slate-200 hover:bg-slate-600 border border-slate-500/50'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                            }`}
                            title="Email Kopyala"
                          >
                            {copiedEmail === hesap.email ? '✓' : '📋'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredHesaplar.length === 0 && (
            <div className="text-center py-20">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
                darkMode ? 'bg-slate-700/50 border border-slate-600' : 'bg-slate-100'
              }`}>
                <span className="text-4xl">🔍</span>
              </div>
              <p className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                Sonuç bulunamadı
              </p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Filtrelerinizi değiştirmeyi deneyin
              </p>
              <button
                onClick={clearFilters}
                className={`mt-4 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  darkMode 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>

        {/* Bilgi notu */}
        <div className={`mt-6 rounded-2xl p-5 transition-colors duration-300 ${
          darkMode 
            ? 'bg-amber-900/20 border border-amber-700/50' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              darkMode ? 'bg-amber-900/50' : 'bg-amber-100'
            }`}>
              <span className="text-2xl">💡</span>
            </div>
            <div className="text-sm">
              <p className={`font-semibold mb-2 ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                🚀 Hızlı Test:
              </p>
              <ul className={`list-disc list-inside space-y-1 ${darkMode ? 'text-amber-200/80' : 'text-amber-700'}`}>
                <li><strong>&quot;Giriş Yap&quot;</strong> butonuna tıklayın - otomatik giriş yapılır ve panel yeni sekmede açılır</li>
                <li>Aktif hesap yeşil <strong>&quot;✓ Aktif&quot;</strong> olarak gösterilir</li>
                <li>Header&apos;daki &quot;Panele Git&quot; butonu ile aktif panele yeni sekmede erişebilirsiniz</li>
              </ul>
              <p className={`font-semibold mb-2 mt-4 ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                📝 Manuel Giriş:
              </p>
              <ul className={`list-disc list-inside space-y-1 ${darkMode ? 'text-amber-200/80' : 'text-amber-700'}`}>
                <li><strong>Kullanıcı Adı:</strong> Email adresi</li>
                <li><strong>Admin Şifresi:</strong> <code className={`px-1.5 py-0.5 rounded ${
                  darkMode ? 'bg-violet-800/50 text-violet-200' : 'bg-violet-200 text-violet-800'
                }`}>Edura2026.!</code></li>
                <li><strong>Diğer Hesaplar:</strong> <code className={`px-1.5 py-0.5 rounded ${
                  darkMode ? 'bg-amber-800/50 text-amber-200' : 'bg-amber-200 text-amber-800'
                }`}>edura123</code></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-8 text-center text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <p>Edura Test Ortamı • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
