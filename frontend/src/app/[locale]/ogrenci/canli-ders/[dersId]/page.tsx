'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Users, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

// JitsiMeet'i client-side only yükle
const JitsiMeet = dynamic(() => import('@/components/JitsiMeet'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-900 rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
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
    ad: string;
    sinif: {
      ad: string;
    };
  };
  ogretmen: {
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
}

function OgrenciCanliDersOdasiContent({ params }: { params: Promise<{ dersId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [ders, setDers] = useState<CanliDers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [user, setUser] = useState<{ ad: string; soyad: string; email: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchDersDetay();
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

      // Derse katılım kaydı
      if (data.durum === 'AKTIF') {
        await fetch(`${API_URL}/canli-ders/${resolvedParams.dersId}/katil`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingEnd = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/canli-ders/${resolvedParams.dersId}/cik`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Çıkış kaydı hatası:', err);
    }
    router.push('/ogrenci/canli-ders');
  };

  const handleParticipantJoined = () => {
    setParticipantCount(prev => prev + 1);
  };

  const handleParticipantLeft = () => {
    setParticipantCount(prev => Math.max(0, prev - 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Derse bağlanılıyor...</p>
        </div>
      </div>
    );
  }

  if (error || !ders) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Derse Erişilemedi</h2>
          <p className="text-gray-400 mb-6">{error || 'Ders bulunamadı'}</p>
          <button
            onClick={() => router.push('/ogrenci/canli-ders')}
            className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  if (ders.durum !== 'AKTIF') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-8 max-w-md text-center">
          <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Ders Henüz Başlamadı</h2>
          <p className="text-gray-400 mb-4">{ders.baslik}</p>
          <p className="text-gray-500 mb-6">
            Başlangıç: {new Date(ders.baslangicTarihi).toLocaleString('tr-TR')}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/ogrenci/canli-ders')}
              className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              Geri Dön
            </button>
            <button
              onClick={fetchDersDetay}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Yenile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/ogrenci/canli-ders')}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">{ders.baslik}</h1>
                <p className="text-xs text-slate-400">
                  {ders.course.sinif.ad} - {ders.course.ad} | {ders.ogretmen.ad} {ders.ogretmen.soyad}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="w-5 h-5" />
                <span>{participantCount} katılımcı</span>
              </div>
              <span className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                CANLI
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="aspect-video max-h-[calc(100vh-180px)]">
          <JitsiMeet
            roomName={ders.odaAdi}
            displayName={user ? `${user.ad} ${user.soyad}` : 'Öğrenci'}
            email={user?.email}
            isTeacher={false}
            password={ders.odaSifresi}
            startWithAudioMuted={!ders.mikrofonAcik}
            startWithVideoMuted={!ders.kameraAcik}
            enableChat={ders.sohbetAcik}
            onParticipantJoined={handleParticipantJoined}
            onParticipantLeft={handleParticipantLeft}
            onMeetingEnd={handleMeetingEnd}
          />
        </div>

        {/* Ders Bilgileri */}
        {ders.aciklama && (
          <div className="mt-6 bg-slate-800/50 rounded-xl p-4">
            <h3 className="text-white font-medium mb-2">Ders Açıklaması</h3>
            <p className="text-slate-400">{ders.aciklama}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function OgrenciCanliDersOdasiPage({ params }: { params: Promise<{ dersId: string }> }) {
  return (
    <RoleGuard allowedRoles={['ogrenci']}>
      <OgrenciCanliDersOdasiContent params={params} />
    </RoleGuard>
  );
}

