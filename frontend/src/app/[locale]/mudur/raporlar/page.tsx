'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileSpreadsheet,
  File,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleGuard } from '@/components/RoleGuard';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface DashboardData {
  ozet: {
    ogrenciSayisi: number;
    ogretmenSayisi: number;
    sinifSayisi: number;
    dersSayisi: number;
  };
  yoklama: {
    ozet: {
      katildi: number;
      katilmadi: number;
      gec: number;
    };
    trend: Array<{ gun: string; katilim: number }>;
  };
  odev: {
    toplam: number;
    teslimEdilen: number;
  };
  sinav: {
    aktif: number;
    tamamlanan: number;
  };
  sonKayitlar: Array<{
    id: string;
    ad: string;
    soyad: string;
    createdAt: string;
    sinif?: { ad: string };
  }>;
  aylikGelir: number;
}

function RaporlarContent() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'genel' | 'yoklama' | 'akademik'>('genel');

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/mudur`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Dashboard verileri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Rapor verileri yüklenemedi.</p>
        </div>
      </div>
    );
  }

  const yoklamaOran = data.yoklama.ozet.katildi + data.yoklama.ozet.katilmadi + data.yoklama.ozet.gec > 0
    ? Math.round((data.yoklama.ozet.katildi / (data.yoklama.ozet.katildi + data.yoklama.ozet.katilmadi + data.yoklama.ozet.gec)) * 100)
    : 0;

  const odevTeslimOrani = data.odev.toplam > 0
    ? Math.round((data.odev.teslimEdilen / data.odev.toplam) * 100)
    : 0;

  // Excel export - Türkçe karakter destekli
  const exportToExcel = () => {
    if (!data) return;
    
    // Genel özet verileri
    const ozetData = [
      { 'İstatistik': 'Öğrenci Sayısı', 'Değer': data.ozet.ogrenciSayisi },
      { 'İstatistik': 'Öğretmen Sayısı', 'Değer': data.ozet.ogretmenSayisi },
      { 'İstatistik': 'Sınıf Sayısı', 'Değer': data.ozet.sinifSayisi },
      { 'İstatistik': 'Ders Sayısı', 'Değer': data.ozet.dersSayisi },
      { 'İstatistik': 'Aylık Gelir (TL)', 'Değer': data.aylikGelir },
      { 'İstatistik': 'Yoklama Oranı (%)', 'Değer': yoklamaOran },
      { 'İstatistik': 'Ödev Teslim Oranı (%)', 'Değer': odevTeslimOrani },
    ];

    // Yoklama verileri
    const yoklamaData = [
      { 'Durum': 'Katıldı', 'Sayı': data.yoklama.ozet.katildi },
      { 'Durum': 'Katılmadı', 'Sayı': data.yoklama.ozet.katilmadi },
      { 'Durum': 'Geç Kaldı', 'Sayı': data.yoklama.ozet.gec },
    ];

    // Yoklama trendi
    const trendData = data.yoklama.trend.map(t => ({
      'Gün': t.gun,
      'Katılım': t.katilim
    }));

    // Ödev ve Sınav verileri
    const odevSinavData = [
      { 'Kategori': 'Toplam Ödev', 'Değer': data.odev.toplam },
      { 'Kategori': 'Teslim Edilen Ödev', 'Değer': data.odev.teslimEdilen },
      { 'Kategori': 'Aktif Sınav', 'Değer': data.sinav.aktif },
      { 'Kategori': 'Tamamlanan Sınav', 'Değer': data.sinav.tamamlanan },
    ];

    // Son kayıtlar
    const kayitData = data.sonKayitlar.map(k => ({
      'Ad': k.ad,
      'Soyad': k.soyad,
      'Sınıf': k.sinif?.ad || 'Atanmadı',
      'Kayıt Tarihi': new Date(k.createdAt).toLocaleDateString('tr-TR')
    }));

    // Workbook oluştur
    const wb = XLSX.utils.book_new();
    
    // Sayfa 1: Genel Özet
    const wsOzet = XLSX.utils.json_to_sheet(ozetData);
    wsOzet['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsOzet, 'Genel Özet');

    // Sayfa 2: Yoklama
    const wsYoklama = XLSX.utils.json_to_sheet(yoklamaData);
    wsYoklama['!cols'] = [{ wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsYoklama, 'Yoklama Dağılımı');

    // Sayfa 3: Haftalık Trend
    const wsTrend = XLSX.utils.json_to_sheet(trendData);
    wsTrend['!cols'] = [{ wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsTrend, 'Haftalık Trend');

    // Sayfa 4: Ödev & Sınav
    const wsOdevSinav = XLSX.utils.json_to_sheet(odevSinavData);
    wsOdevSinav['!cols'] = [{ wch: 20 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsOdevSinav, 'Ödev ve Sınav');

    // Sayfa 5: Son Kayıtlar
    if (kayitData.length > 0) {
      const wsKayit = XLSX.utils.json_to_sheet(kayitData);
      wsKayit['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsKayit, 'Son Kayıtlar');
    }

    // Dosyayı indir
    const tarih = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Mudur_Raporu_${tarih}.xlsx`);
  };

  // PDF export
  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    // Başlık
    doc.setFontSize(18);
    doc.setTextColor(147, 51, 234); // Purple renk
    doc.text('Mudur Raporu', 14, 15);
    
    // Tarih
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const tarih = new Date().toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Rapor Tarihi: ${tarih}`, 14, 22);

    // Genel İstatistikler Tablosu
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Genel Istatistikler', 14, 32);

    autoTable(doc, {
      startY: 35,
      head: [['Istatistik', 'Deger']],
      body: [
        ['Ogrenci Sayisi', data.ozet.ogrenciSayisi.toString()],
        ['Ogretmen Sayisi', data.ozet.ogretmenSayisi.toString()],
        ['Sinif Sayisi', data.ozet.sinifSayisi.toString()],
        ['Ders Sayisi', data.ozet.dersSayisi.toString()],
        ['Yoklama Orani', `%${yoklamaOran}`],
        ['Odev Teslim Orani', `%${odevTeslimOrani}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [147, 51, 234], textColor: 255 },
      margin: { left: 14 },
      tableWidth: 80,
    });

    // Yoklama Dağılımı
    doc.text('Yoklama Dagilimi', 110, 32);

    autoTable(doc, {
      startY: 35,
      head: [['Durum', 'Sayi']],
      body: [
        ['Katildi', data.yoklama.ozet.katildi.toString()],
        ['Katilmadi', data.yoklama.ozet.katilmadi.toString()],
        ['Gec Kaldi', data.yoklama.ozet.gec.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      margin: { left: 110 },
      tableWidth: 70,
    });

    // Ödev & Sınav
    const afterFirstTable = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Odev & Sinav Istatistikleri', 14, afterFirstTable);

    autoTable(doc, {
      startY: afterFirstTable + 5,
      head: [['Kategori', 'Deger']],
      body: [
        ['Toplam Odev', data.odev.toplam.toString()],
        ['Teslim Edilen', data.odev.teslimEdilen.toString()],
        ['Aktif Sinav', data.sinav.aktif.toString()],
        ['Tamamlanan Sinav', data.sinav.tamamlanan.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      margin: { left: 14 },
      tableWidth: 80,
    });

    // Haftalık Trend
    doc.text('Haftalik Yoklama Trendi', 110, afterFirstTable);

    const trendRows = data.yoklama.trend.map(t => [t.gun, t.katilim.toString()]);

    autoTable(doc, {
      startY: afterFirstTable + 5,
      head: [['Gun', 'Katilim']],
      body: trendRows,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      margin: { left: 110 },
      tableWidth: 70,
    });

    // Son Kayıtlar
    if (data.sonKayitlar.length > 0) {
      const afterSecondTable = (doc as any).lastAutoTable.finalY + 15;
      doc.text('Son Ogrenci Kayitlari', 14, afterSecondTable);

      const kayitRows = data.sonKayitlar.map(k => [
        `${k.ad} ${k.soyad}`.replace(/[ığüşöçİĞÜŞÖÇ]/g, (char) => {
          const map: Record<string, string> = {
            'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c',
            'İ': 'I', 'Ğ': 'G', 'Ü': 'U', 'Ş': 'S', 'Ö': 'O', 'Ç': 'C'
          };
          return map[char] || char;
        }),
        k.sinif?.ad || 'Atanmadi',
        new Date(k.createdAt).toLocaleDateString('tr-TR')
      ]);

      autoTable(doc, {
        startY: afterSecondTable + 5,
        head: [['Ad Soyad', 'Sinif', 'Kayit Tarihi']],
        body: kayitRows,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        margin: { left: 14 },
      });
    }

    // Dosyayı indir
    const dosyaTarih = new Date().toISOString().split('T')[0];
    doc.save(`Mudur_Raporu_${dosyaTarih}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link href="/mudur" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Raporlar</h1>
                <p className="text-xs text-slate-500">Detaylı istatistikler ve analizler</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                title="Excel formatında indir"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button 
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                title="PDF formatında indir"
              >
                <File className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'genel', label: 'Genel Bakış', icon: BarChart3 },
            { id: 'yoklama', label: 'Yoklama', icon: Calendar },
            { id: 'akademik', label: 'Akademik', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'genel' && (
          <div className="space-y-6">
            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase">Öğrenci</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{data.ozet.ogrenciSayisi}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase">Öğretmen</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{data.ozet.ogretmenSayisi}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase">Sınıf</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{data.ozet.sinifSayisi}</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-medium uppercase">Ders</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{data.ozet.dersSayisi}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Performans Özeti */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Haftalık Yoklama Oranı
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-bold text-green-600">%{yoklamaOran}</span>
                  <div className="text-right text-sm text-slate-500">
                    <p>{data.yoklama.ozet.katildi} katılım</p>
                    <p>{data.yoklama.ozet.katilmadi} devamsız</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${yoklamaOran}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  Ödev Teslim Oranı
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-bold text-blue-600">%{odevTeslimOrani}</span>
                  <div className="text-right text-sm text-slate-500">
                    <p>{data.odev.teslimEdilen} teslim</p>
                    <p>{data.odev.toplam} toplam</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${odevTeslimOrani}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Son Kayıtlar */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Son Kayıt Olan Öğrenciler</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {data.sonKayitlar.length > 0 ? (
                  data.sonKayitlar.map((kayit) => (
                    <div key={kayit.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 font-medium text-sm">
                          {kayit.ad?.charAt(0)}{kayit.soyad?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{kayit.ad} {kayit.soyad}</p>
                          {kayit.sinif && (
                            <p className="text-xs text-slate-500">{kayit.sinif.ad}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(kayit.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">Henüz kayıt yok</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'yoklama' && (
          <div className="space-y-6">
            {/* Yoklama İstatistikleri */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Katıldı</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{data.yoklama.ozet.katildi}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Katılmadı</span>
                </div>
                <p className="text-3xl font-bold text-red-600">{data.yoklama.ozet.katilmadi}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Geç Kaldı</span>
                </div>
                <p className="text-3xl font-bold text-amber-600">{data.yoklama.ozet.gec}</p>
              </div>
            </div>

            {/* Haftalık Trend */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Son 7 Günlük Yoklama Trendi</h3>
              <div className="flex items-end justify-between gap-2 h-40">
                {data.yoklama.trend.map((item, i) => {
                  const maxKatilim = Math.max(...data.yoklama.trend.map(t => t.katilim), 1);
                  const height = (item.katilim / maxKatilim) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-32">
                        <span className="text-xs font-medium text-slate-600 mb-1">{item.katilim}</span>
                        <div 
                          className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{item.gun}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'akademik' && (
          <div className="space-y-6">
            {/* Akademik Özet */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Toplam Ödev</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{data.odev.toplam}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Teslim Edilen</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{data.odev.teslimEdilen}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Aktif Sınav</span>
                </div>
                <p className="text-3xl font-bold text-amber-600">{data.sinav.aktif}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Tamamlanan</span>
                </div>
                <p className="text-3xl font-bold text-purple-600">{data.sinav.tamamlanan}</p>
              </div>
            </div>

            {/* Performans Kartları */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white">
                <h3 className="font-semibold text-lg mb-2">Ödev Performansı</h3>
                <p className="text-blue-100 text-sm mb-4">Son dönem ödev tamamlama oranı</p>
                <div className="flex items-end gap-4">
                  <span className="text-5xl font-bold">%{odevTeslimOrani}</span>
                  {odevTeslimOrani >= 70 ? (
                    <TrendingUp className="w-8 h-8 text-green-300" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-300" />
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
                <h3 className="font-semibold text-lg mb-2">Sınav Aktivitesi</h3>
                <p className="text-purple-100 text-sm mb-4">Toplam online sınav durumu</p>
                <div className="flex items-end gap-4">
                  <span className="text-5xl font-bold">{data.sinav.aktif + data.sinav.tamamlanan}</span>
                  <span className="text-lg text-purple-200 mb-1">sınav</span>
                </div>
              </div>
            </div>

            {/* Bilgi Notu */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm">
                <strong>İpucu:</strong> Daha detaylı akademik raporlar için öğretmenlerden sınıf bazlı performans 
                raporları talep edebilirsiniz. Deneme sınavı sonuçları ve öğrenci bazlı analizler için 
                &quot;Deneme Sınavları&quot; modülünü kullanabilirsiniz.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function RaporlarPage() {
  return (
    <RoleGuard allowedRoles={['mudur']}>
      <RaporlarContent />
    </RoleGuard>
  );
}

