'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  ArrowLeft,
  Pin,
  Calendar,
  Users
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

interface Duyuru {
  id: string;
  baslik: string;
  icerik: string;
  tip: 'GENEL' | 'OGRENCI' | 'VELI' | 'PERSONEL';
  oncelik: 'NORMAL' | 'ONEMLI' | 'ACIL';
  sabitle: boolean;
  aktif: boolean;
  yayinTarihi: string;
  bitisTarihi?: string;
  olusturan: {
    ad: string;
    soyad: string;
  };
  createdAt: string;
}

function SekreterDuyurularContent() {
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDuyuru, setSelectedDuyuru] = useState<Duyuru | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTip, setFilterTip] = useState('');
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    baslik: '',
    icerik: '',
    tip: 'GENEL' as Duyuru['tip'],
    oncelik: 'NORMAL' as Duyuru['oncelik'],
    sabitle: false,
    bitisTarihi: ''
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchDuyurular();
  }, []);

  const fetchDuyurular = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/duyurular`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDuyurular(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Duyurular alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editMode && selectedDuyuru
        ? `${API_URL}/duyurular/${selectedDuyuru.id}`
        : `${API_URL}/duyurular`;

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
        fetchDuyurular();
      }
    } catch (error) {
      console.error('Duyuru hatası:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Duyuruyu silmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/duyurular/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDuyurular();
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const handleEdit = (duyuru: Duyuru) => {
    setSelectedDuyuru(duyuru);
    setFormData({
      baslik: duyuru.baslik,
      icerik: duyuru.icerik,
      tip: duyuru.tip,
      oncelik: duyuru.oncelik,
      sabitle: duyuru.sabitle,
      bitisTarihi: duyuru.bitisTarihi?.split('T')[0] || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleView = (duyuru: Duyuru) => {
    setSelectedDuyuru(duyuru);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      baslik: '',
      icerik: '',
      tip: 'GENEL',
      oncelik: 'NORMAL',
      sabitle: false,
      bitisTarihi: ''
    });
    setEditMode(false);
    setSelectedDuyuru(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTipBadge = (tip: string) => {
    const colors: Record<string, string> = {
      GENEL: 'bg-blue-100 text-blue-800',
      OGRENCI: 'bg-green-100 text-green-800',
      VELI: 'bg-purple-100 text-purple-800',
      PERSONEL: 'bg-amber-100 text-amber-800'
    };
    const labels: Record<string, string> = {
      GENEL: 'Genel',
      OGRENCI: 'Öğrenci',
      VELI: 'Veli',
      PERSONEL: 'Personel'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tip]}`}>
        {labels[tip]}
      </span>
    );
  };

  const getOncelikBadge = (oncelik: string) => {
    const colors: Record<string, string> = {
      NORMAL: 'bg-slate-100 text-slate-800',
      ONEMLI: 'bg-orange-100 text-orange-800',
      ACIL: 'bg-red-100 text-red-800'
    };
    const labels: Record<string, string> = {
      NORMAL: 'Normal',
      ONEMLI: 'Önemli',
      ACIL: 'Acil'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[oncelik]}`}>
        {labels[oncelik]}
      </span>
    );
  };

  const filteredDuyurular = duyurular.filter(d => {
    const matchesSearch = d.baslik.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTip = !filterTip || d.tip === filterTip;
    return matchesSearch && matchesTip;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/sekreter" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold">Duyurular</h1>
                <p className="text-amber-100 text-sm">Duyuruları yönetin</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Yeni Duyuru
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
                placeholder="Duyuru ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <select
            value={filterTip}
            onChange={e => setFilterTip(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Tüm Tipler</option>
            <option value="GENEL">Genel</option>
            <option value="OGRENCI">Öğrenci</option>
            <option value="VELI">Veli</option>
            <option value="PERSONEL">Personel</option>
          </select>
        </div>

        {/* Duyuru Listesi */}
        {filteredDuyurular.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Duyuru bulunamadı</h3>
            <p className="text-slate-500">Yeni duyuru ekleyerek başlayın</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDuyurular.map(duyuru => (
              <div
                key={duyuru.id}
                className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${
                  duyuru.oncelik === 'ACIL' ? 'border-red-500' :
                  duyuru.oncelik === 'ONEMLI' ? 'border-orange-500' :
                  'border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {duyuru.sabitle && <Pin className="w-4 h-4 text-amber-500" />}
                      <h3 className="text-lg font-semibold text-slate-800">{duyuru.baslik}</h3>
                      {getTipBadge(duyuru.tip)}
                      {getOncelikBadge(duyuru.oncelik)}
                    </div>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-3">{duyuru.icerik}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(duyuru.yayinTarihi || duyuru.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {duyuru.olusturan?.ad} {duyuru.olusturan?.soyad}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(duyuru)}
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(duyuru)}
                      className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(duyuru.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">
                {editMode ? 'Duyuru Düzenle' : 'Yeni Duyuru'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık</label>
                <input
                  type="text"
                  required
                  value={formData.baslik}
                  onChange={e => setFormData({ ...formData, baslik: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İçerik</label>
                <textarea
                  required
                  value={formData.icerik}
                  onChange={e => setFormData({ ...formData, icerik: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tip</label>
                  <select
                    value={formData.tip}
                    onChange={e => setFormData({ ...formData, tip: e.target.value as Duyuru['tip'] })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="GENEL">Genel</option>
                    <option value="OGRENCI">Öğrenci</option>
                    <option value="VELI">Veli</option>
                    <option value="PERSONEL">Personel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Öncelik</label>
                  <select
                    value={formData.oncelik}
                    onChange={e => setFormData({ ...formData, oncelik: e.target.value as Duyuru['oncelik'] })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="ONEMLI">Önemli</option>
                    <option value="ACIL">Acil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Tarihi (Opsiyonel)</label>
                <input
                  type="date"
                  value={formData.bitisTarihi}
                  onChange={e => setFormData({ ...formData, bitisTarihi: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sabitle}
                  onChange={e => setFormData({ ...formData, sabitle: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-slate-700">Duyuruyu sabitle</span>
              </label>

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
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editMode ? 'Güncelle' : 'Yayınla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDuyuru && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {selectedDuyuru.sabitle && <Pin className="w-5 h-5 text-amber-500" />}
                {getTipBadge(selectedDuyuru.tip)}
                {getOncelikBadge(selectedDuyuru.oncelik)}
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">{selectedDuyuru.baslik}</h2>
              <p className="text-slate-600 whitespace-pre-wrap mb-6">{selectedDuyuru.icerik}</p>
              <div className="flex items-center gap-4 text-sm text-slate-500 border-t border-slate-100 pt-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedDuyuru.yayinTarihi || selectedDuyuru.createdAt)}
                </span>
                <span>
                  {selectedDuyuru.olusturan?.ad} {selectedDuyuru.olusturan?.soyad}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SekreterDuyurularPage() {
  return (
    <RoleGuard allowedRoles={['sekreter']}>
      <SekreterDuyurularContent />
    </RoleGuard>
  );
}

