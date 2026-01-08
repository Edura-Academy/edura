'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  Building,
  Phone,
  MapPin,
  Mail,
  Save,
  User,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface KursInfo {
  id: string;
  ad: string;
  adres: string;
  telefon: string;
  aktif: boolean;
}

function AyarlarPageContent() {
  const { user, token } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [activeTab, setActiveTab] = useState<'kurs' | 'profil' | 'sifre'>('kurs');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [kursForm, setKursForm] = useState({
    ad: '',
    adres: '',
    telefon: '',
  });

  const [profilForm, setProfilForm] = useState({
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
  });

  const [sifreForm, setSifreForm] = useState({
    mevcutSifre: '',
    yeniSifre: '',
    yeniSifreTekrar: '',
  });

  useEffect(() => {
    if (token) {
      fetchKursInfo();
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      setProfilForm({
        ad: user.ad || '',
        soyad: user.soyad || '',
        email: user.email || '',
        telefon: user.telefon || '',
      });
    }
  }, [user]);

  const fetchKursInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/users/kurs-bilgi`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setKursForm({
          ad: data.data.ad || '',
          adres: data.data.adres || '',
          telefon: data.data.telefon || '',
        });
      }
    } catch (error) {
      console.error('Kurs bilgisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKursUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/users/kurs-guncelle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(kursForm),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Kurs bilgileri güncellendi!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Güncelleme başarısız' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleProfilUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/users/profil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profilForm),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Profil bilgileri güncellendi!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Güncelleme başarısız' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSifreUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sifreForm.yeniSifre !== sifreForm.yeniSifreTekrar) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor!' });
      return;
    }

    setSubmitLoading(true);
    setMessage(null);

    try {
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
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-slate-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} border-b sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/kurs-sahibi" 
                className={`p-2 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
              >
                <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Ayarlar</h1>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Kurs ve hesap ayarları</p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className={`flex gap-2 mb-6 p-1 ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'} rounded-xl`}>
          {[
            { id: 'kurs', label: 'Kurs Bilgileri', icon: Building },
            { id: 'profil', label: 'Profil', icon: User },
            { id: 'sifre', label: 'Şifre Değiştir', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as 'kurs' | 'profil' | 'sifre');
                  setMessage(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                    : isDark 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {message.text}
          </div>
        )}

        {/* Kurs Bilgileri */}
        {activeTab === 'kurs' && (
          <form onSubmit={handleKursUpdate} className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border p-6 space-y-6`}>
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                <Building className="w-4 h-4 inline mr-2" />
                Kurs Adı
              </label>
              <input
                type="text"
                value={kursForm.ad}
                onChange={(e) => setKursForm({ ...kursForm, ad: e.target.value })}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                <MapPin className="w-4 h-4 inline mr-2" />
                Adres
              </label>
              <textarea
                value={kursForm.adres}
                onChange={(e) => setKursForm({ ...kursForm, adres: e.target.value })}
                rows={3}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                <Phone className="w-4 h-4 inline mr-2" />
                Kurumsal Telefon
              </label>
              <input
                type="tel"
                value={kursForm.telefon}
                onChange={(e) => setKursForm({ ...kursForm, telefon: e.target.value })}
                placeholder="0216 xxx xx xx"
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500`}
              />
            </div>
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {submitLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </form>
        )}

        {/* Profil */}
        {activeTab === 'profil' && (
          <form onSubmit={handleProfilUpdate} className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border p-6 space-y-6`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Ad</label>
                <input
                  type="text"
                  value={profilForm.ad}
                  onChange={(e) => setProfilForm({ ...profilForm, ad: e.target.value })}
                  className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Soyad</label>
                <input
                  type="text"
                  value={profilForm.soyad}
                  onChange={(e) => setProfilForm({ ...profilForm, soyad: e.target.value })}
                  className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                <Mail className="w-4 h-4 inline mr-2" />
                E-posta
              </label>
              <input
                type="email"
                value={profilForm.email}
                onChange={(e) => setProfilForm({ ...profilForm, email: e.target.value })}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                <Phone className="w-4 h-4 inline mr-2" />
                Kişisel Telefon
              </label>
              <input
                type="tel"
                value={profilForm.telefon}
                onChange={(e) => setProfilForm({ ...profilForm, telefon: e.target.value })}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500`}
              />
            </div>
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {submitLoading ? 'Kaydediliyor...' : 'Profili Güncelle'}
            </button>
          </form>
        )}

        {/* Şifre Değiştir */}
        {activeTab === 'sifre' && (
          <form onSubmit={handleSifreUpdate} className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-2xl border p-6 space-y-6`}>
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Mevcut Şifre</label>
              <input
                type="password"
                value={sifreForm.mevcutSifre}
                onChange={(e) => setSifreForm({ ...sifreForm, mevcutSifre: e.target.value })}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Yeni Şifre</label>
              <input
                type="password"
                value={sifreForm.yeniSifre}
                onChange={(e) => setSifreForm({ ...sifreForm, yeniSifre: e.target.value })}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500`}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                value={sifreForm.yeniSifreTekrar}
                onChange={(e) => setSifreForm({ ...sifreForm, yeniSifreTekrar: e.target.value })}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500`}
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all disabled:opacity-50"
            >
              <Lock className="w-5 h-5" />
              {submitLoading ? 'Güncelleniyor...' : 'Şifreyi Değiştir'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

export default function AyarlarPage() {
  return (
    <RoleGuard allowedRoles={['kursSahibi']}>
      <AyarlarPageContent />
    </RoleGuard>
  );
}

