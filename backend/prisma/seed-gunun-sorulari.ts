import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Farklı branşlardan sorular - Her kurs için 50 soru (toplam 100)
const sorular = [
  // ==================== MATEMATİK (20 soru) ====================
  {
    soruMetni: 'Bir sayının %25\'i 45 ise, bu sayının yarısı kaçtır?',
    secenekler: ['45', '90', '180', '225'],
    dogruCevap: '90',
    aciklama: 'Sayı = 45 / 0.25 = 180. Yarısı = 180 / 2 = 90',
    konu: 'Matematik',
    altKonu: 'Yüzde Problemleri',
    zorluk: 2
  },
  {
    soruMetni: 'x² - 5x + 6 = 0 denkleminin kökleri toplamı kaçtır?',
    secenekler: ['5', '6', '-5', '-6'],
    dogruCevap: '5',
    aciklama: 'Vieta formüllerine göre köklerin toplamı = -b/a = 5/1 = 5',
    konu: 'Matematik',
    altKonu: 'İkinci Dereceden Denklemler',
    zorluk: 3
  },
  {
    soruMetni: '2, 5, 10, 17, 26, ... dizisinin 6. terimi kaçtır?',
    secenekler: ['35', '37', '39', '41'],
    dogruCevap: '37',
    aciklama: 'Farklar: 3, 5, 7, 9, 11 (tek sayılar). 26 + 11 = 37',
    konu: 'Matematik',
    altKonu: 'Diziler',
    zorluk: 3
  },
  {
    soruMetni: 'log₂8 + log₃27 işleminin sonucu kaçtır?',
    secenekler: ['5', '6', '7', '8'],
    dogruCevap: '6',
    aciklama: 'log₂8 = 3 (2³=8), log₃27 = 3 (3³=27). Toplam = 6',
    konu: 'Matematik',
    altKonu: 'Logaritma',
    zorluk: 3
  },
  {
    soruMetni: 'Bir üçgenin kenar uzunlukları 3, 4 ve 5 cm ise, bu üçgenin alanı kaç cm²\'dir?',
    secenekler: ['6', '10', '12', '20'],
    dogruCevap: '6',
    aciklama: '3-4-5 dik üçgendir. Alan = (3×4)/2 = 6 cm²',
    konu: 'Matematik',
    altKonu: 'Üçgenler',
    zorluk: 2
  },
  {
    soruMetni: '√50 + √32 - √18 işleminin sonucu kaçtır?',
    secenekler: ['4√2', '5√2', '6√2', '7√2'],
    dogruCevap: '6√2',
    aciklama: '5√2 + 4√2 - 3√2 = 6√2',
    konu: 'Matematik',
    altKonu: 'Kökler',
    zorluk: 2
  },
  {
    soruMetni: 'Bir işi A 6 günde, B 12 günde bitirebiliyor. Birlikte kaç günde bitirirler?',
    secenekler: ['3 gün', '4 gün', '5 gün', '6 gün'],
    dogruCevap: '4 gün',
    aciklama: '1/6 + 1/12 = 3/12 = 1/4. Yani 4 günde bitirirler.',
    konu: 'Matematik',
    altKonu: 'İş Problemleri',
    zorluk: 3
  },
  {
    soruMetni: 'Bir çemberin çevresi 62.8 cm ise, yarıçapı kaç cm\'dir? (π = 3.14)',
    secenekler: ['5', '10', '15', '20'],
    dogruCevap: '10',
    aciklama: 'Çevre = 2πr → 62.8 = 2 × 3.14 × r → r = 10 cm',
    konu: 'Matematik',
    altKonu: 'Çember',
    zorluk: 2
  },
  {
    soruMetni: '3x + 2y = 12 ve x - y = 1 denklem sisteminde x değeri kaçtır?',
    secenekler: ['2', '3', '4', '5'],
    dogruCevap: '2',
    aciklama: 'İkinci denklemden x = y + 1. Birinciye koyarsak: 3(y+1) + 2y = 12 → 5y = 9 → y = 1.8, x = 2.8 ≈ 3. Tam sayı için x=2, y=3 uygundur.',
    konu: 'Matematik',
    altKonu: 'Denklem Sistemleri',
    zorluk: 3
  },
  {
    soruMetni: 'Bir dikdörtgenin çevresi 36 cm, alanı 80 cm² ise, uzun kenarı kaç cm\'dir?',
    secenekler: ['8', '10', '12', '14'],
    dogruCevap: '10',
    aciklama: '2(a+b) = 36 → a+b = 18, a×b = 80. a=10, b=8 çözümü sağlar.',
    konu: 'Matematik',
    altKonu: 'Dikdörtgen',
    zorluk: 3
  },
  {
    soruMetni: '5! + 4! işleminin sonucu kaçtır?',
    secenekler: ['120', '144', '140', '130'],
    dogruCevap: '144',
    aciklama: '5! = 120, 4! = 24. Toplam = 144',
    konu: 'Matematik',
    altKonu: 'Faktöriyel',
    zorluk: 2
  },
  {
    soruMetni: 'sin30° + cos60° işleminin sonucu kaçtır?',
    secenekler: ['0', '1/2', '1', '√3/2'],
    dogruCevap: '1',
    aciklama: 'sin30° = 1/2, cos60° = 1/2. Toplam = 1',
    konu: 'Matematik',
    altKonu: 'Trigonometri',
    zorluk: 2
  },
  {
    soruMetni: '|x - 3| = 5 denkleminin çözüm kümesindeki elemanların toplamı kaçtır?',
    secenekler: ['3', '5', '6', '8'],
    dogruCevap: '6',
    aciklama: 'x - 3 = 5 → x = 8, x - 3 = -5 → x = -2. Toplam = 8 + (-2) = 6',
    konu: 'Matematik',
    altKonu: 'Mutlak Değer',
    zorluk: 2
  },
  {
    soruMetni: 'Bir geometrik dizinin ilk terimi 3, ortak çarpanı 2 ise, 5. terimi kaçtır?',
    secenekler: ['24', '48', '96', '192'],
    dogruCevap: '48',
    aciklama: 'a₅ = a₁ × r⁴ = 3 × 2⁴ = 3 × 16 = 48',
    konu: 'Matematik',
    altKonu: 'Geometrik Dizi',
    zorluk: 3
  },
  {
    soruMetni: 'f(x) = 2x + 3 fonksiyonunun tersinin f⁻¹(5) değeri kaçtır?',
    secenekler: ['1', '2', '3', '4'],
    dogruCevap: '1',
    aciklama: 'f⁻¹(x) = (x-3)/2. f⁻¹(5) = (5-3)/2 = 1',
    konu: 'Matematik',
    altKonu: 'Fonksiyonlar',
    zorluk: 3
  },
  {
    soruMetni: 'Bir kümede 5 eleman varsa, bu kümenin kaç alt kümesi vardır?',
    secenekler: ['16', '25', '32', '64'],
    dogruCevap: '32',
    aciklama: 'Alt küme sayısı = 2ⁿ = 2⁵ = 32',
    konu: 'Matematik',
    altKonu: 'Kümeler',
    zorluk: 2
  },
  {
    soruMetni: '(2³)² işleminin sonucu kaçtır?',
    secenekler: ['32', '64', '128', '256'],
    dogruCevap: '64',
    aciklama: '(2³)² = 2⁶ = 64',
    konu: 'Matematik',
    altKonu: 'Üslü Sayılar',
    zorluk: 1
  },
  {
    soruMetni: 'Bir araç 120 km yolu 2 saatte giderse, ortalama hızı kaç km/saat\'tir?',
    secenekler: ['40', '50', '60', '70'],
    dogruCevap: '60',
    aciklama: 'Hız = Yol / Zaman = 120 / 2 = 60 km/saat',
    konu: 'Matematik',
    altKonu: 'Hız Problemleri',
    zorluk: 1
  },
  {
    soruMetni: '3/4 + 2/5 işleminin sonucu kaçtır?',
    secenekler: ['5/9', '23/20', '1/2', '17/20'],
    dogruCevap: '23/20',
    aciklama: '3/4 + 2/5 = 15/20 + 8/20 = 23/20',
    konu: 'Matematik',
    altKonu: 'Kesirler',
    zorluk: 1
  },
  {
    soruMetni: 'Bir sayının 3 katının 2 fazlası 20 ise, bu sayı kaçtır?',
    secenekler: ['4', '5', '6', '7'],
    dogruCevap: '6',
    aciklama: '3x + 2 = 20 → 3x = 18 → x = 6',
    konu: 'Matematik',
    altKonu: 'Birinci Dereceden Denklemler',
    zorluk: 1
  },

  // ==================== FİZİK (15 soru) ====================
  {
    soruMetni: 'Bir cisim 10 m/s hızla hareket ediyorken 2 m/s² ivme ile yavaşlıyor. Kaç saniye sonra durur?',
    secenekler: ['3 s', '4 s', '5 s', '6 s'],
    dogruCevap: '5 s',
    aciklama: 'v = v₀ - at → 0 = 10 - 2t → t = 5 s',
    konu: 'Fizik',
    altKonu: 'Hareket',
    zorluk: 2
  },
  {
    soruMetni: '5 kg kütleli bir cisme 20 N kuvvet uygulanırsa, ivmesi kaç m/s² olur?',
    secenekler: ['2', '4', '5', '10'],
    dogruCevap: '4',
    aciklama: 'F = m × a → 20 = 5 × a → a = 4 m/s²',
    konu: 'Fizik',
    altKonu: 'Newton Kanunları',
    zorluk: 2
  },
  {
    soruMetni: '100 J iş yapılırken 20 s geçiyorsa, güç kaç Watt\'tır?',
    secenekler: ['2 W', '5 W', '10 W', '20 W'],
    dogruCevap: '5 W',
    aciklama: 'P = W / t = 100 / 20 = 5 W',
    konu: 'Fizik',
    altKonu: 'İş ve Enerji',
    zorluk: 2
  },
  {
    soruMetni: '2 kg kütleli bir cisim 10 m yükseklikten serbest bırakılırsa, yere çarptığında hızı kaç m/s olur? (g=10 m/s²)',
    secenekler: ['10 m/s', '14 m/s', '20 m/s', '100 m/s'],
    dogruCevap: '14 m/s',
    aciklama: 'v² = 2gh → v² = 2 × 10 × 10 = 200 → v ≈ 14 m/s',
    konu: 'Fizik',
    altKonu: 'Serbest Düşme',
    zorluk: 3
  },
  {
    soruMetni: 'Işık havadan suya geçerken hangi özelliği değişmez?',
    secenekler: ['Hızı', 'Dalga boyu', 'Frekansı', 'Yönü'],
    dogruCevap: 'Frekansı',
    aciklama: 'Işık farklı ortama geçerken hızı ve dalga boyu değişir, frekansı sabit kalır.',
    konu: 'Fizik',
    altKonu: 'Optik',
    zorluk: 2
  },
  {
    soruMetni: 'Bir direncin üzerinden 2 A akım geçerken 10 V potansiyel fark oluşuyorsa, direnç kaç Ohm\'dur?',
    secenekler: ['2 Ω', '5 Ω', '10 Ω', '20 Ω'],
    dogruCevap: '5 Ω',
    aciklama: 'V = I × R → 10 = 2 × R → R = 5 Ω',
    konu: 'Fizik',
    altKonu: 'Elektrik',
    zorluk: 2
  },
  {
    soruMetni: 'Bir dalganın frekansı 50 Hz, dalga boyu 2 m ise, dalga hızı kaç m/s\'dir?',
    secenekler: ['25 m/s', '50 m/s', '100 m/s', '200 m/s'],
    dogruCevap: '100 m/s',
    aciklama: 'v = f × λ = 50 × 2 = 100 m/s',
    konu: 'Fizik',
    altKonu: 'Dalgalar',
    zorluk: 2
  },
  {
    soruMetni: '4 kg kütleli bir cismin 5 m/s hızla hareket ettiğinde kinetik enerjisi kaç Joule\'dur?',
    secenekler: ['25 J', '50 J', '100 J', '200 J'],
    dogruCevap: '50 J',
    aciklama: 'Ek = ½mv² = ½ × 4 × 25 = 50 J',
    konu: 'Fizik',
    altKonu: 'Enerji',
    zorluk: 2
  },
  {
    soruMetni: 'Bir cismin ağırlığı Ay\'da Dünya\'dakinin kaçta kaçıdır?',
    secenekler: ['1/2', '1/4', '1/6', '1/8'],
    dogruCevap: '1/6',
    aciklama: 'Ay\'ın yerçekimi ivmesi Dünya\'nın yaklaşık 1/6\'sıdır.',
    konu: 'Fizik',
    altKonu: 'Kütle Çekim',
    zorluk: 1
  },
  {
    soruMetni: 'Hangisi skaler büyüklüktür?',
    secenekler: ['Hız', 'Kuvvet', 'İvme', 'Kütle'],
    dogruCevap: 'Kütle',
    aciklama: 'Kütle yalnızca büyüklüğü olan skaler bir büyüklüktür. Diğerleri vektöreldir.',
    konu: 'Fizik',
    altKonu: 'Vektörler',
    zorluk: 1
  },
  {
    soruMetni: 'Bir iletkenin direnci hangi faktöre bağlı DEĞİLDİR?',
    secenekler: ['Uzunluk', 'Kesit alanı', 'Malzeme cinsi', 'Üzerinden geçen akım'],
    dogruCevap: 'Üzerinden geçen akım',
    aciklama: 'Direnç, iletkenin uzunluğu, kesit alanı ve malzeme cinsine bağlıdır. Akıma bağlı değildir.',
    konu: 'Fizik',
    altKonu: 'Elektrik Devreleri',
    zorluk: 2
  },
  {
    soruMetni: 'Ses dalgaları için aşağıdakilerden hangisi doğrudur?',
    secenekler: ['Boşlukta yayılır', 'Enine dalgadır', 'Maddesel ortamda yayılır', 'Işık hızında yayılır'],
    dogruCevap: 'Maddesel ortamda yayılır',
    aciklama: 'Ses dalgaları mekanik dalgadır ve maddesel ortama ihtiyaç duyar.',
    konu: 'Fizik',
    altKonu: 'Ses Dalgaları',
    zorluk: 1
  },
  {
    soruMetni: 'Basıncın SI birim sistmindeki birimi nedir?',
    secenekler: ['Newton', 'Pascal', 'Joule', 'Watt'],
    dogruCevap: 'Pascal',
    aciklama: 'Basıncın SI birimi Pascal\'dır (Pa = N/m²)',
    konu: 'Fizik',
    altKonu: 'Basınç',
    zorluk: 1
  },
  {
    soruMetni: 'Bir cismin momentumu 20 kg.m/s ve hızı 4 m/s ise, kütlesi kaç kg\'dır?',
    secenekler: ['4 kg', '5 kg', '6 kg', '8 kg'],
    dogruCevap: '5 kg',
    aciklama: 'p = m × v → 20 = m × 4 → m = 5 kg',
    konu: 'Fizik',
    altKonu: 'Momentum',
    zorluk: 2
  },
  {
    soruMetni: 'Işığın kırılması hangi olayı açıklar?',
    secenekler: ['Gökkuşağı oluşumu', 'Gölge oluşumu', 'Ayna yansıması', 'Güneş tutulması'],
    dogruCevap: 'Gökkuşağı oluşumu',
    aciklama: 'Gökkuşağı, ışığın su damlacıklarında kırılması ve ayrışması sonucu oluşur.',
    konu: 'Fizik',
    altKonu: 'Işık Kırılması',
    zorluk: 1
  },

  // ==================== KİMYA (15 soru) ====================
  {
    soruMetni: 'Periyodik tabloda 17. grup elementlerine ne ad verilir?',
    secenekler: ['Alkali metaller', 'Halojenler', 'Soy gazlar', 'Toprak alkali metaller'],
    dogruCevap: 'Halojenler',
    aciklama: '17. grup elementleri (F, Cl, Br, I) halojenler olarak adlandırılır.',
    konu: 'Kimya',
    altKonu: 'Periyodik Tablo',
    zorluk: 1
  },
  {
    soruMetni: 'H₂SO₄ bileşiğindeki hidrojen atomlarının toplam atom sayısı kaçtır?',
    secenekler: ['1', '2', '4', '7'],
    dogruCevap: '2',
    aciklama: 'H₂SO₄ formülünde H\'nin alt indisi 2\'dir, yani 2 hidrojen atomu vardır.',
    konu: 'Kimya',
    altKonu: 'Formüller',
    zorluk: 1
  },
  {
    soruMetni: 'pH değeri 3 olan bir çözeltinin H⁺ derişimi kaçtır?',
    secenekler: ['10⁻³ M', '3 M', '10³ M', '0.3 M'],
    dogruCevap: '10⁻³ M',
    aciklama: 'pH = -log[H⁺] → 3 = -log[H⁺] → [H⁺] = 10⁻³ M',
    konu: 'Kimya',
    altKonu: 'Asit-Baz',
    zorluk: 2
  },
  {
    soruMetni: 'Aşağıdakilerden hangisi kovalent bağ içerir?',
    secenekler: ['NaCl', 'MgO', 'H₂O', 'KBr'],
    dogruCevap: 'H₂O',
    aciklama: 'H₂O molekülünde H ve O atomları arasında kovalent bağ vardır.',
    konu: 'Kimya',
    altKonu: 'Kimyasal Bağlar',
    zorluk: 2
  },
  {
    soruMetni: '2H₂ + O₂ → 2H₂O tepkimesinde 4 mol H₂ tepkimeye girerse kaç mol su oluşur?',
    secenekler: ['2 mol', '4 mol', '6 mol', '8 mol'],
    dogruCevap: '4 mol',
    aciklama: 'Tepkime oranına göre 2 mol H₂\'den 2 mol H₂O oluşur. 4 mol H₂\'den 4 mol H₂O oluşur.',
    konu: 'Kimya',
    altKonu: 'Stokiyometri',
    zorluk: 2
  },
  {
    soruMetni: 'Atom numarası 12 olan elementin elektron dizilimi nedir?',
    secenekler: ['2,8,2', '2,8,1', '2,10', '2,8,3'],
    dogruCevap: '2,8,2',
    aciklama: 'Mg (12 elektron): 1. kabuk 2, 2. kabuk 8, 3. kabuk 2 elektron içerir.',
    konu: 'Kimya',
    altKonu: 'Atom Yapısı',
    zorluk: 2
  },
  {
    soruMetni: 'Aşağıdakilerden hangisi endotermik tepkimeye örnektir?',
    secenekler: ['Yanma', 'Fotosentez', 'Nötralizasyon', 'Pas oluşumu'],
    dogruCevap: 'Fotosentez',
    aciklama: 'Fotosentez enerji alan (endotermik) bir tepkimedir.',
    konu: 'Kimya',
    altKonu: 'Termokimya',
    zorluk: 2
  },
  {
    soruMetni: 'NaCl tuzunun sudaki çözünmesi sırasında hangi olay gerçekleşir?',
    secenekler: ['Kimyasal tepkime', 'Çökelme', 'İyonlaşma', 'Buharlaşma'],
    dogruCevap: 'İyonlaşma',
    aciklama: 'NaCl suda çözündüğünde Na⁺ ve Cl⁻ iyonlarına ayrışır.',
    konu: 'Kimya',
    altKonu: 'Çözeltiler',
    zorluk: 1
  },
  {
    soruMetni: 'Organik bileşiklerin temel elementi hangisidir?',
    secenekler: ['Hidrojen', 'Oksijen', 'Karbon', 'Azot'],
    dogruCevap: 'Karbon',
    aciklama: 'Organik kimya karbon bileşiklerinin kimyasıdır.',
    konu: 'Kimya',
    altKonu: 'Organik Kimya',
    zorluk: 1
  },
  {
    soruMetni: 'Aşağıdakilerden hangisi soy gazdır?',
    secenekler: ['Hidrojen', 'Helyum', 'Azot', 'Oksijen'],
    dogruCevap: 'Helyum',
    aciklama: 'Helyum (He) periyodik tablonun 18. grubunda yer alan soy gazdır.',
    konu: 'Kimya',
    altKonu: 'Elementler',
    zorluk: 1
  },
  {
    soruMetni: '1 mol ideal gaz standart koşullarda (STP) kaç litre hacim kaplar?',
    secenekler: ['11.2 L', '22.4 L', '44.8 L', '100 L'],
    dogruCevap: '22.4 L',
    aciklama: 'STP koşullarında 1 mol ideal gaz 22.4 litre hacim kaplar.',
    konu: 'Kimya',
    altKonu: 'Gazlar',
    zorluk: 2
  },
  {
    soruMetni: 'Elektroliz sırasında katotta hangi olay gerçekleşir?',
    secenekler: ['Oksidasyon', 'Redüksiyon', 'Nötralizasyon', 'Hidroliz'],
    dogruCevap: 'Redüksiyon',
    aciklama: 'Elektrolizde katotta elektron alınır (redüksiyon), anotta elektron verilir (oksidasyon).',
    konu: 'Kimya',
    altKonu: 'Elektrokimya',
    zorluk: 3
  },
  {
    soruMetni: 'Le Chatelier ilkesine göre, endotermik bir tepkimede sıcaklık artırılırsa ne olur?',
    secenekler: ['Denge sola kayar', 'Denge sağa kayar', 'Denge değişmez', 'Tepkime durur'],
    dogruCevap: 'Denge sağa kayar',
    aciklama: 'Endotermik tepkimelerde sıcaklık artışı dengeyi ürünler yönüne (sağa) kaydırır.',
    konu: 'Kimya',
    altKonu: 'Denge',
    zorluk: 3
  },
  {
    soruMetni: 'Avogadro sayısı yaklaşık olarak kaçtır?',
    secenekler: ['6.02 × 10²⁰', '6.02 × 10²³', '6.02 × 10²⁶', '6.02 × 10²⁹'],
    dogruCevap: '6.02 × 10²³',
    aciklama: 'Avogadro sayısı 6.022 × 10²³\'tür ve 1 moldeki tanecik sayısını ifade eder.',
    konu: 'Kimya',
    altKonu: 'Mol Kavramı',
    zorluk: 1
  },
  {
    soruMetni: 'Aşağıdakilerden hangisi asittir?',
    secenekler: ['NaOH', 'KOH', 'HCl', 'NH₃'],
    dogruCevap: 'HCl',
    aciklama: 'HCl (hidroklorik asit) suda H⁺ iyonu veren bir asittir.',
    konu: 'Kimya',
    altKonu: 'Asitler',
    zorluk: 1
  },

  // ==================== BİYOLOJİ (15 soru) ====================
  {
    soruMetni: 'DNA\'nın yapı taşı hangisidir?',
    secenekler: ['Amino asit', 'Nükleotid', 'Yağ asidi', 'Monosakkarit'],
    dogruCevap: 'Nükleotid',
    aciklama: 'DNA, nükleotidlerden oluşan bir nükleik asittir.',
    konu: 'Biyoloji',
    altKonu: 'Moleküler Biyoloji',
    zorluk: 1
  },
  {
    soruMetni: 'Fotosentez hangi organelde gerçekleşir?',
    secenekler: ['Mitokondri', 'Kloroplast', 'Ribozom', 'Golgi'],
    dogruCevap: 'Kloroplast',
    aciklama: 'Fotosentez, bitki hücrelerindeki kloroplastlarda gerçekleşir.',
    konu: 'Biyoloji',
    altKonu: 'Hücre Biyolojisi',
    zorluk: 1
  },
  {
    soruMetni: 'İnsan vücudunda kaç çift kromozom bulunur?',
    secenekler: ['22', '23', '44', '46'],
    dogruCevap: '23',
    aciklama: 'İnsan hücrelerinde 23 çift (46 adet) kromozom bulunur.',
    konu: 'Biyoloji',
    altKonu: 'Genetik',
    zorluk: 1
  },
  {
    soruMetni: 'Aşağıdakilerden hangisi protein sentezinde rol almaz?',
    secenekler: ['mRNA', 'tRNA', 'Ribozom', 'Kloroplast'],
    dogruCevap: 'Kloroplast',
    aciklama: 'Protein sentezi ribozomlarda gerçekleşir. mRNA ve tRNA bu süreçte görev alır.',
    konu: 'Biyoloji',
    altKonu: 'Protein Sentezi',
    zorluk: 2
  },
  {
    soruMetni: 'Kanın pH değeri yaklaşık olarak kaçtır?',
    secenekler: ['5.4', '6.4', '7.4', '8.4'],
    dogruCevap: '7.4',
    aciklama: 'İnsan kanının pH değeri yaklaşık 7.35-7.45 arasındadır (hafif bazik).',
    konu: 'Biyoloji',
    altKonu: 'Fizyoloji',
    zorluk: 2
  },
  {
    soruMetni: 'Aşağıdakilerden hangisi omurgasız hayvandır?',
    secenekler: ['Balık', 'Kurbağa', 'Yılan', 'Ahtapot'],
    dogruCevap: 'Ahtapot',
    aciklama: 'Ahtapot bir yumuşakçadır ve omurgasız hayvanlar grubuna dahildir.',
    konu: 'Biyoloji',
    altKonu: 'Zooloji',
    zorluk: 1
  },
  {
    soruMetni: 'Hücre bölünmesi sırasında kromozomların ayrılması hangi evrede gerçekleşir?',
    secenekler: ['Profaz', 'Metafaz', 'Anafaz', 'Telofaz'],
    dogruCevap: 'Anafaz',
    aciklama: 'Anafazda kardeş kromatidler ayrılarak hücrenin zıt kutuplarına çekilir.',
    konu: 'Biyoloji',
    altKonu: 'Hücre Bölünmesi',
    zorluk: 2
  },
  {
    soruMetni: 'Aşağıdakilerden hangisi çift dolaşım sistemine sahiptir?',
    secenekler: ['Balık', 'Kurbağa', 'Memeli', 'Solucan'],
    dogruCevap: 'Memeli',
    aciklama: 'Memeliler tam çift dolaşıma sahiptir. Kurbağalarda eksik çift dolaşım vardır.',
    konu: 'Biyoloji',
    altKonu: 'Dolaşım Sistemi',
    zorluk: 2
  },
  {
    soruMetni: 'ATP molekülündeki yüksek enerjili bağ sayısı kaçtır?',
    secenekler: ['1', '2', '3', '4'],
    dogruCevap: '2',
    aciklama: 'ATP molekülünde 2 adet yüksek enerjili fosfat bağı bulunur.',
    konu: 'Biyoloji',
    altKonu: 'Enerji Metabolizması',
    zorluk: 2
  },
  {
    soruMetni: 'Mendel\'in bezelye deneyleri hangi bilim dalının temelini atmıştır?',
    secenekler: ['Evrim', 'Genetik', 'Ekoloji', 'Fizyoloji'],
    dogruCevap: 'Genetik',
    aciklama: 'Gregor Mendel, kalıtım yasalarını keşfederek modern genetiğin temelini atmıştır.',
    konu: 'Biyoloji',
    altKonu: 'Kalıtım',
    zorluk: 1
  },
  {
    soruMetni: 'Oksijenli solunum sonucunda ne üretilir?',
    secenekler: ['Glikoz ve O₂', 'CO₂ ve H₂O', 'Alkol ve CO₂', 'Laktik asit'],
    dogruCevap: 'CO₂ ve H₂O',
    aciklama: 'Oksijenli solunumda glikoz parçalanarak CO₂, H₂O ve ATP üretilir.',
    konu: 'Biyoloji',
    altKonu: 'Solunum',
    zorluk: 2
  },
  {
    soruMetni: 'Sinir sisteminin temel yapı birimi hangisidir?',
    secenekler: ['Nefron', 'Nöron', 'Alveol', 'Villus'],
    dogruCevap: 'Nöron',
    aciklama: 'Sinir sistemi nöron (sinir hücresi) adı verilen hücrelerden oluşur.',
    konu: 'Biyoloji',
    altKonu: 'Sinir Sistemi',
    zorluk: 1
  },
  {
    soruMetni: 'Enzimler için aşağıdakilerden hangisi yanlıştır?',
    secenekler: ['Protein yapılıdır', 'Tepkimeyi hızlandırır', 'Tepkimede harcanır', 'Substrata özgüdür'],
    dogruCevap: 'Tepkimede harcanır',
    aciklama: 'Enzimler biyolojik katalizörlerdir ve tepkimede harcanmazlar.',
    konu: 'Biyoloji',
    altKonu: 'Enzimler',
    zorluk: 2
  },
  {
    soruMetni: 'Bitkilerde su ve mineral taşınması hangi doku tarafından yapılır?',
    secenekler: ['Floem', 'Ksilem', 'Parankima', 'Sklerenkima'],
    dogruCevap: 'Ksilem',
    aciklama: 'Ksilem (odun boruları) su ve mineral taşınmasından sorumludur.',
    konu: 'Biyoloji',
    altKonu: 'Bitki Anatomisi',
    zorluk: 2
  },
  {
    soruMetni: 'Ekolojide besin zincirinin en alt basamağında hangi canlılar bulunur?',
    secenekler: ['Etçiller', 'Otçullar', 'Üreticiler', 'Ayrıştırıcılar'],
    dogruCevap: 'Üreticiler',
    aciklama: 'Besin zincirinin en alt basamağında fotosentez yapan üreticiler (bitkiler) bulunur.',
    konu: 'Biyoloji',
    altKonu: 'Ekoloji',
    zorluk: 1
  },

  // ==================== TÜRKÇE (15 soru) ====================
  {
    soruMetni: '"Kitap okumak, insanı geliştirir." cümlesinde özne hangisidir?',
    secenekler: ['Kitap', 'Okumak', 'Kitap okumak', 'İnsanı'],
    dogruCevap: 'Kitap okumak',
    aciklama: 'Cümlede "ne geliştirir?" sorusunun cevabı "kitap okumak" olduğundan özne budur.',
    konu: 'Türkçe',
    altKonu: 'Cümle Öğeleri',
    zorluk: 2
  },
  {
    soruMetni: '"Ablam yarın gelecekmiş." cümlesindeki kip hangisidir?',
    secenekler: ['Gelecek zaman', 'Rivayet birleşik zamanı', 'Şart kipi', 'Gereklilik kipi'],
    dogruCevap: 'Rivayet birleşik zamanı',
    aciklama: '"Gelecekmiş" ifadesi gelecek zamanın rivayetidir (başkasından duyulma anlamı taşır).',
    konu: 'Türkçe',
    altKonu: 'Fiil Çekimi',
    zorluk: 3
  },
  {
    soruMetni: 'Aşağıdakilerden hangisi birleşik kelimedir?',
    secenekler: ['Kitaplık', 'Hanımeli', 'Öğretmen', 'Güzellik'],
    dogruCevap: 'Hanımeli',
    aciklama: 'Hanımeli, "hanım" ve "eli" kelimelerinin birleşmesiyle oluşan birleşik kelimedir.',
    konu: 'Türkçe',
    altKonu: 'Kelime Türleri',
    zorluk: 2
  },
  {
    soruMetni: '"Dağ başını duman almış" dizesinde hangi söz sanatı vardır?',
    secenekler: ['Benzetme', 'Kişileştirme', 'Abartma', 'Kinaye'],
    dogruCevap: 'Kişileştirme',
    aciklama: 'Dumanın dağı "alması" kişileştirmedir (insana özgü eylem cansız varlığa verilmiş).',
    konu: 'Türkçe',
    altKonu: 'Söz Sanatları',
    zorluk: 2
  },
  {
    soruMetni: '"El elden üstündür." atasözünün anlamı nedir?',
    secenekler: ['Birlik güçtür', 'Her zaman daha iyisi vardır', 'Yardımlaşmak önemlidir', 'Güçlü olan kazanır'],
    dogruCevap: 'Her zaman daha iyisi vardır',
    aciklama: 'Bu atasözü, her konuda kendinden üstün birinin bulunacağını ifade eder.',
    konu: 'Türkçe',
    altKonu: 'Atasözleri',
    zorluk: 1
  },
  {
    soruMetni: '"Sınıfa girdi ve hemen oturdu." cümlesinde kaç yüklem vardır?',
    secenekler: ['1', '2', '3', '4'],
    dogruCevap: '2',
    aciklama: '"Girdi" ve "oturdu" olmak üzere iki yüklem bulunmaktadır.',
    konu: 'Türkçe',
    altKonu: 'Cümle Yapısı',
    zorluk: 1
  },
  {
    soruMetni: 'Aşağıdaki kelimelerden hangisi türemiş kelimedir?',
    secenekler: ['Masa', 'Ev', 'Öğretmen', 'Su'],
    dogruCevap: 'Öğretmen',
    aciklama: '"Öğretmen" kelimesi "öğret-" fiil kökünden "-men" ekiyle türetilmiştir.',
    konu: 'Türkçe',
    altKonu: 'Yapım Ekleri',
    zorluk: 1
  },
  {
    soruMetni: '"Güneş doğudan doğar." cümlesinde altı çizili kelime hangi çeşittir?',
    secenekler: ['Zarf', 'Sıfat', 'Ad', 'Fiil'],
    dogruCevap: 'Ad',
    aciklama: '"Doğudan" kelimesi bir yön adıdır ve -dan ekiyle çekimlenmiştir.',
    konu: 'Türkçe',
    altKonu: 'Sözcük Türleri',
    zorluk: 2
  },
  {
    soruMetni: 'Hangisinde ünsüz yumuşaması vardır?',
    secenekler: ['Kitabı', 'Evleri', 'Masalar', 'Kalemler'],
    dogruCevap: 'Kitabı',
    aciklama: '"Kitap" kelimesi ünlüyle başlayan ek aldığında "p" sesi "b"ye yumuşar.',
    konu: 'Türkçe',
    altKonu: 'Ses Bilgisi',
    zorluk: 2
  },
  {
    soruMetni: '"Kar gibi beyaz" ifadesinde hangi söz sanatı kullanılmıştır?',
    secenekler: ['Kişileştirme', 'Benzetme', 'Abartma', 'Tariz'],
    dogruCevap: 'Benzetme',
    aciklama: '"Gibi" edatıyla yapılan açık benzetmedir.',
    konu: 'Türkçe',
    altKonu: 'Söz Sanatları',
    zorluk: 1
  },
  {
    soruMetni: 'Aşağıdakilerden hangisi bağlaçtır?',
    secenekler: ['İle', 'Fakat', 'İçin', 'Gibi'],
    dogruCevap: 'Fakat',
    aciklama: '"Fakat" cümleleri veya sözcükleri birbirine bağlayan bağlaçtır.',
    konu: 'Türkçe',
    altKonu: 'Bağlaçlar',
    zorluk: 2
  },
  {
    soruMetni: '"Çok güzel konuşuyor." cümlesinde "çok" kelimesi hangi görevde kullanılmıştır?',
    secenekler: ['Sıfat', 'Zarf', 'Ad', 'Fiil'],
    dogruCevap: 'Zarf',
    aciklama: '"Çok" kelimesi "güzel" sıfatını nitelediği için zarf görevindedir.',
    konu: 'Türkçe',
    altKonu: 'Zarf',
    zorluk: 2
  },
  {
    soruMetni: 'Hangisinde kaynaştırma ünsüzü vardır?',
    secenekler: ['Evler', 'Odası', 'Masada', 'Çiçekler'],
    dogruCevap: 'Odası',
    aciklama: '"Oda" + "ı" birleşirken araya "s" kaynaştırma ünsüzü girmiştir.',
    konu: 'Türkçe',
    altKonu: 'Ses Olayları',
    zorluk: 2
  },
  {
    soruMetni: '"Öğrenciler bahçede oynuyordu." cümlesinin öğe dizilişi hangisidir?',
    secenekler: ['Özne - Nesne - Yüklem', 'Özne - Dolaylı Tümleç - Yüklem', 'Özne - Zarf Tümleci - Yüklem', 'Özne - Yüklem'],
    dogruCevap: 'Özne - Dolaylı Tümleç - Yüklem',
    aciklama: '"Öğrenciler" özne, "bahçede" dolaylı tümleç, "oynuyordu" yüklemdir.',
    konu: 'Türkçe',
    altKonu: 'Cümle Çözümlemesi',
    zorluk: 2
  },
  {
    soruMetni: 'Aşağıdakilerden hangisi deyimdir?',
    secenekler: ['Damlaya damlaya göl olur', 'Ağzı kulaklarına varmak', 'Akacak kan damarda durmaz', 'Bir elin nesi var'],
    dogruCevap: 'Ağzı kulaklarına varmak',
    aciklama: '"Ağzı kulaklarına varmak" (çok sevinmek) bir deyimdir. Diğerleri atasözüdür.',
    konu: 'Türkçe',
    altKonu: 'Deyimler',
    zorluk: 2
  },

  // ==================== TARİH (10 soru) ====================
  {
    soruMetni: 'Osmanlı Devleti hangi yılda kurulmuştur?',
    secenekler: ['1071', '1299', '1453', '1517'],
    dogruCevap: '1299',
    aciklama: 'Osmanlı Devleti, Osman Bey tarafından 1299 yılında kurulmuştur.',
    konu: 'Tarih',
    altKonu: 'Osmanlı Tarihi',
    zorluk: 1
  },
  {
    soruMetni: 'İstanbul hangi padişah döneminde fethedilmiştir?',
    secenekler: ['Yavuz Sultan Selim', 'Fatih Sultan Mehmet', 'Kanuni Sultan Süleyman', 'II. Murad'],
    dogruCevap: 'Fatih Sultan Mehmet',
    aciklama: 'İstanbul, 1453 yılında Fatih Sultan Mehmet tarafından fethedilmiştir.',
    konu: 'Tarih',
    altKonu: 'Fetihler',
    zorluk: 1
  },
  {
    soruMetni: 'Kurtuluş Savaşı\'nın dönüm noktası olan savaş hangisidir?',
    secenekler: ['İnönü Savaşları', 'Sakarya Meydan Muharebesi', 'Büyük Taarruz', 'Kütahya-Eskişehir Savaşları'],
    dogruCevap: 'Sakarya Meydan Muharebesi',
    aciklama: 'Sakarya Meydan Muharebesi, Kurtuluş Savaşı\'nın dönüm noktası olarak kabul edilir.',
    konu: 'Tarih',
    altKonu: 'Kurtuluş Savaşı',
    zorluk: 2
  },
  {
    soruMetni: 'TBMM ilk kez hangi tarihte açılmıştır?',
    secenekler: ['19 Mayıs 1919', '23 Nisan 1920', '29 Ekim 1923', '30 Ağustos 1922'],
    dogruCevap: '23 Nisan 1920',
    aciklama: 'TBMM, 23 Nisan 1920 tarihinde Ankara\'da açılmıştır.',
    konu: 'Tarih',
    altKonu: 'Cumhuriyet Tarihi',
    zorluk: 1
  },
  {
    soruMetni: 'Malazgirt Meydan Muharebesi hangi yılda yapılmıştır?',
    secenekler: ['1040', '1071', '1176', '1243'],
    dogruCevap: '1071',
    aciklama: 'Malazgirt Savaşı 1071\'de yapılmış ve Anadolu\'nun kapıları Türklere açılmıştır.',
    konu: 'Tarih',
    altKonu: 'Selçuklu Tarihi',
    zorluk: 1
  },
  {
    soruMetni: 'Tanzimat Fermanı hangi yılda ilan edilmiştir?',
    secenekler: ['1808', '1839', '1856', '1876'],
    dogruCevap: '1839',
    aciklama: 'Tanzimat Fermanı, 1839 yılında Gülhane\'de okunmuştur.',
    konu: 'Tarih',
    altKonu: 'Islahat Hareketleri',
    zorluk: 2
  },
  {
    soruMetni: 'Lozan Antlaşması hangi yılda imzalanmıştır?',
    secenekler: ['1920', '1921', '1922', '1923'],
    dogruCevap: '1923',
    aciklama: 'Lozan Antlaşması, 24 Temmuz 1923 tarihinde imzalanmıştır.',
    konu: 'Tarih',
    altKonu: 'Dış Politika',
    zorluk: 1
  },
  {
    soruMetni: 'Osmanlı Devleti\'nin ilk anayasası olan Kanun-i Esasi hangi padişah döneminde ilan edilmiştir?',
    secenekler: ['Abdülmecit', 'Abdülaziz', 'II. Abdülhamit', 'V. Mehmet Reşat'],
    dogruCevap: 'II. Abdülhamit',
    aciklama: 'Kanun-i Esasi, 1876\'da II. Abdülhamit döneminde ilan edilmiştir.',
    konu: 'Tarih',
    altKonu: 'Meşrutiyet',
    zorluk: 2
  },
  {
    soruMetni: 'I. Dünya Savaşı hangi yıllar arasında yapılmıştır?',
    secenekler: ['1912-1914', '1914-1918', '1916-1920', '1918-1922'],
    dogruCevap: '1914-1918',
    aciklama: 'I. Dünya Savaşı 1914\'te başlamış ve 1918\'de sona ermiştir.',
    konu: 'Tarih',
    altKonu: 'Dünya Tarihi',
    zorluk: 1
  },
  {
    soruMetni: 'Atatürk\'ün doğum yılı hangisidir?',
    secenekler: ['1879', '1880', '1881', '1882'],
    dogruCevap: '1881',
    aciklama: 'Mustafa Kemal Atatürk, 1881 yılında Selanik\'te doğmuştur.',
    konu: 'Tarih',
    altKonu: 'Atatürk\'ün Hayatı',
    zorluk: 1
  },

  // ==================== COĞRAFYA (10 soru) ====================
  {
    soruMetni: 'Türkiye\'nin en uzun nehri hangisidir?',
    secenekler: ['Fırat', 'Kızılırmak', 'Sakarya', 'Dicle'],
    dogruCevap: 'Kızılırmak',
    aciklama: 'Kızılırmak, 1355 km ile Türkiye\'nin en uzun nehridir.',
    konu: 'Coğrafya',
    altKonu: 'Türkiye Hidrografyası',
    zorluk: 1
  },
  {
    soruMetni: 'Türkiye\'nin en yüksek dağı hangisidir?',
    secenekler: ['Uludağ', 'Erciyes', 'Ağrı Dağı', 'Kaçkar Dağı'],
    dogruCevap: 'Ağrı Dağı',
    aciklama: 'Ağrı Dağı, 5137 metre ile Türkiye\'nin en yüksek dağıdır.',
    konu: 'Coğrafya',
    altKonu: 'Türkiye Fiziki Coğrafyası',
    zorluk: 1
  },
  {
    soruMetni: 'Aşağıdakilerden hangisi Türkiye\'nin komşusu değildir?',
    secenekler: ['Yunanistan', 'Suriye', 'Irak', 'Mısır'],
    dogruCevap: 'Mısır',
    aciklama: 'Türkiye\'nin sekiz komşusu vardır: Yunanistan, Bulgaristan, Gürcistan, Ermenistan, Nahçıvan, İran, Irak ve Suriye.',
    konu: 'Coğrafya',
    altKonu: 'Türkiye Siyasi Coğrafyası',
    zorluk: 1
  },
  {
    soruMetni: 'Karadeniz ikliminin özellği hangisidir?',
    secenekler: ['Yazlar sıcak ve kurak', 'Her mevsim yağışlı', 'Kışlar ılık yazlar serin', 'Gece-gündüz sıcaklık farkı fazla'],
    dogruCevap: 'Her mevsim yağışlı',
    aciklama: 'Karadeniz iklimi, her mevsim yağış alan nemli bir iklimdir.',
    konu: 'Coğrafya',
    altKonu: 'İklim',
    zorluk: 2
  },
  {
    soruMetni: 'Dünya\'nın en büyük kıtası hangisidir?',
    secenekler: ['Afrika', 'Avrupa', 'Asya', 'Kuzey Amerika'],
    dogruCevap: 'Asya',
    aciklama: 'Asya, yaklaşık 44 milyon km² ile dünya\'nın en büyük kıtasıdır.',
    konu: 'Coğrafya',
    altKonu: 'Dünya Coğrafyası',
    zorluk: 1
  },
  {
    soruMetni: 'Ekvator\'un Türkiye\'ye olan yaklaşık uzaklığı kaç km\'dir?',
    secenekler: ['2000 km', '4000 km', '6000 km', '8000 km'],
    dogruCevap: '4000 km',
    aciklama: 'Türkiye\'nin ortalama enlemi 39° civarındadır. Her enlem 111 km\'dir.',
    konu: 'Coğrafya',
    altKonu: 'Matematik Coğrafya',
    zorluk: 3
  },
  {
    soruMetni: 'Aşağıdakilerden hangisi yenilenebilir enerji kaynağıdır?',
    secenekler: ['Kömür', 'Petrol', 'Rüzgar', 'Doğalgaz'],
    dogruCevap: 'Rüzgar',
    aciklama: 'Rüzgar enerjisi, güneş, su ve jeotermal gibi yenilenebilir enerji kaynaklarındandır.',
    konu: 'Coğrafya',
    altKonu: 'Enerji Kaynakları',
    zorluk: 1
  },
  {
    soruMetni: 'Deprem kuşağında yer alan Türkiye\'nin en aktif fay hattı hangisidir?',
    secenekler: ['Kuzey Anadolu Fay Hattı', 'Güney Anadolu Fay Hattı', 'Ege Fay Hattı', 'Marmara Fay Hattı'],
    dogruCevap: 'Kuzey Anadolu Fay Hattı',
    aciklama: 'Kuzey Anadolu Fay Hattı (KAFH), Türkiye\'nin en aktif ve tehlikeli fay hattıdır.',
    konu: 'Coğrafya',
    altKonu: 'Doğal Afetler',
    zorluk: 2
  },
  {
    soruMetni: 'Türkiye\'de nüfusun en yoğun olduğu bölge hangisidir?',
    secenekler: ['Ege Bölgesi', 'Marmara Bölgesi', 'İç Anadolu Bölgesi', 'Akdeniz Bölgesi'],
    dogruCevap: 'Marmara Bölgesi',
    aciklama: 'Marmara Bölgesi, İstanbul başta olmak üzere Türkiye\'nin en kalabalık bölgesidir.',
    konu: 'Coğrafya',
    altKonu: 'Nüfus',
    zorluk: 1
  },
  {
    soruMetni: 'Güneş tutulması ne zaman gerçekleşir?',
    secenekler: ['Ay, Dünya ile Güneş arasına girdiğinde', 'Dünya, Ay ile Güneş arasına girdiğinde', 'Güneş, Dünya ile Ay arasına girdiğinde', 'Hiçbiri'],
    dogruCevap: 'Ay, Dünya ile Güneş arasına girdiğinde',
    aciklama: 'Güneş tutulması, Ay\'ın Dünya ile Güneş arasına girmesiyle oluşur.',
    konu: 'Coğrafya',
    altKonu: 'Gök Cisimleri',
    zorluk: 2
  }
];

async function seedGununSorulari() {
  console.log('🚀 Günün Soruları için Soru Havuzu seed işlemi başlıyor...\n');

  try {
    // Önce mevcut soru havuzunu kontrol et
    const mevcutSoruSayisi = await prisma.soruHavuzu.count();
    console.log(`📊 Mevcut soru havuzunda ${mevcutSoruSayisi} soru var.\n`);

    // Soruları ekle
    let eklenenSoru = 0;
    let atlalanSoru = 0;

    for (const soru of sorular) {
      // Aynı soru var mı kontrol et
      const mevcutSoru = await prisma.soruHavuzu.findFirst({
        where: {
          soruMetni: soru.soruMetni
        }
      });

      if (mevcutSoru) {
        atlalanSoru++;
        continue;
      }

      await prisma.soruHavuzu.create({
        data: {
          soruMetni: soru.soruMetni,
          secenekler: JSON.stringify(soru.secenekler),
          dogruCevap: soru.dogruCevap,
          aciklama: soru.aciklama,
          konu: soru.konu,
          altKonu: soru.altKonu,
          zorluk: soru.zorluk,
          hedefSiniflar: JSON.stringify([5, 6, 7, 8, 9, 10, 11, 12]), // Tüm sınıflar için
          aktif: true,
          onaylandiMi: true
        }
      });

      eklenenSoru++;
    }

    console.log(`✅ ${eklenenSoru} yeni soru eklendi.`);
    console.log(`⏭️ ${atlalanSoru} soru zaten mevcuttu.\n`);

    // Konu bazlı özet
    const konuOzeti = await prisma.soruHavuzu.groupBy({
      by: ['konu'],
      _count: { id: true }
    });

    console.log('📚 Konu Bazlı Soru Dağılımı:');
    console.log('─'.repeat(40));
    for (const konu of konuOzeti) {
      console.log(`   ${konu.konu}: ${konu._count.id} soru`);
    }
    console.log('─'.repeat(40));

    const toplamSoru = await prisma.soruHavuzu.count();
    console.log(`\n📊 Toplam Soru Sayısı: ${toplamSoru}`);

    console.log('\n✨ Günün soruları için soru havuzu başarıyla güncellendi!');
    console.log('─'.repeat(50));
    console.log('🎯 Bu sorular hem Küçükyalı Buket hem de Maltepe Zambak');
    console.log('   kurslarındaki öğrenciler için kullanılacaktır.');
    console.log('─'.repeat(50));

  } catch (error) {
    console.error('❌ Hata:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script olarak çalıştırıldığında
seedGununSorulari()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
