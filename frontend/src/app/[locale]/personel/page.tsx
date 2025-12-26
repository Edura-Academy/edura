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
  Trash2,
  Edit,
  UserPlus,
  CreditCard,
  Phone,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle2,
  MinusCircle,
  Calendar,
  BarChart2,
} from 'lucide-react';

// Personel tipi
interface PersonelData {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  telefon?: string;
  role: 'mudur' | 'ogretmen' | 'sekreter';
  brans?: string;
  kursId?: string;
  kursAd?: string;
  profilFoto?: string | null;
}

// Mock personel verisi - varsayılan (localStorage'dan gelecek)
const defaultPersonel: PersonelData = {
  id: '1',
  ad: 'Personel',
  soyad: 'Test',
  email: 'personel@edura.com',
  telefon: '0532 555 1234',
  role: 'ogretmen',
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

// Sekreter için istatistikler
const mockSekreterStats = {
  toplamOgrenci: 156,
  buAyKayit: 12,
  toplamVeli: 148,
  bekleyenOdeme: 8,
  yaklasakEtkinlik: 3,
  bugunGorusme: 2,
};

// Son kayıtlar (sekreter için)
const mockSonKayitlar = [
  { id: '1', ogrenciAd: 'Arda Yılmaz', veliAd: 'Mehmet Yılmaz', sinif: '9-A', kayitTarihi: '2024-01-15', durum: 'aktif' },
  { id: '2', ogrenciAd: 'Elif Kaya', veliAd: 'Ayşe Kaya', sinif: '10-B', kayitTarihi: '2024-01-14', durum: 'aktif' },
  { id: '3', ogrenciAd: 'Burak Demir', veliAd: 'Ali Demir', sinif: '8-A', kayitTarihi: '2024-01-13', durum: 'aktif' },
  { id: '4', ogrenciAd: 'Selin Çelik', veliAd: 'Fatma Çelik', sinif: '11-A', kayitTarihi: '2024-01-12', durum: 'beklemede' },
  { id: '5', ogrenciAd: 'Emre Özkan', veliAd: 'Hasan Özkan', sinif: '7-A', kayitTarihi: '2024-01-11', durum: 'aktif' },
];

// Mock dersler (bugün)
const mockBugunDersler = [
  { id: '1', ders: 'Matematik', sinif: '9-A', saat: '09:00 - 09:45', durum: 'tamamlandi' },
  { id: '2', ders: 'Matematik', sinif: '10-B', saat: '10:00 - 10:45', durum: 'tamamlandi' },
  { id: '3', ders: 'Matematik', sinif: '11-A', saat: '11:00 - 11:45', durum: 'devam' },
  { id: '4', ders: 'Matematik', sinif: '12-C', saat: '14:00 - 14:45', durum: 'bekliyor' },
];

// Mock öğrenciler (veli bilgileri dahil - sekreter için)
const mockOgrenciler = [
  { id: '1', ad: 'Ali Yıldız', sinif: '9-A', ortalama: 85, devamsizlik: 2, telefon: '0532 111 1111', veliAd: 'Ahmet Yıldız', veliTelefon: '0532 111 0001' },
  { id: '2', ad: 'Ayşe Demir', sinif: '10-B', ortalama: 92, devamsizlik: 0, telefon: '0533 222 2222', veliAd: 'Fatma Demir', veliTelefon: '0533 222 0002' },
  { id: '3', ad: 'Mehmet Kaya', sinif: '11-A', ortalama: 67, devamsizlik: 5, telefon: '0534 333 3333', veliAd: 'Ali Kaya', veliTelefon: '0534 333 0003' },
  { id: '4', ad: 'Zeynep Çelik', sinif: '12-C', ortalama: 78, devamsizlik: 1, telefon: '0535 444 4444', veliAd: 'Ayşe Çelik', veliTelefon: '0535 444 0004' },
  { id: '5', ad: 'Can Özkan', sinif: '9-A', ortalama: 54, devamsizlik: 8, telefon: '0536 555 5555', veliAd: 'Murat Özkan', veliTelefon: '0536 555 0005' },
];

// Mock ödevler (öğretmen için)
const mockOdevler = [
  { id: '1', baslik: 'Denklemler Alıştırması', ders: 'Matematik', sinif: '9-A', sonTarih: '2024-01-20', bekleyenTeslim: 8, tamamlanan: 17 },
  { id: '2', baslik: 'Fonksiyonlar Testi', ders: 'Matematik', sinif: '10-B', sonTarih: '2024-01-22', bekleyenTeslim: 5, tamamlanan: 20 },
  { id: '3', baslik: 'Limit Problemleri', ders: 'Matematik', sinif: '11-A', sonTarih: '2024-01-25', bekleyenTeslim: 12, tamamlanan: 10 },
];

// Mock ders programı (müdür için)
const mockDersProgrami = [
  { sinif: '9-A', dersler: ['Matematik', 'Fizik', 'Kimya', 'Türkçe', 'İngilizce'] },
  { sinif: '10-B', dersler: ['Matematik', 'Fizik', 'Kimya', 'Türkçe', 'İngilizce'] },
  { sinif: '11-A', dersler: ['Matematik', 'Fizik', 'Kimya', 'Türkçe', 'İngilizce'] },
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

// Mock sınav sonuçları - detaylı versiyon
interface SinavOgrenciSonuc {
  ogrenciId: string;
  ogrenciAd: string;
  puan: number;
  dogru: number;
  yanlis: number;
  bos: number;
  hataliSorular: number[]; // hatalı soru numaraları
  gecmisSinavlar: { sinavAd: string; puan: number; tarih: string }[];
}

interface DenemeSinavi {
  id: string;
  sinavAd: string;
  ders: string;
  sinif: string;
  tarih: string;
  toplamSoru: number;
  sinifOrtalamasi: number;
  ogrenciSonuclari: SinavOgrenciSonuc[];
}

const mockDenemeSinavlari: DenemeSinavi[] = [
  {
    id: '1',
    sinavAd: 'Matematik Deneme Sınavı 3',
    ders: 'Matematik',
    sinif: '9-A',
    tarih: '2024-01-22',
    toplamSoru: 40,
    sinifOrtalamasi: 82.3,
    ogrenciSonuclari: [
      { ogrenciId: '1', ogrenciAd: 'Ali Yıldız', puan: 85, dogru: 34, yanlis: 4, bos: 2, hataliSorular: [5, 12, 23, 38], gecmisSinavlar: [{ sinavAd: 'Deneme 1', puan: 78, tarih: '2024-01-08' }, { sinavAd: 'Deneme 2', puan: 82, tarih: '2024-01-15' }] },
      { ogrenciId: '2', ogrenciAd: 'Ayşe Demir', puan: 92, dogru: 37, yanlis: 2, bos: 1, hataliSorular: [18, 34], gecmisSinavlar: [{ sinavAd: 'Deneme 1', puan: 88, tarih: '2024-01-08' }, { sinavAd: 'Deneme 2', puan: 90, tarih: '2024-01-15' }] },
      { ogrenciId: '3', ogrenciAd: 'Mehmet Kaya', puan: 67, dogru: 27, yanlis: 10, bos: 3, hataliSorular: [3, 7, 11, 15, 19, 22, 28, 33, 36, 40], gecmisSinavlar: [{ sinavAd: 'Deneme 1', puan: 58, tarih: '2024-01-08' }, { sinavAd: 'Deneme 2', puan: 63, tarih: '2024-01-15' }] },
      { ogrenciId: '4', ogrenciAd: 'Zeynep Çelik', puan: 78, dogru: 31, yanlis: 6, bos: 3, hataliSorular: [2, 14, 21, 29, 35, 39], gecmisSinavlar: [{ sinavAd: 'Deneme 1', puan: 72, tarih: '2024-01-08' }, { sinavAd: 'Deneme 2', puan: 75, tarih: '2024-01-15' }] },
      { ogrenciId: '5', ogrenciAd: 'Can Özkan', puan: 54, dogru: 22, yanlis: 15, bos: 3, hataliSorular: [1, 4, 8, 10, 13, 16, 20, 24, 26, 30, 32, 35, 37, 39, 40], gecmisSinavlar: [{ sinavAd: 'Deneme 1', puan: 45, tarih: '2024-01-08' }, { sinavAd: 'Deneme 2', puan: 50, tarih: '2024-01-15' }] },
    ]
  },
  {
    id: '2',
    sinavAd: 'Fizik Quiz 5',
    ders: 'Fizik',
    sinif: '10-B',
    tarih: '2024-01-20',
    toplamSoru: 30,
    sinifOrtalamasi: 68.7,
    ogrenciSonuclari: [
      { ogrenciId: '1', ogrenciAd: 'Ali Yıldız', puan: 72, dogru: 22, yanlis: 6, bos: 2, hataliSorular: [8, 14, 19, 24, 27, 29], gecmisSinavlar: [{ sinavAd: 'Quiz 3', puan: 65, tarih: '2024-01-06' }, { sinavAd: 'Quiz 4', puan: 68, tarih: '2024-01-13' }] },
      { ogrenciId: '2', ogrenciAd: 'Ayşe Demir', puan: 80, dogru: 24, yanlis: 4, bos: 2, hataliSorular: [11, 18, 22, 28], gecmisSinavlar: [{ sinavAd: 'Quiz 3', puan: 75, tarih: '2024-01-06' }, { sinavAd: 'Quiz 4', puan: 78, tarih: '2024-01-13' }] },
      { ogrenciId: '3', ogrenciAd: 'Mehmet Kaya', puan: 55, dogru: 17, yanlis: 10, bos: 3, hataliSorular: [2, 5, 9, 12, 15, 18, 21, 25, 27, 30], gecmisSinavlar: [{ sinavAd: 'Quiz 3', puan: 48, tarih: '2024-01-06' }, { sinavAd: 'Quiz 4', puan: 52, tarih: '2024-01-13' }] },
    ]
  }
];

export default function PersonelDashboard() {
  const [personel, setPersonel] = useState<PersonelData>(defaultPersonel);
  const [stats] = useState(mockStats);
  const [bildirimler] = useState(mockBildirimler);
  const [mesajlar] = useState(mockMesajlar);
  const [bugunDersler] = useState(mockBugunDersler);
  const [ogrenciler] = useState(mockOgrenciler);
  const [etkinlikler] = useState(mockEtkinlikler);
  const [odevler] = useState(mockOdevler);
  const [dersProgrami] = useState(mockDersProgrami);
  const [showYoklamaModal, setShowYoklamaModal] = useState(false);
  const [selectedDers, setSelectedDers] = useState<typeof mockBugunDersler[0] | null>(null);
  const [selectedOgrenci, setSelectedOgrenci] = useState<typeof mockOgrenciler[0] | null>(null);
  const [showOgrenciDetayModal, setShowOgrenciDetayModal] = useState(false);
  const [showTumBildirimlerModal, setShowTumBildirimlerModal] = useState(false);
  const [showTumEtkinliklerModal, setShowTumEtkinliklerModal] = useState(false);
  const [showOdevDetayModal, setShowOdevDetayModal] = useState(false);
  const [selectedOdev, setSelectedOdev] = useState<typeof mockOdevler[0] | null>(null);
  const [yoklamaDurumlari, setYoklamaDurumlari] = useState<Record<string, 'katildi' | 'katilmadi' | 'gec'>>({});
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'genel' | 'dersler' | 'ogrenciler' | 'sinavlar' | 'odevler' | 'program'>('genel');
  
  // Sekreter için state'ler
  const [sonKayitlar] = useState(mockSonKayitlar);
  const [sekreterStats] = useState(mockSekreterStats);
  const [showOgrenciEkleModal, setShowOgrenciEkleModal] = useState(false);
  const [showSilOnayModal, setShowSilOnayModal] = useState(false);
  const [silinecekOgrenci, setSilinecekOgrenci] = useState<typeof mockOgrenciler[0] | null>(null);
  const [ogrenciListesi, setOgrenciListesi] = useState(mockOgrenciler);
  const [yeniOgrenci, setYeniOgrenci] = useState({
    ad: '',
    soyad: '',
    sinif: '',
    telefon: '',
    veliAd: '',
    veliTelefon: '',
    email: '',
  });
  
  // Sınav state'leri
  const [denemeSinavlari] = useState(mockDenemeSinavlari);
  const [selectedSinav, setSelectedSinav] = useState<DenemeSinavi | null>(null);
  const [showSinavSonuclariModal, setShowSinavSonuclariModal] = useState(false);
  const [showSinavAnalizModal, setShowSinavAnalizModal] = useState(false);
  const [showSinavSonucuEkleModal, setShowSinavSonucuEkleModal] = useState(false);
  const [sonucFiltre, setSonucFiltre] = useState('');
  const [karsilastirmaOgrenci1, setKarsilastirmaOgrenci1] = useState<SinavOgrenciSonuc | null>(null);
  const [karsilastirmaOgrenci2, setKarsilastirmaOgrenci2] = useState<SinavOgrenciSonuc | null>(null);
  
  // Dersler için tarih seçici
  const [selectedDersTarihi, setSelectedDersTarihi] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // localStorage'dan kullanıcı verisini al
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setPersonel({
          id: user.id || '1',
          ad: user.ad || 'Personel',
          soyad: user.soyad || 'Test',
          email: user.email || 'personel@edura.com',
          telefon: user.telefon,
          role: user.role || 'ogretmen',
          brans: user.brans,
          kursId: user.kursId,
          kursAd: user.kursAd || 'Edura',
          profilFoto: user.profilFoto,
        });
      } catch (e) {
        console.error('User parse error:', e);
      }
    }
  }, []);

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
      case 'mudur': return 'Müdür';
      case 'ogretmen': return 'Öğretmen';
      case 'sekreter': return 'Sekreter';
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
          
          {/* Müdür: Ders Programı */}
          {personel.role === 'mudur' && (
            <button
              onClick={() => setActiveTab('program')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'program' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Calendar size={20} />
              <span>Ders Programı</span>
            </button>
          )}
          
          {/* Öğretmen: Derslerim */}
          {personel.role === 'ogretmen' && (
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
          )}
          
          {/* Öğretmen: Ödevler */}
          {personel.role === 'ogretmen' && (
            <button
              onClick={() => setActiveTab('odevler')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'odevler' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileText size={20} />
              <span>Ödevler</span>
              {odevler.reduce((acc, o) => acc + o.bekleyenTeslim, 0) > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {odevler.reduce((acc, o) => acc + o.bekleyenTeslim, 0)}
                </span>
              )}
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('ogrenciler')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'ogrenciler' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users size={20} />
            <span>{personel.role === 'sekreter' ? 'Öğrenci & Veli' : 'Öğrenciler'}</span>
          </button>
          
          {/* Müdür ve Öğretmen: Sınavlar */}
          {(personel.role === 'mudur' || personel.role === 'ogretmen') && (
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
          )}

          {(personel.role === 'mudur' || personel.role === 'ogretmen') && (
            <Link
              href="/personel/odevler"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
            >
              <FileText size={20} />
              <span>Ödevler</span>
            </Link>
          )}

          {(personel.role === 'mudur' || personel.role === 'ogretmen') && (
            <Link
              href="/personel/yoklama"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
            >
              <UserCheck size={20} />
              <span>Yoklama</span>
            </Link>
          )}

          {(personel.role === 'mudur' || personel.role === 'ogretmen') && (
            <Link
              href="/personel/online-sinav"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
            >
              <FileText size={20} />
              <span>Online Sınav</span>
            </Link>
          )}

          <Link
            href="/personel/ders-programi"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
          >
            <Calendar size={20} />
            <span>Ders Programı</span>
          </Link>

          <Link
            href="/personel/raporlar"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
          >
            <BarChart2 size={20} />
            <span>Raporlar</span>
          </Link>

          <Link
            href="/personel/duyurular"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
          >
            <Bell size={20} />
            <span>Duyurular</span>
          </Link>
          
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
            <Link
              href="/personel/hesap-ayarlari"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
            >
              <Settings size={20} />
              <span>Ayarlar</span>
            </Link>
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
                      <button
                        onClick={() => {
                          setShowTumBildirimlerModal(true);
                          setOpenDropdown(null);
                        }}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Tümünü Gör
                      </button>
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
              <div className="relative">
                <button
                  onClick={() => handleDropdownToggle('mesaj')}
                  className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Mail size={22} className="text-slate-600" />
                  {mesajlar.filter(m => !m.okundu).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {mesajlar.filter(m => !m.okundu).length}
                    </span>
                  )}
                </button>

                {openDropdown === 'mesaj' && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-semibold text-slate-800">Mesajlar</h3>
                      <span className="text-xs text-slate-500">{mesajlar.filter(m => !m.okundu).length} okunmamış</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {mesajlar.slice(0, 4).map(mesaj => (
                        <div
                          key={mesaj.id}
                          className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${
                            !mesaj.okundu ? 'bg-green-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm flex-shrink-0">
                              {mesaj.gonderenAd.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-slate-800 text-sm">{mesaj.gonderenAd}</p>
                                {!mesaj.okundu && (
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                )}
                              </div>
                              <p className="text-slate-500 text-xs mt-1 truncate">{mesaj.mesaj}</p>
                              <p className="text-slate-400 text-xs mt-1">{mesaj.tarih}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-slate-100">
                      <Link
                        href="/personel/mesajlar"
                        onClick={() => setOpenDropdown(null)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <MessageSquare size={16} />
                        Tüm Mesajlarıma Git
                      </Link>
                    </div>
                  </div>
                )}
              </div>

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
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {personel.ad[0]}{personel.soyad[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{personel.ad} {personel.soyad}</p>
                        <p className="text-slate-500 text-sm">@edura.com</p>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowProfilModal(true);
                          setOpenDropdown(null);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 text-sm transition-colors"
                      >
                        <User size={18} />
                        <span>Profili düzenle</span>
                      </button>
                      <Link
                        href="/personel/hesap-ayarlari"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 text-sm transition-colors"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <Settings size={18} />
                        <span>Hesap ayarları</span>
                      </Link>
                      <hr className="my-2" />
                      <button 
                        onClick={() => {
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          window.location.href = '/login';
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 text-sm transition-colors"
                      >
                        <LogOut size={18} />
                        <span>Çıkış yap</span>
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
          {/* Genel Sekme */}
          {activeTab === 'genel' && (
            <>
          {/* İstatistik Kartları - Sekreter için farklı */}
          {personel.role === 'sekreter' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Toplam Kayıtlı Öğrenci</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{sekreterStats.toplamOgrenci}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users size={24} className="text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp size={16} className="text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">+{sekreterStats.buAyKayit}</span>
                  <span className="text-slate-400 ml-2">bu ay kayıt</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Bu Ay Yeni Kayıt</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{sekreterStats.buAyKayit}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <UserPlus size={24} className="text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp size={16} className="text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">+3</span>
                  <span className="text-slate-400 ml-2">geçen aya göre</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Toplam Veli</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{sekreterStats.toplamVeli}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <UserCheck size={24} className="text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <Phone size={16} className="text-slate-400 mr-1" />
                  <span className="text-slate-500">İletişim bilgileri güncel</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium">Yaklaşan Etkinlik</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{sekreterStats.yaklasakEtkinlik}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <CalendarDays size={24} className="text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <Clock size={16} className="text-orange-500 mr-1" />
                  <span className="text-orange-600">{sekreterStats.bugunGorusme} görüşme bugün</span>
                </div>
              </div>
            </div>
          ) : (
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
          )}

          {/* Ana İçerik Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sekreter için Son Kayıtlar / Diğerleri için Bugünün Dersleri */}
            {personel.role === 'sekreter' ? (
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">Son Kayıtlar</h3>
                    <p className="text-slate-500 text-sm mt-1">Bu hafta yapılan öğrenci kayıtları</p>
                  </div>
                  <button 
                    onClick={() => setShowOgrenciEkleModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <UserPlus size={16} />
                    Yeni Öğrenci Ekle
                  </button>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {sonKayitlar.map((kayit) => (
                      <div
                        key={kayit.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {kayit.ogrenciAd.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{kayit.ogrenciAd}</p>
                            <p className="text-slate-500 text-sm">Veli: {kayit.veliAd}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium text-slate-800">{kayit.sinif}</p>
                            <p className="text-slate-500 text-sm">{kayit.kayitTarihi}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            kayit.durum === 'aktif' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {kayit.durum === 'aktif' ? 'Aktif' : 'Beklemede'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setActiveTab('ogrenciler')}
                    className="w-full mt-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Tüm Öğrencileri Görüntüle
                  </button>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">Bugünün Dersleri</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      <ClientOnlyDate dateString={new Date().toISOString()} />
                    </p>
                  </div>
                  {/* Yoklama butonu sadece öğretmen için */}
                  {personel.role === 'ogretmen' && (
                    <button 
                      onClick={() => {
                        const devamEdenDers = bugunDersler.find(d => d.durum === 'devam');
                        if (devamEdenDers) {
                          setSelectedDers(devamEdenDers);
                          setShowYoklamaModal(true);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Yoklama Al
                    </button>
                  )}
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
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium text-slate-800">{ders.saat}</p>
                            <p className={`text-sm font-medium ${
                              ders.durum === 'devam' ? 'text-blue-600' :
                              ders.durum === 'tamamlandi' ? 'text-green-600' : 'text-slate-500'
                            }`}>
                              {getDersDurumText(ders.durum)}
                            </p>
                          </div>
                          {/* Öğretmen: Devam eden veya bekleyen derslere yoklama alabilir */}
                          {personel.role === 'ogretmen' && ders.durum !== 'tamamlandi' && (
                            <button
                              onClick={() => {
                                setSelectedDers(ders);
                                setShowYoklamaModal(true);
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Yoklama
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                <button 
                  onClick={() => setShowTumEtkinliklerModal(true)}
                  className="w-full mt-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Tüm Etkinlikleri Gör
                </button>
              </div>
            </div>
          </div>

          {/* Öğrenci Listesi - Sekreter hariç */}
          {personel.role !== 'sekreter' && (
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">Takip Edilmesi Gereken Öğrenciler</h3>
                  <p className="text-slate-500 text-sm mt-1">Düşük başarı veya yüksek devamsızlık</p>
                </div>
                <button 
                  onClick={() => setActiveTab('ogrenciler')}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600"
                >
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
                          <button 
                            onClick={() => {
                              setSelectedOgrenci(ogrenci);
                              setShowOgrenciDetayModal(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                          >
                            Detay Görüntüle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
            </>
          )}

          {/* Dersler Sekmesi - Öğretmen */}
          {activeTab === 'dersler' && personel.role === 'ogretmen' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">Derslerim</h3>
                    <p className="text-slate-500 text-sm mt-1">Tüm dersleriniz ve ders programınız</p>
                  </div>
                  
                  {/* Tarih Seçici */}
                  <div className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-slate-100 p-2 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => {
                        const date = new Date(selectedDersTarihi);
                        date.setDate(date.getDate() - 1);
                        setSelectedDersTarihi(date.toISOString().split('T')[0]);
                      }}
                      className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-800"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={18} className="text-blue-600" />
                      <input
                        type="date"
                        value={selectedDersTarihi}
                        onChange={(e) => setSelectedDersTarihi(e.target.value)}
                        className="bg-transparent border-none outline-none text-slate-800 font-medium cursor-pointer"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const date = new Date(selectedDersTarihi);
                        date.setDate(date.getDate() + 1);
                        setSelectedDersTarihi(date.toISOString().split('T')[0]);
                      }}
                      className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-800"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <button 
                      onClick={() => setSelectedDersTarihi(new Date().toISOString().split('T')[0])}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Bugün
                    </button>
                  </div>
                </div>
                
                {/* Seçili Tarih Göstergesi */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-slate-500">Seçili Tarih:</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    {new Date(selectedDersTarihi).toLocaleDateString('tr-TR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  {selectedDersTarihi === new Date().toISOString().split('T')[0] && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Bugün</span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bugunDersler.map((ders) => (
                    <div key={ders.id} className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{ders.ders}</h4>
                            <p className="text-sm text-slate-500">{ders.sinif}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDersDurumStyle(ders.durum)}`}>
                          {getDersDurumText(ders.durum)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{ders.saat}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{ogrenciler.filter(o => o.sinif === ders.sinif).length} öğrenci</span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedDers(ders);
                            setShowYoklamaModal(true);
                          }}
                          className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Yoklama Al
                        </button>
                        <button className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                          Ders Materyalleri
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ödevler Sekmesi - Öğretmen */}
          {activeTab === 'odevler' && personel.role === 'ogretmen' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">Ödevler</h3>
                  <p className="text-slate-500 text-sm mt-1">Verdiğiniz ödevleri yönetin</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
                  <Plus size={16} />
                  Yeni Ödev
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {odevler.map((odev) => (
                    <div key={odev.id} className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-orange-100 rounded-lg">
                            <FileText size={24} className="text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{odev.baslik}</h4>
                            <p className="text-sm text-slate-500">{odev.ders} - {odev.sinif}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800">Son Teslim: {odev.sonTarih}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-green-600">{odev.tamamlanan} teslim edildi</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-orange-600">{odev.bekleyenTeslim} bekliyor</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${(odev.tamamlanan / (odev.tamamlanan + odev.bekleyenTeslim)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedOdev(odev);
                            setShowOdevDetayModal(true);
                          }}
                          className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Teslimleri Görüntüle
                        </button>
                        <button className="py-2 px-4 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                          Düzenle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Öğrenciler Sekmesi */}
          {activeTab === 'ogrenciler' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">
                    {personel.role === 'sekreter' ? 'Öğrenci & Veli Bilgileri' : 'Öğrenciler'}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {personel.role === 'sekreter' ? 'İletişim bilgileri ve veli numaraları' : 'Tüm öğrenci listesi'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2">
                    <Search size={18} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Öğrenci ara..."
                      className="bg-transparent border-none outline-none px-2 text-sm w-48 text-slate-800"
                    />
                  </div>
                  {/* Sekreter için Yeni Öğrenci Ekle butonu */}
                  {personel.role === 'sekreter' && (
                    <button
                      onClick={() => setShowOgrenciEkleModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <UserPlus size={16} />
                      Yeni Öğrenci Ekle
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Öğrenci</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Sınıf</th>
                      {personel.role === 'sekreter' ? (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Telefon</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Veli</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Veli Tel</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Ortalama</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Devamsızlık</th>
                        </>
                      )}
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ogrenciListesi.map((ogrenci) => (
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
                        {personel.role === 'sekreter' ? (
                          <>
                            <td className="px-6 py-4 text-slate-600">{ogrenci.telefon}</td>
                            <td className="px-6 py-4 text-slate-600">{ogrenci.veliAd}</td>
                            <td className="px-6 py-4 text-slate-600">{ogrenci.veliTelefon}</td>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setSelectedOgrenci(ogrenci);
                                setShowOgrenciDetayModal(true);
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                            >
                              Detay
                            </button>
                            {/* Sekreter için Düzenle ve Sil butonları */}
                            {personel.role === 'sekreter' && (
                              <>
                                <button 
                                  onClick={() => {
                                    setSelectedOgrenci(ogrenci);
                                    // TODO: Düzenleme modalı
                                  }}
                                  className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                  title="Düzenle"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setSilinecekOgrenci(ogrenci);
                                    setShowSilOnayModal(true);
                                  }}
                                  className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                  title="Kaydı Sil"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sınavlar Sekmesi */}
          {activeTab === 'sinavlar' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">Sınavlar</h3>
                  <p className="text-slate-500 text-sm mt-1">Sınav sonuçları ve analizler</p>
                </div>
                {personel.role === 'ogretmen' && (
                  <button 
                    onClick={() => setShowSinavSonucuEkleModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Sınav Sonucu Ekle
                  </button>
                )}
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-600 font-medium">Toplam Sınav</p>
                    <p className="text-3xl font-bold text-blue-700 mt-1">{denemeSinavlari.length}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-600 font-medium">Ortalama Başarı</p>
                    <p className="text-3xl font-bold text-green-700 mt-1">
                      %{(denemeSinavlari.reduce((acc, s) => acc + s.sinifOrtalamasi, 0) / denemeSinavlari.length).toFixed(1)}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <p className="text-sm text-orange-600 font-medium">Yaklaşan Sınav</p>
                    <p className="text-3xl font-bold text-orange-700 mt-1">2</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {denemeSinavlari.map((sinav) => (
                    <div key={sinav.id} className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-800">{sinav.sinavAd}</h4>
                          <p className="text-sm text-slate-500">{sinav.sinif} • {sinav.tarih} • {sinav.toplamSoru} soru</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${sinav.sinifOrtalamasi >= 75 ? 'text-green-600' : sinav.sinifOrtalamasi >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                            %{sinav.sinifOrtalamasi}
                          </p>
                          <p className="text-xs text-slate-500">Sınıf Ortalaması</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedSinav(sinav);
                            setSonucFiltre('');
                            setShowSinavSonuclariModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          Sonuçlar
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedSinav(sinav);
                            setKarsilastirmaOgrenci1(null);
                            setKarsilastirmaOgrenci2(null);
                            setShowSinavAnalizModal(true);
                          }}
                          className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                        >
                          Analiz
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ders Programı Sekmesi - Müdür */}
          {activeTab === 'program' && personel.role === 'mudur' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">Ders Programı</h3>
                  <p className="text-slate-500 text-sm mt-1">Sınıf bazlı ders programlarını düzenleyin</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
                  <Plus size={16} />
                  Program Ekle
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {dersProgrami.map((program, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-800 text-lg">{program.sinif}</h4>
                        <button className="px-3 py-1.5 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors">
                          Düzenle
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="px-3 py-2 text-left text-slate-500">Saat</th>
                              <th className="px-3 py-2 text-left text-slate-500">Pazartesi</th>
                              <th className="px-3 py-2 text-left text-slate-500">Salı</th>
                              <th className="px-3 py-2 text-left text-slate-500">Çarşamba</th>
                              <th className="px-3 py-2 text-left text-slate-500">Perşembe</th>
                              <th className="px-3 py-2 text-left text-slate-500">Cuma</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="px-3 py-2 text-slate-600">09:00</td>
                              <td className="px-3 py-2"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Matematik</span></td>
                              <td className="px-3 py-2"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Fizik</span></td>
                              <td className="px-3 py-2"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Türkçe</span></td>
                              <td className="px-3 py-2"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">Kimya</span></td>
                              <td className="px-3 py-2"><span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">İngilizce</span></td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 text-slate-600">10:00</td>
                              <td className="px-3 py-2"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Fizik</span></td>
                              <td className="px-3 py-2"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Matematik</span></td>
                              <td className="px-3 py-2"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">Kimya</span></td>
                              <td className="px-3 py-2"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Türkçe</span></td>
                              <td className="px-3 py-2"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Matematik</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Profil Düzenleme Modal */}
      {showProfilModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <User size={24} className="text-blue-600" />
                <h3 className="text-xl font-bold text-slate-800">Profili Düzenle</h3>
              </div>
              <button
                onClick={() => setShowProfilModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {/* Profil Fotoğrafı */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {personel.ad[0]}{personel.soyad[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Profil Fotoğrafı</p>
                  <p className="text-xs text-slate-500">JPG veya PNG. Maks 2MB</p>
                  <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Fotoğraf Yükle
                  </button>
                </div>
              </div>
              
              {/* Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ad</label>
                    <input
                      type="text"
                      defaultValue={personel.ad}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Soyad</label>
                    <input
                      type="text"
                      defaultValue={personel.soyad}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    defaultValue={personel.email}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    defaultValue={personel.telefon}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Branş</label>
                    <input
                      type="text"
                      defaultValue={personel.brans}
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kurum</label>
                    <input
                      type="text"
                      defaultValue={personel.kursAd}
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowProfilModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  // TODO: API call
                  setShowProfilModal(false);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Öğrenci Detay Modal */}
      {showOgrenciDetayModal && selectedOgrenci && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Öğrenci Detayı</h3>
              <button
                onClick={() => {
                  setShowOgrenciDetayModal(false);
                  setSelectedOgrenci(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {selectedOgrenci.ad.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">{selectedOgrenci.ad}</h4>
                  <p className="text-slate-500">{selectedOgrenci.sinif}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600 font-medium">Ortalama</p>
                  <p className={`text-2xl font-bold ${selectedOgrenci.ortalama < 60 ? 'text-red-600' : 'text-blue-700'}`}>
                    {selectedOgrenci.ortalama}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm text-orange-600 font-medium">Devamsızlık</p>
                  <p className={`text-2xl font-bold ${selectedOgrenci.devamsizlik > 4 ? 'text-red-600' : 'text-orange-700'}`}>
                    {selectedOgrenci.devamsizlik} gün
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-2">İletişim</p>
                  <p className="text-slate-800 font-medium">{selectedOgrenci.telefon}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Veli Bilgileri</p>
                  <p className="text-slate-800 font-medium">{selectedOgrenci.veliAd}</p>
                  <p className="text-slate-600 text-sm">{selectedOgrenci.veliTelefon}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowOgrenciDetayModal(false);
                  setSelectedOgrenci(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Kapat
              </button>
              <Link
                href="/personel/mesajlar"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-center"
              >
                Veliye Mesaj Gönder
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tüm Bildirimler Modal */}
      {showTumBildirimlerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Tüm Bildirimler</h3>
              <button
                onClick={() => setShowTumBildirimlerModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {bildirimler.map(bildirim => (
                  <div
                    key={bildirim.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      !bildirim.okundu ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        bildirim.tip === 'toplanti' ? 'bg-purple-100 text-purple-600' :
                        bildirim.tip === 'sinav' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {bildirim.tip === 'toplanti' ? <Calendar size={18} /> :
                         bildirim.tip === 'sinav' ? <FileText size={18} /> :
                         <AlertCircle size={18} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-800">{bildirim.baslik}</p>
                          {!bildirim.okundu && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">Yeni</span>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm mt-1">{bildirim.mesaj}</p>
                        <p className="text-slate-400 text-xs mt-2">{bildirim.tarih}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setShowTumBildirimlerModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tüm Etkinlikler Modal */}
      {showTumEtkinliklerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Tüm Etkinlikler</h3>
              <button
                onClick={() => setShowTumEtkinliklerModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {etkinlikler.map((etkinlik) => (
                  <div key={etkinlik.id} className="p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        etkinlik.tip === 'toplanti' ? 'bg-purple-100 text-purple-600' :
                        etkinlik.tip === 'veli' ? 'bg-blue-100 text-blue-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {etkinlik.tip === 'toplanti' ? <Users size={24} /> :
                         etkinlik.tip === 'veli' ? <UserCheck size={24} /> :
                         <FileText size={24} />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800">{etkinlik.baslik}</h4>
                        <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
                          <div className="flex items-center gap-1">
                            <CalendarDays size={14} />
                            <span>{etkinlik.tarih}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{etkinlik.saat}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setShowTumEtkinliklerModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ödev Detay Modal */}
      {showOdevDetayModal && selectedOdev && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-orange-600 text-white">
              <div>
                <h3 className="text-xl font-bold">{selectedOdev.baslik}</h3>
                <p className="text-orange-100 text-sm mt-1">
                  {selectedOdev.ders} - {selectedOdev.sinif} • Son Teslim: {selectedOdev.sonTarih}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowOdevDetayModal(false);
                  setSelectedOdev(null);
                }}
                className="p-2 hover:bg-orange-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-700">{selectedOdev.tamamlanan}</p>
                  <p className="text-xs text-green-600">Teslim Edildi</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-orange-700">{selectedOdev.bekleyenTeslim}</p>
                  <p className="text-xs text-orange-600">Bekliyor</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-700">0</p>
                  <p className="text-xs text-blue-600">Değerlendirildi</p>
                </div>
              </div>
              
              <h4 className="font-semibold text-slate-800 mb-4">Teslim Eden Öğrenciler</h4>
              <div className="space-y-3">
                {ogrenciler.filter(o => o.sinif === selectedOdev.sinif).map((ogrenci) => (
                  <div key={ogrenci.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm">
                        {ogrenci.ad.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{ogrenci.ad}</p>
                        <p className="text-xs text-green-600">Teslim: 19 Ocak 2024</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        placeholder="Puan" 
                        max={100}
                        min={0}
                        className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-center text-slate-800"
                      />
                      <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                        Değerlendir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowOdevDetayModal(false);
                  setSelectedOdev(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Kapat
              </button>
              <button className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                Tümünü Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Öğrenci Ekleme Modal - Sekreter */}
      {showOgrenciEkleModal && personel.role === 'sekreter' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-blue-600 text-white">
              <div className="flex items-center gap-3">
                <UserPlus size={24} />
                <h3 className="text-xl font-bold">Yeni Öğrenci Kaydı</h3>
              </div>
              <button
                onClick={() => {
                  setShowOgrenciEkleModal(false);
                  setYeniOgrenci({ ad: '', soyad: '', sinif: '', telefon: '', veliAd: '', veliTelefon: '', email: '' });
                }}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {/* Öğrenci Bilgileri */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <GraduationCap size={18} />
                    Öğrenci Bilgileri
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ad *</label>
                      <input
                        type="text"
                        value={yeniOgrenci.ad}
                        onChange={(e) => setYeniOgrenci(prev => ({ ...prev, ad: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                        placeholder="Öğrenci adı"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Soyad *</label>
                      <input
                        type="text"
                        value={yeniOgrenci.soyad}
                        onChange={(e) => setYeniOgrenci(prev => ({ ...prev, soyad: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                        placeholder="Öğrenci soyadı"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sınıf *</label>
                      <select
                        value={yeniOgrenci.sinif}
                        onChange={(e) => setYeniOgrenci(prev => ({ ...prev, sinif: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                      >
                        <option value="">Sınıf seçin</option>
                        <option value="5-A">5-A</option>
                        <option value="6-A">6-A</option>
                        <option value="7-A">7-A</option>
                        <option value="8-A">8-A</option>
                        <option value="9-A">9-A</option>
                        <option value="10-A">10-A</option>
                        <option value="10-B">10-B</option>
                        <option value="11-A">11-A</option>
                        <option value="12-C">12-C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                      <input
                        type="tel"
                        value={yeniOgrenci.telefon}
                        onChange={(e) => setYeniOgrenci(prev => ({ ...prev, telefon: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                        placeholder="05XX XXX XXXX"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                    <input
                      type="email"
                      value={yeniOgrenci.email}
                      onChange={(e) => setYeniOgrenci(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                      placeholder="ogrenci@email.com"
                    />
                  </div>
                </div>

                {/* Veli Bilgileri */}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <UserCheck size={18} />
                    Veli Bilgileri
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Veli Adı Soyadı *</label>
                      <input
                        type="text"
                        value={yeniOgrenci.veliAd}
                        onChange={(e) => setYeniOgrenci(prev => ({ ...prev, veliAd: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                        placeholder="Veli adı soyadı"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Veli Telefonu *</label>
                      <input
                        type="tel"
                        value={yeniOgrenci.veliTelefon}
                        onChange={(e) => setYeniOgrenci(prev => ({ ...prev, veliTelefon: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                        placeholder="05XX XXX XXXX"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowOgrenciEkleModal(false);
                  setYeniOgrenci({ ad: '', soyad: '', sinif: '', telefon: '', veliAd: '', veliTelefon: '', email: '' });
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  // Yeni öğrenci ekleme
                  if (yeniOgrenci.ad && yeniOgrenci.soyad && yeniOgrenci.sinif && yeniOgrenci.veliAd && yeniOgrenci.veliTelefon) {
                    const newOgrenci = {
                      id: `new-${Date.now()}`,
                      ad: `${yeniOgrenci.ad} ${yeniOgrenci.soyad}`,
                      sinif: yeniOgrenci.sinif,
                      ortalama: 0,
                      devamsizlik: 0,
                      telefon: yeniOgrenci.telefon || '-',
                      veliAd: yeniOgrenci.veliAd,
                      veliTelefon: yeniOgrenci.veliTelefon,
                    };
                    setOgrenciListesi(prev => [newOgrenci, ...prev]);
                    setShowOgrenciEkleModal(false);
                    setYeniOgrenci({ ad: '', soyad: '', sinif: '', telefon: '', veliAd: '', veliTelefon: '', email: '' });
                  } else {
                    alert('Lütfen zorunlu alanları doldurun.');
                  }
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus size={18} />
                Öğrenci Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Öğrenci Silme Onay Modal - Sekreter */}
      {showSilOnayModal && silinecekOgrenci && personel.role === 'sekreter' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center gap-3 bg-red-600 text-white">
              <AlertCircle size={24} />
              <h3 className="text-xl font-bold">Kayıt Silme Onayı</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg">
                  {silinecekOgrenci.ad.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">{silinecekOgrenci.ad}</p>
                  <p className="text-slate-500">{silinecekOgrenci.sinif}</p>
                </div>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 font-medium mb-2">Dikkat!</p>
                <p className="text-red-700 text-sm">
                  Bu işlem geri alınamaz. Öğrencinin tüm kayıtları (not, devamsızlık, veli bilgileri vb.) sistemden kalıcı olarak silinecektir.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowSilOnayModal(false);
                  setSilinecekOgrenci(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  // Öğrenciyi listeden sil
                  setOgrenciListesi(prev => prev.filter(o => o.id !== silinecekOgrenci.id));
                  setShowSilOnayModal(false);
                  setSilinecekOgrenci(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Kaydı Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yoklama Modal - Sadece Öğretmen */}
      {showYoklamaModal && selectedDers && personel.role === 'ogretmen' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-blue-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Yoklama Al</h3>
                <p className="text-blue-100 text-sm mt-1">
                  {selectedDers.ders} - {selectedDers.sinif} • {selectedDers.saat}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowYoklamaModal(false);
                  setSelectedDers(null);
                }}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {ogrenciler.filter(o => o.sinif === selectedDers.sinif).length > 0 ? (
                  ogrenciler.filter(o => o.sinif === selectedDers.sinif).map((ogrenci) => (
                    <div key={ogrenci.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm">
                          {ogrenci.ad.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{ogrenci.ad}</p>
                          <p className="text-xs text-slate-500">Devamsızlık: {ogrenci.devamsizlik} gün</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setYoklamaDurumlari(prev => ({ ...prev, [ogrenci.id]: 'katildi' }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            yoklamaDurumlari[ogrenci.id] === 'katildi' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          <CheckCircle size={16} className="inline mr-1" />
                          Katıldı
                        </button>
                        <button 
                          onClick={() => setYoklamaDurumlari(prev => ({ ...prev, [ogrenci.id]: 'katilmadi' }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            yoklamaDurumlari[ogrenci.id] === 'katilmadi' 
                              ? 'bg-red-600 text-white' 
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          <AlertCircle size={16} className="inline mr-1" />
                          Katılmadı
                        </button>
                        <button 
                          onClick={() => setYoklamaDurumlari(prev => ({ ...prev, [ogrenci.id]: 'gec' }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            yoklamaDurumlari[ogrenci.id] === 'gec' 
                              ? 'bg-yellow-600 text-white' 
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        >
                          <Clock size={16} className="inline mr-1" />
                          Geç
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Bu sınıfta kayıtlı öğrenci bulunamadı.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowYoklamaModal(false);
                  setSelectedDers(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  // TODO: API call - yoklama kaydet
                  setShowYoklamaModal(false);
                  setSelectedDers(null);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Yoklamayı Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sınav Sonuçları Modal */}
      {showSinavSonuclariModal && selectedSinav && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div>
                <h3 className="text-xl font-bold">{selectedSinav.sinavAd} - Sonuçlar</h3>
                <p className="text-blue-100 text-sm mt-1">
                  {selectedSinav.sinif} • {selectedSinav.tarih} • {selectedSinav.ogrenciSonuclari.length} öğrenci
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSinavSonuclariModal(false);
                  setSelectedSinav(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Filtre */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white rounded-lg px-3 py-2 border border-slate-200 flex-1 max-w-xs">
                  <Search size={18} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Öğrenci ara..."
                    value={sonucFiltre}
                    onChange={(e) => setSonucFiltre(e.target.value)}
                    className="bg-transparent border-none outline-none px-2 text-sm w-full text-slate-800"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Sınıf Ort: %{selectedSinav.sinifOrtalamasi}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{selectedSinav.toplamSoru} Soru</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[55vh]">
              <div className="space-y-4">
                {selectedSinav.ogrenciSonuclari
                  .filter(o => o.ogrenciAd.toLowerCase().includes(sonucFiltre.toLowerCase()))
                  .map((sonuc) => (
                    <div key={sonuc.ogrenciId} className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {sonuc.ogrenciAd.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{sonuc.ogrenciAd}</h4>
                            <p className="text-sm text-slate-500">
                              <span className="text-green-600">{sonuc.dogru} doğru</span>
                              <span className="mx-2">•</span>
                              <span className="text-red-600">{sonuc.yanlis} yanlış</span>
                              <span className="mx-2">•</span>
                              <span className="text-slate-400">{sonuc.bos} boş</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${sonuc.puan >= 75 ? 'text-green-600' : sonuc.puan >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                            {sonuc.puan}
                          </p>
                          <p className="text-xs text-slate-500">Puan</p>
                        </div>
                      </div>
                      
                      {/* Hatalı Sorular */}
                      {sonuc.hataliSorular.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                            <XCircle size={14} />
                            Hatalı Sorular ({sonuc.hataliSorular.length} soru)
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {sonuc.hataliSorular.map((soruNo) => (
                              <span 
                                key={soruNo} 
                                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium"
                              >
                                Soru {soruNo}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setShowSinavSonuclariModal(false);
                  setSelectedSinav(null);
                }}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sınav Analiz Modal */}
      {showSinavAnalizModal && selectedSinav && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div>
                <h3 className="text-xl font-bold">{selectedSinav.sinavAd} - Analiz</h3>
                <p className="text-purple-100 text-sm mt-1">
                  Öğrenci karşılaştırma ve geçmiş sınav analizi
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSinavAnalizModal(false);
                  setSelectedSinav(null);
                  setKarsilastirmaOgrenci1(null);
                  setKarsilastirmaOgrenci2(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Öğrenci Seçimi */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-800 mb-3">Karşılaştırılacak Öğrencileri Seçin</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">1. Öğrenci</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-800"
                      value={karsilastirmaOgrenci1?.ogrenciId || ''}
                      onChange={(e) => {
                        const ogr = selectedSinav.ogrenciSonuclari.find(o => o.ogrenciId === e.target.value);
                        setKarsilastirmaOgrenci1(ogr || null);
                      }}
                    >
                      <option value="">Öğrenci seçin...</option>
                      {selectedSinav.ogrenciSonuclari.map((ogr) => (
                        <option key={ogr.ogrenciId} value={ogr.ogrenciId}>{ogr.ogrenciAd} - {ogr.puan} puan</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">2. Öğrenci</label>
                    <select 
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-800"
                      value={karsilastirmaOgrenci2?.ogrenciId || ''}
                      onChange={(e) => {
                        const ogr = selectedSinav.ogrenciSonuclari.find(o => o.ogrenciId === e.target.value);
                        setKarsilastirmaOgrenci2(ogr || null);
                      }}
                    >
                      <option value="">Öğrenci seçin...</option>
                      {selectedSinav.ogrenciSonuclari.map((ogr) => (
                        <option key={ogr.ogrenciId} value={ogr.ogrenciId}>{ogr.ogrenciAd} - {ogr.puan} puan</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Karşılaştırma Sonuçları */}
              {karsilastirmaOgrenci1 && karsilastirmaOgrenci2 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-6 border border-purple-100">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-purple-600" />
                    Karşılaştırma Sonucu
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Öğrenci 1 */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {karsilastirmaOgrenci1.ogrenciAd.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{karsilastirmaOgrenci1.ogrenciAd}</p>
                          <p className={`text-2xl font-bold ${karsilastirmaOgrenci1.puan >= karsilastirmaOgrenci2.puan ? 'text-green-600' : 'text-red-600'}`}>
                            {karsilastirmaOgrenci1.puan} puan
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Doğru:</span>
                          <span className="font-semibold text-green-600">{karsilastirmaOgrenci1.dogru}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Yanlış:</span>
                          <span className="font-semibold text-red-600">{karsilastirmaOgrenci1.yanlis}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Boş:</span>
                          <span className="font-semibold text-slate-500">{karsilastirmaOgrenci1.bos}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Öğrenci 2 */}
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {karsilastirmaOgrenci2.ogrenciAd.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{karsilastirmaOgrenci2.ogrenciAd}</p>
                          <p className={`text-2xl font-bold ${karsilastirmaOgrenci2.puan >= karsilastirmaOgrenci1.puan ? 'text-green-600' : 'text-red-600'}`}>
                            {karsilastirmaOgrenci2.puan} puan
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Doğru:</span>
                          <span className="font-semibold text-green-600">{karsilastirmaOgrenci2.dogru}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Yanlış:</span>
                          <span className="font-semibold text-red-600">{karsilastirmaOgrenci2.yanlis}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Boş:</span>
                          <span className="font-semibold text-slate-500">{karsilastirmaOgrenci2.bos}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fark Göstergesi */}
                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Puan Farkı:</span>
                      <span className={`text-lg font-bold ${Math.abs(karsilastirmaOgrenci1.puan - karsilastirmaOgrenci2.puan) > 20 ? 'text-red-600' : 'text-green-600'}`}>
                        {Math.abs(karsilastirmaOgrenci1.puan - karsilastirmaOgrenci2.puan)} puan
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        style={{ width: `${(karsilastirmaOgrenci1.puan / selectedSinav.toplamSoru) * 2.5}%` }}
                      />
                    </div>
                    <div className="mt-1 w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"
                        style={{ width: `${(karsilastirmaOgrenci2.puan / selectedSinav.toplamSoru) * 2.5}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Geçmiş Sınav Performansı Grafiği */}
              {(karsilastirmaOgrenci1 || karsilastirmaOgrenci2) && (
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-purple-600" />
                    Geçmiş Sınav Performansı
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {karsilastirmaOgrenci1 && (
                      <div>
                        <p className="font-medium text-slate-700 mb-3">{karsilastirmaOgrenci1.ogrenciAd}</p>
                        <div className="space-y-3">
                          {karsilastirmaOgrenci1.gecmisSinavlar.map((gs, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="text-sm text-slate-500 w-20">{gs.sinavAd}</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                                  style={{ width: `${gs.puan}%` }}
                                />
                              </div>
                              <span className="font-semibold text-slate-800 w-12 text-right">{gs.puan}</span>
                            </div>
                          ))}
                          {/* Mevcut sınav */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500 w-20">Bu Sınav</span>
                            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all"
                                style={{ width: `${karsilastirmaOgrenci1.puan}%` }}
                              />
                            </div>
                            <span className="font-semibold text-green-600 w-12 text-right">{karsilastirmaOgrenci1.puan}</span>
                          </div>
                        </div>
                        {/* Gelişim Göstergesi */}
                        {karsilastirmaOgrenci1.gecmisSinavlar.length > 0 && (
                          <div className={`mt-3 p-2 rounded-lg text-sm ${
                            karsilastirmaOgrenci1.puan > karsilastirmaOgrenci1.gecmisSinavlar[karsilastirmaOgrenci1.gecmisSinavlar.length - 1].puan
                              ? 'bg-green-50 text-green-700'
                              : karsilastirmaOgrenci1.puan < karsilastirmaOgrenci1.gecmisSinavlar[karsilastirmaOgrenci1.gecmisSinavlar.length - 1].puan
                              ? 'bg-red-50 text-red-700'
                              : 'bg-slate-50 text-slate-700'
                          }`}>
                            {karsilastirmaOgrenci1.puan > karsilastirmaOgrenci1.gecmisSinavlar[karsilastirmaOgrenci1.gecmisSinavlar.length - 1].puan
                              ? `↑ ${karsilastirmaOgrenci1.puan - karsilastirmaOgrenci1.gecmisSinavlar[karsilastirmaOgrenci1.gecmisSinavlar.length - 1].puan} puan yükseliş`
                              : karsilastirmaOgrenci1.puan < karsilastirmaOgrenci1.gecmisSinavlar[karsilastirmaOgrenci1.gecmisSinavlar.length - 1].puan
                              ? `↓ ${karsilastirmaOgrenci1.gecmisSinavlar[karsilastirmaOgrenci1.gecmisSinavlar.length - 1].puan - karsilastirmaOgrenci1.puan} puan düşüş`
                              : '→ Değişim yok'
                            }
                          </div>
                        )}
                      </div>
                    )}
                    {karsilastirmaOgrenci2 && (
                      <div>
                        <p className="font-medium text-slate-700 mb-3">{karsilastirmaOgrenci2.ogrenciAd}</p>
                        <div className="space-y-3">
                          {karsilastirmaOgrenci2.gecmisSinavlar.map((gs, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="text-sm text-slate-500 w-20">{gs.sinavAd}</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all"
                                  style={{ width: `${gs.puan}%` }}
                                />
                              </div>
                              <span className="font-semibold text-slate-800 w-12 text-right">{gs.puan}</span>
                            </div>
                          ))}
                          {/* Mevcut sınav */}
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500 w-20">Bu Sınav</span>
                            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all"
                                style={{ width: `${karsilastirmaOgrenci2.puan}%` }}
                              />
                            </div>
                            <span className="font-semibold text-green-600 w-12 text-right">{karsilastirmaOgrenci2.puan}</span>
                          </div>
                        </div>
                        {/* Gelişim Göstergesi */}
                        {karsilastirmaOgrenci2.gecmisSinavlar.length > 0 && (
                          <div className={`mt-3 p-2 rounded-lg text-sm ${
                            karsilastirmaOgrenci2.puan > karsilastirmaOgrenci2.gecmisSinavlar[karsilastirmaOgrenci2.gecmisSinavlar.length - 1].puan
                              ? 'bg-green-50 text-green-700'
                              : karsilastirmaOgrenci2.puan < karsilastirmaOgrenci2.gecmisSinavlar[karsilastirmaOgrenci2.gecmisSinavlar.length - 1].puan
                              ? 'bg-red-50 text-red-700'
                              : 'bg-slate-50 text-slate-700'
                          }`}>
                            {karsilastirmaOgrenci2.puan > karsilastirmaOgrenci2.gecmisSinavlar[karsilastirmaOgrenci2.gecmisSinavlar.length - 1].puan
                              ? `↑ ${karsilastirmaOgrenci2.puan - karsilastirmaOgrenci2.gecmisSinavlar[karsilastirmaOgrenci2.gecmisSinavlar.length - 1].puan} puan yükseliş`
                              : karsilastirmaOgrenci2.puan < karsilastirmaOgrenci2.gecmisSinavlar[karsilastirmaOgrenci2.gecmisSinavlar.length - 1].puan
                              ? `↓ ${karsilastirmaOgrenci2.gecmisSinavlar[karsilastirmaOgrenci2.gecmisSinavlar.length - 1].puan - karsilastirmaOgrenci2.puan} puan düşüş`
                              : '→ Değişim yok'
                            }
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Seçim yapılmadıysa bilgi mesajı */}
              {!karsilastirmaOgrenci1 && !karsilastirmaOgrenci2 && (
                <div className="text-center py-12 text-slate-500">
                  <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Karşılaştırma yapmak için öğrenci seçin</p>
                  <p className="text-sm mt-1">Yukarıdaki listelerden iki öğrenci seçerek detaylı analiz yapabilirsiniz.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setShowSinavAnalizModal(false);
                  setSelectedSinav(null);
                  setKarsilastirmaOgrenci1(null);
                  setKarsilastirmaOgrenci2(null);
                }}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sınav Sonucu Ekle Modal */}
      {showSinavSonucuEkleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div>
                <h3 className="text-xl font-bold">Sınav Sonucu Ekle</h3>
                <p className="text-blue-100 text-sm mt-1">Yeni sınav sonucu girişi</p>
              </div>
              <button
                onClick={() => setShowSinavSonucuEkleModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sınav Adı</label>
                  <input
                    type="text"
                    placeholder="Örn: Matematik Deneme Sınavı 4"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ders</label>
                    <select className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800">
                      <option value="">Seçin...</option>
                      <option value="matematik">Matematik</option>
                      <option value="fizik">Fizik</option>
                      <option value="kimya">Kimya</option>
                      <option value="biyoloji">Biyoloji</option>
                      <option value="turkce">Türkçe</option>
                      <option value="ingilizce">İngilizce</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sınıf</label>
                    <select className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800">
                      <option value="">Seçin...</option>
                      <option value="9-A">9-A</option>
                      <option value="9-B">9-B</option>
                      <option value="10-A">10-A</option>
                      <option value="10-B">10-B</option>
                      <option value="11-A">11-A</option>
                      <option value="12-C">12-C</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sınav Tarihi</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Toplam Soru Sayısı</label>
                    <input
                      type="number"
                      placeholder="40"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                    />
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700">
                    <strong>Not:</strong> Sınav sonuçları kaydedildikten sonra öğrenci bazlı puanları girebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowSinavSonucuEkleModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  // TODO: API call
                  setShowSinavSonucuEkleModal(false);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
