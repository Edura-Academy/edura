'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Download,
  Calendar,
  Target,
  Award,
  AlertTriangle,
  ChevronRight,
  Eye,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  File
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RaporData {
  genel: {
    toplamOgrenci: number;
    toplamDers: number;
    toplamOdev: number;
    toplamSinav: number;
  };
  yoklama: {
    ortalamaKatilim: number;
    toplamYoklama: number;
    devamsizlar: number;
  };
  odevler: {
    verilen: number;
    teslimEdilen: number;
    bekleyen: number;
    ortalamaPuan: number;
  };
  sinavlar: {
    yapilan: number;
    ortalamaPuan: number;
    enYuksek: number;
    enDusuk: number;
  };
  dersler: Array<{
    id: string;
    ad: string;
    sinif: string;
    ogrenciSayisi: number;
    katilimOrani: number;
    odevTeslimOrani: number;
    sinavOrtalama: number;
  }>;
  ogrenciler?: Array<{
    id: string;
    ad: string;
    soyad: string;
    ogrenciNo: string;
    sinif: string;
    devamsizlik: number;
    odevPuani: number;
    sinavPuani: number;
    genelOrtalama: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  sinavDetay?: Array<{
    id: string;
    baslik: string;
    tarih: string;
    katilimci: number;
    ortalama: number;
    enYuksek: number;
    basariOrani: number;
  }>;
}

function OgretmenRaporlarContent() {
  const [raporData, setRaporData] = useState<RaporData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [activeTab, setActiveTab] = useState<'genel' | 'ogrenciler' | 'sinavlar' | 'odevler'>('genel');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'ad' | 'puan' | 'devamsizlik'>('ad');
  const [selectedSinif, setSelectedSinif] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchRaporlar();
  }, [dateRange]);

  const fetchRaporlar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/dashboard/ogretmen/rapor?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRaporData(data.data);
      } else {
        // Mock data with more details
        setRaporData({
          genel: { toplamOgrenci: 120, toplamDers: 8, toplamOdev: 24, toplamSinav: 6 },
          yoklama: { ortalamaKatilim: 85, toplamYoklama: 180, devamsizlar: 15 },
          odevler: { verilen: 24, teslimEdilen: 280, bekleyen: 45, ortalamaPuan: 75 },
          sinavlar: { yapilan: 6, ortalamaPuan: 68, enYuksek: 95, enDusuk: 32 },
          dersler: [
            { id: '1', ad: 'Matematik', sinif: '10-A', ogrenciSayisi: 30, katilimOrani: 92, odevTeslimOrani: 88, sinavOrtalama: 72 },
            { id: '2', ad: 'Matematik', sinif: '10-B', ogrenciSayisi: 28, katilimOrani: 87, odevTeslimOrani: 82, sinavOrtalama: 68 },
            { id: '3', ad: 'Matematik', sinif: '11-A', ogrenciSayisi: 32, katilimOrani: 90, odevTeslimOrani: 85, sinavOrtalama: 74 },
            { id: '4', ad: 'Matematik', sinif: '11-B', ogrenciSayisi: 30, katilimOrani: 85, odevTeslimOrani: 78, sinavOrtalama: 65 },
          ],
          ogrenciler: [
            { id: '1', ad: 'Ahmet', soyad: 'Yılmaz', ogrenciNo: '1001', sinif: '10-A', devamsizlik: 2, odevPuani: 85, sinavPuani: 78, genelOrtalama: 82, trend: 'up' },
            { id: '2', ad: 'Ayşe', soyad: 'Kaya', ogrenciNo: '1002', sinif: '10-A', devamsizlik: 0, odevPuani: 95, sinavPuani: 92, genelOrtalama: 94, trend: 'up' },
            { id: '3', ad: 'Mehmet', soyad: 'Demir', ogrenciNo: '1003', sinif: '10-B', devamsizlik: 5, odevPuani: 60, sinavPuani: 55, genelOrtalama: 58, trend: 'down' },
            { id: '4', ad: 'Zeynep', soyad: 'Çelik', ogrenciNo: '1004', sinif: '11-A', devamsizlik: 1, odevPuani: 88, sinavPuani: 85, genelOrtalama: 87, trend: 'stable' },
            { id: '5', ad: 'Ali', soyad: 'Öz', ogrenciNo: '1005', sinif: '11-B', devamsizlik: 3, odevPuani: 72, sinavPuani: 68, genelOrtalama: 70, trend: 'down' },
          ],
          sinavDetay: [
            { id: '1', baslik: '1. Dönem Ara Sınav', tarih: '2025-10-15', katilimci: 118, ortalama: 72, enYuksek: 98, basariOrani: 78 },
            { id: '2', baslik: '2. Yazılı', tarih: '2025-11-20', katilimci: 115, ortalama: 68, enYuksek: 95, basariOrani: 72 },
            { id: '3', baslik: 'Deneme Sınavı 1', tarih: '2025-12-01', katilimci: 120, ortalama: 65, enYuksek: 92, basariOrani: 65 },
          ]
        });
      }
    } catch (error) {
      console.error('Raporlar alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş öğrenciler
  const filteredOgrenciler = useMemo(() => {
    if (!raporData?.ogrenciler) return [];
    
    let filtered = raporData.ogrenciler.filter(o => {
      const matchSearch = searchQuery === '' || 
        `${o.ad} ${o.soyad}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.ogrenciNo.includes(searchQuery);
      const matchSinif = selectedSinif === '' || o.sinif === selectedSinif;
      return matchSearch && matchSinif;
    });
    
    // Sıralama
    filtered.sort((a, b) => {
      if (sortBy === 'ad') return `${a.ad} ${a.soyad}`.localeCompare(`${b.ad} ${b.soyad}`);
      if (sortBy === 'puan') return b.genelOrtalama - a.genelOrtalama;
      if (sortBy === 'devamsizlik') return b.devamsizlik - a.devamsizlik;
      return 0;
    });
    
    return filtered;
  }, [raporData?.ogrenciler, searchQuery, selectedSinif, sortBy]);

  // Sınıf listesi
  const siniflar = useMemo(() => {
    if (!raporData?.ogrenciler) return [];
    return [...new Set(raporData.ogrenciler.map(o => o.sinif))];
  }, [raporData?.ogrenciler]);

  // Excel export - Türkçe karakter destekli
  const exportToExcel = () => {
    if (!raporData) return;
    
    // Öğrenci verileri
    const ogrenciData = filteredOgrenciler.map(o => ({
      'Öğrenci No': o.ogrenciNo,
      'Ad': o.ad,
      'Soyad': o.soyad,
      'Sınıf': o.sinif,
      'Devamsızlık (Gün)': o.devamsizlik,
      'Ödev Puanı': o.odevPuani,
      'Sınav Puanı': o.sinavPuani,
      'Genel Ortalama': o.genelOrtalama,
      'Durum': o.trend === 'up' ? 'Yükseliyor' : o.trend === 'down' ? 'Düşüyor' : 'Sabit'
    }));

    // Ders verileri
    const dersData = raporData.dersler.map(d => ({
      'Ders Adı': d.ad,
      'Sınıf': d.sinif,
      'Öğrenci Sayısı': d.ogrenciSayisi,
      'Katılım Oranı (%)': d.katilimOrani,
      'Ödev Teslim Oranı (%)': d.odevTeslimOrani,
      'Sınav Ortalaması': d.sinavOrtalama
    }));

    // Genel istatistikler
    const genelData = [
      { 'İstatistik': 'Toplam Öğrenci', 'Değer': raporData.genel.toplamOgrenci },
      { 'İstatistik': 'Toplam Ders', 'Değer': raporData.genel.toplamDers },
      { 'İstatistik': 'Toplam Ödev', 'Değer': raporData.genel.toplamOdev },
      { 'İstatistik': 'Toplam Sınav', 'Değer': raporData.genel.toplamSinav },
      { 'İstatistik': 'Ortalama Katılım (%)', 'Değer': raporData.yoklama.ortalamaKatilim },
      { 'İstatistik': 'Ödev Ortalama Puanı', 'Değer': raporData.odevler.ortalamaPuan },
      { 'İstatistik': 'Sınav Ortalama Puanı', 'Değer': raporData.sinavlar.ortalamaPuan },
    ];

    // Workbook oluştur
    const wb = XLSX.utils.book_new();
    
    // Sayfa 1: Genel İstatistikler
    const wsGenel = XLSX.utils.json_to_sheet(genelData);
    wsGenel['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsGenel, 'Genel İstatistikler');

    // Sayfa 2: Öğrenci Listesi
    const wsOgrenci = XLSX.utils.json_to_sheet(ogrenciData);
    wsOgrenci['!cols'] = [
      { wch: 12 }, // Öğrenci No
      { wch: 15 }, // Ad
      { wch: 15 }, // Soyad
      { wch: 8 },  // Sınıf
      { wch: 15 }, // Devamsızlık
      { wch: 12 }, // Ödev Puanı
      { wch: 12 }, // Sınav Puanı
      { wch: 15 }, // Genel Ortalama
      { wch: 12 }, // Durum
    ];
    XLSX.utils.book_append_sheet(wb, wsOgrenci, 'Öğrenci Listesi');

    // Sayfa 3: Ders Performansı
    const wsDers = XLSX.utils.json_to_sheet(dersData);
    wsDers['!cols'] = [
      { wch: 15 }, // Ders Adı
      { wch: 8 },  // Sınıf
      { wch: 15 }, // Öğrenci Sayısı
      { wch: 18 }, // Katılım Oranı
      { wch: 20 }, // Ödev Teslim Oranı
      { wch: 18 }, // Sınav Ortalaması
    ];
    XLSX.utils.book_append_sheet(wb, wsDers, 'Ders Performansı');

    // Dosyayı indir
    const tarih = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Ogretmen_Raporu_${tarih}.xlsx`);
  };

  // PDF export
  const exportToPDF = () => {
    if (!raporData) return;

    // jsPDF oluştur (A4 boyutu)
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Türkçe karakter desteği için font ayarı
    doc.setFont('helvetica');
    
    // Başlık
    doc.setFontSize(18);
    doc.setTextColor(13, 148, 136); // Teal renk
    doc.text('Öğretmen Performans Raporu', 14, 15);
    
    // Tarih
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const tarih = new Date().toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Rapor Tarihi: ${tarih}`, 14, 22);

    // Genel İstatistikler
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Genel Istatistikler', 14, 32);

    const genelStats = [
      ['Toplam Ogrenci', raporData.genel.toplamOgrenci.toString()],
      ['Toplam Ders', raporData.genel.toplamDers.toString()],
      ['Toplam Odev', raporData.genel.toplamOdev.toString()],
      ['Toplam Sinav', raporData.genel.toplamSinav.toString()],
      ['Ortalama Katilim', `%${raporData.yoklama.ortalamaKatilim}`],
      ['Sinav Ortalamasi', raporData.sinavlar.ortalamaPuan.toString()],
    ];

    autoTable(doc, {
      startY: 35,
      head: [['Istatistik', 'Deger']],
      body: genelStats,
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      margin: { left: 14 },
      tableWidth: 80,
    });

    // Öğrenci Tablosu
    const ogrenciRows = filteredOgrenciler.map(o => [
      o.ogrenciNo,
      `${o.ad} ${o.soyad}`.replace(/[ığüşöçİĞÜŞÖÇ]/g, (char) => {
        const map: Record<string, string> = {
          'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c',
          'İ': 'I', 'Ğ': 'G', 'Ü': 'U', 'Ş': 'S', 'Ö': 'O', 'Ç': 'C'
        };
        return map[char] || char;
      }),
      o.sinif,
      o.devamsizlik.toString(),
      o.odevPuani.toString(),
      o.sinavPuani.toString(),
      o.genelOrtalama.toString(),
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Ogrenci No', 'Ad Soyad', 'Sinif', 'Devamsizlik', 'Odev', 'Sinav', 'Ortalama']],
      body: ogrenciRows,
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 14 },
    });

    // Yeni sayfa - Ders Performansı
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(13, 148, 136);
    doc.text('Sinif Bazli Performans', 14, 15);

    const dersRows = raporData.dersler.map(d => [
      d.ad.replace(/[ığüşöçİĞÜŞÖÇ]/g, (char) => {
        const map: Record<string, string> = {
          'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c',
          'İ': 'I', 'Ğ': 'G', 'Ü': 'U', 'Ş': 'S', 'Ö': 'O', 'Ç': 'C'
        };
        return map[char] || char;
      }),
      d.sinif,
      d.ogrenciSayisi.toString(),
      `%${d.katilimOrani}`,
      `%${d.odevTeslimOrani}`,
      d.sinavOrtalama.toString(),
    ]);

    autoTable(doc, {
      startY: 20,
      head: [['Ders', 'Sinif', 'Ogrenci', 'Katilim', 'Odev Teslim', 'Sinav Ort.']],
      body: dersRows,
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      margin: { left: 14 },
    });

    // Dosyayı indir
    const dosyaTarih = new Date().toISOString().split('T')[0];
    doc.save(`Ogretmen_Raporu_${dosyaTarih}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Raporlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/ogretmen" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">📊 Raporlar & Analizler</h1>
                <p className="text-teal-100 text-sm">Öğrenci performansı ve istatistikler</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-white border-0 focus:ring-2 focus:ring-white/50"
              >
                <option value="week" className="text-slate-800">Bu Hafta</option>
                <option value="month" className="text-slate-800">Bu Ay</option>
                <option value="semester" className="text-slate-800">Bu Dönem</option>
                <option value="year" className="text-slate-800">Bu Yıl</option>
              </select>
              <div className="flex items-center gap-2">
                <button 
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                  title="Excel formatında indir"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
                <button 
                  onClick={exportToPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                  title="PDF formatında indir"
                >
                  <File className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-6">
            {[
              { id: 'genel', label: 'Genel Bakış', icon: BarChart3 },
              { id: 'ogrenciler', label: 'Öğrenci Detay', icon: Users },
              { id: 'sinavlar', label: 'Sınav Analizi', icon: FileText },
              { id: 'odevler', label: 'Ödev Takibi', icon: Target }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-teal-600 shadow-lg' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {raporData && (
          <>
            {/* Genel Bakış Tab */}
            {activeTab === 'genel' && (
              <>
                {/* Ana İstatistik Kartları */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm">Toplam Öğrenci</p>
                        <p className="text-3xl font-bold text-slate-800 mt-1">{raporData.genel.toplamOgrenci}</p>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> +5 bu ay
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm">Aktif Ders</p>
                        <p className="text-3xl font-bold text-slate-800 mt-1">{raporData.genel.toplamDers}</p>
                        <p className="text-xs text-slate-500 mt-1">Farklı sınıflarda</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <BookOpen className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm">Verilen Ödev</p>
                        <p className="text-3xl font-bold text-slate-800 mt-1">{raporData.genel.toplamOdev}</p>
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {raporData.odevler.bekleyen} beklemede
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm">Yapılan Sınav</p>
                        <p className="text-3xl font-bold text-slate-800 mt-1">{raporData.genel.toplamSinav}</p>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <Award className="w-3 h-3" /> Ort: {raporData.sinavlar.ortalamaPuan}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                        <BarChart3 className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detaylı Raporlar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Yoklama Raporu */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      Yoklama Durumu
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-600 text-sm">Ortalama Katılım</span>
                          <span className="font-bold text-green-600">%{raporData.yoklama.ortalamaKatilim}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all"
                            style={{ width: `${raporData.yoklama.ortalamaKatilim}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="text-center p-4 bg-slate-50 rounded-xl">
                          <p className="text-2xl font-bold text-slate-800">{raporData.yoklama.toplamYoklama}</p>
                          <p className="text-xs text-slate-500">Toplam Ders</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-xl">
                          <p className="text-2xl font-bold text-red-600">{raporData.yoklama.devamsizlar}</p>
                          <p className="text-xs text-slate-500">Devamsız</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ödev Raporu */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-amber-600" />
                      </div>
                      Ödev Performansı
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-4 bg-green-50 rounded-xl">
                          <p className="text-2xl font-bold text-green-600">{raporData.odevler.teslimEdilen}</p>
                          <p className="text-xs text-slate-500">Teslim Edilen</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-xl">
                          <p className="text-2xl font-bold text-yellow-600">{raporData.odevler.bekleyen}</p>
                          <p className="text-xs text-slate-500">Bekleyen</p>
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 text-sm">Ortalama Puan</span>
                          <span className="text-2xl font-bold text-blue-600">{raporData.odevler.ortalamaPuan}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sınav Raporu */}
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                      </div>
                      Sınav Sonuçları
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-600 text-sm">Ortalama</span>
                        <span className="text-xl font-bold text-purple-600">{raporData.sinavlar.ortalamaPuan}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                        <span className="text-slate-600 text-sm">En Yüksek</span>
                        <span className="text-xl font-bold text-green-600">{raporData.sinavlar.enYuksek}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                        <span className="text-slate-600 text-sm">En Düşük</span>
                        <span className="text-xl font-bold text-red-500">{raporData.sinavlar.enDusuk}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ders Bazlı Performans Tablosu */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      Sınıf Bazlı Karşılaştırma
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left p-4 text-sm font-semibold text-slate-600">Ders / Sınıf</th>
                          <th className="text-center p-4 text-sm font-semibold text-slate-600">Öğrenci</th>
                          <th className="text-center p-4 text-sm font-semibold text-slate-600">Katılım</th>
                          <th className="text-center p-4 text-sm font-semibold text-slate-600">Ödev Teslim</th>
                          <th className="text-center p-4 text-sm font-semibold text-slate-600">Sınav Ort.</th>
                          <th className="text-center p-4 text-sm font-semibold text-slate-600">Detay</th>
                        </tr>
                      </thead>
                      <tbody>
                        {raporData.dersler.map((ders) => (
                          <tr key={ders.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                  <BookOpen className="w-5 h-5 text-teal-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">{ders.ad}</p>
                                  <p className="text-xs text-slate-500">{ders.sinif}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-slate-700 font-medium">{ders.ogrenciSayisi}</span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="inline-flex items-center gap-2">
                                <div className="w-16 bg-slate-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      ders.katilimOrani >= 90 ? 'bg-green-500' :
                                      ders.katilimOrani >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${ders.katilimOrani}%` }}
                                  />
                                </div>
                                <span className={`font-medium ${
                                  ders.katilimOrani >= 90 ? 'text-green-600' :
                                  ders.katilimOrani >= 75 ? 'text-yellow-600' : 'text-red-600'
                                }`}>%{ders.katilimOrani}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                ders.odevTeslimOrani >= 90 ? 'bg-green-100 text-green-700' :
                                ders.odevTeslimOrani >= 75 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                %{ders.odevTeslimOrani}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`text-lg font-bold ${
                                ders.sinavOrtalama >= 70 ? 'text-green-600' :
                                ders.sinavOrtalama >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>{ders.sinavOrtalama}</span>
                            </td>
                            <td className="p-4 text-center">
                              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Öğrenci Detay Tab */}
            {activeTab === 'ogrenciler' && (
              <div className="space-y-4">
                {/* Filtreler */}
                <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Öğrenci ara..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                    <select
                      value={selectedSinif}
                      onChange={(e) => setSelectedSinif(e.target.value)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Tüm Sınıflar</option>
                      {siniflar.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="ad">Ada Göre</option>
                      <option value="puan">Puana Göre</option>
                      <option value="devamsizlik">Devamsızlığa Göre</option>
                    </select>
                  </div>
                </div>

                {/* Öğrenci Listesi */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left p-4 text-sm font-semibold text-slate-600">Öğrenci</th>
                          <th className="text-center p-4 text-sm font-semibold text-slate-600">Sınıf</th>
                          <th className="text-center p-4 text-sm font-semibold text-slate-600">Devamsızlık</th>
                          <th className="text-center p-4 text-sm font-semibold text-slate-600">Ödev</th>
                          <th className="text-center p-4 text-sm font-semibold text-slate-600">Sınav</th>
                          <th className="text-center p-4 text-sm font-semibold text-slate-600">Ortalama</th>
                          <th className="text-center p-4 text-sm font-semibold text-slate-600">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOgrenciler.map((ogrenci) => (
                          <tr key={ogrenci.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {ogrenci.ad[0]}{ogrenci.soyad[0]}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">{ogrenci.ad} {ogrenci.soyad}</p>
                                  <p className="text-xs text-slate-500">{ogrenci.ogrenciNo}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                                {ogrenci.sinif}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                ogrenci.devamsizlik === 0 ? 'bg-green-100 text-green-700' :
                                ogrenci.devamsizlik <= 3 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {ogrenci.devamsizlik} gün
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`font-bold ${
                                ogrenci.odevPuani >= 70 ? 'text-green-600' :
                                ogrenci.odevPuani >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>{ogrenci.odevPuani}</span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`font-bold ${
                                ogrenci.sinavPuani >= 70 ? 'text-green-600' :
                                ogrenci.sinavPuani >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>{ogrenci.sinavPuani}</span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`text-lg font-bold ${
                                ogrenci.genelOrtalama >= 70 ? 'text-green-600' :
                                ogrenci.genelOrtalama >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>{ogrenci.genelOrtalama}</span>
                            </td>
                            <td className="p-4 text-center">
                              {ogrenci.trend === 'up' && (
                                <div className="flex items-center justify-center gap-1 text-green-600">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="text-xs">Yükseliyor</span>
                                </div>
                              )}
                              {ogrenci.trend === 'down' && (
                                <div className="flex items-center justify-center gap-1 text-red-500">
                                  <TrendingDown className="w-4 h-4" />
                                  <span className="text-xs">Düşüyor</span>
                                </div>
                              )}
                              {ogrenci.trend === 'stable' && (
                                <div className="flex items-center justify-center gap-1 text-slate-500">
                                  <span className="text-xs">Sabit</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sınav Analizi Tab */}
            {activeTab === 'sinavlar' && (
              <div className="space-y-6">
                {/* Sınav İstatistikleri */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{raporData.sinavlar.yapilan}</p>
                        <p className="text-sm text-slate-500">Toplam Sınav</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{raporData.sinavlar.ortalamaPuan}</p>
                        <p className="text-sm text-slate-500">Genel Ortalama</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{raporData.sinavlar.enYuksek}</p>
                        <p className="text-sm text-slate-500">En Yüksek</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{raporData.sinavlar.enDusuk}</p>
                        <p className="text-sm text-slate-500">En Düşük</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sınav Detay Listesi */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Sınav Detayları
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {raporData.sinavDetay?.map((sinav) => (
                      <div key={sinav.id} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                              <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{sinav.baslik}</p>
                              <p className="text-sm text-slate-500 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(sinav.tarih).toLocaleDateString('tr-TR')}
                                <span className="mx-2">•</span>
                                <Users className="w-4 h-4" />
                                {sinav.katilimci} katılımcı
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-600">{sinav.ortalama}</p>
                              <p className="text-xs text-slate-500">Ortalama</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">{sinav.enYuksek}</p>
                              <p className="text-xs text-slate-500">En Yüksek</p>
                            </div>
                            <div className="text-center">
                              <p className={`text-lg font-bold px-3 py-1 rounded-full ${
                                sinav.basariOrani >= 70 ? 'bg-green-100 text-green-700' :
                                sinav.basariOrani >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>%{sinav.basariOrani}</p>
                              <p className="text-xs text-slate-500">Başarı</p>
                            </div>
                            <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                              <Eye className="w-5 h-5 text-slate-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Ödev Takibi Tab */}
            {activeTab === 'odevler' && (
              <div className="space-y-6">
                {/* Ödev İstatistikleri */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{raporData.odevler.verilen}</p>
                        <p className="text-sm text-slate-500">Verilen Ödev</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{raporData.odevler.teslimEdilen}</p>
                        <p className="text-sm text-slate-500">Teslim Edilen</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">{raporData.odevler.bekleyen}</p>
                        <p className="text-sm text-slate-500">Bekleyen</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{raporData.odevler.ortalamaPuan}</p>
                        <p className="text-sm text-slate-500">Ort. Puan</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Teslim Oranları */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-600" />
                    Sınıf Bazlı Teslim Oranları
                  </h3>
                  <div className="space-y-4">
                    {raporData.dersler.map((ders) => (
                      <div key={ders.id} className="flex items-center gap-4">
                        <span className="w-24 text-sm font-medium text-slate-700">{ders.sinif}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                          <div 
                            className={`h-4 transition-all ${
                              ders.odevTeslimOrani >= 90 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                              ders.odevTeslimOrani >= 75 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                              'bg-gradient-to-r from-red-400 to-red-500'
                            }`}
                            style={{ width: `${ders.odevTeslimOrani}%` }}
                          />
                        </div>
                        <span className={`w-16 text-right font-bold ${
                          ders.odevTeslimOrani >= 90 ? 'text-green-600' :
                          ders.odevTeslimOrani >= 75 ? 'text-yellow-600' : 'text-red-600'
                        }`}>%{ders.odevTeslimOrani}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function OgretmenRaporlarPage() {
  return (
    <RoleGuard allowedRoles={['ogretmen']}>
      <OgretmenRaporlarContent />
    </RoleGuard>
  );
}
