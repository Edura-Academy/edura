'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  role: string;
}

interface Cevap {
  id: string;
  icerik: string;
  adminYazdiMi: boolean;
  createdAt: string;
  cevaplayan?: User;
}

interface DestekTalebi {
  id: string;
  baslik: string;
  aciklama: string;
  kategori: string;
  oncelik: string;
  durum: string;
  createdAt: string;
  kapatmaTarihi?: string;
  cozumNotu?: string;
  acan?: User;
  _count?: { cevaplar: number };
  cevaplar?: Cevap[];
}

const DURUM_COLORS: Record<string, string> = {
  ACIK: 'bg-blue-900/50 text-blue-400',
  INCELENIYOR: 'bg-amber-900/50 text-amber-400',
  CEVAPLANDI: 'bg-purple-900/50 text-purple-400',
  BEKLEMEDE: 'bg-slate-700 text-slate-400',
  COZULDU: 'bg-green-900/50 text-green-400',
  KAPATILDI: 'bg-slate-600 text-slate-300',
};

const ONCELIK_COLORS: Record<string, string> = {
  DUSUK: 'bg-slate-700 text-slate-400',
  NORMAL: 'bg-blue-900/50 text-blue-400',
  YUKSEK: 'bg-amber-900/50 text-amber-400',
  ACIL: 'bg-red-900/50 text-red-400',
};

const KATEGORI_LABELS: Record<string, string> = {
  TEKNIK: 'Teknik',
  OZELLIK_TALEBI: 'Özellik Talebi',
  FATURA: 'Fatura/Ödeme',
  HESAP: 'Hesap',
  DIGER: 'Diğer',
};

export default function DestekTalepleriPage() {
  const [talepler, setTalepler] = useState<DestekTalebi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTalep, setSelectedTalep] = useState<DestekTalebi | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [cevapText, setCevapText] = useState('');
  const [sendingCevap, setSendingCevap] = useState(false);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    fetchTalepler();
  }, [filter]);

  const fetchTalepler = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filter) params.append('durum', filter);

      const res = await fetch(`${API_URL}/admin-system/destek?${params.toString()}`, {
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

  const openDetailModal = async (talep: DestekTalebi) => {
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
        openDetailModal(selectedTalep); // Refresh
        fetchTalepler();
      }
    } catch (error) {
      console.error('Cevap gönderilemedi:', error);
    } finally {
      setSendingCevap(false);
    }
  };

  const handleChangeDurum = async (durum: string) => {
    if (!selectedTalep) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/admin-system/destek/${selectedTalep.id}/durum`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ durum })
      });

      openDetailModal(selectedTalep);
      fetchTalepler();
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const acikTalepler = talepler.filter(t => t.durum === 'ACIK').length;
  const bekleyenTalepler = talepler.filter(t => t.durum === 'BEKLEMEDE' || t.durum === 'INCELENIYOR').length;

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
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-bold text-xl text-white">Destek Talepleri</h1>
                  <p className="text-xs text-slate-400">Teknik destek yönetimi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{talepler.length}</p>
            <p className="text-xs text-slate-400">Toplam Talep</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-400">{acikTalepler}</p>
            <p className="text-xs text-slate-400">Açık Talep</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-amber-400">{bekleyenTalepler}</p>
            <p className="text-xs text-slate-400">Bekleyen</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-400">{talepler.filter(t => t.durum === 'COZULDU').length}</p>
            <p className="text-xs text-slate-400">Çözülen</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { value: '', label: 'Tümü' },
            { value: 'ACIK', label: 'Açık' },
            { value: 'INCELENIYOR', label: 'İnceleniyor' },
            { value: 'CEVAPLANDI', label: 'Cevaplandı' },
            { value: 'BEKLEMEDE', label: 'Beklemede' },
            { value: 'COZULDU', label: 'Çözüldü' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Talepler Listesi */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {talepler.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              {filter ? 'Bu filtreye uygun talep bulunamadı.' : 'Henüz destek talebi bulunmuyor.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {talepler.map((talep) => (
                <div
                  key={talep.id}
                  onClick={() => openDetailModal(talep)}
                  className="p-4 hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${DURUM_COLORS[talep.durum]}`}>
                          {talep.durum.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${ONCELIK_COLORS[talep.oncelik]}`}>
                          {talep.oncelik}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">
                          {KATEGORI_LABELS[talep.kategori]}
                        </span>
                      </div>
                      <h3 className="font-medium text-white mb-1">{talep.baslik}</h3>
                      <p className="text-sm text-slate-400 line-clamp-1">{talep.aciklama}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        {talep.acan && (
                          <span>{talep.acan.ad} {talep.acan.soyad}</span>
                        )}
                        <span>{new Date(talep.createdAt).toLocaleDateString('tr-TR')}</span>
                        {talep._count && (
                          <span>{talep._count.cevaplar} cevap</span>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Talep Detayı"
        size="xl"
      >
        {selectedTalep && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${DURUM_COLORS[selectedTalep.durum]}`}>
                  {selectedTalep.durum.replace('_', ' ')}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${ONCELIK_COLORS[selectedTalep.oncelik]}`}>
                  {selectedTalep.oncelik}
                </span>
              </div>
              <select
                value={selectedTalep.durum}
                onChange={(e) => handleChangeDurum(e.target.value)}
                className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white"
              >
                <option value="ACIK">Açık</option>
                <option value="INCELENIYOR">İnceleniyor</option>
                <option value="CEVAPLANDI">Cevaplandı</option>
                <option value="BEKLEMEDE">Beklemede</option>
                <option value="COZULDU">Çözüldü</option>
                <option value="KAPATILDI">Kapatıldı</option>
              </select>
            </div>

            {/* Talep Detayı */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">{selectedTalep.baslik}</h3>
              <p className="text-slate-300 whitespace-pre-wrap">{selectedTalep.aciklama}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                {selectedTalep.acan && (
                  <span>Açan: {selectedTalep.acan.ad} {selectedTalep.acan.soyad}</span>
                )}
                <span>{new Date(selectedTalep.createdAt).toLocaleString('tr-TR')}</span>
              </div>
            </div>

            {/* Cevaplar */}
            {selectedTalep.cevaplar && selectedTalep.cevaplar.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-medium text-slate-400">Cevaplar</h4>
                {selectedTalep.cevaplar.map((cevap) => (
                  <div
                    key={cevap.id}
                    className={`p-3 rounded-lg ${cevap.adminYazdiMi ? 'bg-teal-900/30 ml-4' : 'bg-slate-700/50 mr-4'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${cevap.adminYazdiMi ? 'text-teal-400' : 'text-slate-400'}`}>
                        {cevap.adminYazdiMi ? 'Admin' : cevap.cevaplayan?.ad || 'Müdür'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(cevap.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{cevap.icerik}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Cevap Yaz */}
            <div className="pt-4 border-t border-slate-700">
              <textarea
                value={cevapText}
                onChange={(e) => setCevapText(e.target.value)}
                placeholder="Cevabınızı yazın..."
                rows={3}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 resize-none"
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
          </div>
        )}
      </Modal>
    </div>
  );
}

