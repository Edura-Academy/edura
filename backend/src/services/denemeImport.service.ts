/**
 * Deneme Sınavı Sonuçları Import Servisi
 * Excel/CSV formatından deneme sonuçlarını parse eder
 */

import { TYT_BRANSLAR, AYT_BRANSLAR, LGS_BRANSLAR } from '../controllers/deneme.controller';

export interface ImportSonuc {
  ogrenciNo: string;
  branslar: Record<string, { dogru: number; yanlis: number; bos: number }>;
}

export interface ImportResult {
  success: boolean;
  data?: ImportSonuc[];
  errors?: string[];
}

// Net hesaplama
const hesaplaNet = (dogru: number, yanlis: number): number => {
  return Math.round((dogru - yanlis / 4) * 100) / 100;
};

/**
 * CSV string'i parse eder
 * Format: ogrenciNo,brans1_dogru,brans1_yanlis,brans2_dogru,brans2_yanlis,...
 */
export const parseCSV = (csvContent: string, sinavTuru: 'TYT' | 'AYT' | 'LGS'): ImportResult => {
  try {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return { success: false, errors: ['CSV en az 2 satır içermelidir (başlık + veri)'] };
    }

    // Başlık satırı
    const headers = lines[0].split(',').map(h => h.trim().toUpperCase());
    
    // İlk sütun öğrenci no olmalı
    if (!headers[0].includes('OGRENCI') && !headers[0].includes('NO')) {
      return { success: false, errors: ['İlk sütun öğrenci numarası olmalıdır'] };
    }

    // Branşları belirle
    const branslar = sinavTuru === 'TYT' ? TYT_BRANSLAR : 
                     sinavTuru === 'AYT' ? AYT_BRANSLAR : LGS_BRANSLAR;

    const sonuclar: ImportSonuc[] = [];
    const errors: string[] = [];

    // Veri satırları
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length < 2) {
        errors.push(`Satır ${i + 1}: Yetersiz veri`);
        continue;
      }

      const ogrenciNo = values[0];
      if (!ogrenciNo) {
        errors.push(`Satır ${i + 1}: Öğrenci numarası boş`);
        continue;
      }

      const branslarSonuc: Record<string, { dogru: number; yanlis: number; bos: number }> = {};
      
      let colIndex = 1;
      for (const [bransKey, bransInfo] of Object.entries(branslar)) {
        // Her branş için doğru ve yanlış sütunları
        const dogru = parseInt(values[colIndex] || '0', 10) || 0;
        const yanlis = parseInt(values[colIndex + 1] || '0', 10) || 0;
        const bos = bransInfo.soruSayisi - dogru - yanlis;

        branslarSonuc[bransKey] = {
          dogru: Math.max(0, Math.min(dogru, bransInfo.soruSayisi)),
          yanlis: Math.max(0, Math.min(yanlis, bransInfo.soruSayisi - dogru)),
          bos: Math.max(0, bos)
        };

        colIndex += 2;
      }

      sonuclar.push({ ogrenciNo, branslar: branslarSonuc });
    }

    if (sonuclar.length === 0) {
      return { success: false, errors: ['Hiç geçerli sonuç bulunamadı', ...errors] };
    }

    return { success: true, data: sonuclar, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    return { success: false, errors: ['CSV parse hatası: ' + (error as Error).message] };
  }
};

/**
 * JSON formatını parse eder
 * Format: [{ ogrenciNo: "123", branslar: { TYT_TURKCE: { dogru: 30, yanlis: 5, bos: 5 }, ... } }, ...]
 */
export const parseJSON = (jsonContent: string, sinavTuru: 'TYT' | 'AYT' | 'LGS'): ImportResult => {
  try {
    const data = JSON.parse(jsonContent);
    
    if (!Array.isArray(data)) {
      return { success: false, errors: ['JSON bir dizi olmalıdır'] };
    }

    const branslar = sinavTuru === 'TYT' ? TYT_BRANSLAR : 
                     sinavTuru === 'AYT' ? AYT_BRANSLAR : LGS_BRANSLAR;

    const sonuclar: ImportSonuc[] = [];
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      if (!item.ogrenciNo) {
        errors.push(`Kayıt ${i + 1}: Öğrenci numarası yok`);
        continue;
      }

      if (!item.branslar || typeof item.branslar !== 'object') {
        errors.push(`Kayıt ${i + 1}: Branş sonuçları yok`);
        continue;
      }

      const branslarSonuc: Record<string, { dogru: number; yanlis: number; bos: number }> = {};

      for (const [bransKey, bransInfo] of Object.entries(branslar)) {
        const bransData = item.branslar[bransKey] || {};
        const dogru = parseInt(bransData.dogru || '0', 10) || 0;
        const yanlis = parseInt(bransData.yanlis || '0', 10) || 0;
        const bos = bransInfo.soruSayisi - dogru - yanlis;

        branslarSonuc[bransKey] = {
          dogru: Math.max(0, Math.min(dogru, bransInfo.soruSayisi)),
          yanlis: Math.max(0, Math.min(yanlis, bransInfo.soruSayisi - dogru)),
          bos: Math.max(0, bos)
        };
      }

      sonuclar.push({ ogrenciNo: item.ogrenciNo, branslar: branslarSonuc });
    }

    if (sonuclar.length === 0) {
      return { success: false, errors: ['Hiç geçerli sonuç bulunamadı', ...errors] };
    }

    return { success: true, data: sonuclar, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    return { success: false, errors: ['JSON parse hatası: ' + (error as Error).message] };
  }
};

/**
 * Örnek CSV şablonu oluşturur
 */
export const generateCSVTemplate = (sinavTuru: 'TYT' | 'AYT' | 'LGS'): string => {
  const branslar = sinavTuru === 'TYT' ? TYT_BRANSLAR : 
                   sinavTuru === 'AYT' ? AYT_BRANSLAR : LGS_BRANSLAR;

  // Başlık satırı
  let headers = ['Ogrenci_No'];
  for (const [key, info] of Object.entries(branslar)) {
    headers.push(`${info.ad}_Dogru`, `${info.ad}_Yanlis`);
  }

  // Örnek veri satırları
  const rows = [
    headers.join(','),
    `12345,${Object.values(branslar).map(b => `${Math.floor(b.soruSayisi * 0.7)},${Math.floor(b.soruSayisi * 0.1)}`).join(',')}`,
    `12346,${Object.values(branslar).map(b => `${Math.floor(b.soruSayisi * 0.6)},${Math.floor(b.soruSayisi * 0.15)}`).join(',')}`
  ];

  return rows.join('\n');
};

/**
 * Örnek JSON şablonu oluşturur
 */
export const generateJSONTemplate = (sinavTuru: 'TYT' | 'AYT' | 'LGS'): object[] => {
  const branslar = sinavTuru === 'TYT' ? TYT_BRANSLAR : 
                   sinavTuru === 'AYT' ? AYT_BRANSLAR : LGS_BRANSLAR;

  const template: object[] = [];

  for (let i = 0; i < 2; i++) {
    const ogrenciBranslar: Record<string, { dogru: number; yanlis: number; bos: number }> = {};
    
    for (const [key, info] of Object.entries(branslar)) {
      const dogru = Math.floor(info.soruSayisi * (0.6 + i * 0.1));
      const yanlis = Math.floor(info.soruSayisi * 0.1);
      ogrenciBranslar[key] = {
        dogru,
        yanlis,
        bos: info.soruSayisi - dogru - yanlis
      };
    }

    template.push({
      ogrenciNo: `1234${5 + i}`,
      branslar: ogrenciBranslar
    });
  }

  return template;
};

export default {
  parseCSV,
  parseJSON,
  generateCSVTemplate,
  generateJSONTemplate
};

