'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Search, FileQuestion, Users, Calendar,
  BarChart2, Download, Filter, Eye, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Award, Clock
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Sinav {
  id: string;
  baslik: string;
  dersAdi: string;
  course?: { ad: string; sinif?: { ad: string } };
  sure: number;
  durum: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  soruSayisi: number;
  katilimciSayisi: number;
  tamamlayanSayisi: number;
  ortalamaPuan?: number;
  ogretmen?: { ad: string; soyad: string };
}

interface SinavSonuc {
  ogrenci: {
    id: string;
    ad: string;
    soyad: string;
    ogrenciNo: string;
    sinif?: { ad: string };
  };
  toplamPuan: number;
  yuzde: number;
  dogruSayisi: number;
  yanlisSayisi: number;
  bosSayisi: number;
  tamamlanmaTarihi: string;
}

function SekreterSinavSonuclariContent() {
  const router = useRouter();
  const [sinavlar, setSinavlar] = useState<Sinav[]>([]);
  const [selectedSinav, setSelectedSinav] = useState<Sinav | null>(null);
  const [sonuclar, setSonuclar] = useState<SinavSonuc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSonuclar, setLoadingSonuclar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [durumFilter, setDurumFilter] = useState('');
  const [expandedSinav, setExpandedSinav] = useState<string | null>(null);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    fetchSinavlar();
  }, []);

  const fetchSinavlar = async () => {
    try {
      const res = await fetch(`${API_URL}/online-sinav/personel/liste`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setSinavlar(data.data || []);
      }
    } catch (error) {
      console.error('Sınavlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSonuclar = async (sinavId: string) => {
    setLoadingSonuclar(true);
    try {
      const res = await fetch(`${API_URL}/online-sinav/personel/${sinavId}/sonuclar`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setSonuclar(data.data?.sonuclar || []);
      }
    } catch (error) {
      console.error('Sonuçlar yüklenemedi:', error);
    } finally {
      setLoadingSonuclar(false);
    }
  };

  const handleSinavSelect = (sinav: Sinav) => {
    if (expandedSinav === sinav.id) {
      setExpandedSinav(null);
      setSonuclar([]);
    } else {
      setExpandedSinav(sinav.id);
      setSelectedSinav(sinav);
      fetchSonuclar(sinav.id);
    }
  };

  const getDurumBadge = (durum: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      TASLAK: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Taslak' },
      AKTIF: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktif' },
      SONA_ERDI: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Sona Erdi' },
      IPTAL: { bg: 'bg-red-100', text: 'text-red-700', label: 'İptal' }
    };
    const badge = badges[durum] || badges.TASLAK;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSinavlar = sinavlar.filter(sinav => {
    const matchSearch = searchTerm === '' ||
      sinav.baslik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sinav.course?.ad || sinav.dersAdi || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDurum = durumFilter === '' || sinav.durum === durumFilter;
    return matchSearch && matchDurum;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Sınavlar yükleniyor...</p>
        </div>
      </div>
    );
  }

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
                <h1 className="text-lg font-semibold">Sınav Sonuçları</h1>
                <p className="text-xs text-teal-100">Tüm sınav sonuçlarını görüntüleyin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filtreler */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Sınav veya ders ara..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={durumFilter}
            onChange={(e) => setDurumFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="AKTIF">Aktif</option>
            <option value="SONA_ERDI">Sona Erdi</option>
            <option value="TASLAK">Taslak</option>
          </select>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <FileQuestion className="w-4 h-4" />
              <span className="text-xs">Toplam Sınav</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{sinavlar.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Aktif</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {sinavlar.filter(s => s.durum === 'AKTIF').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Tamamlanan</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {sinavlar.filter(s => s.durum === 'SONA_ERDI').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs">Toplam Katılım</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {sinavlar.reduce((sum, s) => sum + (s.katilimciSayisi || 0), 0)}
            </p>
          </div>
        </div>

        {/* Sınav Listesi */}
        <div className="space-y-4">
          {filteredSinavlar.length > 0 ? (
            filteredSinavlar.map((sinav) => (
              <div key={sinav.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => handleSinavSelect(sinav)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <FileQuestion className="w-6 h-6 text-teal-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-slate-800">{sinav.baslik}</h3>
                      <p className="text-sm text-teal-600">{sinav.course?.ad || sinav.dersAdi}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
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
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getDurumBadge(sinav.durum)}
                    {expandedSinav === sinav.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Sonuçlar */}
                {expandedSinav === sinav.id && (
                  <div className="border-t border-slate-100 p-4">
                    {loadingSonuclar ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                      </div>
                    ) : sonuclar.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left text-xs font-medium text-slate-500 p-3">Sıra</th>
                              <th className="text-left text-xs font-medium text-slate-500 p-3">Öğrenci</th>
                              <th className="text-center text-xs font-medium text-slate-500 p-3">Puan</th>
                              <th className="text-center text-xs font-medium text-slate-500 p-3">Başarı</th>
                              <th className="text-center text-xs font-medium text-slate-500 p-3">D/Y/B</th>
                              <th className="text-center text-xs font-medium text-slate-500 p-3">Tarih</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sonuclar.map((sonuc, index) => (
                              <tr key={sonuc.ogrenci.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="p-3">
                                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    index === 1 ? 'bg-slate-200 text-slate-700' :
                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {index + 1}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="font-medium text-slate-800">
                                    {sonuc.ogrenci.ad} {sonuc.ogrenci.soyad}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {sonuc.ogrenci.ogrenciNo} • {sonuc.ogrenci.sinif?.ad || 'Sınıf yok'}
                                  </div>
                                </td>
                                <td className="p-3 text-center font-bold text-slate-800">
                                  {sonuc.toplamPuan}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`font-bold ${
                                    sonuc.yuzde >= 70 ? 'text-green-600' :
                                    sonuc.yuzde >= 50 ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    %{sonuc.yuzde}
                                  </span>
                                </td>
                                <td className="p-3 text-center text-sm">
                                  <span className="text-green-600">{sonuc.dogruSayisi}</span>
                                  {' / '}
                                  <span className="text-red-600">{sonuc.yanlisSayisi}</span>
                                  {' / '}
                                  <span className="text-slate-400">{sonuc.bosSayisi}</span>
                                </td>
                                <td className="p-3 text-center text-xs text-slate-500">
                                  {formatDate(sonuc.tamamlanmaTarihi)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>Henüz sonuç bulunmuyor</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <FileQuestion className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">Sınav Bulunamadı</h3>
              <p className="text-slate-500">Arama kriterlerinize uygun sınav yok.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SekreterSinavSonuclariPage() {
  return (
    <RoleGuard allowedRoles={['sekreter', 'mudur']}>
      <SekreterSinavSonuclariContent />
    </RoleGuard>
  );
}


