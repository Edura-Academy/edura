'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, BarChart2, TrendingUp, TrendingDown, Users, Award,
  AlertTriangle, CheckCircle, XCircle, Clock, FileQuestion,
  Download, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

interface SoruAnaliz {
  soruId: string;
  siraNo: number;
  soruMetni: string;
  soruTipi: string;
  puan: number;
  dogruCevap: string;
  dogruSayisi: number;
  yanlisSayisi: number;
  bosSayisi: number;
  dogruOrani: number;
  zorluk: string;
  secenekDagilimi: Record<string, number>;
}

interface OgrenciSonuc {
  siralama: number;
  ogrenci: {
    id: string;
    ad: string;
    soyad: string;
    ogrenciNo: string;
  };
  toplamPuan: number;
  yuzde: number;
  dogruSayisi: number;
  yanlisSayisi: number;
  bosSayisi: number;
  sure: number | null;
}

interface AnalizRaporu {
  sinav: {
    id: string;
    baslik: string;
    course: { id: string; ad: string; sinif?: { id: string; ad: string } } | null;
    dersAdi?: string;
    sure: number;
    durum: string;
    baslangicTarihi: string;
    bitisTarihi: string;
    soruSayisi: number;
  };
  genelIstatistik: {
    katilimci: number;
    ortalama: number;
    enYuksek: number;
    enDusuk: number;
    maxPuan: number;
    ortalamaYuzde: number;
    gecenSayisi: number;
    gecmeOrani: number;
  };
  puanDagilimi: Record<string, number>;
  soruAnaliz: SoruAnaliz[];
  enZorSorular: SoruAnaliz[];
  enKolaySorular: SoruAnaliz[];
  ogrenciSiralaması: OgrenciSonuc[];
}

function SinavAnalizContent({ params }: { params: Promise<{ sinavId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [rapor, setRapor] = useState<AnalizRaporu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'genel' | 'sorular' | 'ogrenciler'>('genel');
  const [expandedSoru, setExpandedSoru] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchAnaliz();
  }, [resolvedParams.sinavId]);

  const fetchAnaliz = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/online-sinav/ogretmen/${resolvedParams.sinavId}/analiz`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Analiz yüklenemedi');
      }

      setRapor(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getZorlukBadge = (zorluk: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      'Kolay': { bg: 'bg-green-100', text: 'text-green-700' },
      'Orta': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      'Zor': { bg: 'bg-red-100', text: 'text-red-700' },
      'Belirsiz': { bg: 'bg-slate-100', text: 'text-slate-600' }
    };
    const badge = badges[zorluk] || badges['Belirsiz'];
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{zorluk}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Analiz raporu yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !rapor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Hata</h2>
          <p className="text-slate-500 mb-6">{error || 'Rapor bulunamadı'}</p>
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

  const { sinav, genelIstatistik, puanDagilimi, soruAnaliz, enZorSorular, enKolaySorular, ogrenciSiralaması } = rapor;

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
                  <BarChart2 className="w-5 h-5" />
                  <h1 className="text-lg font-semibold">Sınav Analiz Raporu</h1>
                </div>
                <p className="text-xs text-red-100">{sinav.baslik}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'genel', label: 'Genel İstatistik', icon: BarChart2 },
            { id: 'sorular', label: 'Soru Analizi', icon: FileQuestion },
            { id: 'ogrenciler', label: 'Öğrenci Sıralaması', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Genel İstatistik Tab */}
        {activeTab === 'genel' && (
          <div className="space-y-6">
            {/* Ana İstatistikler */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Katılımcı</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">{genelIstatistik.katilimci}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Ortalama</span>
                </div>
                <p className="text-3xl font-bold text-slate-800">{genelIstatistik.ortalama}</p>
                <p className="text-sm text-slate-500">/ {genelIstatistik.maxPuan} puan</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <Award className="w-4 h-4" />
                  <span className="text-sm">En Yüksek</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{genelIstatistik.enYuksek}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm">En Düşük</span>
                </div>
                <p className="text-3xl font-bold text-red-600">{genelIstatistik.enDusuk}</p>
              </div>
            </div>

            {/* Başarı Özeti */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Başarı Özeti</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Ortalama Başarı</span>
                      <span className="font-medium">%{genelIstatistik.ortalamaYuzde}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all"
                        style={{ width: `${genelIstatistik.ortalamaYuzde}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">Geçme Oranı (%50+)</span>
                      <span className="font-medium">%{genelIstatistik.gecmeOrani}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${genelIstatistik.gecmeOrani}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                      <span className="text-green-600 font-medium">{genelIstatistik.gecenSayisi}</span> öğrenci geçti, 
                      <span className="text-red-600 font-medium ml-1">{genelIstatistik.katilimci - genelIstatistik.gecenSayisi}</span> öğrenci kaldı
                    </p>
                  </div>
                </div>
              </div>

              {/* Puan Dağılımı */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Puan Dağılımı</h3>
                <div className="space-y-3">
                  {Object.entries(puanDagilimi).map(([aralik, sayi]) => {
                    const maxSayi = Math.max(...Object.values(puanDagilimi));
                    const oran = maxSayi > 0 ? (sayi / maxSayi) * 100 : 0;
                    
                    return (
                      <div key={aralik}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">%{aralik}</span>
                          <span className="font-medium">{sayi} öğrenci</span>
                        </div>
                        <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg transition-all"
                            style={{ width: `${oran}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* En Zor ve En Kolay Sorular */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  En Zor Sorular
                </h3>
                <div className="space-y-3">
                  {enZorSorular.map(soru => (
                    <div key={soru.soruId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <span className="font-medium text-slate-800">Soru {soru.siraNo}</span>
                        <p className="text-sm text-slate-500 truncate max-w-xs">{soru.soruMetni}</p>
                      </div>
                      <span className="text-red-600 font-bold">%{soru.dogruOrani}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  En Kolay Sorular
                </h3>
                <div className="space-y-3">
                  {enKolaySorular.map(soru => (
                    <div key={soru.soruId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <span className="font-medium text-slate-800">Soru {soru.siraNo}</span>
                        <p className="text-sm text-slate-500 truncate max-w-xs">{soru.soruMetni}</p>
                      </div>
                      <span className="text-green-600 font-bold">%{soru.dogruOrani}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Soru Analizi Tab */}
        {activeTab === 'sorular' && (
          <div className="space-y-4">
            {soruAnaliz.map(soru => (
              <div key={soru.soruId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedSoru(expandedSoru === soru.soruId ? null : soru.soruId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold">
                      {soru.siraNo}
                    </span>
                    <div className="text-left">
                      <p className="font-medium text-slate-800 line-clamp-1">{soru.soruMetni}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-slate-500">{soru.puan} puan</span>
                        {getZorlukBadge(soru.zorluk)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${soru.dogruOrani >= 70 ? 'text-green-600' : soru.dogruOrani >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        %{soru.dogruOrani}
                      </p>
                      <p className="text-sm text-slate-500">başarı</p>
                    </div>
                    {expandedSoru === soru.soruId ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </button>

                {expandedSoru === soru.soruId && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <div className="grid grid-cols-3 gap-4 py-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{soru.dogruSayisi}</div>
                        <div className="text-sm text-slate-500">Doğru</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{soru.yanlisSayisi}</div>
                        <div className="text-sm text-slate-500">Yanlış</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-400">{soru.bosSayisi}</div>
                        <div className="text-sm text-slate-500">Boş</div>
                      </div>
                    </div>

                    {Object.keys(soru.secenekDagilimi).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-3">Seçenek Dağılımı</h4>
                        <div className="space-y-2">
                          {['A', 'B', 'C', 'D', 'E'].map(harf => {
                            const sayi = soru.secenekDagilimi[harf] || 0;
                            const toplamCevap = soru.dogruSayisi + soru.yanlisSayisi;
                            const oran = toplamCevap > 0 ? (sayi / toplamCevap) * 100 : 0;
                            const isCorrect = soru.dogruCevap === harf;

                            return (
                              <div key={harf} className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  isCorrect ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {harf}
                                </span>
                                <div className="flex-1">
                                  <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                                    <div 
                                      className={`h-full rounded-lg transition-all ${isCorrect ? 'bg-green-500' : 'bg-slate-400'}`}
                                      style={{ width: `${oran}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-sm text-slate-600 w-16 text-right">
                                  {sayi} (%{Math.round(oran)})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Öğrenci Sıralaması Tab */}
        {activeTab === 'ogrenciler' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-sm font-medium text-slate-600 p-4">Sıra</th>
                    <th className="text-left text-sm font-medium text-slate-600 p-4">Öğrenci</th>
                    <th className="text-center text-sm font-medium text-slate-600 p-4">Puan</th>
                    <th className="text-center text-sm font-medium text-slate-600 p-4">Başarı</th>
                    <th className="text-center text-sm font-medium text-slate-600 p-4">D / Y / B</th>
                    <th className="text-center text-sm font-medium text-slate-600 p-4">Süre</th>
                  </tr>
                </thead>
                <tbody>
                  {ogrenciSiralaması.map((sonuc, index) => (
                    <tr key={sonuc.ogrenci.id} className={`border-b border-slate-100 hover:bg-slate-50 ${index < 3 ? 'bg-yellow-50/50' : ''}`}>
                      <td className="p-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-slate-300 text-slate-700' :
                          index === 2 ? 'bg-orange-300 text-orange-900' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {sonuc.siralama}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{sonuc.ogrenci.ad} {sonuc.ogrenci.soyad}</div>
                        <div className="text-sm text-slate-500">{sonuc.ogrenci.ogrenciNo}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-800">{sonuc.toplamPuan}</span>
                        <span className="text-slate-400">/{genelIstatistik.maxPuan}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-bold ${
                          sonuc.yuzde >= 70 ? 'text-green-600' : 
                          sonuc.yuzde >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          %{sonuc.yuzde}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-green-600">{sonuc.dogruSayisi}</span>
                        {' / '}
                        <span className="text-red-600">{sonuc.yanlisSayisi}</span>
                        {' / '}
                        <span className="text-slate-400">{sonuc.bosSayisi}</span>
                      </td>
                      <td className="p-4 text-center text-slate-600">
                        {sonuc.sure ? `${sonuc.sure} dk` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {ogrenciSiralaması.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Henüz sınavı tamamlayan öğrenci yok</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SinavAnalizPage({ params }: { params: Promise<{ sinavId: string }> }) {
  return (
    <RoleGuard allowedRoles={['ogretmen', 'mudur']}>
      <SinavAnalizContent params={params} />
    </RoleGuard>
  );
}

