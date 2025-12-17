// Mock Data - Geliştirme için örnek veriler

export interface User {
  id: string;
  email: string;
  ad: string;
  soyad: string;
  telefon?: string;
  role: 'ADMIN' | 'MUDUR' | 'OGRETMEN' | 'SEKRETER' | 'OGRENCI';
  sinif?: string;
  brans?: string;
  ogrenciNo?: string;
}

export interface Ogretmen {
  id: string;
  ad: string;
  soyad: string;
  brans: string;
  telefon: string;
  email: string;
  fotograf?: string;
}

export interface Ders {
  id: string;
  ad: string;
  ogretmenId: string;
  ogretmenAd: string;
  gun: string;
  baslangicSaati: string;
  bitisSaati: string;
  sinif: string;
}

export interface SinavSonucu {
  id: string;
  sinavAd: string;
  ders: string;
  tarih: string;
  puan: number;
  toplamPuan: number;
  dogru: number;
  yanlis: number;
  bos: number;
  yuzde: number;
}

export interface Mesaj {
  id: string;
  gonderenId: string;
  gonderenAd: string;
  gonderenRole: string;
  baslik: string;
  mesaj: string;
  tarih: string;
  okundu: boolean;
}

export interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  tarih: string;
  okundu: boolean;
  tip: 'BILDIRIM' | 'ONAY_TALEBI' | 'SISTEM';
}

export interface Devamsizlik {
  id: string;
  dersAdi: string;
  tarih: string;
  aciklama?: string;
}

// Mock Öğretmenler
export const mockOgretmenler: Ogretmen[] = [
  {
    id: '1',
    ad: 'Mehmet',
    soyad: 'Demir',
    brans: 'Matematik',
    telefon: '0555 111 2233',
    email: 'mehmet.demir@edura.com',
  },
  {
    id: '2',
    ad: 'Ayşe',
    soyad: 'Yılmaz',
    brans: 'Türkçe',
    telefon: '0555 222 3344',
    email: 'ayse.yilmaz@edura.com',
  },
  {
    id: '3',
    ad: 'Fatma',
    soyad: 'Kaya',
    brans: 'İngilizce',
    telefon: '0555 333 4455',
    email: 'fatma.kaya@edura.com',
  },
  {
    id: '4',
    ad: 'Ali',
    soyad: 'Çelik',
    brans: 'Fen Bilimleri',
    telefon: '0555 444 5566',
    email: 'ali.celik@edura.com',
  },
  {
    id: '5',
    ad: 'Zeynep',
    soyad: 'Şahin',
    brans: 'Sosyal Bilgiler',
    telefon: '0555 555 6677',
    email: 'zeynep.sahin@edura.com',
  },
  {
    id: '6',
    ad: 'Emre',
    soyad: 'Öztürk',
    brans: 'Beden Eğitimi',
    telefon: '0555 666 7788',
    email: 'emre.ozturk@edura.com',
  },
];

// Mock Dersler
export const mockDersler: Ders[] = [
  { 
    id: '1', 
    ad: 'Matematik', 
    ogretmenId: '1',
    ogretmenAd: 'Mehmet Demir', 
    gun: 'Pazartesi', 
    baslangicSaati: '09:00', 
    bitisSaati: '10:30', 
    sinif: '8-A' 
  },
  { 
    id: '2', 
    ad: 'Türkçe', 
    ogretmenId: '2',
    ogretmenAd: 'Ayşe Yılmaz', 
    gun: 'Pazartesi', 
    baslangicSaati: '10:45', 
    bitisSaati: '12:15', 
    sinif: '8-A' 
  },
  { 
    id: '3', 
    ad: 'İngilizce', 
    ogretmenId: '3',
    ogretmenAd: 'Fatma Kaya', 
    gun: 'Salı', 
    baslangicSaati: '09:00', 
    bitisSaati: '10:30', 
    sinif: '8-A' 
  },
  { 
    id: '4', 
    ad: 'Fen Bilimleri', 
    ogretmenId: '4',
    ogretmenAd: 'Ali Çelik', 
    gun: 'Çarşamba', 
    baslangicSaati: '09:00', 
    bitisSaati: '10:30', 
    sinif: '8-A' 
  },
  { 
    id: '5', 
    ad: 'Sosyal Bilgiler', 
    ogretmenId: '5',
    ogretmenAd: 'Zeynep Şahin', 
    gun: 'Perşembe', 
    baslangicSaati: '10:45', 
    bitisSaati: '12:15', 
    sinif: '8-A' 
  },
  { 
    id: '6', 
    ad: 'Beden Eğitimi', 
    ogretmenId: '6',
    ogretmenAd: 'Emre Öztürk', 
    gun: 'Cuma', 
    baslangicSaati: '13:00', 
    bitisSaati: '14:30', 
    sinif: '8-A' 
  },
];

// Mock Sınav Sonuçları
export const mockSinavSonuclari: SinavSonucu[] = [
  {
    id: '1',
    sinavAd: '1. Deneme Sınavı',
    ders: 'Matematik',
    tarih: '2024-12-01',
    puan: 85,
    toplamPuan: 100,
    dogru: 34,
    yanlis: 4,
    bos: 2,
    yuzde: 85,
  },
  {
    id: '2',
    sinavAd: '1. Deneme Sınavı',
    ders: 'Türkçe',
    tarih: '2024-12-01',
    puan: 78,
    toplamPuan: 100,
    dogru: 31,
    yanlis: 6,
    bos: 3,
    yuzde: 78,
  },
  {
    id: '3',
    sinavAd: '1. Deneme Sınavı',
    ders: 'Fen Bilimleri',
    tarih: '2024-12-01',
    puan: 92,
    toplamPuan: 100,
    dogru: 37,
    yanlis: 2,
    bos: 1,
    yuzde: 92,
  },
  {
    id: '4',
    sinavAd: '2. Deneme Sınavı',
    ders: 'Matematik',
    tarih: '2024-12-08',
    puan: 88,
    toplamPuan: 100,
    dogru: 35,
    yanlis: 3,
    bos: 2,
    yuzde: 88,
  },
  {
    id: '5',
    sinavAd: '2. Deneme Sınavı',
    ders: 'İngilizce',
    tarih: '2024-12-08',
    puan: 82,
    toplamPuan: 100,
    dogru: 33,
    yanlis: 5,
    bos: 2,
    yuzde: 82,
  },
  {
    id: '6',
    sinavAd: '2. Deneme Sınavı',
    ders: 'Sosyal Bilgiler',
    tarih: '2024-12-08',
    puan: 75,
    toplamPuan: 100,
    dogru: 30,
    yanlis: 7,
    bos: 3,
    yuzde: 75,
  },
];

// Mock Mesajlar
export const mockMesajlar: Mesaj[] = [
  {
    id: '1',
    gonderenId: '1',
    gonderenAd: 'Mehmet Demir',
    gonderenRole: 'Öğretmen',
    baslik: 'Ödev Hatırlatması',
    mesaj: 'Matematik ödevini yarına kadar teslim etmeyi unutma.',
    tarih: '2024-12-16',
    okundu: false,
  },
  {
    id: '2',
    gonderenAd: 'Ayşe Yılmaz',
    gonderenId: '2',
    gonderenRole: 'Öğretmen',
    baslik: 'Kompozisyon Konusu',
    mesaj: 'Gelecek hafta kompozisyon yazacağız. Konu: "Hayallerim"',
    tarih: '2024-12-15',
    okundu: false,
  },
  {
    id: '3',
    gonderenId: '3',
    gonderenAd: 'Fatma Kaya',
    gonderenRole: 'Öğretmen',
    baslik: 'İngilizce Sınavı',
    mesaj: 'Cuma günü İngilizce sınavımız var. Hazırlanın.',
    tarih: '2024-12-14',
    okundu: true,
  },
];

// Mock Bildirimler
export const mockBildirimler: Bildirim[] = [
  {
    id: '1',
    baslik: 'Sınav Tarihi Duyurusu',
    mesaj: 'Matematik sınavı 20 Aralık\'ta yapılacaktır.',
    tarih: '2024-12-15',
    okundu: false,
    tip: 'BILDIRIM',
  },
  {
    id: '2',
    baslik: 'Ders İptal',
    mesaj: 'Yarın Beden Eğitimi dersi iptal edilmiştir.',
    tarih: '2024-12-14',
    okundu: false,
    tip: 'SISTEM',
  },
  {
    id: '3',
    baslik: 'Not Açıklanması',
    mesaj: 'Türkçe sınav sonuçları açıklanmıştır.',
    tarih: '2024-12-10',
    okundu: true,
    tip: 'BILDIRIM',
  },
];

// Mock Devamsızlıklar
export const mockDevamsizliklar: Devamsizlik[] = [
  {
    id: '1',
    dersAdi: 'Matematik',
    tarih: '2024-12-10',
    aciklama: 'Hastalık',
  },
  {
    id: '2',
    dersAdi: 'İngilizce',
    tarih: '2024-12-05',
  },
];

// Mock Öğrenci Profili
export const mockOgrenci = {
  id: '1',
  ad: 'Ahmet',
  soyad: 'Yılmaz',
  sinif: '8-A',
  email: 'ahmet@example.com',
  telefon: '0555 123 4567',
  dogumTarihi: '2009-05-15',
  seviye: 8,
  ogrenciNo: '20240001',
};
