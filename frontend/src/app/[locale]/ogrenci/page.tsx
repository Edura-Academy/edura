'use client';

import { useState, useEffect, useRef } from 'react';
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
  type Ders,
  type Devamsizlik,
  type Bildirim,
  type Mesaj,
} from '../../../lib/mockData';

export default function OgrenciDashboard() {
  const [ogrenci] = useState(mockOgrenci);
  const [dersler] = useState<Ders[]>(mockDersler);
  const [devamsizliklar] = useState<Devamsizlik[]>(mockDevamsizliklar);
  const [bildirimler] = useState<Bildirim[]>(mockBildirimler);
  const [mesajlar] = useState<Mesaj[]>(mockMesajlar);
  const [ogretmenler] = useState(mockOgretmenler);
  const [sinavSonuclari] = useState(mockSinavSonuclari);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [showSifreModal, setShowSifreModal] = useState(false);
  const [showYeniMesajModal, setShowYeniMesajModal] = useState(false);
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dropdown dışına tıklandığında kapat
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

  // Ortalama hesapla
  const ortalamaPuan = sinavSonuclari.reduce((acc, sonuc) => acc + sonuc.yuzde, 0) / sinavSonuclari.length;

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
              Sınıf: <span className="font-bold text-blue-600">{ogrenci.sinif}</span> • {ogrenci.seviye}. Sınıf
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
                  <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
                    <h3 className="text-lg font-bold text-gray-900">Mesajlar</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {mesajlar.length > 0 ? (
                      mesajlar.map((mesaj) => (
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
                              <p className="text-sm text-gray-600 mt-1">{mesaj.mesaj}</p>
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
                <div className="absolute right-0 top-14 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 animate-slideDown">
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-bold text-gray-900">
                      {ogrenci.ad} {ogrenci.soyad}
                    </p>
                    <p className="text-sm text-gray-500">{ogrenci.email}</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <button
                      onClick={() => {
                        setShowProfilModal(true);
                        setOpenDropdown(null);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors font-medium text-gray-900"
                    >
                      👤 Profil Bilgilerim
                    </button>
                    <button
                      onClick={() => {
                        setShowSifreModal(true);
                        setOpenDropdown(null);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors font-medium text-gray-900"
                    >
                      🔐 Şifre Değiştir
                    </button>
                    <button className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors font-medium text-red-600">
                      🚪 Çıkış Yap
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
                <p className="text-purple-600 text-xs sm:text-sm font-bold uppercase tracking-wide">Sınav Sayısı</p>
                <p className="text-4xl sm:text-5xl font-bold text-purple-900 mt-2">{sinavSonuclari.length}</p>
              </div>
              <div className="text-5xl sm:text-6xl opacity-20">📝</div>
            </div>
          </div>
        </div>

        {/* Deneme Sonuçları */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span>📊</span> Deneme Sonuçlarım
          </h2>
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-700 font-bold text-sm sm:text-base">Sınav</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-700 font-bold text-sm sm:text-base">Ders</th>
                    <th className="text-center py-3 px-2 sm:px-4 text-gray-700 font-bold text-sm sm:text-base">Puan</th>
                    <th className="text-center py-3 px-2 sm:px-4 text-gray-700 font-bold text-sm sm:text-base hidden sm:table-cell">D/Y/B</th>
                    <th className="text-center py-3 px-2 sm:px-4 text-gray-700 font-bold text-sm sm:text-base">Yüzde</th>
                  </tr>
                </thead>
                <tbody>
                  {sinavSonuclari.map((sonuc) => (
                    <tr key={sonuc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2 sm:px-4 text-sm sm:text-base">
                        <p className="font-semibold text-gray-900">{sonuc.sinavAd}</p>
                        <p className="text-xs text-gray-500">
                          <ClientOnlyDate dateString={sonuc.tarih} />
                        </p>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-gray-700 text-sm sm:text-base">{sonuc.ders}</td>
                      <td className="py-3 px-2 sm:px-4 text-center">
                        <span className="font-bold text-blue-600 text-sm sm:text-base">{sonuc.puan}</span>
                        <span className="text-gray-500 text-xs sm:text-sm">/{sonuc.toplamPuan}</span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-center text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                        <span className="text-green-600 font-semibold">{sonuc.dogru}</span> / 
                        <span className="text-red-600 font-semibold">{sonuc.yanlis}</span> / 
                        <span className="text-gray-500 font-semibold">{sonuc.bos}</span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                sonuc.yuzde >= 80 ? 'bg-green-500' : sonuc.yuzde >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${sonuc.yuzde}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-gray-900 text-sm sm:text-base">%{sonuc.yuzde}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* Profil Bilgileri Modal */}
      {showProfilModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">👤 Profil Bilgilerim</h2>
              <button
                onClick={() => setShowProfilModal(false)}
                className="text-3xl font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ad</label>
                  <input
                    type="text"
                    value={ogrenci.ad}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Soyad</label>
                  <input
                    type="text"
                    value={ogrenci.soyad}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">E-posta</label>
                <input
                  type="email"
                  value={ogrenci.email}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={ogrenci.telefon}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Doğum Tarihi</label>
                  <input
                    type="date"
                    value={ogrenci.dogumTarihi}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sınıf</label>
                  <input
                    type="text"
                    value={ogrenci.sinif}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Öğrenci No</label>
                  <input
                    type="text"
                    value={ogrenci.ogrenciNo}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all">
                ✏️ Düzenle
              </button>
              <button
                onClick={() => setShowProfilModal(false)}
                className="flex-1 bg-gray-200 text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-300 transition-colors"
              >
                Kapat
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
