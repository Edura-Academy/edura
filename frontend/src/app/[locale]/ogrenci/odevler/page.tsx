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
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckSquare,
  Circle,
  Filter,
  SortDesc,
  Layers,
  ClipboardList,
  PenTool
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipler
interface OdevSoru {
  id: string;
  soruMetni: string;
  resimUrl: string | null;
  puan: number;
  siraNo: number;
  soruTipi: 'test' | 'klasik';
  siklar: string[] | null;
  dogruCevap: number | null;
}

interface OdevSoruCevap {
  soruId: string;
  cevapMetni: string;
  resimUrl: string;
  secilenSik?: number | null;
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
  odevTipi: 'KLASIK' | 'TEST' | 'SORU_CEVAP' | 'DOSYA_YUKLE' | 'KARISIK';
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
type SortType = 'tarih_yeni' | 'tarih_eski' | 'son_teslim' | 'puan';
type ViewMode = 'liste' | 'detay' | 'cozum' | 'test';

export default function OgrenciOdevlerPage() {
  // Theme
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // State
  const [odevler, setOdevler] = useState<Odev[]>([]);
  const [loading, setLoading] = useState(true);
  const [detayLoading, setDetayLoading] = useState(false);
  const [selectedOdev, setSelectedOdev] = useState<Odev | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('liste');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterType>('hepsi');
  const [sortBy, setSortBy] = useState<SortType>('tarih_yeni');
  const [filterCourse, setFilterCourse] = useState<string>('hepsi');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Test çözüm state
  const [currentSoruIndex, setCurrentSoruIndex] = useState(0);
  const [testCevaplari, setTestCevaplari] = useState<Record<string, number | null>>({});

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
      if (data.success && Array.isArray(data.data)) {
        // Her ödev için varsayılan değerleri ekle
        const normalizedOdevler = data.data.map((odev: any) => ({
          ...odev,
          sorular: (odev.sorular || []).map((s: any) => ({
            ...s,
            siklar: s.siklar ? (typeof s.siklar === 'string' ? JSON.parse(s.siklar) : s.siklar) : null
          })),
          resimler: odev.resimler || [],
          dosyalar: odev.dosyalar || [],
          teslim: odev.teslim ? {
            ...odev.teslim,
            resimler: odev.teslim.resimler || [],
            dosyalar: odev.teslim.dosyalar || [],
            soruCevaplari: odev.teslim.soruCevaplari || []
          } : null
        }));
        setOdevler(normalizedOdevler);
      } else {
        setOdevler([]);
      }
    } catch (error) {
      console.error('Ödevler yüklenemedi:', error);
      setOdevler([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Tek bir ödevin detayını getir (sorular dahil)
  const fetchOdevDetay = useCallback(async (odevId: string): Promise<Odev | null> => {
    try {
      setDetayLoading(true);
      const response = await fetch(`${API_URL}/odevler/${odevId}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success && data.data) {
        const odev = data.data;
        // Soruların şıklarını parse et
        const parsedSorular = (odev.sorular || []).map((s: any) => ({
          ...s,
          siklar: s.siklar ? (typeof s.siklar === 'string' ? JSON.parse(s.siklar) : s.siklar) : null
        }));
        
        // Mevcut kullanıcının teslimini bul (öğrenci olarak)
        const userId = JSON.parse(atob(localStorage.getItem('token')?.split('.')[1] || '{}')).userId;
        const teslim = odev.teslimler?.find((t: any) => t.ogrenciId === userId || t.ogrenci?.id === userId);
        
        const normalizedOdev: Odev = {
          ...odev,
          sorular: parsedSorular,
          resimler: odev.resimler || [],
          dosyalar: odev.dosyalar || [],
          teslim: teslim ? {
            id: teslim.id,
            teslimTarihi: teslim.teslimTarihi,
            dosyaUrl: teslim.dosyaUrl,
            dosyalar: teslim.dosyalar || [],
            resimler: teslim.resimler || [],
            aciklama: teslim.aciklama,
            durum: teslim.durum,
            puan: teslim.puan,
            ogretmenYorumu: teslim.ogretmenYorumu,
            soruCevaplari: teslim.soruCevaplari || []
          } : null,
          gecikmisMi: new Date(odev.sonTeslimTarihi) < new Date()
        };
        return normalizedOdev;
      }
      return null;
    } catch (error) {
      console.error('Ödev detayı yüklenemedi:', error);
      return null;
    } finally {
      setDetayLoading(false);
    }
  }, [getAuthHeaders]);

  // Ödev seç ve detayı yükle
  const selectOdev = useCallback(async (odev: Odev, directToSolve: boolean = false) => {
    const detay = await fetchOdevDetay(odev.id);
    if (detay) {
      setSelectedOdev(detay);
      if (directToSolve && !detay.gecikmisMi) {
        // Direkt çözüme geç
        if (detay.odevTipi === 'TEST') {
          setViewMode('test');
        } else {
          setViewMode('cozum');
        }
      } else {
        setViewMode('detay');
      }
    }
  }, [fetchOdevDetay]);

  // İlk yükleme
  useEffect(() => {
    fetchOdevler();
  }, [fetchOdevler]);

  // Ödev seçildiğinde soru cevaplarını hazırla
  useEffect(() => {
    if (selectedOdev && (viewMode === 'cozum' || viewMode === 'test')) {
      const mevcutCevaplar = selectedOdev.teslim?.soruCevaplari || [];
      const sorular = selectedOdev.sorular || [];
      const soruCevaplari = sorular.map(soru => {
        const mevcutCevap = mevcutCevaplar.find(c => c.soruId === soru.id);
        return {
          soruId: soru.id,
          cevapMetni: mevcutCevap?.cevapMetni || '',
          resimUrl: mevcutCevap?.resimUrl || '',
          secilenSik: mevcutCevap?.secilenSik ?? null
        };
      });
      setTeslimData(prev => ({ ...prev, soruCevaplari }));

      // Test cevaplarını yükle
      if (viewMode === 'test') {
        const cevaplar: Record<string, number | null> = {};
        sorular.forEach(soru => {
          const mevcut = mevcutCevaplar.find(c => c.soruId === soru.id);
          cevaplar[soru.id] = mevcut?.secilenSik ?? null;
        });
        setTestCevaplari(cevaplar);
        setCurrentSoruIndex(0);
      }
    }
  }, [selectedOdev, viewMode]);

  // Dersleri çıkar (filtreleme için)
  const courses = [...new Set(odevler.filter(o => o.course).map(o => o.course.ad))];

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

  // Dosya yükle (PDF, DOC, DOCX, resim vb.)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOdev) return;

    // Dosya boyutu kontrolü (15MB)
    if (file.size > 15 * 1024 * 1024) {
      alert('Dosya boyutu 15MB\'dan büyük olamaz');
      return;
    }

    setUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      // Token'dan userId'yi al
      const userId = JSON.parse(atob(token?.split('.')[1] || '{}')).userId;
      
      if (!userId) {
        alert('Kullanıcı bilgisi alınamadı');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      // Yeni endpoint: /api/upload/student/:ogrenciId/homework/:odevId
      const response = await fetch(`${API_URL}/upload/student/${userId}/homework/${selectedOdev.id}`, {
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
          dosyalar: [...prev.dosyalar, { 
            url: data.data.url, 
            ad: data.data.originalName || file.name, 
            boyut: data.data.size || file.size, 
            tip: data.data.mimeType || file.type 
          }]
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
  const handleTeslim = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!selectedOdev) return;
    setProcessing(true);

    try {
      // Test cevaplarını soruCevaplari'na dönüştür
      let finalSoruCevaplari = teslimData.soruCevaplari;
      
      if (viewMode === 'test' && selectedOdev.odevTipi === 'TEST') {
        finalSoruCevaplari = (selectedOdev.sorular || []).map(soru => ({
          soruId: soru.id,
          cevapMetni: '',
          resimUrl: '',
          secilenSik: testCevaplari[soru.id] ?? null
        }));
      }

      const payload = {
        aciklama: teslimData.aciklama,
        dosyaUrl: teslimData.dosyaUrl || undefined,
        dosyalar: teslimData.dosyalar.length > 0 ? teslimData.dosyalar : undefined,
        resimler: teslimData.resimler.length > 0 ? teslimData.resimler : undefined,
        soruCevaplari: finalSoruCevaplari.filter(c => c.cevapMetni || c.resimUrl || c.secilenSik !== null)
      };

      const response = await fetch(`${API_URL}/odevler/${selectedOdev.id}/teslim`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Ödev başarıyla teslim edildi!');
        setViewMode('liste');
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
    setTestCevaplari({});
    setCurrentSoruIndex(0);
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

  // Filtreleme ve sıralama
  const filteredAndSortedOdevler = odevler
    .filter(odev => {
      // Durum filtresi
      let statusMatch = true;
      switch (filterStatus) {
        case 'bekleyen':
          statusMatch = !odev.teslim && !odev.gecikmisMi;
          break;
        case 'teslim_edildi':
          statusMatch = odev.teslim?.durum === 'TESLIM_EDILDI';
          break;
        case 'degerlendirildi':
          statusMatch = odev.teslim?.durum === 'DEGERLENDIRILDI';
          break;
        case 'gecikmis':
          statusMatch = odev.gecikmisMi && !odev.teslim;
          break;
      }

      // Ders filtresi
      const courseMatch = filterCourse === 'hepsi' || odev.course?.ad === filterCourse;

      return statusMatch && courseMatch;
    })
    .sort((a, b) => {
      // Önce bekleyen (aktif) ödevleri en üste al
      const aAktif = !a.teslim && !a.gecikmisMi;
      const bAktif = !b.teslim && !b.gecikmisMi;
      
      if (aAktif && !bAktif) return -1;
      if (!aAktif && bAktif) return 1;
      
      // Sonra seçilen sıralamaya göre
      switch (sortBy) {
        case 'tarih_yeni':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'tarih_eski':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'son_teslim':
          // Yaklaşan teslim tarihi önce
          return new Date(a.sonTeslimTarihi).getTime() - new Date(b.sonTeslimTarihi).getTime();
        case 'puan':
          return b.maxPuan - a.maxPuan;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // İstatistikler
  const stats = {
    toplam: odevler.length,
    bekleyen: odevler.filter(o => !o.teslim && !o.gecikmisMi).length,
    teslimEdildi: odevler.filter(o => o.teslim?.durum === 'TESLIM_EDILDI').length,
    degerlendirildi: odevler.filter(o => o.teslim?.durum === 'DEGERLENDIRILDI').length,
    gecikmis: odevler.filter(o => o.gecikmisMi && !o.teslim).length
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

  // Ödev tipi badge'i
  const getOdevTipiBadge = (odev: Odev) => {
    const badges: Record<string, { icon: any; text: string; color: string }> = {
      'TEST': { icon: CheckSquare, text: 'Test', color: 'bg-indigo-100 text-indigo-700' },
      'SORU_CEVAP': { icon: PenTool, text: 'Soru-Cevap', color: 'bg-purple-100 text-purple-700' },
      'DOSYA_YUKLE': { icon: Upload, text: 'Dosya Yükle', color: 'bg-orange-100 text-orange-700' },
      'KLASIK': { icon: FileText, text: 'Klasik', color: 'bg-slate-100 text-slate-700' },
      'KARISIK': { icon: Layers, text: 'Karışık', color: 'bg-teal-100 text-teal-700' }
    };
    const badge = badges[odev.odevTipi] || badges['KLASIK'];
    const Icon = badge.icon;
    return (
      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
        <Icon size={12} />
        {badge.text}
      </span>
    );
  };

  // Test cevap seç
  const handleTestCevap = (soruId: string, sikIndex: number) => {
    setTestCevaplari(prev => ({
      ...prev,
      [soruId]: prev[soruId] === sikIndex ? null : sikIndex
    }));
  };

  // Loading
  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-[#F0F2F5]'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A884]"></div>
      </div>
    );
  }

  // Detay loading overlay
  if (detayLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-[#F0F2F5]'} flex flex-col items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A884] mb-4"></div>
        <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Ödev yükleniyor...</p>
      </div>
    );
  }

  // Ödev Detay Görünümü
  if (viewMode === 'detay' && selectedOdev) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-[#F0F2F5]'}`}>
        {/* Header */}
        <div className="bg-[#008069] text-white px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setViewMode('liste'); setSelectedOdev(null); }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-semibold">{selectedOdev.baslik}</h1>
                <p className="text-white/70 text-sm mt-0.5">{selectedOdev.course?.ad || 'Ders'} • {selectedOdev.ogretmen?.ad} {selectedOdev.ogretmen?.soyad}</p>
              </div>
              {getDurumBadge(selectedOdev)}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* Ödev Bilgileri */}
          <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-sm overflow-hidden mb-6`}>
            <div className="p-6">
              {/* Üst Bilgiler */}
              <div className="flex flex-wrap gap-3 mb-4">
                {getOdevTipiBadge(selectedOdev)}
                {(selectedOdev.sorular?.length || 0) > 0 && (
                  <span className={`px-2 py-0.5 ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'} rounded text-xs font-medium`}>
                    {selectedOdev.sorular.length} Soru
                  </span>
                )}
                <span className={`px-2 py-0.5 ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'} rounded text-xs font-medium`}>
                  Max: {selectedOdev.maxPuan} puan
                </span>
              </div>

              {/* Konu Başlığı */}
              {selectedOdev.konuBasligi && (
                <div className={`p-4 ${isDark ? 'bg-emerald-500/10' : 'bg-[#E7FCE8]'} rounded-xl mb-4`}>
                  <h3 className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-[#008069]'}`}>{selectedOdev.konuBasligi}</h3>
                </div>
              )}

              {/* Açıklama */}
              {selectedOdev.aciklama && (
                <div className="mb-4">
                  <h4 className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} mb-2`}>Açıklama</h4>
                  <p className={`${isDark ? 'text-slate-300 bg-slate-700/50' : 'text-slate-600 bg-slate-50'} p-4 rounded-lg`}>{selectedOdev.aciklama}</p>
                </div>
              )}

              {/* İçerik */}
              {selectedOdev.icerik && (
                <div className="mb-4">
                  <h4 className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} mb-2`}>İçerik</h4>
                  <div 
                    className={`prose prose-sm max-w-none p-4 rounded-lg ${isDark ? 'text-slate-300 bg-slate-700/50 prose-invert' : 'text-slate-600 bg-slate-50'}`}
                    dangerouslySetInnerHTML={{ __html: selectedOdev.icerik }}
                  />
                </div>
              )}

              {/* Resimler */}
              {(selectedOdev.resimler?.length || 0) > 0 && (
                <div className="mb-4">
                  <h4 className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} mb-2`}>Ekler ({selectedOdev.resimler.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedOdev.resimler.map((resim, index) => (
                      <div
                        key={index}
                        className={`aspect-square rounded-lg overflow-hidden border ${isDark ? 'border-slate-600' : 'border-slate-200'} cursor-pointer hover:opacity-80`}
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

              {/* Dosyalar */}
              {(selectedOdev.dosyalar?.length || 0) > 0 && (
                <div className="mb-4">
                  <h4 className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} mb-2`}>Dosyalar</h4>
                  <div className="space-y-2">
                    {selectedOdev.dosyalar.map((dosya: any, index: number) => (
                      <a
                        key={index}
                        href={dosya.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}
                      >
                        <Download size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                        <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{dosya.ad || `Dosya ${index + 1}`}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Sorular Önizleme (TEST tipi değilse) */}
              {(selectedOdev.sorular?.length || 0) > 0 && selectedOdev.odevTipi !== 'TEST' && (
                <div className="mb-4">
                  <h4 className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} mb-3`}>Sorular ({selectedOdev.sorular.length})</h4>
                  <div className="space-y-3">
                    {selectedOdev.sorular.map((soru, index) => (
                      <div key={soru.id} className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                        <div className="flex justify-between items-start">
                          <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Soru {index + 1}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                            {soru.puan} puan
                          </span>
                        </div>
                        <p className={`mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{soru.soruMetni}</p>
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
              <div className={`flex items-center gap-4 text-sm pt-4 border-t ${isDark ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-200'}`}>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Son: {formatDate(selectedOdev.sonTeslimTarihi)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>Oluşturulma: {formatDate(selectedOdev.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Teslim Durumu veya Çözme Butonu */}
            <div className={`px-6 py-4 border-t ${isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              {selectedOdev.teslim?.durum === 'DEGERLENDIRILDI' ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        {selectedOdev.teslim.puan}
                      </span>
                      <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>/ {selectedOdev.maxPuan}</span>
                    </div>
                    {selectedOdev.teslim.ogretmenYorumu && (
                      <p className={`text-sm mt-1 flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        <MessageSquare size={14} />
                        {selectedOdev.teslim.ogretmenYorumu}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Teslim: {formatDate(selectedOdev.teslim.teslimTarihi)}</p>
                  </div>
                </div>
              ) : selectedOdev.teslim?.durum === 'TESLIM_EDILDI' ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                      <Clock size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                    </div>
                    <div>
                      <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Teslim Edildi - Değerlendirme Bekleniyor</p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(selectedOdev.teslim.teslimTarihi)}</p>
                    </div>
                  </div>
                  {!selectedOdev.gecikmisMi && (
                    <button
                      onClick={() => {
                        if (selectedOdev.odevTipi === 'TEST') {
                          setViewMode('test');
                        } else {
                          setViewMode('cozum');
                        }
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                    >
                      Tekrar Gönder
                    </button>
                  )}
                </div>
              ) : selectedOdev.gecikmisMi ? (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                    <AlertTriangle size={20} className={isDark ? 'text-red-400' : 'text-red-600'} />
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>Süre Doldu</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bu ödevin teslim süresi geçti</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (selectedOdev.odevTipi === 'TEST') {
                      setViewMode('test');
                    } else {
                      setViewMode('cozum');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#00A884] text-white py-3 rounded-xl font-medium hover:bg-[#008069] transition-colors"
                >
                  <Play size={18} />
                  {selectedOdev.odevTipi === 'TEST' ? 'Testi Çöz' : 'Ödevi Çöz'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test Çözme Görünümü
  if (viewMode === 'test' && selectedOdev) {
    const sorular = selectedOdev.sorular || [];
    const currentSoru = sorular[currentSoruIndex];
    const cevaplanmis = Object.values(testCevaplari).filter(v => v !== null).length;
    const toplamSoru = sorular.length;

    return (
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Header */}
        <div className="bg-slate-800 px-4 sm:px-6 py-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (confirm('Testten çıkmak istediğinize emin misiniz? Cevaplarınız kaydedilmeyecek.')) {
                      setViewMode('detay');
                    }
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
                <div>
                  <h1 className="text-lg font-semibold">{selectedOdev.baslik}</h1>
                  <p className="text-slate-400 text-sm">{selectedOdev.course?.ad || 'Ders'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-[#00A884] font-bold">{cevaplanmis}</span>
                  <span className="text-slate-400">/{toplamSoru} Cevaplandı</span>
                </div>
                <button
                  onClick={() => {
                    if (cevaplanmis < toplamSoru) {
                      if (!confirm(`${toplamSoru - cevaplanmis} soru cevaplanmamış. Yine de teslim etmek istiyor musunuz?`)) {
                        return;
                      }
                    }
                    handleTeslim();
                  }}
                  disabled={processing}
                  className="px-4 py-2 bg-[#00A884] text-white rounded-lg hover:bg-[#008069] font-medium disabled:opacity-50"
                >
                  {processing ? 'Gönderiliyor...' : 'Testi Bitir'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* Soru Navigasyonu */}
          <div className="flex flex-wrap gap-2 mb-6">
            {sorular.map((soru, index) => {
              const cevaplandiMi = testCevaplari[soru.id] !== null && testCevaplari[soru.id] !== undefined;
              const aktifMi = index === currentSoruIndex;
              return (
                <button
                  key={soru.id}
                  onClick={() => setCurrentSoruIndex(index)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    aktifMi 
                      ? 'bg-[#00A884] text-white scale-110' 
                      : cevaplandiMi 
                        ? 'bg-green-600 text-white' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Soru Kartı */}
          {currentSoru && (
            <div className="bg-slate-800 rounded-2xl overflow-hidden">
              {/* Soru Başlığı */}
              <div className="p-4 bg-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-[#00A884] rounded-full flex items-center justify-center font-bold">
                    {currentSoruIndex + 1}
                  </span>
                  <span className="font-medium">Soru {currentSoruIndex + 1}</span>
                </div>
                <span className="text-sm bg-purple-500/30 text-purple-300 px-3 py-1 rounded-full">
                  {currentSoru.puan} puan
                </span>
              </div>

              {/* Soru İçeriği */}
              <div className="p-6">
                <p className="text-lg mb-6">{currentSoru.soruMetni}</p>
                
                {currentSoru.resimUrl && (
                  <div className="mb-6">
                    <img 
                      src={currentSoru.resimUrl} 
                      alt="Soru resmi" 
                      className="max-h-64 rounded-lg cursor-pointer hover:opacity-80"
                      onClick={() => {
                        setPreviewImage(currentSoru.resimUrl);
                        setShowPreviewModal(true);
                      }}
                    />
                  </div>
                )}

                {/* Şıklar */}
                {currentSoru.siklar && currentSoru.siklar.length > 0 && (
                  <div className="space-y-3">
                    {currentSoru.siklar.map((sik, sikIndex) => {
                      const secilenMi = testCevaplari[currentSoru.id] === sikIndex;
                      const sikHarfi = String.fromCharCode(65 + sikIndex); // A, B, C, D...
                      
                      return (
                        <button
                          key={sikIndex}
                          onClick={() => handleTestCevap(currentSoru.id, sikIndex)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                            secilenMi 
                              ? 'bg-[#00A884] text-white' 
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            secilenMi ? 'bg-white/20' : 'bg-slate-600'
                          }`}>
                            {sikHarfi}
                          </span>
                          <span className="flex-1">{sik}</span>
                          {secilenMi && <CheckCircle size={24} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Navigasyon */}
              <div className="p-4 bg-slate-700 flex items-center justify-between">
                <button
                  onClick={() => setCurrentSoruIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentSoruIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                  Önceki
                </button>
                <span className="text-slate-400">
                  {currentSoruIndex + 1} / {toplamSoru}
                </span>
                {currentSoruIndex === toplamSoru - 1 ? (
                  <button
                    onClick={() => {
                      if (cevaplanmis < toplamSoru) {
                        if (!confirm(`${toplamSoru - cevaplanmis} soru cevaplanmamış. Yine de teslim etmek istiyor musunuz?`)) {
                          return;
                        }
                      }
                      handleTeslim();
                    }}
                    disabled={processing}
                    className="flex items-center gap-2 px-5 py-2 bg-[#00A884] text-white rounded-lg hover:bg-[#008069] font-medium disabled:opacity-50"
                  >
                    {processing ? 'Gönderiliyor...' : 'Testi Bitir'}
                    <CheckCircle size={20} />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentSoruIndex(prev => Math.min(toplamSoru - 1, prev + 1))}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-500"
                  >
                    Sonraki
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>

              {/* Son soruda büyük Testi Bitir butonu */}
              {currentSoruIndex === toplamSoru - 1 && (
                <div className="p-4 pt-0">
                  <button
                    onClick={() => {
                      if (cevaplanmis < toplamSoru) {
                        if (!confirm(`${toplamSoru - cevaplanmis} soru cevaplanmamış. Yine de teslim etmek istiyor musunuz?`)) {
                          return;
                        }
                      }
                      handleTeslim();
                    }}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#00A884] to-[#008069] text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-[#00A884]/30 transition-all disabled:opacity-50"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={24} />
                        Testi Bitir ve Gönder
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Ödev Çözme Görünümü (Klasik/Soru-Cevap)
  if (viewMode === 'cozum' && selectedOdev) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-[#F0F2F5]'}`}>
        {/* Header */}
        <div className="bg-[#008069] text-white px-4 sm:px-6 py-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewMode('detay')}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h1 className="text-lg font-semibold">Ödev Çözümü</h1>
                  <p className="text-white/70 text-sm">{selectedOdev.baslik}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <form onSubmit={handleTeslim} className="space-y-6">
            {/* Sorular */}
            {(selectedOdev.sorular?.length || 0) > 0 && (
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Soruları Cevapla</h3>
                {selectedOdev.sorular.map((soru, index) => {
                  const cevap = teslimData.soruCevaplari.find(c => c.soruId === soru.id);
                  
                  return (
                    <div key={soru.id} className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-sm overflow-hidden`}>
                      <div className={`p-4 border-b ${isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Soru {index + 1}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                            {soru.puan} puan
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{soru.soruMetni}</p>
                        
                        {soru.resimUrl && (
                          <img 
                            src={soru.resimUrl} 
                            alt="Soru" 
                            className="max-h-48 rounded-lg mb-4 cursor-pointer hover:opacity-80"
                            onClick={() => {
                              setPreviewImage(soru.resimUrl);
                              setShowPreviewModal(true);
                            }}
                          />
                        )}

                        {/* Şıklar varsa */}
                        {soru.siklar && soru.siklar.length > 0 ? (
                          <div className="space-y-2">
                            {soru.siklar.map((sik, sikIndex) => {
                              const secilenMi = cevap?.secilenSik === sikIndex;
                              return (
                                <button
                                  key={sikIndex}
                                  type="button"
                                  onClick={() => {
                                    setTeslimData(prev => ({
                                      ...prev,
                                      soruCevaplari: prev.soruCevaplari.map(c =>
                                        c.soruId === soru.id 
                                          ? { ...c, secilenSik: secilenMi ? null : sikIndex }
                                          : c
                                      )
                                    }));
                                  }}
                                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                                    secilenMi 
                                      ? isDark 
                                        ? 'border-[#00A884] bg-[#00A884]/10' 
                                        : 'border-[#00A884] bg-[#E7FCE8]' 
                                      : isDark
                                        ? 'border-slate-600 hover:border-slate-500'
                                        : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                                    secilenMi 
                                      ? 'bg-[#00A884] text-white' 
                                      : isDark 
                                        ? 'bg-slate-600 text-slate-300' 
                                        : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {String.fromCharCode(65 + sikIndex)}
                                  </span>
                                  <span className={`flex-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{sik}</span>
                                  {secilenMi && <CheckCircle size={20} className="text-[#00A884]" />}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <>
                            <textarea
                              value={cevap?.cevapMetni || ''}
                              onChange={(e) => updateSoruCevap(soru.id, e.target.value)}
                              placeholder="Cevabınızı yazın..."
                              rows={4}
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A884] resize-none ${
                                isDark 
                                  ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500'
                                  : 'border-slate-200 text-slate-800 placeholder-slate-400'
                              }`}
                            />
                            
                            {/* Cevap Resmi */}
                            <div className="mt-3">
                              {cevap?.resimUrl ? (
                                <div className="relative w-32 h-32">
                                  <img src={cevap.resimUrl} alt="Cevap" className="w-full h-full object-cover rounded-lg" />
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
                                  className={`flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg hover:border-[#00A884] transition-colors text-sm ${
                                    isDark ? 'border-slate-600' : 'border-slate-300'
                                  }`}
                                >
                                  {uploading && currentSoruId.current === soru.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00A884]" />
                                  ) : (
                                    <ImageIcon size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                  )}
                                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Resim Ekle</span>
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Genel Dosya/Resim Yükleme */}
            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-sm p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Ek Dosyalar</h3>
              
              {/* Resim Yükle */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Resim Ekle
                </label>
                <div className="flex flex-wrap gap-2">
                  {teslimData.resimler.map((resim, index) => (
                    <div key={index} className={`relative w-20 h-20 rounded-lg overflow-hidden border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}>
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
                    className={`w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:border-[#00A884] transition-colors ${
                      isDark ? 'border-slate-600' : 'border-slate-300'
                    }`}
                  >
                    {uploading && !currentSoruId.current ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00A884]" />
                    ) : (
                      <>
                        <ImageIcon size={20} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                        <span className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ekle</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dosya Yükle */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Dosya Yükle
                </label>
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
                  className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer hover:border-[#00A884] transition-colors ${
                    teslimData.dosyaUrl 
                      ? 'border-green-500 bg-green-500/10' 
                      : isDark
                        ? 'border-slate-600 hover:bg-slate-700/50'
                        : 'border-slate-300 hover:bg-[#E7FCE8]/50'
                  }`}
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#00A884]"></div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Yükleniyor...</span>
                    </div>
                  ) : teslimData.dosyaUrl ? (
                    <div className={`flex items-center gap-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      <CheckCircle size={20} />
                      <span>Dosya yüklendi</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Dosya seçin</span>
                    </>
                  )}
                </button>
                {teslimData.dosyaUrl && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <a href={teslimData.dosyaUrl} target="_blank" rel="noopener noreferrer" className={`hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      Dosyayı önizle
                    </a>
                    <button
                      type="button"
                      onClick={() => setTeslimData(prev => ({ ...prev, dosyaUrl: '', dosyalar: [] }))}
                      className={`hover:underline ${isDark ? 'text-red-400' : 'text-red-600'}`}
                    >
                      Kaldır
                    </button>
                  </div>
                )}
              </div>

              {/* Açıklama */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Not (Opsiyonel)
                </label>
                <textarea
                  value={teslimData.aciklama}
                  onChange={(e) => setTeslimData(prev => ({ ...prev, aciklama: e.target.value }))}
                  placeholder="Öğretmeninize iletmek istediğiniz bir not..."
                  rows={2}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A884] resize-none ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500'
                      : 'border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Teslim Butonu */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setViewMode('detay')}
                className={`flex-1 px-4 py-3 border rounded-xl font-medium ${
                  isDark 
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700 bg-slate-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                }`}
              >
                Geri
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

          {/* Hidden inputs */}
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
    );
  }

  // Ana Liste Görünümü
  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-[#F0F2F5]'}`}>
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
                : isDark ? 'bg-slate-800 shadow-sm hover:shadow-md' : 'bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-bold ${filterStatus === 'hepsi' ? '' : isDark ? 'text-white' : 'text-slate-800'}`}>
              {stats.toplam}
            </div>
            <div className={`text-xs sm:text-sm ${filterStatus === 'hepsi' ? 'text-white/80' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Toplam
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('bekleyen')}
            className={`rounded-xl p-4 transition-all ${
              filterStatus === 'bekleyen' 
                ? 'bg-yellow-500 text-white shadow-lg scale-105' 
                : isDark ? 'bg-slate-800 shadow-sm hover:shadow-md' : 'bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-bold ${filterStatus === 'bekleyen' ? '' : isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {stats.bekleyen}
            </div>
            <div className={`text-xs sm:text-sm ${filterStatus === 'bekleyen' ? 'text-white/80' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Bekleyen
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('teslim_edildi')}
            className={`rounded-xl p-4 transition-all ${
              filterStatus === 'teslim_edildi' 
                ? 'bg-blue-500 text-white shadow-lg scale-105' 
                : isDark ? 'bg-slate-800 shadow-sm hover:shadow-md' : 'bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-bold ${filterStatus === 'teslim_edildi' ? '' : isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {stats.teslimEdildi}
            </div>
            <div className={`text-xs sm:text-sm ${filterStatus === 'teslim_edildi' ? 'text-white/80' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Teslim
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('degerlendirildi')}
            className={`rounded-xl p-4 transition-all ${
              filterStatus === 'degerlendirildi' 
                ? 'bg-green-500 text-white shadow-lg scale-105' 
                : isDark ? 'bg-slate-800 shadow-sm hover:shadow-md' : 'bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-bold ${filterStatus === 'degerlendirildi' ? '' : isDark ? 'text-green-400' : 'text-green-600'}`}>
              {stats.degerlendirildi}
            </div>
            <div className={`text-xs sm:text-sm ${filterStatus === 'degerlendirildi' ? 'text-white/80' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Puanlı
            </div>
          </button>

          <button
            onClick={() => setFilterStatus('gecikmis')}
            className={`rounded-xl p-4 transition-all col-span-2 sm:col-span-1 ${
              filterStatus === 'gecikmis' 
                ? 'bg-red-500 text-white shadow-lg scale-105' 
                : isDark ? 'bg-slate-800 shadow-sm hover:shadow-md' : 'bg-white shadow-sm hover:shadow-md'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-bold ${filterStatus === 'gecikmis' ? '' : isDark ? 'text-red-400' : 'text-red-600'}`}>
              {stats.gecikmis}
            </div>
            <div className={`text-xs sm:text-sm ${filterStatus === 'gecikmis' ? 'text-white/80' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gecikmiş
            </div>
          </button>
        </div>

        {/* Filtre ve Sıralama */}
        <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-sm p-3 mb-4 flex flex-wrap items-center gap-3`}>
          {/* Ders Filtresi */}
          <div className="flex items-center gap-2">
            <BookOpen size={16} className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className={`text-sm border-none bg-transparent focus:outline-none ${isDark ? 'text-slate-300' : 'text-slate-700'} cursor-pointer`}
            >
              <option value="hepsi">Tüm Dersler</option>
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div className={`w-px h-6 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

          {/* Sıralama */}
          <div className="flex items-center gap-2">
            <SortDesc size={16} className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className={`text-sm border-none bg-transparent focus:outline-none ${isDark ? 'text-slate-300' : 'text-slate-700'} cursor-pointer`}
            >
              <option value="tarih_yeni">En Yeni</option>
              <option value="son_teslim">Son Teslime Göre</option>
              <option value="tarih_eski">En Eski</option>
              <option value="puan">Puana Göre</option>
            </select>
          </div>

          <div className="flex-1"></div>

          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {filteredAndSortedOdevler.length} ödev
          </span>
        </div>

        {/* Ödev Listesi */}
        <div className="space-y-4">
          {filteredAndSortedOdevler.length === 0 ? (
            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-sm p-12 text-center`}>
              <FileText size={64} className={`mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <h3 className={`text-lg font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Bu kategoride ödev yok</h3>
              <p className={`${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>Farklı bir filtre seçerek diğer ödevleri görüntüleyebilirsin</p>
            </div>
          ) : (
            filteredAndSortedOdevler.map((odev) => {
              const kalanSure = getKalanSure(odev.sonTeslimTarihi);
              
              return (
                <div
                  key={odev.id}
                  className={`${isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white'} rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => selectOdev(odev)}
                >
                  {/* Üst Kısım - Ödev Bilgileri */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#E7FCE8] text-[#008069]'} rounded text-xs font-medium`}>
                            {odev.course?.ad || 'Ders'}
                          </span>
                          {getDurumBadge(odev)}
                          {getOdevTipiBadge(odev)}
                          {(odev.sorular?.length || 0) > 0 && (
                            <span className={`px-2 py-0.5 ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'} rounded text-xs font-medium`}>
                              {odev.sorular.length} Soru
                            </span>
                          )}
                        </div>
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'} mt-2 text-lg`}>{odev.baslik}</h3>
                        {odev.konuBasligi && (
                          <p className={`text-sm ${isDark ? 'text-emerald-400' : 'text-[#008069]'} mt-1 font-medium`}>{odev.konuBasligi}</p>
                        )}
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
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
                      <p className={`${isDark ? 'text-slate-300 bg-slate-700/50' : 'text-slate-600 bg-slate-50'} text-sm mt-3 p-3 rounded-lg line-clamp-2`}>
                        {odev.aciklama}
                      </p>
                    )}

                    {/* Tarihler */}
                    <div className={`flex items-center gap-4 mt-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} flex-wrap`}>
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
                  <div 
                    className={`px-4 sm:px-5 py-3 ${isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-slate-50 border-slate-100'} border-t`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {odev.teslim?.durum === 'DEGERLENDIRILDI' ? (
                      // Değerlendirilmiş
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-green-500">
                              {odev.teslim.puan}
                            </span>
                            <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ {odev.maxPuan}</span>
                          </div>
                          {odev.teslim.ogretmenYorumu && (
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1 flex items-center gap-1`}>
                              <MessageSquare size={14} />
                              {odev.teslim.ogretmenYorumu}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => selectOdev(odev)}
                          className={`flex items-center gap-2 ${isDark ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-[#008069] hover:bg-[#E7FCE8]'} px-3 py-2 rounded-lg transition-colors`}
                        >
                          <Eye size={16} />
                          Detay
                        </button>
                      </div>
                    ) : odev.teslim?.durum === 'TESLIM_EDILDI' ? (
                      // Teslim edilmiş - Değerlendirme bekliyor
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                            <Clock size={20} className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Değerlendirme Bekleniyor</p>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                              {formatDate(odev.teslim.teslimTarihi)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => selectOdev(odev)}
                          className={`flex items-center gap-2 ${isDark ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-[#008069] hover:bg-[#E7FCE8]'} px-3 py-2 rounded-lg transition-colors`}
                        >
                          <Eye size={16} />
                          Detay
                        </button>
                      </div>
                    ) : odev.gecikmisMi ? (
                      // Gecikmiş
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${isDark ? 'bg-red-500/20' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
                            <AlertTriangle size={20} className={`${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>Süre Doldu</p>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                              Bu ödevin süresi geçti
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => selectOdev(odev)}
                          className={`flex items-center gap-2 ${isDark ? 'text-slate-400 hover:bg-slate-600' : 'text-slate-500 hover:bg-slate-100'} px-3 py-2 rounded-lg transition-colors`}
                        >
                          <Eye size={16} />
                          Görüntüle
                        </button>
                      </div>
                    ) : (
                      // Teslim edilmemiş - Direkt çözüme geç
                      <button
                        onClick={() => selectOdev(odev, true)}
                        className="w-full flex items-center justify-center gap-2 bg-[#00A884] text-white py-3 rounded-xl font-medium hover:bg-[#008069] transition-colors"
                      >
                        <Play size={18} />
                        {odev.odevTipi === 'TEST' ? 'Testi Çöz' : 'Ödevi Çöz'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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
    </div>
  );
}
