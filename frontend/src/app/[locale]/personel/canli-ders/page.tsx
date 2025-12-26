'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Plus,
  Play,
  Square,
  Users,
  Calendar,
  Clock,
  Settings,
  Trash2,
  ExternalLink,
  BarChart3,
  X,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MessageSquare,
  Save,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface Course {
  id: string;
  ad: string;
  sinif: {
    ad: string;
  };
}

interface CanliDers {
  id: string;
  baslik: string;
  aciklama?: string;
  courseId: string;
  course: {
    ad: string;
    sinif: {
      ad: string;
    };
  };
  baslangicTarihi: string;
  bitisTarihi: string;
  odaAdi: string;
  odaSifresi?: string;
  kayitYapilsin: boolean;
  mikrofonAcik: boolean;
  kameraAcik: boolean;
  sohbetAcik: boolean;
  durum: 'PLANLANMIS' | 'AKTIF' | 'SONA_ERDI' | 'IPTAL';
  _count?: {
    katilimlar: number;
  };
}

interface KatilimIstatistik {
  toplamOgrenci: number;
  katilanOgrenci: number;
  katilimOrani: number;
  katilimlar: Array<{
    id: string;
    ogrenci: {
      id: string;
      ad: string;
      soyad: string;
      ogrenciNo: string;
    };
    girisZamani: string;
    cikisZamani?: string;
    toplamSure?: number;
  }>;
  katilmayanlar: Array<{
    id: string;
    ad: string;
    soyad: string;
    ogrenciNo: string;
  }>;
}

export default function PersonelCanliDersPage() {
  const router = useRouter();
  const [dersler, setDersler] = useState<CanliDers[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedDers, setSelectedDers] = useState<CanliDers | null>(null);
  const [stats, setStats] = useState<KatilimIstatistik | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    baslik: '',
    aciklama: '',
    courseId: '',
    baslangicTarihi: '',
    bitisTarihi: '',
    odaSifresi: '',
    kayitYapilsin: false,
    mikrofonAcik: false,
    kameraAcik: false,
    sohbetAcik: true
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchDersler();
    fetchCourses();
  }, [filter]);

  const fetchDersler = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('durum', filter);

      const res = await fetch(`${API_URL}/canli-ders/ogretmen/liste?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDersler(data);
    } catch (error) {
      console.error('Dersler alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/courses/ogretmen`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCourses(data);
    } catch (error) {
      console.error('Dersler alınamadı:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editMode && selectedDers
        ? `${API_URL}/canli-ders/${selectedDers.id}`
        : `${API_URL}/canli-ders`;

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
        fetchDersler();
      }
    } catch (error) {
      console.error('İşlem hatası:', error);
    }
  };

  const handleStart = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/canli-ders/${id}/baslat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        window.open(data.joinUrl, '_blank');
        fetchDersler();
      }
    } catch (error) {
      console.error('Başlatma hatası:', error);
    }
  };

  const handleEnd = async (id: string) => {
    if (!confirm('Dersi bitirmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/canli-ders/${id}/bitir`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDersler();
    } catch (error) {
      console.error('Bitirme hatası:', error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Dersi iptal etmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/canli-ders/${id}/iptal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDersler();
    } catch (error) {
      console.error('İptal hatası:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Dersi silmek istediğinize emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/canli-ders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDersler();
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const viewStats = async (ders: CanliDers) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/canli-ders/${ders.id}/istatistikler`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
      setSelectedDers(ders);
      setShowStatsModal(true);
    } catch (error) {
      console.error('İstatistik hatası:', error);
    }
  };

  const editDers = (ders: CanliDers) => {
    setSelectedDers(ders);
    setFormData({
      baslik: ders.baslik,
      aciklama: ders.aciklama || '',
      courseId: ders.courseId,
      baslangicTarihi: new Date(ders.baslangicTarihi).toISOString().slice(0, 16),
      bitisTarihi: new Date(ders.bitisTarihi).toISOString().slice(0, 16),
      odaSifresi: ders.odaSifresi || '',
      kayitYapilsin: ders.kayitYapilsin,
      mikrofonAcik: ders.mikrofonAcik,
      kameraAcik: ders.kameraAcik,
      sohbetAcik: ders.sohbetAcik
    });
    setEditMode(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      baslik: '',
      aciklama: '',
      courseId: '',
      baslangicTarihi: '',
      bitisTarihi: '',
      odaSifresi: '',
      kayitYapilsin: false,
      mikrofonAcik: false,
      kameraAcik: false,
      sohbetAcik: true
    });
    setEditMode(false);
    setSelectedDers(null);
  };

  const getDurumBadge = (durum: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      PLANLANMIS: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Calendar className="w-3 h-3" /> },
      AKTIF: { bg: 'bg-green-100', text: 'text-green-800', icon: <Play className="w-3 h-3" /> },
      SONA_ERDI: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <CheckCircle className="w-3 h-3" /> },
      IPTAL: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-3 h-3" /> }
    };
    const badge = badges[durum] || badges.PLANLANMIS;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {durum === 'PLANLANMIS' ? 'Planlandı' : durum === 'AKTIF' ? 'Canlı' : durum === 'SONA_ERDI' ? 'Bitti' : 'İptal'}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
              <Video className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Canlı Dersler</h1>
              <p className="text-gray-400">Video konferans ile canlı ders yapın</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Yeni Canlı Ders
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: 'Tümü' },
            { value: 'PLANLANMIS', label: 'Planlanan' },
            { value: 'AKTIF', label: 'Aktif' },
            { value: 'SONA_ERDI', label: 'Biten' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === f.value
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={fetchDersler}
            className="ml-auto px-4 py-2 bg-white/5 text-gray-400 hover:bg-white/10 rounded-lg transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Ders Listesi */}
        {dersler.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center">
            <Video className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Henüz canlı ders yok</h3>
            <p className="text-gray-400">Yeni bir canlı ders oluşturarak başlayın</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {dersler.map(ders => (
              <div
                key={ders.id}
                className={`bg-white/10 backdrop-blur-xl rounded-2xl p-6 border transition-all ${
                  ders.durum === 'AKTIF' ? 'border-green-500/50 shadow-green-500/20 shadow-lg' : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{ders.baslik}</h3>
                      {getDurumBadge(ders.durum)}
                      {ders.durum === 'AKTIF' && (
                        <span className="flex items-center gap-1 text-green-400 text-sm animate-pulse">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          CANLI
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 mb-3">
                      {ders.course.sinif.ad} - {ders.course.ad}
                    </p>
                    {ders.aciklama && (
                      <p className="text-gray-300 text-sm mb-3">{ders.aciklama}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(ders.baslangicTarihi)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(ders.bitisTarihi)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {ders._count?.katilimlar || 0} katılımcı
                      </span>
                    </div>
                    {/* Ayarlar */}
                    <div className="flex gap-2 mt-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${ders.mikrofonAcik ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {ders.mikrofonAcik ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                        Mikrofon
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${ders.kameraAcik ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {ders.kameraAcik ? <Camera className="w-3 h-3" /> : <CameraOff className="w-3 h-3" />}
                        Kamera
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${ders.sohbetAcik ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        <MessageSquare className="w-3 h-3" />
                        Sohbet
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {ders.durum === 'PLANLANMIS' && (
                      <>
                        <button
                          onClick={() => handleStart(ders.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                        >
                          <Play className="w-4 h-4" />
                          Başlat
                        </button>
                        <button
                          onClick={() => editDers(ders)}
                          className="p-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-all"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleCancel(ders.id)}
                          className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {ders.durum === 'AKTIF' && (
                      <>
                        <a
                          href={`https://meet.jit.si/${ders.odaAdi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Katıl
                        </a>
                        <button
                          onClick={() => handleEnd(ders.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                        >
                          <Square className="w-4 h-4" />
                          Bitir
                        </button>
                      </>
                    )}
                    {(ders.durum === 'SONA_ERDI' || ders.durum === 'IPTAL') && (
                      <>
                        <button
                          onClick={() => viewStats(ders)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-all"
                        >
                          <BarChart3 className="w-4 h-4" />
                          İstatistik
                        </button>
                        <button
                          onClick={() => handleDelete(ders.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">
                  {editMode ? 'Canlı Dersi Düzenle' : 'Yeni Canlı Ders'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ders Başlığı
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.baslik}
                      onChange={e => setFormData({ ...formData, baslik: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder="Örn: Matematik - Türev Konusu"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Açıklama (Opsiyonel)
                    </label>
                    <textarea
                      value={formData.aciklama}
                      onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      rows={2}
                      placeholder="Ders hakkında kısa açıklama..."
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ders
                    </label>
                    <select
                      required
                      value={formData.courseId}
                      onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Ders Seçin</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.sinif.ad} - {c.ad}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Başlangıç
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.baslangicTarihi}
                      onChange={e => setFormData({ ...formData, baslangicTarihi: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bitiş
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.bitisTarihi}
                      onChange={e => setFormData({ ...formData, bitisTarihi: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Oda Şifresi (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={formData.odaSifresi}
                      onChange={e => setFormData({ ...formData, odaSifresi: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder="Derse giriş için şifre (boş bırakılabilir)"
                    />
                  </div>
                </div>

                {/* Ayarlar */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="text-white font-medium mb-4">Öğrenci İzinleri</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mikrofonAcik}
                        onChange={e => setFormData({ ...formData, mikrofonAcik: e.target.checked })}
                        className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-gray-300">Mikrofon açabilir</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.kameraAcik}
                        onChange={e => setFormData({ ...formData, kameraAcik: e.target.checked })}
                        className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-gray-300">Kamera açabilir</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sohbetAcik}
                        onChange={e => setFormData({ ...formData, sohbetAcik: e.target.checked })}
                        className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-gray-300">Sohbet kullanabilir</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.kayitYapilsin}
                        onChange={e => setFormData({ ...formData, kayitYapilsin: e.target.checked })}
                        className="w-5 h-5 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-gray-300">Dersi kaydet</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-6 py-3 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all"
                  >
                    <Save className="w-5 h-5" />
                    {editMode ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats Modal */}
        {showStatsModal && stats && selectedDers && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-semibold text-white">Katılım İstatistikleri</h2>
                  <p className="text-gray-400 text-sm">{selectedDers.baslik}</p>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                {/* Özet */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-white">{stats.toplamOgrenci}</div>
                    <div className="text-gray-400 text-sm">Toplam Öğrenci</div>
                  </div>
                  <div className="bg-green-500/20 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-400">{stats.katilanOgrenci}</div>
                    <div className="text-gray-400 text-sm">Katılan</div>
                  </div>
                  <div className="bg-purple-500/20 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400">%{stats.katilimOrani}</div>
                    <div className="text-gray-400 text-sm">Katılım Oranı</div>
                  </div>
                </div>

                {/* Katılanlar */}
                {stats.katilimlar.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Katılanlar ({stats.katilimlar.length})
                    </h3>
                    <div className="bg-white/5 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left text-gray-400 text-sm p-3">Öğrenci</th>
                            <th className="text-left text-gray-400 text-sm p-3">Giriş</th>
                            <th className="text-left text-gray-400 text-sm p-3">Çıkış</th>
                            <th className="text-left text-gray-400 text-sm p-3">Süre</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.katilimlar.map(k => (
                            <tr key={k.id} className="border-b border-white/5">
                              <td className="p-3">
                                <div className="text-white">{k.ogrenci.ad} {k.ogrenci.soyad}</div>
                                <div className="text-gray-500 text-xs">{k.ogrenci.ogrenciNo}</div>
                              </td>
                              <td className="p-3 text-gray-300 text-sm">
                                {new Date(k.girisZamani).toLocaleTimeString('tr-TR')}
                              </td>
                              <td className="p-3 text-gray-300 text-sm">
                                {k.cikisZamani ? new Date(k.cikisZamani).toLocaleTimeString('tr-TR') : '-'}
                              </td>
                              <td className="p-3 text-gray-300 text-sm">
                                {k.toplamSure ? `${k.toplamSure} dk` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Katılmayanlar */}
                {stats.katilmayanlar.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      Katılmayanlar ({stats.katilmayanlar.length})
                    </h3>
                    <div className="bg-red-500/10 rounded-xl p-4">
                      <div className="flex flex-wrap gap-2">
                        {stats.katilmayanlar.map(k => (
                          <span key={k.id} className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                            {k.ad} {k.soyad} ({k.ogrenciNo})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

