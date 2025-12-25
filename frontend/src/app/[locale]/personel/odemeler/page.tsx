'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Search, Filter, CreditCard, Wallet,
  CheckCircle, Clock, AlertCircle, XCircle, Users,
  Calendar, ChevronDown, ChevronUp, Download, RefreshCw,
  Banknote, TrendingUp, Loader2
} from 'lucide-react';

interface Ogrenci {
  id: string;
  ad: string;
  soyad: string;
  ogrenciNo: string;
  sinif: { ad: string } | null;
}

interface Odeme {
  id: string;
  tip: string;
  tutar: number;
  durum: string;
  taksitNo: number | null;
  vadeTarihi: string;
  odemeTarihi: string | null;
  odemeYontemi: string | null;
  ogrenci: Ogrenci;
  odemePlani: { donemAd: string } | null;
  onaylayan: { ad: string; soyad: string } | null;
}

interface OdemePlani {
  id: string;
  donemAd: string;
  toplamTutar: number;
  taksitSayisi: number;
  taksitTutari: number;
  indirimOrani: number | null;
  indirimTutari: number | null;
  ogrenci: Ogrenci;
  odemeler: Odeme[];
  istatistik: {
    odenenTutar: number;
    kalanTutar: number;
    gecikmisTaksitler: number;
    tamamlanmaOrani: number;
  };
}

interface Istatistik {
  toplamOdeme: number;
  toplamTutar: number;
  odenenTutar: number;
  bekleyenTutar: number;
  gecikmisTutar: number;
  iadeTutar: number;
}

export default function PersonelOdemeler() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'planlar' | 'odemeler' | 'rapor'>('planlar');
  const [planlar, setPlanlar] = useState<OdemePlani[]>([]);
  const [odemeler, setOdemeler] = useState<Odeme[]>([]);
  const [istatistik, setIstatistik] = useState<Istatistik | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [durumFilter, setDurumFilter] = useState('');
  
  // Modal states
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [selectedOdeme, setSelectedOdeme] = useState<Odeme | null>(null);
  const [processing, setProcessing] = useState(false);

  // Yeni plan form
  const [newPlan, setNewPlan] = useState({
    ogrenciId: '',
    donemAd: '',
    toplamTutar: '',
    taksitSayisi: '1',
    indirimOrani: '0'
  });

  // Öğrenci listesi
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);

  useEffect(() => {
    if (activeTab === 'planlar') {
      fetchPlanlar();
    } else if (activeTab === 'rapor') {
      fetchRapor();
    }
  }, [activeTab]);

  const fetchPlanlar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/odeme/planlar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setPlanlar(result.data);
      }
    } catch (error) {
      console.error('Planlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRapor = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/odeme/rapor`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setOdemeler(result.data.odemeler);
        setIstatistik(result.data.istatistik);
      }
    } catch (error) {
      console.error('Rapor yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOgrenciler = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users?role=ogrenci`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setOgrenciler(result.data || []);
      }
    } catch (error) {
      console.error('Öğrenciler yüklenemedi:', error);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.ogrenciId || !newPlan.donemAd || !newPlan.toplamTutar) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/odeme/plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ogrenciId: newPlan.ogrenciId,
          donemAd: newPlan.donemAd,
          toplamTutar: parseFloat(newPlan.toplamTutar),
          taksitSayisi: parseInt(newPlan.taksitSayisi),
          indirimOrani: parseFloat(newPlan.indirimOrani)
        })
      });

      if (response.ok) {
        setShowNewPlanModal(false);
        setNewPlan({ ogrenciId: '', donemAd: '', toplamTutar: '', taksitSayisi: '1', indirimOrani: '0' });
        fetchPlanlar();
      }
    } catch (error) {
      console.error('Plan oluşturma hatası:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualPayment = async (yontem: string) => {
    if (!selectedOdeme) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/odeme/manuel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          odemeId: selectedOdeme.id,
          odemeYontemi: yontem
        })
      });

      if (response.ok) {
        setShowManualPaymentModal(false);
        setSelectedOdeme(null);
        fetchPlanlar();
      }
    } catch (error) {
      console.error('Manuel ödeme hatası:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR');
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

  const filteredPlanlar = planlar.filter(plan => {
    const matchSearch = searchTerm === '' || 
      plan.ogrenci.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.ogrenci.soyad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.ogrenci.ogrenciNo?.includes(searchTerm);
    return matchSearch;
  });

  if (loading && planlar.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/personel')}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Ödeme Yönetimi</h1>
                <p className="text-xs text-slate-400">Ödeme planları ve tahsilat</p>
              </div>
            </div>
            
            <button
              onClick={() => { setShowNewPlanModal(true); fetchOgrenciler(); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni Plan
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl w-fit">
          {[
            { id: 'planlar', label: 'Ödeme Planları', icon: Wallet },
            { id: 'rapor', label: 'Rapor', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Arama ve Filtre */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Öğrenci ara..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => activeTab === 'planlar' ? fetchPlanlar() : fetchRapor()}
            className="p-2 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* İstatistikler (Rapor tab) */}
        {activeTab === 'rapor' && istatistik && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <p className="text-xs text-slate-400 mb-1">Toplam</p>
              <p className="text-lg font-bold text-white">{formatCurrency(istatistik.toplamTutar)}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <p className="text-xs text-slate-400 mb-1">Ödenen</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(istatistik.odenenTutar)}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <p className="text-xs text-slate-400 mb-1">Bekleyen</p>
              <p className="text-lg font-bold text-amber-400">{formatCurrency(istatistik.bekleyenTutar)}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <p className="text-xs text-slate-400 mb-1">Gecikmiş</p>
              <p className="text-lg font-bold text-red-400">{formatCurrency(istatistik.gecikmisTutar)}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <p className="text-xs text-slate-400 mb-1">İade</p>
              <p className="text-lg font-bold text-blue-400">{formatCurrency(istatistik.iadeTutar)}</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4">
              <p className="text-xs text-slate-400 mb-1">İşlem Sayısı</p>
              <p className="text-lg font-bold text-white">{istatistik.toplamOdeme}</p>
            </div>
          </div>
        )}

        {/* Ödeme Planları Listesi */}
        {activeTab === 'planlar' && (
          <div className="space-y-4">
            {filteredPlanlar.length > 0 ? (
              filteredPlanlar.map((plan) => (
                <div 
                  key={plan.id}
                  className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
                >
                  {/* Plan Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 font-bold">
                        {plan.ogrenci.ad[0]}{plan.ogrenci.soyad[0]}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{plan.ogrenci.ad} {plan.ogrenci.soyad}</h3>
                        <p className="text-sm text-slate-400">
                          {plan.ogrenci.sinif?.ad} • {plan.donemAd}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* İlerleme */}
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Ödeme İlerlemesi</p>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${plan.istatistik.tamamlanmaOrani}%` }}
                            />
                          </div>
                          <span className="text-sm text-emerald-400">{plan.istatistik.tamamlanmaOrani}%</span>
                        </div>
                      </div>
                      
                      {/* Kalan */}
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Kalan</p>
                        <p className={`font-bold ${plan.istatistik.kalanTutar > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {formatCurrency(plan.istatistik.kalanTutar)}
                        </p>
                      </div>
                      
                      {plan.istatistik.gecikmisTaksitler > 0 && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                          {plan.istatistik.gecikmisTaksitler} gecikmiş
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Taksitler */}
                  <div className="border-t border-slate-700/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-700/30">
                    {plan.odemeler.map((odeme) => {
                      const config = getDurumConfig(odeme.durum);
                      const canProcess = odeme.durum === 'BEKLEMEDE' || odeme.durum === 'GECIKTI';
                      
                      return (
                        <div 
                          key={odeme.id}
                          className="bg-slate-800/80 p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <config.icon className={`w-4 h-4 ${config.color}`} />
                            <div>
                              <p className="text-sm text-white">
                                {odeme.taksitNo}. Taksit
                              </p>
                              <p className="text-xs text-slate-400">{formatDate(odeme.vadeTarihi)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">{formatCurrency(odeme.tutar)}</p>
                            {canProcess && (
                              <button
                                onClick={() => { setSelectedOdeme(odeme); setShowManualPaymentModal(true); }}
                                className="text-xs text-purple-400 hover:text-purple-300"
                              >
                                Kaydet
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center">
                <Wallet className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Henüz ödeme planı bulunmuyor</p>
              </div>
            )}
          </div>
        )}

        {/* Rapor - Son Ödemeler */}
        {activeTab === 'rapor' && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50">
              <h3 className="text-white font-medium">Son Ödemeler</h3>
            </div>
            <div className="divide-y divide-slate-700/30">
              {odemeler.slice(0, 20).map((odeme) => {
                const config = getDurumConfig(odeme.durum);
                
                return (
                  <div key={odeme.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center`}>
                        <config.icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <p className="text-white text-sm">{odeme.ogrenci.ad} {odeme.ogrenci.soyad}</p>
                        <p className="text-xs text-slate-400">{odeme.odemePlani?.donemAd}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{formatCurrency(odeme.tutar)}</p>
                      <p className={`text-xs ${config.color}`}>{config.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Yeni Plan Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Yeni Ödeme Planı</h2>
                <button onClick={() => setShowNewPlanModal(false)} className="text-slate-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Öğrenci</label>
                  <select
                    value={newPlan.ogrenciId}
                    onChange={(e) => setNewPlan({...newPlan, ogrenciId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seçin</option>
                    {ogrenciler.map(ogr => (
                      <option key={ogr.id} value={ogr.id}>
                        {ogr.ad} {ogr.soyad} - {ogr.sinif?.ad}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Dönem Adı</label>
                  <input
                    type="text"
                    value={newPlan.donemAd}
                    onChange={(e) => setNewPlan({...newPlan, donemAd: e.target.value})}
                    placeholder="2024-2025 Güz Dönemi"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Toplam Tutar (TL)</label>
                  <input
                    type="number"
                    value={newPlan.toplamTutar}
                    onChange={(e) => setNewPlan({...newPlan, toplamTutar: e.target.value})}
                    placeholder="10000"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Taksit Sayısı</label>
                    <select
                      value={newPlan.taksitSayisi}
                      onChange={(e) => setNewPlan({...newPlan, taksitSayisi: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {[1, 2, 3, 4, 6, 8, 10, 12].map(n => (
                        <option key={n} value={n}>{n} Taksit</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">İndirim (%)</label>
                    <input
                      type="number"
                      value={newPlan.indirimOrani}
                      onChange={(e) => setNewPlan({...newPlan, indirimOrani: e.target.value})}
                      placeholder="0"
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Özet */}
                {newPlan.toplamTutar && (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <p className="text-sm text-purple-300">
                      Toplam: {formatCurrency(parseFloat(newPlan.toplamTutar) * (1 - parseFloat(newPlan.indirimOrani) / 100))}
                      {' '}({newPlan.taksitSayisi} x {formatCurrency(parseFloat(newPlan.toplamTutar) * (1 - parseFloat(newPlan.indirimOrani) / 100) / parseInt(newPlan.taksitSayisi))})
                    </p>
                  </div>
                )}

                <button
                  onClick={handleCreatePlan}
                  disabled={processing || !newPlan.ogrenciId || !newPlan.donemAd || !newPlan.toplamTutar}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-xl font-medium transition-colors"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Plan Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manuel Ödeme Modal */}
      {showManualPaymentModal && selectedOdeme && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Ödeme Kaydet</h2>
                <button onClick={() => setShowManualPaymentModal(false)} className="text-slate-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-white">{formatCurrency(selectedOdeme.tutar)}</p>
                <p className="text-sm text-slate-400">{selectedOdeme.taksitNo}. Taksit</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleManualPayment('NAKIT')}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                >
                  <Banknote className="w-5 h-5" />
                  Nakit Ödeme
                </button>
                <button
                  onClick={() => handleManualPayment('HAVALE')}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                >
                  <CreditCard className="w-5 h-5" />
                  Havale/EFT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

