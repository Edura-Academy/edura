'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, FileQuestion, Clock, Play, CheckCircle, 
  AlertCircle, Calendar, Award, History, TrendingUp
} from 'lucide-react';

interface AktifSinav {
  id: string;
  baslik: string;
  aciklama: string | null;
  course: { id: string; ad: string };
  ogretmen: { id: string; ad: string; soyad: string };
  sure: number;
  bitisTarihi: string;
  soruSayisi: number;
  girildiMi: boolean;
  tamamlandiMi: boolean;
  puan: number | null;
}

interface GecmisSinav {
  sinavId: string;
  baslik: string;
  ders: { id: string; ad: string };
  tarih: string;
  toplamPuan: number;
  maxPuan: number;
  yuzde: number;
  dogruSayisi: number;
  yanlisSayisi: number;
}

export default function OgrenciSinavlar() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'aktif' | 'gecmis'>('aktif');
  const [aktifSinavlar, setAktifSinavlar] = useState<AktifSinav[]>([]);
  const [gecmisSinavlar, setGecmisSinavlar] = useState<GecmisSinav[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'aktif') {
      fetchAktifSinavlar();
    } else {
      fetchGecmisSinavlar();
    }
  }, [activeTab]);

  const fetchAktifSinavlar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/online-sinav/aktif`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setAktifSinavlar(result.data || []);
      }
    } catch (error) {
      console.error('Aktif sınavlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGecmisSinavlar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/online-sinav/gecmis`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setGecmisSinavlar(result.data || []);
      }
    } catch (error) {
      console.error('Geçmiş sınavlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const getKalanSure = (bitisTarihi: string) => {
    const diff = new Date(bitisTarihi).getTime() - Date.now();
    const saat = Math.floor(diff / (1000 * 60 * 60));
    const dakika = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (saat > 24) {
      return `${Math.floor(saat / 24)} gün`;
    }
    if (saat > 0) {
      return `${saat} saat ${dakika} dk`;
    }
    return `${dakika} dakika`;
  };

  const getBasariRenk = (yuzde: number) => {
    if (yuzde >= 80) return 'text-emerald-400';
    if (yuzde >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  // Genel istatistikler
  const gecmisOrtalama = gecmisSinavlar.length > 0 
    ? Math.round(gecmisSinavlar.reduce((sum, s) => sum + (s.yuzde || 0), 0) / gecmisSinavlar.length)
    : 0;

  if (loading && aktifSinavlar.length === 0 && gecmisSinavlar.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button onClick={() => router.push('/ogrenci')} className="p-2 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Online Sınavlar</h1>
              <p className="text-xs text-slate-400">Sınav çöz ve sonuçlarını gör</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('aktif')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'aktif' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4" />
            Aktif Sınavlar
            {aktifSinavlar.filter(s => !s.tamamlandiMi).length > 0 && (
              <span className="w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {aktifSinavlar.filter(s => !s.tamamlandiMi).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('gecmis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'gecmis' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            Geçmiş
          </button>
        </div>

        {/* Aktif Sınavlar */}
        {activeTab === 'aktif' && (
          <>
            {aktifSinavlar.length > 0 ? (
              <div className="space-y-4">
                {aktifSinavlar.map((sinav) => (
                  <div 
                    key={sinav.id}
                    className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl border p-4 ${
                      sinav.tamamlandiMi ? 'border-emerald-500/30' : 'border-slate-700/50 hover:border-purple-500/50'
                    } transition-all`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          sinav.tamamlandiMi ? 'bg-emerald-500/20' : 'bg-purple-500/20'
                        }`}>
                          {sinav.tamamlandiMi ? (
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <FileQuestion className="w-6 h-6 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{sinav.baslik}</h3>
                          <p className="text-sm text-purple-400">{sinav.course.ad}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {sinav.ogretmen.ad} {sinav.ogretmen.soyad}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <FileQuestion className="w-3 h-3" />
                              {sinav.soruSayisi} soru
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {sinav.sure} dk
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {sinav.tamamlandiMi ? (
                          <div>
                            <p className={`text-2xl font-bold ${getBasariRenk(sinav.puan ? (sinav.puan / (sinav.soruSayisi * 10) * 100) : 0)}`}>
                              {sinav.puan}
                            </p>
                            <button
                              onClick={() => router.push(`/ogrenci/sinavlar/${sinav.id}/sonuc`)}
                              className="text-xs text-purple-400 hover:text-purple-300 mt-1"
                            >
                              Sonucu Gör →
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-amber-400 flex items-center gap-1 mb-2">
                              <AlertCircle className="w-3 h-3" />
                              {getKalanSure(sinav.bitisTarihi)} kaldı
                            </p>
                            <button
                              onClick={() => router.push(`/ogrenci/sinavlar/${sinav.id}`)}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
                            >
                              <Play className="w-4 h-4" />
                              {sinav.girildiMi ? 'Devam Et' : 'Başla'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
                <FileQuestion className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Şu anda aktif sınav bulunmuyor</p>
              </div>
            )}
          </>
        )}

        {/* Geçmiş Sınavlar */}
        {activeTab === 'gecmis' && (
          <>
            {/* Özet */}
            {gecmisSinavlar.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 text-center">
                  <p className="text-2xl font-bold text-white">{gecmisSinavlar.length}</p>
                  <p className="text-xs text-slate-400">Toplam Sınav</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 text-center">
                  <p className={`text-2xl font-bold ${getBasariRenk(gecmisOrtalama)}`}>{gecmisOrtalama}%</p>
                  <p className="text-xs text-slate-400">Ortalama</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {gecmisSinavlar.filter(s => (s.yuzde || 0) >= 50).length}
                  </p>
                  <p className="text-xs text-slate-400">Geçilen</p>
                </div>
              </div>
            )}

            {gecmisSinavlar.length > 0 ? (
              <div className="space-y-3">
                {gecmisSinavlar.map((sinav) => (
                  <div 
                    key={sinav.sinavId}
                    onClick={() => router.push(`/ogrenci/sinavlar/${sinav.sinavId}/sonuc`)}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 cursor-pointer hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{sinav.baslik}</h3>
                        <p className="text-sm text-purple-400">{sinav.ders.ad}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatDate(sinav.tarih)}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-xl font-bold ${getBasariRenk(sinav.yuzde || 0)}`}>
                          {sinav.yuzde}%
                        </p>
                        <p className="text-xs text-slate-400">
                          {sinav.toplamPuan}/{sinav.maxPuan}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-emerald-400">✓ {sinav.dogruSayisi}</span>
                          <span className="text-red-400">✗ {sinav.yanlisSayisi}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
                <History className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Henüz tamamlanmış sınav yok</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

