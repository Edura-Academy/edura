'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  CreditCard,
  Search,
  Plus,
  Check,
  Clock,
  AlertTriangle,
  X,
  ArrowLeft,
  FileText,
  Download,
  Calendar
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

interface Odeme {
  id: string;
  ogrenci: {
    id: string;
    ad: string;
    soyad: string;
    ogrenciNo: string;
    sinif?: { ad: string };
  };
  tutar: number;
  odenecekTutar: number;
  odenenTutar: number;
  vadeTarihi: string;
  odemeTarihi?: string;
  durum: 'BEKLIYOR' | 'ODENDI' | 'GECIKTI' | 'IPTAL';
  aciklama?: string;
  odemeTipi: string;
  createdAt: string;
}

interface OdemeForm {
  ogrenciId: string;
  tutar: number;
  vadeTarihi: string;
  odemeTipi: string;
  aciklama: string;
}

function SekreterOdemelerContent() {
  const [odemeler, setOdemeler] = useState<Odeme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showOdemeAlModal, setShowOdemeAlModal] = useState(false);
  const [selectedOdeme, setSelectedOdeme] = useState<Odeme | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDurum, setFilterDurum] = useState('');
  const [ogrenciler, setOgrenciler] = useState<any[]>([]);
  const [odemeAmount, setOdemeAmount] = useState('');

  const [formData, setFormData] = useState<OdemeForm>({
    ogrenciId: '',
    tutar: 0,
    vadeTarihi: '',
    odemeTipi: 'AYLIK',
    aciklama: ''
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchOdemeler();
    fetchOgrenciler();
  }, []);

  const fetchOdemeler = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/odemeler`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOdemeler(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Ödemeler alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOgrenciler = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ogrenciler`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOgrenciler(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Öğrenciler alınamadı:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/odemeler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchOdemeler();
      }
    } catch (error) {
      console.error('Ödeme oluşturma hatası:', error);
    }
  };

  const handleOdemeAl = async () => {
    if (!selectedOdeme || !odemeAmount) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/odemeler/${selectedOdeme.id}/odeme-al`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tutar: parseFloat(odemeAmount) })
      });

      if (res.ok) {
        setShowOdemeAlModal(false);
        setSelectedOdeme(null);
        setOdemeAmount('');
        fetchOdemeler();
      }
    } catch (error) {
      console.error('Ödeme alma hatası:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      ogrenciId: '',
      tutar: 0,
      vadeTarihi: '',
      odemeTipi: 'AYLIK',
      aciklama: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const getDurumBadge = (durum: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      BEKLIYOR: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock className="w-3 h-3" /> },
      ODENDI: { bg: 'bg-green-100', text: 'text-green-800', icon: <Check className="w-3 h-3" /> },
      GECIKTI: { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertTriangle className="w-3 h-3" /> },
      IPTAL: { bg: 'bg-slate-100', text: 'text-slate-800', icon: <X className="w-3 h-3" /> }
    };
    const badge = badges[durum] || badges.BEKLIYOR;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {durum === 'BEKLIYOR' ? 'Bekliyor' : durum === 'ODENDI' ? 'Ödendi' : durum === 'GECIKTI' ? 'Gecikti' : 'İptal'}
      </span>
    );
  };

  const filteredOdemeler = odemeler.filter(o => {
    const matchesSearch = 
      o.ogrenci.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.ogrenci.soyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.ogrenci.ogrenciNo.includes(searchTerm);
    const matchesDurum = !filterDurum || o.durum === filterDurum;
    return matchesSearch && matchesDurum;
  });

  const toplamBeklenen = odemeler.filter(o => o.durum === 'BEKLIYOR').reduce((acc, o) => acc + o.odenecekTutar, 0);
  const toplamOdenen = odemeler.filter(o => o.durum === 'ODENDI').reduce((acc, o) => acc + o.odenenTutar, 0);
  const toplamGeciken = odemeler.filter(o => o.durum === 'GECIKTI').reduce((acc, o) => acc + o.odenecekTutar, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/sekreter" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold">Ödeme Takibi</h1>
                <p className="text-green-100 text-sm">Öğrenci ödemelerini yönetin</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Yeni Ödeme
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Bekleyen</p>
                <p className="text-lg font-bold text-slate-800">{formatCurrency(toplamBeklenen)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Ödenen</p>
                <p className="text-lg font-bold text-slate-800">{formatCurrency(toplamOdenen)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Geciken</p>
                <p className="text-lg font-bold text-slate-800">{formatCurrency(toplamGeciken)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Toplam</p>
                <p className="text-lg font-bold text-slate-800">{odemeler.length} ödeme</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <select
            value={filterDurum}
            onChange={e => setFilterDurum(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="BEKLIYOR">Bekliyor</option>
            <option value="ODENDI">Ödendi</option>
            <option value="GECIKTI">Gecikti</option>
          </select>
        </div>

        {/* Ödeme Listesi */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-4 text-sm font-medium text-slate-600">Öğrenci</th>
                <th className="text-left p-4 text-sm font-medium text-slate-600">Tip</th>
                <th className="text-right p-4 text-sm font-medium text-slate-600">Tutar</th>
                <th className="text-center p-4 text-sm font-medium text-slate-600">Vade</th>
                <th className="text-center p-4 text-sm font-medium text-slate-600">Durum</th>
                <th className="text-right p-4 text-sm font-medium text-slate-600">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredOdemeler.map(odeme => (
                <tr key={odeme.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-slate-800">{odeme.ogrenci.ad} {odeme.ogrenci.soyad}</p>
                      <p className="text-xs text-slate-500">{odeme.ogrenci.ogrenciNo} - {odeme.ogrenci.sinif?.ad || '-'}</p>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{odeme.odemeTipi}</td>
                  <td className="p-4 text-right">
                    <p className="font-semibold text-slate-800">{formatCurrency(odeme.odenecekTutar)}</p>
                    {odeme.odenenTutar > 0 && (
                      <p className="text-xs text-green-600">Ödenen: {formatCurrency(odeme.odenenTutar)}</p>
                    )}
                  </td>
                  <td className="p-4 text-center text-slate-600 text-sm">
                    {formatDate(odeme.vadeTarihi)}
                  </td>
                  <td className="p-4 text-center">
                    {getDurumBadge(odeme.durum)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {odeme.durum !== 'ODENDI' && odeme.durum !== 'IPTAL' && (
                        <button
                          onClick={() => { setSelectedOdeme(odeme); setShowOdemeAlModal(true); }}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                        >
                          Ödeme Al
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOdemeler.length === 0 && (
            <div className="p-12 text-center">
              <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Ödeme kaydı bulunamadı</p>
            </div>
          )}
        </div>
      </div>

      {/* Yeni Ödeme Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">Yeni Ödeme Kaydı</h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Öğrenci</label>
                <select
                  required
                  value={formData.ogrenciId}
                  onChange={e => setFormData({ ...formData, ogrenciId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Öğrenci Seçin</option>
                  {ogrenciler.map(o => (
                    <option key={o.id} value={o.id}>{o.ad} {o.soyad} - {o.ogrenciNo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tutar</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.tutar || ''}
                  onChange={e => setFormData({ ...formData, tutar: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vade Tarihi</label>
                <input
                  type="date"
                  required
                  value={formData.vadeTarihi}
                  onChange={e => setFormData({ ...formData, vadeTarihi: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Tipi</label>
                <select
                  value={formData.odemeTipi}
                  onChange={e => setFormData({ ...formData, odemeTipi: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="AYLIK">Aylık Ödeme</option>
                  <option value="KAYIT">Kayıt Ücreti</option>
                  <option value="DIGER">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                <textarea
                  value={formData.aciklama}
                  onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ödeme Al Modal */}
      {showOdemeAlModal && selectedOdeme && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">Ödeme Al</h2>
              <button
                onClick={() => { setShowOdemeAlModal(false); setSelectedOdeme(null); setOdemeAmount(''); }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-800">{selectedOdeme.ogrenci.ad} {selectedOdeme.ogrenci.soyad}</p>
                <p className="text-sm text-slate-500">{selectedOdeme.ogrenci.ogrenciNo}</p>
                <div className="mt-2 flex justify-between">
                  <span className="text-slate-600">Kalan Tutar:</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(selectedOdeme.odenecekTutar - selectedOdeme.odenenTutar)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Tutarı</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={selectedOdeme.odenecekTutar - selectedOdeme.odenenTutar}
                  value={odemeAmount}
                  onChange={e => setOdemeAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowOdemeAlModal(false); setSelectedOdeme(null); setOdemeAmount(''); }}
                  className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleOdemeAl}
                  disabled={!odemeAmount || parseFloat(odemeAmount) <= 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Ödeme Al
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SekreterOdemelerPage() {
  return (
    <RoleGuard allowedRoles={['sekreter']}>
      <SekreterOdemelerContent />
    </RoleGuard>
  );
}

