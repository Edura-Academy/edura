'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import { useTheme } from '@/contexts/ThemeContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface SeviyeInfo {
  ad: string;
  renk: string;
  icon: string;
}

interface LeaderboardItem {
  rank: number;
  id: string;
  ad: string;
  soyad: string;
  profilFoto: string | null;
  xpPuani: number;
  xpSeviye: string;
  seviyeInfo: SeviyeInfo;
  streak: number;
  enYuksekStreak: number;
  sinif: { id: string; ad: string } | null;
  isCurrentUser: boolean;
  istatistikler: {
    toplamCozulenSoru: number;
    toplamDogruCevap: number;
    toplamTeslimOdev: number;
    toplamKatilinanDers: number;
    basariOrani: number;
  };
  rozetSayisi: number;
  rozetler: Array<{ tip: string; ad: string; icon: string; renk: string }>;
}

interface SiralamaData {
  leaderboard: LeaderboardItem[];
  currentUser: LeaderboardItem | null;
  userRank: number;
  totalStudents: number;
  siniflar: Array<{ id: string; ad: string; seviye: number }>;
  filteredBy: string;
  istatistikler: {
    toplamXP: number;
    ortalamaXP: number;
    enYuksekXP: number;
  };
}

function SiralamaPageContent() {
  const { token, user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [data, setData] = useState<SiralamaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSinif, setSelectedSinif] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<LeaderboardItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (token) {
      fetchSiralama();
    }
  }, [token, selectedSinif]);

  const fetchSiralama = async () => {
    try {
      const url = selectedSinif 
        ? `${API_URL}/gamification/kurum-siralama?sinifId=${selectedSinif}`
        : `${API_URL}/gamification/kurum-siralama`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Sıralama verisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (item: LeaderboardItem) => {
    setSelectedProfile(item);
    setShowModal(true);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return { icon: '🥇', color: 'from-yellow-400 to-yellow-600', bg: 'bg-yellow-500' };
    if (rank === 2) return { icon: '🥈', color: 'from-gray-300 to-gray-500', bg: 'bg-gray-400' };
    if (rank === 3) return { icon: '🥉', color: 'from-amber-600 to-amber-800', bg: 'bg-amber-700' };
    return { icon: `${rank}`, color: 'from-slate-400 to-slate-600', bg: 'bg-slate-500' };
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'} flex items-center justify-center`}>
        <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Veri yüklenemedi</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900' : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-gray-100'} backdrop-blur-md border-b sticky top-0 z-40`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/ogrenci" className={`p-2 rounded-xl ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                <svg className={`w-6 h-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>🏆 Kurum İçi Sıralama</h1>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{data.totalStudents} öğrenci arasında</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Kullanıcı Özet Kartı */}
        {data.currentUser && (
          <div className={`mb-6 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-3xl p-6 text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative flex items-center gap-4">
              <div className={`w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-xl`}>
                {getRankIcon(data.userRank).icon}
              </div>
              <div className="flex-1">
                <p className="text-white/80 text-sm">Sıralamanız</p>
                <p className="text-4xl font-black">{data.userRank}. / {data.totalStudents}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                    {data.currentUser.xpPuani.toLocaleString()} XP
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    🔥 {data.currentUser.streak} gün
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    🏅 {data.currentUser.rozetSayisi} rozet
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl p-4 border text-center`}>
            <p className={`text-2xl font-black ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{data.istatistikler.ortalamaXP.toLocaleString()}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Ortalama XP</p>
          </div>
          <div className={`${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl p-4 border text-center`}>
            <p className={`text-2xl font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>{data.istatistikler.enYuksekXP.toLocaleString()}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>En Yüksek XP</p>
          </div>
          <div className={`${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl p-4 border text-center`}>
            <p className={`text-2xl font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{data.totalStudents}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Toplam Öğrenci</p>
          </div>
        </div>

        {/* Sınıf Filtresi */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedSinif('')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              !selectedSinif
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tüm Kurs
          </button>
          {data.siniflar.map((sinif) => (
            <button
              key={sinif.id}
              onClick={() => setSelectedSinif(sinif.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                selectedSinif === sinif.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {sinif.ad}
            </button>
          ))}
        </div>

        {/* Liderlik Tablosu */}
        <div className={`${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-gray-100'} rounded-2xl border overflow-hidden`}>
          <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
            <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              🏆 {selectedSinif ? 'Sınıf Sıralaması' : 'Genel Sıralama'}
            </h2>
          </div>
          
          <div className="divide-y divide-slate-700/50">
            {data.leaderboard.map((item) => {
              const rankInfo = getRankIcon(item.rank);
              
              return (
                <div
                  key={item.id}
                  onClick={() => handleProfileClick(item)}
                  className={`p-4 cursor-pointer transition-all ${
                    item.isCurrentUser
                      ? isDark ? 'bg-purple-500/20 hover:bg-purple-500/30' : 'bg-purple-50 hover:bg-purple-100'
                      : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Sıra */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                      item.rank <= 3 ? `bg-gradient-to-br ${rankInfo.color}` : isDark ? 'bg-slate-600' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {item.rank <= 3 ? (
                        <span className="text-xl">{rankInfo.icon}</span>
                      ) : (
                        <span className="text-sm">{item.rank}</span>
                      )}
                    </div>

                    {/* Profil */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                          item.profilFoto ? '' : 'bg-gradient-to-br from-blue-400 to-purple-500'
                        }`}>
                          {item.profilFoto ? (
                            <img src={item.profilFoto} alt="" className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            item.ad.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                            {item.ad} {item.soyad}
                            {item.isCurrentUser && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>Sen</span>
                            )}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {item.sinif?.ad || 'Sınıf yok'} • {item.seviyeInfo?.ad || 'Başlangıç'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* XP ve Rozetler */}
                    <div className="text-right">
                      <p className={`font-black text-lg ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{item.xpPuani.toLocaleString()} XP</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <span className={`text-xs ${isDark ? 'text-orange-400' : 'text-orange-500'} flex items-center gap-0.5`}>
                          🔥 {item.streak}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-600'} flex items-center gap-0.5`}>
                          🏅 {item.rozetSayisi}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rozetler */}
                  {item.rozetler.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 ml-14">
                      {item.rozetler.slice(0, 5).map((rozet, i) => (
                        <span
                          key={i}
                          className={`text-lg`}
                          title={rozet.ad}
                        >
                          {rozet.icon}
                        </span>
                      ))}
                      {item.rozetler.length > 5 && (
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          +{item.rozetler.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {data.leaderboard.length === 0 && (
              <div className={`p-8 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                <span className="text-4xl block mb-2">🏆</span>
                Henüz sıralama verisi yok
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Profil Modal */}
      {showModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div 
            className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl max-w-md w-full shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-6 text-white relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 hover:bg-white/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">
                  {selectedProfile.profilFoto ? (
                    <img src={selectedProfile.profilFoto} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                  ) : (
                    selectedProfile.ad.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedProfile.ad} {selectedProfile.soyad}</h3>
                  <p className="text-white/80 text-sm">{selectedProfile.sinif?.ad}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                      #{selectedProfile.rank}
                    </span>
                    <span className="text-lg">{selectedProfile.seviyeInfo?.icon}</span>
                    <span className="text-sm font-semibold">{selectedProfile.seviyeInfo?.ad}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`${isDark ? 'bg-purple-500/20' : 'bg-purple-50'} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-black ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{selectedProfile.xpPuani.toLocaleString()}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>XP Puanı</p>
                </div>
                <div className={`${isDark ? 'bg-orange-500/20' : 'bg-orange-50'} rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{selectedProfile.streak}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Gün Streak</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-6">
                <div className={`${isDark ? 'bg-slate-700' : 'bg-gray-50'} rounded-xl p-3 text-center`}>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedProfile.istatistikler.toplamCozulenSoru}</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Çözülen Soru</p>
                </div>
                <div className={`${isDark ? 'bg-slate-700' : 'bg-gray-50'} rounded-xl p-3 text-center`}>
                  <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{selectedProfile.istatistikler.basariOrani}%</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Başarı</p>
                </div>
                <div className={`${isDark ? 'bg-slate-700' : 'bg-gray-50'} rounded-xl p-3 text-center`}>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedProfile.istatistikler.toplamTeslimOdev}</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Ödev</p>
                </div>
                <div className={`${isDark ? 'bg-slate-700' : 'bg-gray-50'} rounded-xl p-3 text-center`}>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedProfile.istatistikler.toplamKatilinanDers}</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Canlı Ders</p>
                </div>
              </div>

              {/* Rozetler */}
              {selectedProfile.rozetler.length > 0 && (
                <div>
                  <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>🏅 Kazanılan Rozetler</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.rozetler.map((rozet, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}
                      >
                        <span className="text-lg">{rozet.icon}</span>
                        <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{rozet.ad}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SiralamaPage() {
  return (
    <RoleGuard allowedRoles={['ogrenci']}>
      <SiralamaPageContent />
    </RoleGuard>
  );
}
