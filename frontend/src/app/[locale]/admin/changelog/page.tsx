'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Changelog {
  id: string;
  versiyon: string;
  baslik: string;
  aciklama: string;
  tip: 'YENI_OZELLIK' | 'IYILESTIRME' | 'HATA_DUZELTME' | 'GUVENLIK' | 'PERFORMANS';
  degisiklikler?: string;
  yayinTarihi: string;
  aktif: boolean;
}

const TIP_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  YENI_OZELLIK: { label: 'Yeni Özellik', color: 'bg-green-900/50 text-green-400', icon: '✨' },
  IYILESTIRME: { label: 'İyileştirme', color: 'bg-blue-900/50 text-blue-400', icon: '🔧' },
  HATA_DUZELTME: { label: 'Hata Düzeltme', color: 'bg-red-900/50 text-red-400', icon: '🐛' },
  GUVENLIK: { label: 'Güvenlik', color: 'bg-amber-900/50 text-amber-400', icon: '🔒' },
  PERFORMANS: { label: 'Performans', color: 'bg-purple-900/50 text-purple-400', icon: '⚡' },
};

export default function ChangelogPage() {
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChangelog, setEditingChangelog] = useState<Changelog | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    versiyon: '',
    baslik: '',
    aciklama: '',
    tip: 'YENI_OZELLIK' as Changelog['tip'],
    degisiklikler: '',
  });

  useEffect(() => {
    fetchChangelogs();
  }, []);

  const fetchChangelogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin-system/changelog`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChangelogs(data.data.changelogs);
      }
    } catch (error) {
      console.error('Changelog alınamadı:', error);
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
      const url = editingChangelog 
        ? `${API_URL}/admin-system/changelog/${editingChangelog.id}`
        : `${API_URL}/admin-system/changelog`;
      
      const payload = {
        ...form,
        degisiklikler: form.degisiklikler ? form.degisiklikler.split('\n').filter(d => d.trim()) : []
      };

      const res = await fetch(url, {
        method: editingChangelog ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingChangelog ? 'Güncellendi!' : 'Oluşturuldu!' });
        fetchChangelogs();
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
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin-system/changelog/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchChangelogs();
      }
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const openEditModal = (changelog: Changelog) => {
    setEditingChangelog(changelog);
    let degisikliklerText = '';
    if (changelog.degisiklikler) {
      try {
        const arr = JSON.parse(changelog.degisiklikler);
        degisikliklerText = Array.isArray(arr) ? arr.join('\n') : '';
      } catch { degisikliklerText = ''; }
    }
    setForm({
      versiyon: changelog.versiyon,
      baslik: changelog.baslik,
      aciklama: changelog.aciklama,
      tip: changelog.tip,
      degisiklikler: degisikliklerText,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ versiyon: '', baslik: '', aciklama: '', tip: 'YENI_OZELLIK', degisiklikler: '' });
    setEditingChangelog(null);
    setMessage(null);
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
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-bold text-xl text-white">Changelog</h1>
                  <p className="text-xs text-slate-400">Sistem güncellemeleri</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Güncelleme
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {changelogs.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
            Henüz güncelleme kaydı bulunmuyor.
          </div>
        ) : (
          <div className="space-y-6">
            {changelogs.map((changelog, index) => {
              const config = TIP_CONFIG[changelog.tip];
              let degisiklikler: string[] = [];
              if (changelog.degisiklikler) {
                try { degisiklikler = JSON.parse(changelog.degisiklikler); } catch {}
              }

              return (
                <div key={changelog.id} className="relative">
                  {/* Timeline line */}
                  {index < changelogs.length - 1 && (
                    <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-slate-700 -mb-6"></div>
                  )}

                  <div className="flex gap-4">
                    {/* Version badge */}
                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
                      {changelog.versiyon.split('.').slice(0, 2).join('.')}
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm text-indigo-400">v{changelog.versiyon}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${config.color}`}>
                              {config.icon} {config.label}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(changelog.yayinTarihi).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          <h3 className="font-semibold text-white mb-2">{changelog.baslik}</h3>
                          <p className="text-sm text-slate-400 mb-3">{changelog.aciklama}</p>

                          {degisiklikler.length > 0 && (
                            <ul className="space-y-1">
                              {degisiklikler.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                  <span className="text-indigo-400 mt-1">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(changelog)}
                            className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(changelog.id)}
                            className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingChangelog ? 'Güncelleme Düzenle' : 'Yeni Güncelleme'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Versiyon *</label>
              <input
                type="text"
                value={form.versiyon}
                onChange={(e) => setForm({ ...form, versiyon: e.target.value })}
                placeholder="1.2.0"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tip</label>
              <select
                value={form.tip}
                onChange={(e) => setForm({ ...form, tip: e.target.value as any })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                {Object.entries(TIP_CONFIG).map(([key, value]) => (
                  <option key={key} value={key}>{value.icon} {value.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Başlık *</label>
            <input
              type="text"
              value={form.baslik}
              onChange={(e) => setForm({ ...form, baslik: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama *</label>
            <textarea
              value={form.aciklama}
              onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Değişiklikler <span className="text-slate-500">(her satır bir madde)</span>
            </label>
            <textarea
              value={form.degisiklikler}
              onChange={(e) => setForm({ ...form, degisiklikler: e.target.value })}
              rows={4}
              placeholder="Mesajlaşma sistemi eklendi&#10;Performans iyileştirmeleri yapıldı&#10;Bilinen hatalar düzeltildi"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 resize-none font-mono text-sm"
            />
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Kaydediliyor...' : editingChangelog ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

