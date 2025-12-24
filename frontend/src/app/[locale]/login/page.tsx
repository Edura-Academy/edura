'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const backgrounds = [
  '/login-backgrounds/galata.jpg',
  '/login-backgrounds/Ortakoy.jpg',
  '/login-backgrounds/3.jpg',
  '/login-backgrounds/4.jpg',
];

export default function LoginPage() {
  const router = useRouter();
  const [currentBg, setCurrentBg] = useState(0);
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [kullaniciTuru, setKullaniciTuru] = useState('personel');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Arkaplan slider - 3 saniyede bir değişir
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // BYPASS: Test için hızlı giriş
  const [showBypass, setShowBypass] = useState(false);
  const [bypassLoading, setBypassLoading] = useState(false);

  // ==========================================================
  // MALTEPE ZAMBAK KURSU - TEST KULLANICILARI
  // Tüm kullanıcılar aynı kursa ait, mesajlaşma testi için ideal
  // ==========================================================
  interface TestUser {
    email: string;
    ad: string;
    soyad: string;
    role: string;
    brans?: string;
    sinif?: string;
    icon: string;
    color: string;
    description: string;
  }

  const testUsers: Record<string, TestUser> = {
    // ========== ADMİN ==========
    admin: {
      email: 'admin@edura.com',
      ad: 'Admin',
      soyad: 'Edura',
      role: 'admin',
      icon: '👑',
      color: 'purple',
      description: 'Tüm sistem yetkileri',
    },

    // ========== MÜDÜR - Maltepe Zambak ==========
    mudur: {
      email: 'mudur.zambak@edura.com',
      ad: 'Hasan',
      soyad: 'Yıldırım',
      role: 'mudur',
      brans: 'Matematik',
      icon: '🏢',
      color: 'blue',
      description: 'Müdür (Matematik branşlı)',
    },

    // ========== SEKRETER - Maltepe Zambak ==========
    sekreter: {
      email: 'sekreter.zambak@edura.com',
      ad: 'Ayşe',
      soyad: 'Demir',
      role: 'sekreter',
      icon: '📋',
      color: 'orange',
      description: 'Kayıt & İdari işler',
    },

    // ========== ÖĞRETMENLER - Maltepe Zambak ==========
    ogretmen_matematik: {
      email: 'matematik.zambak@edura.com',
      ad: 'Ahmet',
      soyad: 'Kaya',
      role: 'ogretmen',
      brans: 'Matematik',
      icon: '📐',
      color: 'green',
      description: 'Matematik',
    },
    ogretmen_turkce: {
      email: 'turkce.zambak@edura.com',
      ad: 'Fatma',
      soyad: 'Öztürk',
      role: 'ogretmen',
      brans: 'Türkçe',
      icon: '📚',
      color: 'green',
      description: 'Türkçe',
    },
    ogretmen_ingilizce: {
      email: 'ingilizce.zambak@edura.com',
      ad: 'Deniz',
      soyad: 'Aktaş',
      role: 'ogretmen',
      brans: 'İngilizce',
      icon: '🌍',
      color: 'green',
      description: 'İngilizce',
    },
    ogretmen_fen: {
      email: 'fenbilimleri.zambak@edura.com',
      ad: 'Ali',
      soyad: 'Kılıç',
      role: 'ogretmen',
      brans: 'Fen Bilimleri',
      icon: '🔬',
      color: 'green',
      description: 'Fen Bilimleri',
    },
    ogretmen_sosyal: {
      email: 'sosyalbilgiler.zambak@edura.com',
      ad: 'Zehra',
      soyad: 'Güneş',
      role: 'ogretmen',
      brans: 'Sosyal Bilgiler',
      icon: '🌎',
      color: 'green',
      description: 'Sosyal Bilgiler',
    },
    ogretmen_fizik: {
      email: 'fizik.zambak@edura.com',
      ad: 'Can',
      soyad: 'Korkmaz',
      role: 'ogretmen',
      brans: 'Fizik',
      icon: '⚛️',
      color: 'green',
      description: 'Fizik',
    },

    // ========== ÖĞRENCİLER - Maltepe Zambak (Her seviyeden birer öğrenci) ==========
    ogrenci_12a: {
      email: 'ogrenci.12a@edura.com',
      ad: 'Test',
      soyad: 'Öğrenci 12-A',
      role: 'ogrenci',
      sinif: '12-A',
      icon: '🎓',
      color: 'cyan',
      description: '12. Sınıf - TYT/AYT',
    },
    ogrenci_11a: {
      email: 'ogrenci.11a@edura.com',
      ad: 'Test',
      soyad: 'Öğrenci 11-A',
      role: 'ogrenci',
      sinif: '11-A',
      icon: '🎓',
      color: 'cyan',
      description: '11. Sınıf',
    },
    ogrenci_10a: {
      email: 'ogrenci.10a@edura.com',
      ad: 'Test',
      soyad: 'Öğrenci 10-A',
      role: 'ogrenci',
      sinif: '10-A',
      icon: '🎓',
      color: 'cyan',
      description: '10. Sınıf',
    },
    ogrenci_9a: {
      email: 'ogrenci.9a@edura.com',
      ad: 'Test',
      soyad: 'Öğrenci 9-A',
      role: 'ogrenci',
      sinif: '9-A',
      icon: '🎓',
      color: 'cyan',
      description: '9. Sınıf',
    },
    ogrenci_8a: {
      email: 'ogrenci.8a@edura.com',
      ad: 'Test',
      soyad: 'Öğrenci 8-A',
      role: 'ogrenci',
      sinif: '8-A',
      icon: '📖',
      color: 'cyan',
      description: '8. Sınıf - LGS',
    },
    ogrenci_7a: {
      email: 'ogrenci.7a@edura.com',
      ad: 'Test',
      soyad: 'Öğrenci 7-A',
      role: 'ogrenci',
      sinif: '7-A',
      icon: '📖',
      color: 'cyan',
      description: '7. Sınıf',
    },
    ogrenci_6a: {
      email: 'ogrenci.6a@edura.com',
      ad: 'Test',
      soyad: 'Öğrenci 6-A',
      role: 'ogrenci',
      sinif: '6-A',
      icon: '📖',
      color: 'cyan',
      description: '6. Sınıf',
    },
    ogrenci_5a: {
      email: 'ogrenci.5a@edura.com',
      ad: 'Test',
      soyad: 'Öğrenci 5-A',
      role: 'ogrenci',
      sinif: '5-A',
      icon: '✏️',
      color: 'cyan',
      description: '5. Sınıf',
    },
  };

  // Bypass giriş - Backend'e API çağrısı yaparak gerçek kullanıcı ile giriş
  const handleBypassLogin = async (userKey: string) => {
    const user = testUsers[userKey];
    if (!user) return;

    setBypassLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/bypass-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Bypass giriş başarısız');
        setBypassLoading(false);
        return;
      }

      // Token ve kullanıcı bilgilerini kaydet
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Role göre yönlendir
      const userRole = data.data.user.role;
      if (userRole === 'admin') {
        router.push('/admin');
      } else if (userRole === 'ogrenci') {
        router.push('/ogrenci');
      } else {
        router.push('/personel');
      }

      setShowBypass(false);
    } catch (err) {
      console.error('Bypass login error:', err);
      setError('Bağlantı hatası. Backend çalışıyor mu?');
    } finally {
      setBypassLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // BYPASS: edura / 123 ile test girişi
    if (kullaniciAdi === 'edura' && sifre === '123') {
      setShowBypass(true);
      setLoading(false);
      return;
    }

    // Personel seçildiyse sırayla tüm personel tablolarında ara
    const personelTurleri = ['kurs', 'mudur', 'ogretmen', 'sekreter'];
    const aramaTurleri = kullaniciTuru === 'personel' ? personelTurleri : ['ogrenci'];

    let loginSuccess = false;
    let loginData = null;

    for (const tur of aramaTurleri) {
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kullaniciAdi, sifre, kullaniciTuru: tur }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          loginSuccess = true;
          loginData = data;
          break;
        }
      } catch (err) {
        console.error(`${tur} kontrolü hatası:`, err);
      }
    }

    if (!loginSuccess || !loginData) {
      setError('Kullanıcı adı veya şifre hatalı');
      setLoading(false);
      return;
    }

    // Token'ı kaydet
    localStorage.setItem('token', loginData.data.token);
    localStorage.setItem('user', JSON.stringify(loginData.data.user));

    // İlk giriş kontrolü - şifre değiştirilmemişse yönlendir
    if (!loginData.data.user.sifreDegistirildiMi) {
      router.push('/change-password');
    } else {
      // Role göre yönlendir
      const userRole = loginData.data.user.role;
      if (userRole === 'admin') {
        router.push('/admin');
      } else if (userRole === 'ogrenci') {
        router.push('/ogrenci');
      } else {
        router.push('/personel');
      }
    }

    setLoading(false);
  };

  // Renk sınıflarını al
  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; bg: string; iconBg: string }> = {
      purple: { border: 'hover:border-purple-500', bg: 'hover:bg-purple-50', iconBg: 'bg-purple-100' },
      blue: { border: 'hover:border-blue-500', bg: 'hover:bg-blue-50', iconBg: 'bg-blue-100' },
      green: { border: 'hover:border-green-500', bg: 'hover:bg-green-50', iconBg: 'bg-green-100' },
      orange: { border: 'hover:border-orange-500', bg: 'hover:bg-orange-50', iconBg: 'bg-orange-100' },
      cyan: { border: 'hover:border-cyan-500', bg: 'hover:bg-cyan-50', iconBg: 'bg-cyan-100' },
    };
    return colors[color] || colors.blue;
  };

  // Test kullanıcı butonu render helper
  const renderTestUserButton = (key: string, user: TestUser, fullWidth = false) => {
    const colorClasses = getColorClasses(user.color);
    return (
      <button
        key={key}
        onClick={() => handleBypassLogin(key)}
        disabled={bypassLoading}
        className={`${fullWidth ? 'w-full' : ''} p-3 rounded-xl border-2 border-gray-200 ${colorClasses.border} ${colorClasses.bg} transition-all flex items-center gap-3 disabled:opacity-50`}
      >
        <div className={`w-10 h-10 ${colorClasses.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
          <span className="text-lg">{user.icon}</span>
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{user.ad} {user.soyad}</p>
          <p className="text-xs text-gray-500 truncate">{user.description}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Arkaplan Slider */}
      {backgrounds.map((bg, index) => (
        <div
          key={bg}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            index === currentBg ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${bg})` }}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Login Card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <span className="text-white text-2xl font-bold">E</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Edura</h1>
            <p className="text-gray-500 text-sm mt-1">Kurs Takip Sistemi</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Kullanıcı Türü - Sadece Personel ve Öğrenci */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Türü
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setKullaniciTuru('personel')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                    kullaniciTuru === 'personel'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Personel
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setKullaniciTuru('ogrenci')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                    kullaniciTuru === 'ogrenci'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Öğrenci
                  </div>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {kullaniciTuru === 'personel' 
                  ? 'Kurs, Müdür, Öğretmen, Sekreter girişi' 
                  : 'Öğrenci girişi'}
              </p>
            </div>

            {/* Kullanıcı Adı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={kullaniciAdi}
                  onChange={(e) => setKullaniciAdi(e.target.value)}
                  placeholder="Kullanıcı adınızı girin"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
                  required
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  placeholder="Şifrenizi girin"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
                  required
                />
              </div>
            </div>

            {/* Hata Mesajı */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                kullaniciTuru === 'personel'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          {/* Alt Bilgi */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Şifremi Unuttum
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              © 2025 Edura Academy. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>

      {/* Slide İndikatörler */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {backgrounds.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentBg(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentBg ? 'bg-white w-6' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* BYPASS Modal - Test için kullanıcı seçimi - MALTEPE ZAMBAK KURSU */}
      {showBypass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                <span className="text-2xl">🔓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Test Girişi</h3>
              <p className="text-gray-500 text-sm mt-1">Hangi kullanıcı ile giriş yapmak istersiniz?</p>
              <div className="mt-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg inline-block">
                <p className="text-xs text-amber-700 font-medium">🏫 Maltepe Zambak Kursu</p>
                <p className="text-[10px] text-amber-600">Tüm kullanıcılar aynı kursa ait</p>
              </div>
            </div>

            {/* Hata mesajı */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Loading indicator */}
            {bypassLoading && (
              <div className="mb-4 flex items-center justify-center gap-2 text-blue-600">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">Giriş yapılıyor...</span>
              </div>
            )}

            {/* ========== ADMİN ========== */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>👑</span> Sistem Yönetimi
              </h4>
              {renderTestUserButton('admin', testUsers.admin, true)}
            </div>

            {/* ========== MÜDÜR ========== */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>🏢</span> Müdür
              </h4>
              {renderTestUserButton('mudur', testUsers.mudur, true)}
            </div>

            {/* ========== SEKRETER ========== */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>📋</span> Sekreter
              </h4>
              {renderTestUserButton('sekreter', testUsers.sekreter, true)}
            </div>

            {/* ========== ÖĞRETMENLER ========== */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>👨‍🏫</span> Öğretmenler (6 branş)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {renderTestUserButton('ogretmen_matematik', testUsers.ogretmen_matematik)}
                {renderTestUserButton('ogretmen_turkce', testUsers.ogretmen_turkce)}
                {renderTestUserButton('ogretmen_ingilizce', testUsers.ogretmen_ingilizce)}
                {renderTestUserButton('ogretmen_fen', testUsers.ogretmen_fen)}
                {renderTestUserButton('ogretmen_sosyal', testUsers.ogretmen_sosyal)}
                {renderTestUserButton('ogretmen_fizik', testUsers.ogretmen_fizik)}
              </div>
            </div>

            {/* ========== ÖĞRENCİLER ========== */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>🎓</span> Öğrenciler (Her seviyeden)
              </h4>
              
              {/* Lise */}
              <p className="text-[10px] text-gray-400 mb-1 ml-1">Lise (9-12)</p>
              <div className="grid grid-cols-4 gap-2 mb-2">
                <button
                  onClick={() => handleBypassLogin('ogrenci_12a')}
                  disabled={bypassLoading}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center disabled:opacity-50"
                >
                  <span className="text-lg">🎓</span>
                  <p className="font-semibold text-gray-800 text-[10px]">12-A</p>
                </button>
                <button
                  onClick={() => handleBypassLogin('ogrenci_11a')}
                  disabled={bypassLoading}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center disabled:opacity-50"
                >
                  <span className="text-lg">🎓</span>
                  <p className="font-semibold text-gray-800 text-[10px]">11-A</p>
                </button>
                <button
                  onClick={() => handleBypassLogin('ogrenci_10a')}
                  disabled={bypassLoading}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center disabled:opacity-50"
                >
                  <span className="text-lg">🎓</span>
                  <p className="font-semibold text-gray-800 text-[10px]">10-A</p>
                </button>
                <button
                  onClick={() => handleBypassLogin('ogrenci_9a')}
                  disabled={bypassLoading}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center disabled:opacity-50"
                >
                  <span className="text-lg">🎓</span>
                  <p className="font-semibold text-gray-800 text-[10px]">9-A</p>
                </button>
              </div>

              {/* Ortaokul */}
              <p className="text-[10px] text-gray-400 mb-1 ml-1">Ortaokul (5-8)</p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleBypassLogin('ogrenci_8a')}
                  disabled={bypassLoading}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center disabled:opacity-50"
                >
                  <span className="text-lg">📖</span>
                  <p className="font-semibold text-gray-800 text-[10px]">8-A</p>
                </button>
                <button
                  onClick={() => handleBypassLogin('ogrenci_7a')}
                  disabled={bypassLoading}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center disabled:opacity-50"
                >
                  <span className="text-lg">📖</span>
                  <p className="font-semibold text-gray-800 text-[10px]">7-A</p>
                </button>
                <button
                  onClick={() => handleBypassLogin('ogrenci_6a')}
                  disabled={bypassLoading}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center disabled:opacity-50"
                >
                  <span className="text-lg">📖</span>
                  <p className="font-semibold text-gray-800 text-[10px]">6-A</p>
                </button>
                <button
                  onClick={() => handleBypassLogin('ogrenci_5a')}
                  disabled={bypassLoading}
                  className="p-2 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all text-center disabled:opacity-50"
                >
                  <span className="text-lg">✏️</span>
                  <p className="font-semibold text-gray-800 text-[10px]">5-A</p>
                </button>
              </div>
            </div>

            {/* Bilgi notu */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 <strong>Mesajlaşma testi için:</strong> Farklı sekmelerde farklı kullanıcılarla giriş yaparak birbirinize mesaj atabilirsiniz. Tüm kullanıcılar Maltepe Zambak kursuna ait.
              </p>
            </div>

            <button
              onClick={() => setShowBypass(false)}
              className="w-full mt-2 py-2 text-gray-500 hover:text-gray-700 text-sm border-t border-gray-100 pt-4"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
