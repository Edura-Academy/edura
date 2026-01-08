'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Users,
  UserPlus,
  Search,
  ArrowLeft,
  Mail,
  Phone,
  Edit,
  Trash2,
  Check,
  X,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Mudur {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  telefon?: string;
  aktif: boolean;
  createdAt: string;
}

function MudurlerPageContent() {
  const { token } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [mudurler, setMudurler] = useState<Mudur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
    sifre: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const t = useTranslations('courseOwner');

  useEffect(() => {
    if (token) {
      fetchMudurler();
    }
  }, [token]);

  const fetchMudurler = async () => {
    try {
      const response = await fetch(`${API_URL}/users?role=mudur`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMudurler(data.data);
      }
    } catch (error) {
      console.error('Müdürler alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMudur = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          role: 'mudur',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Müdür başarıyla eklendi!' });
        setMudurler([...mudurler, data.data]);
        setTimeout(() => {
          setShowAddModal(false);
          setFormData({ ad: '', soyad: '', email: '', telefon: '', sifre: '' });
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Müdür eklenemedi' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleMudurStatus = async (mudurId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_URL}/users/${mudurId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ aktif: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        setMudurler(mudurler.map(m => 
          m.id === mudurId ? { ...m, aktif: !currentStatus } : m
        ));
      }
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
    }
  };

  const filteredMudurler = mudurler.filter(m => 
    `${m.ad} ${m.soyad}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/kurs-sahibi" 
                className={`p-2 ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} rounded-lg transition-colors`}
              >
                <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Müdür Yönetimi</h1>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Kursa müdür ata ve yönet</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-xl transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Müdür Ata</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search */}
        <div className={`mb-6 flex items-center gap-3 ${isDark ? 'bg-slate-800/50' : 'bg-white'} rounded-xl px-4 py-3 border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <Search className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Müdür ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
          />
        </div>

        {/* Müdürler Listesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMudurler.length > 0 ? (
            filteredMudurler.map((mudur) => (
              <div
                key={mudur.id}
                className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-200'} rounded-2xl border p-5 transition-all`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} ${isDark ? 'text-blue-400' : 'text-blue-600'} font-semibold`}>
                      {mudur.ad?.charAt(0)}{mudur.soyad?.charAt(0)}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{mudur.ad} {mudur.soyad}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${mudur.aktif 
                        ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                        : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                      }`}>
                        {mudur.aktif ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{mudur.email}</span>
                  </div>
                  {mudur.telefon && (
                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <Phone className="w-4 h-4" />
                      <span>{mudur.telefon}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
                  <button
                    onClick={() => toggleMudurStatus(mudur.id, mudur.aktif)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      mudur.aktif
                        ? isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'
                        : isDark ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {mudur.aktif ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    {mudur.aktif ? 'Pasif Yap' : 'Aktif Yap'}
                  </button>
                  <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className={`w-16 h-16 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <UserCheck className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {searchTerm ? 'Arama kriterlerine uygun müdür bulunamadı' : 'Henüz müdür atanmamış'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-blue-500 hover:underline"
                >
                  İlk müdürü ata →
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-2xl w-full max-w-md overflow-hidden`}>
            <div className={`p-6 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Yeni Müdür Ata</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>Kursa yeni bir müdür atayın</p>
            </div>
            <form onSubmit={handleAddMudur} className="p-6 space-y-4">
              {message && (
                <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {message.text}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Ad *</label>
                  <input
                    type="text"
                    value={formData.ad}
                    onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Soyad *</label>
                  <input
                    type="text"
                    value={formData.soyad}
                    onChange={(e) => setFormData({ ...formData, soyad: e.target.value })}
                    className={`w-full px-4 py-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>E-posta *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Telefon</label>
                <input
                  type="tel"
                  value={formData.telefon}
                  onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                  className={`w-full px-4 py-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Şifre *</label>
                <input
                  type="password"
                  value={formData.sifre}
                  onChange={(e) => setFormData({ ...formData, sifre: e.target.value })}
                  className={`w-full px-4 py-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 px-4 py-2 ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} rounded-lg transition-colors`}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitLoading ? 'Ekleniyor...' : 'Müdür Ata'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MudurlerPage() {
  return (
    <RoleGuard allowedRoles={['kursSahibi']}>
      <MudurlerPageContent />
    </RoleGuard>
  );
}

