'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Calendar, Users, CheckCircle, XCircle,
  Clock, Filter, ChevronDown, ChevronUp, UserCheck, UserX,
  Download, AlertCircle, BookOpen
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Sinif {
  id: string;
  ad: string;
  seviye?: number;
  ogrenciSayisi?: number;
}

interface Ders {
  id: string;
  ad: string;
  sinif?: Sinif;
  ogretmen?: { ad: string; soyad: string };
}

interface YoklamaKaydi {
  id: string;
  ogrenci: {
    id: string;
    ad: string;
    soyad: string;
    ogrenciNo: string;
  };
  durum: 'VAR' | 'YOK' | 'GEC' | 'IZINLI';
  tarih: string;
  aciklama?: string;
}

interface GunlukYoklama {
  tarih: string;
  ders: Ders;
  kayitlar: YoklamaKaydi[];
  toplamOgrenci: number;
  gelenSayisi: number;
  katilimOrani: number;
}

function SekreterYoklamaContent() {
  const [siniflar, setSiniflar] = useState<Sinif[]>([]);
  const [dersler, setDersler] = useState<Ders[]>([]);
  const [selectedSinif, setSelectedSinif] = useState<string>('');
  const [selectedDers, setSelectedDers] = useState<string>('');
  const [selectedTarih, setSelectedTarih] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [yoklamaKayitlari, setYoklamaKayitlari] = useState<YoklamaKaydi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingYoklama, setLoadingYoklama] = useState(false);
  const [istatistik, setIstatistik] = useState({
    toplamOgrenci: 0,
    gelenSayisi: 0,
    gelmeyenSayisi: 0,
    gecSayisi: 0,
    izinliSayisi: 0
  });

  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }), []);

  useEffect(() => {
    fetchSiniflar();
  }, []);

  useEffect(() => {
    if (selectedSinif) {
      fetchDersler(selectedSinif);
    } else {
      setDersler([]);
      setSelectedDers('');
    }
  }, [selectedSinif]);

  useEffect(() => {
    if (selectedDers && selectedTarih) {
      fetchYoklama();
    }
  }, [selectedDers, selectedTarih]);

  const fetchSiniflar = async () => {
    try {
      const res = await fetch(`${API_URL}/users/siniflar`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success !== false) {
        setSiniflar(data.data || data || []);
      }
    } catch (error) {
      console.error('Sınıflar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDersler = async (sinifId: string) => {
    try {
      const res = await fetch(`${API_URL}/courses?sinifId=${sinifId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success !== false) {
        setDersler(data.data || data || []);
      }
    } catch (error) {
      console.error('Dersler yüklenemedi:', error);
    }
  };

  const fetchYoklama = async () => {
    if (!selectedDers || !selectedTarih) return;
    
    setLoadingYoklama(true);
    try {
      const res = await fetch(
        `${API_URL}/yoklama/ders/${selectedDers}?tarih=${selectedTarih}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      
      if (data.success) {
        const kayitlar = data.data?.kayitlar || [];
        setYoklamaKayitlari(kayitlar);
        
        // İstatistikleri hesapla
        const gelenSayisi = kayitlar.filter((k: YoklamaKaydi) => k.durum === 'VAR').length;
        const gelmeyenSayisi = kayitlar.filter((k: YoklamaKaydi) => k.durum === 'YOK').length;
        const gecSayisi = kayitlar.filter((k: YoklamaKaydi) => k.durum === 'GEC').length;
        const izinliSayisi = kayitlar.filter((k: YoklamaKaydi) => k.durum === 'IZINLI').length;
        
        setIstatistik({
          toplamOgrenci: kayitlar.length,
          gelenSayisi,
          gelmeyenSayisi,
          gecSayisi,
          izinliSayisi
        });
      }
    } catch (error) {
      console.error('Yoklama yüklenemedi:', error);
    } finally {
      setLoadingYoklama(false);
    }
  };

  const getDurumBadge = (durum: string) => {
    const badges: Record<string, { bg: string; text: string; icon: typeof CheckCircle; label: string }> = {
      VAR: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Geldi' },
      YOK: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Gelmedi' },
      GEC: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Geç Geldi' },
      IZINLI: { bg: 'bg-blue-100', text: 'text-blue-700', icon: AlertCircle, label: 'İzinli' }
    };
    const badge = badges[durum] || badges.YOK;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const katilimOrani = istatistik.toplamOgrenci > 0
    ? Math.round((istatistik.gelenSayisi / istatistik.toplamOgrenci) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/sekreter" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold">Yoklama Takibi</h1>
                <p className="text-xs text-teal-100">Devamsızlık kayıtlarını görüntüleyin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filtreler */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf</label>
              <select
                value={selectedSinif}
                onChange={(e) => setSelectedSinif(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Sınıf Seçin</option>
                {siniflar.map(sinif => (
                  <option key={sinif.id} value={sinif.id}>{sinif.ad}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ders</label>
              <select
                value={selectedDers}
                onChange={(e) => setSelectedDers(e.target.value)}
                disabled={!selectedSinif}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
              >
                <option value="">Ders Seçin</option>
                {dersler.map(ders => (
                  <option key={ders.id} value={ders.id}>{ders.ad}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tarih</label>
              <input
                type="date"
                value={selectedTarih}
                onChange={(e) => setSelectedTarih(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        {selectedDers && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs">Toplam</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{istatistik.toplamOgrenci}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 text-green-500 mb-2">
                <UserCheck className="w-4 h-4" />
                <span className="text-xs">Gelen</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{istatistik.gelenSayisi}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <UserX className="w-4 h-4" />
                <span className="text-xs">Gelmeyen</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{istatistik.gelmeyenSayisi}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Geç</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{istatistik.gecSayisi}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 text-blue-500 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">İzinli</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{istatistik.izinliSayisi}</p>
            </div>
          </div>
        )}

        {/* Katılım Oranı */}
        {selectedDers && istatistik.toplamOgrenci > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Katılım Oranı</span>
              <span className="text-sm font-bold text-teal-600">%{katilimOrani}</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  katilimOrani >= 80 ? 'bg-green-500' :
                  katilimOrani >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${katilimOrani}%` }}
              />
            </div>
          </div>
        )}

        {/* Yoklama Listesi */}
        {selectedDers ? (
          loadingYoklama ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Yoklama yükleniyor...</p>
            </div>
          ) : yoklamaKayitlari.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left text-sm font-medium text-slate-600 p-4">Öğrenci No</th>
                      <th className="text-left text-sm font-medium text-slate-600 p-4">Ad Soyad</th>
                      <th className="text-center text-sm font-medium text-slate-600 p-4">Durum</th>
                      <th className="text-left text-sm font-medium text-slate-600 p-4">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yoklamaKayitlari.map((kayit) => (
                      <tr key={kayit.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 text-sm text-slate-600">{kayit.ogrenci.ogrenciNo}</td>
                        <td className="p-4">
                          <span className="font-medium text-slate-800">
                            {kayit.ogrenci.ad} {kayit.ogrenci.soyad}
                          </span>
                        </td>
                        <td className="p-4 text-center">{getDurumBadge(kayit.durum)}</td>
                        <td className="p-4 text-sm text-slate-500">{kayit.aciklama || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">Yoklama Kaydı Yok</h3>
              <p className="text-slate-500">Seçilen tarih ve ders için yoklama kaydı bulunamadı.</p>
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">Ders Seçin</h3>
            <p className="text-slate-500">Yoklama kayıtlarını görmek için sınıf ve ders seçin.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SekreterYoklamaPage() {
  return (
    <RoleGuard allowedRoles={['sekreter', 'mudur']}>
      <SekreterYoklamaContent />
    </RoleGuard>
  );
}


