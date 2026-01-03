'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FAQ {
  id: string;
  soru: string;
  cevap: string;
  kategori: string;
  siraNo: number;
  anahtarKelimeler?: string;
  goruntulemeSayisi: number;
  faydaliSayisi: number;
  aktif: boolean;
}

const KATEGORI_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  GENEL: { label: 'Genel', color: 'bg-slate-700 text-slate-300', icon: '📋' },
  HESAP: { label: 'Hesap', color: 'bg-blue-900/50 text-blue-400', icon: '👤' },
  OGRENCI: { label: 'Öğrenci', color: 'bg-green-900/50 text-green-400', icon: '🎓' },
  OGRETMEN: { label: 'Öğretmen', color: 'bg-purple-900/50 text-purple-400', icon: '👨‍🏫' },
  DERS: { label: 'Ders', color: 'bg-amber-900/50 text-amber-400', icon: '📚' },
  ODEME: { label: 'Ödeme', color: 'bg-emerald-900/50 text-emerald-400', icon: '💳' },
  SINAV: { label: 'Sınav', color: 'bg-red-900/50 text-red-400', icon: '📝' },
  CANLI_DERS: { label: 'Canlı Ders', color: 'bg-pink-900/50 text-pink-400', icon: '🎥' },
  MESAJLASMA: { label: 'Mesajlaşma', color: 'bg-cyan-900/50 text-cyan-400', icon: '💬' },
  TEKNIK: { label: 'Teknik', color: 'bg-orange-900/50 text-orange-400', icon: '⚙️' },
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [grupluFaqs, setGrupluFaqs] = useState<{ kategori: string; sorular: FAQ[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedKategori, setSelectedKategori] = useState<string>('');

  const [form, setForm] = useState({
    soru: '',
    cevap: '',
    kategori: 'GENEL',
    siraNo: 0,
    anahtarKelimeler: '',
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin-system/faq?aktif=`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFaqs(data.data.faqs);
        setGrupluFaqs(data.data.grupluFaqs);
      }
    } catch (error) {
      console.error('FAQ alınamadı:', error);
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
      const url = editingFaq 
        ? `${API_URL}/admin-system/faq/${editingFaq.id}`
        : `${API_URL}/admin-system/faq`;
      
      const res = await fetch(url, {
        method: editingFaq ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingFaq ? 'Güncellendi!' : 'Oluşturuldu!' });
        fetchFaqs();
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
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin-system/faq/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchFaqs();
      }
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const handleToggleAktif = async (faq: FAQ) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin-system/faq/${faq.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ aktif: !faq.aktif })
      });
      fetchFaqs();
    } catch (error) {
      console.error('Güncelleme hatası:', error);
    }
  };

  const openEditModal = (faq: FAQ) => {
    setEditingFaq(faq);
    setForm({
      soru: faq.soru,
      cevap: faq.cevap,
      kategori: faq.kategori,
      siraNo: faq.siraNo,
      anahtarKelimeler: faq.anahtarKelimeler || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ soru: '', cevap: '', kategori: 'GENEL', siraNo: 0, anahtarKelimeler: '' });
    setEditingFaq(null);
    setMessage(null);
  };

  const filteredGrupluFaqs = selectedKategori 
    ? grupluFaqs.filter(g => g.kategori === selectedKategori)
    : grupluFaqs;

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
                <div className="w-10 h-10 bg-rose-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-bold text-xl text-white">Yardım Merkezi (FAQ)</h1>
                  <p className="text-xs text-slate-400">Sık sorulan sorular</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Soru
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{faqs.length}</p>
            <p className="text-xs text-slate-400">Toplam Soru</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-400">{faqs.filter(f => f.aktif).length}</p>
            <p className="text-xs text-slate-400">Aktif Soru</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-400">{grupluFaqs.length}</p>
            <p className="text-xs text-slate-400">Kategori</p>
          </div>
        </div>

        {/* Kategori Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedKategori('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !selectedKategori ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Tümü
          </button>
          {Object.entries(KATEGORI_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedKategori(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedKategori === key ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        {filteredGrupluFaqs.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
            Henüz soru bulunmuyor. Yeni soru ekleyerek başlayın.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGrupluFaqs.map((grup) => {
              const config = KATEGORI_CONFIG[grup.kategori] || KATEGORI_CONFIG.GENEL;
              return (
                <div key={grup.kategori} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <h2 className="font-semibold text-white">{config.label}</h2>
                    <span className="text-xs text-slate-500">({grup.sorular.length} soru)</span>
                  </div>
                  <div className="divide-y divide-slate-700">
                    {grup.sorular.map((faq) => (
                      <div key={faq.id} className={`${!faq.aktif ? 'opacity-50' : ''}`}>
                        <div
                          onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                          className="px-4 py-3 cursor-pointer hover:bg-slate-700/30 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {!faq.aktif && (
                                  <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">Pasif</span>
                                )}
                                <span className="text-xs text-slate-500">
                                  {faq.goruntulemeSayisi} görüntülenme • {faq.faydaliSayisi} faydalı
                                </span>
                              </div>
                              <h3 className="font-medium text-white">{faq.soru}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleAktif(faq); }}
                                className={`p-1.5 rounded transition-colors ${faq.aktif ? 'text-green-400 hover:bg-green-900/30' : 'text-slate-500 hover:bg-slate-700'}`}
                                title={faq.aktif ? 'Pasife Al' : 'Aktife Al'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {faq.aktif ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  )}
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditModal(faq); }}
                                className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(faq.id); }}
                                className="p-1.5 text-red-400 hover:text-red-300 rounded transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              <svg
                                className={`w-5 h-5 text-slate-500 transition-transform ${expandedId === faq.id ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        {expandedId === faq.id && (
                          <div className="px-4 py-3 bg-slate-700/30 border-t border-slate-700">
                            <p className="text-slate-300 whitespace-pre-wrap">{faq.cevap}</p>
                            {faq.anahtarKelimeler && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {faq.anahtarKelimeler.split(',').map((keyword, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-slate-600 text-slate-300 rounded text-xs">
                                    {keyword.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
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
        title={editingFaq ? 'Soruyu Düzenle' : 'Yeni Soru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Soru *</label>
            <input
              type="text"
              value={form.soru}
              onChange={(e) => setForm({ ...form, soru: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Cevap *</label>
            <textarea
              value={form.cevap}
              onChange={(e) => setForm({ ...form, cevap: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Kategori</label>
              <select
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
              >
                {Object.entries(KATEGORI_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.icon} {config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Sıra No</label>
              <input
                type="number"
                value={form.siraNo}
                onChange={(e) => setForm({ ...form, siraNo: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Anahtar Kelimeler <span className="text-slate-500">(virgülle ayırın)</span>
            </label>
            <input
              type="text"
              value={form.anahtarKelimeler}
              onChange={(e) => setForm({ ...form, anahtarKelimeler: e.target.value })}
              placeholder="öğrenci, kayıt, ekleme"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
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
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Kaydediliyor...' : editingFaq ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

