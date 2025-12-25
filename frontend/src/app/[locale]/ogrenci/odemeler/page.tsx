'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, CreditCard, Wallet, Clock, CheckCircle, 
  AlertCircle, Calendar, ChevronDown, ChevronUp, 
  Lock, XCircle, Loader2
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

interface OdemeOzet {
  toplamBorc: number;
  odenenTutar: number;
  bekleyenTutar: number;
  gecikmisTutar: number;
  siradakiOdeme: Odeme | null;
}

interface CardInfo {
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
}

export default function OgrenciOdemeler() {
  const router = useRouter();
  const [planlar, setPlanlar] = useState<OdemePlani[]>([]);
  const [ozet, setOzet] = useState<OdemeOzet | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  
  // Ödeme modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOdeme, setSelectedOdeme] = useState<Odeme | null>(null);
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
    fetchOdemeDurumu();
  }, []);

  const fetchOdemeDurumu = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/odeme/durum`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setPlanlar(result.data.planlar);
        setOzet(result.data.ozet);
        if (result.data.planlar.length > 0) {
          setExpandedPlan(result.data.planlar[0].id);
        }
      }
    } catch (error) {
      console.error('Ödeme durumu yüklenemedi:', error);
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
      IADE: { label: 'İade Edildi', icon: XCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' }
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
          odemeId: selectedOdeme.id,
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
          // 3DS sayfasına yönlendir
          const newWindow = window.open('', '_self');
          if (newWindow) {
            newWindow.document.write(result.threeDSHtml);
          }
        } else {
          // Başarılı ödeme
          setShowPaymentModal(false);
          fetchOdemeDurumu();
          alert('Ödeme başarılı!');
        }
      } else {
        setPaymentError(result.message || 'Ödeme başarısız');
      }
    } catch (error) {
      console.error('Ödeme hatası:', error);
      setPaymentError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setProcessing(false);
    }
  };

  const openPaymentModal = (odeme: Odeme) => {
    setSelectedOdeme(odeme);
    setShowPaymentModal(true);
    setPaymentError('');
  };

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
              onClick={() => router.push('/ogrenci')}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Ödemelerim</h1>
              <p className="text-xs text-slate-400">Ödeme durumu ve işlemleri</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Özet Kartları */}
        {ozet && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">Toplam Borç</span>
              </div>
              <p className="text-xl font-bold text-white">{formatCurrency(ozet.toplamBorc)}</p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400">Ödenen</span>
              </div>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(ozet.odenenTutar)}</p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400">Bekleyen</span>
              </div>
              <p className="text-xl font-bold text-amber-400">{formatCurrency(ozet.bekleyenTutar)}</p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-slate-400">Gecikmiş</span>
              </div>
              <p className="text-xl font-bold text-red-400">{formatCurrency(ozet.gecikmisTutar)}</p>
            </div>
          </div>
        )}

        {/* Sıradaki Ödeme */}
        {ozet?.siradakiOdeme && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300 mb-1">Sıradaki Ödemeniz</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(ozet.siradakiOdeme.tutar)}</p>
                <p className="text-sm text-slate-400 mt-1">
                  Son ödeme: {formatDate(ozet.siradakiOdeme.vadeTarihi)}
                </p>
              </div>
              <button
                onClick={() => openPaymentModal(ozet.siradakiOdeme!)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Şimdi Öde
              </button>
            </div>
          </div>
        )}

        {/* Ödeme Planları */}
        {planlar.length > 0 ? (
          <div className="space-y-4">
            {planlar.map((plan) => (
              <div 
                key={plan.id}
                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
              >
                {/* Plan Header */}
                <button
                  onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-medium">{plan.donemAd}</h3>
                      <p className="text-sm text-slate-400">
                        {plan.taksitSayisi} taksit • {formatCurrency(plan.taksitTutari)}/ay
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{formatCurrency(plan.toplamTutar - (plan.indirimTutari || 0))}</p>
                      {plan.indirimTutari && plan.indirimTutari > 0 && (
                        <p className="text-xs text-emerald-400">%{plan.indirimOrani} indirim</p>
                      )}
                    </div>
                    {expandedPlan === plan.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Taksitler */}
                {expandedPlan === plan.id && (
                  <div className="border-t border-slate-700/50">
                    {plan.odemeler.map((odeme) => {
                      const config = getDurumConfig(odeme.durum);
                      const Icon = config.icon;
                      const canPay = odeme.durum === 'BEKLEMEDE' || odeme.durum === 'GECIKTI';
                      
                      return (
                        <div 
                          key={odeme.id}
                          className="flex items-center justify-between p-4 border-b border-slate-700/30 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {odeme.taksitNo ? `${odeme.taksitNo}. Taksit` : 'Tek Ödeme'}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Calendar className="w-3 h-3" />
                                Vade: {formatDate(odeme.vadeTarihi)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-white font-medium">{formatCurrency(odeme.tutar)}</p>
                              <span className={`text-xs ${config.color}`}>{config.label}</span>
                            </div>
                            
                            {canPay && (
                              <button
                                onClick={() => openPaymentModal(odeme)}
                                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors"
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
            <p className="text-slate-400">Henüz ödeme planı bulunmuyor</p>
          </div>
        )}
      </main>

      {/* Ödeme Modal */}
      {showPaymentModal && selectedOdeme && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Ödeme Yap</h2>
                  <p className="text-sm text-slate-400">{formatCurrency(selectedOdeme.tutar)}</p>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Kart Formu */}
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
                  <div className="relative">
                    <input
                      type="text"
                      value={cardInfo.cardNumber}
                      onChange={(e) => setCardInfo({...cardInfo, cardNumber: formatCardNumber(e.target.value)})}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
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
                        <option key={m} value={m.toString().padStart(2, '0')}>
                          {m.toString().padStart(2, '0')}
                        </option>
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

                {/* 3D Secure */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={use3ds}
                    onChange={(e) => setUse3ds(e.target.checked)}
                    className="w-4 h-4 text-purple-500 rounded"
                  />
                  <span className="text-sm text-slate-300 flex items-center gap-1">
                    <Lock className="w-4 h-4" />
                    3D Secure ile güvenli ödeme
                  </span>
                </label>

                {/* Hata */}
                {paymentError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <p className="text-sm text-red-400">{paymentError}</p>
                  </div>
                )}

                {/* Buton */}
                <button
                  onClick={handlePayment}
                  disabled={processing || !cardInfo.cardHolderName || !cardInfo.cardNumber || !cardInfo.expireMonth || !cardInfo.expireYear || !cardInfo.cvc}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-xl font-medium transition-colors"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      {formatCurrency(selectedOdeme.tutar)} Öde
                    </>
                  )}
                </button>

                {/* Güvenlik Notu */}
                <p className="text-xs text-slate-500 text-center">
                  🔒 Ödemeniz iyzico güvencesiyle işlenmektedir
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

