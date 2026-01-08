'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useTranslations } from 'next-intl';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const backgrounds = [
  '/login-backgrounds/galata.jpg',
  '/login-backgrounds/Ortakoy.jpg',
  '/login-backgrounds/3.jpg',
  '/login-backgrounds/4.jpg',
];

export default function LoginPage() {
  const router = useRouter();
  const { speak, ttsEnabled } = useAccessibility();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const t = useTranslations('auth');
  const [currentBg, setCurrentBg] = useState(0);
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [kullaniciTuru, setKullaniciTuru] = useState('personel');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcomeSpoken, setWelcomeSpoken] = useState(false);

  // Arkaplan slider - 3 saniyede bir değişir
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sayfa yüklendiğinde hoşgeldin mesajı
  useEffect(() => {
    if (ttsEnabled && !welcomeSpoken) {
      setTimeout(() => {
        speak('Edura giriş sayfasına hoş geldiniz. Sesli asistan özelliğini sağ üstten açıp kapatabilirsiniz. Lütfen kullanıcı türünüzü seçin ve bilgilerinizi girin.');
        setWelcomeSpoken(true);
      }, 500);
    }
  }, [ttsEnabled, welcomeSpoken, speak]);

  // TTS yardımcı fonksiyonu
  const handleSpeak = useCallback((text: string) => {
    if (ttsEnabled) {
      speak(text);
    }
  }, [ttsEnabled, speak]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
      setError(t('invalidCredentials'));
      setLoading(false);
      return;
    }

    // Token'ı kaydet
    localStorage.setItem('token', loginData.data.token);
    localStorage.setItem('user', JSON.stringify(loginData.data.user));

    // Başarılı giriş bildirimi
    handleSpeak(`Hoş geldiniz ${loginData.data.user.ad}. Giriş başarılı, yönlendiriliyorsunuz.`);

    // İlk giriş kontrolü - şifre değiştirilmemişse yönlendir
    if (!loginData.data.user.sifreDegistirildiMi) {
      router.push('/change-password');
    } else {
      // Role göre yönlendir
      const userRole = loginData.data.user.role;
      switch (userRole) {
        case 'admin':
          router.push('/admin');
          break;
        case 'mudur':
          router.push('/mudur');
          break;
        case 'sekreter':
          router.push('/sekreter');
          break;
        case 'ogretmen':
          router.push('/ogretmen');
          break;
        case 'ogrenci':
          router.push('/ogrenci');
          break;
        case 'veli':
          router.push('/veli');
          break;
        default:
          router.push('/ogrenci');
      }
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

      {/* Sağ Üst Dil Seçici ve Tema Değiştirici */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-2">
          <ThemeToggle />
        </div>
        <LanguageSelector 
          variant="light" 
          showLabel={true}
          className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-2 py-1"
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className={`${isDark ? 'bg-slate-800/95' : 'bg-white/95'} backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-8`}>
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={isDark ? "/logos/Edura-logo-dark-2.png" : "/logos/Edura-logo-nobg.png"} 
              alt="Edura Logo" 
              className="w-16 h-16 object-contain mx-auto mb-4"
            />
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Edura</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('courseTrackingSystem')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Kullanıcı Türü - Sadece Personel ve Öğrenci */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('userType')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setKullaniciTuru('personel');
                    handleSpeak('Personel seçildi. Kurs, müdür, öğretmen veya sekreter olarak giriş yapabilirsiniz.');
                  }}
                  onFocus={() => handleSpeak('Personel girişi butonu. Seçmek için Enter tuşuna basın.')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                    kullaniciTuru === 'personel'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : isDark 
                        ? 'border-slate-600 hover:border-slate-500 text-gray-400' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                  aria-label={t('staff')}
                  aria-pressed={kullaniciTuru === 'personel'}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {t('staff')}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKullaniciTuru('ogrenci');
                    handleSpeak('Öğrenci seçildi. Öğrenci olarak giriş yapabilirsiniz.');
                  }}
                  onFocus={() => handleSpeak('Öğrenci girişi butonu. Seçmek için Enter tuşuna basın.')}
                  className={`py-3 px-4 rounded-lg border-2 transition-all font-medium ${
                    kullaniciTuru === 'ogrenci'
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : isDark 
                        ? 'border-slate-600 hover:border-slate-500 text-gray-400' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                  aria-label={t('student')}
                  aria-pressed={kullaniciTuru === 'ogrenci'}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {t('student')}
                  </div>
                </button>
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {kullaniciTuru === 'personel' 
                  ? t('staffLoginDesc')
                  : t('studentLoginDesc')}
              </p>
            </div>

            {/* Kullanıcı Adı */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('username')}
              </label>
              <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={kullaniciAdi}
                  onChange={(e) => setKullaniciAdi(e.target.value)}
                  onFocus={() => handleSpeak('Kullanıcı adı alanı. Kullanıcı adınızı veya e-posta adresinizi yazın.')}
                  placeholder={t('enterUsername')}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
                  }`}
                  required
                  aria-label={t('username')}
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('password')}
              </label>
              <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  onFocus={() => handleSpeak('Şifre alanı. Şifrenizi yazın. Güvenlik için şifreniz ekranda gizli görünecektir.')}
                  placeholder={t('enterPassword')}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
                  }`}
                  required
                  aria-label={t('password')}
                />
              </div>
            </div>

            {/* Hata Mesajı */}
            {error && (
              <div 
                className={`px-4 py-3 rounded-lg text-sm ${
                  isDark 
                    ? 'bg-red-900/30 border border-red-800 text-red-400' 
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}
                role="alert"
                aria-live="assertive"
                tabIndex={0}
                onFocus={() => handleSpeak(`Hata: ${error}`)}
                ref={(el) => {
                  // Hata gösterildiğinde otomatik sesli oku
                  if (el && ttsEnabled) {
                    speak(`Hata: ${error}`);
                  }
                }}
              >
                {error}
              </div>
            )}

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={loading}
              onFocus={() => handleSpeak('Giriş yap butonu. Bilgilerinizi girdikten sonra Enter tuşuna basarak giriş yapabilirsiniz.')}
              className={`w-full font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                kullaniciTuru === 'personel'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              aria-label={t('login')}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('logging')}
                </span>
              ) : (
                t('login')
              )}
            </button>
          </form>

          {/* Alt Bilgi */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              onFocus={() => handleSpeak('Şifremi unuttum butonu. Şifrenizi sıfırlamak için Enter tuşuna basın.')}
              className={`text-sm transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              aria-label={t('forgotPassword')}
            >
              {t('forgotPassword')}
            </button>
          </div>

          {/* Footer */}
          <div className={`mt-8 pt-6 border-t text-center ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('copyright')}
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
    </div>
  );
}
