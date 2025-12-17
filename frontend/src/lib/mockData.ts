// Mock Data - Geliştirme için örnek veriler
// 5 Kurs (Şube) - Her kursta ortaokul ve lise sınıfları
// Her sınıf için 10 öğrenci, 3 deneme sınavı

export interface User {
  id: string;
  email: string;
  ad: string;
  soyad: string;
  telefon?: string;
  role: 'ADMIN' | 'MUDUR' | 'OGRETMEN' | 'SEKRETER' | 'OGRENCI';
  sinif?: string;
  sinifId?: string;
  brans?: string;
  ogrenciNo?: string;
  kursId?: string;
  kursAd?: string;
}

export interface Kurs {
  id: string;
  ad: string;
  adres: string;
  telefon: string;
}

export interface Sinif {
  id: string;
  ad: string;
  seviye: number;
  tip: 'ORTAOKUL' | 'LISE';
  kursId: string;
}

export interface Ogretmen {
  id: string;
  ad: string;
  soyad: string;
  brans: string;
  telefon: string;
  email: string;
  kursId?: string;
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
  sinifId: string;
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

// ==================== KURSLAR ====================
export const mockKurslar: Kurs[] = [
  { id: '1', ad: 'Edura Merkez', adres: 'Atatürk Cad. No:1, Ankara', telefon: '0312 111 1111' },
  { id: '2', ad: 'Edura Çankaya', adres: 'Kızılay Mah. No:45, Ankara', telefon: '0312 222 2222' },
  { id: '3', ad: 'Edura Keçiören', adres: 'Etlik Cad. No:78, Ankara', telefon: '0312 333 3333' },
  { id: '4', ad: 'Edura Yenimahalle', adres: 'Demetevler Sok. No:23, Ankara', telefon: '0312 444 4444' },
  { id: '5', ad: 'Edura Mamak', adres: 'Ege Mah. No:67, Ankara', telefon: '0312 555 5555' },
];

// ==================== SINIFLAR ====================
// Her kursta hem ortaokul (5,6,7,8) hem lise (9,10,11,12) sınıfları var
const sinifSeviyeleri = [
  { seviye: 5, tip: 'ORTAOKUL' as const },
  { seviye: 6, tip: 'ORTAOKUL' as const },
  { seviye: 7, tip: 'ORTAOKUL' as const },
  { seviye: 8, tip: 'ORTAOKUL' as const },
  { seviye: 9, tip: 'LISE' as const },
  { seviye: 10, tip: 'LISE' as const },
  { seviye: 11, tip: 'LISE' as const },
  { seviye: 12, tip: 'LISE' as const },
];

export const mockSiniflar: Sinif[] = [];
mockKurslar.forEach((kurs, kursIndex) => {
  sinifSeviyeleri.forEach((seviye) => {
    mockSiniflar.push({
      id: `sinif-${kursIndex}-${seviye.seviye}`,
      ad: `${seviye.seviye}-A`,
      seviye: seviye.seviye,
      tip: seviye.tip,
      kursId: kurs.id,
    });
  });
});

// ==================== MÜDÜRLER ====================
// Her kurs için 1 müdür (toplam 5 müdür)
export const mockMudurler: User[] = [
  { id: 'm1', ad: 'Ahmet', soyad: 'Yıldırım', email: 'ahmet.yildirim@edura.com', telefon: '0555 100 0001', role: 'MUDUR', kursId: '1', kursAd: 'Edura Merkez' },
  { id: 'm2', ad: 'Mehmet', soyad: 'Aydın', email: 'mehmet.aydin@edura.com', telefon: '0555 100 0002', role: 'MUDUR', kursId: '2', kursAd: 'Edura Çankaya' },
  { id: 'm3', ad: 'Ali', soyad: 'Kaya', email: 'ali.kaya@edura.com', telefon: '0555 100 0003', role: 'MUDUR', kursId: '3', kursAd: 'Edura Keçiören' },
  { id: 'm4', ad: 'Mustafa', soyad: 'Çelik', email: 'mustafa.celik@edura.com', telefon: '0555 100 0004', role: 'MUDUR', kursId: '4', kursAd: 'Edura Yenimahalle' },
  { id: 'm5', ad: 'Hasan', soyad: 'Özkan', email: 'hasan.ozkan@edura.com', telefon: '0555 100 0005', role: 'MUDUR', kursId: '5', kursAd: 'Edura Mamak' },
];

// ==================== SEKRETERLER ====================
// Her kurs için 1 sekreter (toplam 5 sekreter)
export const mockSekreterler: User[] = [
  { id: 's1', ad: 'Ayşe', soyad: 'Demir', email: 'ayse.demir@edura.com', telefon: '0555 200 0001', role: 'SEKRETER', kursId: '1', kursAd: 'Edura Merkez' },
  { id: 's2', ad: 'Fatma', soyad: 'Şahin', email: 'fatma.sahin@edura.com', telefon: '0555 200 0002', role: 'SEKRETER', kursId: '2', kursAd: 'Edura Çankaya' },
  { id: 's3', ad: 'Zeynep', soyad: 'Yılmaz', email: 'zeynep.yilmaz@edura.com', telefon: '0555 200 0003', role: 'SEKRETER', kursId: '3', kursAd: 'Edura Keçiören' },
  { id: 's4', ad: 'Elif', soyad: 'Arslan', email: 'elif.arslan@edura.com', telefon: '0555 200 0004', role: 'SEKRETER', kursId: '4', kursAd: 'Edura Yenimahalle' },
  { id: 's5', ad: 'Merve', soyad: 'Koç', email: 'merve.koc@edura.com', telefon: '0555 200 0005', role: 'SEKRETER', kursId: '5', kursAd: 'Edura Mamak' },
];

// ==================== ÖĞRETMENLER ====================
// Her branş için her kursta 1 öğretmen (6 branş x 5 kurs = 30 öğretmen)
const branslar = ['Matematik', 'Türkçe', 'İngilizce', 'Fen Bilimleri', 'Sosyal Bilgiler', 'Fizik'];

export const mockOgretmenler: Ogretmen[] = [];
let ogretmenIdCounter = 1;

const ogretmenAdlari = [
  'Mehmet', 'Ali', 'Ahmet', 'Mustafa', 'Hüseyin', 'İbrahim',
  'Ayşe', 'Fatma', 'Emine', 'Hatice', 'Zeynep', 'Elif',
  'Can', 'Cem', 'Deniz', 'Ege', 'Berk', 'Arda',
  'Selin', 'Defne', 'Ece', 'Gizem', 'Naz', 'Duru',
];

const ogretmenSoyadlari = [
  'Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız',
  'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Kılıç', 'Çetin',
  'Polat', 'Aksoy', 'Erdoğan', 'Ünal', 'Koç', 'Kurt',
];

mockKurslar.forEach((kurs, kursIndex) => {
  branslar.forEach((brans, bransIndex) => {
    const adIndex = (kursIndex * 6 + bransIndex) % ogretmenAdlari.length;
    const soyadIndex = (kursIndex * 6 + bransIndex) % ogretmenSoyadlari.length;
    
    mockOgretmenler.push({
      id: `og${ogretmenIdCounter}`,
      ad: ogretmenAdlari[adIndex],
      soyad: ogretmenSoyadlari[soyadIndex],
      brans,
      telefon: `0555 ${300 + kursIndex}${(bransIndex + 10).toString().padStart(2, '0')} ${(ogretmenIdCounter).toString().padStart(4, '0')}`,
      email: `${ogretmenAdlari[adIndex].toLowerCase()}.${ogretmenSoyadlari[soyadIndex].toLowerCase()}@edura.com`,
      kursId: kurs.id,
    });
    ogretmenIdCounter++;
  });
});

// ==================== ÖĞRENCİLER ====================
// Her kurs ve her sınıf için 10 öğrenci (5 kurs x 8 sınıf x 10 öğrenci = 400 öğrenci)
// Sadece örnek olarak ilk kursun ilk 2 sınıfını detaylı gösterelim
export const mockOgrenciler: User[] = [];
let ogrenciCounter = 1;

const ogrenciAdlari = [
  'Ahmet', 'Mehmet', 'Ali', 'Ayşe', 'Fatma', 'Mustafa', 'Zeynep', 'Elif', 'Can', 'Deniz',
  'Ece', 'Arda', 'Berk', 'Defne', 'Ege', 'Gizem', 'Hakan', 'İrem', 'Kerem', 'Lara',
  'Mert', 'Naz', 'Oğuz', 'Pelin', 'Selin', 'Tuna', 'Umut', 'Yağmur', 'Burak', 'Ceren',
  'Doruk', 'Emir', 'Eren', 'Furkan', 'Gökhan', 'Hande', 'İpek', 'Kaan', 'Melih', 'Onur',
];

const ogrenciSoyadlari = [
  'Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Yıldız',
];

// Her sınıf için 10 öğrenci oluştur
mockSiniflar.forEach((sinif, sinifIndex) => {
  for (let i = 0; i < 10; i++) {
    const adIndex = (ogrenciCounter + i) % ogrenciAdlari.length;
    const soyadIndex = (ogrenciCounter + i) % ogrenciSoyadlari.length;
    
    mockOgrenciler.push({
      id: `ogr${ogrenciCounter}`,
      ad: ogrenciAdlari[adIndex],
      soyad: ogrenciSoyadlari[soyadIndex],
      email: `ogrenci${ogrenciCounter}@edura.com`,
      telefon: `0555 ${400 + Math.floor(ogrenciCounter / 100)} ${(ogrenciCounter % 100).toString().padStart(3, '0')} ${(i + 10).toString().padStart(2, '0')}`,
      role: 'OGRENCI',
      sinifId: sinif.id,
      sinif: sinif.ad,
      ogrenciNo: `2024${(ogrenciCounter).toString().padStart(4, '0')}`,
      kursId: sinif.kursId,
    });
    ogrenciCounter++;
  }
});

// ==================== ÖRNEK ÖĞRENCİ (Giriş yapan) ====================
export const mockOgrenci = {
  id: 'ogr1',
  ad: 'Ahmet',
  soyad: 'Yılmaz',
  sinif: '8-A',
  sinifId: 'sinif-0-8',
  email: 'ahmet.yilmaz@example.com',
  telefon: '0555 123 4567',
  dogumTarihi: '2009-05-15',
  seviye: 8,
  ogrenciNo: '20240001',
  kursId: '1',
  kursAd: 'Edura Merkez',
};

// ==================== DERSLER ====================
// Örnek: 8-A sınıfının ders programı
export const mockDersler: Ders[] = [
  { 
    id: '1', 
    ad: 'Matematik', 
    ogretmenId: 'og1',
    ogretmenAd: mockOgretmenler.find(o => o.id === 'og1')?.ad + ' ' + mockOgretmenler.find(o => o.id === 'og1')?.soyad || 'Öğretmen',
    gun: 'Pazartesi', 
    baslangicSaati: '09:00', 
    bitisSaati: '10:30', 
    sinif: '8-A',
    sinifId: 'sinif-0-8',
  },
  { 
    id: '2', 
    ad: 'Türkçe', 
    ogretmenId: 'og2',
    ogretmenAd: mockOgretmenler.find(o => o.id === 'og2')?.ad + ' ' + mockOgretmenler.find(o => o.id === 'og2')?.soyad || 'Öğretmen',
    gun: 'Pazartesi', 
    baslangicSaati: '10:45', 
    bitisSaati: '12:15', 
    sinif: '8-A',
    sinifId: 'sinif-0-8',
  },
  { 
    id: '3', 
    ad: 'İngilizce', 
    ogretmenId: 'og3',
    ogretmenAd: mockOgretmenler.find(o => o.id === 'og3')?.ad + ' ' + mockOgretmenler.find(o => o.id === 'og3')?.soyad || 'Öğretmen',
    gun: 'Salı', 
    baslangicSaati: '09:00', 
    bitisSaati: '10:30', 
    sinif: '8-A',
    sinifId: 'sinif-0-8',
  },
  { 
    id: '4', 
    ad: 'Fen Bilimleri', 
    ogretmenId: 'og4',
    ogretmenAd: mockOgretmenler.find(o => o.id === 'og4')?.ad + ' ' + mockOgretmenler.find(o => o.id === 'og4')?.soyad || 'Öğretmen',
    gun: 'Çarşamba', 
    baslangicSaati: '09:00', 
    bitisSaati: '10:30', 
    sinif: '8-A',
    sinifId: 'sinif-0-8',
  },
  { 
    id: '5', 
    ad: 'Sosyal Bilgiler', 
    ogretmenId: 'og5',
    ogretmenAd: mockOgretmenler.find(o => o.id === 'og5')?.ad + ' ' + mockOgretmenler.find(o => o.id === 'og5')?.soyad || 'Öğretmen',
    gun: 'Perşembe', 
    baslangicSaati: '10:45', 
    bitisSaati: '12:15', 
    sinif: '8-A',
    sinifId: 'sinif-0-8',
  },
  { 
    id: '6', 
    ad: 'Fizik', 
    ogretmenId: 'og6',
    ogretmenAd: mockOgretmenler.find(o => o.id === 'og6')?.ad + ' ' + mockOgretmenler.find(o => o.id === 'og6')?.soyad || 'Öğretmen',
    gun: 'Cuma', 
    baslangicSaati: '13:00', 
    bitisSaati: '14:30', 
    sinif: '8-A',
    sinifId: 'sinif-0-8',
  },
];

// ==================== SINAV SONUÇLARI ====================
// Her kurs ve her sınıf için 3 deneme sınavı
// Örnek: 8-A sınıfının 3 deneme sonuçları
export const mockSinavSonuclari: SinavSonucu[] = [
  // 1. Deneme
  { id: 's1', sinavAd: '1. Deneme Sınavı', ders: 'Matematik', tarih: '2024-12-01', puan: 85, toplamPuan: 100, dogru: 34, yanlis: 4, bos: 2, yuzde: 85 },
  { id: 's2', sinavAd: '1. Deneme Sınavı', ders: 'Türkçe', tarih: '2024-12-01', puan: 78, toplamPuan: 100, dogru: 31, yanlis: 6, bos: 3, yuzde: 78 },
  { id: 's3', sinavAd: '1. Deneme Sınavı', ders: 'İngilizce', tarih: '2024-12-01', puan: 82, toplamPuan: 100, dogru: 33, yanlis: 5, bos: 2, yuzde: 82 },
  { id: 's4', sinavAd: '1. Deneme Sınavı', ders: 'Fen Bilimleri', tarih: '2024-12-01', puan: 92, toplamPuan: 100, dogru: 37, yanlis: 2, bos: 1, yuzde: 92 },
  { id: 's5', sinavAd: '1. Deneme Sınavı', ders: 'Sosyal Bilgiler', tarih: '2024-12-01', puan: 75, toplamPuan: 100, dogru: 30, yanlis: 7, bos: 3, yuzde: 75 },
  
  // 2. Deneme
  { id: 's6', sinavAd: '2. Deneme Sınavı', ders: 'Matematik', tarih: '2024-12-08', puan: 88, toplamPuan: 100, dogru: 35, yanlis: 3, bos: 2, yuzde: 88 },
  { id: 's7', sinavAd: '2. Deneme Sınavı', ders: 'Türkçe', tarih: '2024-12-08', puan: 80, toplamPuan: 100, dogru: 32, yanlis: 5, bos: 3, yuzde: 80 },
  { id: 's8', sinavAd: '2. Deneme Sınavı', ders: 'İngilizce', tarih: '2024-12-08', puan: 85, toplamPuan: 100, dogru: 34, yanlis: 4, bos: 2, yuzde: 85 },
  { id: 's9', sinavAd: '2. Deneme Sınavı', ders: 'Fen Bilimleri', tarih: '2024-12-08', puan: 90, toplamPuan: 100, dogru: 36, yanlis: 3, bos: 1, yuzde: 90 },
  { id: 's10', sinavAd: '2. Deneme Sınavı', ders: 'Sosyal Bilgiler', tarih: '2024-12-08', puan: 77, toplamPuan: 100, dogru: 31, yanlis: 6, bos: 3, yuzde: 77 },
  
  // 3. Deneme
  { id: 's11', sinavAd: '3. Deneme Sınavı', ders: 'Matematik', tarih: '2024-12-15', puan: 91, toplamPuan: 100, dogru: 36, yanlis: 2, bos: 2, yuzde: 91 },
  { id: 's12', sinavAd: '3. Deneme Sınavı', ders: 'Türkçe', tarih: '2024-12-15', puan: 83, toplamPuan: 100, dogru: 33, yanlis: 4, bos: 3, yuzde: 83 },
  { id: 's13', sinavAd: '3. Deneme Sınavı', ders: 'İngilizce', tarih: '2024-12-15', puan: 87, toplamPuan: 100, dogru: 35, yanlis: 3, bos: 2, yuzde: 87 },
  { id: 's14', sinavAd: '3. Deneme Sınavı', ders: 'Fen Bilimleri', tarih: '2024-12-15', puan: 94, toplamPuan: 100, dogru: 38, yanlis: 1, bos: 1, yuzde: 94 },
  { id: 's15', sinavAd: '3. Deneme Sınavı', ders: 'Sosyal Bilgiler', tarih: '2024-12-15', puan: 79, toplamPuan: 100, dogru: 32, yanlis: 5, bos: 3, yuzde: 79 },
];

// ==================== MESAJLAR ====================
export const mockMesajlar: Mesaj[] = [
  {
    id: '1',
    gonderenId: 'og1',
    gonderenAd: mockOgretmenler[0].ad + ' ' + mockOgretmenler[0].soyad,
    gonderenRole: 'Öğretmen',
    baslik: 'Matematik Ödevi',
    mesaj: 'Matematik ödevini yarına kadar teslim etmeyi unutma.',
    tarih: '2024-12-16',
    okundu: false,
  },
  {
    id: '2',
    gonderenAd: mockOgretmenler[1].ad + ' ' + mockOgretmenler[1].soyad,
    gonderenId: 'og2',
    gonderenRole: 'Öğretmen',
    baslik: 'Kompozisyon Konusu',
    mesaj: 'Gelecek hafta kompozisyon yazacağız. Konu: "Hayallerim"',
    tarih: '2024-12-15',
    okundu: false,
  },
  {
    id: '3',
    gonderenId: 'og3',
    gonderenAd: mockOgretmenler[2].ad + ' ' + mockOgretmenler[2].soyad,
    gonderenRole: 'Öğretmen',
    baslik: 'İngilizce Sınavı',
    mesaj: 'Cuma günü İngilizce sınavımız var. Hazırlanın.',
    tarih: '2024-12-14',
    okundu: true,
  },
];

// ==================== BİLDİRİMLER ====================
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
    baslik: 'Tatil Bildirimi',
    mesaj: 'Yarın resmi tatil olduğu için dersler yapılmayacaktır.',
    tarih: '2024-12-14',
    okundu: false,
    tip: 'SISTEM',
  },
  {
    id: '3',
    baslik: 'Not Açıklanması',
    mesaj: '3. Deneme sınav sonuçları açıklanmıştır.',
    tarih: '2024-12-10',
    okundu: true,
    tip: 'BILDIRIM',
  },
];

// ==================== DEVAMSIZLIKLAR ====================
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

// ==================== İSTATİSTİKLER ====================
export const mockIstatistikler = {
  toplamKurs: mockKurslar.length,
  toplamMudur: mockMudurler.length,
  toplamSekreter: mockSekreterler.length,
  toplamOgretmen: mockOgretmenler.length,
  toplamOgrenci: mockOgrenciler.length,
  toplamSinif: mockSiniflar.length,
  ortaokulSinifSayisi: mockSiniflar.filter(s => s.tip === 'ORTAOKUL').length,
  liseSinifSayisi: mockSiniflar.filter(s => s.tip === 'LISE').length,
};

console.log('📊 Mock Data İstatistikleri:', mockIstatistikler);
