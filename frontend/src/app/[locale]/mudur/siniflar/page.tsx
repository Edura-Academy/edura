'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Users,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import Modal from '@/components/Modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Sinif {
  id: string;
  ad: string;
  seviye: number;
  tip: 'ORTAOKUL' | 'LISE';
  aktif: boolean;
  _count: {
    ogrenciler: number;
  };
}

function SiniflarContent() {
  const { token } = useAuth();
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSinif, setSelectedSinif] = useState<Sinif | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    ad: '',
    seviye: '',
    tip: 'ORTAOKUL' as 'ORTAOKUL' | 'LISE',
  });

  const fetchSiniflar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/siniflar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSiniflar(data.data);
      }
    } catch (error) {
      console.error('Sınıflar alınamadı:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSiniflar();
  }, [fetchSiniflar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/users/siniflar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ad: form.ad,
          seviye: form.seviye ? parseInt(form.seviye) : undefined,
          tip: form.tip,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Sınıf başarıyla oluşturuldu!' });
        fetchSiniflar();
        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Bir hata oluştu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSinif) return;

    setSubmitLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/users/siniflar/${selectedSinif.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ad: form.ad,
          seviye: form.seviye ? parseInt(form.seviye) : undefined,
          tip: form.tip,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Sınıf güncellendi!' });
        fetchSiniflar();
        setTimeout(() => {
          setShowEditModal(false);
          setSelectedSinif(null);
          resetForm();
          setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Bir hata oluştu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (sinif: Sinif) => {
    if (sinif._count.ogrenciler > 0) {
      alert(`Bu sınıfta ${sinif._count.ogrenciler} öğrenci var. Önce öğrencileri başka sınıfa taşıyın.`);
      return;
    }

    if (!confirm(`"${sinif.ad}" sınıfını silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`${API_URL}/users/siniflar/${sinif.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        fetchSiniflar();
      } else {
        alert(data.error || 'Sınıf silinemedi');
      }
    } catch (error) {
      alert('Bir hata oluştu');
    }
    setOpenMenu(null);
  };

  const openEdit = (sinif: Sinif) => {
    setSelectedSinif(sinif);
    setForm({
      ad: sinif.ad,
      seviye: sinif.seviye?.toString() || '',
      tip: sinif.tip || 'ORTAOKUL',
    });
    setShowEditModal(true);
    setOpenMenu(null);
  };

  const resetForm = () => {
    setForm({
      ad: '',
      seviye: '',
      tip: 'ORTAOKUL',
    });
  };

  const filteredSiniflar = siniflar.filter((sinif) =>
    sinif.ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sinif.seviye?.toString().includes(searchQuery) ||
    sinif.tip?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toplamOgrenci = siniflar.reduce((acc, s) => acc + s._count.ogrenciler, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/mudur" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Sınıf Yönetimi</h1>
                  <p className="text-xs text-slate-500">Sınıf oluştur ve düzenle</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Yeni Sınıf</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* İstatistikler */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Toplam Sınıf</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{siniflar.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Toplam Öğrenci</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{toplamOgrenci}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Arama */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sınıf ara..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Sınıf Kartları */}
        {filteredSiniflar.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSiniflar.map((sinif) => (
              <div
                key={sinif.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {sinif.ad.charAt(0)}
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === sinif.id ? null : sinif.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-500" />
                    </button>
                    {openMenu === sinif.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                        <div className="absolute right-0 top-10 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                          <button
                            onClick={() => openEdit(sinif)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Edit2 className="w-4 h-4" />
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDelete(sinif)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Sil
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 text-lg">{sinif.ad}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-500">{sinif.seviye}. Sınıf</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    sinif.tip === 'LISE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {sinif.tip === 'LISE' ? 'Lise' : 'Ortaokul'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{sinif._count.ogrenciler} öğrenci</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-1">
              {searchQuery ? 'Sınıf bulunamadı' : 'Henüz sınıf yok'}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {searchQuery ? 'Farklı bir arama terimi deneyin.' : 'İlk sınıfınızı oluşturun.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Yeni Sınıf Oluştur
              </button>
            )}
          </div>
        )}
      </main>

      {/* Yeni Sınıf Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Yeni Sınıf Oluştur" size="md" variant="light">
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Adı *</label>
            <input
              type="text"
              value={form.ad}
              onChange={(e) => setForm({ ...form, ad: e.target.value })}
              placeholder="Örn: 8-A, 9-B"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tip *</label>
              <select
                value={form.tip}
                onChange={(e) => setForm({ ...form, tip: e.target.value as 'ORTAOKUL' | 'LISE', seviye: '' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ORTAOKUL">Ortaokul</option>
                <option value="LISE">Lise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seviye *</label>
              <select
                value={form.seviye}
                onChange={(e) => setForm({ ...form, seviye: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seviye seçin</option>
                {form.tip === 'ORTAOKUL' ? (
                  <>
                    <option value="5">5. Sınıf</option>
                    <option value="6">6. Sınıf</option>
                    <option value="7">7. Sınıf</option>
                    <option value="8">8. Sınıf</option>
                  </>
                ) : (
                  <>
                    <option value="9">9. Sınıf</option>
                    <option value="10">10. Sınıf</option>
                    <option value="11">11. Sınıf</option>
                    <option value="12">12. Sınıf</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Oluşturuluyor...' : 'Sınıf Oluştur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Düzenle Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Sınıf Düzenle" size="md" variant="light">
        <form onSubmit={handleUpdate} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf Adı *</label>
            <input
              type="text"
              value={form.ad}
              onChange={(e) => setForm({ ...form, ad: e.target.value })}
              placeholder="Örn: 8-A, 9-B"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tip *</label>
              <select
                value={form.tip}
                onChange={(e) => setForm({ ...form, tip: e.target.value as 'ORTAOKUL' | 'LISE', seviye: '' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ORTAOKUL">Ortaokul</option>
                <option value="LISE">Lise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seviye *</label>
              <select
                value={form.seviye}
                onChange={(e) => setForm({ ...form, seviye: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seviye seçin</option>
                {form.tip === 'ORTAOKUL' ? (
                  <>
                    <option value="5">5. Sınıf</option>
                    <option value="6">6. Sınıf</option>
                    <option value="7">7. Sınıf</option>
                    <option value="8">8. Sınıf</option>
                  </>
                ) : (
                  <>
                    <option value="9">9. Sınıf</option>
                    <option value="10">10. Sınıf</option>
                    <option value="11">11. Sınıf</option>
                    <option value="12">12. Sınıf</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedSinif(null);
                resetForm();
              }}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function SiniflarPage() {
  return (
    <RoleGuard allowedRoles={['mudur']}>
      <SiniflarContent />
    </RoleGuard>
  );
}

