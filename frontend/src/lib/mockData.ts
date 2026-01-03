// Mock Data - Geliştirme için örnek veriler
// 5 Kurs (Şube) - Her kursta ortaokul ve lise sınıfları (5-12)
// Her sınıf türü için A (10 kişi) ve B (8 kişi) şubesi = 18 öğrenci
// Toplam: 5 kurs × 8 sınıf türü × 18 öğrenci = 720 öğrenci

// ==================== INTERFACES ====================
export interface User {
  id: string;
  email: string;
  ad: string;
  soyad: string;
  telefon?: string;
  role: 'admin' | 'mudur' | 'ogretmen' | 'sekreter' | 'ogrenci';
  sinif?: string;
  sinifId?: string;
  brans?: string;
  ogrenciNo?: string;
  kursId?: string;
  kursAd?: string;
  ortalama?: number; // Öğrenci ortalaması (A/B şube dağılımı için)
}

export interface Kurs {
  id: string;
  ad: string;
  kod: string; // Kısa kod: zambak, lale, papatya, menekse, gul
  adres: string;
  telefon: string;
  ilce: string;
}

export interface Sinif {
  id: string;
  ad: string;
  seviye: number;
  sube: 'A' | 'B';
  tip: 'ORTAOKUL' | 'LISE';
  kursId: string;
  kontenjan: number; // A: 10, B: 8
}

export interface Ogretmen {
  id: string;
  ad: string;
  soyad: string;
  brans: string;
  telefon: string;
  email: string;
  kursId: string;
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

// ==================== EDURA BYPASS - TEST GİRİŞLERİ ====================
export const eduraBypass = {
  // Her kurs için test kullanıcıları
  admin: { email: 'admin@edura.com', password: 'edura123', role: 'admin' },
  mudurler: [
    { email: 'mudur.zambak@edura.com', password: 'edura123', kursId: '1', kursAd: 'Maltepe Zambak' },
    { email: 'mudur.lale@edura.com', password: 'edura123', kursId: '2', kursAd: 'Kadıköy Lale' },
    { email: 'mudur.papatya@edura.com', password: 'edura123', kursId: '3', kursAd: 'Ataşehir Papatya' },
    { email: 'mudur.menekse@edura.com', password: 'edura123', kursId: '4', kursAd: 'Yenisahra Menekşe' },
    { email: 'mudur.gul@edura.com', password: 'edura123', kursId: '5', kursAd: 'Üsküdar Gül' },
  ],
  sekreterler: [
    { email: 'sekreter.zambak@edura.com', password: 'edura123', kursId: '1' },
    { email: 'sekreter.lale@edura.com', password: 'edura123', kursId: '2' },
    { email: 'sekreter.papatya@edura.com', password: 'edura123', kursId: '3' },
    { email: 'sekreter.menekse@edura.com', password: 'edura123', kursId: '4' },
    { email: 'sekreter.gul@edura.com', password: 'edura123', kursId: '5' },
  ],
  ogretmenler: [
    { email: 'matematik.zambak@edura.com', password: 'edura123', kursId: '1', brans: 'Matematik' },
    { email: 'turkce.zambak@edura.com', password: 'edura123', kursId: '1', brans: 'Türkçe' },
  ],
  ogrenciler: [
    // Her sınıf türünden örnek öğrenci
    { email: 'ogrenci.5a@edura.com', password: 'edura123', sinif: '5-A', kursId: '1' },
    { email: 'ogrenci.6a@edura.com', password: 'edura123', sinif: '6-A', kursId: '1' },
    { email: 'ogrenci.7a@edura.com', password: 'edura123', sinif: '7-A', kursId: '1' },
    { email: 'ogrenci.8a@edura.com', password: 'edura123', sinif: '8-A', kursId: '1' },
    { email: 'ogrenci.9a@edura.com', password: 'edura123', sinif: '9-A', kursId: '1' },
    { email: 'ogrenci.10a@edura.com', password: 'edura123', sinif: '10-A', kursId: '1' },
    { email: 'ogrenci.11a@edura.com', password: 'edura123', sinif: '11-A', kursId: '1' },
    { email: 'ogrenci.12a@edura.com', password: 'edura123', sinif: '12-A', kursId: '1' },
  ],
};

// ==================== KURSLAR (5 Şube) ====================
export const mockKurslar: Kurs[] = [
  { 
    id: '1', 
    ad: 'Maltepe Zambak', 
    kod: 'zambak',
    adres: 'Cevizli Mah. Tugay Yolu Cad. No:45, Maltepe/İstanbul', 
    telefon: '0216 441 1111',
    ilce: 'Maltepe'
  },
  { 
    id: '2', 
    ad: 'Kadıköy Lale', 
    kod: 'lale',
    adres: 'Caferağa Mah. Moda Cad. No:78, Kadıköy/İstanbul', 
    telefon: '0216 442 2222',
    ilce: 'Kadıköy'
  },
  { 
    id: '3', 
    ad: 'Ataşehir Papatya', 
    kod: 'papatya',
    adres: 'Küçükbakkalköy Mah. Kayışdağı Cad. No:23, Ataşehir/İstanbul', 
    telefon: '0216 443 3333',
    ilce: 'Ataşehir'
  },
  { 
    id: '4', 
    ad: 'Yenisahra Menekşe', 
    kod: 'menekse',
    adres: 'Yenisahra Mah. Şehit Hakan Sok. No:12, Ataşehir/İstanbul', 
    telefon: '0216 444 4444',
    ilce: 'Yenisahra'
  },
  { 
    id: '5', 
    ad: 'Üsküdar Gül', 
    kod: 'gul',
    adres: 'Altunizade Mah. Kısıklı Cad. No:56, Üsküdar/İstanbul', 
    telefon: '0216 445 5555',
    ilce: 'Üsküdar'
  },
];

// ==================== SINIFLAR ====================
// Her kurs için: 8 seviye (5-12) × 2 şube (A,B) = 16 sınıf
// Toplam: 5 kurs × 16 sınıf = 80 sınıf
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

const subeler: Array<{ sube: 'A' | 'B'; kontenjan: number }> = [
  { sube: 'A', kontenjan: 10 }, // İlk 10 öğrenci (ortalamaya göre)
  { sube: 'B', kontenjan: 8 },  // Kalan 8 öğrenci
];

export const mockSiniflar: Sinif[] = [];
mockKurslar.forEach((kurs) => {
  sinifSeviyeleri.forEach((seviye) => {
    subeler.forEach((subeInfo) => {
      mockSiniflar.push({
        id: `sinif-${kurs.id}-${seviye.seviye}-${subeInfo.sube}`,
        ad: `${seviye.seviye}-${subeInfo.sube}`,
        seviye: seviye.seviye,
        sube: subeInfo.sube,
        tip: seviye.tip,
        kursId: kurs.id,
        kontenjan: subeInfo.kontenjan,
      });
    });
  });
});

// ==================== MÜDÜRLER ====================
// Her kurs için 1 müdür (toplam 5 müdür)
// NOT: Müdürler ayrı kişiler, öğretmenlerle karışmıyor
const mudurAdlari = [
  { ad: 'Hasan', soyad: 'Yıldırım', brans: 'Matematik' }, // Branş bilgisi sadece ek bilgi, ayrı öğretmen var
  { ad: 'Mehmet', soyad: 'Aydın', brans: null },
  { ad: 'Kemal', soyad: 'Özdemir', brans: 'Fizik' }, // Branş bilgisi sadece ek bilgi, ayrı öğretmen var
  { ad: 'Serkan', soyad: 'Çelik', brans: null },
  { ad: 'Burak', soyad: 'Koçak', brans: null },
];

export const mockMudurler: User[] = mockKurslar.map((kurs, index) => ({
  id: `m${index + 1}`,
  ad: mudurAdlari[index].ad,
  soyad: mudurAdlari[index].soyad,
  email: `mudur.${kurs.kod}@edura.com`,
  telefon: `0555 100 000${index + 1}`,
  role: 'mudur' as const,
  kursId: kurs.id,
  kursAd: kurs.ad,
  brans: mudurAdlari[index].brans || undefined,
}));

// ==================== SEKRETERLER ====================
// Her kurs için 1 sekreter (toplam 5 sekreter)
const sekreterAdlari = [
  { ad: 'Ayşe', soyad: 'Demir' },
  { ad: 'Fatma', soyad: 'Şahin' },
  { ad: 'Zeynep', soyad: 'Yılmaz' },
  { ad: 'Elif', soyad: 'Arslan' },
  { ad: 'Merve', soyad: 'Koç' },
];

export const mockSekreterler: User[] = mockKurslar.map((kurs, index) => ({
  id: `s${index + 1}`,
  ad: sekreterAdlari[index].ad,
  soyad: sekreterAdlari[index].soyad,
  email: `sekreter.${kurs.kod}@edura.com`,
  telefon: `0555 200 000${index + 1}`,
  role: 'sekreter' as const,
  kursId: kurs.id,
  kursAd: kurs.ad,
}));

// ==================== ÖĞRETMENLER ====================
// Her kurs için 6 branş öğretmeni (toplam 30 öğretmen)
// Not: 2 müdür aynı zamanda öğretmen olarak da sayılıyor
const branslar = ['Matematik', 'Türkçe', 'İngilizce', 'Fen Bilimleri', 'Sosyal Bilgiler', 'Fizik'];

const ogretmenHavuzu = [
  // Matematik
  { ad: 'Ahmet', soyad: 'Kaya' },
  { ad: 'Mustafa', soyad: 'Yılmaz' },
  { ad: 'Emre', soyad: 'Demir' },
  { ad: 'Oğuz', soyad: 'Şahin' },
  { ad: 'Tolga', soyad: 'Arslan' },
  // Türkçe
  { ad: 'Fatma', soyad: 'Öztürk' },
  { ad: 'Seda', soyad: 'Aydın' },
  { ad: 'Gül', soyad: 'Çelik' },
  { ad: 'Sibel', soyad: 'Koç' },
  { ad: 'Aylin', soyad: 'Kurt' },
  // İngilizce
  { ad: 'Deniz', soyad: 'Aktaş' },
  { ad: 'Ece', soyad: 'Polat' },
  { ad: 'Berk', soyad: 'Erdoğan' },
  { ad: 'Cem', soyad: 'Özkan' },
  { ad: 'Selin', soyad: 'Yıldız' },
  // Fen Bilimleri
  { ad: 'Ali', soyad: 'Kılıç' },
  { ad: 'Veli', soyad: 'Çetin' },
  { ad: 'Hüseyin', soyad: 'Aksoy' },
  { ad: 'İbrahim', soyad: 'Ünal' },
  { ad: 'Murat', soyad: 'Doğan' },
  // Sosyal Bilgiler
  { ad: 'Zehra', soyad: 'Güneş' },
  { ad: 'Hatice', soyad: 'Bayrak' },
  { ad: 'Emine', soyad: 'Kaplan' },
  { ad: 'Havva', soyad: 'Bozkurt' },
  { ad: 'Melek', soyad: 'Turan' },
  // Fizik
  { ad: 'Can', soyad: 'Korkmaz' },
  { ad: 'Arda', soyad: 'Yavuz' },
  { ad: 'Kaan', soyad: 'Sarı' },
  { ad: 'Ege', soyad: 'Kara' },
  { ad: 'Doruk', soyad: 'Aslan' },
];

export const mockOgretmenler: Ogretmen[] = [];
let ogretmenIdCounter = 1;

// NOT: Her branş için bağımsız öğretmen oluşturulur
// Müdürün branşı olsa bile öğretmen ayrı kişidir (rol karışıklığını önlemek için)
mockKurslar.forEach((kurs, kursIndex) => {
  branslar.forEach((brans, bransIndex) => {
    const havuzIndex = bransIndex * 5 + kursIndex; // Her branş için 5 farklı isim
    const ogretmen = ogretmenHavuzu[havuzIndex];
    
    // Her zaman öğretmen havuzundan al - müdürle karıştırma!
    mockOgretmenler.push({
      id: `og${ogretmenIdCounter}`,
      ad: ogretmen.ad,
      soyad: ogretmen.soyad,
      brans,
      telefon: `0555 ${300 + kursIndex}${(bransIndex + 10).toString().padStart(2, '0')} ${ogretmenIdCounter.toString().padStart(4, '0')}`,
      email: `${brans.toLowerCase().replace(/\s+/g, '').replace('ı', 'i').replace('ş', 's').replace('ü', 'u').replace('ö', 'o').replace('ğ', 'g').replace('ç', 'c')}.${kurs.kod}@edura.com`,
      kursId: kurs.id,
    });
    ogretmenIdCounter++;
  });
});

// ==================== ÖĞRENCİLER ====================
// Her kurs için: 8 sınıf türü × 18 öğrenci = 144 öğrenci
// Toplam: 5 kurs × 144 = 720 öğrenci
// A şubesi: 10 öğrenci (yüksek ortalama)
// B şubesi: 8 öğrenci (düşük ortalama)

export const mockOgrenciler: User[] = [];
let ogrenciCounter = 1;

const erkekAdlari = [
  'Ahmet', 'Mehmet', 'Ali', 'Mustafa', 'Hasan', 'Hüseyin', 'İbrahim', 'Yusuf',
  'Ömer', 'Murat', 'Burak', 'Emre', 'Cem', 'Can', 'Ege', 'Arda', 'Kaan', 'Berk',
  'Eren', 'Furkan', 'Gökhan', 'Onur', 'Tuna', 'Umut', 'Doruk', 'Emir', 'Kerem', 'Mert',
  'Oğuz', 'Serkan', 'Tolga', 'Yiğit', 'Barış', 'Deniz', 'Efe', 'Koray', 'Melih', 'Selim',
];

const kizAdlari = [
  'Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Selin', 'Defne', 'Ece', 'Gizem', 'Naz',
  'Duru', 'Lara', 'Yağmur', 'Ceren', 'Hande', 'İpek', 'Pelin', 'Derya', 'Eylül', 'Ada',
  'Azra', 'Beren', 'Cansu', 'Dilara', 'Esra', 'Gamze', 'Hilal', 'Ilgın', 'Jale', 'Kardelen',
  'Melis', 'Nehir', 'Özge', 'Rana', 'Simge', 'Tuğçe', 'Yaprak', 'Zehra', 'Aslı', 'Başak',
];

const ogrenciSoyadlari = [
  'Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Yıldız',
  'Koç', 'Kurt', 'Polat', 'Erdoğan', 'Özkan', 'Kılıç', 'Çetin', 'Aksoy', 'Ünal', 'Korkmaz',
];

mockKurslar.forEach((kurs) => {
  sinifSeviyeleri.forEach((seviye) => {
    // Her seviye için 18 öğrenci oluştur, ortalamaya göre sırala
    const sinifOgrencileri: Array<{
      ad: string;
      soyad: string;
      cinsiyet: 'erkek' | 'kiz';
      ortalama: number;
    }> = [];
    
    for (let i = 0; i < 18; i++) {
      const cinsiyet = i % 2 === 0 ? 'erkek' : 'kiz';
      const adHavuzu = cinsiyet === 'erkek' ? erkekAdlari : kizAdlari;
      const adIndex = (ogrenciCounter + i) % adHavuzu.length;
      const soyadIndex = (ogrenciCounter + i) % ogrenciSoyadlari.length;
      
      // Rastgele ortalama (50-100 arası)
      const ortalama = Math.floor(Math.random() * 51) + 50;
      
      sinifOgrencileri.push({
        ad: adHavuzu[adIndex],
        soyad: ogrenciSoyadlari[soyadIndex],
        cinsiyet,
        ortalama,
      });
    }
    
    // Ortalamaya göre sırala (yüksekten düşüğe)
    sinifOgrencileri.sort((a, b) => b.ortalama - a.ortalama);
    
    // İlk 10 öğrenci A şubesine, kalan 8 öğrenci B şubesine
    sinifOgrencileri.forEach((ogr, index) => {
      const sube = index < 10 ? 'A' : 'B';
      const sinifAd = `${seviye.seviye}-${sube}`;
      const sinifId = `sinif-${kurs.id}-${seviye.seviye}-${sube}`;
      
      mockOgrenciler.push({
        id: `ogr${ogrenciCounter}`,
        ad: ogr.ad,
        soyad: ogr.soyad,
        email: `ogrenci${ogrenciCounter}.${kurs.kod}@edura.com`,
        telefon: `0555 ${400 + parseInt(kurs.id)} ${seviye.seviye.toString().padStart(2, '0')}${(index + 1).toString().padStart(2, '0')}`,
        role: 'ogrenci' as const,
        sinifId,
        sinif: sinifAd,
        ogrenciNo: `2024${kurs.id}${seviye.seviye.toString().padStart(2, '0')}${(index + 1).toString().padStart(2, '0')}`,
        kursId: kurs.id,
        kursAd: kurs.ad,
        ortalama: ogr.ortalama,
      });
      ogrenciCounter++;
    });
  });
});

// ==================== ÖRNEK ÖĞRENCİ (Giriş yapan) ====================
// Maltepe Zambak - 8A sınıfından bir öğrenci
export const mockOgrenci = {
  id: 'ogr55', // 8-A sınıfının ilk öğrencisi
  ad: 'Ahmet',
  soyad: 'Yılmaz',
  sinif: '8-A',
  sinifId: 'sinif-1-8-A',
  email: 'ogrenci.8a@edura.com',
  telefon: '0555 401 0801',
  dogumTarihi: '2010-05-15',
  seviye: 8,
  ogrenciNo: '20241080 1',
  kursId: '1',
  kursAd: 'Maltepe Zambak',
  ortalama: 92,
};

// ==================== SINIF ARKADAŞLARI ====================
export const mockSinifArkadoslari = mockOgrenciler
  .filter(o => o.sinifId === mockOgrenci.sinifId && o.id !== mockOgrenci.id)
  .slice(0, 9);

// ==================== KONUŞMA TÜRLERİ ====================
export interface Konusma {
  id: string;
  tip: 'ozel' | 'sinif' | 'ogretmen_grup';
  ad: string;
  resimUrl?: string;
  uyeler: { id: string; ad: string; rol: string; online?: boolean }[];
  sonMesaj: string;
  sonMesajTarih: string;
  okunmamis: number;
}

// ==================== SINIF GRUPLARI ====================
export const mockSinifGruplari: Konusma[] = [
  {
    id: 'grup-sinif-8a',
    tip: 'sinif',
    ad: '8-A Sınıf Grubu 📚',
    uyeler: [
      { id: mockOgrenci.id, ad: `${mockOgrenci.ad} ${mockOgrenci.soyad}`, rol: 'Öğrenci' },
      ...mockSinifArkadoslari.map(a => ({ id: a.id, ad: `${a.ad} ${a.soyad}`, rol: 'Öğrenci', online: Math.random() > 0.7 })),
      ...mockOgretmenler.filter(o => o.kursId === mockOgrenci.kursId).slice(0, 3).map(o => ({ id: o.id, ad: `${o.ad} ${o.soyad}`, rol: 'Öğretmen', online: Math.random() > 0.5 })),
    ],
    sonMesaj: 'Yarınki sınav için herkes hazır mı? 📝',
    sonMesajTarih: '2024-12-18 09:30',
    okunmamis: 5,
  },
];

// ==================== TÜM KONUŞMALAR (Öğrenci için) ====================
export const mockTumKonusmalar: Konusma[] = [
  ...mockSinifGruplari,
  {
    id: 'ozel-og1',
    tip: 'ozel' as const,
    ad: `${mockOgretmenler[0]?.ad || 'Ahmet'} ${mockOgretmenler[0]?.soyad || 'Kaya'}`,
    uyeler: [{ id: 'og1', ad: `${mockOgretmenler[0]?.ad || 'Ahmet'} ${mockOgretmenler[0]?.soyad || 'Kaya'}`, rol: 'Matematik Öğretmeni', online: true }],
    sonMesaj: 'Yarınki derse kadar sayfa 45-50 arasındaki problemleri çözmenizi bekliyorum.',
    sonMesajTarih: '2024-12-17 14:10',
    okunmamis: 1,
  },
  {
    id: 'ozel-og2',
    tip: 'ozel' as const,
    ad: `${mockOgretmenler[1]?.ad || 'Fatma'} ${mockOgretmenler[1]?.soyad || 'Öztürk'}`,
    uyeler: [{ id: 'og2', ad: `${mockOgretmenler[1]?.ad || 'Fatma'} ${mockOgretmenler[1]?.soyad || 'Öztürk'}`, rol: 'Türkçe Öğretmeni', online: false }],
    sonMesaj: 'Kompozisyon ödevini teslim etmeyi unutma! 📝',
    sonMesajTarih: '2024-12-17 11:00',
    okunmamis: 1,
  },
  {
    id: 'ozel-og3',
    tip: 'ozel' as const,
    ad: `${mockOgretmenler[2]?.ad || 'Deniz'} ${mockOgretmenler[2]?.soyad || 'Aktaş'}`,
    uyeler: [{ id: 'og3', ad: `${mockOgretmenler[2]?.ad || 'Deniz'} ${mockOgretmenler[2]?.soyad || 'Aktaş'}`, rol: 'İngilizce Öğretmeni', online: true }],
    sonMesaj: 'Speaking club yarın saat 15:00\'te! 🎤',
    sonMesajTarih: '2024-12-16 15:00',
    okunmamis: 0,
  },
  {
    id: 'ozel-arkadas1',
    tip: 'ozel' as const,
    ad: `${mockSinifArkadoslari[0]?.ad || 'Mehmet'} ${mockSinifArkadoslari[0]?.soyad || 'Kaya'}`,
    uyeler: [{ id: mockSinifArkadoslari[0]?.id || 'ogr2', ad: `${mockSinifArkadoslari[0]?.ad || 'Mehmet'} ${mockSinifArkadoslari[0]?.soyad || 'Kaya'}`, rol: 'Sınıf Arkadaşı', online: true }],
    sonMesaj: 'Matematik ödevini yaptın mı? 5. soru çok zor 🤔',
    sonMesajTarih: '2024-12-17 16:45',
    okunmamis: 2,
  },
  {
    id: 'ozel-arkadas2',
    tip: 'ozel' as const,
    ad: `${mockSinifArkadoslari[1]?.ad || 'Ayşe'} ${mockSinifArkadoslari[1]?.soyad || 'Demir'}`,
    uyeler: [{ id: mockSinifArkadoslari[1]?.id || 'ogr3', ad: `${mockSinifArkadoslari[1]?.ad || 'Ayşe'} ${mockSinifArkadoslari[1]?.soyad || 'Demir'}`, rol: 'Sınıf Arkadaşı', online: false }],
    sonMesaj: 'Yarın okula birlikte gidelim mi? 🚌',
    sonMesajTarih: '2024-12-17 15:20',
    okunmamis: 0,
  },
];

// ==================== DERSLER ====================
export const mockDersler: Ders[] = mockOgretmenler
  .filter(o => o.kursId === '1')
  .map((ogretmen, index) => ({
    id: `d${index + 1}`,
    ad: ogretmen.brans,
    ogretmenId: ogretmen.id,
    ogretmenAd: `${ogretmen.ad} ${ogretmen.soyad}`,
    gun: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'][index % 5],
    baslangicSaati: ['09:00', '10:30', '13:00', '14:30', '16:00'][Math.floor(index / 5) % 5],
    bitisSaati: ['10:15', '11:45', '14:15', '15:45', '17:15'][Math.floor(index / 5) % 5],
    sinif: '8-A',
    sinifId: 'sinif-1-8-A',
  }));

// ==================== SINAV SONUÇLARI ====================
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
    gonderenAd: `${mockOgretmenler[0]?.ad} ${mockOgretmenler[0]?.soyad}`,
    gonderenRole: 'Matematik Öğretmeni',
    baslik: 'Matematik Ödevi Hakkında',
    mesaj: 'Merhaba! Yarınki derse kadar sayfa 45-50 arasındaki problemleri çözmenizi bekliyorum. Zorlandığınız soru olursa bana yazabilirsiniz.',
    tarih: '2024-12-17',
    okundu: false,
  },
  {
    id: '2',
    gonderenAd: `${mockOgretmenler[1]?.ad} ${mockOgretmenler[1]?.soyad}`,
    gonderenId: 'og2',
    gonderenRole: 'Türkçe Öğretmeni',
    baslik: 'Kompozisyon Ödevi 📝',
    mesaj: 'Bu haftaki kompozisyon konumuz: "Gelecekte Olmak İstediğim Meslek". En az 300 kelime olmalı. Teslim tarihi Cuma günü.',
    tarih: '2024-12-17',
    okundu: false,
  },
  {
    id: '3',
    gonderenId: 'og3',
    gonderenAd: `${mockOgretmenler[2]?.ad} ${mockOgretmenler[2]?.soyad}`,
    gonderenRole: 'İngilizce Öğretmeni',
    baslik: 'Speaking Club Daveti 🎤',
    mesaj: 'Perşembe günü saat 15:00\'te İngilizce konuşma kulübümüz var. Bu hafta "My Favorite Movie" konusunu tartışacağız!',
    tarih: '2024-12-16',
    okundu: true,
  },
  {
    id: '4',
    gonderenId: 'og4',
    gonderenAd: `${mockOgretmenler[3]?.ad} ${mockOgretmenler[3]?.soyad}`,
    gonderenRole: 'Fen Bilimleri Öğretmeni',
    baslik: 'Laboratuvar Deneyi 🔬',
    mesaj: 'Yarınki laboratuvar deneyi için önlük getirmeyi unutmayın. Asit-baz deneyi yapacağız. Güvenlik kurallarına dikkat!',
    tarih: '2024-12-15',
    okundu: true,
  },
  {
    id: '5',
    gonderenId: 'm1',
    gonderenAd: `${mockMudurler[0]?.ad} ${mockMudurler[0]?.soyad}`,
    gonderenRole: 'Kurum Müdürü',
    baslik: 'Veli Toplantısı Duyurusu 📢',
    mesaj: 'Değerli öğrencimiz, 25 Aralık Cumartesi saat 14:00\'te veli toplantımız olacaktır. Velilerinizi bilgilendirmenizi rica ederiz.',
    tarih: '2024-12-14',
    okundu: true,
  },
  {
    id: '6',
    gonderenId: 'og5',
    gonderenAd: `${mockOgretmenler[4]?.ad} ${mockOgretmenler[4]?.soyad}`,
    gonderenRole: 'Sosyal Bilgiler Öğretmeni',
    baslik: 'Tarih Projesi 🏛️',
    mesaj: 'Grup çalışması konularınızı belirlemeniz gerekiyor. Osmanlı Dönemi veya Cumhuriyet Tarihi seçebilirsiniz. Haftaya sunum var!',
    tarih: '2024-12-13',
    okundu: true,
  },
];

// ==================== BİLDİRİMLER ====================
export const mockBildirimler: Bildirim[] = [
  {
    id: '1',
    baslik: '3. Deneme Sınavı Sonuçları',
    mesaj: '3. Deneme sınav sonuçlarınız açıklandı. Detaylı analiz için "Deneme Sonuçlarım" bölümünü inceleyebilirsiniz.',
    tarih: '2024-12-16',
    okundu: false,
    tip: 'BILDIRIM',
  },
  {
    id: '2',
    baslik: 'Yarın Tatil! 🎉',
    mesaj: 'Yarın resmi tatil olduğu için dersler yapılmayacaktır. İyi tatiller!',
    tarih: '2024-12-14',
    okundu: false,
    tip: 'SISTEM',
  },
  {
    id: '3',
    baslik: 'Yeni Ders Programı',
    mesaj: 'Ocak ayı ders programı güncellendi. Detaylar için ders programı bölümünü kontrol edin.',
    tarih: '2024-12-10',
    okundu: true,
    tip: 'BILDIRIM',
  },
  {
    id: '4',
    baslik: 'Kütüphane Üyeliği',
    mesaj: 'Online kütüphane üyeliğiniz aktive edildi. Binlerce kitaba erişebilirsiniz!',
    tarih: '2024-12-05',
    okundu: true,
    tip: 'SISTEM',
  },
];

// ==================== DEVAMSIZLIKLAR ====================
export const mockDevamsizliklar: Devamsizlik[] = [
  { id: '1', dersAdi: 'Matematik', tarih: '2024-12-10', aciklama: 'Hastalık (Raporlu)' },
  { id: '2', dersAdi: 'İngilizce', tarih: '2024-12-05', aciklama: 'İzinli' },
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
  kursBasinaOgrenci: Math.floor(mockOgrenciler.length / mockKurslar.length),
  sinifBasinaOrtalamaOgrenci: Math.floor(mockOgrenciler.length / mockSiniflar.length),
};

console.log('📊 Edura Mock Data İstatistikleri:');
console.log(`   🏫 Toplam Kurs: ${mockIstatistikler.toplamKurs}`);
console.log(`   👔 Toplam Müdür: ${mockIstatistikler.toplamMudur}`);
console.log(`   💼 Toplam Sekreter: ${mockIstatistikler.toplamSekreter}`);
console.log(`   👨‍🏫 Toplam Öğretmen: ${mockIstatistikler.toplamOgretmen}`);
console.log(`   👨‍🎓 Toplam Öğrenci: ${mockIstatistikler.toplamOgrenci}`);
console.log(`   🏛️ Toplam Sınıf: ${mockIstatistikler.toplamSinif}`);
console.log(`   📚 Ortaokul Sınıfı: ${mockIstatistikler.ortaokulSinifSayisi}`);
console.log(`   🎓 Lise Sınıfı: ${mockIstatistikler.liseSinifSayisi}`);

// ==================== PERSONEL KONUŞMALARI ====================
export interface PersonelKonusma {
  id: string;
  tip: 'ozel' | 'ogretmenler' | 'personel' | 'sinif_ogrencileri';
  ad: string;
  uyeler: { id: string; ad: string; rol: string; online?: boolean }[];
  sonMesaj: string;
  sonMesajTarih: string;
  okunmamis: number;
}

// Örnek personel (giriş yapan öğretmen - Maltepe Zambak Matematik Öğretmeni)
export const mockPersonel = {
  id: 'og1',
  ad: mockOgretmenler[0]?.ad || 'Ahmet',
  soyad: mockOgretmenler[0]?.soyad || 'Kaya',
  email: 'matematik.zambak@edura.com',
  brans: 'Matematik',
  kursId: '1',
  kursAd: 'Maltepe Zambak',
  role: 'ogretmen' as const,
};

// Personel için konuşmalar
export const mockPersonelKonusmalar: PersonelKonusma[] = [
  {
    id: 'grup-ogretmenler',
    tip: 'ogretmenler',
    ad: 'Maltepe Zambak Öğretmenler 👨‍🏫',
    uyeler: mockOgretmenler.filter(o => o.kursId === '1').map(o => ({
      id: o.id,
      ad: `${o.ad} ${o.soyad}`,
      rol: o.brans,
      online: Math.random() > 0.5
    })),
    sonMesaj: 'Yarınki toplantı saat 10:00\'da olacak. Katılımınızı bekliyoruz.',
    sonMesajTarih: '2024-12-18 09:00',
    okunmamis: 3,
  },
  {
    id: 'grup-personel',
    tip: 'personel',
    ad: 'Maltepe Zambak Personeli 🏫',
    uyeler: [
      { id: 'm1', ad: `${mockMudurler[0]?.ad} ${mockMudurler[0]?.soyad}`, rol: 'Müdür', online: true },
      { id: 's1', ad: `${mockSekreterler[0]?.ad} ${mockSekreterler[0]?.soyad}`, rol: 'Sekreter', online: true },
      ...mockOgretmenler.filter(o => o.kursId === '1').slice(0, 4).map(o => ({
        id: o.id,
        ad: `${o.ad} ${o.soyad}`,
        rol: 'Öğretmen',
        online: Math.random() > 0.5
      })),
    ],
    sonMesaj: 'Haftalık puantaj formlarını doldurmayı unutmayın!',
    sonMesajTarih: '2024-12-17 16:30',
    okunmamis: 1,
  },
  {
    id: 'ozel-mudur',
    tip: 'ozel',
    ad: `${mockMudurler[0]?.ad} ${mockMudurler[0]?.soyad}`,
    uyeler: [{ id: 'm1', ad: `${mockMudurler[0]?.ad} ${mockMudurler[0]?.soyad}`, rol: 'Kurum Müdürü', online: true }],
    sonMesaj: 'Toplantı için hazırlıklar nasıl gidiyor?',
    sonMesajTarih: '2024-12-18 08:45',
    okunmamis: 1,
  },
  {
    id: 'ozel-sekreter',
    tip: 'ozel',
    ad: `${mockSekreterler[0]?.ad} ${mockSekreterler[0]?.soyad}`,
    uyeler: [{ id: 's1', ad: `${mockSekreterler[0]?.ad} ${mockSekreterler[0]?.soyad}`, rol: 'Sekreter', online: true }],
    sonMesaj: 'Öğrenci devamsızlık raporları hazır.',
    sonMesajTarih: '2024-12-17 15:20',
    okunmamis: 0,
  },
  {
    id: 'ozel-ogretmen',
    tip: 'ozel',
    ad: `${mockOgretmenler[1]?.ad} ${mockOgretmenler[1]?.soyad}`,
    uyeler: [{ id: 'og2', ad: `${mockOgretmenler[1]?.ad} ${mockOgretmenler[1]?.soyad}`, rol: 'Türkçe Öğretmeni', online: false }],
    sonMesaj: 'Ders programı değişikliği hakkında konuşabilir miyiz?',
    sonMesajTarih: '2024-12-17 11:00',
    okunmamis: 0,
  },
  {
    id: 'ozel-ogrenci1',
    tip: 'ozel',
    ad: `${mockOgrenci.ad} ${mockOgrenci.soyad}`,
    uyeler: [{ id: mockOgrenci.id, ad: `${mockOgrenci.ad} ${mockOgrenci.soyad}`, rol: 'Öğrenci - 8A', online: false }],
    sonMesaj: 'Tamam hocam, teşekkürler! 📚',
    sonMesajTarih: '2024-12-17 14:10',
    okunmamis: 0,
  },
];
