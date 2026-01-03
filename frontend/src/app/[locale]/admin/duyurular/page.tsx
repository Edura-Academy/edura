'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import Link from 'next/link';
import Modal from '@/components/Modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Duyuru {
  id: string;
  baslik: string;
  icerik: string;
  oncelik: 'NORMAL' | 'ONEMLI' | 'ACIL';
  aktif: boolean;
  yayinTarihi: string;
  bitisTarihi?: string;
  dosyaUrl?: string;
  dosyaAd?: string;
  _count?: { okuyanlar: number };
}

export default function AdminDuyurularPage() {
  const router = useRouter();
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDuyuru, setEditingDuyuru] = useState<Duyuru | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    baslik: '',
    icerik: '',
    oncelik: 'NORMAL' as 'NORMAL' | 'ONEMLI' | 'ACIL',
    bitisTarihi: '',
  });

  useEffect(() => {
    fetchDuyurular();
  }, []);

  const fetchDuyurular = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin-system/duyurular`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDuyurular(data.data.duyurular);
      }
    } catch (error) {
      console.error('Duyurular alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const url = editingDuyuru 
        ? `${API_URL}/admin-system/duyurular/${editingDuyuru.id}`
        : `${API_URL}/admin-system/duyurular`;
      
      const res = await fetch(url, {
        method: editingDuyuru ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingDuyuru ? 'Duyuru güncellendi!' : 'Duyuru oluşturuldu!' });
        fetchDuyurular();
        setTimeout(() => {
          setShowModal(false);
          resetForm();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Bir hata oluştu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin-system/duyurular/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchDuyurular();
      }
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const handleToggleAktif = async (duyuru: Duyuru) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin-system/duyurular/${duyuru.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ aktif: !duyuru.aktif })
      });
      fetchDuyurular();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
    }
  };

  const openEditModal = (duyuru: Duyuru) => {
    setEditingDuyuru(duyuru);
    setForm({
      baslik: duyuru.baslik,
      icerik: duyuru.icerik,
      oncelik: duyuru.oncelik,
      bitisTarihi: duyuru.bitisTarihi ? new Date(duyuru.bitisTarihi).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ baslik: '', icerik: '', oncelik: 'NORMAL', bitisTarihi: '' });
    setEditingDuyuru(null);
    setMessage(null);
  };

  const getOncelikBadge = (oncelik: string) => {
    switch (oncelik) {
      case 'ACIL':
        return 'bg-red-900/50 text-red-400';
      case 'ONEMLI':
        return 'bg-amber-900/50 text-amber-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-bold text-xl text-white">Duyuru Sistemi</h1>
                  <p className="text-xs text-slate-400">Müdürlere sistem duyuruları</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Duyuru
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{duyurular.length}</p>
            <p className="text-xs text-slate-400">Toplam Duyuru</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-400">{duyurular.filter(d => d.aktif).length}</p>
            <p className="text-xs text-slate-400">Aktif Duyuru</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-red-400">{duyurular.filter(d => d.oncelik === 'ACIL').length}</p>
            <p className="text-xs text-slate-400">Acil Duyuru</p>
          </div>
        </div>

        {/* Duyurular Listesi */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Tüm Duyurular</h2>
          </div>

          {duyurular.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Henüz duyuru bulunmuyor. Yeni duyuru ekleyerek başlayın.
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {duyurular.map((duyuru) => (
                <div key={duyuru.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getOncelikBadge(duyuru.oncelik)}`}>
                          {duyuru.oncelik}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${duyuru.aktif ? 'bg-green-900/50 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                          {duyuru.aktif ? 'Aktif' : 'Pasif'}
                        </span>
                        {duyuru._count && (
                          <span className="text-xs text-slate-500">
                            {duyuru._count.okuyanlar} kişi okudu
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-white mb-1">{duyuru.baslik}</h3>
                      <p className="text-sm text-slate-400 line-clamp-2">{duyuru.icerik}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(duyuru.yayinTarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {duyuru.bitisTarihi && ` • Bitiş: ${new Date(duyuru.bitisTarihi).toLocaleDateString('tr-TR')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAktif(duyuru)}
                        className={`p-2 rounded-lg transition-colors ${duyuru.aktif ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                        title={duyuru.aktif ? 'Pasife Al' : 'Aktife Al'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {duyuru.aktif ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          )}
                        </svg>
                      </button>
                      <button
                        onClick={() => openEditModal(duyuru)}
                        className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(duyuru.id)}
                        className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingDuyuru ? 'Duyuru Düzenle' : 'Yeni Duyuru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Başlık *</label>
            <input
              type="text"
              value={form.baslik}
              onChange={(e) => setForm({ ...form, baslik: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">İçerik *</label>
            <textarea
              value={form.icerik}
              onChange={(e) => setForm({ ...form, icerik: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Öncelik</label>
              <select
                value={form.oncelik}
                onChange={(e) => setForm({ ...form, oncelik: e.target.value as any })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="NORMAL">Normal</option>
                <option value="ONEMLI">Önemli</option>
                <option value="ACIL">Acil</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                value={form.bitisTarihi}
                onChange={(e) => setForm({ ...form, bitisTarihi: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Kaydediliyor...' : editingDuyuru ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

