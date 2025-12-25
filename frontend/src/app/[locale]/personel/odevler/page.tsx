'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MoreVertical,
  X,
  Calendar,
  Users,
  BookOpen,
  ChevronRight,
  Upload,
  Star,
  MessageSquare
} from 'lucide-react';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipler
interface Course {
  id: string;
  ad: string;
  sinif: {
    id: string;
    ad: string;
    seviye: number;
  };
}

interface OdevTeslim {
  id: string;
  ogrenci: {
    id: string;
    ad: string;
    soyad: string;
    ogrenciNo: string | null;
  };
  teslimTarihi: string;
  dosyaUrl: string | null;
  aciklama: string | null;
  durum: 'BEKLEMEDE' | 'TESLIM_EDILDI' | 'DEGERLENDIRILDI';
  puan: number | null;
  ogretmenYorumu: string | null;
}

interface Odev {
  id: string;
  baslik: string;
  aciklama: string | null;
  sonTeslimTarihi: string;
  maxPuan: number;
  aktif: boolean;
  createdAt: string;
  course: {
    id: string;
    ad: string;
    sinif: {
      id: string;
      ad: string;
    };
  };
  teslimler: OdevTeslim[];
  stats: {
    toplamOgrenci: number;
    teslimEdilen: number;
    degerlendirilen: number;
    bekleyen: number;
  };
}

export default function OgretmenOdevlerPage() {
  // State
  const [odevler, setOdevler] = useState<Odev[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOdev, setSelectedOdev] = useState<Odev | null>(null);
  const [showYeniOdevModal, setShowYeniOdevModal] = useState(false);
  const [showDegerlendirModal, setShowDegerlendirModal] = useState(false);
  const [selectedTeslim, setSelectedTeslim] = useState<OdevTeslim | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'hepsi' | 'aktif' | 'gecmis'>('hepsi');

  // Yeni ödev form state
  const [yeniOdev, setYeniOdev] = useState({
    baslik: '',
    aciklama: '',
    courseId: '',
    sonTeslimTarihi: '',
    maxPuan: 100
  });

  // Değerlendirme state
  const [degerlendirme, setDegerlendirme] = useState({
    puan: 0,
    yorum: ''
  });

  // Token al
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Ödevleri getir
  const fetchOdevler = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/odevler/ogretmen`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setOdevler(data.data);
      }
    } catch (error) {
      console.error('Ödevler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Dersleri getir
  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/odevler/ogretmen/dersler`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error('Dersler yüklenemedi:', error);
    }
  }, [getAuthHeaders]);

  // İlk yükleme
  useEffect(() => {
    fetchOdevler();
    fetchCourses();
  }, [fetchOdevler, fetchCourses]);

  // Yeni ödev oluştur
  const handleYeniOdev = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/odevler`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(yeniOdev)
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Ödev başarıyla oluşturuldu!');
        setShowYeniOdevModal(false);
        setYeniOdev({ baslik: '', aciklama: '', courseId: '', sonTeslimTarihi: '', maxPuan: 100 });
        fetchOdevler();
      } else {
        alert(data.error || 'Ödev oluşturulamadı');
      }
    } catch (error) {
      console.error('Ödev oluşturma hatası:', error);
      alert('Bir hata oluştu');
    }
  };

  // Ödev değerlendir
  const handleDegerlendir = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeslim) return;

    try {
      const response = await fetch(`${API_URL}/odevler/teslim/${selectedTeslim.id}/degerlendir`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          puan: degerlendirme.puan,
          ogretmenYorumu: degerlendirme.yorum
        })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Ödev değerlendirildi!');
        setShowDegerlendirModal(false);
        setSelectedTeslim(null);
        setDegerlendirme({ puan: 0, yorum: '' });
        fetchOdevler();
        
        // Seçili ödevi güncelle
        if (selectedOdev) {
          const updatedOdevler = odevler.map(o => 
            o.id === selectedOdev.id 
              ? { ...o, teslimler: o.teslimler.map(t => t.id === selectedTeslim.id ? data.data : t) }
              : o
          );
          setOdevler(updatedOdevler);
          const updatedOdev = updatedOdevler.find(o => o.id === selectedOdev.id);
          if (updatedOdev) setSelectedOdev(updatedOdev);
        }
      } else {
        alert(data.error || 'Değerlendirme yapılamadı');
      }
    } catch (error) {
      console.error('Değerlendirme hatası:', error);
      alert('Bir hata oluştu');
    }
  };

  // Filtreleme
  const filteredOdevler = odevler.filter(odev => {
    // Arama
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      if (!odev.baslik.toLowerCase().includes(search) && 
          !odev.course.ad.toLowerCase().includes(search)) {
        return false;
      }
    }

    // Durum filtresi
    const now = new Date();
    const sonTeslim = new Date(odev.sonTeslimTarihi);
    
    if (filterStatus === 'aktif' && sonTeslim < now) return false;
    if (filterStatus === 'gecmis' && sonTeslim >= now) return false;

    return true;
  });

  // Tarih formatla
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Kalan süre
  const getKalanSure = (sonTeslim: string) => {
    const now = new Date();
    const tarih = new Date(sonTeslim);
    const diff = tarih.getTime() - now.getTime();
    
    if (diff < 0) return { text: 'Süre doldu', color: 'text-red-600' };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 3) return { text: `${days} gün`, color: 'text-green-600' };
    if (days > 0) return { text: `${days} gün ${hours} saat`, color: 'text-yellow-600' };
    return { text: `${hours} saat`, color: 'text-red-600' };
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
      <div className="bg-[#008069] text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Ödevler</h1>
            <p className="text-white/70 text-sm mt-1">Ödev oluştur ve değerlendir</p>
          </div>
          <button
            onClick={() => setShowYeniOdevModal(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Yeni Ödev</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filtreler */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Arama */}
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ödev veya ders ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884]"
              />
            </div>

            {/* Durum filtresi */}
            <div className="flex gap-2">
              {(['hepsi', 'aktif', 'gecmis'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-[#00A884] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'hepsi' ? 'Tümü' : status === 'aktif' ? 'Aktif' : 'Geçmiş'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{odevler.length}</p>
              <p className="text-sm text-slate-500">Toplam Ödev</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Clock size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {odevler.filter(o => new Date(o.sonTeslimTarihi) > new Date()).length}
              </p>
              <p className="text-sm text-slate-500">Aktif Ödev</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {odevler.reduce((acc, o) => acc + o.stats.bekleyen, 0)}
              </p>
              <p className="text-sm text-slate-500">Bekleyen Teslim</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <CheckCircle size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {odevler.reduce((acc, o) => acc + o.stats.degerlendirilen, 0)}
              </p>
              <p className="text-sm text-slate-500">Değerlendirilen</p>
            </div>
          </div>
        </div>

        {/* Ana içerik */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ödev Listesi */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Ödev Listesi</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredOdevler.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <FileText size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Ödev bulunamadı</p>
                </div>
              ) : (
                filteredOdevler.map((odev) => {
                  const kalanSure = getKalanSure(odev.sonTeslimTarihi);
                  const isSelected = selectedOdev?.id === odev.id;

                  return (
                    <button
                      key={odev.id}
                      onClick={() => setSelectedOdev(odev)}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-[#E7FCE8]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-800 truncate">{odev.baslik}</h3>
                          <p className="text-sm text-slate-500 truncate">{odev.course.ad} - {odev.course.sinif.ad}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs ${kalanSure.color}`}>{kalanSure.text}</span>
                            <span className="text-xs text-slate-400">
                              {odev.stats.teslimEdilen}/{odev.stats.toplamOgrenci} teslim
                            </span>
                          </div>
                        </div>
                        {odev.stats.bekleyen > 0 && (
                          <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                            {odev.stats.bekleyen} bekliyor
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Ödev Detay */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
            {selectedOdev ? (
              <>
                {/* Ödev Başlık */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-[#00A884] to-[#008069]">
                  <h2 className="text-xl font-semibold text-white">{selectedOdev.baslik}</h2>
                  <p className="text-white/70 mt-1">{selectedOdev.course.ad} - {selectedOdev.course.sinif.ad}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-white/80">
                      <Calendar size={16} />
                      <span className="text-sm">Son Teslim: {formatDate(selectedOdev.sonTeslimTarihi)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Star size={16} />
                      <span className="text-sm">Max: {selectedOdev.maxPuan} puan</span>
                    </div>
                  </div>
                </div>

                {/* Açıklama */}
                {selectedOdev.aciklama && (
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <p className="text-slate-600 text-sm">{selectedOdev.aciklama}</p>
                  </div>
                )}

                {/* Teslimler */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Users size={18} />
                    Teslimler ({selectedOdev.teslimler.length})
                  </h3>

                  {selectedOdev.teslimler.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FileText size={48} className="mx-auto mb-3 opacity-50" />
                      <p>Henüz teslim yok</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {selectedOdev.teslimler.map((teslim) => (
                        <div
                          key={teslim.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#00A884] rounded-full flex items-center justify-center text-white font-medium">
                              {teslim.ogrenci.ad.charAt(0)}{teslim.ogrenci.soyad.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {teslim.ogrenci.ad} {teslim.ogrenci.soyad}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatDate(teslim.teslimTarihi)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {teslim.durum === 'DEGERLENDIRILDI' ? (
                              <span className="flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">
                                <CheckCircle size={14} />
                                {teslim.puan}/{selectedOdev.maxPuan}
                              </span>
                            ) : teslim.durum === 'TESLIM_EDILDI' ? (
                              <button
                                onClick={() => {
                                  setSelectedTeslim(teslim);
                                  setDegerlendirme({ puan: 0, yorum: '' });
                                  setShowDegerlendirModal(true);
                                }}
                                className="flex items-center gap-1 bg-[#00A884] text-white px-3 py-1 rounded-full text-sm hover:bg-[#008069] transition-colors"
                              >
                                <Star size={14} />
                                Değerlendir
                              </button>
                            ) : (
                              <span className="text-slate-400 text-sm">Bekliyor</span>
                            )}

                            {teslim.dosyaUrl && (
                              <a
                                href={teslim.dosyaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                <Upload size={18} className="text-slate-600" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-slate-500">
                <FileText size={64} className="mb-4 opacity-50" />
                <p>Detayları görmek için bir ödev seçin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yeni Ödev Modal */}
      {showYeniOdevModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-[#008069] text-white flex items-center justify-between">
              <h3 className="text-lg font-semibold">Yeni Ödev Oluştur</h3>
              <button onClick={() => setShowYeniOdevModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleYeniOdev} className="p-6 space-y-4">
              {/* Ders Seçimi */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ders</label>
                <select
                  value={yeniOdev.courseId}
                  onChange={(e) => setYeniOdev({ ...yeniOdev, courseId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884]"
                >
                  <option value="">Ders seçin...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.ad} - {course.sinif.ad}
                    </option>
                  ))}
                </select>
              </div>

              {/* Başlık */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ödev Başlığı</label>
                <input
                  type="text"
                  value={yeniOdev.baslik}
                  onChange={(e) => setYeniOdev({ ...yeniOdev, baslik: e.target.value })}
                  required
                  placeholder="Örn: 1. Ünite Değerlendirme"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884]"
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama (Opsiyonel)</label>
                <textarea
                  value={yeniOdev.aciklama}
                  onChange={(e) => setYeniOdev({ ...yeniOdev, aciklama: e.target.value })}
                  placeholder="Ödev hakkında detaylı bilgi..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884] resize-none"
                />
              </div>

              {/* Son Teslim & Max Puan */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Son Teslim Tarihi</label>
                  <input
                    type="datetime-local"
                    value={yeniOdev.sonTeslimTarihi}
                    onChange={(e) => setYeniOdev({ ...yeniOdev, sonTeslimTarihi: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Maksimum Puan</label>
                  <input
                    type="number"
                    value={yeniOdev.maxPuan}
                    onChange={(e) => setYeniOdev({ ...yeniOdev, maxPuan: parseInt(e.target.value) || 100 })}
                    min={1}
                    max={1000}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884]"
                  />
                </div>
              </div>

              {/* Butonlar */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowYeniOdevModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#00A884] text-white rounded-lg hover:bg-[#008069] font-medium"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Değerlendirme Modal */}
      {showDegerlendirModal && selectedTeslim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 bg-[#008069] text-white flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ödev Değerlendir</h3>
              <button onClick={() => setShowDegerlendirModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDegerlendir} className="p-6 space-y-4">
              {/* Öğrenci Bilgisi */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#00A884] rounded-full flex items-center justify-center text-white font-bold">
                    {selectedTeslim.ogrenci.ad.charAt(0)}{selectedTeslim.ogrenci.soyad.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {selectedTeslim.ogrenci.ad} {selectedTeslim.ogrenci.soyad}
                    </p>
                    <p className="text-sm text-slate-500">
                      Teslim: {formatDate(selectedTeslim.teslimTarihi)}
                    </p>
                  </div>
                </div>
                {selectedTeslim.aciklama && (
                  <div className="mt-3 p-3 bg-white rounded border border-slate-200">
                    <p className="text-sm text-slate-600">{selectedTeslim.aciklama}</p>
                  </div>
                )}
              </div>

              {/* Puan */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Puan (Max: {selectedOdev?.maxPuan})
                </label>
                <input
                  type="number"
                  value={degerlendirme.puan}
                  onChange={(e) => setDegerlendirme({ ...degerlendirme, puan: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={selectedOdev?.maxPuan || 100}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884] text-2xl font-bold text-center"
                />
                {/* Puan slider */}
                <input
                  type="range"
                  value={degerlendirme.puan}
                  onChange={(e) => setDegerlendirme({ ...degerlendirme, puan: parseInt(e.target.value) })}
                  min={0}
                  max={selectedOdev?.maxPuan || 100}
                  className="w-full mt-2 accent-[#00A884]"
                />
              </div>

              {/* Yorum */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yorum (Opsiyonel)</label>
                <textarea
                  value={degerlendirme.yorum}
                  onChange={(e) => setDegerlendirme({ ...degerlendirme, yorum: e.target.value })}
                  placeholder="Öğrenciye geri bildirim..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A884] resize-none"
                />
              </div>

              {/* Butonlar */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDegerlendirModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#00A884] text-white rounded-lg hover:bg-[#008069] font-medium"
                >
                  Değerlendir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

