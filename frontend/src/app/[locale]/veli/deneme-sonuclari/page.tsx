'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaChartLine, FaTrophy, FaMedal, FaArrowUp, FaArrowDown,
  FaUser, FaCalendarAlt, FaBook, FaGraduationCap,
  FaChartBar, FaInfoCircle, FaChevronDown, FaChevronUp,
  FaExclamationTriangle, FaCheckCircle, FaArrowLeft
} from 'react-icons/fa';
import { RoleGuard } from '@/components/RoleGuard';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface Cocuk {
  id: string;
  ad: string;
  soyad: string;
  ogrenciNo: string;
  sinif?: { ad: string };
}

interface BransSonuc {
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
}

interface DenemeSonucu {
  id: string;
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
  toplamNet: number;
  genelSiralama?: number;
  sinifSirasi?: number;
  kursSirasi?: number;
  branslar: Record<string, BransSonuc>;
  sinav: {
    id: string;
    ad: string;
    tur: 'TYT' | 'AYT' | 'LGS';
    kurum: string | null;
    tarih: string;
    branslar: Record<string, number>;
  };
}

interface Istatistik {
  genelIstatistik: {
    toplamDeneme: number;
    ortalamaNet: number;
    enYuksekNet: number;
    enDusukNet: number;
  };
  trend: Array<{
    tarih: string;
    sinavAd: string;
    net: number;
    siralama?: number;
  }>;
  bransOrtalamalar: Record<string, { ortalama: number }>;
}

const SINAV_TUR_RENKLERI: Record<string, string> = {
  TYT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  AYT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  LGS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const BRANS_ISIMLERI: Record<string, string> = {
  TYT_TURKCE: 'Türkçe',
  TYT_MATEMATIK: 'Matematik',
  TYT_SOSYAL: 'Sosyal',
  TYT_FEN: 'Fen',
  AYT_MATEMATIK: 'Matematik',
  AYT_FIZIK: 'Fizik',
  AYT_KIMYA: 'Kimya',
  AYT_BIYOLOJI: 'Biyoloji',
  AYT_EDEBIYAT: 'Edebiyat',
  AYT_TARIH1: 'Tarih-1',
  AYT_COGRAFYA1: 'Coğrafya-1',
  AYT_TARIH2: 'Tarih-2',
  AYT_COGRAFYA2: 'Coğrafya-2',
  AYT_FELSEFE: 'Felsefe',
  AYT_DIN: 'Din',
  LGS_TURKCE: 'Türkçe',
  LGS_MATEMATIK: 'Matematik',
  LGS_FEN: 'Fen',
  LGS_SOSYAL: 'Sosyal',
  LGS_DIN: 'Din',
  LGS_INGILIZCE: 'İngilizce',
};

export default function VeliDenemeSonuclariPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { speak, stop, ttsEnabled } = useAccessibility();
  const isDark = resolvedTheme === 'dark';
  
  // TTS yardımcı fonksiyonu
  const ttsHandlers = useCallback((text: string) => ({
    onMouseEnter: () => ttsEnabled && speak(text),
    onMouseLeave: () => stop(),
    onFocus: () => ttsEnabled && speak(text),
    onBlur: () => stop(),
    tabIndex: 0,
    'aria-label': text,
  }), [ttsEnabled, speak, stop]);
  
  const [cocuklar, setCocuklar] = useState<Cocuk[]>([]);
  const [selectedCocuk, setSelectedCocuk] = useState<string>('');
  const [sonuclar, setSonuclar] = useState<DenemeSonucu[]>([]);
  const [istatistikler, setIstatistikler] = useState<Istatistik | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTur, setSelectedTur] = useState<string>('');
  const [expandedSonuc, setExpandedSonuc] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Çocukları getir (dashboard endpoint'inden)
  const fetchCocuklar = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/veli/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data.cocuklar && data.data.cocuklar.length > 0) {
        setCocuklar(data.data.cocuklar);
        setSelectedCocuk(data.data.cocuklar[0].id);
      }
    } catch (err) {
      console.error('Çocuklar yüklenemedi', err);
    }
  }, [API_URL]);

  // Sonuçları getir
  const fetchSonuclar = useCallback(async () => {
    if (!selectedCocuk) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedTur) params.append('tur', selectedTur);

      const response = await fetch(`${API_URL}/deneme/ogrenci/${selectedCocuk}/sonuclari?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSonuclar(data.data);
      }
    } catch (err) {
      console.error('Sonuçlar yüklenemedi', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, selectedCocuk, selectedTur]);

  // İstatistikleri getir
  const fetchIstatistikler = useCallback(async () => {
    if (!selectedCocuk) return;
    
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedTur) params.append('tur', selectedTur);

      const response = await fetch(`${API_URL}/deneme/ogrenci/${selectedCocuk}/istatistikleri?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setIstatistikler(data.data);
      }
    } catch (err) {
      console.error('İstatistikler yüklenemedi', err);
    }
  }, [API_URL, selectedCocuk, selectedTur]);

  useEffect(() => {
    fetchCocuklar();
  }, [fetchCocuklar]);

  useEffect(() => {
    if (selectedCocuk) {
      fetchSonuclar();
      fetchIstatistikler();
    }
  }, [selectedCocuk, selectedTur, fetchSonuclar, fetchIstatistikler]);

  // Son 2 sınavı karşılaştır
  const sonIkiSinav = useMemo(() => {
    if (sonuclar.length < 2) return null;
    const sorted = [...sonuclar].sort((a, b) => 
      new Date(b.sinav.tarih).getTime() - new Date(a.sinav.tarih).getTime()
    );
    return {
      son: sorted[0],
      onceki: sorted[1],
      fark: sorted[0].toplamNet - sorted[1].toplamNet
    };
  }, [sonuclar]);

  // Zayıf branşları bul
  const zayifBranslar = useMemo(() => {
    if (!istatistikler) return [];
    
    const branslar = Object.entries(istatistikler.bransOrtalamalar)
      .map(([brans, data]) => ({ brans, ortalama: data.ortalama }))
      .sort((a, b) => a.ortalama - b.ortalama)
      .slice(0, 3);
    
    return branslar;
  }, [istatistikler]);

  const getNetColor = (net: number, maxNet: number) => {
    const oran = net / maxNet;
    if (oran >= 0.7) return 'text-green-600 dark:text-green-400';
    if (oran >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const selectedCocukData = cocuklar.find(c => c.id === selectedCocuk);

  if (cocuklar.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center max-w-md">
          <FaUser className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Kayıtlı öğrenci bulunamadı
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Sisteme kayıtlı bir öğrenciniz bulunmamaktadır
          </p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['veli']}>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/veli')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-4 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Veli Paneline Dön</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <FaGraduationCap className="text-blue-600" />
            Deneme Sonuçları
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Çocuğunuzun deneme sınavı sonuçlarını takip edin
          </p>
        </div>

        {/* Çocuk Seçimi */}
        {cocuklar.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Öğrenci Seçiniz
            </label>
            <div className="flex flex-wrap gap-2">
              {cocuklar.map(cocuk => (
                <button
                  key={cocuk.id}
                  onClick={() => setSelectedCocuk(cocuk.id)}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    selectedCocuk === cocuk.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <FaUser className="inline mr-2" />
                  {cocuk.ad} {cocuk.soyad}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Seçili öğrenci bilgisi */}
        {selectedCocukData && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-5 mb-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <FaUser className="text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {selectedCocukData.ad} {selectedCocukData.soyad}
                </h2>
                <p className="text-blue-100">
                  {selectedCocukData.sinif?.ad || 'Sınıf bilgisi yok'} • No: {selectedCocukData.ogrenciNo}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Özet Kartları */}
            {istatistikler && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <FaBook className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Toplam Deneme</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {istatistikler.genelIstatistik.toplamDeneme}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <FaChartLine className="text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Ortalama Net</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {istatistikler.genelIstatistik.ortalamaNet.toFixed(2)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                      <FaTrophy className="text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">En Yüksek</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {istatistikler.genelIstatistik.enYuksekNet.toFixed(2)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      {sonIkiSinav && sonIkiSinav.fark >= 0 ? (
                        <FaArrowUp className="text-green-600 dark:text-green-400" />
                      ) : (
                        <FaArrowDown className="text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Son Değişim</span>
                  </div>
                  <p className={`text-2xl font-bold ${sonIkiSinav && sonIkiSinav.fark >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {sonIkiSinav ? `${sonIkiSinav.fark >= 0 ? '+' : ''}${sonIkiSinav.fark.toFixed(2)}` : '-'}
                  </p>
                </div>
              </div>
            )}

            {/* Dikkat Edilmesi Gereken Branşlar */}
            {zayifBranslar.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
                <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
                  <FaExclamationTriangle />
                  Geliştirilmesi Gereken Alanlar
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  Aşağıdaki branşlarda çocuğunuzun ortalaması nispeten düşük. Bu alanlara ekstra çalışma önerilir:
                </p>
                <div className="flex flex-wrap gap-2">
                  {zayifBranslar.map(({ brans, ortalama }) => (
                    <span
                      key={brans}
                      className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-full text-sm font-medium"
                    >
                      {BRANS_ISIMLERI[brans] || brans}: {ortalama.toFixed(2)} net
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Filtre */}
            <div className="flex gap-4 mb-6">
              <select
                value={selectedTur}
                onChange={(e) => setSelectedTur(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Türler</option>
                <option value="TYT">TYT</option>
                <option value="AYT">AYT</option>
                <option value="LGS">LGS</option>
              </select>
            </div>

            {/* Sonuçlar Listesi */}
            {sonuclar.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
                <FaBook className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Henüz deneme sonucu yok
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Deneme sınavlarına katıldığında sonuçlar burada görüntülenecek
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sonuclar.map(sonuc => (
                  <div
                    key={sonuc.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                  >
                    {/* Ana satır */}
                    <div
                      className="p-4 md:p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={() => setExpandedSonuc(expandedSonuc === sonuc.id ? null : sonuc.id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${SINAV_TUR_RENKLERI[sonuc.sinav.tur]}`}>
                              {sonuc.sinav.tur}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              {new Date(sonuc.sinav.tarih).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">
                              {sonuc.sinav.ad}
                            </h3>
                            {sonuc.sinav.kurum && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {sonuc.sinav.kurum}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Sıralama */}
                          {sonuc.sinifSirasi && (
                            <div className="text-center">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Sınıf Sırası</p>
                              <p className="text-lg font-bold text-gray-800 dark:text-white flex items-center justify-center gap-1">
                                {sonuc.sinifSirasi <= 3 && <FaMedal className={sonuc.sinifSirasi === 1 ? 'text-yellow-500' : sonuc.sinifSirasi === 2 ? 'text-gray-400' : 'text-amber-600'} />}
                                {sonuc.sinifSirasi}
                              </p>
                            </div>
                          )}

                          {/* Doğru/Yanlış/Boş */}
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {sonuc.toplamDogru}D
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              {sonuc.toplamYanlis}Y
                            </span>
                            <span className="text-gray-500 font-medium">
                              {sonuc.toplamBos}B
                            </span>
                          </div>

                          {/* Toplam Net */}
                          <div className="text-center min-w-[80px]">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Toplam Net</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {sonuc.toplamNet.toFixed(2)}
                            </p>
                          </div>

                          {/* Expand butonu */}
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            {expandedSonuc === sonuc.id ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Detay (expanded) */}
                    {expandedSonuc === sonuc.id && (
                      <div className="border-t border-gray-100 dark:border-gray-700 p-4 md:p-5 bg-gray-50 dark:bg-gray-700/30">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
                          Branş Detayları
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {Object.entries(sonuc.branslar).map(([key, data]) => {
                            const maxNet = sonuc.sinav.branslar[key] || 40;
                            const performans = data.net / maxNet;
                            return (
                              <div
                                key={key}
                                className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-600"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {BRANS_ISIMLERI[key] || key}
                                  </p>
                                  {performans >= 0.7 && <FaCheckCircle className="text-green-500" />}
                                  {performans < 0.4 && <FaExclamationTriangle className="text-amber-500" />}
                                </div>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-xs space-x-2">
                                    <span className="text-green-600">{data.dogru}D</span>
                                    <span className="text-red-600">{data.yanlis}Y</span>
                                    <span className="text-gray-500">{data.bos}B</span>
                                  </div>
                                </div>
                                <p className={`text-lg font-bold ${getNetColor(data.net, maxNet)}`}>
                                  {data.net.toFixed(2)} net
                                </p>
                                {/* Progress bar */}
                                <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      performans >= 0.7 ? 'bg-green-500' :
                                      performans >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(100, performans * 100)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Trend Bilgisi */}
            {istatistikler && istatistikler.trend.length >= 2 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 mt-6">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <FaChartLine className="text-blue-600" />
                  Gelişim Trendi
                </h3>
                <div className="space-y-3">
                  {istatistikler.trend.slice(-5).map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {item.sinavAd}
                          </span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {item.net.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, (item.net / (istatistikler.genelIstatistik.enYuksekNet || 100)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </RoleGuard>
  );
}

