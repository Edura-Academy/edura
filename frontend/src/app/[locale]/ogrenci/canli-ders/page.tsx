'use client';

import { useState, useEffect } from 'react';
import {
  Video,
  Play,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  History,
  Radio,
  Bell
} from 'lucide-react';

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
  katildiMi: boolean;
}

interface KatilimGecmisi {
  id: string;
  canliDers: {
    baslik: string;
    course: {
      ad: string;
    };
    ogretmen: {
      ad: string;
      soyad: string;
    };
  };
  girisZamani: string;
  cikisZamani?: string;
  toplamSure?: number;
}

export default function OgrenciCanliDersPage() {
  const [aktivDersler, setAktivDersler] = useState<CanliDers[]>([]);
  const [yaklasanDersler, setYaklasanDersler] = useState<CanliDers[]>([]);
  const [gecmisDersler, setGecmisDersler] = useState<CanliDers[]>([]);
  const [katilimGecmisi, setKatilimGecmisi] = useState<KatilimGecmisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'aktif' | 'yaklasan' | 'gecmis' | 'katilimlar'>('aktif');
  const [joining, setJoining] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [aktivRes, tumRes, gecmisRes] = await Promise.all([
        fetch(`${API_URL}/canli-ders/ogrenci/liste?durum=AKTIF`, { headers }),
        fetch(`${API_URL}/canli-ders/ogrenci/liste?durum=PLANLANMIS`, { headers }),
        fetch(`${API_URL}/canli-ders/ogrenci/katilim-gecmisi`, { headers })
      ]);

      const aktiv = await aktivRes.json();
      const tum = await tumRes.json();
      const gecmis = await gecmisRes.json();

      setAktivDersler(aktiv);
      setYaklasanDersler(tum);
      setKatilimGecmisi(gecmis);

      // Geçmiş dersleri al
      const gecmisDerslerRes = await fetch(`${API_URL}/canli-ders/ogrenci/liste?durum=SONA_ERDI`, { headers });
      const gecmisDerslerData = await gecmisDerslerRes.json();
      setGecmisDersler(gecmisDerslerData);
    } catch (error) {
      console.error('Veri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinDers = async (dersId: string) => {
    setJoining(dersId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/canli-ders/${dersId}/katil`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok) {
        // Yeni sekmede aç
        window.open(data.joinUrl, '_blank');
        fetchData();
      } else {
        alert(data.error || 'Derse katılınamadı');
      }
    } catch (error) {
      console.error('Katılım hatası:', error);
      alert('Bir hata oluştu');
    } finally {
      setJoining(null);
    }
  };

  const leaveDers = async (dersId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/canli-ders/${dersId}/cik`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntil = (date: string) => {
    const now = new Date();
    const target = new Date(date);
    const diff = target.getTime() - now.getTime();

    if (diff < 0) return 'Geçmiş';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} gün ${hours} saat`;
    if (hours > 0) return `${hours} saat ${minutes} dakika`;
    return `${minutes} dakika`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
            <Video className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Canlı Dersler</h1>
            <p className="text-gray-400">Öğretmenlerinizin canlı derslerine katılın</p>
          </div>
        </div>

        {/* Aktif Ders Banner */}
        {aktivDersler.length > 0 && (
          <div className="mb-8">
            {aktivDersler.map(ders => (
              <div
                key={ders.id}
                className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/50 rounded-2xl p-6 animate-pulse-slow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="p-4 bg-red-500 rounded-xl">
                        <Radio className="w-8 h-8 text-white" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"></span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded uppercase">
                          Canlı
                        </span>
                        <h3 className="text-xl font-bold text-white">{ders.baslik}</h3>
                      </div>
                      <p className="text-gray-300">
                        {ders.course.sinif.ad} - {ders.course.ad}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {ders.ogretmen.ad} {ders.ogretmen.soyad}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => joinDers(ders.id)}
                    disabled={joining === ders.id}
                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all text-lg font-semibold shadow-lg disabled:opacity-50"
                  >
                    {joining === ders.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Play className="w-6 h-6" />
                        {ders.katildiMi ? 'Derse Geri Dön' : 'Derse Katıl'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'aktif', label: 'Aktif Dersler', icon: Radio, count: aktivDersler.length },
            { id: 'yaklasan', label: 'Yaklaşan', icon: Calendar, count: yaklasanDersler.length },
            { id: 'gecmis', label: 'Geçmiş', icon: History, count: gecmisDersler.length },
            { id: 'katilimlar', label: 'Katılımlarım', icon: CheckCircle, count: katilimGecmisi.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  tab.id === 'aktif' && tab.count > 0 ? 'bg-red-500 text-white' : 'bg-white/20'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'aktif' && (
          <div>
            {aktivDersler.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center">
                <Radio className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Şu an aktif ders yok</h3>
                <p className="text-gray-400">Yaklaşan derslerinizi kontrol edin</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {aktivDersler.map(ders => (
                  <DersCard key={ders.id} ders={ders} onJoin={joinDers} joining={joining} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'yaklasan' && (
          <div>
            {yaklasanDersler.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Yaklaşan ders yok</h3>
                <p className="text-gray-400">Öğretmenleriniz yeni dersler planladığında burada görünecek</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {yaklasanDersler.map(ders => (
                  <div
                    key={ders.id}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">{ders.baslik}</h3>
                        <p className="text-gray-400 mb-2">
                          {ders.course.sinif.ad} - {ders.course.ad}
                        </p>
                        <p className="text-gray-500 text-sm mb-3">
                          Öğretmen: {ders.ogretmen.ad} {ders.ogretmen.soyad}
                        </p>
                        {ders.aciklama && (
                          <p className="text-gray-300 text-sm mb-3">{ders.aciklama}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(ders.baslangicTarihi)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {getTimeUntil(ders.baslangicTarihi)} sonra
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                          Planlandı
                        </span>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-gray-300 rounded-lg"
                          disabled
                        >
                          <Bell className="w-4 h-4" />
                          Hatırlat
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'gecmis' && (
          <div>
            {gecmisDersler.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center">
                <History className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Geçmiş ders yok</h3>
                <p className="text-gray-400">Biten dersler burada görünecek</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {gecmisDersler.map(ders => (
                  <div
                    key={ders.id}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold text-white">{ders.baslik}</h3>
                          {ders.katildiMi && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Katıldın
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 mb-2">
                          {ders.course.sinif.ad} - {ders.course.ad}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {formatDate(ders.baslangicTarihi)}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">
                        Bitti
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'katilimlar' && (
          <div>
            {katilimGecmisi.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center">
                <CheckCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Henüz katılım yok</h3>
                <p className="text-gray-400">Canlı derslere katıldığınızda burada görünecek</p>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-gray-400 text-sm p-4">Ders</th>
                      <th className="text-left text-gray-400 text-sm p-4">Öğretmen</th>
                      <th className="text-left text-gray-400 text-sm p-4">Giriş</th>
                      <th className="text-left text-gray-400 text-sm p-4">Çıkış</th>
                      <th className="text-left text-gray-400 text-sm p-4">Süre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {katilimGecmisi.map(k => (
                      <tr key={k.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4">
                          <div className="text-white font-medium">{k.canliDers.baslik}</div>
                          <div className="text-gray-500 text-sm">{k.canliDers.course.ad}</div>
                        </td>
                        <td className="p-4 text-gray-300">
                          {k.canliDers.ogretmen.ad} {k.canliDers.ogretmen.soyad}
                        </td>
                        <td className="p-4 text-gray-300 text-sm">
                          {formatDate(k.girisZamani)}
                        </td>
                        <td className="p-4 text-gray-300 text-sm">
                          {k.cikisZamani ? formatTime(k.cikisZamani) : '-'}
                        </td>
                        <td className="p-4">
                          {k.toplamSure ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                              {k.toplamSure} dk
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Ders Card Component
function DersCard({ 
  ders, 
  onJoin, 
  joining 
}: { 
  ders: CanliDers; 
  onJoin: (id: string) => void;
  joining: string | null;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/50 shadow-green-500/20 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-white">{ders.baslik}</h3>
            <span className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              CANLI
            </span>
          </div>
          <p className="text-gray-400 mb-2">
            {ders.course.sinif.ad} - {ders.course.ad}
          </p>
          <p className="text-gray-500 text-sm mb-3">
            Öğretmen: {ders.ogretmen.ad} {ders.ogretmen.soyad}
          </p>
          {ders.aciklama && (
            <p className="text-gray-300 text-sm mb-3">{ders.aciklama}</p>
          )}
        </div>
        <button
          onClick={() => onJoin(ders.id)}
          disabled={joining === ders.id}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold disabled:opacity-50"
        >
          {joining === ders.id ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <ExternalLink className="w-5 h-5" />
              {ders.katildiMi ? 'Geri Dön' : 'Katıl'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

