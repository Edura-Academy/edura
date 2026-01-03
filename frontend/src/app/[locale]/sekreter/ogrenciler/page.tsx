'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  X,
  ArrowLeft,
  Phone,
  Mail,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

interface Ogrenci {
  id: string;
  ogrenciNo: string;
  ad: string;
  soyad: string;
  email: string;
  telefon?: string;
  dogumTarihi?: string;
  cinsiyet?: string;
  adres?: string;
  sinif?: {
    id: string;
    ad: string;
  };
  veli?: {
    ad: string;
    soyad: string;
    telefon: string;
  };
  aktif: boolean;
  createdAt: string;
}

interface Sinif {
  id: string;
  ad: string;
}

function SekreterOgrencilerContent() {
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOgrenci, setSelectedOgrenci] = useState<Ogrenci | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSinif, setFilterSinif] = useState('');
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    ogrenciNo: '',
    ad: '',
    soyad: '',
    email: '',
    telefon: '',
    dogumTarihi: '',
    cinsiyet: 'ERKEK',
    adres: '',
    sinifId: '',
    veliAd: '',
    veliSoyad: '',
    veliTelefon: '',
    veliEmail: ''
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchOgrenciler();
    fetchSiniflar();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchSiniflar = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/siniflar`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSiniflar(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Sınıflar alınamadı:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editMode && selectedOgrenci
        ? `${API_URL}/ogrenciler/${selectedOgrenci.id}`
        : `${API_URL}/ogrenciler`;

      const res = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchOgrenciler();
      }
    } catch (error) {
      console.error('Kayıt hatası:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Öğrenciyi silmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/ogrenciler/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOgrenciler();
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const handleEdit = (ogrenci: Ogrenci) => {
    setSelectedOgrenci(ogrenci);
    setFormData({
      ogrenciNo: ogrenci.ogrenciNo,
      ad: ogrenci.ad,
      soyad: ogrenci.soyad,
      email: ogrenci.email,
      telefon: ogrenci.telefon || '',
      dogumTarihi: ogrenci.dogumTarihi?.split('T')[0] || '',
      cinsiyet: ogrenci.cinsiyet || 'ERKEK',
      adres: ogrenci.adres || '',
      sinifId: ogrenci.sinif?.id || '',
      veliAd: ogrenci.veli?.ad || '',
      veliSoyad: ogrenci.veli?.soyad || '',
      veliTelefon: ogrenci.veli?.telefon || '',
      veliEmail: ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleView = (ogrenci: Ogrenci) => {
    setSelectedOgrenci(ogrenci);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      ogrenciNo: '',
      ad: '',
      soyad: '',
      email: '',
      telefon: '',
      dogumTarihi: '',
      cinsiyet: 'ERKEK',
      adres: '',
      sinifId: '',
      veliAd: '',
      veliSoyad: '',
      veliTelefon: '',
      veliEmail: ''
    });
    setEditMode(false);
    setSelectedOgrenci(null);
  };

  const filteredOgrenciler = ogrenciler.filter(o => {
    const matchesSearch = 
      o.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.soyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.ogrenciNo.includes(searchTerm);
    const matchesSinif = !filterSinif || o.sinif?.id === filterSinif;
    return matchesSearch && matchesSinif;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/sekreter" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold">Öğrenci Kayıt</h1>
                <p className="text-indigo-100 text-sm">Öğrenci kayıtlarını yönetin</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Yeni Öğrenci
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="İsim veya öğrenci no ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <select
            value={filterSinif}
            onChange={e => setFilterSinif(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tüm Sınıflar</option>
            {siniflar.map(s => (
              <option key={s.id} value={s.id}>{s.ad}</option>
            ))}
          </select>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-slate-800">{ogrenciler.length}</div>
            <div className="text-slate-500 text-sm">Toplam Öğrenci</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">
              {ogrenciler.filter(o => o.aktif).length}
            </div>
            <div className="text-slate-500 text-sm">Aktif</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-indigo-600">
              {siniflar.length}
            </div>
            <div className="text-slate-500 text-sm">Sınıf</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-2xl font-bold text-amber-600">
              {ogrenciler.filter(o => {
                const date = new Date(o.createdAt);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <div className="text-slate-500 text-sm">Bu Ay Kayıt</div>
          </div>
        </div>

        {/* Öğrenci Listesi */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-4 text-sm font-medium text-slate-600">Öğrenci No</th>
                <th className="text-left p-4 text-sm font-medium text-slate-600">Ad Soyad</th>
                <th className="text-left p-4 text-sm font-medium text-slate-600">Sınıf</th>
                <th className="text-left p-4 text-sm font-medium text-slate-600">İletişim</th>
                <th className="text-center p-4 text-sm font-medium text-slate-600">Durum</th>
                <th className="text-right p-4 text-sm font-medium text-slate-600">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredOgrenciler.map(ogrenci => (
                <tr key={ogrenci.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{ogrenci.ogrenciNo}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium text-sm">
                        {ogrenci.ad[0]}{ogrenci.soyad[0]}
                      </div>
                      <span className="text-slate-800">{ogrenci.ad} {ogrenci.soyad}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{ogrenci.sinif?.ad || '-'}</td>
                  <td className="p-4">
                    <div className="text-sm text-slate-600">{ogrenci.email}</div>
                    <div className="text-xs text-slate-400">{ogrenci.telefon}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ogrenci.aktif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {ogrenci.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(ogrenci)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(ogrenci)}
                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ogrenci.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOgrenciler.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Öğrenci bulunamadı</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">
                {editMode ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Kaydı'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Öğrenci Bilgileri */}
              <div>
                <h3 className="font-medium text-slate-800 mb-4">Öğrenci Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Öğrenci No</label>
                    <input
                      type="text"
                      required
                      value={formData.ogrenciNo}
                      onChange={e => setFormData({ ...formData, ogrenciNo: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf</label>
                    <select
                      value={formData.sinifId}
                      onChange={e => setFormData({ ...formData, sinifId: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Sınıf Seçin</option>
                      {siniflar.map(s => (
                        <option key={s.id} value={s.id}>{s.ad}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ad</label>
                    <input
                      type="text"
                      required
                      value={formData.ad}
                      onChange={e => setFormData({ ...formData, ad: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Soyad</label>
                    <input
                      type="text"
                      required
                      value={formData.soyad}
                      onChange={e => setFormData({ ...formData, soyad: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={formData.telefon}
                      onChange={e => setFormData({ ...formData, telefon: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Doğum Tarihi</label>
                    <input
                      type="date"
                      value={formData.dogumTarihi}
                      onChange={e => setFormData({ ...formData, dogumTarihi: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cinsiyet</label>
                    <select
                      value={formData.cinsiyet}
                      onChange={e => setFormData({ ...formData, cinsiyet: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ERKEK">Erkek</option>
                      <option value="KADIN">Kadın</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                    <textarea
                      value={formData.adres}
                      onChange={e => setFormData({ ...formData, adres: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Veli Bilgileri */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-medium text-slate-800 mb-4">Veli Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Veli Adı</label>
                    <input
                      type="text"
                      value={formData.veliAd}
                      onChange={e => setFormData({ ...formData, veliAd: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Veli Soyadı</label>
                    <input
                      type="text"
                      value={formData.veliSoyad}
                      onChange={e => setFormData({ ...formData, veliSoyad: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Veli Telefon</label>
                    <input
                      type="tel"
                      value={formData.veliTelefon}
                      onChange={e => setFormData({ ...formData, veliTelefon: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Veli E-posta</label>
                    <input
                      type="email"
                      value={formData.veliEmail}
                      onChange={e => setFormData({ ...formData, veliEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editMode ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOgrenci && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">Öğrenci Detayı</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {selectedOgrenci.ad[0]}{selectedOgrenci.soyad[0]}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">
                    {selectedOgrenci.ad} {selectedOgrenci.soyad}
                  </h3>
                  <p className="text-slate-500">{selectedOgrenci.ogrenciNo}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Sınıf</p>
                    <p className="text-slate-800">{selectedOgrenci.sinif?.ad || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Mail className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">E-posta</p>
                    <p className="text-slate-800">{selectedOgrenci.email}</p>
                  </div>
                </div>
                {selectedOgrenci.telefon && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Phone className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Telefon</p>
                      <p className="text-slate-800">{selectedOgrenci.telefon}</p>
                    </div>
                  </div>
                )}
                {selectedOgrenci.veli && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Users className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500">Veli</p>
                      <p className="text-slate-800">{selectedOgrenci.veli.ad} {selectedOgrenci.veli.soyad}</p>
                      <p className="text-xs text-slate-500">{selectedOgrenci.veli.telefon}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SekreterOgrencilerPage() {
  return (
    <RoleGuard allowedRoles={['sekreter']}>
      <SekreterOgrencilerContent />
    </RoleGuard>
  );
}

