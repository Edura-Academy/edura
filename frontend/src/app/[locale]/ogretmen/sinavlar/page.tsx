'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Search, FileQuestion, Clock, Users,
  CheckCircle, Play, Eye, Trash2, Edit, 
  BarChart2, XCircle, Loader2, Calendar, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/RoleGuard';

interface Sinav {
  id: string;
  baslik: string;
  aciklama: string | null;
  course: { id: string; ad: string };
  sure: number;
  baslangicTarihi: string;
  bitisTarihi: string;
  durum: string;
  karistir: boolean;
  geriDonus: boolean;
  sonucGoster: boolean;
  soruSayisi: number;
  katilimciSayisi: number;
  tamamlayanSayisi: number;
}

interface Course {
  id: string;
  ad: string;
}

interface Soru {
  id?: string;
  soruMetni: string;
  soruTipi: string;
  puan: number;
  secenekler: string[];
  dogruCevap: string;
}

// Tüm branşlar/dersler listesi (deneme sınavları için)
const TÜMBRANSLAR: Course[] = [
  { id: 'turkce', ad: 'Türkçe' },
  { id: 'matematik', ad: 'Matematik' },
  { id: 'fizik', ad: 'Fizik' },
  { id: 'kimya', ad: 'Kimya' },
  { id: 'biyoloji', ad: 'Biyoloji' },
  { id: 'tarih', ad: 'Tarih' },
  { id: 'cografya', ad: 'Coğrafya' },
  { id: 'felsefe', ad: 'Felsefe' },
  { id: 'ingilizce', ad: 'İngilizce' },
  { id: 'almanca', ad: 'Almanca' },
  { id: 'edebiyat', ad: 'Edebiyat' },
  { id: 'din', ad: 'Din Kültürü' },
  { id: 'geometri', ad: 'Geometri' },
  { id: 'problemler', ad: 'Problemler' },
  { id: 'paragraf', ad: 'Paragraf' },
  { id: 'genel', ad: 'Genel Deneme' },
];

function OgretmenSinavlarContent() {
  const router = useRouter();
  const [sinavlar, setSinavlar] = useState<Sinav[]>([]);
  const [dersler, setDersler] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [durumFilter, setDurumFilter] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [puanUyarisi, setPuanUyarisi] = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Yeni sınav form
  const [newSinav, setNewSinav] = useState({
    baslik: '',
    aciklama: '',
    courseId: '',
    sure: 60,
    baslangicTarihi: '',
    bitisTarihi: '',
    maksimumPuan: 100,
    karistir: true,
    geriDonus: false,
    sonucGoster: true
  });

  // Sorular
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [currentSoru, setCurrentSoru] = useState<Soru>({
    soruMetni: '',
    soruTipi: 'COKTAN_SECMELI',
    puan: 10,
    secenekler: ['', '', '', '', ''],
    dogruCevap: 'A'
  });

  // Toplam puan hesaplama
  const toplamPuan = useMemo(() => {
    return sorular.reduce((sum, s) => sum + s.puan, 0);
  }, [sorular]);

  // Puan aşımı kontrolü
  const puanAsimi = useMemo(() => {
    return toplamPuan > newSinav.maksimumPuan;
  }, [toplamPuan, newSinav.maksimumPuan]);

  // Bitiş tarihini otomatik hesapla (yerel zaman formatında)
  useEffect(() => {
    if (newSinav.baslangicTarihi && newSinav.sure > 0) {
      const baslangic = new Date(newSinav.baslangicTarihi);
      const bitis = new Date(baslangic.getTime() + newSinav.sure * 60 * 1000);
      
      // Yerel zaman formatında string oluştur (YYYY-MM-DDTHH:mm)
      const year = bitis.getFullYear();
      const month = String(bitis.getMonth() + 1).padStart(2, '0');
      const day = String(bitis.getDate()).padStart(2, '0');
      const hours = String(bitis.getHours()).padStart(2, '0');
      const minutes = String(bitis.getMinutes()).padStart(2, '0');
      const bitisTarihiStr = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      setNewSinav(prev => ({ ...prev, bitisTarihi: bitisTarihiStr }));
    } else if (!newSinav.baslangicTarihi) {
      setNewSinav(prev => ({ ...prev, bitisTarihi: '' }));
    }
  }, [newSinav.baslangicTarihi, newSinav.sure]);

  // Puan aşımı uyarısı
  useEffect(() => {
    if (puanAsimi) {
      setPuanUyarisi(`Toplam puan (${toplamPuan}) maksimum puanı (${newSinav.maksimumPuan}) aşıyor!`);
    } else {
      setPuanUyarisi('');
    }
  }, [puanAsimi, toplamPuan, newSinav.maksimumPuan]);

  useEffect(() => {
    fetchSinavlar();
    fetchDersler();
  }, []);

  const fetchSinavlar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/ogretmen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setSinavlar(result.data || []);
      }
    } catch (error) {
      console.error('Sınavlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDersler = async () => {
    try {
      const token = localStorage.getItem('token');
      // Tüm dersleri getir (öğretmen kısıtlaması olmadan)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        const apiDersler = result.data || result || [];
        // API'den gelen dersler ile sabit branşları birleştir
        const tumDersler = [...TÜMBRANSLAR];
        apiDersler.forEach((d: Course) => {
          if (!tumDersler.find(t => t.id === d.id || t.ad.toLowerCase() === d.ad.toLowerCase())) {
            tumDersler.push(d);
          }
        });
        setDersler(tumDersler);
      } else {
        // API başarısız olursa sabit listeyi kullan
        setDersler(TÜMBRANSLAR);
      }
    } catch (error) {
      console.error('Dersler yüklenemedi:', error);
      // Hata durumunda sabit listeyi kullan
      setDersler(TÜMBRANSLAR);
    }
  };

  const handleCreateSinav = async () => {
    // Validasyonlar
    if (!newSinav.baslik.trim()) {
      showAlert('Sınav başlığı gereklidir.');
      return;
    }
    if (!newSinav.courseId) {
      showAlert('Lütfen bir ders/branş seçin.');
      return;
    }
    if (!newSinav.baslangicTarihi) {
      showAlert('Başlangıç tarihi gereklidir.');
      return;
    }
    if (sorular.length === 0) {
      showAlert('En az bir soru eklemelisiniz.');
      return;
    }
    if (puanAsimi) {
      showAlert(`Toplam puan (${toplamPuan.toFixed(2)}) maksimum puanı (${newSinav.maksimumPuan}) aşıyor!\n\nLütfen soru puanlarını düzenleyin veya maksimum puanı artırın.`);
      return;
    }
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      
      // Seçilen dersin adını bul
      const secilenDers = dersler.find(d => d.id === newSinav.courseId);
      
      // Sabit branş mı yoksa gerçek course mu kontrol et
      const isSabitBrans = TÜMBRANSLAR.some(b => b.id === newSinav.courseId);
      
      const payload = {
        baslik: newSinav.baslik,
        aciklama: newSinav.aciklama,
        // Sabit branş ise courseId olarak null gönder, sadece dersAdi kullan
        courseId: isSabitBrans ? null : newSinav.courseId,
        dersAdi: secilenDers?.ad || newSinav.courseId,
        bransKodu: isSabitBrans ? newSinav.courseId : null,
        sure: newSinav.sure,
        baslangicTarihi: newSinav.baslangicTarihi,
        bitisTarihi: newSinav.bitisTarihi,
        maksimumPuan: newSinav.maksimumPuan,
        karistir: newSinav.karistir,
        geriDonus: newSinav.geriDonus,
        sonucGoster: newSinav.sonucGoster,
        sorular: sorular.map((s, index) => ({
          ...s,
          sira: index + 1
        }))
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        fetchSinavlar();
        showAlert('🎉 Sınav başarıyla oluşturuldu!');
      } else {
        const errorData = await response.json();
        showAlert(errorData.message || 'Sınav oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Sınav oluşturma hatası:', error);
      showAlert('Sınav oluşturulurken bir bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setNewSinav({
      baslik: '', 
      aciklama: '', 
      courseId: '', 
      sure: 60,
      baslangicTarihi: '', 
      bitisTarihi: '',
      maksimumPuan: 100,
      karistir: true, 
      geriDonus: false, 
      sonucGoster: true
    });
    setSorular([]);
    setCurrentSoru({
      soruMetni: '',
      soruTipi: 'COKTAN_SECMELI',
      puan: 10,
      secenekler: ['', '', '', '', ''],
      dogruCevap: 'A'
    });
    setPuanUyarisi('');
  };

  const handlePublishSinav = async (sinavId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/ogretmen/${sinavId}/yayinla`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchSinavlar();
        alert('Sınav yayınlandı!');
      } else {
        const result = await response.json();
        alert(result.message || 'Yayınlama başarısız');
      }
    } catch (error) {
      console.error('Yayınlama hatası:', error);
    }
  };

  // Modal uyarı göster
  const showAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  const addSoru = () => {
    if (!currentSoru.soruMetni.trim()) {
      showAlert('Soru metni gereklidir.');
      return;
    }
    if (currentSoru.puan <= 0) {
      showAlert('Puan 0\'dan büyük olmalıdır.');
      return;
    }
    
    // Yeni soru eklendiğinde puan aşımı kontrolü
    const yeniToplamPuan = toplamPuan + currentSoru.puan;
    if (yeniToplamPuan > newSinav.maksimumPuan) {
      showAlert(`Bu soru eklendiğinde toplam puan ${yeniToplamPuan.toFixed(2)} olacak ve maksimum puanı (${newSinav.maksimumPuan}) aşacaktır.\n\nLütfen önce soru puanını düşürün veya maksimum puanı artırın.`);
      return;
    }
    
    setSorular([...sorular, { ...currentSoru }]);
    setCurrentSoru({
      soruMetni: '',
      soruTipi: 'COKTAN_SECMELI',
      puan: 10,
      secenekler: ['', '', '', '', ''],
      dogruCevap: 'A'
    });
  };

  const removeSoru = (index: number) => {
    setSorular(sorular.filter((_, i) => i !== index));
  };

  const getDurumConfig = (durum: string) => {
    const configs: Record<string, { label: string; color: string; bg: string }> = {
      TASLAK: { label: 'Taslak', color: 'text-slate-600', bg: 'bg-slate-100' },
      AKTIF: { label: 'Aktif', color: 'text-green-600', bg: 'bg-green-100' },
      SONA_ERDI: { label: 'Sona Erdi', color: 'text-amber-600', bg: 'bg-amber-100' },
      IPTAL: { label: 'İptal', color: 'text-red-600', bg: 'bg-red-100' }
    };
    return configs[durum] || configs.TASLAK;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredSinavlar = sinavlar.filter(sinav => {
    const matchSearch = searchTerm === '' || 
      sinav.baslik.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDurum = durumFilter === '' || sinav.durum === durumFilter;
    return matchSearch && matchDurum;
  });

  // Buton aktiflik kontrolü
  const isFormValid = useMemo(() => {
    return (
      newSinav.baslik.trim() !== '' &&
      newSinav.courseId !== '' &&
      newSinav.baslangicTarihi !== '' &&
      newSinav.sure > 0 &&
      sorular.length > 0 &&
      !puanAsimi
    );
  }, [newSinav.baslik, newSinav.courseId, newSinav.baslangicTarihi, newSinav.sure, sorular.length, puanAsimi]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/ogretmen" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold">Online Sınavlar</h1>
                <p className="text-xs text-purple-200">Sınav ve deneme oluştur</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni Sınav
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtreler */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Sınav ara..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={durumFilter}
            onChange={(e) => setDurumFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="TASLAK">Taslak</option>
            <option value="AKTIF">Aktif</option>
            <option value="SONA_ERDI">Sona Erdi</option>
          </select>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileQuestion className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-slate-500">Toplam</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{sinavlar.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-4 h-4 text-green-600" />
              <span className="text-xs text-slate-500">Aktif</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{sinavlar.filter(s => s.durum === 'AKTIF').length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Edit className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-slate-500">Taslak</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{sinavlar.filter(s => s.durum === 'TASLAK').length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-slate-500">Katılımcı</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{sinavlar.reduce((sum, s) => sum + s.katilimciSayisi, 0)}</p>
          </div>
        </div>

        {/* Sınav Listesi */}
        {filteredSinavlar.length > 0 ? (
          <div className="space-y-4">
            {filteredSinavlar.map((sinav) => {
              const config = getDurumConfig(sinav.durum);
              
              return (
                <div 
                  key={sinav.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <FileQuestion className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-slate-800 font-medium">{sinav.baslik}</h3>
                        <p className="text-sm text-purple-600">{sinav.course.ad}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <FileQuestion className="w-3 h-3" />
                            {sinav.soruSayisi} soru
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {sinav.sure} dk
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {sinav.tamamlayanSayisi}/{sinav.katilimciSayisi}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {formatDate(sinav.baslangicTarihi)} - {formatDate(sinav.bitisTarihi)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {sinav.durum === 'TASLAK' && (
                          <button
                            onClick={() => handlePublishSinav(sinav.id)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="Yayınla"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        
                        {sinav.katilimciSayisi > 0 && (
                          <button
                            onClick={() => router.push(`/ogretmen/sinavlar/${sinav.id}/sonuclar`)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Sonuçlar"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => router.push(`/ogretmen/sinavlar/${sinav.id}`)}
                          className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                          title="Detay"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileQuestion className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">Henüz sınav bulunmuyor</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              İlk Sınavı Oluştur
            </button>
          </div>
        )}
      </main>

      {/* Sınav Oluşturma Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Yeni Online Sınav</h2>
                <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Temel Bilgiler */}
              <div>
                <label className="block text-sm text-slate-600 mb-1">Sınav Başlığı <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newSinav.baslik}
                  onChange={(e) => setNewSinav({...newSinav, baslik: e.target.value})}
                  placeholder="Örn: Matematik 1. Dönem Sınavı"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Ders / Branş <span className="text-red-500">*</span></label>
                  <select
                    value={newSinav.courseId}
                    onChange={(e) => setNewSinav({...newSinav, courseId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seçin</option>
                    {dersler.map(ders => (
                      <option key={ders.id} value={ders.id}>{ders.ad}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Süre (dk) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={newSinav.sure || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewSinav({...newSinav, sure: val === '' ? 0 : parseInt(val)});
                    }}
                    placeholder="Dakika giriniz"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Başlangıç <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={newSinav.baslangicTarihi}
                    onChange={(e) => setNewSinav({...newSinav, baslangicTarihi: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Bitiş <span className="text-xs text-slate-400">(Otomatik hesaplanır)</span></label>
                  <input
                    type="datetime-local"
                    value={newSinav.bitisTarihi}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1">Maksimum Puan</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={newSinav.maksimumPuan}
                    onChange={(e) => setNewSinav({...newSinav, maksimumPuan: parseFloat(e.target.value) || 100})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-end">
                  <div className={`px-4 py-3 rounded-xl w-full text-center font-medium ${
                    puanAsimi ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    Toplam: {toplamPuan.toFixed(2)} / {newSinav.maksimumPuan} puan
                  </div>
                </div>
              </div>

              {/* Puan uyarısı */}
              {puanUyarisi && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {puanUyarisi}
                </div>
              )}

              {/* Ayarlar */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSinav.karistir}
                    onChange={(e) => setNewSinav({...newSinav, karistir: e.target.checked})}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-slate-600">Soruları karıştır</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSinav.geriDonus}
                    onChange={(e) => setNewSinav({...newSinav, geriDonus: e.target.checked})}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-slate-600">Önceki soruya dönüş</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSinav.sonucGoster}
                    onChange={(e) => setNewSinav({...newSinav, sonucGoster: e.target.checked})}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-slate-600">Sonucu göster</span>
                </label>
              </div>

              {/* Soru Ekleme */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-slate-800 font-medium mb-4">Sorular ({sorular.length})</h3>
                
                {/* Eklenen Sorular */}
                {sorular.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {sorular.map((soru, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 truncate">{index + 1}. {soru.soruMetni}</p>
                          <p className="text-xs text-slate-500">Doğru: {soru.dogruCevap} • {soru.puan} puan</p>
                        </div>
                        <button
                          onClick={() => removeSoru(index)}
                          className="p-1 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Yeni Soru Formu */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                  <textarea
                    value={currentSoru.soruMetni}
                    onChange={(e) => setCurrentSoru({...currentSoru, soruMetni: e.target.value})}
                    placeholder="Soru metnini girin..."
                    rows={2}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D', 'E'].map((harf, i) => (
                      <input
                        key={harf}
                        type="text"
                        value={currentSoru.secenekler[i]}
                        onChange={(e) => {
                          const yeniSecenekler = [...currentSoru.secenekler];
                          yeniSecenekler[i] = e.target.value;
                          setCurrentSoru({...currentSoru, secenekler: yeniSecenekler});
                        }}
                        placeholder={`${harf} şıkkı`}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Doğru Cevap</label>
                      <select
                        value={currentSoru.dogruCevap}
                        onChange={(e) => setCurrentSoru({...currentSoru, dogruCevap: e.target.value})}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {['A', 'B', 'C', 'D', 'E'].map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Puan</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={currentSoru.puan}
                        onChange={(e) => setCurrentSoru({...currentSoru, puan: parseFloat(e.target.value) || 0})}
                        className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <button
                      onClick={addSoru}
                      disabled={!currentSoru.soruMetni.trim()}
                      className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm rounded-lg transition-colors"
                    >
                      Soru Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200">
              {/* Eksikler listesi */}
              {!isFormValid && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                  <p className="font-medium mb-1">Eksik alanlar:</p>
                  <ul className="list-disc list-inside text-xs space-y-0.5">
                    {!newSinav.baslik.trim() && <li>Sınav başlığı gerekli</li>}
                    {!newSinav.courseId && <li>Ders seçimi gerekli</li>}
                    {!newSinav.baslangicTarihi && <li>Başlangıç tarihi gerekli</li>}
                    {sorular.length === 0 && <li>En az bir soru eklenmeli</li>}
                    {puanAsimi && <li>Toplam puan maksimum puanı aşıyor</li>}
                  </ul>
                </div>
              )}
              
              <button
                onClick={handleCreateSinav}
                disabled={processing || !isFormValid}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                  isFormValid 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Sınavı Oluştur ({sorular.length} soru)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uyarı Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 bg-purple-100 rounded-full">
                <AlertCircle className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">Bilgilendirme</h3>
              <p className="text-slate-600 text-center whitespace-pre-line">{alertMessage}</p>
            </div>
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => setShowAlertModal(false)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
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

export default function OgretmenSinavlarPage() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <OgretmenSinavlarContent />
    </RoleGuard>
  );
}
