'use client';

import { useState, useEffect } from 'react';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';

// Kullanıcı bilgisi tipi
interface UserInfo {
  id: number;
  ad: string;
  soyad: string;
  email?: string;
  telefon?: string;
  kullaniciAdi: string;
  profilFoto?: string | null;
  role: 'admin' | 'mudur' | 'sekreter' | 'ogretmen' | 'ogrenci';
}

export default function ProfilPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // LocalStorage'dan kullanıcı bilgilerini al
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } else {
          setError('Kullanıcı bilgisi bulunamadı. Lütfen giriş yapın.');
        }
      } catch (err) {
        setError('Kullanıcı bilgisi yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const handlePhotoUploadSuccess = (url: string) => {
    if (user) {
      const updatedUser = { ...user, profilFoto: url };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const handlePhotoDeleteSuccess = () => {
    if (user) {
      const updatedUser = { ...user, profilFoto: null };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-red-500 mb-4">{error || 'Kullanıcı bulunamadı'}</p>
          <a href="/login" className="text-blue-500 hover:underline">
            Giriş Yap
          </a>
        </div>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    admin: 'Sistem Yöneticisi',
    mudur: 'Müdür',
    sekreter: 'Sekreter',
    ogretmen: 'Öğretmen',
    ogrenci: 'Öğrenci',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Başlık */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profilim</h1>
          <p className="text-gray-400">Profil bilgilerinizi görüntüleyin ve düzenleyin</p>
        </div>

        {/* Profil Kartı */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          {/* Fotoğraf Yükleme */}
          <div className="flex justify-center mb-8">
            <ProfilePhotoUpload
              userType={user.role}
              userId={user.id}
              currentPhotoUrl={user.profilFoto}
              onUploadSuccess={handlePhotoUploadSuccess}
              onDeleteSuccess={handlePhotoDeleteSuccess}
              size="lg"
            />
          </div>

          {/* Kullanıcı Bilgileri */}
          <div className="space-y-4">
            {/* Ad Soyad */}
            <div className="bg-white/5 rounded-xl p-4">
              <label className="text-sm text-gray-400">Ad Soyad</label>
              <p className="text-xl font-semibold text-white">
                {user.ad} {user.soyad}
              </p>
            </div>

            {/* Rol */}
            <div className="bg-white/5 rounded-xl p-4">
              <label className="text-sm text-gray-400">Rol</label>
              <p className="text-lg text-white">
                <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                  {roleLabels[user.role] || user.role}
                </span>
              </p>
            </div>

            {/* Kullanıcı Adı */}
            <div className="bg-white/5 rounded-xl p-4">
              <label className="text-sm text-gray-400">Kullanıcı Adı</label>
              <p className="text-lg text-white">{user.kullaniciAdi}</p>
            </div>

            {/* Email */}
            {user.email && (
              <div className="bg-white/5 rounded-xl p-4">
                <label className="text-sm text-gray-400">E-posta</label>
                <p className="text-lg text-white">{user.email}</p>
              </div>
            )}

            {/* Telefon */}
            {user.telefon && (
              <div className="bg-white/5 rounded-xl p-4">
                <label className="text-sm text-gray-400">Telefon</label>
                <p className="text-lg text-white">{user.telefon}</p>
              </div>
            )}
          </div>

          {/* Geri Dön Butonu */}
          <div className="mt-8 text-center">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              ← Geri Dön
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
