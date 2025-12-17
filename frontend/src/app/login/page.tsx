'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type UserType = 'admin' | 'mudur' | 'sekreter' | 'ogretmen' | 'ogrenci' | 'kurs';

const userTypeLabels: Record<UserType, string> = {
  admin: 'Sistem Yöneticisi',
  mudur: 'Müdür',
  sekreter: 'Sekreter',
  ogretmen: 'Öğretmen',
  ogrenci: 'Öğrenci',
  kurs: 'Kurs',
};

export default function LoginPage() {
  const router = useRouter();
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [kullaniciTuru, setKullaniciTuru] = useState<UserType>('ogrenci');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kullaniciAdi,
          sifre,
          kullaniciTuru,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız');
      }

      // Token ve kullanıcı bilgilerini kaydet
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Profil sayfasına yönlendir
      router.push('/profil');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Edura<span className="text-purple-400"> Giriş</span>
          </h1>
          <p className="text-gray-400">Hesabınıza giriş yapın</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
        >
          {/* Kullanıcı Türü */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Kullanıcı Türü
            </label>
            <select
              value={kullaniciTuru}
              onChange={(e) => setKullaniciTuru(e.target.value as UserType)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              {Object.entries(userTypeLabels).map(([value, label]) => (
                <option key={value} value={value} className="bg-slate-800">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Kullanıcı Adı */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={kullaniciAdi}
              onChange={(e) => setKullaniciAdi(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Şifre */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Şifre
            </label>
            <input
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              placeholder="Şifrenizi girin"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Hata Mesajı */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Giriş Butonu */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Giriş yapılıyor...
              </span>
            ) : (
              'Giriş Yap'
            )}
          </button>

          {/* Ana Sayfaya Dön */}
          <div className="mt-6 text-center">
            <a href="/" className="text-gray-400 hover:text-white transition-colors">
              ← Ana Sayfaya Dön
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
