'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';

const backgrounds = [
  '/login-backgrounds/galata.jpg',
  '/login-backgrounds/Ortakoy.jpg',
  '/login-backgrounds/3.jpg',
  '/login-backgrounds/4.jpg',
];

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentBg, setCurrentBg] = useState(0);
  const [yeniSifre, setYeniSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ kullaniciAdi: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Arkaplan slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Kullanıcı bilgisini al
  useEffect(() => {
    if (!mounted) return;
    
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [mounted, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasyon
    if (yeniSifre.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (yeniSifre !== sifreTekrar) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          yeniSifre,
          kullaniciTuru: user?.role.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Şifre değiştirilemedi');
        setLoading(false);
        return;
      }

      // Kullanıcı bilgisini güncelle
      const updatedUser = { ...user, sifreDegistirildiMi: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Dashboard'a yönlendir
      router.push('/dashboard');
    } catch (err) {
      setError('Sunucu bağlantı hatası');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

      {/* Card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Yeni Şifre Oluştur</h1>
            <p className="text-gray-500 text-sm mt-2">
              Güvenliğiniz için lütfen yeni bir şifre belirleyin
            </p>
          </div>

          {/* Kullanıcı Bilgisi */}
          {user && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Kullanıcı:</span> {user.kullaniciAdi}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleChangePassword} className="space-y-5">
            {/* Yeni Şifre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yeni Şifre
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={yeniSifre}
                  onChange={(e) => setYeniSifre(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-700"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Şifre Tekrar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Şifre Tekrar
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={sifreTekrar}
                  onChange={(e) => setSifreTekrar(e.target.value)}
                  placeholder="Şifrenizi tekrar girin"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-700"
                  required
                />
              </div>
            </div>

            {/* Şifre Eşleşme Kontrolü */}
            {sifreTekrar && (
              <div className={`flex items-center gap-2 text-sm ${yeniSifre === sifreTekrar ? 'text-green-600' : 'text-red-500'}`}>
                {yeniSifre === sifreTekrar ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Şifreler eşleşiyor</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Şifreler eşleşmiyor</span>
                  </>
                )}
              </div>
            )}

            {/* Hata Mesajı */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Kaydet Butonu */}
            <button
              type="submit"
              disabled={loading || yeniSifre !== sifreTekrar}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Kaydediliyor...
                </span>
              ) : (
                'Şifreyi Kaydet'
              )}
            </button>
          </form>

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
    </div>
  );
}

