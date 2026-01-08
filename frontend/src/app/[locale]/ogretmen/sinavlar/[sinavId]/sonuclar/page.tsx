'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Users, Clock, FileQuestion, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Award, Target, BarChart3, PieChart,
  Download, Filter, Search, ChevronDown, ChevronUp, Eye, X,
  AlertTriangle, Minus, User, Calendar, Timer
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';
import { useTheme } from '@/contexts/ThemeContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface SinavSonuc {
  id: string;
  ogrenci: {
    id: string;
    ad: string;
    soyad: string;
    sinif?: { ad: string };
  };
  puan: number;
  dogruSayisi: number;
  yanlisSayisi: number;
  bosSayisi: number;
  sure: number; // dakika cinsinden
  baslangicZamani: string;
  bitisZamani: string;
  cevaplar: {
    soruId: string;
    soruMetni: string;
    verilenCevap: string;
    dogruCevap: string;
    dogruMu: boolean;
    puan: number;
  }[];
}

interface SinavDetay {
  id: string;
  baslik: string;
  course: { ad: string };
  sure: number;
  maksimumPuan: number;
  soruSayisi: number;
  katilimciSayisi: number;
  tamamlayanSayisi: number;
  ortalamaPuan: number;
  enYuksekPuan: number;
  enDusukPuan: number;
  baslangicTarihi: string;
  bitisTarihi: string;
}

interface SoruAnaliz {
  soruId: string;
  soruMetni: string;
  dogruCevap: string;
  dogruSayisi: number;
  yanlisSayisi: number;
  bosSayisi: number;
  dogruOrani: number;
  secenekDagilimi: { [key: string]: number };
}

function SinavSonuclarContent() {
  const params = useParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const sinavId = params.sinavId as string;

  const [sinav, setSinav] = useState<SinavDetay | null>(null);
  const [sonuclar, setSonuclar] = useState<SinavSonuc[]>([]);
  const [soruAnalizleri, setSoruAnalizleri] = useState<SoruAnaliz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'puan' | 'ad' | 'sure'>('puan');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedStudent, setSelectedStudent] = useState<SinavSonuc | null>(null);
  const [activeTab, setActiveTab] = useState<'ogrenciler' | 'sorular'>('ogrenciler');

  useEffect(() => {
    if (sinavId) {
      fetchSinavDetay();
      fetchSonuclar();
    }
  }, [sinavId]);

  const fetchSinavDetay = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/online-sinav/${sinavId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setSinav(result.data);
      }
    } catch (error) {
      console.error('Sınav detayı yüklenemedi:', error);
    }
  };

  const fetchSonuclar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/online-sinav/${sinavId}/sonuclar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setSonuclar(result.data?.sonuclar || []);
        setSoruAnalizleri(result.data?.soruAnalizleri || []);
      }
    } catch (error) {
      console.error('Sonuçlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} sa ${mins} dk`;
  };

  const getScoreColor = (puan: number, maksimum: number) => {
    const oran = (puan / maksimum) * 100;
    if (oran >= 85) return isDark ? 'text-green-400' : 'text-green-600';
    if (oran >= 70) return isDark ? 'text-blue-400' : 'text-blue-600';
    if (oran >= 50) return isDark ? 'text-amber-400' : 'text-amber-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  const getScoreBg = (puan: number, maksimum: number) => {
    const oran = (puan / maksimum) * 100;
    if (oran >= 85) return isDark ? 'bg-green-500/20' : 'bg-green-100';
    if (oran >= 70) return isDark ? 'bg-blue-500/20' : 'bg-blue-100';
    if (oran >= 50) return isDark ? 'bg-amber-500/20' : 'bg-amber-100';
    return isDark ? 'bg-red-500/20' : 'bg-red-100';
  };

  const sortedSonuclar = [...sonuclar]
    .filter(s => {
      if (!searchTerm) return true;
      const fullName = `${s.ogrenci.ad} ${s.ogrenci.soyad}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'puan') comparison = a.puan - b.puan;
      else if (sortBy === 'ad') comparison = `${a.ogrenci.ad} ${a.ogrenci.soyad}`.localeCompare(`${b.ogrenci.ad} ${b.ogrenci.soyad}`);
      else if (sortBy === 'sure') comparison = a.sure - b.sure;
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const exportToCSV = () => {
    const headers = ['Sıra', 'Öğrenci', 'Sınıf', 'Puan', 'Doğru', 'Yanlış', 'Boş', 'Süre'];
    const rows = sortedSonuclar.map((s, i) => [
      i + 1,
      `${s.ogrenci.ad} ${s.ogrenci.soyad}`,
      s.ogrenci.sinif?.ad || '-',
      s.puan,
      s.dogruSayisi,
      s.yanlisSayisi,
      s.bosSayisi,
      `${s.sure} dk`
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${sinav?.baslik}_sonuclar.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-slate-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold">{sinav?.baslik || 'Sınav Sonuçları'}</h1>
                <p className="text-xs text-purple-200">{sinav?.course?.ad} • {sinav?.soruSayisi} Soru</p>
              </div>
            </div>
            
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Excel'e Aktar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* İstatistik Kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-xl border p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Users className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Katılımcı</span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {sinav?.tamamlayanSayisi || 0}/{sinav?.katilimciSayisi || 0}
            </p>
          </div>

          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-xl border p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ortalama</span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {sinav?.ortalamaPuan?.toFixed(1) || 0}
            </p>
          </div>

          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-xl border p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>En Yüksek</span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {sinav?.enYuksekPuan?.toFixed(1) || 0}
            </p>
          </div>

          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-xl border p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>En Düşük</span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {sinav?.enDusukPuan?.toFixed(1) || 0}
            </p>
          </div>

          <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-xl border p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Award className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Maks. Puan</span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {sinav?.maksimumPuan || 100}
            </p>
          </div>
        </div>

        {/* Tab Seçici */}
        <div className={`flex gap-2 mb-6 p-1 ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'} rounded-xl w-fit`}>
          <button
            onClick={() => setActiveTab('ogrenciler')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'ogrenciler'
                ? 'bg-purple-600 text-white'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Öğrenci Sonuçları
          </button>
          <button
            onClick={() => setActiveTab('sorular')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'sorular'
                ? 'bg-purple-600 text-white'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Soru Analizi
          </button>
        </div>

        {activeTab === 'ogrenciler' && (
          <>
            {/* Arama ve Sıralama */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Öğrenci ara..."
                  className={`w-full pl-10 pr-4 py-2.5 ${isDark ? 'bg-[#1a1f2e] border-slate-700/50 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'puan' | 'ad' | 'sure')}
                  className={`px-4 py-2.5 ${isDark ? 'bg-[#1a1f2e] border-slate-700/50 text-white' : 'bg-white border-slate-200 text-slate-800'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
                >
                  <option value="puan">Puana Göre</option>
                  <option value="ad">İsme Göre</option>
                  <option value="sure">Süreye Göre</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className={`p-2.5 ${isDark ? 'bg-[#1a1f2e] border-slate-700/50 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'} border rounded-xl transition-colors`}
                >
                  {sortOrder === 'desc' ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Sonuç Listesi */}
            <div className="space-y-3">
              {sortedSonuclar.length > 0 ? sortedSonuclar.map((sonuc, index) => (
                <div
                  key={sonuc.id}
                  className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50 hover:border-purple-500/50' : 'bg-white border-slate-200 hover:border-purple-300'} rounded-xl border p-4 transition-all cursor-pointer`}
                  onClick={() => setSelectedStudent(sonuc)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Sıralama Badge */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                        isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                      
                      {/* Öğrenci Bilgisi */}
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          {sonuc.ogrenci.ad} {sonuc.ogrenci.soyad}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {sonuc.ogrenci.sinif?.ad || 'Sınıf belirtilmemiş'}
                        </p>
                      </div>
                    </div>

                    {/* İstatistikler */}
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex items-center gap-4 text-sm">
                        <span className={`flex items-center gap-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          <CheckCircle className="w-4 h-4" />
                          {sonuc.dogruSayisi}
                        </span>
                        <span className={`flex items-center gap-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                          <XCircle className="w-4 h-4" />
                          {sonuc.yanlisSayisi}
                        </span>
                        <span className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Minus className="w-4 h-4" />
                          {sonuc.bosSayisi}
                        </span>
                        <span className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Timer className="w-4 h-4" />
                          {sonuc.sure} dk
                        </span>
                      </div>

                      {/* Puan */}
                      <div className={`px-4 py-2 rounded-xl font-bold ${getScoreBg(sonuc.puan, sinav?.maksimumPuan || 100)} ${getScoreColor(sonuc.puan, sinav?.maksimumPuan || 100)}`}>
                        {sonuc.puan.toFixed(1)}
                      </div>

                      <Eye className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                  </div>
                </div>
              )) : (
                <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-xl border p-12 text-center`}>
                  <Users className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Henüz sonuç bulunmuyor</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'sorular' && (
          <div className="space-y-4">
            {soruAnalizleri.length > 0 ? soruAnalizleri.map((soru, index) => (
              <div
                key={soru.soruId}
                className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-xl border p-5`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                        Soru {index + 1}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Doğru Cevap: {soru.dogruCevap}
                      </span>
                    </div>
                    <p className={`${isDark ? 'text-white' : 'text-slate-800'}`}>{soru.soruMetni}</p>
                  </div>
                  <div className={`ml-4 px-4 py-2 rounded-xl text-center ${
                    soru.dogruOrani >= 70 
                      ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                      : soru.dogruOrani >= 50
                        ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                        : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                  }`}>
                    <p className="text-2xl font-bold">{soru.dogruOrani.toFixed(0)}%</p>
                    <p className="text-xs">Doğru Oranı</p>
                  </div>
                </div>

                {/* İstatistikler */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={`text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>Doğru: {soru.dogruSayisi}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-2">
                      <XCircle className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                      <span className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>Yanlış: {soru.yanlisSayisi}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-500/10' : 'bg-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      <Minus className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Boş: {soru.bosSayisi}</span>
                    </div>
                  </div>
                </div>

                {/* Şık Dağılımı */}
                <div className="space-y-2">
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Şık Dağılımı</p>
                  <div className="flex gap-2">
                    {['A', 'B', 'C', 'D', 'E'].map(sik => {
                      const count = soru.secenekDagilimi?.[sik] || 0;
                      const total = soru.dogruSayisi + soru.yanlisSayisi;
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      const isCorrect = sik === soru.dogruCevap;
                      
                      return (
                        <div key={sik} className="flex-1">
                          <div className={`text-center text-xs mb-1 ${
                            isCorrect 
                              ? isDark ? 'text-green-400 font-bold' : 'text-green-600 font-bold'
                              : isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {sik} {isCorrect && '✓'}
                          </div>
                          <div className={`h-8 rounded-lg overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                            <div
                              className={`h-full transition-all ${
                                isCorrect 
                                  ? 'bg-gradient-to-t from-green-600 to-green-400' 
                                  : 'bg-gradient-to-t from-slate-500 to-slate-400'
                              }`}
                              style={{ height: `${percentage}%` }}
                            />
                          </div>
                          <div className={`text-center text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )) : (
              <div className={`${isDark ? 'bg-[#1a1f2e] border-slate-700/50' : 'bg-white border-slate-200'} rounded-xl border p-12 text-center`}>
                <BarChart3 className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Soru analizi için yeterli veri yok</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Öğrenci Detay Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`${isDark ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-2xl w-full max-w-2xl my-8 max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Modal Header */}
            <div className={`p-5 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'} flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                }`}>
                  <User className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {selectedStudent.ogrenci.ad} {selectedStudent.ogrenci.soyad}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {selectedStudent.ogrenci.sinif?.ad || 'Sınıf belirtilmemiş'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {/* Özet İstatistikler */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                  <p className={`text-2xl font-bold ${getScoreColor(selectedStudent.puan, sinav?.maksimumPuan || 100)}`}>
                    {selectedStudent.puan.toFixed(1)}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Puan</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                  <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {selectedStudent.dogruSayisi}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-green-400/70' : 'text-green-600'}`}>Doğru</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                  <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {selectedStudent.yanlisSayisi}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-red-400/70' : 'text-red-600'}`}>Yanlış</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-slate-500/10' : 'bg-slate-100'}`}>
                  <p className={`text-2xl font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {selectedStudent.bosSayisi}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Boş</p>
                </div>
              </div>

              {/* Zaman Bilgisi */}
              <div className={`flex items-center gap-4 p-3 rounded-xl mb-6 ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {formatDate(selectedStudent.baslangicZamani)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {selectedStudent.sure} dakika
                  </span>
                </div>
              </div>

              {/* Cevap Detayları */}
              <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>Cevap Detayları</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedStudent.cevaplar?.map((cevap, index) => (
                  <div
                    key={cevap.soruId}
                    className={`p-3 rounded-xl ${
                      cevap.dogruMu
                        ? isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
                        : cevap.verilenCevap
                          ? isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
                          : isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {index + 1}. {cevap.soruMetni.length > 100 ? cevap.soruMetni.substring(0, 100) + '...' : cevap.soruMetni}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                            Verilen: <strong className={cevap.dogruMu ? isDark ? 'text-green-400' : 'text-green-600' : isDark ? 'text-red-400' : 'text-red-600'}>
                              {cevap.verilenCevap || 'Boş'}
                            </strong>
                          </span>
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                            Doğru: <strong className={isDark ? 'text-green-400' : 'text-green-600'}>{cevap.dogruCevap}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {cevap.dogruMu ? (
                          <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        ) : cevap.verilenCevap ? (
                          <XCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                        ) : (
                          <Minus className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        )}
                        <span className={`text-sm font-medium ${
                          cevap.dogruMu ? isDark ? 'text-green-400' : 'text-green-600' : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {cevap.dogruMu ? `+${cevap.puan}` : '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SinavSonuclarPage() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <SinavSonuclarContent />
    </RoleGuard>
  );
}

