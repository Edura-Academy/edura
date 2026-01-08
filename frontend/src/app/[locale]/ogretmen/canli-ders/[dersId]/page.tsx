'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Users, Clock, AlertCircle, RefreshCw, Settings, BarChart3, X, CheckCircle } from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

// JitsiMeet'i client-side only yükle
const JitsiMeet = dynamic(() => import('@/components/JitsiMeet'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-900 rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Yükleniyor...</p>
      </div>
    </div>
  ),
});

interface CanliDers {
  id: string;
  baslik: string;
  aciklama?: string;
  course: {
    id: string;
    ad: string;
    sinif: {
      id: string;
      ad: string;
    };
  };
  ogretmen: {
    id: string;
    ad: string;
    soyad: string;
  };
  baslangicTarihi: string;
  bitisTarihi: string;
  odaAdi: string;
  odaSifresi?: string;
  mikrofonAcik: boolean;
  kameraAcik: boolean;
  sohbetAcik: boolean;
  durum: 'PLANLANMIS' | 'AKTIF' | 'SONA_ERDI' | 'IPTAL';
  katilimlar?: {
    id: string;
    ogrenci: {
      id: string;
      ad: string;
      soyad: string;
      ogrenciNo: string;
    };
    girisZamani: string;
    cikisZamani?: string;
    toplamSure?: number;
  }[];
}

function OgretmenCanliDersOdasiContent({ params }: { params: Promise<{ dersId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [ders, setDers] = useState<CanliDers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [user, setUser] = useState<{ ad: string; soyad: string; email: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchDersDetay();
    
    // Periyodik güncelleme (katılımcıları güncellemek için)
    const interval = setInterval(fetchDersDetay, 30000);
    return () => clearInterval(interval);
  }, [resolvedParams.dersId]);

  const fetchDersDetay = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/canli-ders/${resolvedParams.dersId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ders bulunamadı');
      }

      const data = await res.json();
      setDers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/canli-ders/${resolvedParams.dersId}/baslat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchDersDetay();
      }
    } catch (err) {
      console.error('Başlatma hatası:', err);
    }
  };

  const handleEndDers = async () => {
    if (!confirm('Dersi bitirmek istediğinize emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/canli-ders/${resolvedParams.dersId}/bitir`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push('/ogretmen/canli-ders');
    } catch (err) {
      console.error('Bitirme hatası:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Ders yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !ders) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Derse Erişilemedi</h2>
          <p className="text-slate-500 mb-6">{error || 'Ders bulunamadı'}</p>
          <button
            onClick={() => router.push('/ogretmen/canli-ders')}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // Ders henüz başlamamışsa başlatma ekranı
  if (ders.durum === 'PLANLANMIS') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg text-center">
          <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">{ders.baslik}</h2>
          <p className="text-slate-500 mb-2">
            {ders.course.sinif.ad} - {ders.course.ad}
          </p>
          <p className="text-slate-400 mb-6">
            Planlanan: {new Date(ders.baslangicTarihi).toLocaleString('tr-TR')}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/ogretmen/canli-ders')}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Geri Dön
            </button>
            <button
              onClick={handleStartDers}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
            >
              Dersi Başlat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ders sona erdiyse
  if (ders.durum === 'SONA_ERDI' || ders.durum === 'IPTAL') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg text-center">
          <CheckCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">{ders.baslik}</h2>
          <p className="text-slate-500 mb-6">Bu ders sona erdi</p>
          <button
            onClick={() => router.push('/ogretmen/canli-ders')}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Ders Listesine Dön
          </button>
        </div>
      </div>
    );
  }

  // Aktif ders - Video konferans göster
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-pink-600 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/ogretmen/canli-ders')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold">{ders.baslik}</h1>
                <p className="text-xs text-red-100">
                  {ders.course.sinif.ad} - {ders.course.ad}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowStats(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5" />
                {ders.katilimlar?.filter(k => !k.cikisZamani).length || 0} katılımcı
              </button>
              <span className="flex items-center gap-2 px-3 py-1 bg-white/20 text-sm font-bold rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                CANLI
              </span>
              <button
                onClick={handleEndDers}
                className="px-4 py-2 bg-white/20 hover:bg-red-700 rounded-lg transition-colors font-medium"
              >
                Dersi Bitir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="aspect-video max-h-[calc(100vh-180px)]">
          <JitsiMeet
            roomName={ders.odaAdi}
            displayName={user ? `${user.ad} ${user.soyad} (Öğretmen)` : 'Öğretmen'}
            email={user?.email}
            isTeacher={true}
            password={ders.odaSifresi}
            startWithAudioMuted={false}
            startWithVideoMuted={false}
            enableChat={ders.sohbetAcik}
            onMeetingEnd={handleEndDers}
          />
        </div>

        {/* Ders Bilgileri */}
        {ders.aciklama && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-slate-800 font-medium mb-2">Ders Açıklaması</h3>
            <p className="text-slate-500">{ders.aciklama}</p>
          </div>
        )}
      </main>

      {/* Katılımcı Paneli */}
      {showStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-slate-800">Katılımcılar</h3>
              <button onClick={() => setShowStats(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {ders.katilimlar && ders.katilimlar.length > 0 ? (
                <div className="space-y-3">
                  {ders.katilimlar.map(k => (
                    <div key={k.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-medium text-slate-800">
                          {k.ogrenci.ad} {k.ogrenci.soyad}
                        </p>
                        <p className="text-sm text-slate-500">{k.ogrenci.ogrenciNo}</p>
                      </div>
                      <div className="text-right">
                        {k.cikisZamani ? (
                          <span className="text-sm text-slate-400">Ayrıldı</span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            Çevrimiçi
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">Henüz katılımcı yok</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OgretmenCanliDersOdasiPage({ params }: { params: Promise<{ dersId: string }> }) {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <OgretmenCanliDersOdasiContent params={params} />
    </RoleGuard>
  );
}

