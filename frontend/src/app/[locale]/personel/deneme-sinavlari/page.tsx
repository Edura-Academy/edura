'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaPlus, FaSearch, FaFilter, FaFileExcel, FaFileImport,
  FaChartBar, FaUsers, FaCalendarAlt, FaTrash, FaEdit,
  FaEye, FaTimes, FaDownload, FaUpload, FaCheck,
  FaGraduationCap, FaBook, FaSchool, FaBullseye, FaExchangeAlt,
  FaChartLine, FaArrowUp, FaArrowDown, FaMinus
} from 'react-icons/fa';

interface DenemeSinavi {
  id: string;
  ad: string;
  tur: 'TYT' | 'AYT' | 'LGS' | 'YDT' | 'KURUM_ICI';
  kurum: string | null;
  tarih: string;
  sinif?: { id: string; ad: string };
  olusturan: { id: string; ad: string; soyad: string };
  branslar: Record<string, number>;
  katilimciSayisi: number;
}

interface BransTanim {
  ad: string;
  soruSayisi: number;
}

interface Ogrenci {
  id: string;
  ad: string;
  soyad: string;
  ogrenciNo: string;
  sinif?: { ad: string };
}

const SINAV_TUR_RENKLERI: Record<string, string> = {
  TYT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  AYT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  LGS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  YDT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  KURUM_ICI: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400',
};

const SINAV_TUR_ACIKLAMA: Record<string, string> = {
  TYT: 'Temel Yeterlilik Testi',
  AYT: 'Alan Yeterlilik Testi',
  LGS: 'Liselere Geçiş Sınavı',
  YDT: 'Yabancı Dil Testi',
  KURUM_ICI: 'Kurum İçi Deneme',
};

export default function DenemeSinavlariPage() {
  const router = useRouter();
  const [sinavlar, setSinavlar] = useState<DenemeSinavi[]>([]);
  const [bransTanimlari, setBransTanimlari] = useState<Record<string, Record<string, BransTanim>>>({});
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtreler
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTur, setSelectedTur] = useState<string>('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSonucModal, setShowSonucModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHedefModal, setShowHedefModal] = useState(false);
  const [showKarsilastirmaModal, setShowKarsilastirmaModal] = useState(false);
  const [selectedSinav, setSelectedSinav] = useState<DenemeSinavi | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Hedef form
  const [hedefOgrenciId, setHedefOgrenciId] = useState('');
  const [hedefNet, setHedefNet] = useState('');
  const [hedefSiralama, setHedefSiralama] = useState('');
  
  // Karşılaştırma
  const [karsilastirmaOgrenci1, setKarsilastirmaOgrenci1] = useState('');
  const [karsilastirmaOgrenci2, setKarsilastirmaOgrenci2] = useState('');
  const [karsilastirmaSonuc, setKarsilastirmaSonuc] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    ad: '',
    tur: 'TYT' as 'TYT' | 'AYT' | 'LGS',
    kurum: '',
    tarih: new Date().toISOString().split('T')[0],
    sinifId: '',
    aciklama: ''
  });
  
  // Sonuç giriş states
  const [selectedOgrenci, setSelectedOgrenci] = useState<string>('');
  const [sonucBranslar, setSonucBranslar] = useState<Record<string, { dogru: number; yanlis: number; bos: number }>>({});
  
  // Import states
  const [importContent, setImportContent] = useState('');
  const [importType, setImportType] = useState<'csv' | 'json'>('csv');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchSinavlar = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedTur) params.append('tur', selectedTur);
      
      const response = await fetch(`${API_URL}/deneme?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSinavlar(data.data);
      }
    } catch (err) {
      setError('Sınavlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [API_URL, selectedTur]);

  const fetchBransTanimlari = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/deneme/brans-tanimlari`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setBransTanimlari(data.data);
      }
    } catch (err) {
      console.error('Branş tanımları yüklenemedi', err);
    }
  }, [API_URL]);

  const fetchOgrenciler = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users?role=ogrenci`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOgrenciler(data.data);
      }
    } catch (err) {
      console.error('Öğrenciler yüklenemedi', err);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchSinavlar();
    fetchBransTanimlari();
    fetchOgrenciler();
  }, [fetchSinavlar, fetchBransTanimlari, fetchOgrenciler]);

  // Filtreleme
  const filteredSinavlar = sinavlar.filter(sinav => {
    const searchMatch = sinav.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (sinav.kurum?.toLowerCase().includes(searchTerm.toLowerCase()));
    return searchMatch;
  });

  // Sınav oluştur
  const handleCreateSinav = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/deneme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setFormData({ ad: '', tur: 'TYT', kurum: '', tarih: new Date().toISOString().split('T')[0], sinifId: '', aciklama: '' });
        fetchSinavlar();
      } else {
        alert(data.message || 'Sınav oluşturulamadı');
      }
    } catch (err) {
      alert('Bir hata oluştu');
    }
  };

  // Sınav sil
  const handleDeleteSinav = async (id: string) => {
    if (!confirm('Bu sınavı silmek istediğinize emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/deneme/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchSinavlar();
      } else {
        alert(data.message || 'Sınav silinemedi');
      }
    } catch (err) {
      alert('Bir hata oluştu');
    }
  };

  // Sonuç giriş modalını aç
  const openSonucModal = (sinav: DenemeSinavi) => {
    setSelectedSinav(sinav);
    const branslar = bransTanimlari[sinav.tur] || {};
    const initialBranslar: Record<string, { dogru: number; yanlis: number; bos: number }> = {};
    Object.keys(branslar).forEach(key => {
      initialBranslar[key] = { dogru: 0, yanlis: 0, bos: branslar[key].soruSayisi };
    });
    setSonucBranslar(initialBranslar);
    setSelectedOgrenci('');
    setShowSonucModal(true);
  };

  // Sonuç kaydet
  const handleSaveSonuc = async () => {
    if (!selectedOgrenci || !selectedSinav) {
      alert('Lütfen öğrenci seçiniz');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/deneme/sonuc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sinavId: selectedSinav.id,
          ogrenciId: selectedOgrenci,
          branslar: sonucBranslar
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Sonuç kaydedildi');
        setShowSonucModal(false);
        fetchSinavlar();
      } else {
        alert(data.message || 'Sonuç kaydedilemedi');
      }
    } catch (err) {
      alert('Bir hata oluştu');
    }
  };

  // Import
  const handleImport = async () => {
    if (!selectedSinav || !importContent.trim()) {
      alert('Lütfen içerik giriniz');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = importType === 'csv' ? '/deneme/import/csv' : '/deneme/import/json';
      const body = importType === 'csv' 
        ? { sinavId: selectedSinav.id, csvContent: importContent }
        : { sinavId: selectedSinav.id, jsonContent: importContent };
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        alert(`${data.data.basarili} sonuç başarıyla eklendi${data.data.hatali > 0 ? `, ${data.data.hatali} hatalı` : ''}`);
        setShowImportModal(false);
        setImportContent('');
        fetchSinavlar();
      } else {
        alert(data.message || 'Import başarısız');
      }
    } catch (err) {
      alert('Bir hata oluştu');
    }
  };

  // Şablon indir
  const downloadTemplate = () => {
    if (!selectedSinav) return;
    window.open(`${API_URL}/deneme/template/csv?tur=${selectedSinav.tur}`, '_blank');
  };

  // Branş giriş değişikliği
  const handleBransChange = (brans: string, field: 'dogru' | 'yanlis', value: number) => {
    const bransInfo = bransTanimlari[selectedSinav?.tur || 'TYT']?.[brans];
    if (!bransInfo) return;
    
    const maxSoru = bransInfo.soruSayisi;
    const newValue = Math.max(0, Math.min(value, maxSoru));
    
    setSonucBranslar(prev => {
      const current = prev[brans] || { dogru: 0, yanlis: 0, bos: maxSoru };
      const newData = { ...current, [field]: newValue };
      
      // Boş hesapla
      const dogru = field === 'dogru' ? newValue : current.dogru;
      const yanlis = field === 'yanlis' ? newValue : current.yanlis;
      newData.bos = Math.max(0, maxSoru - dogru - yanlis);
      
      // Eğer doğru + yanlış > max ise, yanlışı düşür
      if (dogru + yanlis > maxSoru) {
        if (field === 'dogru') {
          newData.yanlis = maxSoru - dogru;
        } else {
          newData.dogru = maxSoru - yanlis;
        }
        newData.bos = 0;
      }
      
      return { ...prev, [brans]: newData };
    });
  };

  // Net hesapla
  const hesaplaNet = (dogru: number, yanlis: number) => {
    return (dogru - yanlis / 4).toFixed(2);
  };

  // Hedef belirle
  const handleSetHedef = async () => {
    if (!selectedSinav || !hedefOgrenciId) {
      alert('Lütfen öğrenci seçiniz');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/deneme/hedef`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sinavId: selectedSinav.id,
          ogrenciId: hedefOgrenciId,
          hedefNet: hedefNet ? parseFloat(hedefNet) : null,
          hedefSiralama: hedefSiralama ? parseInt(hedefSiralama) : null
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Hedef kaydedildi!');
        setShowHedefModal(false);
        setHedefOgrenciId('');
        setHedefNet('');
        setHedefSiralama('');
      } else {
        alert(data.message || 'Hedef kaydedilemedi');
      }
    } catch (err) {
      alert('Bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Karşılaştırma yap
  const handleKarsilastir = async () => {
    if (!selectedSinav || !karsilastirmaOgrenci1 || !karsilastirmaOgrenci2) {
      alert('Lütfen iki öğrenci seçiniz');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/deneme/karsilastirma?sinavId=${selectedSinav.id}&ogrenci1Id=${karsilastirmaOgrenci1}&ogrenci2Id=${karsilastirmaOgrenci2}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setKarsilastirmaSonuc(data.data);
      } else {
        alert(data.message || 'Karşılaştırma yapılamadı');
      }
    } catch (err) {
      alert('Bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Excel export
  const handleExcelExport = async () => {
    if (!selectedSinav) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/deneme/${selectedSinav.id}/export/excel`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedSinav.ad}-sonuclar.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert('Export başarısız');
      }
    } catch (err) {
      alert('Bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <FaGraduationCap className="text-blue-600" />
              Deneme Sınavları
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              TYT, AYT ve LGS deneme sınavı sonuçlarını yönetin
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            <FaPlus /> Yeni Deneme Sınavı
          </button>
        </div>

        {/* Filtreler */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Sınav ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedTur}
              onChange={(e) => setSelectedTur(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Türler</option>
              <option value="TYT">TYT</option>
              <option value="AYT">AYT</option>
              <option value="LGS">LGS</option>
            </select>
          </div>
        </div>

        {/* Sınavlar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSinavlar.map(sinav => (
            <div
              key={sinav.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${SINAV_TUR_RENKLERI[sinav.tur]}`}>
                    {sinav.tur}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setSelectedSinav(sinav); setShowDetailModal(true); }}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Detay"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleDeleteSinav(sinav.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {sinav.ad}
                </h3>
                
                {sinav.kurum && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                    <FaSchool /> {sinav.kurum}
                  </p>
                )}
                
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-4">
                  <FaCalendarAlt /> {new Date(sinav.tarih).toLocaleDateString('tr-TR')}
                </p>
                
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <FaUsers /> {sinav.katilimciSayisi} öğrenci
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openSonucModal(sinav)}
                      className="px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      title="Sonuç Gir"
                    >
                      <FaPlus />
                    </button>
                    <button
                      onClick={() => { setSelectedSinav(sinav); setShowHedefModal(true); }}
                      className="px-3 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                      title="Hedef Belirle"
                    >
                      <FaBullseye />
                    </button>
                    <button
                      onClick={() => { setSelectedSinav(sinav); setKarsilastirmaSonuc(null); setShowKarsilastirmaModal(true); }}
                      className="px-3 py-1.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      title="Karşılaştır"
                    >
                      <FaExchangeAlt />
                    </button>
                    <button
                      onClick={() => { setSelectedSinav(sinav); setShowImportModal(true); }}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      title="İçe Aktar"
                    >
                      <FaFileImport />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSinavlar.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <FaBook className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Henüz deneme sınavı yok
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              Yeni bir deneme sınavı oluşturarak başlayın
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="inline mr-2" /> Yeni Sınav Oluştur
            </button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Yeni Deneme Sınavı
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sınav Adı
                  </label>
                  <input
                    type="text"
                    value={formData.ad}
                    onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                    placeholder="Örn: Kasım TYT Denemesi"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sınav Türü
                    </label>
                    <select
                      value={formData.tur}
                      onChange={(e) => setFormData({ ...formData, tur: e.target.value as any })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                    >
                      <option value="TYT">TYT (Lise)</option>
                      <option value="AYT">AYT (Lise)</option>
                      <option value="LGS">LGS (Ortaokul)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tarih
                    </label>
                    <input
                      type="date"
                      value={formData.tarih}
                      onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kurum (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={formData.kurum}
                    onChange={(e) => setFormData({ ...formData, kurum: e.target.value })}
                    placeholder="Örn: Bilgi Sarmal, Limit, vb."
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Açıklama (Opsiyonel)
                  </label>
                  <textarea
                    value={formData.aciklama}
                    onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>{SINAV_TUR_ACIKLAMA[formData.tur]}</strong> branşları ve soru sayıları otomatik olarak ayarlanacaktır.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateSinav}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sonuç Giriş Modal */}
        {showSonucModal && selectedSinav && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl my-8">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Sonuç Girişi
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedSinav.ad}
                  </p>
                </div>
                <button
                  onClick={() => setShowSonucModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Öğrenci Seçimi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Öğrenci
                  </label>
                  <select
                    value={selectedOgrenci}
                    onChange={(e) => setSelectedOgrenci(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    <option value="">Öğrenci Seçiniz</option>
                    {ogrenciler.map(ogr => (
                      <option key={ogr.id} value={ogr.id}>
                        {ogr.ogrenciNo} - {ogr.ad} {ogr.soyad} {ogr.sinif ? `(${ogr.sinif.ad})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branş Sonuçları */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">Branş Sonuçları</h3>
                  {Object.entries(bransTanimlari[selectedSinav.tur] || {}).map(([key, info]) => (
                    <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800 dark:text-white">
                          {info.ad}
                        </span>
                        <span className="text-sm text-gray-500">
                          {info.soruSayisi} soru
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Doğru</label>
                          <input
                            type="number"
                            min="0"
                            max={info.soruSayisi}
                            value={sonucBranslar[key]?.dogru || 0}
                            onChange={(e) => handleBransChange(key, 'dogru', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Yanlış</label>
                          <input
                            type="number"
                            min="0"
                            max={info.soruSayisi}
                            value={sonucBranslar[key]?.yanlis || 0}
                            onChange={(e) => handleBransChange(key, 'yanlis', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Boş</label>
                          <div className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-center">
                            {sonucBranslar[key]?.bos || info.soruSayisi}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Net</label>
                          <div className="px-3 py-2 border border-green-200 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-center font-semibold">
                            {hesaplaNet(sonucBranslar[key]?.dogru || 0, sonucBranslar[key]?.yanlis || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Toplam */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-800 dark:text-blue-400">Toplam Net</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {Object.values(sonucBranslar).reduce((acc, b) => acc + parseFloat(hesaplaNet(b.dogru, b.yanlis)), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowSonucModal(false)}
                  className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveSonuc}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2"
                >
                  <FaCheck /> Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && selectedSinav && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Toplu Sonuç İçe Aktar
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedSinav.ad}
                  </p>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {/* Format seçimi */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setImportType('csv')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      importType === 'csv'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <FaFileExcel className={`text-2xl mx-auto mb-2 ${importType === 'csv' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className={`font-medium ${importType === 'csv' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>CSV</p>
                  </button>
                  <button
                    onClick={() => setImportType('json')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      importType === 'json'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <FaFileImport className={`text-2xl mx-auto mb-2 ${importType === 'json' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className={`font-medium ${importType === 'json' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>JSON</p>
                  </button>
                </div>

                {/* Şablon indirme */}
                <button
                  onClick={downloadTemplate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <FaDownload /> Örnek {importType.toUpperCase()} Şablonu İndir
                </button>

                {/* İçerik */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {importType.toUpperCase()} İçeriği
                  </label>
                  <textarea
                    value={importContent}
                    onChange={(e) => setImportContent(e.target.value)}
                    rows={10}
                    placeholder={importType === 'csv' ? 'Ogrenci_No,Turkce_Dogru,Turkce_Yanlis,...' : '[\n  { "ogrenciNo": "12345", "branslar": { ... } }\n]'}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={handleImport}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaUpload /> İçe Aktar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hedef Modal */}
        {showHedefModal && selectedSinav && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <FaBullseye className="text-amber-500" /> Hedef Belirle
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSinav.ad}</p>
                </div>
                <button
                  onClick={() => setShowHedefModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Öğrenci
                  </label>
                  <select
                    value={hedefOgrenciId}
                    onChange={(e) => setHedefOgrenciId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    <option value="">Öğrenci Seçiniz</option>
                    {ogrenciler.map(ogr => (
                      <option key={ogr.id} value={ogr.id}>
                        {ogr.ogrenciNo} - {ogr.ad} {ogr.soyad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hedef Net
                    </label>
                    <input
                      type="number"
                      value={hedefNet}
                      onChange={(e) => setHedefNet(e.target.value)}
                      step="0.25"
                      placeholder="Örn: 85.5"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hedef Sıralama
                    </label>
                    <input
                      type="number"
                      value={hedefSiralama}
                      onChange={(e) => setHedefSiralama(e.target.value)}
                      placeholder="Örn: 50000"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Öğrenci için net ve/veya sıralama hedefi belirleyebilirsiniz. Sonuçlar hedeflerle karşılaştırılarak gösterilecektir.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowHedefModal(false)}
                  className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={handleSetHedef}
                  disabled={processing || !hedefOgrenciId}
                  className="px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {processing ? '...' : <><FaBullseye /> Kaydet</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Karşılaştırma Modal */}
        {showKarsilastirmaModal && selectedSinav && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl my-8">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <FaExchangeAlt className="text-purple-500" /> Öğrenci Karşılaştırması
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSinav.ad}</p>
                </div>
                <button
                  onClick={() => setShowKarsilastirmaModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      1. Öğrenci
                    </label>
                    <select
                      value={karsilastirmaOgrenci1}
                      onChange={(e) => setKarsilastirmaOgrenci1(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                    >
                      <option value="">Öğrenci Seçiniz</option>
                      {ogrenciler.map(ogr => (
                        <option key={ogr.id} value={ogr.id}>
                          {ogr.ogrenciNo} - {ogr.ad} {ogr.soyad}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      2. Öğrenci
                    </label>
                    <select
                      value={karsilastirmaOgrenci2}
                      onChange={(e) => setKarsilastirmaOgrenci2(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                    >
                      <option value="">Öğrenci Seçiniz</option>
                      {ogrenciler.map(ogr => (
                        <option key={ogr.id} value={ogr.id}>
                          {ogr.ogrenciNo} - {ogr.ad} {ogr.soyad}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleKarsilastir}
                  disabled={processing || !karsilastirmaOgrenci1 || !karsilastirmaOgrenci2}
                  className="w-full px-5 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 font-medium"
                >
                  {processing ? 'Karşılaştırılıyor...' : 'Karşılaştır'}
                </button>

                {/* Sonuçlar */}
                {karsilastirmaSonuc && (
                  <div className="mt-6 space-y-4">
                    {/* Özet Kartları */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-400">
                          {karsilastirmaSonuc.ogrenci1?.ad} {karsilastirmaSonuc.ogrenci1?.soyad}
                        </h4>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                          {karsilastirmaSonuc.ogrenci1?.toplamNet?.toFixed(2) || '0'}
                        </p>
                        <p className="text-sm text-blue-600/70">Toplam Net</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                        <h4 className="font-semibold text-purple-800 dark:text-purple-400">
                          {karsilastirmaSonuc.ogrenci2?.ad} {karsilastirmaSonuc.ogrenci2?.soyad}
                        </h4>
                        <p className="text-3xl font-bold text-purple-600 mt-2">
                          {karsilastirmaSonuc.ogrenci2?.toplamNet?.toFixed(2) || '0'}
                        </p>
                        <p className="text-sm text-purple-600/70">Toplam Net</p>
                      </div>
                    </div>

                    {/* Branş Karşılaştırması */}
                    {karsilastirmaSonuc.bransKarsilastirmasi && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Branş Karşılaştırması</h4>
                        <div className="space-y-2">
                          {Object.entries(karsilastirmaSonuc.bransKarsilastirmasi).map(([brans, data]: [string, any]) => (
                            <div key={brans} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{brans}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-blue-600 font-semibold">{data.ogrenci1?.toFixed(2) || '0'}</span>
                                <span className={`text-sm ${data.fark > 0 ? 'text-green-500' : data.fark < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                  {data.fark > 0 ? <FaArrowUp className="inline" /> : data.fark < 0 ? <FaArrowDown className="inline" /> : <FaMinus className="inline" />}
                                  {' '}{Math.abs(data.fark || 0).toFixed(2)}
                                </span>
                                <span className="text-purple-600 font-semibold">{data.ogrenci2?.toFixed(2) || '0'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedSinav && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl my-8">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${SINAV_TUR_RENKLERI[selectedSinav.tur]}`}>
                      {selectedSinav.tur}
                    </span>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                      {selectedSinav.ad}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedSinav.kurum && `${selectedSinav.kurum} • `}
                    {new Date(selectedSinav.tarih).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    Katılımcılar ({selectedSinav.katilimciSayisi})
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => openSonucModal(selectedSinav)}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm"
                    >
                      <FaPlus className="inline mr-1" /> Sonuç Ekle
                    </button>
                    <button
                      onClick={() => { setShowHedefModal(true); setShowDetailModal(false); }}
                      className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm"
                    >
                      <FaBullseye className="inline mr-1" /> Hedef Belirle
                    </button>
                    <button
                      onClick={() => { setKarsilastirmaSonuc(null); setShowKarsilastirmaModal(true); setShowDetailModal(false); }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm"
                    >
                      <FaExchangeAlt className="inline mr-1" /> Karşılaştır
                    </button>
                    <button
                      onClick={handleExcelExport}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm"
                    >
                      <FaFileExcel className="inline mr-1" /> Excel Export
                    </button>
                    <button
                      onClick={() => router.push(`/personel/deneme-sinavlari/${selectedSinav.id}/analiz`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm"
                    >
                      <FaChartBar className="inline mr-1" /> Detaylı Analiz
                    </button>
                  </div>
                </div>
                
                {selectedSinav.katilimciSayisi === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Henüz sonuç girilmemiş
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                    Detaylı analiz için &quot;Detaylı Analiz&quot; butonuna tıklayın
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

