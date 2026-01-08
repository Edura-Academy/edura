'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

interface Course {
  id: string;
  ad: string;
  sinif: {
    ad: string;
  };
}

interface Sinif {
  id: string;
  ad: string;
  seviye: number;
}

interface OgretmenBilgi {
  ad: string;
  soyad: string;
  brans?: string;
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

function OgretmenCanliDersContent() {
  const [dersler, setDersler] = useState<CanliDers[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [ogretmenBilgi, setOgretmenBilgi] = useState<OgretmenBilgi | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedDers, setSelectedDers] = useState<CanliDers | null>(null);
  const [stats, setStats] = useState<KatilimIstatistik | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    baslik: '',
    aciklama: '',
    courseId: '',
    hedefSiniflar: [] as string[],
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
    fetchSiniflar();
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
      setDersler(Array.isArray(data) ? data : []);
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
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Dersler alınamadı:', error);
    }
  };

  const fetchSiniflar = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/canli-ders/ogretmen/siniflar`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.siniflar) {
        setSiniflar(data.siniflar);
      }
      if (data.ogretmen) {
        setOgretmenBilgi(data.ogretmen);
      }
    } catch (error) {
      console.error('Sınıflar alınamadı:', error);
    }
  };

  const toggleSinifSecimi = (sinifId: string) => {
    setFormData(prev => ({
      ...prev,
      hedefSiniflar: prev.hedefSiniflar.includes(sinifId)
        ? prev.hedefSiniflar.filter(id => id !== sinifId)
        : [...prev.hedefSiniflar, sinifId]
    }));
  };

  const tumSiniflariSec = () => {
    if (formData.hedefSiniflar.length === siniflar.length) {
      setFormData(prev => ({ ...prev, hedefSiniflar: [] }));
    } else {
      setFormData(prev => ({ ...prev, hedefSiniflar: siniflar.map(s => s.id) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hedef sınıf kontrolü
    if (formData.hedefSiniflar.length === 0) {
      alert('Lütfen en az bir hedef sınıf seçin');
      return;
    }

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
        const result = await res.json();
        setShowModal(false);
        resetForm();
        fetchDersler();
        
        // Başarı mesajı göster
        if (result.hedefOgrenciSayisi) {
          alert(`Canlı ders başarıyla oluşturuldu! ${result.hedefOgrenciSayisi} öğrenciye bildirim gönderildi.`);
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('İşlem hatası:', error);
      alert('Bir hata oluştu');
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
    // Course'un sınıfını bul ve hedefSiniflar'a ekle
    const course = courses.find(c => c.id === ders.courseId);
    const sinifId = course ? siniflar.find(s => s.ad === course.sinif.ad)?.id : undefined;
    
    setFormData({
      baslik: ders.baslik,
      aciklama: ders.aciklama || '',
      courseId: ders.courseId,
      hedefSiniflar: sinifId ? [sinifId] : [],
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
      hedefSiniflar: [],
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
      SONA_ERDI: { bg: 'bg-slate-100', text: 'text-slate-800', icon: <CheckCircle className="w-3 h-3" /> },
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/ogretmen" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold">Canlı Dersler</h1>
                <p className="text-red-100 text-sm">Video konferans ile canlı ders yapın</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Yeni Canlı Ders
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
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
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === f.value
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={fetchDersler}
            className="ml-auto p-2 bg-white text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Ders Listesi */}
        {dersler.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Video className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Henüz canlı ders yok</h3>
            <p className="text-slate-500">Yeni bir canlı ders oluşturarak başlayın</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {dersler.map(ders => (
              <div
                key={ders.id}
                className={`bg-white rounded-xl shadow-sm p-6 border transition-all ${
                  ders.durum === 'AKTIF' ? 'border-green-400 shadow-green-100 shadow-lg' : 'border-slate-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-slate-800">{ders.baslik}</h3>
                      {getDurumBadge(ders.durum)}
                      {ders.durum === 'AKTIF' && (
                        <span className="flex items-center gap-1 text-red-600 text-sm animate-pulse">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          CANLI
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 mb-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        <Users className="w-3 h-3" />
                        {ders.course.sinif.ad}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span>{ders.course.ad}</span>
                    </p>
                    {ders.aciklama && (
                      <p className="text-slate-600 text-sm mb-3">{ders.aciklama}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
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
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${ders.mikrofonAcik ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {ders.mikrofonAcik ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                        Mikrofon
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${ders.kameraAcik ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {ders.kameraAcik ? <Camera className="w-3 h-3" /> : <CameraOff className="w-3 h-3" />}
                        Kamera
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${ders.sohbetAcik ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Başlat
                        </button>
                        <button
                          onClick={() => editDers(ders)}
                          className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleCancel(ders.id)}
                          className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
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
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Katıl
                        </a>
                        <button
                          onClick={() => handleEnd(ders.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <BarChart3 className="w-4 h-4" />
                          İstatistik
                        </button>
                        <button
                          onClick={() => handleDelete(ders.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-semibold text-slate-800">
                  {editMode ? 'Canlı Dersi Düzenle' : 'Yeni Canlı Ders'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Öğretmen Branş Bilgisi */}
                {ogretmenBilgi && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Video className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-slate-800 font-medium">{ogretmenBilgi.ad} {ogretmenBilgi.soyad}</p>
                        <p className="text-sm text-red-600">{ogretmenBilgi.brans || 'Branş Belirtilmemiş'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ders Başlığı
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.baslik}
                      onChange={e => setFormData({ ...formData, baslik: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Örn: Türev Konusu - Çözümlü Sorular"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Açıklama (Opsiyonel)
                    </label>
                    <textarea
                      value={formData.aciklama}
                      onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={2}
                      placeholder="Ders hakkında kısa açıklama..."
                    />
                  </div>

                  {/* Hedef Sınıf Seçimi */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Hedef Sınıflar *
                      </label>
                      <button
                        type="button"
                        onClick={tumSiniflariSec}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        {formData.hedefSiniflar.length === siniflar.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                      </button>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto">
                      {siniflar.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-2">Sınıf bulunamadı</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {siniflar.map(sinif => (
                            <label
                              key={sinif.id}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                formData.hedefSiniflar.includes(sinif.id)
                                  ? 'bg-red-100 border-red-300 border'
                                  : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.hedefSiniflar.includes(sinif.id)}
                                onChange={() => toggleSinifSecimi(sinif.id)}
                                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                              />
                              <span className={`text-sm ${formData.hedefSiniflar.includes(sinif.id) ? 'text-red-800 font-medium' : 'text-slate-700'}`}>
                                {sinif.ad}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.hedefSiniflar.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        {formData.hedefSiniflar.length} sınıf seçildi - Bu sınıflardaki tüm öğrencilere bildirim gönderilecek
                      </p>
                    )}
                    {formData.hedefSiniflar.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        En az bir sınıf seçmelisiniz
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Başlangıç
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.baslangicTarihi}
                      onChange={e => setFormData({ ...formData, baslangicTarihi: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bitiş
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.bitisTarihi}
                      onChange={e => setFormData({ ...formData, bitisTarihi: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Oda Şifresi (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={formData.odaSifresi}
                      onChange={e => setFormData({ ...formData, odaSifresi: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Derse giriş için şifre (boş bırakılabilir)"
                    />
                  </div>
                </div>

                {/* Ayarlar */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="text-slate-800 font-medium mb-4">Öğrenci İzinleri</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mikrofonAcik}
                        onChange={e => setFormData({ ...formData, mikrofonAcik: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-slate-700">Mikrofon açabilir</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.kameraAcik}
                        onChange={e => setFormData({ ...formData, kameraAcik: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-slate-700">Kamera açabilir</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sohbetAcik}
                        onChange={e => setFormData({ ...formData, sohbetAcik: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-slate-700">Sohbet kullanabilir</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.kayitYapilsin}
                        onChange={e => setFormData({ ...formData, kayitYapilsin: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-slate-700">Dersi kaydet</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Katılım İstatistikleri</h2>
                  <p className="text-slate-500 text-sm">{selectedDers.baslik}</p>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6">
                {/* Özet */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-slate-800">{stats.toplamOgrenci}</div>
                    <div className="text-slate-500 text-sm">Toplam Öğrenci</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.katilanOgrenci}</div>
                    <div className="text-slate-500 text-sm">Katılan</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">%{stats.katilimOrani}</div>
                    <div className="text-slate-500 text-sm">Katılım Oranı</div>
                  </div>
                </div>

                {/* Katılanlar */}
                {stats.katilimlar.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-slate-800 font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Katılanlar ({stats.katilimlar.length})
                    </h3>
                    <div className="bg-slate-50 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left text-slate-500 text-sm p-3">Öğrenci</th>
                            <th className="text-left text-slate-500 text-sm p-3">Giriş</th>
                            <th className="text-left text-slate-500 text-sm p-3">Çıkış</th>
                            <th className="text-left text-slate-500 text-sm p-3">Süre</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.katilimlar.map(k => (
                            <tr key={k.id} className="border-b border-slate-100">
                              <td className="p-3">
                                <div className="text-slate-800">{k.ogrenci.ad} {k.ogrenci.soyad}</div>
                                <div className="text-slate-400 text-xs">{k.ogrenci.ogrenciNo}</div>
                              </td>
                              <td className="p-3 text-slate-600 text-sm">
                                {new Date(k.girisZamani).toLocaleTimeString('tr-TR')}
                              </td>
                              <td className="p-3 text-slate-600 text-sm">
                                {k.cikisZamani ? new Date(k.cikisZamani).toLocaleTimeString('tr-TR') : '-'}
                              </td>
                              <td className="p-3 text-slate-600 text-sm">
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
                    <h3 className="text-slate-800 font-medium mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      Katılmayanlar ({stats.katilmayanlar.length})
                    </h3>
                    <div className="bg-red-50 rounded-xl p-4">
                      <div className="flex flex-wrap gap-2">
                        {stats.katilmayanlar.map(k => (
                          <span key={k.id} className="px-3 py-1 bg-white rounded-full text-sm text-slate-700">
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

export default function OgretmenCanliDersPage() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <OgretmenCanliDersContent />
    </RoleGuard>
  );
}
