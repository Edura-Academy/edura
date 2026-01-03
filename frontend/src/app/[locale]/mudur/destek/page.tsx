'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, LifeBuoy, Plus, MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';
import Modal from '@/components/Modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Cevap {
  id: string;
  icerik: string;
  adminYazdiMi: boolean;
  createdAt: string;
}

interface DestekTalebi {
  id: string;
  baslik: string;
  aciklama: string;
  kategori: string;
  oncelik: string;
  durum: string;
  createdAt: string;
  _count?: { cevaplar: number };
  cevaplar?: Cevap[];
}

const DURUM_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ACIK: { label: 'Açık', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  INCELENIYOR: { label: 'İnceleniyor', color: 'bg-amber-100 text-amber-700', icon: Clock },
  CEVAPLANDI: { label: 'Cevaplandı', color: 'bg-purple-100 text-purple-700', icon: MessageCircle },
  BEKLEMEDE: { label: 'Beklemede', color: 'bg-slate-100 text-slate-700', icon: Clock },
  COZULDU: { label: 'Çözüldü', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  KAPATILDI: { label: 'Kapatıldı', color: 'bg-slate-200 text-slate-600', icon: CheckCircle },
};

const KATEGORI_OPTIONS = [
  { value: 'TEKNIK', label: 'Teknik Sorun' },
  { value: 'OZELLIK_TALEBI', label: 'Özellik Talebi' },
  { value: 'FATURA', label: 'Fatura/Ödeme' },
  { value: 'HESAP', label: 'Hesap Sorunları' },
  { value: 'DIGER', label: 'Diğer' },
];

const ONCELIK_OPTIONS = [
  { value: 'DUSUK', label: 'Düşük' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'YUKSEK', label: 'Yüksek' },
  { value: 'ACIL', label: 'Acil' },
];

function DestekContent() {
  const [talepler, setTalepler] = useState<DestekTalebi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTalep, setSelectedTalep] = useState<DestekTalebi | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cevapText, setCevapText] = useState('');
  const [sendingCevap, setSendingCevap] = useState(false);

  const [form, setForm] = useState({
    baslik: '',
    aciklama: '',
    kategori: 'TEKNIK',
    oncelik: 'NORMAL',
  });

  useEffect(() => {
    fetchTalepler();
  }, []);

  const fetchTalepler = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin-system/destek/mudur/taleplerim`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTalepler(data.data.talepler);
      }
    } catch (error) {
      console.error('Talepler alınamadı:', error);
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
      const res = await fetch(`${API_URL}/admin-system/destek`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Talebiniz oluşturuldu!' });
        fetchTalepler();
        setTimeout(() => {
          setShowNewModal(false);
          setForm({ baslik: '', aciklama: '', kategori: 'TEKNIK', oncelik: 'NORMAL' });
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

  const openDetail = async (talep: DestekTalebi) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin-system/destek/${talep.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedTalep(data.data.talep);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Talep detayı alınamadı:', error);
    }
  };

  const handleSendCevap = async () => {
    if (!cevapText.trim() || !selectedTalep) return;

    setSendingCevap(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin-system/destek/${selectedTalep.id}/cevap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ icerik: cevapText })
      });

      if (res.ok) {
        setCevapText('');
        openDetail(selectedTalep);
        fetchTalepler();
      }
    } catch (error) {
      console.error('Cevap gönderilemedi:', error);
    } finally {
      setSendingCevap(false);
    }
  };

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/mudur" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Destek Talebi</h1>
                  <p className="text-xs text-slate-500">Teknik destek alın</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni Talep
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {talepler.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-1">Henüz talebiniz yok</h3>
            <p className="text-slate-500 text-sm mb-4">Teknik destek almak için yeni talep oluşturun.</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Yeni Talep Oluştur
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {talepler.map((talep) => {
              const durumConfig = DURUM_CONFIG[talep.durum];
              const Icon = durumConfig?.icon || AlertCircle;

              return (
                <div
                  key={talep.id}
                  onClick={() => openDetail(talep)}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${durumConfig?.color}`}>
                          {durumConfig?.label}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                          {KATEGORI_OPTIONS.find(k => k.value === talep.kategori)?.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900">{talep.baslik}</h3>
                      <p className="text-sm text-slate-500 line-clamp-1 mt-1">{talep.aciklama}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span>{new Date(talep.createdAt).toLocaleDateString('tr-TR')}</span>
                        {talep._count && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {talep._count.cevaplar} cevap
                          </span>
                        )}
                      </div>
                    </div>
                    <Icon className={`w-5 h-5 ${durumConfig?.color.includes('green') ? 'text-green-500' : durumConfig?.color.includes('blue') ? 'text-blue-500' : 'text-slate-400'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* New Ticket Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Yeni Destek Talebi"
        size="lg"
        variant="light"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Konu *</label>
            <input
              type="text"
              value={form.baslik}
              onChange={(e) => setForm({ ...form, baslik: e.target.value })}
              placeholder="Sorununuzu kısaca açıklayın"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
              <select
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {KATEGORI_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Öncelik</label>
              <select
                value={form.oncelik}
                onChange={(e) => setForm({ ...form, oncelik: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {ONCELIK_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama *</label>
            <textarea
              value={form.aciklama}
              onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
              rows={5}
              placeholder="Sorununuzu detaylı bir şekilde açıklayın..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {submitLoading ? 'Gönderiliyor...' : 'Talep Oluştur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Talep Detayı"
        size="lg"
        variant="light"
      >
        {selectedTalep && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${DURUM_CONFIG[selectedTalep.durum]?.color}`}>
                {DURUM_CONFIG[selectedTalep.durum]?.label}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(selectedTalep.createdAt).toLocaleString('tr-TR')}
              </span>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">{selectedTalep.baslik}</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{selectedTalep.aciklama}</p>
            </div>

            {selectedTalep.cevaplar && selectedTalep.cevaplar.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-medium text-slate-500">Cevaplar</h4>
                {selectedTalep.cevaplar.map((cevap) => (
                  <div
                    key={cevap.id}
                    className={`p-3 rounded-lg ${cevap.adminYazdiMi ? 'bg-teal-50 ml-4' : 'bg-slate-50 mr-4'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${cevap.adminYazdiMi ? 'text-teal-700' : 'text-slate-600'}`}>
                        {cevap.adminYazdiMi ? 'Edura Destek' : 'Siz'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(cevap.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{cevap.icerik}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedTalep.durum !== 'COZULDU' && selectedTalep.durum !== 'KAPATILDI' && (
              <div className="pt-4 border-t border-slate-200">
                <textarea
                  value={cevapText}
                  onChange={(e) => setCevapText(e.target.value)}
                  placeholder="Cevabınızı yazın..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSendCevap}
                    disabled={sendingCevap || !cevapText.trim()}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {sendingCevap ? 'Gönderiliyor...' : 'Cevap Gönder'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function DestekPage() {
  return (
    <RoleGuard allowedRoles={['mudur']}>
      <DestekContent />
    </RoleGuard>
  );
}

