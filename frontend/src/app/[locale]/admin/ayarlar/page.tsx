'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface User {
  id: number;
  kullaniciAdi: string;
  ad: string;
  soyad?: string;
  role: string;
}

export default function AyarlarPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'sifre'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [emailForm, setEmailForm] = useState({ yeniEmail: '', sifre: '' });
  const [sifreForm, setSifreForm] = useState({ mevcutSifre: '', yeniSifre: '', yeniSifreTekrar: '' });

  useEffect(() => {
    setMounted(true);
  }, []); 

  useEffect(() => {
    if (!mounted) return;
    
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'admin') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
  }, [mounted, router]);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(emailForm),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'E-posta başarıyla güncellendi!' });
        setEmailForm({ yeniEmail: '', sifre: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'E-posta güncellenemedi' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const handleSifreChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sifreForm.yeniSifre !== sifreForm.yeniSifreTekrar) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor!' });
      return;
    }

    if (sifreForm.yeniSifre.length < 6) {
      setMessage({ type: 'error', text: 'Şifre en az 6 karakter olmalıdır!' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mevcutSifre: sifreForm.mevcutSifre,
          yeniSifre: sifreForm.yeniSifre,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Şifre başarıyla güncellendi!' });
        setSifreForm({ mevcutSifre: '', yeniSifre: '', yeniSifreTekrar: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Şifre güncellenemedi' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Geri</span>
            </button>
            <h1 className="ml-6 text-xl font-semibold text-gray-900">Hesap Ayarları</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setActiveTab('email'); setMessage(null); }}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'email' ? 'text-violet-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              E-posta Değiştir
              {activeTab === 'email' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />}
            </button>
            <button
              onClick={() => { setActiveTab('sifre'); setMessage(null); }}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'sifre' ? 'text-violet-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Şifre Değiştir
              {activeTab === 'sifre' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />}
            </button>
          </div>

          <div className="p-6">
            {message && (
              <div className={`mb-6 p-4 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailChange} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut E-posta</label>
                  <input
                    type="email"
                    value={`${user.kullaniciAdi}@edura.com`}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yeni E-posta</label>
                  <input
                    type="email"
                    value={emailForm.yeniEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, yeniEmail: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="yeni@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Şifrenizi Doğrulayın</label>
                  <input
                    type="password"
                    value={emailForm.sifre}
                    onChange={(e) => setEmailForm({ ...emailForm, sifre: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Güncelleniyor...' : 'E-postayı Güncelle'}
                </button>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'sifre' && (
              <form onSubmit={handleSifreChange} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Şifre</label>
                  <input
                    type="password"
                    value={sifreForm.mevcutSifre}
                    onChange={(e) => setSifreForm({ ...sifreForm, mevcutSifre: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
                  <input
                    type="password"
                    value={sifreForm.yeniSifre}
                    onChange={(e) => setSifreForm({ ...sifreForm, yeniSifre: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">En az 6 karakter</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre Tekrar</label>
                  <input
                    type="password"
                    value={sifreForm.yeniSifreTekrar}
                    onChange={(e) => setSifreForm({ ...sifreForm, yeniSifreTekrar: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
              </form>
            )}

            {/* Hesap Silme Bilgilendirmesi */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Hesap Silme Hakkında</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Admin hesapları sistem güvenliği açısından kendi kendilerine silinemez. 
                    Hesabınızı silmek için lütfen üst düzey sistem yöneticisi ile iletişime geçin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

