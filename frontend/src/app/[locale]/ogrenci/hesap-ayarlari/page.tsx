'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Info,
  Camera,
  User,
  Trash2,
  Loader2
} from 'lucide-react';

interface UserData {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  role: string;
  sinif?: string;
  kursAd?: string;
  profilFoto?: string;
}

export default function OgrenciHesapAyarlariPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'profil' | 'email' | 'sifre'>('profil');
  
  // Profil fotoğrafı state
  const [profilFoto, setProfilFoto] = useState<string | null>(null);
  const [fotoLoading, setFotoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // E-posta değiştirme
  const [yeniEmail, setYeniEmail] = useState('');
  const [emailSifre, setEmailSifre] = useState('');
  const [showEmailSifre, setShowEmailSifre] = useState(false);
  
  // Şifre değiştirme
  const [mevcutSifre, setMevcutSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [showMevcutSifre, setShowMevcutSifre] = useState(false);
  const [showYeniSifre, setShowYeniSifre] = useState(false);
  const [showYeniSifreTekrar, setShowYeniSifreTekrar] = useState(false);
  
  // Mesajlar
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      // Profil fotoğrafını getir
      fetchProfilFoto(userData.id);
    } else {
      router.push('/login');
    }
  }, [router]);

  // Profil fotoğrafını getir
  const fetchProfilFoto = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/upload/profile/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        setProfilFoto(data.data.url);
      }
    } catch (error) {
      console.log('Profil fotoğrafı bulunamadı');
    }
  };

  // Profil fotoğrafı yükle
  const handleFotoYukle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Dosya validasyonu
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      setErrorMessage('Sadece JPG, PNG ve WebP dosyaları yüklenebilir');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Dosya boyutu 8MB\'dan küçük olmalı');
      return;
    }

    setFotoLoading(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(`${API_URL}/upload/profile/user/${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setProfilFoto(data.data.url);
        setSuccessMessage('Profil fotoğrafı güncellendi!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.error || 'Fotoğraf yüklenemedi');
      }
    } catch (error) {
      setErrorMessage('Fotoğraf yüklenirken hata oluştu');
    } finally {
      setFotoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Profil fotoğrafını sil
  const handleFotoSil = async () => {
    if (!user?.id || !profilFoto) return;

    setFotoLoading(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/upload/profile/user/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setProfilFoto(null);
        setSuccessMessage('Profil fotoğrafı silindi!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.error || 'Fotoğraf silinemedi');
      }
    } catch (error) {
      setErrorMessage('Fotoğraf silinirken hata oluştu');
    } finally {
      setFotoLoading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!yeniEmail || !emailSifre) {
      setErrorMessage('Tüm alanları doldurun.');
      return;
    }
    
    // TODO: API call
    setSuccessMessage('E-posta adresiniz başarıyla güncellendi.');
    setYeniEmail('');
    setEmailSifre('');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!mevcutSifre || !yeniSifre || !yeniSifreTekrar) {
      setErrorMessage('Tüm alanları doldurun.');
      return;
    }
    
    if (yeniSifre !== yeniSifreTekrar) {
      setErrorMessage('Yeni şifreler eşleşmiyor.');
      return;
    }
    
    if (yeniSifre.length < 8) {
      setErrorMessage('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    
    // TODO: API call
    setSuccessMessage('Şifreniz başarıyla güncellendi.');
    setMevcutSifre('');
    setYeniSifre('');
    setYeniSifreTekrar('');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/ogrenci"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Hesap Ayarları</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profil')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'profil'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User size={18} className="inline mr-2" />
              Profil
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'email'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Mail size={18} className="inline mr-2" />
              E-posta Değiştir
            </button>
            <button
              onClick={() => setActiveTab('sifre')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'sifre'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Lock size={18} className="inline mr-2" />
              Şifre Değiştir
            </button>
          </div>
        </div>

        {/* Mesajlar */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-600" />
            <p className="text-red-700 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Profil */}
        {activeTab === 'profil' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">👤 Profil Fotoğrafı</h2>
            
            <div className="flex flex-col items-center">
              {/* Profil Fotoğrafı */}
              <div className="relative group mb-4">
                {profilFoto ? (
                  <img
                    src={profilFoto}
                    alt="Profil"
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-100">
                    {user?.ad?.[0]}{user?.soyad?.[0]}
                  </div>
                )}
                
                {/* Loading overlay */}
                {fotoLoading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                )}
                
                {/* Kamera butonu */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={fotoLoading}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
              
              {/* Gizli file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFotoYukle}
                className="hidden"
              />
              
              {/* Kullanıcı bilgileri */}
              <h3 className="text-xl font-bold text-gray-800 mt-2">{user?.ad} {user?.soyad}</h3>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              {user?.sinif && (
                <span className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {user.sinif}
                </span>
              )}
              
              {/* Fotoğraf butonları */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={fotoLoading}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
                >
                  <Camera className="w-4 h-4" />
                  {profilFoto ? 'Fotoğrafı Değiştir' : 'Fotoğraf Ekle'}
                </button>
                
                {profilFoto && (
                  <button
                    type="button"
                    onClick={handleFotoSil}
                    disabled={fotoLoading}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Sil
                  </button>
                )}
              </div>
              
              <p className="text-xs text-gray-400 mt-4">JPG, PNG veya WebP • Maksimum 8MB</p>
            </div>
          </div>
        )}

        {/* E-posta Değiştir */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">📧 E-posta Adresini Değiştir</h2>
            
            <form onSubmit={handleEmailChange} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mevcut E-posta
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Yeni E-posta
                </label>
                <input
                  type="email"
                  value={yeniEmail}
                  onChange={(e) => setYeniEmail(e.target.value)}
                  placeholder="yeni@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Şifrenizi Doğrulayın
                </label>
                <div className="relative">
                  <input
                    type={showEmailSifre ? 'text' : 'password'}
                    value={emailSifre}
                    onChange={(e) => setEmailSifre(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailSifre(!showEmailSifre)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showEmailSifre ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all hover:shadow-lg"
              >
                E-postayı Güncelle
              </button>
            </form>
          </div>
        )}

        {/* Şifre Değiştir */}
        {activeTab === 'sifre' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">🔐 Şifre Değiştir</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mevcut Şifre
                </label>
                <div className="relative">
                  <input
                    type={showMevcutSifre ? 'text' : 'password'}
                    value={mevcutSifre}
                    onChange={(e) => setMevcutSifre(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMevcutSifre(!showMevcutSifre)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showMevcutSifre ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Yeni Şifre
                </label>
                <div className="relative">
                  <input
                    type={showYeniSifre ? 'text' : 'password'}
                    value={yeniSifre}
                    onChange={(e) => setYeniSifre(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowYeniSifre(!showYeniSifre)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showYeniSifre ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Yeni Şifre (Tekrar)
                </label>
                <div className="relative">
                  <input
                    type={showYeniSifreTekrar ? 'text' : 'password'}
                    value={yeniSifreTekrar}
                    onChange={(e) => setYeniSifreTekrar(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowYeniSifreTekrar(!showYeniSifreTekrar)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showYeniSifreTekrar ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-700 mb-2">
                  Şifre Gereksinimleri:
                </p>
                <ul className="text-sm space-y-1">
                  <li className={`flex items-center gap-2 ${yeniSifre.length >= 8 ? 'text-green-600' : 'text-blue-600'}`}>
                    {yeniSifre.length >= 8 ? '✅' : '○'} En az 8 karakter
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(yeniSifre) ? 'text-green-600' : 'text-blue-600'}`}>
                    {/[A-Z]/.test(yeniSifre) ? '✅' : '○'} En az 1 büyük harf
                  </li>
                  <li className={`flex items-center gap-2 ${/[a-z]/.test(yeniSifre) ? 'text-green-600' : 'text-blue-600'}`}>
                    {/[a-z]/.test(yeniSifre) ? '✅' : '○'} En az 1 küçük harf
                  </li>
                  <li className={`flex items-center gap-2 ${/[0-9]/.test(yeniSifre) ? 'text-green-600' : 'text-blue-600'}`}>
                    {/[0-9]/.test(yeniSifre) ? '✅' : '○'} En az 1 rakam
                  </li>
                </ul>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all hover:shadow-lg"
              >
                Şifreyi Güncelle
              </button>
            </form>
          </div>
        )}

        {/* Hesap Silme Bilgilendirmesi */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800">Hesap Silme Hakkında</h3>
              <p className="text-sm text-blue-700 mt-1">
                Hesabınızı silmek için lütfen kurumunuzun yöneticisi ile iletişime geçin. 
                Öğrenci hesapları yalnızca yetkili müdür veya sekreter tarafından silinebilir.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
