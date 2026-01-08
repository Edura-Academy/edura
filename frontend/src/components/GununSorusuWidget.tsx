'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface GununSorusu {
  id: string;
  soruMetni: string;
  secenekler: string[];
  dogruCevap: string;
  aciklama: string | null;
  zorluk: number;
  xpOdulu: number;
  konu: string | null;
  cevaplandi: boolean;
  kullaniciCevabi?: string;
  dogruMu?: boolean;
}

interface GununSorusuWidgetProps {
  token: string;
  compact?: boolean;
}

export function GununSorusuWidget({ token, compact = false }: GununSorusuWidgetProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [soru, setSoru] = useState<GununSorusu | null>(null);
  const [loading, setLoading] = useState(true);
  const [secilenCevap, setSecilenCevap] = useState<string | null>(null);
  const [cevapGonderildi, setCevapGonderildi] = useState(false);
  const [sonuc, setSonuc] = useState<{ dogruMu: boolean; dogruCevap: string; aciklama: string | null; kazanilanXp: number } | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [ipucuGoster, setIpucuGoster] = useState(false);
  const [ipucuKullanildi, setIpucuKullanildi] = useState(false);

  useEffect(() => {
    fetchGununSorusu();
  }, [token]);

  const fetchGununSorusu = async () => {
    try {
      const response = await fetch(`${API_URL}/gamification/gunun-sorusu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSoru(data);
        if (data.cevaplandi) {
          setCevapGonderildi(true);
          setSonuc({
            dogruMu: data.dogruMu,
            dogruCevap: data.dogruCevap,
            aciklama: data.aciklama,
            kazanilanXp: data.dogruMu ? data.xpOdulu : 0
          });
          setSecilenCevap(data.kullaniciCevabi);
        }
      }
    } catch (error) {
      console.error('Günün sorusu alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCevapGonder = async () => {
    if (!secilenCevap || !soru) return;
    
    setGonderiliyor(true);
    try {
      const response = await fetch(`${API_URL}/gamification/gunun-sorusu/cevapla`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          soruId: soru.id,
          cevap: secilenCevap,
          ipucuKullanildi
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSonuc({
          dogruMu: data.dogruMu,
          dogruCevap: data.dogruCevap,
          aciklama: data.aciklama,
          kazanilanXp: data.kazanilanXp
        });
        setCevapGonderildi(true);
      }
    } catch (error) {
      console.error('Cevap gönderilemedi:', error);
    } finally {
      setGonderiliyor(false);
    }
  };

  const handleIpucuGoster = () => {
    setIpucuGoster(true);
    setIpucuKullanildi(true);
  };

  // Zorluk rozeti
  const getZorlukBadge = (zorluk: number) => {
    const badges = [
      { text: 'Çok Kolay', color: 'bg-green-500', icon: '⭐' },
      { text: 'Kolay', color: 'bg-emerald-500', icon: '⭐⭐' },
      { text: 'Orta', color: 'bg-amber-500', icon: '⭐⭐⭐' },
      { text: 'Zor', color: 'bg-orange-500', icon: '⭐⭐⭐⭐' },
      { text: 'Çok Zor', color: 'bg-red-500', icon: '⭐⭐⭐⭐⭐' }
    ];
    return badges[zorluk - 1] || badges[2];
  };

  if (loading) {
    return (
      <div className={`${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl border p-6`}>
        <div className="animate-pulse">
          <div className={`h-6 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded w-1/3 mb-4`}></div>
          <div className={`h-4 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded w-full mb-2`}></div>
          <div className={`h-4 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded w-2/3`}></div>
        </div>
      </div>
    );
  }

  if (!soru) {
    return (
      <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50 backdrop-blur-sm' : 'bg-white/80 border-slate-200/50 backdrop-blur-sm'} rounded-2xl border shadow-xl overflow-hidden`}>
        {/* Premium Header */}
        <div className={`p-4 ${isDark ? 'bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-red-600/20' : 'bg-gradient-to-r from-amber-50 via-orange-50 to-red-50'} border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30`}>
              <span className="text-xl">❓</span>
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Günün Sorusu</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Günlük meydan okuma</p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full ${isDark ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'bg-gradient-to-br from-amber-100 to-orange-100'} flex items-center justify-center`}>
            <span className="text-4xl">🎯</span>
          </div>
          <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Bugün için soru hazırlanıyor...</p>
          <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Yeni sorular her gün ekleniyor!</p>
        </div>
      </div>
    );
  }

  const zorlukBadge = getZorlukBadge(soru.zorluk);

  return (
    <div className={`${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl border overflow-hidden`}>
      {/* Header - Lichess tarzı */}
      <div className={`p-4 ${isDark ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-amber-500/30' : 'bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-amber-100'} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${isDark ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-amber-500 to-orange-600'} rounded-xl flex items-center justify-center shadow-lg ${isDark ? 'shadow-amber-500/30' : 'shadow-amber-200'}`}>
              <span className="text-2xl">❓</span>
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                Günün Sorusu
                {cevapGonderildi && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${sonuc?.dogruMu ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {sonuc?.dogruMu ? '✓ Doğru' : '✗ Yanlış'}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                {soru.konu && (
                  <span className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'} font-medium`}>
                    📚 {soru.konu}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full text-white ${zorlukBadge.color}`}>
                  {zorlukBadge.text}
                </span>
              </div>
            </div>
          </div>
          <div className={`text-right ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            <div className="text-2xl font-black">+{soru.xpOdulu}</div>
            <div className="text-xs font-medium">XP</div>
          </div>
        </div>
      </div>

      {/* Soru */}
      <div className="p-4">
        <p className={`${isDark ? 'text-white' : 'text-gray-800'} font-medium text-lg mb-4 leading-relaxed`}>
          {soru.soruMetni}
        </p>

        {/* Seçenekler */}
        <div className="space-y-2 mb-4">
          {soru.secenekler.map((secenek, index) => {
            const isSelected = secilenCevap === secenek;
            const isCorrect = cevapGonderildi && secenek === sonuc?.dogruCevap;
            const isWrong = cevapGonderildi && isSelected && !sonuc?.dogruMu;
            
            let optionClass = isDark 
              ? 'bg-slate-700/50 border-slate-600 hover:border-amber-500/50 hover:bg-amber-500/10'
              : 'bg-gray-50 border-gray-200 hover:border-amber-300 hover:bg-amber-50';
            
            if (isSelected && !cevapGonderildi) {
              optionClass = isDark 
                ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-amber-100 border-amber-500 ring-2 ring-amber-200';
            }
            
            if (cevapGonderildi) {
              if (isCorrect) {
                optionClass = isDark 
                  ? 'bg-green-500/20 border-green-500'
                  : 'bg-green-100 border-green-500';
              } else if (isWrong) {
                optionClass = isDark 
                  ? 'bg-red-500/20 border-red-500'
                  : 'bg-red-100 border-red-500';
              } else {
                optionClass = isDark 
                  ? 'bg-slate-700/30 border-slate-600 opacity-50'
                  : 'bg-gray-50 border-gray-200 opacity-50';
              }
            }
            
            return (
              <button
                key={index}
                onClick={() => !cevapGonderildi && setSecilenCevap(secenek)}
                disabled={cevapGonderildi}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${optionClass} ${!cevapGonderildi && 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isCorrect ? 'bg-green-500 text-white' :
                    isWrong ? 'bg-red-500 text-white' :
                    isSelected && !cevapGonderildi ? (isDark ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white') :
                    (isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600')
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={`flex-1 ${isDark ? 'text-white' : 'text-gray-800'} ${cevapGonderildi && !isCorrect && !isWrong && 'opacity-50'}`}>
                    {secenek}
                  </span>
                  {isCorrect && <span className="text-green-500 text-xl">✓</span>}
                  {isWrong && <span className="text-red-500 text-xl">✗</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* İpucu */}
        {!cevapGonderildi && soru.aciklama && (
          <div className="mb-4">
            {!ipucuGoster ? (
              <button
                onClick={handleIpucuGoster}
                className={`text-sm ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'} font-medium flex items-center gap-1`}
              >
                💡 İpucu göster <span className="text-xs opacity-70">(XP yarıya düşer)</span>
              </button>
            ) : (
              <div className={`p-3 rounded-xl ${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'} border`}>
                <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  💡 <strong>İpucu:</strong> {soru.aciklama.substring(0, 100)}...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sonuç Açıklaması */}
        {cevapGonderildi && sonuc && (
          <div className={`p-4 rounded-xl mb-4 ${sonuc.dogruMu 
            ? (isDark ? 'bg-green-500/20 border-green-500/30' : 'bg-green-50 border-green-200')
            : (isDark ? 'bg-red-500/20 border-red-500/30' : 'bg-red-50 border-red-200')
          } border`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{sonuc.dogruMu ? '🎉' : '😔'}</span>
              <span className={`font-bold ${sonuc.dogruMu ? 'text-green-500' : 'text-red-500'}`}>
                {sonuc.dogruMu ? `Tebrikler! +${sonuc.kazanilanXp} XP kazandın!` : 'Yanlış cevap!'}
              </span>
            </div>
            {sonuc.aciklama && (
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                <strong>Açıklama:</strong> {sonuc.aciklama}
              </p>
            )}
          </div>
        )}

        {/* Gönder Butonu */}
        {!cevapGonderildi && (
          <button
            onClick={handleCevapGonder}
            disabled={!secilenCevap || gonderiliyor}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
              secilenCevap 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:shadow-amber-500/25'
                : (isDark ? 'bg-slate-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed')
            }`}
          >
            {gonderiliyor ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Gönderiliyor...
              </span>
            ) : (
              <>
                Cevabı Gönder {ipucuKullanildi && <span className="text-sm opacity-75">(+{Math.floor(soru.xpOdulu / 2)} XP)</span>}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Gamification özet kartı
interface GamificationStats {
  xpPuani: number;
  xpSeviye: string;
  streak: number;
  enYuksekStreak: number;
}

interface GamificationSummaryProps {
  token: string;
}

export function GamificationSummary({ token }: GamificationSummaryProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/gamification/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Gamification stats alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeviyeBilgi = (seviye: string) => {
    const seviyeler: Record<string, { ad: string; renk: string; icon: string; gradient: string }> = {
      BASLANGIC: { ad: 'Başlangıç', renk: 'gray', icon: '⚪', gradient: 'from-gray-400 to-gray-500' },
      CIRAK: { ad: 'Çırak', renk: 'amber', icon: '🥉', gradient: 'from-amber-400 to-amber-600' },
      USTA: { ad: 'Usta', renk: 'slate', icon: '🥈', gradient: 'from-slate-300 to-slate-500' },
      UZMAN: { ad: 'Uzman', renk: 'yellow', icon: '🥇', gradient: 'from-yellow-400 to-yellow-600' },
      EFSANE: { ad: 'Efsane', renk: 'cyan', icon: '💎', gradient: 'from-cyan-400 to-blue-500' }
    };
    return seviyeler[seviye] || seviyeler.BASLANGIC;
  };

  if (loading) {
    return (
      <div className={`${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl border p-4`}>
        <div className="animate-pulse flex gap-4">
          <div className={`h-16 w-16 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-xl`}></div>
          <div className="flex-1">
            <div className={`h-4 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded w-1/2 mb-2`}></div>
            <div className={`h-6 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded w-1/3`}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const seviyeBilgi = getSeviyeBilgi(stats.xpSeviye);

  return (
    <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50 backdrop-blur-sm' : 'bg-white/80 border-slate-200/50 backdrop-blur-sm'} rounded-2xl border shadow-xl overflow-hidden`}>
      {/* Premium Header */}
      <div className={`p-5 ${isDark ? 'bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-rose-600/20' : 'bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50'} border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
        <div className="flex items-center gap-4">
          <div className={`relative w-14 h-14 bg-gradient-to-br ${seviyeBilgi.gradient} rounded-2xl flex items-center justify-center shadow-xl text-3xl`}>
            {seviyeBilgi.icon}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
              <span className="text-[10px] font-bold text-white">✓</span>
            </div>
          </div>
          <div>
            <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {seviyeBilgi.ad} Seviye
            </h3>
            <p className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-600'} font-bold`}>
              {stats.xpPuani.toLocaleString()} XP
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Premium Cards */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {/* XP Card */}
        <div className={`relative overflow-hidden p-4 rounded-xl ${isDark ? 'bg-gradient-to-br from-purple-500/30 to-violet-600/30' : 'bg-gradient-to-br from-purple-500 to-violet-600'} ${isDark ? '' : 'text-white'} shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-all`}>
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-white/10 rounded-full"></div>
          <div className="relative flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-100'}`}>Toplam XP</p>
              <p className={`text-xl font-black ${isDark ? 'text-white' : ''}`}>{stats.xpPuani.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className={`relative overflow-hidden p-4 rounded-xl ${isDark ? 'bg-gradient-to-br from-orange-500/30 to-red-600/30' : 'bg-gradient-to-br from-orange-500 to-red-600'} ${isDark ? '' : 'text-white'} shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all`}>
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-white/10 rounded-full"></div>
          <div className="relative flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-orange-300' : 'text-orange-100'}`}>Seri</p>
              <p className={`text-xl font-black ${isDark ? 'text-white' : ''}`}>{stats.streak} gün</p>
            </div>
          </div>
        </div>
      </div>

      {/* En Yüksek Streak - Premium Footer */}
      <div className={`px-4 pb-2`}>
        <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'} border`}>
          <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>En Yüksek Seri:</span>
          <span className={`text-sm font-black ${isDark ? 'text-amber-400' : 'text-amber-600'} flex items-center gap-1`}>
            <span className="text-lg">🏆</span> {stats.enYuksekStreak} gün
          </span>
        </div>
      </div>

      {/* Sıralama Butonu */}
      <div className="px-4 pb-4">
        <a
          href="/ogrenci/siralama"
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 hover:shadow-lg hover:shadow-purple-500/25 transition-all`}
        >
          <span className="text-lg">🏆</span>
          Kurum İçi Sıralamayı Gör
        </a>
      </div>
    </div>
  );
}

