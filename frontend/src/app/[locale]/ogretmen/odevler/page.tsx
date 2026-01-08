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
  ChevronUp,
  Copy,
  Save,
  Send,
  AlertTriangle,
  Settings
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
  taslak: boolean;
  gecTeslimPolitikasi: {
    piyanKesintisiGunluk: number;
    maksimumGecikmeGun: number;
    toleransSaat: number;
  } | null;
  geriBildirimDuzenlenebilir: boolean;
  kopyalananOdevId: string | null;
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
  { value: 'KARISIK', label: 'Karışık (Hepsi)', description: 'Test ve klasik sorular' },
  { value: 'TEST', label: 'Test', description: 'Çoktan seçmeli sorular' },
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
  const [filterStatus, setFilterStatus] = useState<'hepsi' | 'aktif' | 'gecmis' | 'taslak'>('hepsi');
  const [processing, setProcessing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showSoruEkle, setShowSoruEkle] = useState(false);
  
  // Mesaj modal state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModal, setMessageModal] = useState<{ type: 'success' | 'error' | 'warning'; title: string; message: string }>({
    type: 'error',
    title: '',
    message: ''
  });

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
    sorular: [] as { soruMetni: string; resimUrl?: string; puan: number; tip: 'test' | 'klasik'; siklar?: string[]; dogruCevap?: number }[],
    taslak: false,
    gecTeslimPolitikasi: null as { puanKesintisiGunluk: number; maksimumGecikmeGun: number; toleransSaat: number } | null,
    geriBildirimDuzenlenebilir: true
  });

  // Geç teslim politikası açık mı
  const [gecTeslimAcik, setGecTeslimAcik] = useState(false);
  const [gecTeslimForm, setGecTeslimForm] = useState({
    puanKesintisiGunluk: 10,
    maksimumGecikmeGun: 3,
    toleransSaat: 6
  });

  // Kopyalama state
  const [showKopyalaModal, setShowKopyalaModal] = useState(false);
  const [kopyalanacakOdev, setKopyalanacakOdev] = useState<Odev | null>(null);
  const [kopyaBaslik, setKopyaBaslik] = useState('');
  const [kopyaSonTeslim, setKopyaSonTeslim] = useState('');

  // Karışık modda aktif soru tipi
  const [aktivSoruTipi, setAktivSoruTipi] = useState<'test' | 'klasik'>('test');

  // Yeni soru state
  const [yeniSoru, setYeniSoru] = useState({
    soruMetni: '',
    resimUrl: '',
    puan: 10,
    tip: 'test' as 'test' | 'klasik',
    siklar: ['', '', '', ''] as string[],
    dogruCevap: 0
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
        setMessageModal({
          type: 'error',
          title: 'Resim Yükleme Hatası',
          message: data.error || 'Resim yüklenemedi'
        });
        setShowMessageModal(true);
      }
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      setMessageModal({
        type: 'error',
        title: 'Hata',
        message: 'Resim yüklenirken bir hata oluştu'
      });
      setShowMessageModal(true);
    } finally {
      setUploadingImage(false);
    }
  };

  // Yeni ödev oluştur
  const handleYeniOdev = async (e: React.FormEvent, asTaslak = false) => {
    e.preventDefault();
    
    // Soru puanları toplamını kontrol et (taslak değilse)
    if (!asTaslak && yeniOdev.sorular.length > 0) {
      const toplamPuan = yeniOdev.sorular.reduce((acc, soru) => acc + soru.puan, 0);
      if (toplamPuan > yeniOdev.maxPuan) {
        setMessageModal({
          type: 'warning',
          title: 'Puan Uyarısı',
          message: `Soru puanları toplamı (${toplamPuan}) maksimum puandan (${yeniOdev.maxPuan}) fazla. Lütfen soru puanlarını veya maksimum puanı düzenleyin.`
        });
        setShowMessageModal(true);
        return;
      }
    }
    
    setProcessing(true);
    
    try {
      const payload = {
        ...yeniOdev,
        taslak: asTaslak,
        hedefSiniflar: yeniOdev.hedefSiniflar.length > 0 ? yeniOdev.hedefSiniflar : undefined,
        courseId: yeniOdev.courseId || undefined,
        baslangicTarihi: yeniOdev.baslangicTarihi || undefined,
        konuBasligi: yeniOdev.konuBasligi || undefined,
        icerik: yeniOdev.icerik || undefined,
        resimler: yeniOdev.resimler.length > 0 ? yeniOdev.resimler : undefined,
        dosyalar: yeniOdev.dosyalar.length > 0 ? yeniOdev.dosyalar : undefined,
        sorular: yeniOdev.sorular.length > 0 ? yeniOdev.sorular : undefined,
        gecTeslimPolitikasi: gecTeslimAcik ? gecTeslimForm : null,
        geriBildirimDuzenlenebilir: yeniOdev.geriBildirimDuzenlenebilir
      };

      const response = await fetch(`${API_URL}/odevler`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.success) {
        setMessageModal({
          type: 'success',
          title: 'Başarılı',
          message: asTaslak ? 'Ödev taslak olarak kaydedildi!' : 'Ödev başarıyla oluşturuldu!'
        });
        setShowMessageModal(true);
        setShowYeniOdevModal(false);
        resetYeniOdevForm();
        fetchOdevler();
      } else {
        setMessageModal({
          type: 'error',
          title: 'Hata',
          message: data.error || 'Ödev oluşturulamadı'
        });
        setShowMessageModal(true);
      }
    } catch (error) {
      console.error('Ödev oluşturma hatası:', error);
      setMessageModal({
        type: 'error',
        title: 'Hata',
        message: 'Bir hata oluştu'
      });
      setShowMessageModal(true);
    } finally {
      setProcessing(false);
    }
  };

  // Ödev kopyala
  const handleKopyalaOdev = async () => {
    if (!kopyalanacakOdev || !kopyaBaslik || !kopyaSonTeslim) {
      setMessageModal({
        type: 'warning',
        title: 'Uyarı',
        message: 'Lütfen başlık ve son teslim tarihi girin'
      });
      setShowMessageModal(true);
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/odevler/${kopyalanacakOdev.id}/kopyala`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          yeniBaslik: kopyaBaslik,
          yeniSonTeslimTarihi: kopyaSonTeslim
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setMessageModal({
          type: 'success',
          title: 'Başarılı',
          message: 'Ödev başarıyla kopyalandı!'
        });
        setShowMessageModal(true);
        setShowKopyalaModal(false);
        setKopyalanacakOdev(null);
        setKopyaBaslik('');
        setKopyaSonTeslim('');
        fetchOdevler();
      } else {
        setMessageModal({
          type: 'error',
          title: 'Hata',
          message: data.error || 'Ödev kopyalanamadı'
        });
        setShowMessageModal(true);
      }
    } catch (error) {
      console.error('Ödev kopyalama hatası:', error);
      setMessageModal({
        type: 'error',
        title: 'Hata',
        message: 'Bir hata oluştu'
      });
      setShowMessageModal(true);
    } finally {
      setProcessing(false);
    }
  };

  // Taslak ödevi yayınla
  const handleYayinla = async (odevId: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/odevler/${odevId}/yayinla`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setMessageModal({
          type: 'success',
          title: 'Başarılı',
          message: 'Ödev yayınlandı!'
        });
        setShowMessageModal(true);
        fetchOdevler();
      } else {
        setMessageModal({
          type: 'error',
          title: 'Hata',
          message: data.error || 'Ödev yayınlanamadı'
        });
        setShowMessageModal(true);
      }
    } catch (error) {
      console.error('Ödev yayınlama hatası:', error);
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
      sorular: [],
      taslak: false,
      gecTeslimPolitikasi: null,
      geriBildirimDuzenlenebilir: true
    });
    setYeniSoru({ soruMetni: '', resimUrl: '', puan: 10, tip: 'test', siklar: ['', '', '', ''], dogruCevap: 0 });
    setAktivSoruTipi('test');
    setShowSoruEkle(false);
    setGecTeslimAcik(false);
    setGecTeslimForm({ puanKesintisiGunluk: 10, maksimumGecikmeGun: 3, toleransSaat: 6 });
  };

  // Soru ekle
  const handleSoruEkle = () => {
    if (!yeniSoru.soruMetni.trim()) {
      setMessageModal({
        type: 'warning',
        title: 'Uyarı',
        message: 'Soru metni gerekli'
      });
      setShowMessageModal(true);
      return;
    }

    // Test sorusu için şıklar kontrolü
    if (yeniSoru.tip === 'test') {
      const bosOlmayanSiklar = yeniSoru.siklar.filter(s => s.trim() !== '');
      if (bosOlmayanSiklar.length < 2) {
        setMessageModal({
          type: 'warning',
          title: 'Uyarı',
          message: 'Test sorusu için en az 2 şık gerekli'
        });
        setShowMessageModal(true);
        return;
      }
    }
    
    // Yeni soru eklendiğinde toplam puanı kontrol et
    const mevcutToplam = yeniOdev.sorular.reduce((acc, soru) => acc + soru.puan, 0);
    const yeniToplam = mevcutToplam + yeniSoru.puan;
    
    if (yeniToplam > yeniOdev.maxPuan) {
      setMessageModal({
        type: 'warning',
        title: 'Puan Uyarısı',
        message: `Bu soru eklendiğinde toplam puan (${yeniToplam}) maksimum puandan (${yeniOdev.maxPuan}) fazla olacak. Yine de eklensin mi?`
      });
      setShowMessageModal(true);
    }
    
    // Soruyu ekle
    const yeniSoruData = yeniSoru.tip === 'test' 
      ? { ...yeniSoru, siklar: yeniSoru.siklar.filter(s => s.trim() !== '') }
      : { soruMetni: yeniSoru.soruMetni, resimUrl: yeniSoru.resimUrl, puan: yeniSoru.puan, tip: yeniSoru.tip };
    
    setYeniOdev(prev => ({
      ...prev,
      sorular: [...prev.sorular, yeniSoruData as any]
    }));
    setYeniSoru({ soruMetni: '', resimUrl: '', puan: 10, tip: aktivSoruTipi, siklar: ['', '', '', ''], dogruCevap: 0 });
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
        setMessageModal({
          type: 'success',
          title: 'Başarılı',
          message: 'Ödev değerlendirildi!'
        });
        setShowMessageModal(true);
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
        setMessageModal({
          type: 'error',
          title: 'Hata',
          message: data.error || 'Değerlendirme yapılamadı'
        });
        setShowMessageModal(true);
      }
    } catch (error) {
      console.error('Değerlendirme hatası:', error);
      setMessageModal({
        type: 'error',
        title: 'Hata',
        message: 'Bir hata oluştu'
      });
      setShowMessageModal(true);
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
    
    if (filterStatus === 'taslak' && !odev.taslak) return false;
    if (filterStatus === 'aktif' && (sonTeslim < now || odev.taslak)) return false;
    if (filterStatus === 'gecmis' && (sonTeslim >= now || odev.taslak)) return false;
    if (filterStatus === 'hepsi' && odev.taslak) return false; // Taslakları hepsi'de gösterme

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

            <div className="flex gap-2 flex-wrap">
              {(['hepsi', 'aktif', 'gecmis', 'taslak'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'hepsi' ? 'Tümü' : status === 'aktif' ? 'Aktif' : status === 'gecmis' ? 'Geçmiş' : 'Taslaklar'}
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
                    <div
                      key={odev.id}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-amber-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <button
                          onClick={() => setSelectedOdev(odev)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-slate-800 truncate">{odev.baslik}</h3>
                            {odev.taslak && (
                              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded">
                                Taslak
                              </span>
                            )}
                            {odev.gecTeslimPolitikasi && (
                              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded" title="Geç teslim kabul edilir">
                                <Clock size={10} className="inline" />
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 truncate">
                            {odev.course?.ad || 'Genel'} {odev.course?.sinif && `- ${odev.course.sinif.ad}`}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            {!odev.taslak && (
                              <>
                                <span className={`text-xs ${kalanSure.color}`}>{kalanSure.text}</span>
                                <span className="text-xs text-slate-400">
                                  {odev.stats.teslimEdilen}/{odev.stats.toplamOgrenci} teslim
                                </span>
                              </>
                            )}
                          </div>
                        </button>
                        <div className="flex items-center gap-1">
                          {odev.taslak ? (
                            <button
                              onClick={() => handleYayinla(odev.id)}
                              className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                              title="Yayınla"
                            >
                              <Send size={14} />
                            </button>
                          ) : odev.stats.bekleyen > 0 ? (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                              {odev.stats.bekleyen} bekliyor
                            </span>
                          ) : null}
                          <button
                            onClick={() => {
                              setKopyalanacakOdev(odev);
                              setKopyaBaslik(`${odev.baslik} (Kopya)`);
                              setKopyaSonTeslim('');
                              setShowKopyalaModal(true);
                            }}
                            className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-500"
                            title="Kopyala"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
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
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">
                                  <CheckCircle size={14} />
                                  {teslim.puan}/{selectedOdev.maxPuan}
                                </span>
                                {selectedOdev.geriBildirimDuzenlenebilir && (
                                  <button
                                    onClick={() => {
                                      setSelectedTeslim(teslim);
                                      setDegerlendirme({ puan: teslim.puan || 0, yorum: teslim.ogretmenYorumu || '' });
                                      setShowDegerlendirModal(true);
                                    }}
                                    className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-500"
                                    title="Düzenle"
                                  >
                                    <Edit size={14} />
                                  </button>
                                )}
                              </div>
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white"
                    style={{ color: '#1f2937' }}
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white placeholder-slate-400"
                    style={{ color: '#1f2937' }}
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white placeholder-slate-400"
                    style={{ color: '#1f2937' }}
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white placeholder-slate-400 resize-none"
                    style={{ color: '#1f2937' }}
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    style={{ color: '#1f2937' }}
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    style={{ color: '#1f2937' }}
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
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    style={{ color: '#1f2937' }}
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

              {/* Geç Teslim Politikası */}
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Settings size={18} className="text-slate-500" />
                    <h4 className="font-semibold text-slate-700">Geç Teslim Politikası</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gecTeslimAcik}
                      onChange={(e) => setGecTeslimAcik(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                
                {gecTeslimAcik && (
                  <div className="space-y-3 mt-3 p-3 bg-amber-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Günlük Kesinti (%)</label>
                        <input
                          type="number"
                          value={gecTeslimForm.puanKesintisiGunluk}
                          onChange={(e) => setGecTeslimForm({...gecTeslimForm, puanKesintisiGunluk: parseInt(e.target.value) || 0})}
                          min={0}
                          max={100}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                          style={{ color: '#1f2937' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Max Gecikme (Gün)</label>
                        <input
                          type="number"
                          value={gecTeslimForm.maksimumGecikmeGun}
                          onChange={(e) => setGecTeslimForm({...gecTeslimForm, maksimumGecikmeGun: parseInt(e.target.value) || 0})}
                          min={1}
                          max={30}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                          style={{ color: '#1f2937' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Tolerans (Saat)</label>
                        <input
                          type="number"
                          value={gecTeslimForm.toleransSaat}
                          onChange={(e) => setGecTeslimForm({...gecTeslimForm, toleransSaat: parseInt(e.target.value) || 0})}
                          min={0}
                          max={24}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                          style={{ color: '#1f2937' }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-amber-700">
                      Son teslim tarihinden sonra {gecTeslimForm.toleransSaat} saat tolerans, ardından günlük %{gecTeslimForm.puanKesintisiGunluk} kesinti (max {gecTeslimForm.maksimumGecikmeGun} gün)
                    </p>
                  </div>
                )}
              </div>

              {/* Geri Bildirim Düzenlenebilir */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-slate-700">Geri Bildirim Düzenlenebilir</h4>
                  <p className="text-xs text-slate-500">Değerlendirme sonrası puan/yorum düzenlenebilsin mi?</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={yeniOdev.geriBildirimDuzenlenebilir}
                    onChange={(e) => setYeniOdev({...yeniOdev, geriBildirimDuzenlenebilir: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Soru Ekleme */}
              {(yeniOdev.odevTipi === 'SORU_CEVAP' || yeniOdev.odevTipi === 'KARISIK' || yeniOdev.odevTipi === 'TEST') && (
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
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-700">Soru {index + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${soru.tip === 'test' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {soru.tip === 'test' ? 'Test' : 'Klasik'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{soru.soruMetni}</p>
                            {soru.tip === 'test' && soru.siklar && (
                              <div className="mt-2 space-y-1">
                                {soru.siklar.map((sik, sikIndex) => (
                                  <div key={sikIndex} className={`text-xs px-2 py-1 rounded ${soru.dogruCevap === sikIndex ? 'bg-green-100 text-green-700 font-medium' : 'bg-slate-100 text-slate-600'}`}>
                                    {String.fromCharCode(65 + sikIndex)}) {sik}
                                  </div>
                                ))}
                              </div>
                            )}
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
                      {/* Karışık modda soru tipi seçimi */}
                      {yeniOdev.odevTipi === 'KARISIK' && (
                        <div className="flex gap-2 mb-3">
                          <button
                            type="button"
                            onClick={() => {
                              setAktivSoruTipi('test');
                              setYeniSoru({ ...yeniSoru, tip: 'test' });
                            }}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                              aktivSoruTipi === 'test'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            📝 Test Sorusu
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAktivSoruTipi('klasik');
                              setYeniSoru({ ...yeniSoru, tip: 'klasik' });
                            }}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                              aktivSoruTipi === 'klasik'
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            ✏️ Klasik Soru
                          </button>
                        </div>
                      )}

                      {/* Test modunda otomatik test tipi */}
                      {yeniOdev.odevTipi === 'TEST' && yeniSoru.tip !== 'test' && setYeniSoru({ ...yeniSoru, tip: 'test' })}
                      
                      {/* Soru-Cevap modunda otomatik klasik tipi */}
                      {yeniOdev.odevTipi === 'SORU_CEVAP' && yeniSoru.tip !== 'klasik' && setYeniSoru({ ...yeniSoru, tip: 'klasik' })}

                      <textarea
                        value={yeniSoru.soruMetni}
                        onChange={(e) => setYeniSoru({ ...yeniSoru, soruMetni: e.target.value })}
                        placeholder="Soru metnini yazın..."
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white placeholder-slate-400 resize-none"
                        style={{ color: '#1f2937' }}
                      />

                      {/* Test Sorusu Şıkları */}
                      {(yeniSoru.tip === 'test' || yeniOdev.odevTipi === 'TEST') && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Şıklar (doğru olanı seçin)</label>
                          {yeniSoru.siklar.map((sik, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setYeniSoru({ ...yeniSoru, dogruCevap: index })}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                  yeniSoru.dogruCevap === index
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                }`}
                              >
                                {String.fromCharCode(65 + index)}
                              </button>
                              <input
                                type="text"
                                value={sik}
                                onChange={(e) => {
                                  const yeniSiklar = [...yeniSoru.siklar];
                                  yeniSiklar[index] = e.target.value;
                                  setYeniSoru({ ...yeniSoru, siklar: yeniSiklar });
                                }}
                                placeholder={`${String.fromCharCode(65 + index)} şıkkı`}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                                style={{ color: '#1f2937' }}
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setYeniSoru({ ...yeniSoru, siklar: [...yeniSoru.siklar, ''] })}
                            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                          >
                            + Şık Ekle
                          </button>
                        </div>
                      )}

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
                            className="w-16 px-2 py-1 border border-slate-300 rounded bg-white text-center"
                            style={{ color: '#1f2937' }}
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
                  className="px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={(e) => handleYeniOdev(e as any, true)}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-slate-500 text-white rounded-xl hover:bg-slate-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Taslak Kaydet
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

      {/* Değerlendirme Panel - Modern Slide-over */}
      {showDegerlendirModal && selectedTeslim && selectedOdev && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDegerlendirModal(false)}
          />
          
          {/* Slide-over Panel */}
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div className="w-screen max-w-5xl transform transition-transform duration-300 ease-out">
              <div className="flex h-full flex-col bg-white shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {selectedTeslim.ogrenci.ad.charAt(0)}{selectedTeslim.ogrenci.soyad.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {selectedTeslim.ogrenci.ad} {selectedTeslim.ogrenci.soyad}
                        </h2>
                        <p className="text-white/80 text-sm flex items-center gap-2">
                          <Clock size={14} />
                          {formatDate(selectedTeslim.teslimTarihi)}
                          {selectedTeslim.ogrenci.ogrenciNo && (
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                              No: {selectedTeslim.ogrenci.ogrenciNo}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedTeslim.durum === 'DEGERLENDIRILDI' && (
                        <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-white">
                          <span className="text-sm opacity-80">Mevcut Puan:</span>
                          <span className="ml-2 text-xl font-bold">{selectedTeslim.puan}/{selectedOdev.maxPuan}</span>
                        </div>
                      )}
                      <button 
                        onClick={() => setShowDegerlendirModal(false)} 
                        className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
                      >
                        <X size={24} className="text-white" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Ödev Bilgisi */}
                  <div className="mt-4 p-3 bg-white/10 backdrop-blur rounded-xl">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="font-semibold text-white">{selectedOdev.baslik}</h3>
                        <p className="text-white/70 text-sm">
                          {selectedOdev.course?.ad || 'Genel'} {selectedOdev.course?.sinif && `• ${selectedOdev.course.sinif.ad}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-white/80 text-sm">
                        <span className="flex items-center gap-1">
                          <Star size={14} />
                          Max {selectedOdev.maxPuan} puan
                        </span>
                        {selectedOdev.sorular.length > 0 && (
                          <span className="flex items-center gap-1">
                            <BookOpen size={14} />
                            {selectedOdev.sorular.length} soru
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* İçerik - İki Sütun */}
                <div className="flex-1 overflow-hidden flex">
                  {/* Sol Sütun - Öğrenci Teslimi */}
                  <div className="flex-1 overflow-y-auto border-r border-slate-200 bg-slate-50/50">
                    <div className="p-6 space-y-6">
                      {/* Öğrenci Açıklaması */}
                      {selectedTeslim.aciklama && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                              <MessageSquare size={18} className="text-blue-500" />
                              Öğrenci Açıklaması
                            </h4>
                          </div>
                          <div className="p-4">
                            <p className="text-slate-700 whitespace-pre-wrap">{selectedTeslim.aciklama}</p>
                          </div>
                        </div>
                      )}

                      {/* Soru-Cevap Görünümü */}
                      {selectedOdev.sorular.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-100">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                              <Target size={18} className="text-purple-500" />
                              Sorular ve Cevaplar
                            </h4>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {selectedOdev.sorular.map((soru, index) => {
                              const cevap = selectedTeslim.soruCevaplari?.find((c: any) => c.soruId === soru.id);
                              return (
                                <div key={soru.id} className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                                      {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <p className="text-slate-800 font-medium">{soru.soruMetni}</p>
                                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium shrink-0">
                                          {soru.puan} puan
                                        </span>
                                      </div>
                                      
                                      {/* Soru Resmi */}
                                      {soru.resimUrl && (
                                        <div 
                                          className="mb-3 cursor-pointer"
                                          onClick={() => {
                                            setPreviewImage(soru.resimUrl);
                                            setShowPreviewModal(true);
                                          }}
                                        >
                                          <img 
                                            src={soru.resimUrl} 
                                            alt={`Soru ${index + 1}`} 
                                            className="max-h-40 rounded-lg border border-slate-200 hover:opacity-90 transition-opacity"
                                          />
                                        </div>
                                      )}
                                      
                                      {/* Öğrenci Cevabı */}
                                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-[10px]">Ö</span>
                                          </div>
                                          <span className="text-xs font-medium text-slate-500">Öğrenci Cevabı</span>
                                        </div>
                                        {cevap ? (
                                          <div>
                                            {cevap.cevapMetni && (
                                              <p className="text-slate-700">{cevap.cevapMetni}</p>
                                            )}
                                            {cevap.secilenSik !== null && cevap.secilenSik !== undefined && (
                                              <div className="flex items-center gap-2">
                                                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">
                                                  {String.fromCharCode(65 + cevap.secilenSik)}
                                                </span>
                                                <span className="text-slate-600">{cevap.sikMetni || ''}</span>
                                              </div>
                                            )}
                                            {cevap.resimUrl && (
                                              <div 
                                                className="mt-2 cursor-pointer"
                                                onClick={() => {
                                                  setPreviewImage(cevap.resimUrl);
                                                  setShowPreviewModal(true);
                                                }}
                                              >
                                                <img 
                                                  src={cevap.resimUrl} 
                                                  alt="Cevap resmi" 
                                                  className="max-h-32 rounded-lg border border-slate-200 hover:opacity-90"
                                                />
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <p className="text-slate-400 italic text-sm">Cevap verilmemiş</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Yüklenen Belgeler ve Resimler */}
                      {((selectedTeslim.dosyalar && selectedTeslim.dosyalar.length > 0) || 
                        (selectedTeslim.resimler && selectedTeslim.resimler.length > 0) ||
                        selectedTeslim.dosyaUrl) && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-100">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                              <Upload size={18} className="text-green-500" />
                              Yüklenen Dosyalar ve Resimler
                            </h4>
                          </div>
                          <div className="p-4">
                            {/* Dosyalar */}
                            {(selectedTeslim.dosyaUrl || (selectedTeslim.dosyalar && selectedTeslim.dosyalar.length > 0)) && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                  <FileText size={14} />
                                  Dosyalar
                                </h5>
                                <div className="space-y-2">
                                  {selectedTeslim.dosyaUrl && (
                                    <a
                                      href={selectedTeslim.dosyaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 group"
                                    >
                                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <FileText size={20} className="text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-700 truncate">Teslim Dosyası</p>
                                        <p className="text-xs text-slate-500">İndirmek için tıklayın</p>
                                      </div>
                                      <Download size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    </a>
                                  )}
                                  {selectedTeslim.dosyalar?.map((dosya: any, index: number) => (
                                    <a
                                      key={index}
                                      href={dosya.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 group"
                                    >
                                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                        <FileText size={20} className="text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-700 truncate">{dosya.ad || `Dosya ${index + 1}`}</p>
                                        <p className="text-xs text-slate-500">{dosya.boyut ? `${(dosya.boyut / 1024).toFixed(1)} KB` : 'İndirmek için tıklayın'}</p>
                                      </div>
                                      <Download size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Resimler */}
                            {selectedTeslim.resimler && selectedTeslim.resimler.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                  <ImageIcon size={14} />
                                  Resimler ({selectedTeslim.resimler.length})
                                </h5>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                  {selectedTeslim.resimler.map((resim, index) => (
                                    <div
                                      key={index}
                                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 cursor-pointer group hover:border-amber-400 transition-colors"
                                      onClick={() => {
                                        setPreviewImage(resim);
                                        setShowPreviewModal(true);
                                      }}
                                    >
                                      <img 
                                        src={resim} 
                                        alt={`Resim ${index + 1}`} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                        <span className="text-white text-xs font-medium flex items-center gap-1">
                                          <Eye size={12} />
                                          Önizle
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Hiç içerik yoksa */}
                      {!selectedTeslim.aciklama && 
                       selectedOdev.sorular.length === 0 && 
                       !selectedTeslim.dosyaUrl && 
                       (!selectedTeslim.dosyalar || selectedTeslim.dosyalar.length === 0) && 
                       (!selectedTeslim.resimler || selectedTeslim.resimler.length === 0) && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-slate-400" />
                          </div>
                          <h4 className="font-medium text-slate-700 mb-1">Teslim İçeriği Yok</h4>
                          <p className="text-slate-500 text-sm">Öğrenci henüz detaylı içerik paylaşmamış.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sağ Sütun - Değerlendirme Formu */}
                  <div className="w-96 bg-white flex flex-col">
                    <form onSubmit={handleDegerlendir} className="flex-1 flex flex-col">
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Toplam Puan */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                          <label className="block text-sm font-semibold text-amber-800 mb-3">
                            Toplam Puan
                          </label>
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              value={degerlendirme.puan}
                              onChange={(e) => setDegerlendirme({ ...degerlendirme, puan: parseInt(e.target.value) || 0 })}
                              min={0}
                              max={selectedOdev.maxPuan}
                              required
                              className="w-full px-4 py-4 border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-4xl font-bold text-center bg-white text-slate-800"
                            />
                            <div className="text-center">
                              <div className="text-3xl font-bold text-amber-600">/</div>
                              <div className="text-lg font-semibold text-amber-700">{selectedOdev.maxPuan}</div>
                            </div>
                          </div>
                          <input
                            type="range"
                            value={degerlendirme.puan}
                            onChange={(e) => setDegerlendirme({ ...degerlendirme, puan: parseInt(e.target.value) })}
                            min={0}
                            max={selectedOdev.maxPuan}
                            className="w-full mt-4 accent-amber-500 h-3 rounded-lg"
                          />
                          {/* Puan Yüzdesi */}
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="text-amber-700">Başarı Oranı</span>
                            <span className={`font-bold ${
                              (degerlendirme.puan / selectedOdev.maxPuan) >= 0.8 ? 'text-green-600' :
                              (degerlendirme.puan / selectedOdev.maxPuan) >= 0.5 ? 'text-amber-600' :
                              'text-red-600'
                            }`}>
                              %{Math.round((degerlendirme.puan / selectedOdev.maxPuan) * 100)}
                            </span>
                          </div>
                        </div>

                        {/* Hızlı Puanlama */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Hızlı Puanlama
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {[0, 25, 50, 75, 100].map((yuzde) => (
                              <button
                                key={yuzde}
                                type="button"
                                onClick={() => setDegerlendirme({ ...degerlendirme, puan: Math.round(selectedOdev.maxPuan * yuzde / 100) })}
                                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                                  Math.round((degerlendirme.puan / selectedOdev.maxPuan) * 100) === yuzde
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                %{yuzde}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Yorum */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Geri Bildirim
                          </label>
                          <textarea
                            value={degerlendirme.yorum}
                            onChange={(e) => setDegerlendirme({ ...degerlendirme, yorum: e.target.value })}
                            placeholder="Öğrenciye detaylı geri bildirim yazın..."
                            rows={5}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white placeholder-slate-400 resize-none text-slate-800"
                          />
                        </div>

                        {/* Hazır Yorumlar */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Hazır Yorumlar
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { emoji: '🌟', text: 'Mükemmel çalışma!' },
                              { emoji: '👍', text: 'İyi iş çıkardın.' },
                              { emoji: '💪', text: 'Gelişme gösteriyorsun.' },
                              { emoji: '📚', text: 'Daha fazla çalışmalısın.' },
                              { emoji: '✏️', text: 'Detaylara dikkat et.' },
                            ].map((item) => (
                              <button
                                key={item.text}
                                type="button"
                                onClick={() => setDegerlendirme({ 
                                  ...degerlendirme, 
                                  yorum: degerlendirme.yorum ? `${degerlendirme.yorum}\n${item.text}` : item.text 
                                })}
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
                              >
                                <span>{item.emoji}</span>
                                <span>{item.text}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Butonlar - Sticky Footer */}
                      <div className="p-4 border-t border-slate-200 bg-slate-50">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setShowDegerlendirModal(false)}
                            className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium transition-colors"
                          >
                            İptal
                          </button>
                          <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 font-medium disabled:opacity-50 transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                          >
                            {processing ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                <span>Kaydediliyor...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={18} />
                                <span>{selectedTeslim.durum === 'DEGERLENDIRILDI' ? 'Güncelle' : 'Değerlendir'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
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
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:bg-slate-100"
            >
              <Download size={18} />
              İndir
            </a>
          </div>
        </div>
      )}

      {/* Kopyalama Modal */}
      {showKopyalaModal && kopyalanacakOdev && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Copy size={20} />
                <h3 className="text-xl font-bold">Ödevi Kopyala</h3>
              </div>
              <button onClick={() => setShowKopyalaModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Kaynak:</strong> {kopyalanacakOdev.baslik}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {kopyalanacakOdev.sorular.length} soru kopyalanacak
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Yeni Başlık
                </label>
                <input
                  type="text"
                  value={kopyaBaslik}
                  onChange={(e) => setKopyaBaslik(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  style={{ color: '#1f2937' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Yeni Son Teslim Tarihi
                </label>
                <input
                  type="datetime-local"
                  value={kopyaSonTeslim}
                  onChange={(e) => setKopyaSonTeslim(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  style={{ color: '#1f2937' }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowKopyalaModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleKopyalaOdev}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Copy size={18} />
                      Kopyala
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mesaj Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`p-6 ${
              messageModal.type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' :
              messageModal.type === 'warning' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
              'bg-gradient-to-r from-red-500 to-red-600'
            } text-white`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  messageModal.type === 'success' ? 'bg-white/20' :
                  messageModal.type === 'warning' ? 'bg-white/20' :
                  'bg-white/20'
                }`}>
                  {messageModal.type === 'success' ? (
                    <CheckCircle size={28} />
                  ) : messageModal.type === 'warning' ? (
                    <AlertCircle size={28} />
                  ) : (
                    <AlertCircle size={28} />
                  )}
                </div>
                <h3 className="text-xl font-bold">{messageModal.title}</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-700 text-base">{messageModal.message}</p>
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowMessageModal(false)}
                className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${
                  messageModal.type === 'success' ? 'bg-green-500 hover:bg-green-600' :
                  messageModal.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' :
                  'bg-red-500 hover:bg-red-600'
                }`}
              >
                Tamam
              </button>
            </div>
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
