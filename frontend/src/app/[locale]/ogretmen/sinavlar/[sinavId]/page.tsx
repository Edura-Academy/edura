'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Save, Play, Pause, Trash2, Edit, Eye, 
  FileQuestion, Clock, Users, Calendar, CheckCircle,
  XCircle, Loader2, AlertCircle, Plus, Settings,
  ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/RoleGuard';

interface Soru {
  id: string;
  soruMetni: string;
  soruTipi: string;
  puan: number;
  siraNo: number;
  secenekler: string[] | null;
  dogruCevap: string;
  resimUrl?: string;
}

interface Oturum {
  id: string;
  tamamlandi: boolean;
  toplamPuan: number | null;
  ogrenci: { id: string; ad: string; soyad: string; ogrenciNo: string };
}

interface Sinav {
  id: string;
  baslik: string;
  aciklama: string | null;
  course: { id: string; ad: string } | null;
  dersAdi: string | null;
  bransKodu: string | null;
  sure: number;
  baslangicTarihi: string;
  bitisTarihi: string;
  durum: string;
  maksimumPuan: number;
  karistir: boolean;
  geriDonus: boolean;
  sonucGoster: boolean;
  sorular: Soru[];
  oturumlar: Oturum[];
  createdAt: string;
}

function SinavDetayContent() {
  const router = useRouter();
  const params = useParams();
  const sinavId = params.sinavId as string;

  const [sinav, setSinav] = useState<Sinav | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [expandedSoru, setExpandedSoru] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    baslik: '',
    aciklama: '',
    sure: 60,
    baslangicTarihi: '',
    bitisTarihi: '',
    maksimumPuan: 100,
    karistir: true,
    geriDonus: false,
    sonucGoster: true
  });

  // Yeni soru ekleme
  const [showAddSoru, setShowAddSoru] = useState(false);
  const [newSoru, setNewSoru] = useState({
    soruMetni: '',
    soruTipi: 'COKTAN_SECMELI',
    puan: 10,
    secenekler: ['', '', '', '', ''],
    dogruCevap: 'A'
  });

  useEffect(() => {
    fetchSinavDetay();
  }, [sinavId]);

  const fetchSinavDetay = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/ogretmen/${sinavId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setSinav(result.data);
        
        // Edit form'u doldur
        const s = result.data;
        setEditForm({
          baslik: s.baslik,
          aciklama: s.aciklama || '',
          sure: s.sure,
          baslangicTarihi: formatDateTimeLocal(s.baslangicTarihi),
          bitisTarihi: formatDateTimeLocal(s.bitisTarihi),
          maksimumPuan: s.maksimumPuan,
          karistir: s.karistir,
          geriDonus: s.geriDonus,
          sonucGoster: s.sonucGoster
        });
      } else {
        router.push('/ogretmen/sinavlar');
      }
    } catch (error) {
      console.error('Sınav detay yüklenemedi:', error);
      router.push('/ogretmen/sinavlar');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeLocal = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  const handleSave = async () => {
    if (!editForm.baslik.trim()) {
      showAlert('Sınav başlığı gereklidir.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/ogretmen/${sinavId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        fetchSinavDetay();
        setEditMode(false);
        showAlert('Sınav başarıyla güncellendi!');
      } else {
        const result = await response.json();
        showAlert(result.message || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      showAlert('Bağlantı hatası');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/ogretmen/${sinavId}/yayinla`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchSinavDetay();
        showAlert('🎉 Sınav yayınlandı! Öğrenciler artık bu sınava erişebilir.');
      } else {
        const result = await response.json();
        showAlert(result.message || 'Yayınlama başarısız');
      }
    } catch (error) {
      console.error('Yayınlama hatası:', error);
    }
  };

  const handleUnpublish = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/ogretmen/${sinavId}/taslak`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchSinavDetay();
        showAlert('Sınav taslağa alındı. Artık düzenleyebilirsiniz.');
      } else {
        const result = await response.json();
        showAlert(result.message || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Taslağa alma hatası:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/ogretmen/${sinavId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        router.push('/ogretmen/sinavlar');
      } else {
        const result = await response.json();
        showAlert(result.message || 'Silme başarısız');
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const handleAddSoru = async () => {
    if (!newSoru.soruMetni.trim()) {
      showAlert('Soru metni gereklidir.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/ogretmen/${sinavId}/soru`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSoru)
      });

      if (response.ok) {
        fetchSinavDetay();
        setShowAddSoru(false);
        setNewSoru({
          soruMetni: '',
          soruTipi: 'COKTAN_SECMELI',
          puan: 10,
          secenekler: ['', '', '', '', ''],
          dogruCevap: 'A'
        });
        showAlert('Soru eklendi!');
      } else {
        const result = await response.json();
        showAlert(result.message || 'Soru eklenemedi');
      }
    } catch (error) {
      console.error('Soru ekleme hatası:', error);
    }
  };

  const handleDeleteSoru = async (soruId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/soru/${soruId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchSinavDetay();
      } else {
        const result = await response.json();
        showAlert(result.message || 'Soru silinemedi');
      }
    } catch (error) {
      console.error('Soru silme hatası:', error);
    }
  };

  const getDurumConfig = (durum: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
      TASLAK: { label: 'Taslak', color: 'text-slate-600', bg: 'bg-slate-100', icon: <Edit className="w-4 h-4" /> },
      AKTIF: { label: 'Aktif', color: 'text-green-600', bg: 'bg-green-100', icon: <Play className="w-4 h-4" /> },
      SONA_ERDI: { label: 'Sona Erdi', color: 'text-amber-600', bg: 'bg-amber-100', icon: <Clock className="w-4 h-4" /> },
      IPTAL: { label: 'İptal', color: 'text-red-600', bg: 'bg-red-100', icon: <XCircle className="w-4 h-4" /> }
    };
    return configs[durum] || configs.TASLAK;
  };

  const toplamPuan = useMemo(() => {
    return sinav?.sorular.reduce((sum, s) => sum + s.puan, 0) || 0;
  }, [sinav?.sorular]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!sinav) {
    return null;
  }

  const durumConfig = getDurumConfig(sinav.durum);
  const dersAdi = sinav.course?.ad || sinav.dersAdi || 'Deneme Sınavı';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/ogretmen/sinavlar" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold">{sinav.baslik}</h1>
                <p className="text-xs text-purple-200">{dersAdi}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${durumConfig.bg} ${durumConfig.color}`}>
                {durumConfig.icon}
                {durumConfig.label}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Aksiyon Butonları */}
        <div className="flex flex-wrap gap-3 mb-6">
          {sinav.durum === 'TASLAK' && (
            <>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  editMode 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Edit className="w-4 h-4" />
                {editMode ? 'Düzenleniyor' : 'Düzenle'}
              </button>
              <button
                onClick={handlePublish}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
              >
                <Play className="w-4 h-4" />
                Yayınla
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Sil
              </button>
            </>
          )}
          
          {sinav.durum === 'AKTIF' && (
            <button
              onClick={handleUnpublish}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Taslağa Al
            </button>
          )}
          
          <button
            onClick={() => { setShowPreview(true); setCurrentPreviewIndex(0); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors"
          >
            <Eye className="w-4 h-4" />
            Önizle
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol: Sınav Bilgileri */}
          <div className="lg:col-span-2 space-y-6">
            {/* Temel Bilgiler */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Sınav Bilgileri
              </h2>
              
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Başlık</label>
                    <input
                      type="text"
                      value={editForm.baslik}
                      onChange={(e) => setEditForm({...editForm, baslik: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Açıklama</label>
                    <textarea
                      value={editForm.aciklama}
                      onChange={(e) => setEditForm({...editForm, aciklama: e.target.value})}
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Süre (dk)</label>
                      <input
                        type="number"
                        value={editForm.sure}
                        onChange={(e) => setEditForm({...editForm, sure: parseInt(e.target.value) || 60})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Maksimum Puan</label>
                      <input
                        type="number"
                        value={editForm.maksimumPuan}
                        onChange={(e) => setEditForm({...editForm, maksimumPuan: parseFloat(e.target.value) || 100})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Başlangıç</label>
                      <input
                        type="datetime-local"
                        value={editForm.baslangicTarihi}
                        onChange={(e) => setEditForm({...editForm, baslangicTarihi: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Bitiş</label>
                      <input
                        type="datetime-local"
                        value={editForm.bitisTarihi}
                        onChange={(e) => setEditForm({...editForm, bitisTarihi: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.karistir}
                        onChange={(e) => setEditForm({...editForm, karistir: e.target.checked})}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm text-slate-600">Soruları karıştır</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.geriDonus}
                        onChange={(e) => setEditForm({...editForm, geriDonus: e.target.checked})}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm text-slate-600">Önceki soruya dönüş</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.sonucGoster}
                        onChange={(e) => setEditForm({...editForm, sonucGoster: e.target.checked})}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm text-slate-600">Sonucu göster</span>
                    </label>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Kaydet
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sinav.aciklama && (
                    <p className="text-slate-600">{sinav.aciklama}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Süre: {sinav.sure} dakika</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileQuestion className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">{sinav.sorular.length} soru</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Toplam: {toplamPuan} / {sinav.maksimumPuan} puan</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">{sinav.oturumlar.filter(o => o.tamamlandi).length} / {sinav.oturumlar.length} katılımcı</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Başlangıç: {formatDate(sinav.baslangicTarihi)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>Bitiş: {formatDate(sinav.bitisTarihi)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
                    {sinav.karistir && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Karıştırılıyor</span>
                    )}
                    {sinav.geriDonus && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Geri dönüş açık</span>
                    )}
                    {sinav.sonucGoster && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Sonuç gösteriliyor</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sorular */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <FileQuestion className="w-5 h-5 text-purple-600" />
                  Sorular ({sinav.sorular.length})
                </h2>
                
                {sinav.durum === 'TASLAK' && (
                  <button
                    onClick={() => setShowAddSoru(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Soru Ekle
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {sinav.sorular.map((soru, index) => (
                  <div 
                    key={soru.id}
                    className="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <div 
                      onClick={() => setExpandedSoru(expandedSoru === soru.id ? null : soru.id)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-slate-800 text-sm line-clamp-1">{soru.soruMetni}</p>
                          <p className="text-xs text-slate-500">Doğru: {soru.dogruCevap} • {soru.puan} puan</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sinav.durum === 'TASLAK' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSoru(soru.id); }}
                            className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {expandedSoru === soru.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                    
                    {expandedSoru === soru.id && soru.secenekler && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
                        <div className="grid grid-cols-1 gap-2">
                          {soru.secenekler.map((secenek, i) => {
                            const harf = ['A', 'B', 'C', 'D', 'E'][i];
                            const isCorrect = soru.dogruCevap === harf;
                            return secenek ? (
                              <div 
                                key={i}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                  isCorrect 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-white text-slate-700 border border-slate-200'
                                }`}
                              >
                                <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-slate-500'}`}>
                                  {harf})
                                </span>
                                {secenek}
                                {isCorrect && <CheckCircle className="w-4 h-4 ml-auto text-green-600" />}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ: Katılımcılar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Katılımcılar ({sinav.oturumlar.length})
              </h2>
              
              {sinav.oturumlar.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sinav.oturumlar.map((oturum) => (
                    <div 
                      key={oturum.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {oturum.ogrenci.ad} {oturum.ogrenci.soyad}
                        </p>
                        <p className="text-xs text-slate-500">{oturum.ogrenci.ogrenciNo}</p>
                      </div>
                      <div className="text-right">
                        {oturum.tamamlandi ? (
                          <span className="text-green-600 font-medium text-sm">
                            {oturum.toplamPuan} puan
                          </span>
                        ) : (
                          <span className="text-amber-600 text-xs">Devam ediyor</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Henüz katılımcı yok</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Soru Ekleme Modal */}
      {showAddSoru && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Yeni Soru Ekle</h2>
                <button onClick={() => setShowAddSoru(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Soru Metni</label>
                <textarea
                  value={newSoru.soruMetni}
                  onChange={(e) => setNewSoru({...newSoru, soruMetni: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {['A', 'B', 'C', 'D', 'E'].map((harf, i) => (
                  <input
                    key={harf}
                    type="text"
                    value={newSoru.secenekler[i]}
                    onChange={(e) => {
                      const yeniSecenekler = [...newSoru.secenekler];
                      yeniSecenekler[i] = e.target.value;
                      setNewSoru({...newSoru, secenekler: yeniSecenekler});
                    }}
                    placeholder={`${harf} şıkkı`}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                ))}
              </div>
              
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Doğru Cevap</label>
                  <select
                    value={newSoru.dogruCevap}
                    onChange={(e) => setNewSoru({...newSoru, dogruCevap: e.target.value})}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    min="1"
                    value={newSoru.puan}
                    onChange={(e) => setNewSoru({...newSoru, puan: parseFloat(e.target.value) || 10})}
                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200">
              <button
                onClick={handleAddSoru}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
              >
                Soru Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Önizleme Modal */}
      {showPreview && sinav.sorular.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{sinav.baslik}</h2>
                  <p className="text-sm text-purple-200">Önizleme Modu</p>
                </div>
                <button onClick={() => setShowPreview(false)} className="text-white/80 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  Soru {currentPreviewIndex + 1} / {sinav.sorular.length}
                </span>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {(() => {
                const soru = sinav.sorular[currentPreviewIndex];
                return (
                  <div>
                    <p className="text-lg text-slate-800 mb-6">{soru.soruMetni}</p>
                    
                    {soru.secenekler && (
                      <div className="space-y-3">
                        {soru.secenekler.map((secenek, i) => {
                          const harf = ['A', 'B', 'C', 'D', 'E'][i];
                          return secenek ? (
                            <div 
                              key={i}
                              className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-medium text-slate-600">
                                {harf}
                              </span>
                              <span className="text-slate-700">{secenek}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                    
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-sm text-green-800">
                        <strong>Doğru Cevap:</strong> {soru.dogruCevap} • <strong>Puan:</strong> {soru.puan}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="p-6 border-t border-slate-200 flex justify-between">
              <button
                onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                disabled={currentPreviewIndex === 0}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Önceki
              </button>
              <button
                onClick={() => setCurrentPreviewIndex(Math.min(sinav.sorular.length - 1, currentPreviewIndex + 1))}
                disabled={currentPreviewIndex === sinav.sorular.length - 1}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sonraki
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Silme Onay Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Sınavı Sil</h3>
              <p className="text-slate-600">
                <strong>&quot;{sinav.baslik}&quot;</strong> sınavını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uyarı Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 bg-purple-100 rounded-full">
                <AlertCircle className="w-7 h-7 text-purple-600" />
              </div>
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

export default function SinavDetayPage() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <SinavDetayContent />
    </RoleGuard>
  );
}

