import PDFDocument from 'pdfkit';

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
  includeAnswerKey?: boolean;
  pageSize?: 'A4' | 'LETTER';
}

// ==================== YARDIMCI FONKSİYONLAR ====================

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
    'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
    'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
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
  const { includeAnswerKey = false, pageSize = 'A4' } = options;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: pageSize,
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ==================== BAŞLIK SAYFASI ====================
      doc.fontSize(12).text('T.C.', { align: 'center' });
      doc.fontSize(12).text('MİLLİ EĞİTİM BAKANLIĞI', { align: 'center' });
      doc.moveDown(2);
      
      doc.fontSize(18).font('Helvetica-Bold').text(getExamTitle(sinav.tur), { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).text(sinav.baslik, { align: 'center' });
      doc.moveDown(2);

      // Sınav bilgileri
      doc.fontSize(11).font('Helvetica');
      doc.text(`Sinav Tarihi: ${formatDate(sinav.baslangicTarihi)}`);
      doc.text(`Sinav Suresi: ${sinav.sure} dakika`);
      doc.text(`Toplam Soru: ${sinav.sorular.length} soru`);
      if (sinav.hedefSinif) {
        doc.text(`Hedef Sinif: ${sinav.hedefSinif}`);
      }
      doc.moveDown(2);

      // Açıklama
      if (sinav.aciklama) {
        doc.fontSize(10).font('Helvetica-Oblique').text(sinav.aciklama, { align: 'center' });
        doc.moveDown(2);
      }

      // Talimatlar
      doc.fontSize(12).font('Helvetica-Bold').text('DIKKAT EDILECEK HUSUSLAR', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      
      const instructions = [
        '1. Bu sinav kitapcigindaki tum sorulari dikkatle okuyunuz.',
        '2. Her sorunun yalnizca bir dogru cevabi vardir.',
        `3. Cevaplari optik okuyucu formuna ${sinav.tur === 'LGS' ? '(A, B, C, D)' : '(A, B, C, D, E)'} olarak isaretleyiniz.`,
        '4. Sinav suresince hesap makinesi, cep telefonu ve benzeri elektronik cihazlar kullanilamaz.',
        '5. Sinav bitiminde kitapcigi ve cevap kagidini salon gorevlisine teslim ediniz.',
      ];
      
      instructions.forEach(inst => {
        doc.text(inst);
        doc.moveDown(0.3);
      });

      // Yeni sayfa - Sorular
      doc.addPage();

      // ==================== SORULAR ====================
      const groupedQuestions = groupQuestionsByBrans(sinav.sorular);
      let currentY = doc.y;
      const pageHeight = doc.page.height - doc.page.margins.bottom;
      
      groupedQuestions.forEach((sorular, bransAdi) => {
        // Branş başlığı
        if (currentY > pageHeight - 100) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }
        
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#2b6cb0').text(bransAdi.toUpperCase());
        doc.moveDown(0.5);
        doc.fillColor('black');
        currentY = doc.y;

        // Her soru için
        sorular.forEach((soru) => {
          // Yeni sayfa gerekiyor mu kontrol et
          if (currentY > pageHeight - 150) {
            doc.addPage();
            currentY = doc.page.margins.top;
          }

          // Soru metni
          doc.fontSize(11).font('Helvetica-Bold').text(`${soru.soruNo}. `, { continued: true });
          doc.font('Helvetica').text(soru.soruMetni || '');
          doc.moveDown(0.5);

          // Seçenekler
          doc.fontSize(10);
          const secenekler = [
            { label: 'A', text: soru.secenekA },
            { label: 'B', text: soru.secenekB },
            { label: 'C', text: soru.secenekC },
            { label: 'D', text: soru.secenekD },
          ];

          // E şıkkı varsa (TYT/AYT için)
          if (soru.secenekE && sinav.tur !== 'LGS') {
            secenekler.push({ label: 'E', text: soru.secenekE });
          }

          secenekler.forEach(secenek => {
            if (secenek.text) {
              doc.text(`   ${secenek.label}) ${secenek.text}`);
            }
          });

          doc.moveDown(1);
          currentY = doc.y;
        });

        doc.moveDown(1);
        currentY = doc.y;
      });

      // ==================== CEVAP ANAHTARI ====================
      if (includeAnswerKey) {
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold').text('CEVAP ANAHTARI', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(10).font('Helvetica');
        
        // Cevapları tablo şeklinde göster
        let col = 0;
        const colWidth = 100;
        const startX = doc.page.margins.left;
        let startY = doc.y;
        
        sinav.sorular.forEach((soru, index) => {
          const x = startX + (col * colWidth);
          const y = startY;
          
          doc.text(`${index + 1}. ---`, x, y);
          
          col++;
          if (col >= 5) {
            col = 0;
            startY += 20;
          }
          
          if (startY > pageHeight - 50) {
            doc.addPage();
            startY = doc.page.margins.top;
          }
        });
      }

      // Footer ekle (tüm sayfalara)
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        
        // Alt bilgi
        doc.fontSize(8).fillColor('#999999');
        doc.text(
          `EDURA Egitim Platformu | Sayfa ${i + 1} / ${pages.count}`,
          doc.page.margins.left,
          doc.page.height - 30,
          { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Optik form cevap kağıdı PDF'i oluştur
 */
export const generateOptikFormPDF = async (
  sinav: DenemeSinavData
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 30, bottom: 30, left: 30, right: 30 }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Başlık
      doc.fontSize(14).font('Helvetica-Bold').text(sinav.baslik, { align: 'left' });
      doc.fontSize(10).font('Helvetica').text(`${sinav.tur} Deneme Sinavi`, { align: 'left' });
      doc.fontSize(9).fillColor('#666666').text(formatDate(sinav.baslangicTarihi));
      doc.fillColor('black');
      
      doc.moveDown(0.5);
      
      // Öğrenci bilgi alanı
      doc.fontSize(10).text('Ogrenci Adi: ________________________    Sinif: __________');
      doc.moveDown(1);

      // Talimat
      doc.fontSize(9).font('Helvetica-Oblique').text('Dogru cevabi kursun kalemle tamamen boyayiniz.');
      doc.moveDown(1);

      // Cevap daireleri
      const secenekler = sinav.tur === 'LGS' ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
      const toplamSoru = sinav.sorular.length;
      
      const startX = doc.page.margins.left;
      let currentY = doc.y;
      const rowHeight = 22;
      const colWidth = 25;
      const numberWidth = 30;
      const itemsPerRow = 10;
      
      doc.font('Helvetica');

      for (let i = 0; i < toplamSoru; i++) {
        const row = Math.floor(i / itemsPerRow);
        const col = i % itemsPerRow;
        
        const x = startX + (col * (numberWidth + secenekler.length * colWidth + 20));
        const y = currentY + (row * rowHeight);
        
        // Sayfa sonu kontrolü
        if (y > doc.page.height - 50) {
          doc.addPage();
          currentY = doc.page.margins.top;
        }
        
        // Soru numarası
        doc.fontSize(9).font('Helvetica-Bold').text(`${i + 1}.`, x, y);
        
        // Seçenek daireleri
        secenekler.forEach((secenek, si) => {
          const circleX = x + numberWidth + (si * colWidth);
          doc.circle(circleX + 8, y + 5, 7).stroke();
          doc.fontSize(8).font('Helvetica').text(secenek, circleX + 5, y + 1);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default {
  generateDenemePDF,
  generateOptikFormPDF
};
