import * as fs from 'fs';
import * as path from 'path';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions, Content, ContentColumns } from 'pdfmake/interfaces';

// ==================== FONT AYARLARI ====================
const fontsDir = path.join(__dirname, '../../fonts');

// Eğer fonts klasörü yoksa oluştur ve varsayılan font kullan
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Roboto fontları (varsayılan - latin karakterler)
const fonts = {
  Roboto: {
    normal: path.join(__dirname, '../../node_modules/pdfmake/build/pdfmake.min.js').replace('pdfmake.min.js', 'vfs_fonts.js') || 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  },
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

// ==================== TİP TANIMLARI ====================

interface DenemeSoruData {
  soruNo: number;
  soruMetni: string;
  resimUrl?: string | null;
  secenekA: string;
  secenekB: string;
  secenekC: string;
  secenekD: string;
  secenekE?: string | null;
  bransAdi: string;
  bransKodu: string;
}

interface DenemeSinavData {
  id: string;
  baslik: string;
  aciklama?: string | null;
  tur: 'LGS' | 'TYT' | 'AYT';
  sure: number;
  hedefSinif?: string | null;
  olusturanAd?: string;
  baslangicTarihi: Date;
  sorular: DenemeSoruData[];
}

interface PDFExportOptions {
  includeAnswerKey?: boolean; // Cevap anahtarı dahil mi
  includeImages?: boolean; // Resimler dahil mi
  pageSize?: 'A4' | 'LETTER';
  orientation?: 'portrait' | 'landscape';
}

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Türkçe karakterleri düzelt (PDF için)
 */
const sanitizeText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Kontrol karakterlerini kaldır
    .trim();
};

/**
 * Sınav türüne göre başlık oluştur
 */
const getExamTitle = (tur: string): string => {
  switch (tur) {
    case 'LGS':
      return 'LİSELERE GEÇİŞ SINAVI (LGS)';
    case 'TYT':
      return 'TEMEL YETERLİLİK TESTİ (TYT)';
    case 'AYT':
      return 'ALAN YETERLİLİK TESTİ (AYT)';
    default:
      return 'DENEME SINAVI';
  }
};

/**
 * Tarihi Türkçe formata çevir
 */
const formatDate = (date: Date): string => {
  const d = new Date(date);
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Soruları branşlara göre grupla
 */
const groupQuestionsByBrans = (sorular: DenemeSoruData[]): Map<string, DenemeSoruData[]> => {
  const grouped = new Map<string, DenemeSoruData[]>();
  
  sorular.forEach(soru => {
    const brans = soru.bransAdi || 'Genel';
    if (!grouped.has(brans)) {
      grouped.set(brans, []);
    }
    grouped.get(brans)!.push(soru);
  });
  
  return grouped;
};

// ==================== PDF OLUŞTURMA FONKSİYONLARI ====================

/**
 * Deneme sınavı PDF'i oluştur
 */
export const generateDenemePDF = async (
  sinav: DenemeSinavData,
  options: PDFExportOptions = {}
): Promise<Buffer> => {
  const {
    includeAnswerKey = false,
    pageSize = 'A4',
    orientation = 'portrait'
  } = options;

  // Soruları branşa göre grupla
  const groupedQuestions = groupQuestionsByBrans(sinav.sorular);
  
  // İçerik oluştur
  const content: Content[] = [];
  
  // ==================== BAŞLIK SAYFASI ====================
  content.push(
    {
      text: 'T.C.',
      style: 'headerSmall',
      alignment: 'center',
      margin: [0, 50, 0, 5]
    } as Content,
    {
      text: 'MİLLİ EĞİTİM BAKANLIĞI',
      style: 'headerSmall',
      alignment: 'center',
      margin: [0, 0, 0, 20]
    } as Content,
    {
      text: getExamTitle(sinav.tur),
      style: 'header',
      alignment: 'center',
      margin: [0, 20, 0, 10]
    } as Content,
    {
      text: sinav.baslik,
      style: 'subheader',
      alignment: 'center',
      margin: [0, 10, 0, 30]
    } as Content
  );

  // Sınav bilgileri tablosu
  content.push({
    table: {
      widths: ['auto', '*'],
      body: [
        [{ text: 'Sınav Tarihi:', bold: true }, formatDate(sinav.baslangicTarihi)],
        [{ text: 'Sınav Süresi:', bold: true }, `${sinav.sure} dakika`],
        [{ text: 'Toplam Soru:', bold: true }, `${sinav.sorular.length} soru`],
        ...(sinav.hedefSinif ? [[{ text: 'Hedef Sınıf:', bold: true }, sinav.hedefSinif]] : []),
      ]
    },
    layout: 'lightHorizontalLines',
    margin: [50, 20, 50, 30]
  } as Content);

  // Açıklama varsa ekle
  if (sinav.aciklama) {
    content.push({
      text: sinav.aciklama,
      style: 'description',
      alignment: 'center',
      margin: [50, 10, 50, 30]
    } as Content);
  }

  // Sınav talimatları
  content.push({
    text: 'DİKKAT EDİLECEK HUSUSLAR',
    style: 'sectionHeader',
    margin: [0, 30, 0, 10]
  } as Content);

  const instructions = [
    'Bu sınav kitapçığındaki tüm soruları dikkatle okuyunuz.',
    'Her sorunun yalnızca bir doğru cevabı vardır.',
    `Cevaplarınızı optik okuyucu formuna ${sinav.tur === 'LGS' ? '(A, B, C, D)' : '(A, B, C, D, E)'} olarak işaretleyiniz.`,
    'Sınav süresince hesap makinesi, cep telefonu ve benzeri elektronik cihazlar kullanılamaz.',
    'Sınav bitiminde kitapçığınızı ve cevap kağıdınızı salon görevlisine teslim ediniz.',
  ];

  content.push({
    ul: instructions,
    margin: [20, 0, 20, 30]
  } as Content);

  // Sayfa sonu
  content.push({ text: '', pageBreak: 'after' } as Content);

  // ==================== SORULAR ====================
  let soruNumarasi = 1;
  
  groupedQuestions.forEach((sorular, bransAdi) => {
    // Branş başlığı
    content.push({
      text: bransAdi.toUpperCase(),
      style: 'bransHeader',
      margin: [0, 10, 0, 15]
    } as Content);

    // Her soru için
    sorular.forEach((soru) => {
      // Soru metni
      content.push({
        text: `${soruNumarasi}. ${sanitizeText(soru.soruMetni)}`,
        style: 'question',
        margin: [0, 10, 0, 8]
      } as Content);

      // Seçenekler
      const secenekler: string[] = [
        `A) ${sanitizeText(soru.secenekA)}`,
        `B) ${sanitizeText(soru.secenekB)}`,
        `C) ${sanitizeText(soru.secenekC)}`,
        `D) ${sanitizeText(soru.secenekD)}`,
      ];

      // E şıkkı varsa (TYT/AYT için)
      if (soru.secenekE && sinav.tur !== 'LGS') {
        secenekler.push(`E) ${sanitizeText(soru.secenekE)}`);
      }

      // Seçenekleri 2 sütun halinde göster
      if (secenekler.length <= 4) {
        content.push({
          columns: [
            { text: secenekler.slice(0, 2).join('\n'), width: '50%', margin: [20, 0, 0, 0] },
            { text: secenekler.slice(2).join('\n'), width: '50%' }
          ],
          margin: [0, 0, 0, 15]
        } as ContentColumns);
      } else {
        content.push({
          columns: [
            { text: secenekler.slice(0, 3).join('\n'), width: '50%', margin: [20, 0, 0, 0] },
            { text: secenekler.slice(3).join('\n'), width: '50%' }
          ],
          margin: [0, 0, 0, 15]
        } as ContentColumns);
      }

      soruNumarasi++;
    });

    // Branşlar arası boşluk
    content.push({ text: '', margin: [0, 10, 0, 10] } as Content);
  });

  // ==================== CEVAP ANAHTARI ====================
  if (includeAnswerKey) {
    content.push({ text: '', pageBreak: 'after' } as Content);
    content.push({
      text: 'CEVAP ANAHTARI',
      style: 'header',
      alignment: 'center',
      margin: [0, 30, 0, 30]
    } as Content);

    // Cevap anahtarı tablosu (Not: Gerçek cevaplar veritabanında saklanmalı)
    const cevapBody: string[][] = [['Soru No', 'Cevap']];
    sinav.sorular.forEach((_, index) => {
      cevapBody.push([(index + 1).toString(), '---']); // Cevap alanı
    });

    content.push({
      table: {
        headerRows: 1,
        widths: ['auto', '*'],
        body: cevapBody
      },
      layout: 'lightHorizontalLines',
      margin: [100, 0, 100, 0]
    } as Content);
  }

  // ==================== PDF TANIMLAMASI ====================
  const docDefinition: TDocumentDefinitions = {
    pageSize,
    pageOrientation: orientation,
    pageMargins: [40, 60, 40, 60],
    
    header: (currentPage, pageCount) => {
      if (currentPage === 1) return null;
      return {
        text: `${sinav.baslik} - ${sinav.tur}`,
        alignment: 'center',
        margin: [0, 20, 0, 0],
        fontSize: 9,
        color: '#666666'
      };
    },
    
    footer: (currentPage, pageCount) => {
      return {
        columns: [
          { text: 'EDURA Eğitim Platformu', alignment: 'left', fontSize: 8, color: '#999999' },
          { text: `Sayfa ${currentPage} / ${pageCount}`, alignment: 'right', fontSize: 8, color: '#999999' }
        ],
        margin: [40, 0, 40, 0]
      };
    },
    
    content,
    
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#1a365d'
      },
      headerSmall: {
        fontSize: 12,
        bold: true,
        color: '#2d3748'
      },
      subheader: {
        fontSize: 14,
        bold: true,
        color: '#2d3748'
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: '#1a365d',
        decoration: 'underline'
      },
      bransHeader: {
        fontSize: 14,
        bold: true,
        color: '#2b6cb0',
        fillColor: '#ebf8ff',
        margin: [0, 5, 0, 5]
      },
      question: {
        fontSize: 11,
        color: '#1a202c'
      },
      description: {
        fontSize: 10,
        color: '#4a5568',
        italics: true
      }
    },
    
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10
    }
  };

  // PDF oluştur
  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Optik form cevap kağıdı PDF'i oluştur
 */
export const generateOptikFormPDF = async (
  sinav: DenemeSinavData,
  ogrenciAd?: string
): Promise<Buffer> => {
  const content: Content[] = [];
  
  // Başlık
  content.push({
    columns: [
      {
        stack: [
          { text: sinav.baslik, style: 'header' },
          { text: `${sinav.tur} Deneme Sınavı`, style: 'subheader' },
          { text: formatDate(sinav.baslangicTarihi), style: 'date' }
        ],
        width: '70%'
      },
      {
        stack: [
          { text: 'Öğrenci Adı:', fontSize: 9 },
          { text: ogrenciAd || '________________________', fontSize: 10, bold: true },
          { text: 'Sınıf:', fontSize: 9, margin: [0, 5, 0, 0] },
          { text: '________________________', fontSize: 10 }
        ],
        width: '30%'
      }
    ],
    margin: [0, 0, 0, 20]
  } as ContentColumns);

  // Talimatlar
  content.push({
    text: 'CEVAP KAĞIDI - Doğru cevabı kurşun kalemle tamamen boyayınız.',
    style: 'instructions',
    margin: [0, 10, 0, 15]
  } as Content);

  // Cevap tablosu oluştur (her satırda 10 soru)
  const toplamSoru = sinav.sorular.length;
  const secenekSayisi = sinav.tur === 'LGS' ? 4 : 5;
  const secenekler = sinav.tur === 'LGS' ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
  
  const rows: any[][] = [];
  
  // Başlık satırı
  const headerRow = ['No', ...secenekler];
  
  // Her 20 soruyu bir blok olarak göster
  const bloklaSoruSayisi = 20;
  const blokSayisi = Math.ceil(toplamSoru / bloklaSoruSayisi);
  
  for (let blok = 0; blok < blokSayisi; blok++) {
    const baslangic = blok * bloklaSoruSayisi;
    const bitis = Math.min(baslangic + bloklaSoruSayisi, toplamSoru);
    
    const blokRows: any[][] = [headerRow];
    
    for (let i = baslangic; i < bitis; i++) {
      const row: any[] = [{ text: (i + 1).toString(), alignment: 'center', bold: true }];
      secenekler.forEach(() => {
        row.push({ text: '○', alignment: 'center', fontSize: 14 });
      });
      blokRows.push(row);
    }
    
    content.push({
      columns: [
        {
          table: {
            headerRows: 1,
            widths: ['auto', ...secenekler.map(() => 25)],
            body: blokRows
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#cccccc',
            vLineColor: () => '#cccccc',
            paddingLeft: () => 3,
            paddingRight: () => 3,
            paddingTop: () => 2,
            paddingBottom: () => 2
          },
          width: 'auto'
        }
      ],
      margin: [0, 10, 0, 15]
    } as ContentColumns);
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [30, 30, 30, 30],
    
    content,
    
    styles: {
      header: {
        fontSize: 14,
        bold: true
      },
      subheader: {
        fontSize: 11,
        color: '#666666'
      },
      date: {
        fontSize: 9,
        color: '#999999'
      },
      instructions: {
        fontSize: 9,
        italics: true,
        color: '#333333'
      }
    },
    
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 9
    }
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default {
  generateDenemePDF,
  generateOptikFormPDF
};

