'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import ClientOnlyDate from '../../../components/ClientOnlyDate';
import YeniMesajModal from '../../../components/YeniMesajModal';
import {
  mockOgrenci,
  mockDersler,
  mockDevamsizliklar,
  mockBildirimler,
  mockMesajlar,
  mockOgretmenler,
  mockSinavSonuclari,
  mockKurslar,
  type Ders,
  type Devamsizlik,
  type Bildirim,
  type Mesaj,
} from '../../../lib/mockData';

// Lise mi ortaokul mu kontrolü (9 ve üzeri lise)
const isLise = mockOgrenci.seviye >= 9;

export default function OgrenciDashboard() {
  const [ogrenci] = useState(mockOgrenci);
  const [dersler] = useState<Ders[]>(mockDersler);
  const [devamsizliklar] = useState<Devamsizlik[]>(mockDevamsizliklar);
  const [bildirimler] = useState<Bildirim[]>(mockBildirimler);
  const [mesajlar] = useState<Mesaj[]>(mockMesajlar);
  const [ogretmenler] = useState(mockOgretmenler.filter(o => o.kursId === mockOgrenci.kursId));
  const [sinavSonuclari] = useState(mockSinavSonuclari);
  const [kurs] = useState(mockKurslar.find(k => k.id === mockOgrenci.kursId));

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [showSifreModal, setShowSifreModal] = useState(false);
  const [showYeniMesajModal, setShowYeniMesajModal] = useState(false);
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Deneme sınavlarını grupla (sınav bazlı)
  const grupluDenemeler = useMemo(() => {
    const gruplar: { [key: string]: typeof sinavSonuclari } = {};
    sinavSonuclari.forEach(sonuc => {
      if (!gruplar[sonuc.sinavAd]) {
        gruplar[sonuc.sinavAd] = [];
      }
      gruplar[sonuc.sinavAd].push(sonuc);
    });
    return Object.entries(gruplar).map(([sinavAd, sonuclar]) => ({
      sinavAd,
      sonuclar,
      tarih: sonuclar[0].tarih,
      ortalama: sonuclar.reduce((acc, s) => acc + s.yuzde, 0) / sonuclar.length,
      toplamDogru: sonuclar.reduce((acc, s) => acc + s.dogru, 0),
      toplamYanlis: sonuclar.reduce((acc, s) => acc + s.yanlis, 0),
      toplamBos: sonuclar.reduce((acc, s) => acc + s.bos, 0),
    }));
  }, [sinavSonuclari]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownToggle = (dropdownName: string) => {
    setOpenDropdown(prev => (prev === dropdownName ? null : dropdownName));
  };

  const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const dersSayisi = dersler.length;
  const devamsizlikSayisi = devamsizliklar.length;
  const ortalamaPuan = sinavSonuclari.reduce((acc, sonuc) => acc + sonuc.yuzde, 0) / sinavSonuclari.length;

  // Deneme numarasını çıkar (örn: "1. Deneme Sınavı" -> 1)
  const getDenemeNo = (sinavAd: string) => {
    const match = sinavAd.match(/(\d+)\./);
    return match ? match[1] : '1';
  };

  // ===================== LİSE ARAYÜZÜ =====================
  if (isLise) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Lise Header - Minimal ve Profesyonel */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo/Başlık */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-slate-900">{kurs?.ad}</h1>
                  <p className="text-xs text-slate-500">{ogrenci.sinif} • {ogrenci.ad} {ogrenci.soyad}</p>
                </div>
              </div>

              {/* Sağ Menü */}
              <div ref={dropdownRef} className="flex items-center gap-2">
                {/* Yeni Mesaj */}
                <button
                  onClick={() => setShowYeniMesajModal(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                  title="Yeni Mesaj"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                {/* Bildirimler */}
                <div className="relative">
                  <button
                    onClick={() => handleDropdownToggle('bildirim')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 relative"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {bildirimler.filter(b => !b.okundu).length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                        {bildirimler.filter(b => !b.okundu).length}
                      </span>
                    )}
                  </button>
                  {openDropdown === 'bildirim' && (
                    <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                      <div className="p-3 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-900 text-sm">Bildirimler</h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {bildirimler.map(bildirim => (
                          <div key={bildirim.id} className={`p-3 hover:bg-slate-50 ${!bildirim.okundu ? 'bg-blue-50/50' : ''}`}>
                            <p className="font-medium text-slate-900 text-sm">{bildirim.baslik}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{bildirim.mesaj}</p>
                            <p className="text-xs text-slate-400 mt-1"><ClientOnlyDate dateString={bildirim.tarih} /></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mesajlar */}
                <div className="relative">
                  <button
                    onClick={() => handleDropdownToggle('mesaj')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 relative"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    {mesajlar.filter(m => !m.okundu).length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                        {mesajlar.filter(m => !m.okundu).length}
                      </span>
                    )}
                  </button>
                  {openDropdown === 'mesaj' && (
                    <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 text-sm">Mesajlar</h3>
                        <Link href="/ogrenci/mesajlar" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          Tümünü Gör
                        </Link>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {mesajlar.slice(0, 3).map(mesaj => (
                          <div key={mesaj.id} className={`p-3 hover:bg-slate-50 cursor-pointer ${!mesaj.okundu ? 'bg-blue-50/50' : ''}`}>
                            <p className="font-medium text-slate-900 text-sm">{mesaj.gonderenAd}</p>
                            <p className="text-xs text-slate-600 mt-0.5 truncate">{mesaj.baslik}</p>
                            <p className="text-xs text-slate-400 mt-1"><ClientOnlyDate dateString={mesaj.tarih} /></p>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-t border-slate-100">
                        <Link 
                          href="/ogrenci/mesajlar"
                          className="block w-full py-2 text-center text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                        >
                          Tüm Mesajları Görüntüle
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profil */}
                <div className="relative ml-2">
                  <button
                    onClick={() => handleDropdownToggle('profil')}
                    className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                      {ogrenci.ad.charAt(0)}
                    </div>
                    <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === 'profil' && (
                    <div className="absolute right-0 top-12 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <p className="font-semibold text-slate-900">{ogrenci.ad} {ogrenci.soyad}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{ogrenci.email}</p>
                      </div>
                      <div className="p-1.5">
                        <button
                          onClick={() => { setShowProfilModal(true); setOpenDropdown(null); }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profili Düzenle
                        </button>
                        <Link
                          href="/ogrenci/mesajlar"
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          Mesajlarım
                        </Link>
                        <Link
                          href="/ogrenci/hesap-ayarlari"
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Hesap Ayarları
                        </Link>
                        <hr className="my-1.5" />
                        <button
                          onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Karşılama ve İstatistikler */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Merhaba, {ogrenci.ad}</h2>
            <p className="text-slate-500">Bugün nasıl hissediyorsun? Çalışmaya hazır mısın?</p>
          </div>

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Ders Sayısı</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{dersSayisi}</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Devamsızlık</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{devamsizlikSayisi}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Ortalama</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">%{ortalamaPuan.toFixed(0)}</p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Deneme Sayısı</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{grupluDenemeler.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sol Kolon - Deneme Sınavları ve Öğretmenler */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deneme Sınavları */}
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Deneme Sınavları</h3>
                  <span className="text-xs text-slate-500">{grupluDenemeler.length} sınav</span>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {grupluDenemeler.map((deneme) => (
                    <Link
                      key={deneme.sinavAd}
                      href={`/ogrenci/deneme/${getDenemeNo(deneme.sinavAd)}`}
                      className="block bg-slate-50 hover:bg-slate-100 rounded-xl p-4 border border-slate-200 hover:border-slate-300 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {deneme.sinavAd}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <ClientOnlyDate dateString={deneme.tarih} />
                          </p>
                        </div>
                        <span className={`text-lg font-bold ${
                          deneme.ortalama >= 80 ? 'text-green-600' : 
                          deneme.ortalama >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          %{deneme.ortalama.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-600">{deneme.toplamDogru} D</span>
                        <span className="text-red-600">{deneme.toplamYanlis} Y</span>
                        <span className="text-slate-400">{deneme.toplamBos} B</span>
                      </div>
                      <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            deneme.ortalama >= 80 ? 'bg-green-500' : 
                            deneme.ortalama >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${deneme.ortalama}%` }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Ders Programı */}
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Haftalık Program</h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {gunler.map((gun) => {
                      const gunDersleri = dersler.filter(d => d.gun === gun);
                      return (
                        <div key={gun} className="text-center">
                          <p className="text-xs font-medium text-slate-500 mb-2">{gun.slice(0, 3)}</p>
                          <div className="space-y-1.5">
                            {gunDersleri.length > 0 ? gunDersleri.map(ders => (
                              <div key={ders.id} className="bg-slate-50 rounded-lg p-2 text-xs border border-slate-100">
                                <p className="font-medium text-slate-900 truncate">{ders.ad}</p>
                                <p className="text-slate-500 mt-0.5">{ders.baslangicSaati}</p>
                              </div>
                            )) : (
                              <div className="text-xs text-slate-400 italic py-4">-</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ Kolon */}
            <div className="space-y-6">
              {/* Öğretmenler */}
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Öğretmenlerim</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {ogretmenler.slice(0, 5).map(ogretmen => (
                    <div key={ogretmen.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-slate-500 to-slate-700 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                          {ogretmen.ad.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{ogretmen.ad} {ogretmen.soyad}</p>
                          <p className="text-xs text-slate-500">{ogretmen.brans}</p>
                        </div>
                        <button
                          onClick={() => setShowYeniMesajModal(true)}
                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Mesaj Gönder"
                        >
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Devamsızlıklar */}
              {devamsizliklar.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <h3 className="font-semibold text-slate-900">Devamsızlık Kaydı</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {devamsizliklar.map(kayit => (
                      <div key={kayit.id} className="p-4">
                        <p className="font-medium text-slate-900 text-sm">{kayit.dersAdi}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          <ClientOnlyDate dateString={kayit.tarih} />
                        </p>
                        {kayit.aciklama && (
                          <p className="text-xs text-slate-600 mt-1 bg-slate-50 px-2 py-1 rounded">{kayit.aciklama}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Modaller */}
        <YeniMesajModal isOpen={showYeniMesajModal} onClose={() => setShowYeniMesajModal(false)} />
        
        {showProfilModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
            <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Profili Düzenle</h2>
                <button onClick={() => setShowProfilModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ad</label>
                    <input type="text" defaultValue={ogrenci.ad} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Soyad</label>
                    <input type="text" defaultValue={ogrenci.soyad} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                  <input type="email" defaultValue={ogrenci.email} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                  <input type="tel" defaultValue={ogrenci.telefon} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="p-5 border-t border-slate-200 flex gap-3">
                <button onClick={() => setShowProfilModal(false)} className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">İptal</button>
                <button onClick={() => setShowProfilModal(false)} className="flex-1 py-2 text-white bg-slate-800 hover:bg-slate-900 rounded-lg text-sm font-medium">Kaydet</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===================== ORTAOKUL ARAYÜZÜ =====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6">
      <main className="max-w-7xl mx-auto">
        {/* Üst Bar - Profil, Bildirim, Mesaj */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              Merhaba, {ogrenci.ad} 👋
            </h1>
            <p className="text-gray-500 text-base sm:text-lg">
              <span className="font-bold text-blue-600">{kurs?.ad}</span> • Sınıf: <span className="font-bold text-indigo-600">{ogrenci.sinif}</span>
            </p>
          </div>

          {/* Sağ taraf butonları */}
          <div ref={dropdownRef} className="flex items-center gap-3">
            {/* Yeni Mesaj Butonu */}
            <button
              onClick={() => setShowYeniMesajModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:shadow-lg transition-all hover:from-green-600 hover:to-green-700 active:scale-95 font-semibold text-sm flex items-center gap-2"
            >
              <span>✉️</span>
              <span className="hidden sm:inline">Yeni Mesaj</span>
            </button>

            {/* Bildirimler */}
            <div className="relative">
              <button
                onClick={() => handleDropdownToggle('bildirim')}
                className="relative p-3 rounded-full hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">🔔</span>
                {bildirimler.filter((b) => !b.okundu).length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
                    {bildirimler.filter((b) => !b.okundu).length}
                  </span>
                )}
              </button>

              {/* Bildirimler Dropdown */}
              {openDropdown === 'bildirim' && (
                <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto animate-slideDown">
                  <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
                    <h3 className="text-lg font-bold text-gray-900">Bildirimler</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {bildirimler.length > 0 ? (
                      bildirimler.map((bildirim) => (
                        <div
                          key={bildirim.id}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !bildirim.okundu ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-bold text-gray-900">{bildirim.baslik}</p>
                              <p className="text-sm text-gray-600 mt-1">{bildirim.mesaj}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                <ClientOnlyDate dateString={bildirim.tarih} />
                              </p>
                            </div>
                            {!bildirim.okundu && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">Bildirim yok</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mesajlar */}
            <div className="relative">
              <button
                onClick={() => handleDropdownToggle('mesaj')}
                className="relative p-3 rounded-full hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">💬</span>
                {mesajlar.filter((m) => !m.okundu).length > 0 && (
                  <span className="absolute top-0 right-0 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
                    {mesajlar.filter((m) => !m.okundu).length}
                  </span>
                )}
              </button>

              {/* Mesajlar Dropdown */}
              {openDropdown === 'mesaj' && (
                <div className="absolute right-0 top-14 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto animate-slideDown">
                  <div className="p-4 border-b border-gray-200 sticky top-0 bg-white flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Mesajlar</h3>
                    <Link href="/ogrenci/mesajlar" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Tümünü Gör
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {mesajlar.length > 0 ? (
                      mesajlar.slice(0, 3).map((mesaj) => (
                        <div
                          key={mesaj.id}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !mesaj.okundu ? 'bg-green-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-bold text-gray-900">{mesaj.gonderenAd}</p>
                              <p className="text-sm font-semibold text-gray-700 mt-1">{mesaj.baslik}</p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{mesaj.mesaj}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                <ClientOnlyDate dateString={mesaj.tarih} />
                              </p>
                            </div>
                            {!mesaj.okundu && (
                              <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">Mesaj yok</div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <Link 
                      href="/ogrenci/mesajlar"
                      className="block w-full py-2.5 text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-sm"
                    >
                      📬 Tüm Mesajları Görüntüle
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profil Menüsü */}
            <div className="relative">
              <button
                onClick={() => handleDropdownToggle('profil')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {ogrenci.ad.charAt(0)}
                </div>
              </button>

              {/* Profil Dropdown */}
              {openDropdown === 'profil' && (
                <div className="absolute right-0 top-14 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 animate-slideDown overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {ogrenci.ad.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {ogrenci.ad} {ogrenci.soyad}
                      </p>
                      <p className="text-sm text-gray-500">@ogrenci.edura.com</p>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowProfilModal(true);
                        setOpenDropdown(null);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors font-medium text-gray-700 rounded-lg flex items-center gap-3"
                    >
                      <span className="text-lg">👤</span>
                      <span>Profili düzenle</span>
                    </button>
                    <Link
                      href="/ogrenci/mesajlar"
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors font-medium text-gray-700 rounded-lg flex items-center gap-3"
                      onClick={() => setOpenDropdown(null)}
                    >
                      <span className="text-lg">💬</span>
                      <span>Mesajlarım</span>
                    </Link>
                    <Link
                      href="/ogrenci/hesap-ayarlari"
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors font-medium text-gray-700 rounded-lg flex items-center gap-3"
                      onClick={() => setOpenDropdown(null)}
                    >
                      <span className="text-lg">⚙️</span>
                      <span>Hesap ayarları</span>
                    </Link>
                    <hr className="my-2" />
                    <button 
                      onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors font-medium text-red-600 rounded-lg flex items-center gap-3"
                    >
                      <span className="text-lg">🚪</span>
                      <span>Çıkış yap</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* İstatistikler Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 sm:p-6 border border-blue-200 hover:shadow-xl transition-all cursor-pointer hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-xs sm:text-sm font-bold uppercase tracking-wide">Toplam Ders</p>
                <p className="text-4xl sm:text-5xl font-bold text-blue-900 mt-2">{dersSayisi}</p>
              </div>
              <div className="text-5xl sm:text-6xl opacity-20">📚</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-5 sm:p-6 border border-orange-200 hover:shadow-xl transition-all cursor-pointer hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-xs sm:text-sm font-bold uppercase tracking-wide">Devamsızlık</p>
                <p className="text-4xl sm:text-5xl font-bold text-orange-900 mt-2">{devamsizlikSayisi}</p>
              </div>
              <div className="text-5xl sm:text-6xl opacity-20">⚠️</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-5 sm:p-6 border border-green-200 hover:shadow-xl transition-all cursor-pointer hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-xs sm:text-sm font-bold uppercase tracking-wide">Ortalama</p>
                <p className="text-4xl sm:text-5xl font-bold text-green-900 mt-2">{ortalamaPuan.toFixed(0)}</p>
              </div>
              <div className="text-5xl sm:text-6xl opacity-20">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-5 sm:p-6 border border-purple-200 hover:shadow-xl transition-all cursor-pointer hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-xs sm:text-sm font-bold uppercase tracking-wide">Deneme Sayısı</p>
                <p className="text-4xl sm:text-5xl font-bold text-purple-900 mt-2">{grupluDenemeler.length}</p>
              </div>
              <div className="text-5xl sm:text-6xl opacity-20">📝</div>
            </div>
          </div>
        </div>

        {/* Deneme Sonuçları - Kart Görünümü */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span>📊</span> Deneme Sonuçlarım
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {grupluDenemeler.map((deneme) => (
              <Link
                key={deneme.sinavAd}
                href={`/ogrenci/deneme/${getDenemeNo(deneme.sinavAd)}`}
                className="block bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 hover:shadow-xl transition-all hover:scale-105 hover:border-blue-300 group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                      {deneme.sinavAd}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <ClientOnlyDate dateString={deneme.tarih} />
                    </p>
                  </div>
                  <div className={`text-3xl sm:text-4xl font-bold ${
                    deneme.ortalama >= 80 ? 'text-green-500' : 
                    deneme.ortalama >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    %{deneme.ortalama.toFixed(0)}
                  </div>
                </div>

                {/* D/Y/B Özeti */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="font-semibold text-green-700">{deneme.toplamDogru}</span>
                    <span className="text-gray-500">Doğru</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="font-semibold text-red-700">{deneme.toplamYanlis}</span>
                    <span className="text-gray-500">Yanlış</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                    <span className="font-semibold text-gray-700">{deneme.toplamBos}</span>
                    <span className="text-gray-500">Boş</span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      deneme.ortalama >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                      deneme.ortalama >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                      'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                    style={{ width: `${deneme.ortalama}%` }}
                  ></div>
                </div>

                {/* Detay Butonu */}
                <div className="mt-4 flex items-center justify-end text-blue-600 group-hover:text-blue-700 font-semibold text-sm">
                  <span>Detayları Gör</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Öğretmenler Listesi */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span>👨‍🏫</span> Öğretmenlerim
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ogretmenler.map((ogretmen) => (
              <div
                key={ogretmen.id}
                className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {ogretmen.ad.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                      {ogretmen.ad} {ogretmen.soyad}
                    </h3>
                    <p className="text-sm text-blue-600 font-semibold">{ogretmen.brans}</p>
                    <div className="mt-3 space-y-1">
                      <a
                        href={`tel:${ogretmen.telefon}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <span>📞</span>
                        <span>{ogretmen.telefon}</span>
                      </a>
                      <a
                        href={`mailto:${ogretmen.email}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors truncate"
                      >
                        <span>📧</span>
                        <span className="truncate">{ogretmen.email}</span>
                      </a>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowYeniMesajModal(true)}
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-2 rounded-xl hover:shadow-lg transition-all hover:from-blue-600 hover:to-blue-700 active:scale-95 text-sm"
                >
                  💬 Mesaj Gönder
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Haftalık Ders Programı */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-3">
            <span>📅</span> Haftalık Ders Programı
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gunler.map((gun) => {
              const gunDersleri = dersler.filter((d) => d.gun === gun);
              const gunRenkleri: { [key: string]: { bg: string; border: string; text: string } } = {
                'Pazartesi': { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-200', text: 'text-blue-700' },
                'Salı': { bg: 'from-purple-50 to-purple-100/50', border: 'border-purple-200', text: 'text-purple-700' },
                'Çarşamba': { bg: 'from-pink-50 to-pink-100/50', border: 'border-pink-200', text: 'text-pink-700' },
                'Perşembe': { bg: 'from-green-50 to-green-100/50', border: 'border-green-200', text: 'text-green-700' },
                'Cuma': { bg: 'from-yellow-50 to-yellow-100/50', border: 'border-yellow-200', text: 'text-yellow-700' },
                'Cumartesi': { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-indigo-200', text: 'text-indigo-700' },
              };
              const renkler = gunRenkleri[gun] || gunRenkleri['Pazartesi'];

              return (
                <div
                  key={gun}
                  className={`bg-gradient-to-br ${renkler.bg} rounded-2xl p-5 border ${renkler.border} hover:shadow-lg transition-all hover:scale-105`}
                >
                  <h3 className={`font-bold ${renkler.text} mb-4 text-base sm:text-lg`}>{gun}</h3>
                  {gunDersleri.length > 0 ? (
                    <div className="space-y-2">
                      {gunDersleri.map((ders) => (
                        <div
                          key={ders.id}
                          className="bg-white rounded-xl p-3 hover:shadow-md transition-shadow border border-gray-100 hover:border-gray-200"
                        >
                          <p className="font-bold text-gray-900 text-sm">{ders.ad}</p>
                          <p className="text-xs text-gray-600 mt-1">👨‍🏫 {ders.ogretmenAd}</p>
                          <p className="text-xs text-gray-500 mt-1">⏰ {ders.baslangicSaati} - {ders.bitisSaati}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">Ders yok</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Devamsızlık Kaydı */}
        {devamsizliklar.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span>⚠️</span> Devamsızlık Kaydım
            </h2>
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-4 sm:p-6 border border-red-200">
              <div className="space-y-3">
                {devamsizliklar.map((kayit) => (
                  <div
                    key={kayit.id}
                    className="flex items-center justify-between bg-white rounded-xl p-4 border border-red-100 hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="text-gray-900 font-bold">{kayit.dersAdi}</p>
                      <p className="text-gray-500 text-sm">
                        <ClientOnlyDate dateString={kayit.tarih} />
                      </p>
                      {kayit.aciklama && (
                        <p className="text-gray-600 text-sm mt-1">{kayit.aciklama}</p>
                      )}
                    </div>
                    <span className="text-2xl sm:text-3xl">❌</span>
                  </div>
                ))}
              </div>
              <div className="bg-red-100/50 rounded-xl p-4 mt-4 border border-red-200">
                <p className="text-red-700 font-semibold text-sm">
                  ⚠️ <span className="font-bold">Dikkat!</span> Fazla devamsızlık sınıf geçmesini etkileyebilir.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Yeni Mesaj Modal */}
      <YeniMesajModal 
        isOpen={showYeniMesajModal} 
        onClose={() => setShowYeniMesajModal(false)} 
      />

      {/* Profil Düzenleme Modal */}
      {showProfilModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-slideUp overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <h2 className="text-xl font-bold text-gray-900">Profili Düzenle</h2>
              </div>
              <button
                onClick={() => setShowProfilModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Profil Fotoğrafı */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {ogrenci.ad.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Profil Fotoğrafı</p>
                  <p className="text-xs text-gray-500">JPG veya PNG. Maks 2MB</p>
                  <button className="mt-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Fotoğraf Yükle
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                    <input
                      type="text"
                      defaultValue={ogrenci.ad}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                    <input
                      type="text"
                      defaultValue={ogrenci.soyad}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    defaultValue={ogrenci.email}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    defaultValue={ogrenci.telefon}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sınıf</label>
                    <input
                      type="text"
                      value={ogrenci.sinif}
                      disabled
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci No</label>
                    <input
                      type="text"
                      value={ogrenci.ogrenciNo}
                      disabled
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowProfilModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  // TODO: API call
                  setShowProfilModal(false);
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Şifre Değiştir Modal */}
      {showSifreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">🔐 Şifre Değiştir</h2>
              <button
                onClick={() => {
                  setShowSifreModal(false);
                  setYeniSifre('');
                  setYeniSifreTekrar('');
                }}
                className="text-3xl font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mevcut Şifre</label>
                <input
                  type="password"
                  placeholder="Mevcut şifrenizi girin"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Yeni Şifre</label>
                <input
                  type="password"
                  value={yeniSifre}
                  onChange={(e) => setYeniSifre(e.target.value)}
                  placeholder="Yeni şifreni girin"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  value={yeniSifreTekrar}
                  onChange={(e) => setYeniSifreTekrar(e.target.value)}
                  placeholder="Yeni şifreni tekrar girin"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                  <strong>Şifre Gereksinimleri:</strong> En az 8 karakter, büyük/küçük harf ve sayı içermeli.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all hover:from-blue-600 hover:to-blue-700 disabled:opacity-50">
                💾 Kaydet
              </button>
              <button
                onClick={() => {
                  setShowSifreModal(false);
                  setYeniSifre('');
                  setYeniSifreTekrar('');
                }}
                className="flex-1 bg-gray-200 text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-300 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
