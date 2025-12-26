'use client';

import { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Star,
  Target,
  Award,
  Zap,
  CheckCircle,
  Circle,
  HelpCircle,
  Users,
  Medal,
  Crown,
  Sparkles
} from 'lucide-react';

interface UserStats {
  xpPuani: number;
  streak: number;
  streakAktif: boolean;
  rozetler: Array<{ tip: string; kazanilanTarih: string }>;
  gunlukGorevler: Array<{
    id: string;
    tip: string;
    hedef: number;
    ilerleme: number;
    tamamlandi: boolean;
    xpOdulu: number;
  }>;
  tamamlananGorevSayisi: number;
}

interface GununSorusu {
  id: string;
  soruMetni: string;
  secenekler: string[];
  zorluk: number;
  xpOdulu: number;
  konu: string;
  cevaplandi: boolean;
  kullaniciCevabi?: string;
  dogruMu?: boolean;
  dogruCevap?: string;
  aciklama?: string;
}

interface LeaderboardItem {
  id: string;
  ad: string;
  soyad: string;
  xpPuani: number;
  streak: number;
  sinif?: { ad: string };
  rank: number;
  isCurrentUser: boolean;
}

interface Rozet {
  tip: string;
  ad: string;
  aciklama: string;
  icon: string;
  kazanildi: boolean;
  kazanilanTarih?: string;
}

const gorevIcons: Record<string, React.ReactNode> = {
  SORU_COZ: <Target className="w-5 h-5" />,
  GUN_SORUSU: <HelpCircle className="w-5 h-5" />,
  MATERYAL_INCELE: <Star className="w-5 h-5" />,
  ODEV_TESLIM: <CheckCircle className="w-5 h-5" />,
  CANLI_DERS: <Users className="w-5 h-5" />
};

const gorevLabels: Record<string, string> = {
  SORU_COZ: 'Soru Çöz',
  GUN_SORUSU: 'Günün Sorusunu Çöz',
  MATERYAL_INCELE: 'Materyal İncele',
  ODEV_TESLIM: 'Ödev Teslim Et',
  CANLI_DERS: 'Canlı Derse Katıl'
};

export default function OgrenciBasarilarPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [gununSorusu, setGununSorusu] = useState<GununSorusu | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [rozetler, setRozetler] = useState<{ kazanilanlar: number; toplam: number; rozetler: Rozet[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gorevler' | 'soru' | 'rozetler' | 'leaderboard'>('gorevler');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, soruRes, leaderboardRes, rozetlerRes] = await Promise.all([
        fetch(`${API_URL}/gamification/stats`, { headers }),
        fetch(`${API_URL}/gamification/gunun-sorusu`, { headers }),
        fetch(`${API_URL}/gamification/leaderboard`, { headers }),
        fetch(`${API_URL}/gamification/rozetler`, { headers })
      ]);

      setStats(await statsRes.json());
      setGununSorusu(await soruRes.json());
      const lb = await leaderboardRes.json();
      setLeaderboard(lb.leaderboard || []);
      setRozetler(await rozetlerRes.json());
    } catch (error) {
      console.error('Veri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (!selectedAnswer || !gununSorusu) return;

    setAnswering(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/gamification/gunun-sorusu/cevapla`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          soruId: gununSorusu.id,
          cevap: selectedAnswer,
          ipucuKullanildi: false
        })
      });

      const data = await res.json();
      setGununSorusu({
        ...gununSorusu,
        cevaplandi: true,
        kullaniciCevabi: selectedAnswer,
        dogruMu: data.dogruMu,
        dogruCevap: data.dogruCevap,
        aciklama: data.aciklama
      });
      fetchData(); // İstatistikleri güncelle
    } catch (error) {
      console.error('Cevap hatası:', error);
    } finally {
      setAnswering(false);
    }
  };

  const getXpLevel = (xp: number) => {
    if (xp < 500) return { level: 1, name: 'Başlangıç', next: 500 };
    if (xp < 1500) return { level: 2, name: 'Çırak', next: 1500 };
    if (xp < 3000) return { level: 3, name: 'Kalfa', next: 3000 };
    if (xp < 5000) return { level: 4, name: 'Usta', next: 5000 };
    if (xp < 10000) return { level: 5, name: 'Uzman', next: 10000 };
    return { level: 6, name: 'Efsane', next: xp };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const xpLevel = stats ? getXpLevel(stats.xpPuani) : { level: 1, name: 'Başlangıç', next: 500 };
  const xpProgress = stats ? Math.min(100, (stats.xpPuani / xpLevel.next) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Başarılarım</h1>
            <p className="text-gray-400">Streak, rozetler ve sıralama</p>
          </div>
        </div>

        {/* Ana İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* XP */}
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/30">
            <div className="flex items-center justify-between mb-3">
              <Zap className="w-8 h-8 text-purple-400" />
              <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded-full">
                Lvl {xpLevel.level}
              </span>
            </div>
            <div className="text-3xl font-bold text-white">{stats?.xpPuani || 0}</div>
            <div className="text-purple-300 text-sm">{xpLevel.name}</div>
            <div className="mt-2 h-2 bg-purple-900/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <div className="text-xs text-purple-400 mt-1">{xpLevel.next - (stats?.xpPuani || 0)} XP kaldı</div>
          </div>

          {/* Streak */}
          <div className={`bg-gradient-to-br ${stats?.streakAktif ? 'from-orange-500/20 to-red-600/20 border-orange-500/30' : 'from-gray-500/20 to-gray-600/20 border-gray-500/30'} backdrop-blur-xl rounded-2xl p-5 border`}>
            <div className="flex items-center justify-between mb-3">
              <Flame className={`w-8 h-8 ${stats?.streakAktif ? 'text-orange-400' : 'text-gray-400'}`} />
              {stats?.streakAktif && (
                <span className="text-xs bg-orange-500/30 text-orange-300 px-2 py-1 rounded-full animate-pulse">
                  Aktif
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-white">{stats?.streak || 0}</div>
            <div className={stats?.streakAktif ? 'text-orange-300' : 'text-gray-400'}>Gün Streak</div>
            {!stats?.streakAktif && (
              <p className="text-xs text-gray-500 mt-2">Bugün aktivite yaparak streak başlat!</p>
            )}
          </div>

          {/* Rozetler */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 backdrop-blur-xl rounded-2xl p-5 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-3">
              <Award className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white">{rozetler?.kazanilanlar || 0}</div>
            <div className="text-yellow-300">/ {rozetler?.toplam || 0} Rozet</div>
          </div>

          {/* Günlük Görevler */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl p-5 border border-green-500/30">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats?.tamamlananGorevSayisi || 0}</div>
            <div className="text-green-300">/ {stats?.gunlukGorevler?.length || 0} Görev</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'gorevler', label: 'Günlük Görevler', icon: Target },
            { id: 'soru', label: 'Günün Sorusu', icon: HelpCircle },
            { id: 'rozetler', label: 'Rozetler', icon: Award },
            { id: 'leaderboard', label: 'Sıralama', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'gorevler' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-green-400" />
              Günlük Görevler
            </h2>
            <div className="space-y-4">
              {stats?.gunlukGorevler?.map(gorev => (
                <div
                  key={gorev.id}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    gorev.tamamlandi ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${gorev.tamamlandi ? 'bg-green-500' : 'bg-white/10'}`}>
                    {gorev.tamamlandi ? <CheckCircle className="w-5 h-5 text-white" /> : gorevIcons[gorev.tip]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{gorevLabels[gorev.tip]}</span>
                      <span className="text-yellow-400 text-sm">+{gorev.xpOdulu} XP</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${gorev.tamamlandi ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${(gorev.ilerleme / gorev.hedef) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-sm">{gorev.ilerleme}/{gorev.hedef}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'soru' && gununSorusu && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-blue-400" />
                Günün Sorusu
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  {gununSorusu.konu}
                </span>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                  +{gununSorusu.xpOdulu} XP
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-6 mb-6">
              <p className="text-xl text-white">{gununSorusu.soruMetni}</p>
            </div>

            <div className="grid gap-3 mb-6">
              {gununSorusu.secenekler.map((secenek, i) => {
                const harfler = ['A', 'B', 'C', 'D', 'E'];
                const isSelected = selectedAnswer === secenek;
                const isCorrect = gununSorusu.cevaplandi && secenek === gununSorusu.dogruCevap;
                const isWrong = gununSorusu.cevaplandi && secenek === gununSorusu.kullaniciCevabi && !gununSorusu.dogruMu;

                return (
                  <button
                    key={i}
                    onClick={() => !gununSorusu.cevaplandi && setSelectedAnswer(secenek)}
                    disabled={gununSorusu.cevaplandi}
                    className={`flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                      isCorrect ? 'bg-green-500/30 border-2 border-green-500' :
                      isWrong ? 'bg-red-500/30 border-2 border-red-500' :
                      isSelected ? 'bg-blue-500/30 border-2 border-blue-500' :
                      'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      isCorrect ? 'bg-green-500 text-white' :
                      isWrong ? 'bg-red-500 text-white' :
                      isSelected ? 'bg-blue-500 text-white' :
                      'bg-white/10 text-gray-400'
                    }`}>
                      {harfler[i]}
                    </span>
                    <span className="text-white">{secenek}</span>
                    {isCorrect && <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />}
                  </button>
                );
              })}
            </div>

            {!gununSorusu.cevaplandi ? (
              <button
                onClick={handleAnswer}
                disabled={!selectedAnswer || answering}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {answering ? 'Kontrol ediliyor...' : 'Cevabı Kontrol Et'}
              </button>
            ) : (
              <div className={`p-4 rounded-xl ${gununSorusu.dogruMu ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <p className={`font-semibold ${gununSorusu.dogruMu ? 'text-green-400' : 'text-red-400'}`}>
                  {gununSorusu.dogruMu ? '🎉 Doğru cevap!' : '❌ Yanlış cevap'}
                </p>
                {gununSorusu.aciklama && (
                  <p className="text-gray-300 text-sm mt-2">{gununSorusu.aciklama}</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rozetler' && rozetler && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              Rozetler ({rozetler.kazanilanlar}/{rozetler.toplam})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rozetler.rozetler.map(rozet => (
                <div
                  key={rozet.tip}
                  className={`p-4 rounded-xl text-center ${
                    rozet.kazanildi 
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
                      : 'bg-white/5 opacity-50'
                  }`}
                >
                  <div className="text-4xl mb-2">{rozet.icon}</div>
                  <h3 className="text-white font-semibold text-sm">{rozet.ad}</h3>
                  <p className="text-gray-400 text-xs mt-1">{rozet.aciklama}</p>
                  {rozet.kazanildi && rozet.kazanilanTarih && (
                    <p className="text-green-400 text-xs mt-2">
                      ✓ {new Date(rozet.kazanilanTarih).toLocaleDateString('tr-TR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Liderlik Tablosu
            </h2>
            <div className="space-y-2">
              {leaderboard.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    item.isCurrentUser 
                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50' 
                      : 'bg-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    i === 0 ? 'bg-yellow-500 text-white' :
                    i === 1 ? 'bg-gray-300 text-gray-800' :
                    i === 2 ? 'bg-amber-700 text-white' :
                    'bg-white/10 text-gray-400'
                  }`}>
                    {i < 3 ? (
                      i === 0 ? <Crown className="w-5 h-5" /> :
                      i === 1 ? <Medal className="w-5 h-5" /> :
                      <Medal className="w-5 h-5" />
                    ) : item.rank}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {item.ad} {item.soyad}
                      {item.isCurrentUser && <span className="text-purple-400 text-sm ml-2">(Sen)</span>}
                    </div>
                    <div className="text-gray-400 text-sm">{item.sinif?.ad}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">{item.xpPuani} XP</div>
                    <div className="text-orange-400 text-sm flex items-center gap-1">
                      <Flame className="w-3 h-3" /> {item.streak}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

