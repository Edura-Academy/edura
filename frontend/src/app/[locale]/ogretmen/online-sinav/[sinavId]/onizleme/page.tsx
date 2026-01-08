'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Eye, Clock, FileQuestion, Play, CheckCircle, X,
  ChevronLeft, ChevronRight, AlertCircle, Settings, BarChart2
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

interface Soru {
  siraNo: number;
  soruMetni: string;
  soruTipi: string;
  puan: number;
  secenekler: string[] | null;
  dogruCevap: string;
  resimUrl?: string;
}

interface SinavOnizleme {
  id: string;
  baslik: string;
  aciklama?: string;
  course: { id: string; ad: string; sinif?: { ad: string } } | null;
  dersAdi?: string;
  sure: number;
  maksimumPuan: number;
  baslangicTarihi: string;
  bitisTarihi: string;
  karistir: boolean;
  geriDonus: boolean;
  sonucGoster: boolean;
  durum: string;
  soruSayisi: number;
  toplamPuan: number;
  sorular: Soru[];
}

function SinavOnizlemeContent({ params }: { params: Promise<{ sinavId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [sinav, setSinav] = useState<SinavOnizleme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSoruIndex, setCurrentSoruIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchOnizleme();
  }, [resolvedParams.sinavId]);

  const fetchOnizleme = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/online-sinav/ogretmen/${resolvedParams.sinavId}/onizleme`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Önizleme yüklenemedi');
      }

      setSinav(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getDurumBadge = (durum: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      TASLAK: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      AKTIF: { bg: 'bg-green-100', text: 'text-green-800' },
      SONA_ERDI: { bg: 'bg-slate-100', text: 'text-slate-800' },
      IPTAL: { bg: 'bg-red-100', text: 'text-red-800' }
    };
    const badge = badges[durum] || badges.TASLAK;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {durum === 'TASLAK' ? 'Taslak' : durum === 'AKTIF' ? 'Aktif' : durum === 'SONA_ERDI' ? 'Sona Erdi' : 'İptal'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Önizleme yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !sinav) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Hata</h2>
          <p className="text-slate-500 mb-6">{error || 'Sınav bulunamadı'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const currentSoru = sinav.sorular[currentSoruIndex];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-pink-600 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <h1 className="text-lg font-semibold">Sınav Önizleme</h1>
                </div>
                <p className="text-xs text-red-100">{sinav.baslik}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {getDurumBadge(sinav.durum)}
              <button
                onClick={() => router.push(`/ogretmen/online-sinav/${sinav.id}/analiz`)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <BarChart2 className="w-4 h-4" />
                Analiz
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sınav Bilgileri */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-500 text-sm">Ders</p>
              <p className="font-medium text-slate-800">
                {sinav.course?.ad || sinav.dersAdi || 'Belirsiz'}
                {sinav.course?.sinif && ` (${sinav.course.sinif.ad})`}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Süre</p>
              <p className="font-medium text-slate-800 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {sinav.sure} dakika
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Soru Sayısı</p>
              <p className="font-medium text-slate-800 flex items-center gap-1">
                <FileQuestion className="w-4 h-4" />
                {sinav.soruSayisi} soru
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Toplam Puan</p>
              <p className="font-medium text-slate-800">{sinav.toplamPuan} puan</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
            <span className={`px-3 py-1 rounded-full text-xs ${sinav.karistir ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
              {sinav.karistir ? '✓ Sorular karıştırılacak' : '✗ Sorular sıralı'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs ${sinav.geriDonus ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
              {sinav.geriDonus ? '✓ Geri dönüş aktif' : '✗ Geri dönüş yok'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs ${sinav.sonucGoster ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
              {sinav.sonucGoster ? '✓ Sonuç gösterilecek' : '✗ Sonuç gizli'}
            </span>
          </div>
        </div>

        {/* Görünüm Seçenekleri */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('single')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'single' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tek Soru
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'all' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tüm Sorular
            </button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAnswers}
              onChange={(e) => setShowAnswers(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded"
            />
            <span className="text-sm text-slate-600">Doğru cevapları göster</span>
          </label>
        </div>

        {/* Sorular - Tek Soru Görünümü */}
        {viewMode === 'single' && currentSoru && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Soru Navigasyonu */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentSoruIndex(prev => Math.max(0, prev - 1))}
                disabled={currentSoruIndex === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Önceki
              </button>
              <span className="text-slate-600">
                Soru {currentSoruIndex + 1} / {sinav.soruSayisi}
              </span>
              <button
                onClick={() => setCurrentSoruIndex(prev => Math.min(sinav.soruSayisi - 1, prev + 1))}
                disabled={currentSoruIndex === sinav.soruSayisi - 1}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sonraki
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Soru İçeriği */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-red-600">
                  Soru {currentSoru.siraNo} • {currentSoru.puan} puan
                </span>
                <span className="text-sm text-slate-500">
                  {currentSoru.soruTipi === 'COKTAN_SECMELI' ? 'Çoktan Seçmeli' : 
                   currentSoru.soruTipi === 'DOGRU_YANLIS' ? 'Doğru/Yanlış' : 'Açık Uçlu'}
                </span>
              </div>

              <p className="text-lg text-slate-800 whitespace-pre-wrap">{currentSoru.soruMetni}</p>

              {currentSoru.resimUrl && (
                <img 
                  src={currentSoru.resimUrl} 
                  alt="Soru görseli" 
                  className="mt-4 max-w-full h-auto rounded-lg"
                />
              )}
            </div>

            {/* Seçenekler */}
            {currentSoru.secenekler && (
              <div className="space-y-3">
                {currentSoru.secenekler.map((secenek, index) => {
                  const harf = String.fromCharCode(65 + index);
                  const isCorrect = currentSoru.dogruCevap === harf;
                  const isSelected = selectedAnswers[currentSoru.siraNo] === harf;

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedAnswers(prev => ({ ...prev, [currentSoru.siraNo]: harf }))}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        showAnswers && isCorrect
                          ? 'border-green-500 bg-green-50'
                          : isSelected
                            ? 'border-red-500 bg-red-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        showAnswers && isCorrect
                          ? 'bg-green-500 text-white'
                          : isSelected
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                      }`}>
                        {harf}
                      </span>
                      <span className="flex-1 text-slate-700">{secenek}</span>
                      {showAnswers && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Soru Numaraları */}
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-100">
              {sinav.sorular.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSoruIndex(index)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentSoruIndex === index
                      ? 'bg-red-600 text-white'
                      : selectedAnswers[index + 1]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sorular - Tüm Sorular Görünümü */}
        {viewMode === 'all' && (
          <div className="space-y-4">
            {sinav.sorular.map((soru, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-red-600">
                    Soru {soru.siraNo} • {soru.puan} puan
                  </span>
                  <span className="text-sm text-slate-500">
                    {soru.soruTipi === 'COKTAN_SECMELI' ? 'Çoktan Seçmeli' : 
                     soru.soruTipi === 'DOGRU_YANLIS' ? 'Doğru/Yanlış' : 'Açık Uçlu'}
                  </span>
                </div>

                <p className="text-slate-800 whitespace-pre-wrap mb-4">{soru.soruMetni}</p>

                {soru.resimUrl && (
                  <img src={soru.resimUrl} alt="Soru görseli" className="mb-4 max-w-full h-auto rounded-lg" />
                )}

                {soru.secenekler && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {soru.secenekler.map((secenek, i) => {
                      const harf = String.fromCharCode(65 + i);
                      const isCorrect = soru.dogruCevap === harf;

                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            showAnswers && isCorrect
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-slate-50 border border-slate-200'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                            showAnswers && isCorrect
                              ? 'bg-green-500 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {harf}
                          </span>
                          <span className="text-sm text-slate-700">{secenek}</span>
                          {showAnswers && isCorrect && (
                            <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SinavOnizlemePage({ params }: { params: Promise<{ sinavId: string }> }) {
  return (
    <RoleGuard allowedRoles={['ogretmen', 'mudur']}>
      <SinavOnizlemeContent params={params} />
    </RoleGuard>
  );
}

