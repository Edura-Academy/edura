'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, FileQuestion, Clock, Play, CheckCircle, 
  AlertCircle, History, TrendingUp, Award, BookOpen, 
  Calendar, Target, Sparkles
} from 'lucide-react';

interface AktifSinav {
  id: string;
  baslik: string;
  aciklama: string | null;
  course: { id: string; ad: string } | null;
  ogretmen: { id: string; ad: string; soyad: string } | null;
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
  ders: { id: string; ad: string } | null;
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/aktif`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/online-sinav/gecmis`, {
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
    const gun = Math.floor(diff / (1000 * 60 * 60 * 24));
    const saat = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const dakika = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (gun > 0) {
      return `${gun} gün kaldı`;
    }
    if (saat > 0) {
      return `${saat} saat ${dakika} dk kaldı`;
    }
    return `${dakika} dakika kaldı`;
  };

  const getBasariRenk = (yuzde: number) => {
    if (yuzde >= 80) return 'text-emerald-600';
    if (yuzde >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

  const getBasariBg = (yuzde: number) => {
    if (yuzde >= 80) return 'bg-emerald-100';
    if (yuzde >= 60) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const gecmisOrtalama = gecmisSinavlar.length > 0 
    ? Math.round(gecmisSinavlar.reduce((sum, s) => sum + (s.yuzde || 0), 0) / gecmisSinavlar.length)
    : 0;

  if (loading && aktifSinavlar.length === 0 && gecmisSinavlar.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Sınavlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            <button 
              onClick={() => router.push('/ogrenci')} 
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Online Sınavlar</h1>
                <p className="text-xs text-gray-500">Sınav çöz ve sonuçlarını gör</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('aktif')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'aktif' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Play className="w-4 h-4" />
            Aktif Sınavlar
            {aktifSinavlar.filter(s => !s.tamamlandiMi).length > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                {aktifSinavlar.filter(s => !s.tamamlandiMi).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('gecmis')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'gecmis' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
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
                    className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-lg ${
                      sinav.tamamlandiMi 
                        ? 'border-emerald-200' 
                        : 'border-gray-100 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                          sinav.tamamlandiMi 
                            ? 'bg-emerald-100' 
                            : 'bg-gradient-to-br from-blue-100 to-purple-100'
                        }`}>
                          {sinav.tamamlandiMi ? (
                            <CheckCircle className="w-7 h-7 text-emerald-600" />
                          ) : (
                            <FileQuestion className="w-7 h-7 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-gray-900 font-bold text-lg">{sinav.baslik}</h3>
                          <p className="text-blue-600 font-medium">{sinav.course?.ad || 'Genel Sınav'}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            👨‍🏫 {sinav.ogretmen?.ad || ''} {sinav.ogretmen?.soyad || ''}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                              <FileQuestion className="w-4 h-4" />
                              {sinav.soruSayisi} soru
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                              <Clock className="w-4 h-4" />
                              {sinav.sure} dk
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col items-end">
                        {sinav.tamamlandiMi ? (
                          <>
                            <div className={`px-4 py-2 rounded-xl ${getBasariBg(sinav.puan ? (sinav.puan / (sinav.soruSayisi * 10) * 100) : 0)}`}>
                              <p className={`text-2xl font-bold ${getBasariRenk(sinav.puan ? (sinav.puan / (sinav.soruSayisi * 10) * 100) : 0)}`}>
                                {sinav.puan} puan
                              </p>
                            </div>
                            <button
                              onClick={() => router.push(`/ogrenci/sinavlar/${sinav.id}/sonuc`)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-semibold mt-2"
                            >
                              Sonucu Gör →
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg mb-3">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-semibold">{getKalanSure(sinav.bitisTarihi)}</span>
                            </div>
                            <button
                              onClick={() => router.push(`/ogrenci/sinavlar/${sinav.id}`)}
                              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
                            >
                              <Play className="w-4 h-4" />
                              {sinav.girildiMi ? 'Devam Et' : 'Başla'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileQuestion className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Aktif Sınav Yok</h3>
                <p className="text-gray-500">Şu anda çözülecek sınav bulunmuyor</p>
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
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{gecmisSinavlar.length}</p>
                  <p className="text-sm text-gray-500 font-medium">Toplam Sınav</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${getBasariBg(gecmisOrtalama)}`}>
                    <TrendingUp className={`w-6 h-6 ${getBasariRenk(gecmisOrtalama)}`} />
                  </div>
                  <p className={`text-3xl font-bold ${getBasariRenk(gecmisOrtalama)}`}>{gecmisOrtalama}%</p>
                  <p className="text-sm text-gray-500 font-medium">Ortalama</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">
                    {gecmisSinavlar.filter(s => (s.yuzde || 0) >= 50).length}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">Geçilen</p>
                </div>
              </div>
            )}

            {gecmisSinavlar.length > 0 ? (
              <div className="space-y-3">
                {gecmisSinavlar.map((sinav) => (
                  <div 
                    key={sinav.sinavId}
                    onClick={() => router.push(`/ogrenci/sinavlar/${sinav.sinavId}/sonuc`)}
                    className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getBasariBg(sinav.yuzde || 0)}`}>
                          <span className={`text-xl font-bold ${getBasariRenk(sinav.yuzde || 0)}`}>
                            {sinav.yuzde}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-gray-900 font-semibold group-hover:text-blue-600 transition-colors">
                            {sinav.baslik}
                          </h3>
                          <p className="text-sm text-blue-600 font-medium">{sinav.ders?.ad || 'Genel Sınav'}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(sinav.tarih)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {sinav.toplamPuan}/{sinav.maxPuan}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span className="text-emerald-600 font-semibold">✓ {sinav.dogruSayisi}</span>
                          <span className="text-red-500 font-semibold">✗ {sinav.yanlisSayisi}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Geçmiş Sınav Yok</h3>
                <p className="text-gray-500">Henüz tamamlanmış sınav bulunmuyor</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
