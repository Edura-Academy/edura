'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Lock,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  User,
} from 'lucide-react';

interface UserData {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  role: string;
  brans?: string;
  kursAd?: string;
}

export default function HesapAyarlariPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'sifre' | 'hesap'>('email');
  
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
  
  // Hesap silme
  const [silmeOnay, setSilmeOnay] = useState('');
  const [showSilmeModal, setShowSilmeModal] = useState(false);
  
  // Mesajlar
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      router.push('/login');
    }
  }, [router]);

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

  const handleDeleteAccount = async () => {
    if (silmeOnay !== 'HESABIMI SIL') {
      setErrorMessage('Onay metnini doğru yazın.');
      return;
    }
    
    // TODO: API call
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/personel"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
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
            <button
              onClick={() => setActiveTab('hesap')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'hesap'
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Trash2 size={18} className="inline mr-2" />
              Hesabı Sil
            </button>
          </div>
        </div>

        {/* Mesajlar */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-600" />
            <p className="text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* E-posta Değiştir */}
        {activeTab === 'email' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">E-posta Adresini Değiştir</h2>
            
            <form onSubmit={handleEmailChange} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                E-postayı Güncelle
              </button>
            </form>
          </div>
        )}

        {/* Şifre Değiştir */}
        {activeTab === 'sifre' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Şifre Değiştir</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <p className="text-sm text-blue-700">
                  <strong>Şifre Gereksinimleri:</strong>
                </p>
                <ul className="text-sm text-blue-600 mt-2 space-y-1">
                  <li className={yeniSifre.length >= 8 ? 'text-green-600' : ''}>
                    • En az 8 karakter
                  </li>
                  <li className={/[A-Z]/.test(yeniSifre) ? 'text-green-600' : ''}>
                    • En az 1 büyük harf
                  </li>
                  <li className={/[a-z]/.test(yeniSifre) ? 'text-green-600' : ''}>
                    • En az 1 küçük harf
                  </li>
                  <li className={/[0-9]/.test(yeniSifre) ? 'text-green-600' : ''}>
                    • En az 1 rakam
                  </li>
                </ul>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Şifreyi Güncelle
              </button>
            </form>
          </div>
        )}

        {/* Hesabı Sil */}
        {activeTab === 'hesap' && (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-800">Hesabı Kalıcı Olarak Sil</h2>
                <p className="text-red-600 text-sm mt-1">
                  Bu işlem geri alınamaz! Tüm verileriniz silinecektir.
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-700">
                Hesabınızı sildiğinizde:
              </p>
              <ul className="text-sm text-red-600 mt-2 space-y-1">
                <li>• Tüm profil bilgileriniz silinir</li>
                <li>• Mesajlarınız ve bildirimleriniz silinir</li>
                <li>• Bu işlem geri alınamaz</li>
              </ul>
            </div>
            
            <button
              onClick={() => setShowSilmeModal(true)}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
            >
              Hesabımı Sil
            </button>
          </div>
        )}
      </main>

      {/* Silme Onay Modal */}
      {showSilmeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Emin misiniz?</h3>
              <p className="text-gray-500 mt-2">
                Bu işlem geri alınamaz. Hesabınız kalıcı olarak silinecektir.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Onaylamak için <strong className="text-red-600">HESABIMI SIL</strong> yazın
              </label>
              <input
                type="text"
                value={silmeOnay}
                onChange={(e) => setSilmeOnay(e.target.value)}
                placeholder="HESABIMI SIL"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSilmeModal(false);
                  setSilmeOnay('');
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={silmeOnay !== 'HESABIMI SIL'}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
              >
                Hesabı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
