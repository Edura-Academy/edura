'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, CreditCard, Wallet, Clock, CheckCircle, 
  AlertCircle, Calendar, ChevronDown, ChevronUp, 
  Lock, XCircle, Loader2, Users
} from 'lucide-react';

interface Odeme {
  id: string;
  tip: string;
  tutar: number;
  durum: string;
  taksitNo: number | null;
  vadeTarihi: string;
  odemeTarihi: string | null;
  odemeYontemi: string | null;
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

export default function VeliOdemeler() {
  const router = useRouter();
  const [cocuklar, setCocuklar] = useState<CocukOdeme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCocuk, setSelectedCocuk] = useState<string | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  
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

  useEffect(() => {
    fetchCocuklarOdeme();
  }, []);

  const fetchCocuklarOdeme = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Önce dashboard'dan çocukları al
      const dashResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/veli/dashboard`, {
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
                `${process.env.NEXT_PUBLIC_API_URL}/api/odeme/durum/${cocuk.id}`,
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
                  planlar: odemeResult.data.planlar,
                  ozet: odemeResult.data.ozet
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
    return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDurumConfig = (durum: string) => {
    const configs: Record<string, { label: string; icon: any; color: string; bg: string }> = {
      ODENDI: { label: 'Ödendi', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
      BEKLEMEDE: { label: 'Bekliyor', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
      GECIKTI: { label: 'Gecikmiş', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
      IADE: { label: 'İade', icon: XCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' }
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/odeme/kart`, {
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
          alert('Ödeme başarılı!');
        }
      } else {
        setPaymentError(result.message || 'Ödeme başarısız');
      }
    } catch (error) {
      console.error('Ödeme hatası:', error);
      setPaymentError('Bağlantı hatası');
    } finally {
      setProcessing(false);
    }
  };

  const openPaymentModal = (odeme: Odeme, cocukId: string) => {
    setSelectedOdeme({ odeme, cocukId });
    setShowPaymentModal(true);
    setPaymentError('');
  };

  const selectedCocukData = cocuklar.find(c => c.cocuk.id === selectedCocuk);
  const toplamOzet = cocuklar.reduce((acc, c) => ({
    toplamBorc: acc.toplamBorc + c.ozet.toplamBorc,
    bekleyenTutar: acc.bekleyenTutar + c.ozet.bekleyenTutar,
    gecikmisTutar: acc.gecikmisTutar + c.ozet.gecikmisTutar
  }), { toplamBorc: 0, bekleyenTutar: 0, gecikmisTutar: 0 });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button 
              onClick={() => router.push('/veli')}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Ödemeler</h1>
              <p className="text-xs text-slate-400">Çocuklarınızın ödeme durumu</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Genel Özet */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-slate-400">Toplam Borç</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(toplamOzet.toplamBorc)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Bekleyen</p>
              <p className="text-2xl font-bold text-amber-400">{formatCurrency(toplamOzet.bekleyenTutar)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Gecikmiş</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(toplamOzet.gecikmisTutar)}</p>
            </div>
          </div>
        </div>

        {/* Çocuk Seçici */}
        {cocuklar.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {cocuklar.map((c) => (
              <button
                key={c.cocuk.id}
                onClick={() => setSelectedCocuk(c.cocuk.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  selectedCocuk === c.cocuk.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                  {c.cocuk.ad[0]}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{c.cocuk.ad}</p>
                  <p className="text-xs opacity-75">{c.cocuk.sinif?.ad}</p>
                </div>
                {c.ozet.gecikmisTutar > 0 && (
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Seçili Çocuğun Ödemeleri */}
        {selectedCocukData && (
          <>
            {/* Özet Kartları */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Borç</span>
                </div>
                <p className="text-lg font-bold text-white">{formatCurrency(selectedCocukData.ozet.toplamBorc)}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-400">Ödenen</span>
                </div>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(selectedCocukData.ozet.odenenTutar)}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400">Bekleyen</span>
                </div>
                <p className="text-lg font-bold text-amber-400">{formatCurrency(selectedCocukData.ozet.bekleyenTutar)}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-400">Gecikmiş</span>
                </div>
                <p className="text-lg font-bold text-red-400">{formatCurrency(selectedCocukData.ozet.gecikmisTutar)}</p>
              </div>
            </div>

            {/* Sıradaki Ödeme */}
            {selectedCocukData.ozet.siradakiOdeme && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300">Sıradaki Ödeme</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(selectedCocukData.ozet.siradakiOdeme.tutar)}</p>
                  <p className="text-xs text-slate-400">Son: {formatDate(selectedCocukData.ozet.siradakiOdeme.vadeTarihi)}</p>
                </div>
                <button
                  onClick={() => openPaymentModal(selectedCocukData.ozet.siradakiOdeme!, selectedCocukData.cocuk.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Öde
                </button>
              </div>
            )}

            {/* Ödeme Planları */}
            {selectedCocukData.planlar.length > 0 ? (
              <div className="space-y-4">
                {selectedCocukData.planlar.map((plan) => (
                  <div 
                    key={plan.id}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-purple-400" />
                        <div className="text-left">
                          <h3 className="text-white font-medium">{plan.donemAd}</h3>
                          <p className="text-xs text-slate-400">{plan.taksitSayisi} taksit</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">{formatCurrency(plan.toplamTutar - (plan.indirimTutari || 0))}</span>
                        {expandedPlan === plan.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {expandedPlan === plan.id && (
                      <div className="border-t border-slate-700/50">
                        {plan.odemeler.map((odeme) => {
                          const config = getDurumConfig(odeme.durum);
                          const canPay = odeme.durum === 'BEKLEMEDE' || odeme.durum === 'GECIKTI';
                          
                          return (
                            <div 
                              key={odeme.id}
                              className="flex items-center justify-between p-4 border-b border-slate-700/30 last:border-b-0"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center`}>
                                  <config.icon className={`w-4 h-4 ${config.color}`} />
                                </div>
                                <div>
                                  <p className="text-sm text-white">{odeme.taksitNo}. Taksit</p>
                                  <p className="text-xs text-slate-400">{formatDate(odeme.vadeTarihi)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-white font-medium">{formatCurrency(odeme.tutar)}</p>
                                  <span className={`text-xs ${config.color}`}>{config.label}</span>
                                </div>
                                {canPay && (
                                  <button
                                    onClick={() => openPaymentModal(odeme, selectedCocukData.cocuk.id)}
                                    className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg"
                                  >
                                    Öde
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
                <Wallet className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Ödeme planı bulunmuyor</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Ödeme Modal */}
      {showPaymentModal && selectedOdeme && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Ödeme Yap</h2>
                  <p className="text-sm text-slate-400">{formatCurrency(selectedOdeme.odeme.tutar)}</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Kart Üzerindeki İsim</label>
                  <input
                    type="text"
                    value={cardInfo.cardHolderName}
                    onChange={(e) => setCardInfo({...cardInfo, cardHolderName: e.target.value.toUpperCase()})}
                    placeholder="AD SOYAD"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Kart Numarası</label>
                  <input
                    type="text"
                    value={cardInfo.cardNumber}
                    onChange={(e) => setCardInfo({...cardInfo, cardNumber: formatCardNumber(e.target.value)})}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Ay</label>
                    <select
                      value={cardInfo.expireMonth}
                      onChange={(e) => setCardInfo({...cardInfo, expireMonth: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">AA</option>
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Yıl</label>
                    <select
                      value={cardInfo.expireYear}
                      onChange={(e) => setCardInfo({...cardInfo, expireYear: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">YY</option>
                      {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(y => (
                        <option key={y} value={y.toString()}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">CVC</label>
                    <input
                      type="text"
                      value={cardInfo.cvc}
                      onChange={(e) => setCardInfo({...cardInfo, cvc: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                      placeholder="***"
                      maxLength={4}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={use3ds}
                    onChange={(e) => setUse3ds(e.target.checked)}
                    className="w-4 h-4 text-purple-500 rounded"
                  />
                  <span className="text-sm text-slate-300 flex items-center gap-1">
                    <Lock className="w-4 h-4" />
                    3D Secure
                  </span>
                </label>

                {paymentError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <p className="text-sm text-red-400">{paymentError}</p>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={processing || !cardInfo.cardHolderName || !cardInfo.cardNumber || !cardInfo.expireMonth || !cardInfo.expireYear || !cardInfo.cvc}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-xl font-medium transition-colors"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  {formatCurrency(selectedOdeme.odeme.tutar)} Öde
                </button>

                <p className="text-xs text-slate-500 text-center">
                  🔒 iyzico güvencesiyle
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

