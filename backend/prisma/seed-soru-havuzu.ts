import { PrismaClient, RozetTipi, XPSeviye, GorevTipi } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== SORU HAVUZU ====================
// Her daldan, 5 zorluk seviyesinden sorular

const sorular = [
  // ==================== MATEMATİK ====================
  // Zorluk 1 - Çok Kolay
  { konu: 'Matematik', altKonu: 'Dört İşlem', zorluk: 1, sinifSeviyesi: 5,
    soruMetni: '25 + 17 işleminin sonucu kaçtır?',
    secenekler: ['32', '42', '52', '40'], dogruCevap: 'B',
    aciklama: '25 + 17 = 42' },
  { konu: 'Matematik', altKonu: 'Dört İşlem', zorluk: 1, sinifSeviyesi: 5,
    soruMetni: '8 × 7 işleminin sonucu kaçtır?',
    secenekler: ['54', '56', '58', '64'], dogruCevap: 'B',
    aciklama: '8 × 7 = 56' },
  { konu: 'Matematik', altKonu: 'Dört İşlem', zorluk: 1, sinifSeviyesi: 5,
    soruMetni: '100 - 37 işleminin sonucu kaçtır?',
    secenekler: ['63', '73', '53', '67'], dogruCevap: 'A',
    aciklama: '100 - 37 = 63' },
  { konu: 'Matematik', altKonu: 'Kesirler', zorluk: 1, sinifSeviyesi: 6,
    soruMetni: '1/2 + 1/2 işleminin sonucu kaçtır?',
    secenekler: ['1', '2', '1/4', '2/4'], dogruCevap: 'A',
    aciklama: '1/2 + 1/2 = 2/2 = 1' },
  { konu: 'Matematik', altKonu: 'Çarpanlar', zorluk: 1, sinifSeviyesi: 6,
    soruMetni: '12 sayısının en küçük asal çarpanı kaçtır?',
    secenekler: ['1', '2', '3', '4'], dogruCevap: 'B',
    aciklama: '12 = 2 × 2 × 3, en küçük asal çarpan 2\'dir.' },

  // Zorluk 2 - Kolay
  { konu: 'Matematik', altKonu: 'İşlem Önceliği', zorluk: 2, sinifSeviyesi: 6,
    soruMetni: '2 + 3 × 4 işleminin sonucu kaçtır?',
    secenekler: ['14', '20', '24', '12'], dogruCevap: 'A',
    aciklama: 'Önce çarpma: 3 × 4 = 12, sonra toplama: 2 + 12 = 14' },
  { konu: 'Matematik', altKonu: 'Yüzde', zorluk: 2, sinifSeviyesi: 7,
    soruMetni: '200\'ün %25\'i kaçtır?',
    secenekler: ['25', '50', '75', '100'], dogruCevap: 'B',
    aciklama: '200 × 25/100 = 200 × 0.25 = 50' },
  { konu: 'Matematik', altKonu: 'Oran Orantı', zorluk: 2, sinifSeviyesi: 7,
    soruMetni: '3/4 = x/20 ise x kaçtır?',
    secenekler: ['12', '15', '16', '18'], dogruCevap: 'B',
    aciklama: '3 × 20 / 4 = 60/4 = 15' },
  { konu: 'Matematik', altKonu: 'Üslü Sayılar', zorluk: 2, sinifSeviyesi: 8,
    soruMetni: '2³ + 3² işleminin sonucu kaçtır?',
    secenekler: ['15', '17', '11', '13'], dogruCevap: 'B',
    aciklama: '2³ = 8, 3² = 9, toplam = 17' },
  { konu: 'Matematik', altKonu: 'Kök', zorluk: 2, sinifSeviyesi: 8,
    soruMetni: '√144 kaçtır?',
    secenekler: ['10', '11', '12', '14'], dogruCevap: 'C',
    aciklama: '12 × 12 = 144, yani √144 = 12' },

  // Zorluk 3 - Orta
  { konu: 'Matematik', altKonu: 'Denklemler', zorluk: 3, sinifSeviyesi: 8,
    soruMetni: '3x + 7 = 22 denkleminde x kaçtır?',
    secenekler: ['3', '4', '5', '6'], dogruCevap: 'C',
    aciklama: '3x = 22 - 7 = 15, x = 15/3 = 5' },
  { konu: 'Matematik', altKonu: 'Eşitsizlikler', zorluk: 3, sinifSeviyesi: 9,
    soruMetni: '2x - 4 > 6 eşitsizliğinin çözüm kümesi hangisidir?',
    secenekler: ['x > 5', 'x > 4', 'x > 3', 'x > 2'], dogruCevap: 'A',
    aciklama: '2x > 10, x > 5' },
  { konu: 'Matematik', altKonu: 'Fonksiyonlar', zorluk: 3, sinifSeviyesi: 9,
    soruMetni: 'f(x) = 2x + 3 ise f(4) kaçtır?',
    secenekler: ['9', '10', '11', '12'], dogruCevap: 'C',
    aciklama: 'f(4) = 2(4) + 3 = 8 + 3 = 11' },
  { konu: 'Matematik', altKonu: 'Polinomlar', zorluk: 3, sinifSeviyesi: 10,
    soruMetni: '(x + 2)(x - 3) ifadesini açınız.',
    secenekler: ['x² - x - 6', 'x² + x - 6', 'x² - 6', 'x² - x + 6'], dogruCevap: 'A',
    aciklama: 'x² - 3x + 2x - 6 = x² - x - 6' },
  { konu: 'Matematik', altKonu: 'Olasılık', zorluk: 3, sinifSeviyesi: 8,
    soruMetni: 'Bir zarın atılmasında çift sayı gelme olasılığı kaçtır?',
    secenekler: ['1/6', '1/3', '1/2', '2/3'], dogruCevap: 'C',
    aciklama: 'Çift sayılar: 2, 4, 6 (3 tane), toplam: 6, olasılık: 3/6 = 1/2' },

  // Zorluk 4 - Zor
  { konu: 'Matematik', altKonu: 'İkinci Dereceden Denklemler', zorluk: 4, sinifSeviyesi: 10,
    soruMetni: 'x² - 5x + 6 = 0 denkleminin kökleri toplamı kaçtır?',
    secenekler: ['5', '6', '-5', '-6'], dogruCevap: 'A',
    aciklama: 'Vieta formülü: köklerin toplamı = -b/a = 5/1 = 5' },
  { konu: 'Matematik', altKonu: 'Trigonometri', zorluk: 4, sinifSeviyesi: 10,
    soruMetni: 'sin²30° + cos²30° kaçtır?',
    secenekler: ['0', '1/2', '1', '2'], dogruCevap: 'C',
    aciklama: 'Temel trigonometrik özdeşlik: sin²θ + cos²θ = 1' },
  { konu: 'Matematik', altKonu: 'Logaritma', zorluk: 4, sinifSeviyesi: 11,
    soruMetni: 'log₂(32) kaçtır?',
    secenekler: ['4', '5', '6', '8'], dogruCevap: 'B',
    aciklama: '2⁵ = 32, yani log₂(32) = 5' },
  { konu: 'Matematik', altKonu: 'Permütasyon', zorluk: 4, sinifSeviyesi: 11,
    soruMetni: '5! (5 faktöriyel) kaçtır?',
    secenekler: ['60', '100', '120', '150'], dogruCevap: 'C',
    aciklama: '5! = 5 × 4 × 3 × 2 × 1 = 120' },
  { konu: 'Matematik', altKonu: 'Kombinasyon', zorluk: 4, sinifSeviyesi: 11,
    soruMetni: 'C(6,2) kaçtır?',
    secenekler: ['12', '15', '18', '20'], dogruCevap: 'B',
    aciklama: 'C(6,2) = 6!/(2!×4!) = 30/2 = 15' },

  // Zorluk 5 - Çok Zor
  { konu: 'Matematik', altKonu: 'Türev', zorluk: 5, sinifSeviyesi: 12,
    soruMetni: 'f(x) = x³ - 3x fonksiyonunun türevi f\'(x) nedir?',
    secenekler: ['3x² - 3', '3x² + 3', 'x² - 3', '2x² - 3'], dogruCevap: 'A',
    aciklama: 'f\'(x) = 3x² - 3' },
  { konu: 'Matematik', altKonu: 'İntegral', zorluk: 5, sinifSeviyesi: 12,
    soruMetni: '∫2x dx = ?',
    secenekler: ['x² + C', '2x² + C', 'x + C', '2 + C'], dogruCevap: 'A',
    aciklama: '∫2x dx = 2 × (x²/2) + C = x² + C' },
  { konu: 'Matematik', altKonu: 'Limit', zorluk: 5, sinifSeviyesi: 12,
    soruMetni: 'lim(x→2) (x² - 4)/(x - 2) = ?',
    secenekler: ['2', '4', '0', '∞'], dogruCevap: 'B',
    aciklama: '(x² - 4)/(x - 2) = (x+2)(x-2)/(x-2) = x + 2, limit = 4' },
  { konu: 'Matematik', altKonu: 'Matrisler', zorluk: 5, sinifSeviyesi: 12,
    soruMetni: '2×2 birim matrisin determinantı kaçtır?',
    secenekler: ['0', '1', '2', '4'], dogruCevap: 'B',
    aciklama: 'Birim matrisin determinantı her zaman 1\'dir.' },
  { konu: 'Matematik', altKonu: 'Diziler', zorluk: 5, sinifSeviyesi: 11,
    soruMetni: 'Aritmetik dizide a₁=3, d=5 ise a₁₀ kaçtır?',
    secenekler: ['45', '48', '50', '53'], dogruCevap: 'B',
    aciklama: 'aₙ = a₁ + (n-1)d = 3 + 9×5 = 48' },

  // ==================== FİZİK ====================
  // Zorluk 1
  { konu: 'Fizik', altKonu: 'Birimler', zorluk: 1, sinifSeviyesi: 9,
    soruMetni: 'Uzunluğun SI birimi nedir?',
    secenekler: ['Kilometre', 'Metre', 'Santimetre', 'Milimetre'], dogruCevap: 'B',
    aciklama: 'SI sisteminde uzunluk birimi metredir (m).' },
  { konu: 'Fizik', altKonu: 'Hareket', zorluk: 1, sinifSeviyesi: 9,
    soruMetni: 'Hız birimi nedir?',
    secenekler: ['m/s', 'm/s²', 'kg', 'N'], dogruCevap: 'A',
    aciklama: 'Hız = Yol/Zaman, birimi m/s\'dir.' },
  { konu: 'Fizik', altKonu: 'Kuvvet', zorluk: 1, sinifSeviyesi: 9,
    soruMetni: 'Kuvvetin birimi nedir?',
    secenekler: ['Joule', 'Watt', 'Newton', 'Pascal'], dogruCevap: 'C',
    aciklama: 'Kuvvet birimi Newton\'dur (N).' },

  // Zorluk 2
  { konu: 'Fizik', altKonu: 'Hareket', zorluk: 2, sinifSeviyesi: 9,
    soruMetni: '100 metreyi 10 saniyede kat eden bir cismin hızı kaç m/s\'dir?',
    secenekler: ['5', '10', '15', '20'], dogruCevap: 'B',
    aciklama: 'v = x/t = 100/10 = 10 m/s' },
  { konu: 'Fizik', altKonu: 'Kütle', zorluk: 2, sinifSeviyesi: 9,
    soruMetni: '5 kg kütleli bir cisme 20 N kuvvet uygulanırsa ivmesi kaç m/s² olur?',
    secenekler: ['2', '4', '5', '10'], dogruCevap: 'B',
    aciklama: 'F = ma, a = F/m = 20/5 = 4 m/s²' },

  // Zorluk 3
  { konu: 'Fizik', altKonu: 'Enerji', zorluk: 3, sinifSeviyesi: 10,
    soruMetni: '2 kg kütleli ve 3 m/s hızlı cismin kinetik enerjisi kaç Joule\'dür?',
    secenekler: ['6', '9', '12', '18'], dogruCevap: 'B',
    aciklama: 'Ek = (1/2)mv² = (1/2)(2)(3²) = 9 J' },
  { konu: 'Fizik', altKonu: 'İş', zorluk: 3, sinifSeviyesi: 10,
    soruMetni: '50 N kuvvet ile 4 m yol katedilirse yapılan iş kaç Joule\'dür?',
    secenekler: ['100', '150', '200', '250'], dogruCevap: 'C',
    aciklama: 'W = F × d = 50 × 4 = 200 J' },

  // Zorluk 4
  { konu: 'Fizik', altKonu: 'Elektrik', zorluk: 4, sinifSeviyesi: 11,
    soruMetni: '12V potansiyel fark ve 4Ω direnç varsa akım kaç Amper\'dir?',
    secenekler: ['2', '3', '4', '6'], dogruCevap: 'B',
    aciklama: 'Ohm yasası: I = V/R = 12/4 = 3 A' },
  { konu: 'Fizik', altKonu: 'Dalga', zorluk: 4, sinifSeviyesi: 11,
    soruMetni: 'Frekansı 500 Hz ve dalga boyu 0.6 m olan dalganın hızı kaç m/s\'dir?',
    secenekler: ['200', '250', '300', '350'], dogruCevap: 'C',
    aciklama: 'v = f × λ = 500 × 0.6 = 300 m/s' },

  // Zorluk 5
  { konu: 'Fizik', altKonu: 'Modern Fizik', zorluk: 5, sinifSeviyesi: 12,
    soruMetni: 'E = mc² formülünde c neyi temsil eder?',
    secenekler: ['Elektrik yükü', 'Coulomb sabiti', 'Işık hızı', 'Kapasitans'], dogruCevap: 'C',
    aciklama: 'c = ışık hızı ≈ 3×10⁸ m/s' },
  { konu: 'Fizik', altKonu: 'Atom Fiziği', zorluk: 5, sinifSeviyesi: 12,
    soruMetni: 'Hidrojen atomunun temel enerji seviyesi kaç eV\'dir?',
    secenekler: ['-13.6', '-10.2', '-3.4', '-1.5'], dogruCevap: 'A',
    aciklama: 'Hidrojen atomunun temel enerji seviyesi E₁ = -13.6 eV\'dir.' },

  // ==================== KİMYA ====================
  // Zorluk 1
  { konu: 'Kimya', altKonu: 'Element', zorluk: 1, sinifSeviyesi: 9,
    soruMetni: 'Suyun kimyasal formülü nedir?',
    secenekler: ['CO₂', 'H₂O', 'NaCl', 'O₂'], dogruCevap: 'B',
    aciklama: 'Su molekülü 2 hidrojen ve 1 oksijen atomundan oluşur: H₂O' },
  { konu: 'Kimya', altKonu: 'Element', zorluk: 1, sinifSeviyesi: 9,
    soruMetni: 'Oksijen elementinin sembolü nedir?',
    secenekler: ['Ok', 'Os', 'O', 'Ox'], dogruCevap: 'C',
    aciklama: 'Oksijen elementi "O" sembolü ile gösterilir.' },

  // Zorluk 2
  { konu: 'Kimya', altKonu: 'Periyodik Tablo', zorluk: 2, sinifSeviyesi: 9,
    soruMetni: 'Sodyum elementinin atom numarası kaçtır?',
    secenekler: ['10', '11', '12', '13'], dogruCevap: 'B',
    aciklama: 'Sodyum (Na) periyodik tabloda 11. sıradadır.' },
  { konu: 'Kimya', altKonu: 'Bağlar', zorluk: 2, sinifSeviyesi: 9,
    soruMetni: 'NaCl bileşiğindeki bağ türü nedir?',
    secenekler: ['Kovalent', 'İyonik', 'Metalik', 'Van der Waals'], dogruCevap: 'B',
    aciklama: 'NaCl (sodyum klorür) iyonik bağ içerir.' },

  // Zorluk 3
  { konu: 'Kimya', altKonu: 'Mol', zorluk: 3, sinifSeviyesi: 10,
    soruMetni: '1 mol suyun kütlesi kaç gramdır? (H=1, O=16)',
    secenekler: ['16', '17', '18', '20'], dogruCevap: 'C',
    aciklama: 'H₂O = 2(1) + 16 = 18 g/mol' },
  { konu: 'Kimya', altKonu: 'Asit-Baz', zorluk: 3, sinifSeviyesi: 10,
    soruMetni: 'pH değeri 7\'den küçük olan çözeltiler hangi özelliği taşır?',
    secenekler: ['Bazik', 'Nötr', 'Asidik', 'Amfoter'], dogruCevap: 'C',
    aciklama: 'pH < 7 asidik, pH = 7 nötr, pH > 7 bazik' },

  // Zorluk 4
  { konu: 'Kimya', altKonu: 'Reaksiyonlar', zorluk: 4, sinifSeviyesi: 11,
    soruMetni: '2H₂ + O₂ → 2H₂O tepkimesinde kaç mol oksijen harcanır?',
    secenekler: ['1', '2', '3', '4'], dogruCevap: 'A',
    aciklama: 'Denklemde 1 mol O₂ ile 2 mol H₂O oluşur.' },
  { konu: 'Kimya', altKonu: 'Termodinamik', zorluk: 4, sinifSeviyesi: 11,
    soruMetni: 'Ekzotermik reaksiyonlarda ΔH değeri nasıldır?',
    secenekler: ['Pozitif', 'Negatif', 'Sıfır', 'Belirsiz'], dogruCevap: 'B',
    aciklama: 'Ekzotermik reaksiyonlarda ısı açığa çıkar, ΔH < 0' },

  // Zorluk 5
  { konu: 'Kimya', altKonu: 'Organik Kimya', zorluk: 5, sinifSeviyesi: 12,
    soruMetni: 'CH₄ bileşiğinin IUPAC adı nedir?',
    secenekler: ['Etan', 'Metan', 'Propan', 'Bütan'], dogruCevap: 'B',
    aciklama: 'CH₄ en basit alkan olan metandır.' },
  { konu: 'Kimya', altKonu: 'Elektrokimya', zorluk: 5, sinifSeviyesi: 12,
    soruMetni: 'Elektroliz sırasında katotta hangi reaksiyon gerçekleşir?',
    secenekler: ['Oksidasyon', 'Redüksiyon', 'Nötralizasyon', 'Hidroliz'], dogruCevap: 'B',
    aciklama: 'Katot negatif elektrottur ve redüksiyon gerçekleşir.' },

  // ==================== BİYOLOJİ ====================
  // Zorluk 1
  { konu: 'Biyoloji', altKonu: 'Hücre', zorluk: 1, sinifSeviyesi: 9,
    soruMetni: 'Hücrenin enerji santrali olarak bilinen organeli hangisidir?',
    secenekler: ['Ribozom', 'Mitokondri', 'Golgi', 'Lizozom'], dogruCevap: 'B',
    aciklama: 'Mitokondri ATP üretimi ile hücrenin enerji santralidir.' },
  { konu: 'Biyoloji', altKonu: 'Hücre', zorluk: 1, sinifSeviyesi: 9,
    soruMetni: 'DNA\'nın açılımı nedir?',
    secenekler: ['Deoksiribonükleik Asit', 'Diribonükleik Asit', 'Dinükleik Asit', 'Deoksinükleik Asit'], dogruCevap: 'A',
    aciklama: 'DNA = Deoksiribonükleik Asit' },

  // Zorluk 2
  { konu: 'Biyoloji', altKonu: 'Genetik', zorluk: 2, sinifSeviyesi: 10,
    soruMetni: 'İnsan vücudunda kaç çift kromozom bulunur?',
    secenekler: ['22', '23', '24', '46'], dogruCevap: 'B',
    aciklama: 'İnsanda 23 çift (46 adet) kromozom vardır.' },
  { konu: 'Biyoloji', altKonu: 'Sistemler', zorluk: 2, sinifSeviyesi: 10,
    soruMetni: 'Kanın vücutta taşınmasını hangi sistem sağlar?',
    secenekler: ['Sindirim', 'Solunum', 'Dolaşım', 'Boşaltım'], dogruCevap: 'C',
    aciklama: 'Dolaşım sistemi kalp ve damarlardan oluşur.' },

  // Zorluk 3
  { konu: 'Biyoloji', altKonu: 'Fotosentez', zorluk: 3, sinifSeviyesi: 10,
    soruMetni: 'Fotosentez sonucunda hangi gaz açığa çıkar?',
    secenekler: ['CO₂', 'N₂', 'O₂', 'H₂'], dogruCevap: 'C',
    aciklama: '6CO₂ + 6H₂O + Işık → C₆H₁₂O₆ + 6O₂' },
  { konu: 'Biyoloji', altKonu: 'Evrim', zorluk: 3, sinifSeviyesi: 11,
    soruMetni: 'Evrim teorisinin kurucusu kimdir?',
    secenekler: ['Newton', 'Einstein', 'Darwin', 'Mendel'], dogruCevap: 'C',
    aciklama: 'Charles Darwin evrim teorisinin kurucusudur.' },

  // Zorluk 4
  { konu: 'Biyoloji', altKonu: 'Genetik', zorluk: 4, sinifSeviyesi: 11,
    soruMetni: 'Protein sentezinde mRNA\'dan amino asit dizisi oluşturma işlemi nedir?',
    secenekler: ['Transkripsiyon', 'Translasyon', 'Replikasyon', 'Mutasyon'], dogruCevap: 'B',
    aciklama: 'Translasyon: mRNA → Protein sentezi' },
  { konu: 'Biyoloji', altKonu: 'Ekoloji', zorluk: 4, sinifSeviyesi: 11,
    soruMetni: 'Besin zincirinde en alt basamakta hangi canlılar bulunur?',
    secenekler: ['Tüketiciler', 'Ayrıştırıcılar', 'Üreticiler', 'Etçiller'], dogruCevap: 'C',
    aciklama: 'Üreticiler (bitkiler) besin zincirinin temelidir.' },

  // Zorluk 5
  { konu: 'Biyoloji', altKonu: 'Biyoteknoloji', zorluk: 5, sinifSeviyesi: 12,
    soruMetni: 'PCR tekniğinin amacı nedir?',
    secenekler: ['Protein sentezi', 'DNA çoğaltma', 'RNA izolasyonu', 'Hücre bölünmesi'], dogruCevap: 'B',
    aciklama: 'PCR (Polimeraz Zincir Reaksiyonu) DNA çoğaltma tekniğidir.' },
  { konu: 'Biyoloji', altKonu: 'Sinir Sistemi', zorluk: 5, sinifSeviyesi: 12,
    soruMetni: 'Nöronlar arası sinyal iletimini sağlayan kimyasallar nedir?',
    secenekler: ['Hormonlar', 'Enzimler', 'Nörotransmitterler', 'Antikorlar'], dogruCevap: 'C',
    aciklama: 'Nörotransmitterler sinaps boşluğunda sinyal iletir.' },

  // ==================== TARİH ====================
  // Zorluk 1
  { konu: 'Tarih', altKonu: 'Atatürk', zorluk: 1, sinifSeviyesi: 8,
    soruMetni: 'Atatürk hangi yılda doğmuştur?',
    secenekler: ['1879', '1880', '1881', '1882'], dogruCevap: 'C',
    aciklama: 'Mustafa Kemal Atatürk 1881\'de Selanik\'te doğmuştur.' },
  { konu: 'Tarih', altKonu: 'Kurtuluş Savaşı', zorluk: 1, sinifSeviyesi: 8,
    soruMetni: 'Türkiye Büyük Millet Meclisi hangi yılda açılmıştır?',
    secenekler: ['1919', '1920', '1921', '1922'], dogruCevap: 'B',
    aciklama: 'TBMM 23 Nisan 1920\'de Ankara\'da açılmıştır.' },

  // Zorluk 2
  { konu: 'Tarih', altKonu: 'Osmanlı', zorluk: 2, sinifSeviyesi: 10,
    soruMetni: 'İstanbul hangi yılda fethedilmiştir?',
    secenekler: ['1453', '1454', '1455', '1456'], dogruCevap: 'A',
    aciklama: 'İstanbul 29 Mayıs 1453\'te Fatih Sultan Mehmet tarafından fethedildi.' },
  { konu: 'Tarih', altKonu: 'Osmanlı', zorluk: 2, sinifSeviyesi: 10,
    soruMetni: 'Osmanlı Devleti hangi yılda kurulmuştur?',
    secenekler: ['1299', '1300', '1301', '1302'], dogruCevap: 'A',
    aciklama: 'Osmanlı Devleti 1299\'da Osman Bey tarafından kuruldu.' },

  // Zorluk 3
  { konu: 'Tarih', altKonu: 'Dünya Savaşları', zorluk: 3, sinifSeviyesi: 11,
    soruMetni: '1. Dünya Savaşı hangi yıllar arasında yapılmıştır?',
    secenekler: ['1912-1916', '1914-1918', '1916-1920', '1918-1922'], dogruCevap: 'B',
    aciklama: '1. Dünya Savaşı 1914-1918 yılları arasında yaşandı.' },
  { konu: 'Tarih', altKonu: 'İnkılap', zorluk: 3, sinifSeviyesi: 8,
    soruMetni: 'Cumhuriyet hangi tarihte ilan edilmiştir?',
    secenekler: ['23 Nisan 1920', '29 Ekim 1923', '30 Ağustos 1922', '24 Temmuz 1923'], dogruCevap: 'B',
    aciklama: 'Türkiye Cumhuriyeti 29 Ekim 1923\'te ilan edildi.' },

  // Zorluk 4
  { konu: 'Tarih', altKonu: 'Dünya Savaşları', zorluk: 4, sinifSeviyesi: 12,
    soruMetni: '2. Dünya Savaşı\'nda atom bombası hangi şehirlere atılmıştır?',
    secenekler: ['Tokyo-Osaka', 'Hiroşima-Nagazaki', 'Kyoto-Kobe', 'Yokohama-Nagoya'], dogruCevap: 'B',
    aciklama: 'ABD, 6 ve 9 Ağustos 1945\'te Hiroşima ve Nagazaki\'ye atom bombası attı.' },

  // Zorluk 5
  { konu: 'Tarih', altKonu: 'Osmanlı', zorluk: 5, sinifSeviyesi: 11,
    soruMetni: 'Tanzimat Fermanı hangi padişah döneminde ilan edilmiştir?',
    secenekler: ['II. Mahmut', 'Abdülmecid', 'Abdülaziz', 'II. Abdülhamid'], dogruCevap: 'B',
    aciklama: 'Tanzimat Fermanı 1839\'da Sultan Abdülmecid döneminde ilan edildi.' },

  // ==================== COĞRAFYA ====================
  // Zorluk 1
  { konu: 'Coğrafya', altKonu: 'Türkiye', zorluk: 1, sinifSeviyesi: 9,
    soruMetni: 'Türkiye\'nin başkenti neresidir?',
    secenekler: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'], dogruCevap: 'B',
    aciklama: 'Türkiye Cumhuriyeti\'nin başkenti Ankara\'dır.' },
  { konu: 'Coğrafya', altKonu: 'Türkiye', zorluk: 1, sinifSeviyesi: 9,
    soruMetni: 'Türkiye\'nin en kalabalık şehri hangisidir?',
    secenekler: ['Ankara', 'İstanbul', 'İzmir', 'Antalya'], dogruCevap: 'B',
    aciklama: 'İstanbul Türkiye\'nin en kalabalık şehridir.' },

  // Zorluk 2
  { konu: 'Coğrafya', altKonu: 'Dünya', zorluk: 2, sinifSeviyesi: 9,
    soruMetni: 'Dünya\'nın en büyük okyanusu hangisidir?',
    secenekler: ['Atlantik', 'Hint', 'Pasifik', 'Arktik'], dogruCevap: 'C',
    aciklama: 'Pasifik Okyanusu dünya\'nın en büyük okyanusudur.' },
  { konu: 'Coğrafya', altKonu: 'Türkiye', zorluk: 2, sinifSeviyesi: 9,
    soruMetni: 'Türkiye\'nin en uzun nehri hangisidir?',
    secenekler: ['Sakarya', 'Kızılırmak', 'Yeşilırmak', 'Fırat'], dogruCevap: 'B',
    aciklama: 'Kızılırmak (1355 km) Türkiye\'nin en uzun nehridir.' },

  // Zorluk 3
  { konu: 'Coğrafya', altKonu: 'İklim', zorluk: 3, sinifSeviyesi: 10,
    soruMetni: 'Akdeniz ikliminin yaz mevsimi özelliği nedir?',
    secenekler: ['Serin ve yağışlı', 'Sıcak ve kurak', 'Ilıman ve yağışlı', 'Soğuk ve kurak'], dogruCevap: 'B',
    aciklama: 'Akdeniz ikliminde yazlar sıcak ve kurak geçer.' },
  { konu: 'Coğrafya', altKonu: 'Nüfus', zorluk: 3, sinifSeviyesi: 10,
    soruMetni: 'Dünya\'nın en kalabalık ülkesi hangisidir?',
    secenekler: ['ABD', 'Hindistan', 'Çin', 'Endonezya'], dogruCevap: 'B',
    aciklama: 'Hindistan 2023 itibarıyla dünya\'nın en kalabalık ülkesidir.' },

  // Zorluk 4
  { konu: 'Coğrafya', altKonu: 'Ekonomi', zorluk: 4, sinifSeviyesi: 11,
    soruMetni: 'GSYH (Gayri Safi Yurt İçi Hasıla) neyi ölçer?',
    secenekler: ['Nüfus artışını', 'Ekonomik büyümeyi', 'İşsizlik oranını', 'Enflasyonu'], dogruCevap: 'B',
    aciklama: 'GSYH bir ülkenin ekonomik büyüklüğünü ölçer.' },

  // Zorluk 5
  { konu: 'Coğrafya', altKonu: 'Jeoloji', zorluk: 5, sinifSeviyesi: 11,
    soruMetni: 'Türkiye hangi deprem kuşağında yer alır?',
    secenekler: ['Pasifik', 'Alp-Himalaya', 'Atlantik', 'Hint'], dogruCevap: 'B',
    aciklama: 'Türkiye Alp-Himalaya deprem kuşağında yer alır.' },

  // ==================== TÜRKÇE ====================
  // Zorluk 1
  { konu: 'Türkçe', altKonu: 'Dil Bilgisi', zorluk: 1, sinifSeviyesi: 5,
    soruMetni: '"Kitap" kelimesinin çoğul hali nedir?',
    secenekler: ['Kitapçı', 'Kitaplar', 'Kitaplık', 'Kitapsız'], dogruCevap: 'B',
    aciklama: '-lar/-ler çoğul ekidir: kitap → kitaplar' },
  { konu: 'Türkçe', altKonu: 'Dil Bilgisi', zorluk: 1, sinifSeviyesi: 5,
    soruMetni: '"Güzel" kelimesi hangi sözcük türüdür?',
    secenekler: ['İsim', 'Fiil', 'Sıfat', 'Zarf'], dogruCevap: 'C',
    aciklama: 'Güzel bir niteleme sıfatıdır.' },

  // Zorluk 2
  { konu: 'Türkçe', altKonu: 'Edebiyat', zorluk: 2, sinifSeviyesi: 9,
    soruMetni: '"Nutuk" eserinin yazarı kimdir?',
    secenekler: ['Yahya Kemal', 'Mehmet Akif', 'Atatürk', 'Namık Kemal'], dogruCevap: 'C',
    aciklama: 'Nutuk, Mustafa Kemal Atatürk tarafından yazılmıştır.' },
  { konu: 'Türkçe', altKonu: 'Dil Bilgisi', zorluk: 2, sinifSeviyesi: 6,
    soruMetni: '"Koşarak geldim" cümlesindeki "koşarak" hangi sözcük türüdür?',
    secenekler: ['İsim', 'Sıfat', 'Zarf', 'Fiil'], dogruCevap: 'C',
    aciklama: 'Koşarak, eylemin nasıl yapıldığını bildiren zarftır.' },

  // Zorluk 3
  { konu: 'Türkçe', altKonu: 'Edebiyat', zorluk: 3, sinifSeviyesi: 10,
    soruMetni: 'Divan edebiyatının en yaygın nazım birimi hangisidir?',
    secenekler: ['Dörtlük', 'Beyit', 'Bent', 'Mısra'], dogruCevap: 'B',
    aciklama: 'Divan edebiyatında şiirler beyit (iki mısra) esasına dayanır.' },
  { konu: 'Türkçe', altKonu: 'Edebiyat', zorluk: 3, sinifSeviyesi: 11,
    soruMetni: '"Safahat" hangi şairin eseridir?',
    secenekler: ['Tevfik Fikret', 'Mehmet Akif Ersoy', 'Yahya Kemal', 'Ziya Gökalp'], dogruCevap: 'B',
    aciklama: 'Safahat, Mehmet Akif Ersoy\'un şiir kitabıdır.' },

  // Zorluk 4
  { konu: 'Türkçe', altKonu: 'Edebiyat', zorluk: 4, sinifSeviyesi: 11,
    soruMetni: 'Servet-i Fünun dergisi hangi yıl yayın hayatına başlamıştır?',
    secenekler: ['1891', '1894', '1896', '1901'], dogruCevap: 'C',
    aciklama: 'Servet-i Fünun dergisi 1896\'da yayına başlamıştır.' },

  // Zorluk 5
  { konu: 'Türkçe', altKonu: 'Edebiyat', zorluk: 5, sinifSeviyesi: 12,
    soruMetni: 'Türk edebiyatında "şiirde serbest müstezat" kim tarafından kullanılmıştır?',
    secenekler: ['Namık Kemal', 'Tevfik Fikret', 'Abdülhak Hamit', 'Recaizade Mahmut Ekrem'], dogruCevap: 'B',
    aciklama: 'Tevfik Fikret serbest müstezadı şiirde yaygınlaştırmıştır.' },

  // ==================== İNGİLİZCE ====================
  // Zorluk 1
  { konu: 'İngilizce', altKonu: 'Vocabulary', zorluk: 1, sinifSeviyesi: 5,
    soruMetni: '"Apple" kelimesinin Türkçe karşılığı nedir?',
    secenekler: ['Armut', 'Elma', 'Portakal', 'Muz'], dogruCevap: 'B',
    aciklama: 'Apple = Elma' },
  { konu: 'İngilizce', altKonu: 'Grammar', zorluk: 1, sinifSeviyesi: 5,
    soruMetni: '"I ___ a student." cümlesindeki boşluğa ne gelmelidir?',
    secenekler: ['is', 'am', 'are', 'be'], dogruCevap: 'B',
    aciklama: 'I ile birlikte "am" kullanılır: I am a student.' },

  // Zorluk 2
  { konu: 'İngilizce', altKonu: 'Grammar', zorluk: 2, sinifSeviyesi: 7,
    soruMetni: '"She ___ to school every day." cümlesindeki boşluğa ne gelir?',
    secenekler: ['go', 'goes', 'going', 'went'], dogruCevap: 'B',
    aciklama: 'Simple Present\'te he/she/it ile fiil -s/-es alır.' },
  { konu: 'İngilizce', altKonu: 'Vocabulary', zorluk: 2, sinifSeviyesi: 6,
    soruMetni: '"Beautiful" kelimesinin zıt anlamlısı nedir?',
    secenekler: ['Nice', 'Ugly', 'Pretty', 'Good'], dogruCevap: 'B',
    aciklama: 'Beautiful (güzel) ↔ Ugly (çirkin)' },

  // Zorluk 3
  { konu: 'İngilizce', altKonu: 'Grammar', zorluk: 3, sinifSeviyesi: 9,
    soruMetni: '"I have been studying for two hours." Bu cümle hangi tense\'dir?',
    secenekler: ['Present Perfect', 'Past Perfect', 'Present Perfect Continuous', 'Past Continuous'], dogruCevap: 'C',
    aciklama: 'have/has been + V-ing = Present Perfect Continuous' },
  { konu: 'İngilizce', altKonu: 'Grammar', zorluk: 3, sinifSeviyesi: 8,
    soruMetni: '"If I were you, I would study harder." Bu cümle hangi conditional türüdür?',
    secenekler: ['Zero', 'First', 'Second', 'Third'], dogruCevap: 'C',
    aciklama: 'If + Past Simple, would + V1 = Second Conditional' },

  // Zorluk 4
  { konu: 'İngilizce', altKonu: 'Grammar', zorluk: 4, sinifSeviyesi: 10,
    soruMetni: '"The book ___ by the author last year." Passive voice için doğru seçenek hangisidir?',
    secenekler: ['wrote', 'was written', 'has written', 'is written'], dogruCevap: 'B',
    aciklama: 'Past Simple Passive: was/were + V3' },

  // Zorluk 5
  { konu: 'İngilizce', altKonu: 'Grammar', zorluk: 5, sinifSeviyesi: 11,
    soruMetni: '"Had I known about the meeting, I would have attended." Bu hangi yapıdır?',
    secenekler: ['Inversion', 'Cleft sentence', 'Ellipsis', 'Fronting'], dogruCevap: 'A',
    aciklama: 'If → Had ile yer değiştirirse inversion olur.' },
];

// XP ödülleri zorluk seviyesine göre
const xpOdulleri: Record<number, number> = {
  1: 10,  // Çok Kolay
  2: 15,  // Kolay  
  3: 20,  // Orta
  4: 30,  // Zor
  5: 50,  // Çok Zor
};

// Rozet XP ödülleri
const rozetXpOdulleri: Record<RozetTipi, number> = {
  // Streak
  [RozetTipi.STREAK_7]: 50,
  [RozetTipi.STREAK_30]: 150,
  [RozetTipi.STREAK_100]: 500,
  [RozetTipi.STREAK_365]: 2000,
  
  // Ödev
  [RozetTipi.ILK_ODEV]: 25,
  [RozetTipi.ODEV_10]: 100,
  [RozetTipi.ODEV_50]: 300,
  [RozetTipi.ODEV_100]: 600,
  
  // Sınav
  [RozetTipi.ILK_SINAV]: 25,
  [RozetTipi.SINAV_90]: 200,
  [RozetTipi.SINAV_100]: 500,
  [RozetTipi.SINAV_10]: 150,
  
  // Zaman
  [RozetTipi.ERKEN_KUS]: 100,
  [RozetTipi.GECE_KUSU]: 100,
  [RozetTipi.HAFTA_SONU]: 150,
  
  // Sosyal
  [RozetTipi.SOSYAL_KELEBEK]: 100,
  [RozetTipi.YARDIMCI]: 200,
  
  // Canlı Ders
  [RozetTipi.CANLI_DERS_10]: 100,
  [RozetTipi.CANLI_DERS_50]: 400,
  
  // XP
  [RozetTipi.XP_1000]: 50,
  [RozetTipi.XP_5000]: 100,
  [RozetTipi.XP_10000]: 200,
  [RozetTipi.XP_25000]: 400,
  [RozetTipi.XP_50000]: 1000,
  
  // Günün Sorusu
  [RozetTipi.GUN_SORUSU_7]: 75,
  [RozetTipi.GUN_SORUSU_30]: 250,
  [RozetTipi.GUN_SORUSU_DOGRU_10]: 150,
  
  // Hız
  [RozetTipi.HIZ_SAMPIYONU]: 200,
  [RozetTipi.ERKEN_TESLIM]: 150,
  
  // Özel
  [RozetTipi.SISTEM_MIMARI]: 500,
  [RozetTipi.BETA_TESTER]: 300,
  [RozetTipi.KUSURSUZ_HAFTA]: 250,
};

// XP seviye hesaplama
function hesaplaXPSeviye(xp: number): XPSeviye {
  if (xp >= 30000) return XPSeviye.EFSANE;
  if (xp >= 15000) return XPSeviye.UZMAN;
  if (xp >= 5000) return XPSeviye.USTA;
  if (xp >= 1000) return XPSeviye.CIRAK;
  return XPSeviye.BASLANGIC;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const now = new Date();
const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🎮 Gamification ve Soru Havuzu Seed Başlıyor...\n');

  // ==================== 1. SORU HAVUZU ====================
  console.log('❓ Soru havuzu oluşturuluyor...');
  
  let soruCount = 0;
  for (const soru of sorular) {
    const existing = await prisma.soruHavuzu.findFirst({
      where: { soruMetni: soru.soruMetni }
    });
    
    if (!existing) {
      await prisma.soruHavuzu.create({
        data: {
          soruMetni: soru.soruMetni,
          secenekler: JSON.stringify(soru.secenekler),
          dogruCevap: soru.dogruCevap,
          aciklama: soru.aciklama,
          konu: soru.konu,
          altKonu: soru.altKonu,
          sinifSeviyesi: soru.sinifSeviyesi,
          zorluk: soru.zorluk,
          aktif: true,
        }
      });
      soruCount++;
    }
  }
  console.log(`   ✅ ${soruCount} soru havuzuna eklendi\n`);

  // ==================== 2. GÜNÜN SORULARI (Her sınıf seviyesi için ayrı) ====================
  console.log('📅 Son 30 gün için günün soruları oluşturuluyor...');
  console.log('   📌 Her gün için 8 farklı sınıf seviyesi (5-12) ayrı soru alacak\n');
  
  // Soru havuzundan soruları sınıf seviyesine göre grupla
  const havuzSorulari = await prisma.soruHavuzu.findMany({
    where: { aktif: true }
  });

  // Sınıf seviyelerine göre soruları grupla
  const sorularBySinif: Record<number, typeof havuzSorulari> = {};
  for (let seviye = 5; seviye <= 12; seviye++) {
    // Her sınıf seviyesi için uygun soruları filtrele
    // sinifSeviyesi eşit veya altı olan sorular (örn: 8. sınıf için 5-8 arası sorular)
    sorularBySinif[seviye] = havuzSorulari.filter(s => 
      s.sinifSeviyesi !== null && s.sinifSeviyesi <= seviye
    );
    
    // Eğer o seviyeye uygun soru yoksa tüm sorulardan rastgele seç
    if (sorularBySinif[seviye].length === 0) {
      sorularBySinif[seviye] = havuzSorulari;
    }
  }

  let gununSorusuCount = 0;
  const sinifSeviyeleri = [5, 6, 7, 8, 9, 10, 11, 12];

  for (let i = 0; i < 30; i++) {
    const tarih = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    tarih.setHours(0, 0, 0, 0);
    
    // Her sınıf seviyesi için ayrı soru oluştur
    for (const sinifSeviyesi of sinifSeviyeleri) {
      const existing = await prisma.gununSorusu.findUnique({ 
        where: { tarih_sinifSeviyesi: { tarih, sinifSeviyesi } }
      });
      if (existing) continue;

      // Bu sınıf seviyesine uygun sorulardan rastgele seç
      const uygunSorular = sorularBySinif[sinifSeviyesi];
      const randomSoru = randomElement(uygunSorular);
      
      try {
        await prisma.gununSorusu.create({
          data: {
            tarih: tarih,
            sinifSeviyesi: sinifSeviyesi,
            soruHavuzuId: randomSoru.id,
            soruMetni: randomSoru.soruMetni,
            secenekler: randomSoru.secenekler,
            dogruCevap: randomSoru.dogruCevap,
            aciklama: randomSoru.aciklama,
            zorluk: randomSoru.zorluk,
            xpOdulu: xpOdulleri[randomSoru.zorluk],
            konu: randomSoru.konu,
          }
        });
        gununSorusuCount++;
      } catch (e) {
        // Duplicate, atla
      }
    }
  }
  console.log(`   ✅ ${gununSorusuCount} günün sorusu oluşturuldu (30 gün × 8 sınıf = 240 soru)\n`);

  // ==================== 3. ÖĞRENCİLERE ROZET VE XP DAĞIT ====================
  console.log('🏆 Öğrencilere rozet ve XP dağıtılıyor...');
  
  const ogrenciler = await prisma.user.findMany({
    where: { role: 'ogrenci', aktif: true },
    take: 100
  });

  // Önce eski rozetleri temizle (enum değiştiği için)
  await prisma.rozet.deleteMany({});
  console.log('   🗑️ Eski rozetler temizlendi');

  let rozetCount = 0;
  let xpUpdateCount = 0;

  // Dağıtılacak rozet grupları
  const yeniRozetler = [
    RozetTipi.ILK_ODEV,
    RozetTipi.ILK_SINAV,
    RozetTipi.STREAK_7,
    RozetTipi.XP_1000,
    RozetTipi.ERKEN_KUS,
    RozetTipi.GUN_SORUSU_7,
    RozetTipi.ODEV_10,
    RozetTipi.CANLI_DERS_10,
  ];

  for (const ogrenci of ogrenciler) {
    // Her öğrenciye rastgele 2-5 rozet ver
    const rozetSayisi = randomInt(2, 5);
    const seciliRozetler = yeniRozetler
      .sort(() => Math.random() - 0.5)
      .slice(0, rozetSayisi);
    
    let toplamXp = 0;

    for (const rozetTipi of seciliRozetler) {
      try {
        const xpOdulu = rozetXpOdulleri[rozetTipi];
        
        await prisma.rozet.create({
          data: {
            userId: ogrenci.id,
            tip: rozetTipi,
            kazanilanTarih: randomDate(twoMonthsAgo, now),
            kazanilanXp: xpOdulu,
            // Bazı rozetler öğretmen tarafından ödüllendirilmiş
            ogretmenOdullendirdi: Math.random() > 0.7,
            odullendirmeTarihi: Math.random() > 0.7 ? randomDate(oneMonthAgo, now) : undefined,
            odullendirmeNotu: Math.random() > 0.7 ? 'Tebrikler! Harika bir başarı!' : undefined,
          }
        });
        
        toplamXp += xpOdulu;
        rozetCount++;
      } catch (e) {
        // Duplicate, atla
      }
    }

    // XP ve seviye güncelle
    const yeniXp = randomInt(500, 20000) + toplamXp;
    const streak = randomInt(0, 50);
    
    await prisma.user.update({
      where: { id: ogrenci.id },
      data: {
        xpPuani: yeniXp,
        xpSeviye: hesaplaXPSeviye(yeniXp),
        streak: streak,
        enYuksekStreak: streak + randomInt(0, 20),
        sonAktiviteTarihi: randomDate(oneMonthAgo, now),
        toplamCozulenSoru: randomInt(50, 500),
        toplamDogruCevap: randomInt(30, 400),
        toplamTeslimOdev: randomInt(5, 50),
        toplamKatilinanDers: randomInt(20, 200),
      }
    });
    xpUpdateCount++;
  }
  console.log(`   ✅ ${rozetCount} rozet dağıtıldı`);
  console.log(`   ✅ ${xpUpdateCount} öğrencinin XP ve seviyeleri güncellendi\n`);

  // ==================== 4. GÜNLÜK GÖREVLER ====================
  console.log('✅ Günlük görevler oluşturuluyor...');
  
  // Eski günlük görevleri temizle
  await prisma.gunlukGorev.deleteMany({});
  
  const gorevTipleri = [
    { tip: GorevTipi.SORU_COZ, hedef: 10, xp: 20 },
    { tip: GorevTipi.ODEV_TESLIM, hedef: 1, xp: 30 },
    { tip: GorevTipi.GUN_SORUSU, hedef: 1, xp: 15 },
    { tip: GorevTipi.MATERYAL_INCELE, hedef: 2, xp: 10 },
    { tip: GorevTipi.CANLI_DERS, hedef: 1, xp: 25 },
  ];

  let gorevCount = 0;
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  for (const ogrenci of ogrenciler.slice(0, 50)) {
    for (const gorev of gorevTipleri) {
      try {
        const ilerleme = randomInt(0, gorev.hedef);
        await prisma.gunlukGorev.create({
          data: {
            userId: ogrenci.id,
            tarih: bugun,
            tip: gorev.tip,
            hedef: gorev.hedef,
            ilerleme: ilerleme,
            tamamlandi: ilerleme >= gorev.hedef,
            xpOdulu: gorev.xp,
          }
        });
        gorevCount++;
      } catch (e) {
        // Duplicate, atla
      }
    }
  }
  console.log(`   ✅ ${gorevCount} günlük görev oluşturuldu\n`);

  // ==================== ÖZET ====================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 GAMİFİCATİON SEED TAMAMLANDI!');
  console.log('═══════════════════════════════════════════════════════════\n');

  // İstatistikler
  const soruHavuzuCount = await prisma.soruHavuzu.count();
  const gununSorularCount = await prisma.gununSorusu.count();
  const rozetlerCount = await prisma.rozet.count();
  const gorevlerCount = await prisma.gunlukGorev.count();

  // XP Seviye dağılımı
  const xpDagilimi = await prisma.user.groupBy({
    by: ['xpSeviye'],
    where: { role: 'ogrenci' },
    _count: true
  });

  // Günün sorusu sınıf dağılımı
  const gsSinifDagilimi = await prisma.gununSorusu.groupBy({
    by: ['sinifSeviyesi'],
    _count: true,
    orderBy: { sinifSeviyesi: 'asc' }
  });

  console.log('📊 İSTATİSTİKLER:');
  console.log(`   ❓ Soru Havuzu: ${soruHavuzuCount} soru`);
  console.log(`   📅 Günün Sorusu: ${gununSorularCount} kayıt (30 gün × 8 sınıf)`);
  console.log(`   🏆 Toplam Rozet: ${rozetlerCount}`);
  console.log(`   ✅ Günlük Görev: ${gorevlerCount}\n`);
  
  console.log('📅 GÜNÜN SORUSU SINIF DAĞILIMI:');
  for (const gs of gsSinifDagilimi) {
    console.log(`   📚 ${gs.sinifSeviyesi}. Sınıf: ${gs._count} soru`);
  }

  console.log('📈 XP SEVİYE DAĞILIMI:');
  for (const d of xpDagilimi) {
    const emoji = d.xpSeviye === 'EFSANE' ? '💎' : 
                  d.xpSeviye === 'UZMAN' ? '🥇' :
                  d.xpSeviye === 'USTA' ? '🥈' :
                  d.xpSeviye === 'CIRAK' ? '🥉' : '⚪';
    console.log(`   ${emoji} ${d.xpSeviye}: ${d._count} öğrenci`);
  }

  // Konu dağılımı
  const konuDagilimi = await prisma.soruHavuzu.groupBy({
    by: ['konu'],
    _count: true
  });

  console.log('\n📚 SORU KONU DAĞILIMI:');
  for (const k of konuDagilimi) {
    console.log(`   📖 ${k.konu}: ${k._count} soru`);
  }

  // Zorluk dağılımı
  const zorlukDagilimi = await prisma.soruHavuzu.groupBy({
    by: ['zorluk'],
    _count: true,
    orderBy: { zorluk: 'asc' }
  });

  console.log('\n🎯 ZORLUK DAĞILIMI:');
  const zorlukLabels = ['', 'Çok Kolay', 'Kolay', 'Orta', 'Zor', 'Çok Zor'];
  for (const z of zorlukDagilimi) {
    const stars = '⭐'.repeat(z.zorluk);
    console.log(`   ${stars} ${zorlukLabels[z.zorluk]}: ${z._count} soru`);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

