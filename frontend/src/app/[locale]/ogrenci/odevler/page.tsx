'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X,
  Calendar,
  Star,
  Upload,
  Send,
  BookOpen,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Download,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipler
interface OdevTeslim {
  id: string;
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
  };
  ogretmen: {
    id: string;
    ad: string;
    soyad: string;
  };
  teslim: OdevTeslim | null;
  gecikmisMi: boolean;
}

type FilterType = 'hepsi' | 'bekleyen' | 'teslim_edildi' | 'degerlendirildi' | 'gecikmis';

export default function OgrenciOdevlerPage() {
  // State
  const [odevler, setOdevler] = useState<Odev[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOdev, setSelectedOdev] = useState<Odev | null>(null);
  const [showTeslimModal, setShowTeslimModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterType>('hepsi');
  const [uploading, setUploading] = useState(false);

  // Teslim form state
  const [teslimData, setTeslimData] = useState({
    aciklama: '',
    dosyaUrl: ''
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
      const response = await fetch(`${API_URL}/odevler/ogrenci`, {
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

  // İlk yükleme
  useEffect(() => {
    fetchOdevler();
  }, [fetchOdevler]);

  // Ödev teslim et
  const handleTeslim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOdev) return;

    try {
      const response = await fetch(`${API_URL}/odevler/${selectedOdev.id}/teslim`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(teslimData)
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Ödev başarıyla teslim edildi!');
        setShowTeslimModal(false);
        setSelectedOdev(null);
        setTeslimData({ aciklama: '', dosyaUrl: '' });
        fetchOdevler();
      } else {
        alert(data.error || 'Ödev teslim edilemedi');
      }
    } catch (error) {
      console.error('Teslim hatası:', error);
      alert('Bir hata oluştu');
    }
  };

  // Dosya yükle
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/upload/file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTeslimData(prev => ({ ...prev, dosyaUrl: data.data.url }));
      } else {
        alert(data.error || 'Dosya yüklenemedi');
      }
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      alert('Dosya yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  // Filtreleme
  const filteredOdevler = odevler.filter(odev => {
    switch (filterStatus) {
      case 'bekleyen':
        return !odev.teslim && !odev.gecikmisMi;
      case 'teslim_edildi':
        return odev.teslim?.durum === 'TESLIM_EDILDI';
      case 'degerlendirildi':
        return odev.teslim?.durum === 'DEGERLENDIRILDI';
      case 'gecikmis':
        return odev.gecikmisMi;
      default:
        return true;
    }
  });

  // İstatistikler
  const stats = {
    toplam: odevler.length,
    bekleyen: odevler.filter(o => !o.teslim && !o.gecikmisMi).length,
    teslimEdildi: odevler.filter(o => o.teslim?.durum === 'TESLIM_EDILDI').length,
    degerlendirildi: odevler.filter(o => o.teslim?.durum === 'DEGERLENDIRILDI').length,
    gecikmis: odevler.filter(o => o.gecikmisMi).length
  };

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
    
    if (diff < 0) return { text: 'Süre doldu', color: 'text-red-600', bgColor: 'bg-red-100' };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 3) return { text: `${days} gün`, color: 'text-green-600', bgColor: 'bg-green-100' };
    if (days > 0) return { text: `${days} gün ${hours} saat`, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { text: `${hours} saat`, color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  // Durum badge'i
  const getDurumBadge = (odev: Odev) => {
    if (odev.teslim?.durum === 'DEGERLENDIRILDI') {
      return (
        <span className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm font-medium">
          <Star size={14} />
          {odev.teslim.puan}/{odev.maxPuan}
        </span>
      );
    }
    if (odev.teslim?.durum === 'TESLIM_EDILDI') {
      return (
        <span className="flex items-center gap-1 text-blue-700 bg-blue-100 px-3 py-1 rounded-full text-sm font-medium">
          <CheckCircle size={14} />
          Teslim Edildi
        </span>
      );
    }
    if (odev.gecikmisMi) {
      return (
        <span className="flex items-center gap-1 text-red-700 bg-red-100 px-3 py-1 rounded-full text-sm font-medium">
          <AlertTriangle size={14} />
          Gecikmis
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full text-sm font-medium">
        <Clock size={14} />
        Bekliyor
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/ogrenci"
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold">Ödevlerim</h1>
              <p className="text-white/70 text-sm mt-0.5">Ödevlerini takip et ve teslim et</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* İstatistikler */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <button
            onClick={() => setFilterStatus('hepsi')}
            className={`rounded-xl p-4 transition-all ${
              filterStatus === 'hepsi' 
                ? 'bg-[#00A884] text-white shadow-lg scale-105' 
                : 'bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-bold ${filterStatus === 'hepsi' ? '' : 'text-slate-800'}`}>
              {stats.toplam}
            </div>
            <div className={`text-xs sm:text-sm ${filterStatus === 'hepsi' ? 'text-white/80' : 'text-slate-500'}`}>
              Toplam
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('bekleyen')}
            className={`rounded-xl p-4 transition-all ${
              filterStatus === 'bekleyen' 
                ? 'bg-yellow-500 text-white shadow-lg scale-105' 
                : 'bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-bold ${filterStatus === 'bekleyen' ? '' : 'text-yellow-600'}`}>
              {stats.bekleyen}
            </div>
            <div className={`text-xs sm:text-sm ${filterStatus === 'bekleyen' ? 'text-white/80' : 'text-slate-500'}`}>
              Bekleyen
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('teslim_edildi')}
            className={`rounded-xl p-4 transition-all ${
              filterStatus === 'teslim_edildi' 
                ? 'bg-blue-500 text-white shadow-lg scale-105' 
                : 'bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-bold ${filterStatus === 'teslim_edildi' ? '' : 'text-blue-600'}`}>
              {stats.teslimEdildi}
            </div>
            <div className={`text-xs sm:text-sm ${filterStatus === 'teslim_edildi' ? 'text-white/80' : 'text-slate-500'}`}>
              Teslim
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('degerlendirildi')}
            className={`rounded-xl p-4 transition-all ${
              filterStatus === 'degerlendirildi' 
                ? 'bg-green-500 text-white shadow-lg scale-105' 
                : 'bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-bold ${filterStatus === 'degerlendirildi' ? '' : 'text-green-600'}`}>
              {stats.degerlendirildi}
            </div>
            <div className={`text-xs sm:text-sm ${filterStatus === 'degerlendirildi' ? 'text-white/80' : 'text-slate-500'}`}>
              Puanlı
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('gecikmis')}
            className={`rounded-xl p-4 transition-all col-span-2 sm:col-span-1 ${
              filterStatus === 'gecikmis' 
                ? 'bg-red-500 text-white shadow-lg scale-105' 
                : 'bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-bold ${filterStatus === 'gecikmis' ? '' : 'text-red-600'}`}>
              {stats.gecikmis}
            </div>
            <div className={`text-xs sm:text-sm ${filterStatus === 'gecikmis' ? 'text-white/80' : 'text-slate-500'}`}>
              Gecikmiş
            </div>
          </button>
        </div>

        {/* Ödev Listesi */}
        <div className="space-y-4">
          {filteredOdevler.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <FileText size={64} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-600">Bu kategoride ödev yok</h3>
              <p className="text-slate-400 mt-1">Farklı bir filtre seçerek diğer ödevleri görüntüleyebilirsin</p>
            </div>
          ) : (
            filteredOdevler.map((odev) => {
              const kalanSure = getKalanSure(odev.sonTeslimTarihi);
              
              return (
                <div
                  key={odev.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Üst Kısım - Ödev Bilgileri */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-[#E7FCE8] text-[#008069] rounded text-xs font-medium">
                            {odev.course.ad}
                          </span>
                          {getDurumBadge(odev)}
                        </div>
                        <h3 className="font-semibold text-slate-800 mt-2 text-lg">{odev.baslik}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {odev.ogretmen.ad} {odev.ogretmen.soyad}
                        </p>
                      </div>
                      
                      {/* Kalan Süre */}
                      <div className={`text-center px-3 py-2 rounded-lg ${kalanSure.bgColor}`}>
                        <div className={`text-lg font-bold ${kalanSure.color}`}>
                          {kalanSure.text.split(' ')[0]}
                        </div>
                        <div className={`text-xs ${kalanSure.color}`}>
                          {kalanSure.text.split(' ').slice(1).join(' ') || 'kaldı'}
                        </div>
                      </div>
                    </div>

                    {/* Açıklama */}
                    {odev.aciklama && (
                      <p className="text-slate-600 text-sm mt-3 p-3 bg-slate-50 rounded-lg">
                        {odev.aciklama}
                      </p>
                    )}

                    {/* Tarihler */}
                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Son: {formatDate(odev.sonTeslimTarihi)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={14} />
                        <span>Max: {odev.maxPuan} puan</span>
                      </div>
                    </div>
                  </div>

                  {/* Alt Kısım - Eylemler veya Sonuç */}
                  <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-100">
                    {odev.teslim?.durum === 'DEGERLENDIRILDI' ? (
                      // Değerlendirilmiş
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-green-600">
                              {odev.teslim.puan}
                            </span>
                            <span className="text-slate-400">/ {odev.maxPuan}</span>
                          </div>
                          {odev.teslim.ogretmenYorumu && (
                            <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                              <MessageSquare size={14} />
                              {odev.teslim.ogretmenYorumu}
                            </p>
                          )}
                        </div>
                        <div className="w-20 h-20">
                          <svg viewBox="0 0 36 36" className="circular-chart">
                            <path
                              className="circle-bg"
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="3"
                            />
                            <path
                              className="circle"
                              strokeDasharray={`${(odev.teslim.puan! / odev.maxPuan) * 100}, 100`}
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={odev.teslim.puan! >= odev.maxPuan * 0.7 ? '#22c55e' : odev.teslim.puan! >= odev.maxPuan * 0.5 ? '#eab308' : '#ef4444'}
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                            <text x="18" y="20.35" className="percentage" textAnchor="middle" fontSize="8" fill="#374151" fontWeight="600">
                              %{Math.round((odev.teslim.puan! / odev.maxPuan) * 100)}
                            </text>
                          </svg>
                        </div>
                      </div>
                    ) : odev.teslim?.durum === 'TESLIM_EDILDI' ? (
                      // Teslim edilmiş - Değerlendirme bekliyor
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">Teslim Edildi</p>
                            <p className="text-xs text-slate-500">
                              {formatDate(odev.teslim.teslimTarihi)}
                            </p>
                          </div>
                        </div>
                        {odev.teslim.dosyaUrl && (
                          <a
                            href={odev.teslim.dosyaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            <Download size={16} />
                            Dosyayı Gör
                          </a>
                        )}
                      </div>
                    ) : odev.gecikmisMi ? (
                      // Gecikmiş
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertTriangle size={20} className="text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-red-600">Süre Doldu</p>
                          <p className="text-xs text-slate-500">
                            Bu ödevin süresi geçti
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Teslim edilmemiş
                      <button
                        onClick={() => {
                          setSelectedOdev(odev);
                          setTeslimData({ aciklama: '', dosyaUrl: '' });
                          setShowTeslimModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-[#00A884] text-white py-3 rounded-xl font-medium hover:bg-[#008069] transition-colors"
                      >
                        <Send size={18} />
                        Teslim Et
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Teslim Modal */}
      {showTeslimModal && selectedOdev && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-[#008069] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Ödev Teslim Et</h3>
                <p className="text-white/70 text-sm">{selectedOdev.baslik}</p>
              </div>
              <button 
                onClick={() => setShowTeslimModal(false)} 
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTeslim} className="p-6 space-y-4">
              {/* Ödev Bilgisi */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#E7FCE8] rounded-xl flex items-center justify-center">
                    <BookOpen size={24} className="text-[#008069]" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{selectedOdev.course.ad}</p>
                    <p className="text-sm text-slate-500">
                      Son teslim: {formatDate(selectedOdev.sonTeslimTarihi)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dosya Yükle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dosya Yükle (Opsiyonel)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-[#00A884] hover:bg-[#E7FCE8]/50 transition-colors ${
                      teslimData.dosyaUrl ? 'border-green-500 bg-green-50' : ''
                    }`}
                  >
                    {uploading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#00A884]"></div>
                        <span className="text-slate-600">Yükleniyor...</span>
                      </div>
                    ) : teslimData.dosyaUrl ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={20} />
                        <span>Dosya yüklendi</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-slate-400" />
                        <span className="text-slate-600">Dosya seçin veya sürükleyin</span>
                      </>
                    )}
                  </label>
                </div>
                {teslimData.dosyaUrl && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <a 
                      href={teslimData.dosyaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Dosyayı önizle
                    </a>
                    <button
                      type="button"
                      onClick={() => setTeslimData(prev => ({ ...prev, dosyaUrl: '' }))}
                      className="text-red-600 hover:underline"
                    >
                      Kaldır
                    </button>
                  </div>
                )}
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Açıklama / Not (Opsiyonel)
                </label>
                <textarea
                  value={teslimData.aciklama}
                  onChange={(e) => setTeslimData(prev => ({ ...prev, aciklama: e.target.value }))}
                  placeholder="Öğretmeninize iletmek istediğiniz bir not varsa yazabilirsiniz..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A884] focus:border-transparent resize-none"
                />
              </div>

              {/* Uyarı */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 flex items-start gap-2">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Teslim ettikten sonra öğretmeniniz değerlendirmeden önce tekrar teslim edebilirsiniz.
                  </span>
                </p>
              </div>

              {/* Butonlar */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTeslimModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-[#00A884] text-white rounded-xl hover:bg-[#008069] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Teslim Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom CSS for circular chart */}
      <style jsx>{`
        .circular-chart {
          display: block;
          margin: 0 auto;
          max-width: 100%;
          max-height: 100%;
        }
        .circle {
          animation: progress 1s ease-out forwards;
        }
        @keyframes progress {
          0% {
            stroke-dasharray: 0 100;
          }
        }
      `}</style>
    </div>
  );
}

