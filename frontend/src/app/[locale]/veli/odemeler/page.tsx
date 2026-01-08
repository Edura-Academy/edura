'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, CreditCard, Wallet, Clock, CheckCircle, 
  AlertCircle, Calendar, ChevronDown, ChevronUp, 
  Lock, XCircle, Loader2, Users, TrendingUp, 
  Receipt, History, PieChart, CalendarDays, 
  BadgePercent, FileText, Download, Filter,
  ChevronRight, Banknote, CircleDollarSign, Shield
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { RoleGuard } from '@/components/RoleGuard';

interface Odeme {
  id: string;
  tip: string;
  tutar: number;
  durum: string;
  taksitNo: number | null;
  vadeTarihi: string;
  odemeTarihi: string | null;
  odemeYontemi: string | null;
  ogrenci?: {
    id: string;
    ad: string;
    soyad: string;
  };
  odemePlani?: {
    donemAd: string;
  };
}

interface OdemePlani {
  id: string;
  donemAd: string;
  toplamTutar: number;
  taksitSayisi: number;
  taksitTutari: number;
  indirimOrani: number | null;
  indirimTutari: number | null;
  odemeler: Odeme[];
}

interface CocukOdeme {
  cocuk: {
    id: string;
    ad: string;
    soyad: string;
    sinif?: { ad: string };
  };
  planlar: OdemePlani[];
  ozet: {
    toplamBorc: number;
    odenenTutar: number;
    bekleyenTutar: number;
    gecikmisTutar: number;
    siradakiOdeme: Odeme | null;
  };
}

interface CardInfo {
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
}

type TabType = 'ozet' | 'planlar' | 'gecmis';

export default function VeliOdemeler() {
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
  
  const [cocuklar, setCocuklar] = useState<CocukOdeme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCocuk, setSelectedCocuk] = useState<string | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('ozet');
  
  // Ödeme modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOdeme, setSelectedOdeme] = useState<{ odeme: Odeme; cocukId: string } | null>(null);
  const [cardInfo, setCardInfo] = useState<CardInfo>({
    cardHolderName: '',
    cardNumber: '',
    expireMonth: '',
    expireYear: '',
    cvc: ''
  });
  const [use3ds, setUse3ds] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchCocuklarOdeme();
  }, []);

  const fetchCocuklarOdeme = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Dashboard'dan çocukları al
      const dashResponse = await fetch(`${API_URL}/veli/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (dashResponse.ok) {
        const dashResult = await dashResponse.json();
        const cocukListesi = dashResult.data.cocuklar || [];
        
        // Her çocuğun ödemelerini al
        const cocuklarWithOdeme = await Promise.all(
          cocukListesi.map(async (cocuk: any) => {
            try {
              const odemeResponse = await fetch(
                `${API_URL}/odeme/durum/${cocuk.id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
              );
              
              if (odemeResponse.ok) {
                const odemeResult = await odemeResponse.json();
                return {
                  cocuk: {
                    id: cocuk.id,
                    ad: cocuk.ad,
                    soyad: cocuk.soyad,
                    sinif: cocuk.sinif
                  },
                  planlar: odemeResult.data?.planlar || [],
                  ozet: odemeResult.data?.ozet || { toplamBorc: 0, odenenTutar: 0, bekleyenTutar: 0, gecikmisTutar: 0, siradakiOdeme: null }
                };
              }
            } catch (e) {
              console.error(`${cocuk.ad} ödemeleri yüklenemedi`, e);
            }
            return {
              cocuk: {
                id: cocuk.id,
                ad: cocuk.ad,
                soyad: cocuk.soyad,
                sinif: cocuk.sinif
              },
              planlar: [],
              ozet: { toplamBorc: 0, odenenTutar: 0, bekleyenTutar: 0, gecikmisTutar: 0, siradakiOdeme: null }
            };
          })
        );
        
        setCocuklar(cocuklarWithOdeme);
        if (cocuklarWithOdeme.length > 0) {
          setSelectedCocuk(cocuklarWithOdeme[0].cocuk.id);
        }
      }
    } catch (error) {
      console.error('Ödemeler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getDurumConfig = (durum: string) => {
    const configs: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
      ODENDI: { 
        label: 'Ödendi', 
        icon: CheckCircle, 
        color: 'text-emerald-500', 
        bg: 'bg-emerald-500/10', 
        border: 'border-emerald-500/20' 
      },
      BEKLEMEDE: { 
        label: 'Bekliyor', 
        icon: Clock, 
        color: 'text-amber-500', 
        bg: 'bg-amber-500/10', 
        border: 'border-amber-500/20' 
      },
      GECIKTI: { 
        label: 'Gecikmiş', 
        icon: AlertCircle, 
        color: 'text-red-500', 
        bg: 'bg-red-500/10', 
        border: 'border-red-500/20' 
      },
      IADE: { 
        label: 'İade', 
        icon: XCircle, 
        color: 'text-blue-500', 
        bg: 'bg-blue-500/10', 
        border: 'border-blue-500/20' 
      }
    };
    return configs[durum] || configs.BEKLEMEDE;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const handlePayment = async () => {
    if (!selectedOdeme) return;
    
    setProcessing(true);
    setPaymentError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/odeme/kart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          odemeId: selectedOdeme.odeme.id,
          cardInfo: {
            ...cardInfo,
            cardNumber: cardInfo.cardNumber.replace(/\s/g, '')
          },
          use3ds
        })
      });

      const result = await response.json();

      if (result.success) {
        if (result.use3ds && result.threeDSHtml) {
          const newWindow = window.open('', '_self');
          if (newWindow) {
            newWindow.document.write(result.threeDSHtml);
          }
        } else {
          setShowPaymentModal(false);
          fetchCocuklarOdeme();
          alert('Ödeme başarıyla tamamlandı!');
        }
      } else {
        setPaymentError(result.message || 'Ödeme işlemi başarısız oldu');
      }
    } catch (error) {
      console.error('Ödeme hatası:', error);
      setPaymentError('Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
    } finally {
      setProcessing(false);
    }
  };

  const openPaymentModal = (odeme: Odeme, cocukId: string) => {
    setSelectedOdeme({ odeme, cocukId });
    setShowPaymentModal(true);
    setPaymentError('');
    setCardInfo({
      cardHolderName: '',
      cardNumber: '',
      expireMonth: '',
      expireYear: '',
      cvc: ''
    });
  };

  const selectedCocukData = cocuklar.find(c => c.cocuk.id === selectedCocuk);
  
  // Toplam özet
  const toplamOzet = useMemo(() => cocuklar.reduce((acc, c) => ({
    toplamBorc: acc.toplamBorc + c.ozet.toplamBorc,
    odenenTutar: acc.odenenTutar + c.ozet.odenenTutar,
    bekleyenTutar: acc.bekleyenTutar + c.ozet.bekleyenTutar,
    gecikmisTutar: acc.gecikmisTutar + c.ozet.gecikmisTutar
  }), { toplamBorc: 0, odenenTutar: 0, bekleyenTutar: 0, gecikmisTutar: 0 }), [cocuklar]);

  // Ödeme geçmişi
  const odemeGecmisi = useMemo(() => {
    if (!selectedCocukData) return [];
    return selectedCocukData.planlar
      .flatMap(p => p.odemeler.filter(o => o.durum === 'ODENDI'))
      .sort((a, b) => new Date(b.odemeTarihi || b.vadeTarihi).getTime() - new Date(a.odemeTarihi || a.vadeTarihi).getTime());
  }, [selectedCocukData]);

  // Ödeme ilerleme yüzdesi
  const odemeIlerleme = useMemo(() => {
    if (!selectedCocukData || selectedCocukData.ozet.toplamBorc === 0) return 0;
    return Math.round((selectedCocukData.ozet.odenenTutar / selectedCocukData.ozet.toplamBorc) * 100);
  }, [selectedCocukData]);

  // Yaklaşan ödemeler (30 gün içinde)
  const yaklasanOdemeler = useMemo(() => {
    if (!selectedCocukData) return [];
    const otuzGunSonra = new Date();
    otuzGunSonra.setDate(otuzGunSonra.getDate() + 30);
    
    return selectedCocukData.planlar
      .flatMap(p => p.odemeler.filter(o => 
        (o.durum === 'BEKLEMEDE' || o.durum === 'GECIKTI') && 
        new Date(o.vadeTarihi) <= otuzGunSonra
      ))
      .sort((a, b) => new Date(a.vadeTarihi).getTime() - new Date(b.vadeTarihi).getTime());
  }, [selectedCocukData]);

  if (loading) {
    return (
      <RoleGuard allowedRoles={['veli']}>
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ödemeler yükleniyor...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['veli']}>
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50'}`}>
        {/* Header */}
        <header className={`${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border-b sticky top-0 z-40`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    Ödemeler
                  </h1>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Ödeme planları ve işlemleri
                  </p>
                </div>
              </div>

              {/* Güvenli ödeme rozeti */}
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">SSL Güvenli</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Çocuk Seçici - Her zaman göster */}
          {cocuklar.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Öğrenci Seçin
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {cocuklar.map((c) => {
                  const hasOverdue = c.ozet.gecikmisTutar > 0;
                  const isSelected = selectedCocuk === c.cocuk.id;
                  
                  return (
                    <button
                      key={c.cocuk.id}
                      onClick={() => setSelectedCocuk(c.cocuk.id)}
                      className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? isDark 
                            ? 'bg-indigo-500/20 border-indigo-500 text-white'
                            : 'bg-indigo-50 border-indigo-500 text-indigo-900'
                          : isDark 
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                        isSelected 
                          ? 'bg-indigo-500 text-white' 
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {c.cocuk.ad[0]}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{c.cocuk.ad} {c.cocuk.soyad}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {c.cocuk.sinif?.ad || 'Sınıf bilgisi yok'}
                        </p>
                      </div>
                      {hasOverdue && (
                        <div className="ml-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedCocukData && (
            <>
              {/* Özet Kartları Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Toplam Borç */}
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-5 shadow-sm`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                      <Wallet className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    </div>
                    <TrendingUp className={`w-4 h-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                  <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Toplam Borç</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(selectedCocukData.ozet.toplamBorc)}
                  </p>
                </div>

                {/* Ödenen */}
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-5 shadow-sm`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                      <CheckCircle className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                      %{odemeIlerleme}
                    </span>
                  </div>
                  <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ödenen</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {formatCurrency(selectedCocukData.ozet.odenenTutar)}
                  </p>
                </div>

                {/* Bekleyen */}
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-5 shadow-sm`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                      <Clock className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    </div>
                    {yaklasanOdemeler.length > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                        {yaklasanOdemeler.length} taksit
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Bekleyen</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {formatCurrency(selectedCocukData.ozet.bekleyenTutar)}
                  </p>
                </div>

                {/* Gecikmiş */}
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-5 shadow-sm ${selectedCocukData.ozet.gecikmisTutar > 0 ? 'ring-2 ring-red-500/50' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                      <AlertCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    </div>
                    {selectedCocukData.ozet.gecikmisTutar > 0 && (
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gecikmiş</p>
                  <p className="text-2xl font-bold text-red-500">
                    {formatCurrency(selectedCocukData.ozet.gecikmisTutar)}
                  </p>
                </div>
              </div>

              {/* Ödeme İlerleme Çubuğu */}
              <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-5 mb-6 shadow-sm`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Ödeme İlerlemesi
                  </span>
                  <span className={`text-sm font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    %{odemeIlerleme}
                  </span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${odemeIlerleme}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatCurrency(selectedCocukData.ozet.odenenTutar)} ödendi
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatCurrency(selectedCocukData.ozet.bekleyenTutar + selectedCocukData.ozet.gecikmisTutar)} kaldı
                  </span>
                </div>
              </div>

              {/* Sıradaki Ödeme - Öne Çıkan */}
              {selectedCocukData.ozet.siradakiOdeme && (
                <div className={`relative overflow-hidden rounded-2xl mb-6 ${
                  selectedCocukData.ozet.siradakiOdeme.durum === 'GECIKTI'
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                }`}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarDays className="w-5 h-5 text-white/80" />
                          <span className="text-white/80 text-sm font-medium">
                            {selectedCocukData.ozet.siradakiOdeme.durum === 'GECIKTI' ? 'Gecikmiş Ödeme' : 'Sıradaki Ödeme'}
                          </span>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">
                          {formatCurrency(selectedCocukData.ozet.siradakiOdeme.tutar)}
                        </p>
                        <p className="text-white/70 text-sm">
                          {selectedCocukData.ozet.siradakiOdeme.taksitNo}. Taksit • Son Tarih: {formatDate(selectedCocukData.ozet.siradakiOdeme.vadeTarihi)}
                        </p>
                      </div>
                      <button
                        onClick={() => openPaymentModal(selectedCocukData.ozet.siradakiOdeme!, selectedCocukData.cocuk.id)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-lg"
                      >
                        <CreditCard className="w-5 h-5" />
                        Hemen Öde
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Navigasyonu */}
              <div className={`flex gap-1 p-1 rounded-xl mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                {[
                  { id: 'ozet', label: 'Yaklaşan', icon: Calendar },
                  { id: 'planlar', label: 'Ödeme Planları', icon: FileText },
                  { id: 'gecmis', label: 'Geçmiş', icon: History },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? isDark 
                          ? 'bg-gray-700 text-white shadow-sm'
                          : 'bg-white text-gray-900 shadow-sm'
                        : isDark
                          ? 'text-gray-400 hover:text-gray-300'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab İçerikleri */}
              {activeTab === 'ozet' && (
                <div className="space-y-3">
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Yaklaşan Ödemeler
                  </h3>
                  {yaklasanOdemeler.length > 0 ? (
                    yaklasanOdemeler.map((odeme, index) => {
                      const config = getDurumConfig(odeme.durum);
                      const gunKaldi = Math.ceil((new Date(odeme.vadeTarihi).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div 
                          key={odeme.id}
                          className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center`}>
                                <config.icon className={`w-5 h-5 ${config.color}`} />
                              </div>
                              <div>
                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {odeme.taksitNo}. Taksit
                                </p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {formatDate(odeme.vadeTarihi)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {formatCurrency(odeme.tutar)}
                                </p>
                                <p className={`text-xs ${gunKaldi < 0 ? 'text-red-500' : gunKaldi <= 7 ? 'text-amber-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {gunKaldi < 0 ? `${Math.abs(gunKaldi)} gün gecikti` : gunKaldi === 0 ? 'Bugün' : `${gunKaldi} gün kaldı`}
                                </p>
                              </div>
                              <button
                                onClick={() => openPaymentModal(odeme, selectedCocukData.cocuk.id)}
                                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                                  odeme.durum === 'GECIKTI'
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                                }`}
                              >
                                Öde
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-12 text-center`}>
                      <CheckCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                      <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Yaklaşan ödemeniz bulunmuyor
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Tüm ödemeler güncel
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'planlar' && (
                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Ödeme Planları
                  </h3>
                  {selectedCocukData.planlar.length > 0 ? (
                    selectedCocukData.planlar.map((plan) => {
                      const odendiSayisi = plan.odemeler.filter(o => o.durum === 'ODENDI').length;
                      const planIlerleme = Math.round((odendiSayisi / plan.odemeler.length) * 100);
                      
                      return (
                        <div 
                          key={plan.id}
                          className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border overflow-hidden shadow-sm`}
                        >
                          <button
                            onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                            className={`w-full flex items-center justify-between p-5 ${isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'} transition-colors`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'} flex items-center justify-center`}>
                                <Receipt className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                              </div>
                              <div className="text-left">
                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {plan.donemAd}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {plan.taksitSayisi} taksit
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
                                    %{planIlerleme} tamamlandı
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {formatCurrency(plan.toplamTutar - (plan.indirimTutari || 0))}
                                </p>
                                {plan.indirimTutari && plan.indirimTutari > 0 && (
                                  <p className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                    {formatCurrency(plan.indirimTutari)} indirim
                                  </p>
                                )}
                              </div>
                              <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'} transition-transform ${expandedPlan === plan.id ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {expandedPlan === plan.id && (
                            <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                              {/* Plan ilerleme çubuğu */}
                              <div className="px-5 py-3">
                                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all"
                                    style={{ width: `${planIlerleme}%` }}
                                  />
                                </div>
                              </div>

                              {/* Taksit listesi */}
                              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {plan.odemeler.map((odeme) => {
                                  const config = getDurumConfig(odeme.durum);
                                  const canPay = odeme.durum === 'BEKLEMEDE' || odeme.durum === 'GECIKTI';
                                  
                                  return (
                                    <div 
                                      key={odeme.id}
                                      className={`flex items-center justify-between px-5 py-4 ${isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'} transition-colors`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${config.bg} ${config.border} border flex items-center justify-center`}>
                                          <config.icon className={`w-4 h-4 ${config.color}`} />
                                        </div>
                                        <div>
                                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {odeme.taksitNo}. Taksit
                                          </p>
                                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {formatDate(odeme.vadeTarihi)}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="text-right">
                                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {formatCurrency(odeme.tutar)}
                                          </p>
                                          <span className={`text-xs ${config.color}`}>{config.label}</span>
                                        </div>
                                        {canPay && (
                                          <button
                                            onClick={() => openPaymentModal(odeme, selectedCocukData.cocuk.id)}
                                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
                                          >
                                            Öde
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-12 text-center`}>
                      <FileText className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Ödeme planı bulunmuyor
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Henüz bir ödeme planı oluşturulmamış
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'gecmis' && (
                <div className="space-y-3">
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Ödeme Geçmişi
                  </h3>
                  {odemeGecmisi.length > 0 ? (
                    odemeGecmisi.map((odeme) => (
                      <div 
                        key={odeme.id}
                        className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-4 shadow-sm`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center`}>
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {odeme.taksitNo}. Taksit
                              </p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {odeme.odemeTarihi ? formatDate(odeme.odemeTarihi) : formatDate(odeme.vadeTarihi)}
                                {odeme.odemeYontemi && ` • ${odeme.odemeYontemi}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(odeme.tutar)}
                            </p>
                            <span className="text-xs text-emerald-500">Ödendi</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-12 text-center`}>
                      <History className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Ödeme geçmişi bulunmuyor
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Henüz bir ödeme yapılmamış
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Boş durum */}
          {cocuklar.length === 0 && !loading && (
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border p-12 text-center`}>
              <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Kayıtlı öğrenci bulunmuyor
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Ödeme bilgilerini görüntülemek için kayıtlı bir öğrenciniz olmalıdır
              </p>
            </div>
          )}
        </main>

        {/* Ödeme Modal */}
        {showPaymentModal && selectedOdeme && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl w-full max-w-md shadow-2xl overflow-hidden`}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Ödeme Yap</h2>
                      <p className="text-indigo-100 text-sm">{selectedOdeme.odeme.taksitNo}. Taksit</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPaymentModal(false)} 
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-white" />
                  </button>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-3xl font-bold text-white">{formatCurrency(selectedOdeme.odeme.tutar)}</p>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Kart Üzerindeki İsim
                  </label>
                  <input
                    type="text"
                    value={cardInfo.cardHolderName}
                    onChange={(e) => setCardInfo({...cardInfo, cardHolderName: e.target.value.toUpperCase()})}
                    placeholder="AD SOYAD"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                    } focus:outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Kart Numarası
                  </label>
                  <input
                    type="text"
                    value={cardInfo.cardNumber}
                    onChange={(e) => setCardInfo({...cardInfo, cardNumber: formatCardNumber(e.target.value)})}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                    } focus:outline-none font-mono tracking-wider`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Ay
                    </label>
                    <select
                      value={cardInfo.expireMonth}
                      onChange={(e) => setCardInfo({...cardInfo, expireMonth: e.target.value})}
                      className={`w-full px-3 py-3 rounded-xl border-2 transition-colors ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none`}
                    >
                      <option value="">AA</option>
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m.toString().padStart(2, '0')}>
                          {m.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Yıl
                    </label>
                    <select
                      value={cardInfo.expireYear}
                      onChange={(e) => setCardInfo({...cardInfo, expireYear: e.target.value})}
                      className={`w-full px-3 py-3 rounded-xl border-2 transition-colors ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none`}
                    >
                      <option value="">YY</option>
                      {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(y => (
                        <option key={y} value={y.toString()}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cardInfo.cvc}
                      onChange={(e) => setCardInfo({...cardInfo, cvc: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                      placeholder="***"
                      maxLength={4}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                      } focus:outline-none text-center font-mono tracking-wider`}
                    />
                  </div>
                </div>

                <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={use3ds}
                    onChange={(e) => setUse3ds(e.target.checked)}
                    className="w-5 h-5 text-indigo-500 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <Shield className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      3D Secure ile Güvenli Ödeme
                    </span>
                  </div>
                </label>

                {paymentError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-500">{paymentError}</p>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={processing || !cardInfo.cardHolderName || !cardInfo.cardNumber || !cardInfo.expireMonth || !cardInfo.expireYear || !cardInfo.cvc}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      {formatCurrency(selectedOdeme.odeme.tutar)} Öde
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <Shield className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    iyzico güvencesiyle 256-bit SSL şifreleme
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
