'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  ArrowLeft,
  Download,
  MessageSquare,
  Image as ImageIcon,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipler
interface OdevSoru {
  id: string;
  soruMetni: string;
  resimUrl: string | null;
  puan: number;
  siraNo: number;
}

interface OdevSoruCevap {
  soruId: string;
  cevapMetni: string;
  resimUrl: string;
}

interface OdevTeslim {
  id: string;
  teslimTarihi: string;
  dosyaUrl: string | null;
  dosyalar: any[];
  resimler: string[];
  aciklama: string | null;
  durum: 'BEKLEMEDE' | 'TESLIM_EDILDI' | 'DEGERLENDIRILDI';
  puan: number | null;
  ogretmenYorumu: string | null;
  soruCevaplari?: OdevSoruCevap[];
}

interface Odev {
  id: string;
  baslik: string;
  aciklama: string | null;
  konuBasligi: string | null;
  icerik: string | null;
  odevTipi: 'KLASIK' | 'SORU_CEVAP' | 'DOSYA_YUKLE' | 'KARISIK';
  sonTeslimTarihi: string;
  baslangicTarihi: string | null;
  maxPuan: number;
  aktif: boolean;
  createdAt: string;
  resimler: string[];
  dosyalar: any[];
  course: {
    id: string;
    ad: string;
  };
  ogretmen: {
    id: string;
    ad: string;
    soyad: string;
  };
  sorular: OdevSoru[];
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
  const [showDetayModal, setShowDetayModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterType>('hepsi');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [expandedSoru, setExpandedSoru] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const soruImageInputRef = useRef<HTMLInputElement>(null);
  const currentSoruId = useRef<string | null>(null);

  // Teslim form state
  const [teslimData, setTeslimData] = useState({
    aciklama: '',
    dosyaUrl: '',
    dosyalar: [] as any[],
    resimler: [] as string[],
    soruCevaplari: [] as OdevSoruCevap[]
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

  // Teslim modal açıldığında soru cevaplarını hazırla
  useEffect(() => {
    if (selectedOdev && showTeslimModal) {
      const mevcutCevaplar = selectedOdev.teslim?.soruCevaplari || [];
      const soruCevaplari = selectedOdev.sorular.map(soru => {
        const mevcutCevap = mevcutCevaplar.find(c => c.soruId === soru.id);
        return {
          soruId: soru.id,
          cevapMetni: mevcutCevap?.cevapMetni || '',
          resimUrl: mevcutCevap?.resimUrl || ''
        };
      });
      setTeslimData(prev => ({ ...prev, soruCevaplari }));
    }
  }, [selectedOdev, showTeslimModal]);

  // Resim yükle
  const handleImageUpload = async (file: File, type: 'teslim' | 'soru' = 'teslim', soruId?: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resim', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/odevler/${selectedOdev?.id}/teslim/resim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        if (type === 'teslim') {
          setTeslimData(prev => ({
            ...prev,
            resimler: [...prev.resimler, data.data.url]
          }));
        } else if (soruId) {
          setTeslimData(prev => ({
            ...prev,
            soruCevaplari: prev.soruCevaplari.map(c => 
              c.soruId === soruId ? { ...c, resimUrl: data.data.url } : c
            )
          }));
        }
      } else {
        alert(data.error || 'Resim yüklenemedi');
      }
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      alert('Resim yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
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
        setTeslimData(prev => ({ 
          ...prev, 
          dosyaUrl: data.data.url,
          dosyalar: [...prev.dosyalar, { url: data.data.url, ad: file.name, boyut: file.size, tip: file.type }]
        }));
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

  // Ödev teslim et
  const handleTeslim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOdev) return;
    setProcessing(true);

    try {
      const payload = {
        aciklama: teslimData.aciklama,
        dosyaUrl: teslimData.dosyaUrl || undefined,
        dosyalar: teslimData.dosyalar.length > 0 ? teslimData.dosyalar : undefined,
        resimler: teslimData.resimler.length > 0 ? teslimData.resimler : undefined,
        soruCevaplari: teslimData.soruCevaplari.filter(c => c.cevapMetni || c.resimUrl)
      };

      const response = await fetch(`${API_URL}/odevler/${selectedOdev.id}/teslim`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Ödev başarıyla teslim edildi!');
        setShowTeslimModal(false);
        setSelectedOdev(null);
        resetTeslimForm();
        fetchOdevler();
      } else {
        alert(data.error || 'Ödev teslim edilemedi');
      }
    } catch (error) {
      console.error('Teslim hatası:', error);
      alert('Bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Form sıfırla
  const resetTeslimForm = () => {
    setTeslimData({
      aciklama: '',
      dosyaUrl: '',
      dosyalar: [],
      resimler: [],
      soruCevaplari: []
    });
  };

  // Resim sil
  const handleResimSil = (index: number) => {
    setTeslimData(prev => ({
      ...prev,
      resimler: prev.resimler.filter((_, i) => i !== index)
    }));
  };

  // Soru cevabı güncelle
  const updateSoruCevap = (soruId: string, cevapMetni: string) => {
    setTeslimData(prev => ({
      ...prev,
      soruCevaplari: prev.soruCevaplari.map(c => 
        c.soruId === soruId ? { ...c, cevapMetni } : c
      )
    }));
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
          Gecikmiş
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
                          {odev.sorular.length > 0 && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              {odev.sorular.length} Soru
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-800 mt-2 text-lg">{odev.baslik}</h3>
                        {odev.konuBasligi && (
                          <p className="text-sm text-[#008069] mt-1 font-medium">{odev.konuBasligi}</p>
                        )}
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

                    {/* Ödev Resimleri */}
                    {odev.resimler && odev.resimler.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {odev.resimler.slice(0, 3).map((resim, index) => (
                          <div
                            key={index}
                            className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80"
                            onClick={() => {
                              setPreviewImage(resim);
                              setShowPreviewModal(true);
                            }}
                          >
                            <img src={resim} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {odev.resimler.length > 3 && (
                          <div 
                            className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200"
                            onClick={() => {
                              setSelectedOdev(odev);
                              setShowDetayModal(true);
                            }}
                          >
                            <span className="text-slate-600 font-medium">+{odev.resimler.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tarihler */}
                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Son: {formatDate(odev.sonTeslimTarihi)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={14} />
                        <span>Max: {odev.maxPuan} puan</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedOdev(odev);
                          setShowDetayModal(true);
                        }}
                        className="flex items-center gap-1 text-[#008069] hover:underline"
                      >
                        <Eye size={14} />
                        Detay
                      </button>
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
                        <div className="flex gap-2">
                          {odev.teslim.resimler && odev.teslim.resimler.length > 0 && (
                            <button
                              onClick={() => {
                                setPreviewImage(odev.teslim!.resimler[0]);
                                setShowPreviewModal(true);
                              }}
                              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm"
                            >
                              <ImageIcon size={16} />
                              {odev.teslim.resimler.length} Resim
                            </button>
                          )}
                          {odev.teslim.dosyaUrl && (
                            <a
                              href={odev.teslim.dosyaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              <Download size={16} />
                              Dosya
                            </a>
                          )}
                        </div>
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
                          resetTeslimForm();
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="p-4 bg-[#008069] text-white flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-lg font-semibold">Ödev Teslim Et</h3>
                <p className="text-white/70 text-sm">{selectedOdev.baslik}</p>
              </div>
              <button 
                onClick={() => { setShowTeslimModal(false); resetTeslimForm(); }} 
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTeslim} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
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

              {/* Sorular (varsa) */}
              {selectedOdev.sorular.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                    <BookOpen size={18} />
                    Soruları Cevapla ({selectedOdev.sorular.length})
                  </h4>
                  
                  {selectedOdev.sorular.map((soru, index) => {
                    const cevap = teslimData.soruCevaplari.find(c => c.soruId === soru.id);
                    const isExpanded = expandedSoru === soru.id;
                    
                    return (
                      <div key={soru.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedSoru(isExpanded ? null : soru.id)}
                          className="w-full p-4 flex items-start justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-700">Soru {index + 1}</span>
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                {soru.puan} puan
                              </span>
                              {(cevap?.cevapMetni || cevap?.resimUrl) && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  Cevaplandı
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{soru.soruMetni}</p>
                          </div>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        
                        {isExpanded && (
                          <div className="p-4 space-y-4">
                            {/* Soru Resmi */}
                            {soru.resimUrl && (
                              <div 
                                className="cursor-pointer"
                                onClick={() => {
                                  setPreviewImage(soru.resimUrl);
                                  setShowPreviewModal(true);
                                }}
                              >
                                <img 
                                  src={soru.resimUrl} 
                                  alt="Soru" 
                                  className="max-h-48 rounded-lg hover:opacity-80 transition-opacity" 
                                />
                              </div>
                            )}
                            
                            {/* Cevap Alanı */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Cevabınız
                              </label>
                              <textarea
                                value={cevap?.cevapMetni || ''}
                                onChange={(e) => updateSoruCevap(soru.id, e.target.value)}
                                placeholder="Cevabınızı yazın..."
                                rows={4}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A884] text-slate-800 placeholder-slate-400 resize-none"
                              />
                            </div>
                            
                            {/* Cevap Resmi */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Resim Ekle (Opsiyonel - Maks 8MB)
                              </label>
                              {cevap?.resimUrl ? (
                                <div className="relative w-32 h-32">
                                  <img 
                                    src={cevap.resimUrl} 
                                    alt="Cevap" 
                                    className="w-full h-full object-cover rounded-lg" 
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTeslimData(prev => ({
                                        ...prev,
                                        soruCevaplari: prev.soruCevaplari.map(c =>
                                          c.soruId === soru.id ? { ...c, resimUrl: '' } : c
                                        )
                                      }));
                                    }}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    currentSoruId.current = soru.id;
                                    soruImageInputRef.current?.click();
                                  }}
                                  disabled={uploading}
                                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg hover:border-[#00A884] transition-colors"
                                >
                                  {uploading && currentSoruId.current === soru.id ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#00A884]" />
                                  ) : (
                                    <ImageIcon size={18} className="text-slate-400" />
                                  )}
                                  <span className="text-slate-600">Resim Yükle</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Resim Yükle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Resim Ekle (Maks 8MB)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {teslimData.resimler.map((resim, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                      <img src={resim} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleResimSil(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center hover:border-[#00A884] transition-colors"
                  >
                    {uploading && !currentSoruId.current ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00A884]" />
                    ) : (
                      <>
                        <ImageIcon size={24} className="text-slate-400" />
                        <span className="text-xs text-slate-400 mt-1">Ekle</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dosya Yükle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dosya Yükle (Opsiyonel)
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-[#00A884] hover:bg-[#E7FCE8]/50 transition-colors ${
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
                        <span className="text-slate-600">Dosya seçin</span>
                      </>
                    )}
                  </button>
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
                      onClick={() => setTeslimData(prev => ({ ...prev, dosyaUrl: '', dosyalar: [] }))}
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
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A884] text-slate-800 placeholder-slate-400 resize-none"
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
                  onClick={() => { setShowTeslimModal(false); resetTeslimForm(); }}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={processing || uploading}
                  className="flex-1 px-4 py-3 bg-[#00A884] text-white rounded-xl hover:bg-[#008069] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Teslim Et
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Hidden inputs for image upload */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, 'teslim');
                e.target.value = '';
              }}
            />
            <input
              ref={soruImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && currentSoruId.current) {
                  handleImageUpload(file, 'soru', currentSoruId.current);
                }
                e.target.value = '';
                currentSoruId.current = null;
              }}
            />
          </div>
        </div>
      )}

      {/* Detay Modal */}
      {showDetayModal && selectedOdev && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="p-4 bg-[#008069] text-white flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-lg font-semibold">{selectedOdev.baslik}</h3>
                <p className="text-white/70 text-sm">{selectedOdev.course.ad}</p>
              </div>
              <button 
                onClick={() => setShowDetayModal(false)} 
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Konu Başlığı */}
              {selectedOdev.konuBasligi && (
                <div className="p-4 bg-[#E7FCE8] rounded-xl">
                  <h4 className="font-semibold text-[#008069]">{selectedOdev.konuBasligi}</h4>
                </div>
              )}

              {/* Açıklama */}
              {selectedOdev.aciklama && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Açıklama</h4>
                  <p className="text-slate-600">{selectedOdev.aciklama}</p>
                </div>
              )}

              {/* İçerik */}
              {selectedOdev.icerik && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">İçerik</h4>
                  <div 
                    className="text-slate-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedOdev.icerik }}
                  />
                </div>
              )}

              {/* Resimler */}
              {selectedOdev.resimler && selectedOdev.resimler.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Ekler</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedOdev.resimler.map((resim, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80"
                        onClick={() => {
                          setPreviewImage(resim);
                          setShowPreviewModal(true);
                        }}
                      >
                        <img src={resim} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sorular */}
              {selectedOdev.sorular.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-3">Sorular ({selectedOdev.sorular.length})</h4>
                  <div className="space-y-3">
                    {selectedOdev.sorular.map((soru, index) => (
                      <div key={soru.id} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-slate-700">Soru {index + 1}</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            {soru.puan} puan
                          </span>
                        </div>
                        <p className="text-slate-600 mt-2">{soru.soruMetni}</p>
                        {soru.resimUrl && (
                          <img
                            src={soru.resimUrl}
                            alt=""
                            className="mt-3 max-h-48 rounded-lg cursor-pointer hover:opacity-80"
                            onClick={() => {
                              setPreviewImage(soru.resimUrl);
                              setShowPreviewModal(true);
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarih Bilgileri */}
              <div className="flex items-center gap-4 text-sm text-slate-500 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Son: {formatDate(selectedOdev.sonTeslimTarihi)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={14} />
                  <span>Max: {selectedOdev.maxPuan} puan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resim Önizleme Modal */}
      {showPreviewModal && previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={previewImage} 
              alt="Önizleme" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute -top-4 -right-4 p-2 bg-white rounded-full shadow-lg hover:bg-slate-100"
            >
              <X size={24} className="text-slate-600" />
            </button>
            <a
              href={previewImage}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-slate-100"
            >
              <Download size={18} />
              İndir
            </a>
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
