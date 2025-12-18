'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ClientOnlyDate from '../../../components/ClientOnlyDate';
import {
  Bell,
  Mail,
  User,
  Calendar,
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  Plus,
  FileText,
  BarChart3,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  Home,
  PieChart,
  UserCheck,
  CalendarDays,
  Target,
  Award,
} from 'lucide-react';

// Mock personel verisi - Öğretmen örneği
const mockPersonel = {
  id: '1',
  ad: 'Mehmet',
  soyad: 'Yılmaz',
  email: 'mehmet.yilmaz@edura.com',
  telefon: '0532 555 1234',
  role: 'OGRETMEN' as const,
  brans: 'Matematik',
  kursId: '1',
  kursAd: 'Edura Merkez',
  profilFoto: null,
};

// Mock istatistikler
const mockStats = {
  toplamOgrenci: 156,
  aktifDers: 12,
  bugunDers: 4,
  bekleyenOdev: 23,
  ortalamaBasari: 78.5,
  devamsizlikOrani: 4.2,
};

// Mock dersler (bugün)
const mockBugunDersler = [
  { id: '1', ders: 'Matematik', sinif: '9-A', saat: '09:00 - 09:45', durum: 'tamamlandi' },
  { id: '2', ders: 'Matematik', sinif: '10-B', saat: '10:00 - 10:45', durum: 'tamamlandi' },
  { id: '3', ders: 'Matematik', sinif: '11-A', saat: '11:00 - 11:45', durum: 'devam' },
  { id: '4', ders: 'Matematik', sinif: '12-C', saat: '14:00 - 14:45', durum: 'bekliyor' },
];

// Mock öğrenciler
const mockOgrenciler = [
  { id: '1', ad: 'Ali Yıldız', sinif: '9-A', ortalama: 85, devamsizlik: 2 },
  { id: '2', ad: 'Ayşe Demir', sinif: '10-B', ortalama: 92, devamsizlik: 0 },
  { id: '3', ad: 'Mehmet Kaya', sinif: '11-A', ortalama: 67, devamsizlik: 5 },
  { id: '4', ad: 'Zeynep Çelik', sinif: '12-C', ortalama: 78, devamsizlik: 1 },
  { id: '5', ad: 'Can Özkan', sinif: '9-A', ortalama: 54, devamsizlik: 8 },
];

// Mock bildirimler
const mockBildirimler = [
  { id: '1', baslik: 'Veli Görüşmesi', mesaj: 'Ali Yıldız\'ın velisi görüşme talep etti', tarih: '2024-01-15 10:30', okundu: false, tip: 'toplanti' },
  { id: '2', baslik: 'Sınav Hatırlatması', mesaj: '11-A sınıfı yarın sınav var', tarih: '2024-01-15 09:00', okundu: false, tip: 'sinav' },
  { id: '3', baslik: 'Devamsızlık Uyarısı', mesaj: 'Can Özkan devamsızlık sınırına yaklaştı', tarih: '2024-01-14 16:00', okundu: true, tip: 'uyari' },
];

// Mock mesajlar
const mockMesajlar = [
  { id: '1', gonderenAd: 'Ahmet Müdür', mesaj: 'Yarınki toplantıya katılabilir misiniz?', tarih: '2024-01-15 11:00', okundu: false },
  { id: '2', gonderenAd: 'Fatma Öğretmen', mesaj: 'Ders programı hakkında konuşabilir miyiz?', tarih: '2024-01-14 15:30', okundu: true },
  { id: '3', gonderenAd: 'Sekreterlik', mesaj: 'Ocak ayı puantaj formu hazır', tarih: '2024-01-13 09:00', okundu: true },
];

// Mock yaklaşan etkinlikler
const mockEtkinlikler = [
  { id: '1', baslik: 'Öğretmenler Kurulu', tarih: '2024-01-18', saat: '14:00', tip: 'toplanti' },
  { id: '2', baslik: 'Veli Toplantısı', tarih: '2024-01-20', saat: '18:00', tip: 'veli' },
  { id: '3', baslik: 'Deneme Sınavı', tarih: '2024-01-22', saat: '09:00', tip: 'sinav' },
];

export default function PersonelDashboard() {
  const [personel] = useState(mockPersonel);
  const [stats] = useState(mockStats);
  const [bildirimler] = useState(mockBildirimler);
  const [mesajlar] = useState(mockMesajlar);
  const [bugunDersler] = useState(mockBugunDersler);
  const [ogrenciler] = useState(mockOgrenciler);
  const [etkinlikler] = useState(mockEtkinlikler);
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'genel' | 'dersler' | 'ogrenciler' | 'sinavlar'>('genel');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const getRoleText = (role: string) => {
    switch (role) {
      case 'MUDUR': return 'Müdür';
      case 'OGRETMEN': return 'Öğretmen';
      case 'SEKRETER': return 'Sekreter';
      default: return role;
    }
  };

  const getDersDurumStyle = (durum: string) => {
    switch (durum) {
      case 'tamamlandi': return 'bg-green-100 text-green-700 border-green-200';
      case 'devam': return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
      case 'bekliyor': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getDersDurumText = (durum: string) => {
    switch (durum) {
      case 'tamamlandi': return 'Tamamlandı';
      case 'devam': return 'Devam Ediyor';
      case 'bekliyor': return 'Bekliyor';
      default: return durum;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white shadow-xl z-50 hidden lg:block">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Edura
          </h1>
          <p className="text-slate-400 text-sm mt-1">Personel Paneli</p>
        </div>
        
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('genel')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'genel' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Home size={20} />
            <span>Ana Sayfa</span>
          </button>
          
          <button
            onClick={() => setActiveTab('dersler')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'dersler' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookOpen size={20} />
            <span>Derslerim</span>
          </button>
          
          <button
            onClick={() => setActiveTab('ogrenciler')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'ogrenciler' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users size={20} />
            <span>Öğrenciler</span>
          </button>
          
          <button
            onClick={() => setActiveTab('sinavlar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'sinavlar' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ClipboardList size={20} />
            <span>Sınavlar</span>
          </button>
          
          <Link
            href="/personel/mesajlar"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
          >
            <MessageSquare size={20} />
            <span>Mesajlar</span>
            {mesajlar.filter(m => !m.okundu).length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {mesajlar.filter(m => !m.okundu).length}
              </span>
            )}
          </Link>
          
          <div className="pt-4 border-t border-slate-700 mt-4">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-all">
              <Settings size={20} />
              <span>Ayarlar</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Hoş geldiniz, {personel.ad} {personel.soyad}
              </h2>
              <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  {getRoleText(personel.role)}
                </span>
                <span>•</span>
                <span>{personel.brans}</span>
                <span>•</span>
                <span>{personel.kursAd}</span>
              </p>
            </div>

            <div ref={dropdownRef} className="flex items-center gap-4">
              {/* Arama */}
              <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-2">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Ara..."
                  className="bg-transparent border-none outline-none px-2 text-sm w-48"
                />
              </div>

              {/* Bildirimler */}
              <div className="relative">
                <button
                  onClick={() => handleDropdownToggle('bildirim')}
                  className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Bell size={22} className="text-slate-600" />
                  {bildirimler.filter(b => !b.okundu).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {bildirimler.filter(b => !b.okundu).length}
                    </span>
                  )}
                </button>

                {openDropdown === 'bildirim' && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-semibold text-slate-800">Bildirimler</h3>
                      <button className="text-blue-600 text-sm hover:underline">Tümünü Gör</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {bildirimler.map(bildirim => (
                        <div
                          key={bildirim.id}
                          className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                            !bildirim.okundu ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              bildirim.tip === 'toplanti' ? 'bg-purple-100 text-purple-600' :
                              bildirim.tip === 'sinav' ? 'bg-orange-100 text-orange-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {bildirim.tip === 'toplanti' ? <Calendar size={16} /> :
                               bildirim.tip === 'sinav' ? <FileText size={16} /> :
                               <AlertCircle size={16} />}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-800 text-sm">{bildirim.baslik}</p>
                              <p className="text-slate-500 text-xs mt-1">{bildirim.mesaj}</p>
                              <p className="text-slate-400 text-xs mt-2">{bildirim.tarih}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mesajlar */}
              <Link
                href="/personel/mesajlar"
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Mail size={22} className="text-slate-600" />
                {mesajlar.filter(m => !m.okundu).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {mesajlar.filter(m => !m.okundu).length}
                  </span>
                )}
              </Link>

              {/* Profil */}
              <div className="relative">
                <button
                  onClick={() => handleDropdownToggle('profil')}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {personel.ad[0]}{personel.soyad[0]}
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>

                {openDropdown === 'profil' && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100">
                      <p className="font-semibold text-slate-800">{personel.ad} {personel.soyad}</p>
                      <p className="text-slate-500 text-sm">{personel.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => setShowProfilModal(true)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm transition-colors"
                      >
                        <User size={18} />
                        <span>Profilim</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-sm transition-colors">
                        <Settings size={18} />
                        <span>Ayarlar</span>
                      </button>
                      <hr className="my-2" />
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 text-sm transition-colors">
                        <LogOut size={18} />
                        <span>Çıkış Yap</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Toplam Öğrenci</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{stats.toplamOgrenci}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users size={24} className="text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp size={16} className="text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+12%</span>
                <span className="text-slate-400 ml-2">bu ay</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Bugünkü Ders</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{stats.bugunDers}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <BookOpen size={24} className="text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Clock size={16} className="text-slate-400 mr-1" />
                <span className="text-slate-500">Sonraki: 14:00</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Ortalama Başarı</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">%{stats.ortalamaBasari}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Target size={24} className="text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp size={16} className="text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+5.2%</span>
                <span className="text-slate-400 ml-2">geçen aya göre</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Bekleyen Ödev</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{stats.bekleyenOdev}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <ClipboardList size={24} className="text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <AlertCircle size={16} className="text-orange-500 mr-1" />
                <span className="text-orange-600">8 değerlendirilecek</span>
              </div>
            </div>
          </div>

          {/* Ana İçerik Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bugünün Dersleri */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">Bugünün Dersleri</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    <ClientOnlyDate format="long" />
                  </p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
                  <Plus size={16} />
                  Yoklama Al
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {bugunDersler.map((ders) => (
                    <div
                      key={ders.id}
                      className={`flex items-center justify-between p-4 rounded-xl border ${getDersDurumStyle(ders.durum)}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <BookOpen size={20} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{ders.ders}</p>
                          <p className="text-slate-500 text-sm">{ders.sinif}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-800">{ders.saat}</p>
                        <p className={`text-sm font-medium ${
                          ders.durum === 'devam' ? 'text-blue-600' :
                          ders.durum === 'tamamlandi' ? 'text-green-600' : 'text-slate-500'
                        }`}>
                          {getDersDurumText(ders.durum)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Yaklaşan Etkinlikler */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 text-lg">Yaklaşan Etkinlikler</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {etkinlikler.map((etkinlik) => (
                    <div key={etkinlik.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className={`p-2 rounded-lg ${
                        etkinlik.tip === 'toplanti' ? 'bg-purple-100 text-purple-600' :
                        etkinlik.tip === 'veli' ? 'bg-blue-100 text-blue-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {etkinlik.tip === 'toplanti' ? <Users size={18} /> :
                         etkinlik.tip === 'veli' ? <UserCheck size={18} /> :
                         <FileText size={18} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">{etkinlik.baslik}</p>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs">
                          <CalendarDays size={14} />
                          <span>{etkinlik.tarih}</span>
                          <span>•</span>
                          <Clock size={14} />
                          <span>{etkinlik.saat}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors">
                  Tüm Etkinlikleri Gör
                </button>
              </div>
            </div>
          </div>

          {/* Öğrenci Listesi */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">Takip Edilmesi Gereken Öğrenciler</h3>
                <p className="text-slate-500 text-sm mt-1">Düşük başarı veya yüksek devamsızlık</p>
              </div>
              <button className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600">
                Tümünü Gör
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Öğrenci</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Sınıf</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ortalama</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Devamsızlık</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ogrenciler.filter(o => o.ortalama < 60 || o.devamsizlik > 4).map((ogrenci) => (
                    <tr key={ogrenci.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm">
                            {ogrenci.ad.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium text-slate-800">{ogrenci.ad}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{ogrenci.sinif}</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${ogrenci.ortalama < 60 ? 'text-red-600' : 'text-slate-800'}`}>
                          {ogrenci.ortalama}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${ogrenci.devamsizlik > 4 ? 'text-red-600' : 'text-slate-800'}`}>
                          {ogrenci.devamsizlik} gün
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {ogrenci.ortalama < 60 && ogrenci.devamsizlik > 4 ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Kritik</span>
                        ) : ogrenci.ortalama < 60 ? (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Düşük Başarı</span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Devamsızlık</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                          Detay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Profil Modal */}
      {showProfilModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Profil Bilgileri</h3>
              <button
                onClick={() => setShowProfilModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {personel.ad[0]}{personel.soyad[0]}
                </div>
                <h4 className="text-xl font-bold text-slate-800">{personel.ad} {personel.soyad}</h4>
                <p className="text-slate-500">{getRoleText(personel.role)} - {personel.brans}</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Mail size={20} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">E-posta</p>
                    <p className="text-slate-800">{personel.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <User size={20} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Telefon</p>
                    <p className="text-slate-800">{personel.telefon}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <GraduationCap size={20} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Kurum</p>
                    <p className="text-slate-800">{personel.kursAd}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
