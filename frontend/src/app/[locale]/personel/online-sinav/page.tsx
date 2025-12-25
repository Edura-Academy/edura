'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Search, FileQuestion, Clock, Users,
  CheckCircle, Play, Pause, Eye, Trash2, Edit, 
  ChevronDown, ChevronUp, BarChart2, XCircle, Loader2,
  Calendar, BookOpen
} from 'lucide-react';

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

export default function PersonelOnlineSinav() {
  const router = useRouter();
  const [sinavlar, setSinavlar] = useState<Sinav[]>([]);
  const [dersler, setDersler] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [durumFilter, setDurumFilter] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSoruModal, setShowSoruModal] = useState(false);
  const [selectedSinav, setSelectedSinav] = useState<Sinav | null>(null);
  const [processing, setProcessing] = useState(false);

  // Yeni sınav form
  const [newSinav, setNewSinav] = useState({
    baslik: '',
    aciklama: '',
    courseId: '',
    sure: '60',
    baslangicTarihi: '',
    bitisTarihi: '',
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

  useEffect(() => {
    fetchSinavlar();
    fetchDersler();
  }, []);

  const fetchSinavlar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/online-sinav/ogretmen`, {
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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses?ogretmenId=${user.userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setDersler(result.data || []);
      }
    } catch (error) {
      console.error('Dersler yüklenemedi:', error);
    }
  };

  const handleCreateSinav = async () => {
    if (!newSinav.baslik || !newSinav.courseId || !newSinav.baslangicTarihi || !newSinav.bitisTarihi) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/online-sinav`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newSinav,
          sure: parseInt(newSinav.sure),
          sorular
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewSinav({
          baslik: '', aciklama: '', courseId: '', sure: '60',
          baslangicTarihi: '', bitisTarihi: '',
          karistir: true, geriDonus: false, sonucGoster: true
        });
        setSorular([]);
        fetchSinavlar();
      }
    } catch (error) {
      console.error('Sınav oluşturma hatası:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePublishSinav = async (sinavId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/online-sinav/ogretmen/${sinavId}/yayinla`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchSinavlar();
      } else {
        const result = await response.json();
        alert(result.message);
      }
    } catch (error) {
      console.error('Yayınlama hatası:', error);
    }
  };

  const addSoru = () => {
    if (!currentSoru.soruMetni) return;
    
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
      TASLAK: { label: 'Taslak', color: 'text-slate-400', bg: 'bg-slate-500/20' },
      AKTIF: { label: 'Aktif', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
      SONA_ERDI: { label: 'Sona Erdi', color: 'text-amber-400', bg: 'bg-amber-500/20' },
      IPTAL: { label: 'İptal', color: 'text-red-400', bg: 'bg-red-500/20' }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/personel')} className="p-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Online Sınavlar</h1>
                <p className="text-xs text-slate-400">Sınav oluştur ve yönet</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
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
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={durumFilter}
            onChange={(e) => setDurumFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="TASLAK">Taslak</option>
            <option value="AKTIF">Aktif</option>
            <option value="SONA_ERDI">Sona Erdi</option>
          </select>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileQuestion className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">Toplam</span>
            </div>
            <p className="text-2xl font-bold text-white">{sinavlar.length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Aktif</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{sinavlar.filter(s => s.durum === 'AKTIF').length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Edit className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Taslak</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">{sinavlar.filter(s => s.durum === 'TASLAK').length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Katılımcı</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{sinavlar.reduce((sum, s) => sum + s.katilimciSayisi, 0)}</p>
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
                  className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <FileQuestion className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{sinav.baslik}</h3>
                        <p className="text-sm text-purple-400">{sinav.course.ad}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
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
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
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
                            className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                            title="Yayınla"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        
                        {sinav.katilimciSayisi > 0 && (
                          <button
                            onClick={() => router.push(`/personel/online-sinav/${sinav.id}/sonuclar`)}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            title="Sonuçlar"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => router.push(`/personel/online-sinav/${sinav.id}`)}
                          className="p-2 bg-slate-700/50 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
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
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
            <FileQuestion className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Henüz sınav bulunmuyor</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg"
            >
              İlk Sınavı Oluştur
            </button>
          </div>
        )}
      </main>

      {/* Sınav Oluşturma Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl my-8">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Yeni Online Sınav</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Temel Bilgiler */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">Sınav Başlığı</label>
                  <input
                    type="text"
                    value={newSinav.baslik}
                    onChange={(e) => setNewSinav({...newSinav, baslik: e.target.value})}
                    placeholder="Örn: Matematik 1. Dönem Sınavı"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Ders</label>
                  <select
                    value={newSinav.courseId}
                    onChange={(e) => setNewSinav({...newSinav, courseId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seçin</option>
                    {dersler.map(ders => (
                      <option key={ders.id} value={ders.id}>{ders.ad}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Süre (dk)</label>
                  <input
                    type="number"
                    value={newSinav.sure}
                    onChange={(e) => setNewSinav({...newSinav, sure: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Başlangıç</label>
                  <input
                    type="datetime-local"
                    value={newSinav.baslangicTarihi}
                    onChange={(e) => setNewSinav({...newSinav, baslangicTarihi: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Bitiş</label>
                  <input
                    type="datetime-local"
                    value={newSinav.bitisTarihi}
                    onChange={(e) => setNewSinav({...newSinav, bitisTarihi: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Ayarlar */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSinav.karistir}
                    onChange={(e) => setNewSinav({...newSinav, karistir: e.target.checked})}
                    className="w-4 h-4 text-purple-500 rounded"
                  />
                  <span className="text-sm text-slate-300">Soruları karıştır</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSinav.geriDonus}
                    onChange={(e) => setNewSinav({...newSinav, geriDonus: e.target.checked})}
                    className="w-4 h-4 text-purple-500 rounded"
                  />
                  <span className="text-sm text-slate-300">Önceki soruya dönüş</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSinav.sonucGoster}
                    onChange={(e) => setNewSinav({...newSinav, sonucGoster: e.target.checked})}
                    className="w-4 h-4 text-purple-500 rounded"
                  />
                  <span className="text-sm text-slate-300">Sonucu göster</span>
                </label>
              </div>

              {/* Soru Ekleme */}
              <div className="pt-4 border-t border-slate-700">
                <h3 className="text-white font-medium mb-4">Sorular ({sorular.length})</h3>
                
                {/* Eklenen Sorular */}
                {sorular.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {sorular.map((soru, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{index + 1}. {soru.soruMetni}</p>
                          <p className="text-xs text-slate-400">Doğru: {soru.dogruCevap} • {soru.puan} puan</p>
                        </div>
                        <button
                          onClick={() => removeSoru(index)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Yeni Soru Formu */}
                <div className="space-y-3 p-4 bg-slate-700/20 rounded-xl">
                  <textarea
                    value={currentSoru.soruMetni}
                    onChange={(e) => setCurrentSoru({...currentSoru, soruMetni: e.target.value})}
                    placeholder="Soru metnini girin..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                        className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Doğru Cevap</label>
                      <select
                        value={currentSoru.dogruCevap}
                        onChange={(e) => setCurrentSoru({...currentSoru, dogruCevap: e.target.value})}
                        className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {['A', 'B', 'C', 'D', 'E'].map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Puan</label>
                      <input
                        type="number"
                        value={currentSoru.puan}
                        onChange={(e) => setCurrentSoru({...currentSoru, puan: parseInt(e.target.value)})}
                        className="w-20 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <button
                      onClick={addSoru}
                      disabled={!currentSoru.soruMetni}
                      className="ml-auto px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white text-sm rounded-lg transition-colors"
                    >
                      Soru Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700">
              <button
                onClick={handleCreateSinav}
                disabled={processing || !newSinav.baslik || !newSinav.courseId || sorular.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-xl font-medium transition-colors"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Sınavı Oluştur ({sorular.length} soru)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

