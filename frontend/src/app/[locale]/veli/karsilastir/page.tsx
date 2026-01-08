'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Users, TrendingUp, TrendingDown, Minus,
  BookOpen, Calendar, FileText, Award, AlertCircle,
  BarChart3, Target, CheckCircle, XCircle, Clock,
  ChevronRight, Star, Zap, Trophy, Medal
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface CocukKarsilastirma {
  id: string;
  ad: string;
  soyad: string;
  ogrenciNo: string;
  sinif: {
    id: string;
    ad: string;
    seviye: number;
  } | null;
  istatistikler: {
    devamsizlikSayisi: number;
    sinavOrtalamasi: number | null;
    sinavSayisi: number;
    odevTeslimOrani: number | null;
    odevOrtalamasi: number | null;
    odevSayisi: number;
    katilimOrani: number | null;
  };
}

type MetricKey = keyof CocukKarsilastirma['istatistikler'];

interface MetricConfig {
  key: MetricKey;
  label: string;
  icon: any;
  suffix: string;
  reverseComparison?: boolean;
  description: string;
}

const METRICS: MetricConfig[] = [
  { key: 'sinavOrtalamasi', label: 'Sınav Ortalaması', icon: BookOpen, suffix: '%', description: 'Son dönem sınav ortalaması' },
  { key: 'odevTeslimOrani', label: 'Ödev Teslim', icon: FileText, suffix: '%', description: 'Zamanında teslim edilen ödevler' },
  { key: 'odevOrtalamasi', label: 'Ödev Puanı', icon: Target, suffix: '%', description: 'Ödev değerlendirme ortalaması' },
  { key: 'katilimOrani', label: 'Derse Katılım', icon: Calendar, suffix: '%', description: 'Derslere katılım oranı' },
  { key: 'devamsizlikSayisi', label: 'Devamsızlık', icon: AlertCircle, suffix: ' gün', reverseComparison: true, description: 'Son 30 günde devamsızlık' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function VeliKarsilastirContent() {
  const router = useRouter();
  const { theme } = useTheme();
  const { speak, stop, ttsEnabled } = useAccessibility();
  const isDark = theme === 'dark';
  
  // TTS yardımcı fonksiyonu
  const ttsHandlers = useCallback((text: string) => ({
    onMouseEnter: () => ttsEnabled && speak(text),
    onMouseLeave: () => stop(),
    onFocus: () => ttsEnabled && speak(text),
    onBlur: () => stop(),
    tabIndex: 0,
    'aria-label': text,
  }), [ttsEnabled, speak, stop]);
  
  const [data, setData] = useState<CocukKarsilastirma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('sinavOrtalamasi');

  useEffect(() => {
    fetchKarsilastirma();
  }, []);

  const fetchKarsilastirma = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/veli/karsilastir`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data.cocuklar || []);
      } else {
        setError('Veriler yüklenemedi');
      }
    } catch (err) {
      console.error('Karşılaştırma hatası:', err);
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getScoreInfo = (value: number | null, reverseComparison: boolean = false) => {
    if (value === null) return { color: 'gray', label: 'Veri yok', level: 0 };
    
    if (reverseComparison) {
      // Devamsızlık için düşük değer iyi
      if (value === 0) return { color: 'emerald', label: 'Mükemmel', level: 100 };
      if (value <= 2) return { color: 'emerald', label: 'Çok İyi', level: 90 };
      if (value <= 5) return { color: 'amber', label: 'Orta', level: 60 };
      return { color: 'red', label: 'Dikkat!', level: 30 };
    }
    
    if (value >= 85) return { color: 'emerald', label: 'Mükemmel', level: value };
    if (value >= 70) return { color: 'emerald', label: 'Çok İyi', level: value };
    if (value >= 55) return { color: 'amber', label: 'Orta', level: value };
    if (value >= 40) return { color: 'orange', label: 'Geliştirilmeli', level: value };
    return { color: 'red', label: 'Dikkat!', level: value };
  };

  const getColorClasses = (color: string, type: 'bg' | 'text' | 'border' = 'text') => {
    const classes: Record<string, Record<string, string>> = {
      emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' },
      amber: { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
      red: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
      gray: { bg: 'bg-gray-400', text: 'text-gray-400', border: 'border-gray-400' },
    };
    return classes[color]?.[type] || classes.gray[type];
  };

  // En iyi performans gösteren çocuğu bul
  const getBestChild = (metric: MetricConfig): string | null => {
    if (data.length === 0) return null;
    
    const sortedData = [...data].sort((a, b) => {
      const aVal = a.istatistikler[metric.key];
      const bVal = b.istatistikler[metric.key];
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (metric.reverseComparison) return (aVal as number) - (bVal as number);
      return (bVal as number) - (aVal as number);
    });
    
    return sortedData[0]?.id || null;
  };

  // Genel performans skoru hesapla
  const calculateOverallScore = (cocuk: CocukKarsilastirma): number => {
    const scores = [
      cocuk.istatistikler.sinavOrtalamasi,
      cocuk.istatistikler.odevTeslimOrani,
      cocuk.istatistikler.odevOrtalamasi,
      cocuk.istatistikler.katilimOrani,
    ].filter(s => s !== null) as number[];
    
    // Devamsızlık için ters hesaplama
    const devamsizlik = cocuk.istatistikler.devamsizlikSayisi;
    const devamsizlikScore = Math.max(0, 100 - (devamsizlik * 10));
    scores.push(devamsizlikScore);
    
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  // Sıralı çocuklar (genel performansa göre)
  const rankedChildren = useMemo(() => {
    return [...data].map(cocuk => ({
      ...cocuk,
      overallScore: calculateOverallScore(cocuk)
    })).sort((a, b) => b.overallScore - a.overallScore);
  }, [data]);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className={`w-16 h-16 border-4 ${isDark ? 'border-indigo-900' : 'border-indigo-200'} rounded-full`}></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-8 text-center max-w-md`}>
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Bir Hata Oluştu
          </h3>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          <button 
            onClick={() => router.push('/veli')}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  if (data.length < 1) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-8 text-center max-w-md`}>
          <div className={`w-16 h-16 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Users className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Öğrenci Bulunamadı
          </h3>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Karşılaştırma için kayıtlı öğrenciniz bulunmuyor.
          </p>
          <button 
            onClick={() => router.push('/veli')}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const selectedMetricConfig = METRICS.find(m => m.key === selectedMetric)!;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border-b sticky top-0 z-40`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/veli')}
                className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Performans Karşılaştırma
                </h1>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {data.length} öğrenci • Son 30 gün verileri
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Genel Sıralama - Tek Çocuk İçin de Göster */}
        <div className="mb-8">
          <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Trophy className="w-5 h-5 text-amber-500" />
            Genel Performans
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankedChildren.map((cocuk, index) => {
              const scoreInfo = getScoreInfo(cocuk.overallScore);
              const rankIcon = index === 0 ? Trophy : index === 1 ? Medal : index === 2 ? Star : null;
              const rankColor = index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : '';
              
              return (
            <div 
              key={cocuk.id}
              onClick={() => router.push(`/veli/cocuk/${cocuk.id}`)}
                  className={`${isDark ? 'bg-gray-800 border-gray-700 hover:border-indigo-500/50' : 'bg-white border-gray-200 hover:border-indigo-300'} 
                    rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-lg group`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white
                        ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                          'bg-gradient-to-br from-indigo-500 to-indigo-600'}`}
                      >
                  {cocuk.ad[0]}{cocuk.soyad[0]}
                        {rankIcon && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                            {(() => { const RankIcon = rankIcon; return <RankIcon className={`w-3 h-3 ${rankColor}`} />; })()}
                          </div>
                        )}
                </div>
                <div>
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {cocuk.ad} {cocuk.soyad}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {cocuk.sinif?.ad || 'Sınıf bilgisi yok'}
                        </p>
                </div>
              </div>
                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'} group-hover:translate-x-1 transition-transform`} />
                </div>

                  {/* Genel Skor */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Genel Performans</span>
                      <span className={`text-lg font-bold ${getColorClasses(scoreInfo.color, 'text')}`}>
                        %{cocuk.overallScore}
                  </span>
                </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getColorClasses(scoreInfo.color, 'bg')}`}
                        style={{ width: `${cocuk.overallScore}%` }}
                      />
                    </div>
                </div>

                  {/* Mini İstatistikler */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sınav</span>
                      </div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {cocuk.istatistikler.sinavOrtalamasi !== null ? `%${cocuk.istatistikler.sinavOrtalamasi}` : '-'}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ödev</span>
                      </div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {cocuk.istatistikler.odevTeslimOrani !== null ? `%${cocuk.istatistikler.odevTeslimOrani}` : '-'}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Katılım</span>
                      </div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {cocuk.istatistikler.katilimOrani !== null ? `%${cocuk.istatistikler.katilimOrani}` : '-'}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Devamsızlık</span>
                      </div>
                      <p className={`text-sm font-semibold ${cocuk.istatistikler.devamsizlikSayisi > 5 ? 'text-red-500' : cocuk.istatistikler.devamsizlikSayisi > 2 ? 'text-amber-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                    {cocuk.istatistikler.devamsizlikSayisi} gün
                      </p>
                </div>
              </div>
            </div>
              );
            })}
          </div>
        </div>

        {/* Metrik Seçimi ve Karşılaştırma */}
        {data.length > 1 && (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6 mb-6`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Detaylı Karşılaştırma
            </h2>

            {/* Metrik Seçici */}
            <div className="flex flex-wrap gap-2 mb-6">
              {METRICS.map(metric => {
                const isSelected = selectedMetric === metric.key;
                return (
                  <button
                    key={metric.key}
                    onClick={() => setSelectedMetric(metric.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : isDark 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <metric.icon className="w-4 h-4" />
                    {metric.label}
                  </button>
                );
              })}
            </div>

            {/* Metrik Açıklaması */}
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedMetricConfig.description}
            </p>

            {/* Karşılaştırma Barları */}
            <div className="space-y-4">
              {rankedChildren
                .sort((a, b) => {
                  const aVal = a.istatistikler[selectedMetric];
                  const bVal = b.istatistikler[selectedMetric];
                  if (aVal === null) return 1;
                  if (bVal === null) return -1;
                  if (selectedMetricConfig.reverseComparison) return (aVal as number) - (bVal as number);
                  return (bVal as number) - (aVal as number);
                })
                .map((cocuk, index) => {
                  const value = cocuk.istatistikler[selectedMetric];
                  const scoreInfo = getScoreInfo(value, selectedMetricConfig.reverseComparison);
                  const bestId = getBestChild(selectedMetricConfig);
                  const isBest = cocuk.id === bestId;
                  
                  // Devamsızlık için bar genişliği hesaplama
                  let barWidth = 0;
                  if (value !== null) {
                    if (selectedMetricConfig.reverseComparison) {
                      barWidth = Math.max(0, 100 - ((value as number) * 10));
                    } else {
                      barWidth = value as number;
                    }
                  }

                  return (
                    <div key={cocuk.id} className="flex items-center gap-4">
                      <div className="w-28 flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white
                          ${index === 0 ? 'bg-indigo-500' : isDark ? 'bg-gray-600' : 'bg-gray-400'}`}
                        >
                          {cocuk.ad[0]}{cocuk.soyad[0]}
                        </div>
                        <span className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {cocuk.ad}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className={`h-10 rounded-xl overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div 
                            className={`h-full rounded-xl transition-all duration-700 flex items-center justify-end pr-3 ${getColorClasses(scoreInfo.color, 'bg')}`}
                            style={{ width: `${Math.max(barWidth, 5)}%` }}
                          >
                            {barWidth >= 15 && (
                              <span className="text-sm font-semibold text-white">
                                {value !== null ? `${value}${selectedMetricConfig.suffix}` : '-'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-24 flex items-center justify-end gap-2">
                        {barWidth < 15 && (
                          <span className={`text-sm font-semibold ${getColorClasses(scoreInfo.color, 'text')}`}>
                            {value !== null ? `${value}${selectedMetricConfig.suffix}` : '-'}
                          </span>
                        )}
                        {isBest && (
                          <div className={`p-1 rounded-lg ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                            <Trophy className="w-4 h-4 text-amber-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Detaylı Tablo */}
        {data.length > 1 && (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border overflow-hidden`}>
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Target className="w-5 h-5 text-indigo-500" />
                Tüm Metrikler
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                    <th className={`text-left py-4 px-5 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Metrik
                    </th>
                    {rankedChildren.map(cocuk => (
                      <th key={cocuk.id} className={`text-center py-4 px-5 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-indigo-500 to-indigo-600`}>
                            {cocuk.ad[0]}{cocuk.soyad[0]}
                          </div>
                          <span>{cocuk.ad}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((metric, idx) => {
                    const bestId = getBestChild(metric);
                    
                    return (
                      <tr 
                        key={metric.key} 
                        className={`${isDark ? 'border-gray-700' : 'border-gray-100'} border-b last:border-b-0 ${isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'} transition-colors`}
                      >
                        <td className={`py-4 px-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <metric.icon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                            </div>
                            <div>
                              <p className="font-medium">{metric.label}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{metric.description}</p>
                      </div>
                        </div>
                      </td>
                        {rankedChildren.map(cocuk => {
                          const value = cocuk.istatistikler[metric.key];
                          const scoreInfo = getScoreInfo(value, metric.reverseComparison);
                          const isBest = cocuk.id === bestId;
                          
                          return (
                            <td key={cocuk.id} className="text-center py-4 px-5">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-lg font-bold ${getColorClasses(scoreInfo.color, 'text')}`}>
                                  {value !== null ? `${value}${metric.suffix}` : '-'}
                        </span>
                                <div className="flex items-center gap-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    isDark 
                                      ? `bg-${scoreInfo.color}-500/20 text-${scoreInfo.color}-400`
                                      : `bg-${scoreInfo.color}-100 text-${scoreInfo.color}-700`
                                  }`}>
                                    {scoreInfo.label}
                        </span>
                                  {isBest && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      </div>
                    </td>
                          );
                        })}
                  </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tek Çocuk için Detaylı Görünüm */}
        {data.length === 1 && (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-6`}>
            <h2 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Target className="w-5 h-5 text-indigo-500" />
              Performans Detayları
            </h2>

            <div className="space-y-4">
              {METRICS.map(metric => {
                const value = data[0].istatistikler[metric.key];
                const scoreInfo = getScoreInfo(value, metric.reverseComparison);
                
                let barWidth = 0;
                if (value !== null) {
                  if (metric.reverseComparison) {
                    barWidth = Math.max(0, 100 - ((value as number) * 10));
                  } else {
                    barWidth = value as number;
                  }
                }

                return (
                  <div key={metric.key} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                          <metric.icon className={`w-5 h-5 ${getColorClasses(scoreInfo.color, 'text')}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{metric.label}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{metric.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getColorClasses(scoreInfo.color, 'text')}`}>
                          {value !== null ? `${value}${metric.suffix}` : '-'}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isDark 
                            ? 'bg-gray-600 text-gray-300'
                            : 'bg-white text-gray-600'
                        }`}>
                          {scoreInfo.label}
                        </span>
                      </div>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${getColorClasses(scoreInfo.color, 'bg')}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function VeliKarsilastir() {
  return (
    <RoleGuard allowedRoles={['veli']}>
      <VeliKarsilastirContent />
    </RoleGuard>
  );
}
