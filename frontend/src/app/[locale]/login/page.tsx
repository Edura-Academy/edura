'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';

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

  // BYPASS: Test için hızlı giriş butonları
  const [showBypass, setShowBypass] = useState(false);

  // Bypass kullanıcıları - TEST İÇİN
  const bypassUsers = {
    admin: {
      id: 'bypass-admin',
      email: 'admin@edura.com',
      ad: 'Admin',
      soyad: 'Test',
      role: 'ADMIN',
      kursId: null,
      kursAd: 'Sistem',
    },
    mudur: {
      id: 'bypass-mudur',
      email: 'mudur@edura.com',
      ad: 'Müdür',
      soyad: 'Test',
      role: 'MUDUR',
      brans: null,
      kursId: '1',
      kursAd: 'Edura Merkez',
    },
    ogretmen: {
      id: 'bypass-ogretmen',
      email: 'ogretmen@edura.com',
      ad: 'Öğretmen',
      soyad: 'Test',
      role: 'OGRETMEN',
      brans: 'Matematik',
      kursId: '1',
      kursAd: 'Edura Merkez',
    },
    sekreter: {
      id: 'bypass-sekreter',
      email: 'sekreter@edura.com',
      ad: 'Sekreter',
      soyad: 'Test',
      role: 'SEKRETER',
      kursId: '1',
      kursAd: 'Edura Merkez',
    },
    ogrenci: {
      id: 'bypass-ogrenci',
      email: 'ogrenci@edura.com',
      ad: 'Öğrenci',
      soyad: 'Test',
      role: 'OGRENCI',
      sinif: '10-A',
      kursId: '1',
      kursAd: 'Edura Merkez',
    },
  };

  const handleBypassLogin = (role: keyof typeof bypassUsers) => {
    const user = bypassUsers[role];
    localStorage.setItem('token', 'bypass-token-' + role);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Role göre yönlendir
    if (role === 'admin') {
      router.push('/admin');
    } else if (role === 'ogrenci') {
      router.push('/ogrenci');
    } else {
      router.push('/personel');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // BYPASS: hasan / 123 ile test girişi
    if (kullaniciAdi === 'hasan' && sifre === '123') {
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
        const response = await fetch('http://localhost:5000/api/auth/login', {
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
      router.push('/dashboard');
    }

    setLoading(false);
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

      {/* BYPASS Modal - Test için rol seçimi */}
      {showBypass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                <span className="text-2xl">🔓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Test Girişi</h3>
              <p className="text-gray-500 text-sm mt-1">Hangi rol ile giriş yapmak istersiniz?</p>
            </div>

            <div className="space-y-3">
              {/* Admin */}
              <button
                onClick={() => handleBypassLogin('admin')}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">👑</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Admin</p>
                  <p className="text-sm text-gray-500">Sistem yöneticisi</p>
                </div>
              </button>

              {/* Müdür */}
              <button
                onClick={() => handleBypassLogin('mudur')}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🏢</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Müdür</p>
                  <p className="text-sm text-gray-500">Kurum yöneticisi</p>
                </div>
              </button>

              {/* Öğretmen */}
              <button
                onClick={() => handleBypassLogin('ogretmen')}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">👨‍🏫</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Öğretmen</p>
                  <p className="text-sm text-gray-500">Matematik öğretmeni</p>
                </div>
              </button>

              {/* Sekreter */}
              <button
                onClick={() => handleBypassLogin('sekreter')}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Sekreter</p>
                  <p className="text-sm text-gray-500">İdari işler</p>
                </div>
              </button>

              {/* Öğrenci */}
              <button
                onClick={() => handleBypassLogin('ogrenci')}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🎓</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Öğrenci</p>
                  <p className="text-sm text-gray-500">10-A sınıfı</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowBypass(false)}
              className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
