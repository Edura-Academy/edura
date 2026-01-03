'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Users,
  GraduationCap,
  User,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import Modal from '@/components/Modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Sinif {
  id: string;
  ad: string;
}

interface Duyuru {
  id: string;
  baslik: string;
  icerik: string;
  hedef: string;
  oncelik: string;
  sinifIds?: string;
  dosyaUrl?: string;
  dosyaAd?: string;
  aktif: boolean;
  yayinTarihi: string;
  bitisTarihi?: string;
  olusturan: {
    id: string;
    ad: string;
    soyad: string;
    role: string;
  };
  _count: {
    okuyanlar: number;
  };
}

const HEDEF_OPTIONS = [
  { value: 'HERKESE', label: 'Herkese', icon: Users, color: 'bg-blue-100 text-blue-700' },
  { value: 'OGRETMENLER', label: 'Öğretmenler', icon: User, color: 'bg-purple-100 text-purple-700' },
  { value: 'OGRENCILER', label: 'Öğrenciler', icon: GraduationCap, color: 'bg-green-100 text-green-700' },
  { value: 'PERSONEL', label: 'Personel', icon: Users, color: 'bg-amber-100 text-amber-700' },
  { value: 'SINIF', label: 'Belirli Sınıf', icon: Users, color: 'bg-slate-100 text-slate-700' },
];

const ONCELIK_OPTIONS = [
  { value: 'NORMAL', label: 'Normal', icon: CheckCircle, color: 'bg-slate-100 text-slate-600' },
  { value: 'ONEMLI', label: 'Önemli', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
  { value: 'ACIL', label: 'Acil', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
];

function DuyurularContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDuyuru, setSelectedDuyuru] = useState<Duyuru | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    baslik: '',
    icerik: '',
    hedef: 'HERKESE',
    oncelik: 'NORMAL',
    sinifIds: [] as string[],
    bitisTarihi: '',
  });

  const fetchDuyurular = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/duyurular/yonetim`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDuyurular(data.data);
      }
    } catch (error) {
      console.error('Duyurular alınamadı:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchSiniflar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/duyurular/siniflar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSiniflar(data.data);
      }
    } catch (error) {
      console.error('Sınıflar alınamadı:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchDuyurular();
    fetchSiniflar();
  }, [fetchDuyurular, fetchSiniflar]);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'yeni') {
      setShowAddModal(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/duyurular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          baslik: form.baslik,
          icerik: form.icerik,
          hedef: form.hedef,
          oncelik: form.oncelik,
          sinifIds: form.hedef === 'SINIF' ? form.sinifIds : undefined,
          bitisTarihi: form.bitisTarihi || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Duyuru başarıyla yayınlandı!' });
        fetchDuyurular();
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
    if (!selectedDuyuru) return;

    setSubmitLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/duyurular/${selectedDuyuru.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          baslik: form.baslik,
          icerik: form.icerik,
          hedef: form.hedef,
          oncelik: form.oncelik,
          sinifIds: form.hedef === 'SINIF' ? form.sinifIds : undefined,
          bitisTarihi: form.bitisTarihi || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Duyuru güncellendi!' });
        fetchDuyurular();
        setTimeout(() => {
          setShowEditModal(false);
          setSelectedDuyuru(null);
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

  const handleDelete = async (duyuru: Duyuru) => {
    if (!confirm(`"${duyuru.baslik}" duyurusunu silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`${API_URL}/duyurular/${duyuru.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        fetchDuyurular();
      } else {
        alert(data.error || 'Duyuru silinemedi');
      }
    } catch (error) {
      alert('Bir hata oluştu');
    }
    setOpenMenu(null);
  };

  const openEdit = (duyuru: Duyuru) => {
    setSelectedDuyuru(duyuru);
    setForm({
      baslik: duyuru.baslik,
      icerik: duyuru.icerik,
      hedef: duyuru.hedef,
      oncelik: duyuru.oncelik,
      sinifIds: duyuru.sinifIds ? JSON.parse(duyuru.sinifIds) : [],
      bitisTarihi: duyuru.bitisTarihi ? new Date(duyuru.bitisTarihi).toISOString().split('T')[0] : '',
    });
    setShowEditModal(true);
    setOpenMenu(null);
  };

  const openDetail = (duyuru: Duyuru) => {
    setSelectedDuyuru(duyuru);
    setShowDetailModal(true);
    setOpenMenu(null);
  };

  const resetForm = () => {
    setForm({
      baslik: '',
      icerik: '',
      hedef: 'HERKESE',
      oncelik: 'NORMAL',
      sinifIds: [],
      bitisTarihi: '',
    });
  };

  const filteredDuyurular = duyurular.filter((duyuru) =>
    duyuru.baslik.toLowerCase().includes(searchQuery.toLowerCase()) ||
    duyuru.icerik.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOncelikConfig = (oncelik: string) => {
    return ONCELIK_OPTIONS.find(o => o.value === oncelik) || ONCELIK_OPTIONS[0];
  };

  const getHedefConfig = (hedef: string) => {
    return HEDEF_OPTIONS.find(h => h.value === hedef) || HEDEF_OPTIONS[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
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
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Duyurular</h1>
                  <p className="text-xs text-slate-500">Duyuru oluştur ve yönet</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Yeni Duyuru</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Arama */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Duyuru ara..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Duyuru Listesi */}
        {filteredDuyurular.length > 0 ? (
          <div className="space-y-4">
            {filteredDuyurular.map((duyuru) => {
              const oncelikConfig = getOncelikConfig(duyuru.oncelik);
              const hedefConfig = getHedefConfig(duyuru.hedef);
              const OncelikIcon = oncelikConfig.icon;

              return (
                <div
                  key={duyuru.id}
                  className={`bg-white rounded-xl border transition-all hover:shadow-md ${
                    duyuru.oncelik === 'ACIL' ? 'border-red-200' : 
                    duyuru.oncelik === 'ONEMLI' ? 'border-amber-200' : 'border-slate-200'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${oncelikConfig.color}`}>
                            {oncelikConfig.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${hedefConfig.color}`}>
                            {hedefConfig.label}
                          </span>
                          {!duyuru.aktif && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-600">
                              Pasif
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-900 text-lg">{duyuru.baslik}</h3>
                        <p className="text-slate-500 text-sm mt-1 line-clamp-2">{duyuru.icerik}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                          <span>{new Date(duyuru.yayinTarihi).toLocaleDateString('tr-TR')}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {duyuru._count.okuyanlar} kişi okudu
                          </span>
                          <span>{duyuru.olusturan.ad} {duyuru.olusturan.soyad}</span>
                        </div>
                      </div>
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setOpenMenu(openMenu === duyuru.id ? null : duyuru.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-500" />
                        </button>
                        {openMenu === duyuru.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 top-10 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                              <button
                                onClick={() => openDetail(duyuru)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="w-4 h-4" />
                                Görüntüle
                              </button>
                              <button
                                onClick={() => openEdit(duyuru)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Edit2 className="w-4 h-4" />
                                Düzenle
                              </button>
                              <button
                                onClick={() => handleDelete(duyuru)}
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
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-1">
              {searchQuery ? 'Duyuru bulunamadı' : 'Henüz duyuru yok'}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {searchQuery ? 'Farklı bir arama terimi deneyin.' : 'İlk duyurunuzu yayınlayın.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Yeni Duyuru Oluştur
              </button>
            )}
          </div>
        )}
      </main>

      {/* Yeni Duyuru Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Yeni Duyuru" size="lg" variant="light">
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Başlık *</label>
            <input
              type="text"
              value={form.baslik}
              onChange={(e) => setForm({ ...form, baslik: e.target.value })}
              placeholder="Duyuru başlığı"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">İçerik *</label>
            <textarea
              value={form.icerik}
              onChange={(e) => setForm({ ...form, icerik: e.target.value })}
              rows={5}
              placeholder="Duyuru içeriği..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hedef Kitle</label>
              <select
                value={form.hedef}
                onChange={(e) => setForm({ ...form, hedef: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {HEDEF_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Öncelik</label>
              <select
                value={form.oncelik}
                onChange={(e) => setForm({ ...form, oncelik: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {ONCELIK_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {form.hedef === 'SINIF' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sınıflar</label>
              <div className="border border-slate-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                {siniflar.map(sinif => (
                  <label key={sinif.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.sinifIds.includes(sinif.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, sinifIds: [...form.sinifIds, sinif.id] });
                        } else {
                          setForm({ ...form, sinifIds: form.sinifIds.filter(id => id !== sinif.id) });
                        }
                      }}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-700">{sinif.ad}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Tarihi (Opsiyonel)</label>
            <input
              type="date"
              value={form.bitisTarihi}
              onChange={(e) => setForm({ ...form, bitisTarihi: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-xs text-slate-500 mt-1">Boş bırakılırsa duyuru süresiz yayında kalır</p>
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
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Yayınlanıyor...' : 'Duyuru Yayınla'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Düzenle Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Duyuru Düzenle" size="lg" variant="light">
        <form onSubmit={handleUpdate} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Başlık *</label>
            <input
              type="text"
              value={form.baslik}
              onChange={(e) => setForm({ ...form, baslik: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">İçerik *</label>
            <textarea
              value={form.icerik}
              onChange={(e) => setForm({ ...form, icerik: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hedef Kitle</label>
              <select
                value={form.hedef}
                onChange={(e) => setForm({ ...form, hedef: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {HEDEF_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Öncelik</label>
              <select
                value={form.oncelik}
                onChange={(e) => setForm({ ...form, oncelik: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {ONCELIK_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {form.hedef === 'SINIF' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sınıflar</label>
              <div className="border border-slate-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                {siniflar.map(sinif => (
                  <label key={sinif.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.sinifIds.includes(sinif.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, sinifIds: [...form.sinifIds, sinif.id] });
                        } else {
                          setForm({ ...form, sinifIds: form.sinifIds.filter(id => id !== sinif.id) });
                        }
                      }}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-slate-700">{sinif.ad}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Tarihi (Opsiyonel)</label>
            <input
              type="date"
              value={form.bitisTarihi}
              onChange={(e) => setForm({ ...form, bitisTarihi: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedDuyuru(null);
                resetForm();
              }}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detay Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Duyuru Detayı" size="lg" variant="light">
        {selectedDuyuru && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getOncelikConfig(selectedDuyuru.oncelik).color}`}>
                {getOncelikConfig(selectedDuyuru.oncelik).label}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getHedefConfig(selectedDuyuru.hedef).color}`}>
                {getHedefConfig(selectedDuyuru.hedef).label}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">{selectedDuyuru.baslik}</h2>

            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-slate-700 whitespace-pre-wrap">{selectedDuyuru.icerik}</p>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-slate-200">
              <div>
                <p>Yayın: {new Date(selectedDuyuru.yayinTarihi).toLocaleString('tr-TR')}</p>
                {selectedDuyuru.bitisTarihi && (
                  <p>Bitiş: {new Date(selectedDuyuru.bitisTarihi).toLocaleString('tr-TR')}</p>
                )}
              </div>
              <div className="text-right">
                <p>{selectedDuyuru.olusturan.ad} {selectedDuyuru.olusturan.soyad}</p>
                <p>{selectedDuyuru._count.okuyanlar} kişi okudu</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function DuyurularPage() {
  return (
    <RoleGuard allowedRoles={['mudur']}>
      <DuyurularContent />
    </RoleGuard>
  );
}

