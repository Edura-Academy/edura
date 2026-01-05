'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X,
  Calendar,
  Users,
  Star,
  Upload,
  ArrowLeft,
  Image as ImageIcon,
  Trash2,
  Eye,
  Download,
  MessageSquare,
  BookOpen,
  Target,
  Edit,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/RoleGuard';

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

interface Sinif {
  id: string;
  ad: string;
  seviye: number;
}

interface OdevSoru {
  id: string;
  soruMetni: string;
  resimUrl: string | null;
  puan: number;
  siraNo: number;
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
  dosyalar: any[];
  resimler: string[];
  aciklama: string | null;
  durum: 'BEKLEMEDE' | 'TESLIM_EDILDI' | 'DEGERLENDIRILDI';
  puan: number | null;
  ogretmenYorumu: string | null;
  soruCevaplari?: any[];
}

interface Odev {
  id: string;
  baslik: string;
  aciklama: string | null;
  konuBasligi: string | null;
  icerik: string | null;
  odevTipi: 'KLASIK' | 'SORU_CEVAP' | 'DOSYA_YUKLE' | 'KARISIK';
  baslangicTarihi: string | null;
  sonTeslimTarihi: string;
  maxPuan: number;
  aktif: boolean;
  createdAt: string;
  resimler: string[];
  dosyalar: any[];
  course: {
    id: string;
    ad: string;
    sinif: {
      id: string;
      ad: string;
    };
  } | null;
  sorular: OdevSoru[];
  teslimler: OdevTeslim[];
  stats: {
    toplamOgrenci: number;
    teslimEdilen: number;
    degerlendirilen: number;
    bekleyen: number;
  };
}

// Ödev Tipi seçenekleri
const ODEV_TIPLERI = [
  { value: 'KARISIK', label: 'Karışık (Hepsi)', description: 'Metin, soru ve dosya yükleme' },
  { value: 'KLASIK', label: 'Klasik', description: 'Sadece metin tabanlı' },
  { value: 'SORU_CEVAP', label: 'Soru-Cevap', description: 'Klasik sorular' },
  { value: 'DOSYA_YUKLE', label: 'Dosya Yükle', description: 'Öğrenci dosya yükler' },
];

function OgretmenOdevlerContent() {
  // State
  const [odevler, setOdevler] = useState<Odev[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOdev, setSelectedOdev] = useState<Odev | null>(null);
  const [showYeniOdevModal, setShowYeniOdevModal] = useState(false);
  const [showDegerlendirModal, setShowDegerlendirModal] = useState(false);
  const [selectedTeslim, setSelectedTeslim] = useState<OdevTeslim | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'hepsi' | 'aktif' | 'gecmis'>('hepsi');
  const [processing, setProcessing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showSoruEkle, setShowSoruEkle] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const soruResimInputRef = useRef<HTMLInputElement>(null);

  // Yeni ödev form state
  const [yeniOdev, setYeniOdev] = useState({
    baslik: '',
    aciklama: '',
    konuBasligi: '',
    icerik: '',
    courseId: '',
    hedefSiniflar: [] as string[],
    baslangicTarihi: '',
    sonTeslimTarihi: '',
    maxPuan: 100,
    odevTipi: 'KARISIK' as const,
    resimler: [] as string[],
    dosyalar: [] as any[],
    sorular: [] as { soruMetni: string; resimUrl?: string; puan: number }[]
  });

  // Yeni soru state
  const [yeniSoru, setYeniSoru] = useState({
    soruMetni: '',
    resimUrl: '',
    puan: 10
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

  // Sınıfları getir
  const fetchSiniflar = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/odevler/ogretmen/siniflar`, {
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

  // İlk yükleme
  useEffect(() => {
    fetchOdevler();
    fetchCourses();
    fetchSiniflar();
  }, [fetchOdevler, fetchCourses, fetchSiniflar]);

  // Resim yükle
  const handleImageUpload = async (file: File, type: 'odev' | 'soru' = 'odev') => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('resim', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/odevler/new/resim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        if (type === 'odev') {
          setYeniOdev(prev => ({
            ...prev,
            resimler: [...prev.resimler, data.data.url]
          }));
        } else {
          setYeniSoru(prev => ({
            ...prev,
            resimUrl: data.data.url
          }));
        }
      } else {
        alert(data.error || 'Resim yüklenemedi');
      }
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      alert('Resim yüklenirken bir hata oluştu');
    } finally {
      setUploadingImage(false);
    }
  };

  // Yeni ödev oluştur
  const handleYeniOdev = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      const payload = {
        ...yeniOdev,
        hedefSiniflar: yeniOdev.hedefSiniflar.length > 0 ? yeniOdev.hedefSiniflar : undefined,
        courseId: yeniOdev.courseId || undefined,
        baslangicTarihi: yeniOdev.baslangicTarihi || undefined,
        konuBasligi: yeniOdev.konuBasligi || undefined,
        icerik: yeniOdev.icerik || undefined,
        resimler: yeniOdev.resimler.length > 0 ? yeniOdev.resimler : undefined,
        dosyalar: yeniOdev.dosyalar.length > 0 ? yeniOdev.dosyalar : undefined,
        sorular: yeniOdev.sorular.length > 0 ? yeniOdev.sorular : undefined
      };

      const response = await fetch(`${API_URL}/odevler`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Ödev başarıyla oluşturuldu!');
        setShowYeniOdevModal(false);
        resetYeniOdevForm();
        fetchOdevler();
      } else {
        alert(data.error || 'Ödev oluşturulamadı');
      }
    } catch (error) {
      console.error('Ödev oluşturma hatası:', error);
      alert('Bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Form sıfırla
  const resetYeniOdevForm = () => {
    setYeniOdev({
      baslik: '',
      aciklama: '',
      konuBasligi: '',
      icerik: '',
      courseId: '',
      hedefSiniflar: [],
      baslangicTarihi: '',
      sonTeslimTarihi: '',
      maxPuan: 100,
      odevTipi: 'KARISIK',
      resimler: [],
      dosyalar: [],
      sorular: []
    });
    setYeniSoru({ soruMetni: '', resimUrl: '', puan: 10 });
    setShowSoruEkle(false);
  };

  // Soru ekle
  const handleSoruEkle = () => {
    if (!yeniSoru.soruMetni.trim()) {
      alert('Soru metni gerekli');
      return;
    }
    setYeniOdev(prev => ({
      ...prev,
      sorular: [...prev.sorular, { ...yeniSoru }]
    }));
    setYeniSoru({ soruMetni: '', resimUrl: '', puan: 10 });
  };

  // Soru sil
  const handleSoruSil = (index: number) => {
    setYeniOdev(prev => ({
      ...prev,
      sorular: prev.sorular.filter((_, i) => i !== index)
    }));
  };

  // Resim sil
  const handleResimSil = (index: number) => {
    setYeniOdev(prev => ({
      ...prev,
      resimler: prev.resimler.filter((_, i) => i !== index)
    }));
  };

  // Ödev değerlendir
  const handleDegerlendir = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    
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
    } finally {
      setProcessing(false);
    }
  };

  // Hedef sınıf toggle
  const toggleHedefSinif = (sinifId: string) => {
    setYeniOdev(prev => ({
      ...prev,
      hedefSiniflar: prev.hedefSiniflar.includes(sinifId)
        ? prev.hedefSiniflar.filter(id => id !== sinifId)
        : [...prev.hedefSiniflar, sinifId]
    }));
  };

  // Filtreleme
  const filteredOdevler = odevler.filter(odev => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      if (!odev.baslik.toLowerCase().includes(search) && 
          !odev.course?.ad.toLowerCase().includes(search)) {
        return false;
      }
    }

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/ogretmen" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">Ödevler</h1>
              <p className="text-white/70 text-sm mt-1">Ödev oluştur ve değerlendir</p>
            </div>
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
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ödev veya ders ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
              />
            </div>

            <div className="flex gap-2">
              {(['hepsi', 'aktif', 'gecmis'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-amber-500 text-white'
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
                        isSelected ? 'bg-amber-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-800 truncate">{odev.baslik}</h3>
                          <p className="text-sm text-slate-500 truncate">
                            {odev.course?.ad || 'Genel'} {odev.course?.sinif && `- ${odev.course.sinif.ad}`}
                          </p>
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
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-amber-500 to-amber-600">
                  <h2 className="text-xl font-semibold text-white">{selectedOdev.baslik}</h2>
                  <p className="text-white/70 mt-1">
                    {selectedOdev.course?.ad || 'Genel'} {selectedOdev.course?.sinif && `- ${selectedOdev.course.sinif.ad}`}
                  </p>
                  <div className="flex items-center gap-4 mt-4 flex-wrap">
                    <div className="flex items-center gap-2 text-white/80">
                      <Calendar size={16} />
                      <span className="text-sm">Son Teslim: {formatDate(selectedOdev.sonTeslimTarihi)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Star size={16} />
                      <span className="text-sm">Max: {selectedOdev.maxPuan} puan</span>
                    </div>
                    {selectedOdev.sorular.length > 0 && (
                      <div className="flex items-center gap-2 text-white/80">
                        <BookOpen size={16} />
                        <span className="text-sm">{selectedOdev.sorular.length} soru</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ödev İçeriği */}
                {(selectedOdev.aciklama || selectedOdev.konuBasligi || selectedOdev.icerik) && (
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    {selectedOdev.konuBasligi && (
                      <h4 className="font-medium text-slate-800 mb-2">{selectedOdev.konuBasligi}</h4>
                    )}
                    {selectedOdev.aciklama && (
                      <p className="text-slate-600 text-sm">{selectedOdev.aciklama}</p>
                    )}
                    {selectedOdev.icerik && (
                      <div className="mt-2 text-slate-600 text-sm" dangerouslySetInnerHTML={{ __html: selectedOdev.icerik }} />
                    )}
                  </div>
                )}

                {/* Ödev Resimleri */}
                {selectedOdev.resimler && selectedOdev.resimler.length > 0 && (
                  <div className="p-4 border-b border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-3">Ekler</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedOdev.resimler.map((resim, index) => (
                        <div
                          key={index}
                          className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80"
                          onClick={() => {
                            setPreviewImage(resim);
                            setShowPreviewModal(true);
                          }}
                        >
                          <img src={resim} alt={`Ek ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sorular */}
                {selectedOdev.sorular.length > 0 && (
                  <div className="p-4 border-b border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-3">Sorular</h4>
                    <div className="space-y-3">
                      {selectedOdev.sorular.map((soru, index) => (
                        <div key={soru.id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-slate-700">Soru {index + 1}</span>
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                              {soru.puan} puan
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 text-sm">{soru.soruMetni}</p>
                          {soru.resimUrl && (
                            <img
                              src={soru.resimUrl}
                              alt={`Soru ${index + 1}`}
                              className="mt-2 max-h-40 rounded cursor-pointer hover:opacity-80"
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
                            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-medium">
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
                                className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full text-sm hover:bg-amber-600 transition-colors"
                              >
                                <Star size={14} />
                                Değerlendir
                              </button>
                            ) : (
                              <span className="text-slate-400 text-sm">Bekliyor</span>
                            )}

                            {/* Ek gösterimi */}
                            {(teslim.dosyaUrl || (teslim.resimler && teslim.resimler.length > 0)) && (
                              <div className="flex gap-1">
                                {teslim.dosyaUrl && (
                                  <a
                                    href={teslim.dosyaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                    title="Dosyayı indir"
                                  >
                                    <Download size={18} className="text-slate-600" />
                                  </a>
                                )}
                                {teslim.resimler && teslim.resimler.length > 0 && (
                                  <button
                                    onClick={() => {
                                      setPreviewImage(teslim.resimler[0]);
                                      setShowPreviewModal(true);
                                    }}
                                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                    title="Resimleri görüntüle"
                                  >
                                    <Eye size={18} className="text-slate-600" />
                                  </button>
                                )}
                              </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold">Yeni Ödev Oluştur</h3>
              <button 
                onClick={() => { setShowYeniOdevModal(false); resetYeniOdevForm(); }} 
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleYeniOdev} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Temel Bilgiler */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ders Seçimi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={yeniOdev.courseId}
                    onChange={(e) => setYeniOdev({ ...yeniOdev, courseId: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 bg-white"
                  >
                    <option value="">Ders seçin...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.ad}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Sadece kendi branşınızdaki derslere ödev verebilirsiniz
                  </p>
                </div>

                {/* Hedef Sınıflar (Opsiyonel) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Hedef Sınıflar (Opsiyonel)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {siniflar.map((sinif) => (
                      <button
                        key={sinif.id}
                        type="button"
                        onClick={() => toggleHedefSinif(sinif.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          yeniOdev.hedefSiniflar.includes(sinif.id)
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {sinif.ad}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ödev Başlığı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={yeniOdev.baslik}
                    onChange={(e) => setYeniOdev({ ...yeniOdev, baslik: e.target.value })}
                    required
                    placeholder="Örn: 1. Ünite Değerlendirme Ödevi"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Konu Başlığı (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={yeniOdev.konuBasligi}
                    onChange={(e) => setYeniOdev({ ...yeniOdev, konuBasligi: e.target.value })}
                    placeholder="Örn: Trigonometri - Sinüs ve Kosinüs"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    value={yeniOdev.aciklama}
                    onChange={(e) => setYeniOdev({ ...yeniOdev, aciklama: e.target.value })}
                    placeholder="Ödev hakkında detaylı bilgi yazın..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder-slate-400 resize-none"
                  />
                </div>
              </div>

              {/* Ödev Tipi */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ödev Tipi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ODEV_TIPLERI.map((tip) => (
                    <button
                      key={tip.value}
                      type="button"
                      onClick={() => setYeniOdev({ ...yeniOdev, odevTipi: tip.value as any })}
                      className={`p-3 rounded-xl text-left transition-colors ${
                        yeniOdev.odevTipi === tip.value
                          ? 'bg-amber-100 border-2 border-amber-500'
                          : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-medium text-slate-800">{tip.label}</div>
                      <div className="text-xs text-slate-500">{tip.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tarihler ve Puan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="datetime-local"
                    value={yeniOdev.baslangicTarihi}
                    onChange={(e) => setYeniOdev({ ...yeniOdev, baslangicTarihi: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Son Teslim Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={yeniOdev.sonTeslimTarihi}
                    onChange={(e) => setYeniOdev({ ...yeniOdev, sonTeslimTarihi: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Maksimum Puan
                  </label>
                  <input
                    type="number"
                    value={yeniOdev.maxPuan}
                    onChange={(e) => setYeniOdev({ ...yeniOdev, maxPuan: parseInt(e.target.value) || 100 })}
                    min={1}
                    max={1000}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Resim Ekleme */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Resim Ekle (Maks 8MB)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {yeniOdev.resimler.map((resim, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                      <img src={resim} alt={`Resim ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleResimSil(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center hover:border-amber-500 transition-colors"
                  >
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
                    ) : (
                      <>
                        <ImageIcon size={24} className="text-slate-400" />
                        <span className="text-xs text-slate-400 mt-1">Ekle</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'odev');
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              {/* Soru Ekleme */}
              {(yeniOdev.odevTipi === 'SORU_CEVAP' || yeniOdev.odevTipi === 'KARISIK') && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-700">Sorular ({yeniOdev.sorular.length})</h4>
                    <button
                      type="button"
                      onClick={() => setShowSoruEkle(!showSoruEkle)}
                      className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
                    >
                      {showSoruEkle ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {showSoruEkle ? 'Kapat' : 'Soru Ekle'}
                    </button>
                  </div>

                  {/* Mevcut Sorular */}
                  {yeniOdev.sorular.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {yeniOdev.sorular.map((soru, index) => (
                        <div key={index} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-slate-700">Soru {index + 1}</span>
                            <p className="text-sm text-slate-600 mt-1">{soru.soruMetni}</p>
                            {soru.resimUrl && (
                              <img src={soru.resimUrl} alt="" className="mt-2 h-16 rounded" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                              {soru.puan} puan
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSoruSil(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Yeni Soru Formu */}
                  {showSoruEkle && (
                    <div className="space-y-3 p-3 bg-amber-50 rounded-lg">
                      <textarea
                        value={yeniSoru.soruMetni}
                        onChange={(e) => setYeniSoru({ ...yeniSoru, soruMetni: e.target.value })}
                        placeholder="Soru metnini yazın..."
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder-slate-400 resize-none"
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <button
                            type="button"
                            onClick={() => soruResimInputRef.current?.click()}
                            className="flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600"
                          >
                            <ImageIcon size={16} />
                            {yeniSoru.resimUrl ? 'Resim Değiştir' : 'Resim Ekle'}
                          </button>
                          <input
                            ref={soruResimInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, 'soru');
                              e.target.value = '';
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-slate-600">Puan:</label>
                          <input
                            type="number"
                            value={yeniSoru.puan}
                            onChange={(e) => setYeniSoru({ ...yeniSoru, puan: parseInt(e.target.value) || 10 })}
                            min={1}
                            className="w-16 px-2 py-1 border border-slate-300 rounded text-slate-800 text-center"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSoruEkle}
                          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium text-sm"
                        >
                          Ekle
                        </button>
                      </div>
                      {yeniSoru.resimUrl && (
                        <div className="relative w-24 h-24">
                          <img src={yeniSoru.resimUrl} alt="" className="w-full h-full object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => setYeniSoru({ ...yeniSoru, resimUrl: '' })}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Butonlar */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowYeniOdevModal(false); resetYeniOdevForm(); }}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Oluşturuluyor...
                    </span>
                  ) : (
                    'Ödev Oluştur'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Değerlendirme Modal */}
      {showDegerlendirModal && selectedTeslim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold">Ödev Değerlendir</h3>
              <button onClick={() => setShowDegerlendirModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDegerlendir} className="p-6 space-y-5">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedTeslim.ogrenci.ad.charAt(0)}{selectedTeslim.ogrenci.soyad.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {selectedTeslim.ogrenci.ad} {selectedTeslim.ogrenci.soyad}
                    </p>
                    <p className="text-sm text-slate-500">
                      Teslim: {formatDate(selectedTeslim.teslimTarihi)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Teslim İçeriği */}
              {selectedTeslim.aciklama && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-medium text-slate-700 mb-2">Öğrenci Açıklaması:</h4>
                  <p className="text-slate-600 text-sm">{selectedTeslim.aciklama}</p>
                </div>
              )}

              {/* Teslim Resimleri */}
              {selectedTeslim.resimler && selectedTeslim.resimler.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">Yüklenen Resimler:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeslim.resimler.map((resim, index) => (
                      <div
                        key={index}
                        className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80"
                        onClick={() => {
                          setPreviewImage(resim);
                          setShowPreviewModal(true);
                        }}
                      >
                        <img src={resim} alt={`Resim ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Puan (Max: {selectedOdev?.maxPuan})
                </label>
                <input
                  type="number"
                  value={degerlendirme.puan}
                  onChange={(e) => setDegerlendirme({ ...degerlendirme, puan: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={selectedOdev?.maxPuan || 100}
                  required
                  className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-3xl font-bold text-center text-slate-800"
                />
                <input
                  type="range"
                  value={degerlendirme.puan}
                  onChange={(e) => setDegerlendirme({ ...degerlendirme, puan: parseInt(e.target.value) })}
                  min={0}
                  max={selectedOdev?.maxPuan || 100}
                  className="w-full mt-2 accent-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Yorum (Opsiyonel)
                </label>
                <textarea
                  value={degerlendirme.yorum}
                  onChange={(e) => setDegerlendirme({ ...degerlendirme, yorum: e.target.value })}
                  placeholder="Öğrenciye geri bildirim yazın..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 placeholder-slate-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDegerlendirModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-medium disabled:opacity-50"
                >
                  {processing ? 'Değerlendiriliyor...' : 'Değerlendir'}
                </button>
              </div>
            </form>
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
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-slate-100"
            >
              <Download size={18} />
              İndir
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OgretmenOdevlerPage() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <OgretmenOdevlerContent />
    </RoleGuard>
  );
}
