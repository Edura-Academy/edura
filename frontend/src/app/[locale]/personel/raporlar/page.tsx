'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  ArrowLeft, Users, GraduationCap, BookOpen, ClipboardList,
  TrendingUp, Calendar, DollarSign, FileText, Award, Download, FileSpreadsheet, File
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardData {
  ozet: {
    ogrenciSayisi: number;
    ogretmenSayisi: number;
    sinifSayisi: number;
    dersSayisi: number;
  };
  yoklama: {
    ozet: { katildi: number; katilmadi: number; gec: number };
    trend: { gun: string; katilim: number }[];
  };
  odev: { toplam: number; teslimEdilen: number };
  sinav: { aktif: number; tamamlanan: number };
  sonKayitlar: { id: string; ad: string; soyad: string; createdAt: string; sinif?: { ad: string } }[];
  aylikGelir: number;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export default function MudurRaporlar() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
    
    if (user.role === 'mudur' || user.role === 'admin') {
      fetchMudurData();
    } else if (user.role === 'ogretmen') {
      router.push('/personel/raporlar/ogretmen');
    }
  }, []);

  const fetchMudurData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/mudur`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Dashboard yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  };

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
      'Katılım (%)': t.katilim
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
    wsOzet['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsOzet, 'Genel Özet');

    // Sayfa 2: Yoklama
    const wsYoklama = XLSX.utils.json_to_sheet(yoklamaData);
    wsYoklama['!cols'] = [{ wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsYoklama, 'Yoklama');

    // Sayfa 3: Haftalık Trend
    const wsTrend = XLSX.utils.json_to_sheet(trendData);
    wsTrend['!cols'] = [{ wch: 15 }, { wch: 15 }];
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
    XLSX.writeFile(wb, `Kurs_Raporu_${tarih}.xlsx`);
  };

  // PDF export
  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    // Başlık
    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129); // Emerald renk
    doc.text('Kurs Genel Raporu', 14, 15);
    
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
        ['Aylik Gelir', formatCurrency(data.aylikGelir)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
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
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
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
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      margin: { left: 14 },
      tableWidth: 80,
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
    doc.save(`Kurs_Raporu_${dosyaTarih}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!data) return null;

  const yoklamaPieData = [
    { name: 'Katıldı', value: data.yoklama.ozet.katildi, color: '#10b981' },
    { name: 'Katılmadı', value: data.yoklama.ozet.katilmadi, color: '#ef4444' },
    { name: 'Geç', value: data.yoklama.ozet.gec, color: '#f59e0b' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/personel')} className="p-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Dashboard & Raporlar</h1>
                <p className="text-xs text-slate-400">Genel bakış ve istatistikler</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors text-sm"
                title="Excel formatında indir"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button 
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm"
                title="PDF formatında indir"
              >
                <File className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Özet Kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Öğrenci</p>
                <p className="text-3xl font-bold text-white mt-1">{data.ozet.ogrenciSayisi}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">Öğretmen</p>
                <p className="text-3xl font-bold text-white mt-1">{data.ozet.ogretmenSayisi}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 backdrop-blur-xl rounded-2xl border border-amber-500/20 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-300 text-sm">Sınıf</p>
                <p className="text-3xl font-bold text-white mt-1">{data.ozet.sinifSayisi}</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300 text-sm">Aylık Gelir</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(data.aylikGelir)}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Yoklama Trendi */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Haftalık Katılım Trendi
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.yoklama.trend}>
                  <defs>
                    <linearGradient id="colorKatilim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="gun" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="katilim" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorKatilim)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Yoklama Dağılımı */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Yoklama Dağılımı
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={yoklamaPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {yoklamaPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {yoklamaPieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-400">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Ödev & Sınav İstatistikleri */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-400" />
              Ödev & Sınav
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <FileText className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{data.odev.toplam}</p>
                <p className="text-xs text-slate-400">Toplam Ödev</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <Award className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-400">{data.odev.teslimEdilen}</p>
                <p className="text-xs text-slate-400">Teslim Edilen</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <ClipboardList className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-400">{data.sinav.aktif}</p>
                <p className="text-xs text-slate-400">Aktif Sınav</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-400">{data.sinav.tamamlanan}</p>
                <p className="text-xs text-slate-400">Tamamlanan</p>
              </div>
            </div>
          </div>

          {/* Son Kayıtlar */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Son Öğrenci Kayıtları
            </h3>
            <div className="space-y-3">
              {data.sonKayitlar.map((kayit) => (
                <div key={kayit.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                    {kayit.ad.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{kayit.ad} {kayit.soyad}</p>
                    <p className="text-xs text-slate-400">{kayit.sinif?.ad || 'Sınıf atanmadı'}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(kayit.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              ))}
              
              {data.sonKayitlar.length === 0 && (
                <p className="text-center text-slate-400 py-4">Henüz kayıt yok</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

