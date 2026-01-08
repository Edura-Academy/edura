import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // Desteklenen diller (Türkçe, İngilizce, Almanca, Arapça, Fransızca, İspanyolca)
  locales: ['tr', 'en', 'de', 'ar', 'fr', 'es'],
  
  // Varsayılan dil
  defaultLocale: 'tr',
  
  // URL'de dil prefix'i göster (tr için gizle)
  localePrefix: 'as-needed'
});

// RTL (sağdan sola) diller
export const rtlLocales = ['ar'];

// Dil bilgileri
export const localeInfo: Record<string, { name: string; nativeName: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
};

// TTS (Text-to-Speech) dil kodları
export const ttsLangCodes: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
  ar: 'ar-SA',
  fr: 'fr-FR',
  es: 'es-ES',
};

// Navigation helper'ları
export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);

