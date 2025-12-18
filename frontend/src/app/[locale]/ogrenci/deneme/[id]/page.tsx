'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ClientOnlyDate from '../../../../../components/ClientOnlyDate';
import { mockSinavSonuclari, mockOgrenci } from '../../../../../lib/mockData';

export default function DenemeDetay() {
  const params = useParams();
  const denemeId = params.id as string;
  
  // Deneme numarasına göre filtreleme (1, 2, 3 gibi)
  const denemeNo = parseInt(denemeId);
  const deneemAdi = `${denemeNo}. Deneme Sınavı`;
  
  // Bu denemeye ait tüm ders sonuçlarını bul
  const denemeSonuclari = mockSinavSonuclari.filter(s => s.sinavAd === deneemAdi);
  
  // Genel ortalama hesapla
  const genelOrtalama = useMemo(() => {
    if (denemeSonuclari.length === 0) return 0;
    return denemeSonuclari.reduce((acc, s) => acc + s.yuzde, 0) / denemeSonuclari.length;
  }, [denemeSonuclari]);

  // Toplam doğru, yanlış, boş
  const toplamlar = useMemo(() => {
    return denemeSonuclari.reduce((acc, s) => ({
      dogru: acc.dogru + s.dogru,
      yanlis: acc.yanlis + s.yanlis,
      bos: acc.bos + s.bos,
      puan: acc.puan + s.puan,
      toplamPuan: acc.toplamPuan + s.toplamPuan
    }), { dogru: 0, yanlis: 0, bos: 0, puan: 0, toplamPuan: 0 });
  }, [denemeSonuclari]);

  // En yüksek ve en düşük performans
  const enYuksek = useMemo(() => {
    if (denemeSonuclari.length === 0) return null;
    return denemeSonuclari.reduce((max, s) => s.yuzde > max.yuzde ? s : max);
  }, [denemeSonuclari]);

  const enDusuk = useMemo(() => {
    if (denemeSonuclari.length === 0) return null;
    return denemeSonuclari.reduce((min, s) => s.yuzde < min.yuzde ? s : min);
  }, [denemeSonuclari]);

  if (denemeSonuclari.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl">📝</span>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Deneme Bulunamadı</h2>
          <p className="text-gray-500 mt-2">Bu deneme sınavına ait sonuç bulunmuyor.</p>
          <Link
            href="/ogrenci"
            className="inline-block mt-6 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const tarih = denemeSonuclari[0]?.tarih;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/ogrenci"
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{deneemAdi}</h1>
              <p className="text-sm text-gray-500">
                <ClientOnlyDate dateString={tarih} /> • {mockOgrenci.sinif}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Özet Kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
            <p className="text-blue-600 text-xs font-bold uppercase tracking-wide">Genel Ortalama</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">%{genelOrtalama.toFixed(0)}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border border-green-200">
            <p className="text-green-600 text-xs font-bold uppercase tracking-wide">Toplam Doğru</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{toplamlar.dogru}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-5 border border-red-200">
            <p className="text-red-600 text-xs font-bold uppercase tracking-wide">Toplam Yanlış</p>
            <p className="text-3xl font-bold text-red-900 mt-2">{toplamlar.yanlis}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200">
            <p className="text-gray-600 text-xs font-bold uppercase tracking-wide">Toplam Boş</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{toplamlar.bos}</p>
          </div>
        </div>

        {/* En İyi ve En Kötü Performans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {enYuksek && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🏆</span>
                <div>
                  <p className="text-green-100 text-sm font-medium">En Yüksek Performans</p>
                  <p className="text-2xl font-bold">{enYuksek.ders}</p>
                  <p className="text-green-100 mt-1">%{enYuksek.yuzde} başarı • {enYuksek.dogru} doğru</p>
                </div>
              </div>
            </div>
          )}
          {enDusuk && (
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3">
                <span className="text-4xl">📈</span>
                <div>
                  <p className="text-orange-100 text-sm font-medium">Geliştirilmesi Gereken</p>
                  <p className="text-2xl font-bold">{enDusuk.ders}</p>
                  <p className="text-orange-100 mt-1">%{enDusuk.yuzde} başarı • {enDusuk.yanlis} yanlış</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ders Bazlı Sonuçlar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>📊</span> Ders Bazlı Sonuçlar
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {denemeSonuclari.map((sonuc) => (
              <div key={sonuc.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Ders Bilgisi */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{sonuc.ders}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-green-600">
                        <span className="font-bold">{sonuc.dogru}</span> Doğru
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <span className="font-bold">{sonuc.yanlis}</span> Yanlış
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <span className="font-bold">{sonuc.bos}</span> Boş
                      </span>
                    </div>
                  </div>

                  {/* Puan ve Yüzde */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{sonuc.puan}</p>
                      <p className="text-xs text-gray-500">/ {sonuc.toplamPuan} puan</p>
                    </div>
                    
                    <div className="text-center min-w-[80px]">
                      <div className="relative w-16 h-16 mx-auto">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="#e5e7eb"
                            strokeWidth="6"
                            fill="none"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke={sonuc.yuzde >= 80 ? '#22c55e' : sonuc.yuzde >= 60 ? '#eab308' : '#ef4444'}
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${(sonuc.yuzde / 100) * 176} 176`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-sm font-bold ${
                            sonuc.yuzde >= 80 ? 'text-green-600' : sonuc.yuzde >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            %{sonuc.yuzde}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        sonuc.yuzde >= 80 ? 'bg-green-500' : sonuc.yuzde >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${sonuc.yuzde}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Net Analizi */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>📈</span> Net Analizi
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {denemeSonuclari.map((sonuc) => {
              const net = sonuc.dogru - (sonuc.yanlis / 4);
              const toplamSoru = sonuc.dogru + sonuc.yanlis + sonuc.bos;
              
              return (
                <div key={sonuc.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{sonuc.ders}</h3>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      sonuc.yuzde >= 80 ? 'bg-green-100 text-green-700' : 
                      sonuc.yuzde >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      %{sonuc.yuzde}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Toplam Soru</span>
                      <span className="font-medium text-gray-900">{toplamSoru}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Net</span>
                      <span className="font-bold text-blue-600">{net.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Başarı Oranı</span>
                      <span className="font-medium text-gray-900">{((sonuc.dogru / toplamSoru) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
