'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  X,
  Calendar,
  Users,
  AlertTriangle,
  AlertCircle,
  Bell,
  ArrowLeft,
  FileText,
  Upload,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipler
interface Duyuru {
  id: string;
  baslik: string;
  icerik: string;
  hedef: 'HERKESE' | 'SINIF' | 'OGRETMENLER' | 'OGRENCILER' | 'VELILER' | 'PERSONEL';
  oncelik: 'NORMAL' | 'ONEMLI' | 'ACIL';
  sinifIds: string | null;
  dosyaUrl: string | null;
  dosyaAd: string | null;
  aktif: boolean;
  yayinTarihi: string;
  bitisTarihi: string | null;
  olusturan: {
    id: string;
    ad: string;
    soyad: string;
    role: string;
  };
  kurs: { id: string; ad: string } | null;
  _count: { okuyanlar: number };
  createdAt: string;
}

interface Sinif {
  id: string;
  ad: string;
  seviye: number;
  _count: { ogrenciler: number };
}

const hedefOptions = [
  { value: 'HERKESE', label: 'Herkese', icon: Users },
  { value: 'SINIF', label: 'Belirli Sınıflar', icon: Users },
  { value: 'OGRETMENLER', label: 'Öğretmenler', icon: Users },
  { value: 'OGRENCILER', label: 'Öğrenciler', icon: Users },
  { value: 'PERSONEL', label: 'Personel', icon: Users },
];

const oncelikOptions = [
  { value: 'NORMAL', label: 'Normal', color: 'bg-slate-100 text-slate-700' },
  { value: 'ONEMLI', label: 'Önemli', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'ACIL', label: 'Acil', color: 'bg-red-100 text-red-700' },
];

export default function DuyurularPage() {
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDuyuru, setEditingDuyuru] = useState<Duyuru | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOncelik, setFilterOncelik] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    baslik: '',
    icerik: '',
    hedef: 'HERKESE' as Duyuru['hedef'],
    oncelik: 'NORMAL' as Duyuru['oncelik'],
    sinifIds: [] as string[],
    dosyaUrl: '',
    dosyaAd: '',
    bitisTarihi: ''
  });

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Duyuruları getir
  const fetchDuyurular = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/duyurular/yonetim`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setDuyurular(data.data);
      }
    } catch (error) {
      console.error('Duyurular yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Sınıfları getir
  const fetchSiniflar = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/duyurular/siniflar`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setSiniflar(data.data);
      }
    } catch (error) {
      console.error('Sınıflar yüklenemedi:', error);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchDuyurular();
    fetchSiniflar();
  }, [fetchDuyurular, fetchSiniflar]);

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingDuyuru 
        ? `${API_URL}/duyurular/${editingDuyuru.id}`
        : `${API_URL}/duyurular`;
      
      const method = editingDuyuru ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          sinifIds: formData.hedef === 'SINIF' ? formData.sinifIds : null,
          bitisTarihi: formData.bitisTarihi || null
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(editingDuyuru ? 'Duyuru güncellendi!' : 'Duyuru yayınlandı!');
        setShowModal(false);
        resetForm();
        fetchDuyurular();
      } else {
        alert(data.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Hata:', error);
      alert('Bir hata oluştu');
    }
  };

  // Duyuru sil
  const handleDelete = async (id: string) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetch(`${API_URL}/duyurular/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        fetchDuyurular();
      }
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  // Düzenleme modunu aç
  const handleEdit = (duyuru: Duyuru) => {
    setEditingDuyuru(duyuru);
    setFormData({
      baslik: duyuru.baslik,
      icerik: duyuru.icerik,
      hedef: duyuru.hedef,
      oncelik: duyuru.oncelik,
      sinifIds: duyuru.sinifIds ? JSON.parse(duyuru.sinifIds) : [],
      dosyaUrl: duyuru.dosyaUrl || '',
      dosyaAd: duyuru.dosyaAd || '',
      bitisTarihi: duyuru.bitisTarihi ? duyuru.bitisTarihi.split('T')[0] : ''
    });
    setShowModal(true);
  };

  // Formu sıfırla
  const resetForm = () => {
    setEditingDuyuru(null);
    setFormData({
      baslik: '',
      icerik: '',
      hedef: 'HERKESE',
      oncelik: 'NORMAL',
      sinifIds: [],
      dosyaUrl: '',
      dosyaAd: '',
      bitisTarihi: ''
    });
  };

  // Filtreleme
  const filteredDuyurular = duyurular.filter(d => {
    if (searchQuery && !d.baslik.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterOncelik && d.oncelik !== filterOncelik) {
      return false;
    }
    return true;
  });

  // Tarih formatla
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Öncelik badge
  const getOncelikBadge = (oncelik: string) => {
    const opt = oncelikOptions.find(o => o.value === oncelik);
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${opt?.color}`}>
        {opt?.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A884]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-[#008069] text-white px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/personel" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold">Duyurular</h1>
                <p className="text-white/70 text-sm mt-0.5">Duyuru oluştur ve yönet</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Yeni Duyuru</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Filtreler */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Duyuru ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884]"
              />
            </div>
            <select
              value={filterOncelik}
              onChange={(e) => setFilterOncelik(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884]"
            >
              <option value="">Tüm Öncelikler</option>
              {oncelikOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-slate-800">{duyurular.length}</div>
            <div className="text-sm text-slate-500">Toplam</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{duyurular.filter(d => d.aktif).length}</div>
            <div className="text-sm text-slate-500">Aktif</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{duyurular.filter(d => d.oncelik === 'ONEMLI').length}</div>
            <div className="text-sm text-yellow-600">Önemli</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-600">{duyurular.filter(d => d.oncelik === 'ACIL').length}</div>
            <div className="text-sm text-red-600">Acil</div>
          </div>
        </div>

        {/* Duyuru Listesi */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredDuyurular.length === 0 ? (
            <div className="p-12 text-center">
              <Megaphone size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Henüz duyuru yok</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDuyurular.map(duyuru => (
                <div key={duyuru.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {getOncelikBadge(duyuru.oncelik)}
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {hedefOptions.find(h => h.value === duyuru.hedef)?.label}
                        </span>
                        {!duyuru.aktif && (
                          <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">Pasif</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-800">{duyuru.baslik}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{duyuru.icerik}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(duyuru.yayinTarihi)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {duyuru._count.okuyanlar} okunma
                        </span>
                        <span>{duyuru.olusturan.ad} {duyuru.olusturan.soyad}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(duyuru)}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-600"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(duyuru.id)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 bg-[#008069] text-white flex items-center justify-between sticky top-0">
              <h3 className="text-lg font-semibold">
                {editingDuyuru ? 'Duyuruyu Düzenle' : 'Yeni Duyuru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Başlık */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  value={formData.baslik}
                  onChange={(e) => setFormData(prev => ({ ...prev, baslik: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884]"
                  placeholder="Duyuru başlığı"
                />
              </div>

              {/* İçerik */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İçerik *</label>
                <textarea
                  value={formData.icerik}
                  onChange={(e) => setFormData(prev => ({ ...prev, icerik: e.target.value }))}
                  required
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884] resize-none"
                  placeholder="Duyuru içeriği..."
                />
              </div>

              {/* Hedef & Öncelik */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hedef Kitle</label>
                  <select
                    value={formData.hedef}
                    onChange={(e) => setFormData(prev => ({ ...prev, hedef: e.target.value as Duyuru['hedef'] }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884]"
                  >
                    {hedefOptions.map(h => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Öncelik</label>
                  <select
                    value={formData.oncelik}
                    onChange={(e) => setFormData(prev => ({ ...prev, oncelik: e.target.value as Duyuru['oncelik'] }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884]"
                  >
                    {oncelikOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sınıf Seçimi (hedef SINIF ise) */}
              {formData.hedef === 'SINIF' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sınıflar</label>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg">
                    {siniflar.map(sinif => (
                      <label key={sinif.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.sinifIds.includes(sinif.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ ...prev, sinifIds: [...prev.sinifIds, sinif.id] }));
                            } else {
                              setFormData(prev => ({ ...prev, sinifIds: prev.sinifIds.filter(id => id !== sinif.id) }));
                            }
                          }}
                          className="rounded text-[#00A884] focus:ring-[#00A884]"
                        />
                        <span className="text-sm">{sinif.ad} ({sinif._count.ogrenciler})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Bitiş Tarihi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Tarihi (Opsiyonel)</label>
                <input
                  type="date"
                  value={formData.bitisTarihi}
                  onChange={(e) => setFormData(prev => ({ ...prev, bitisTarihi: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884]"
                />
                <p className="text-xs text-slate-400 mt-1">Belirli bir tarihte duyuru otomatik olarak gizlenir</p>
              </div>

              {/* Butonlar */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#00A884] text-white rounded-lg hover:bg-[#008069] font-medium"
                >
                  {editingDuyuru ? 'Güncelle' : 'Yayınla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

