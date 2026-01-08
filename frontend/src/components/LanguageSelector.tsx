'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { localeInfo } from '@/i18n/routing';

// SVG Bayrak Bileşenleri - Windows uyumlu
const FlagTR = () => (
  <svg className="w-5 h-4 rounded-sm shadow-sm" viewBox="0 0 640 480">
    <path fill="#e30a17" d="M0 0h640v480H0z"/>
    <path fill="#fff" d="M407 247.5c0 66.2-54.6 119.9-122 119.9s-122-53.7-122-120 54.6-119.8 122-119.8 122 53.7 122 119.9z"/>
    <path fill="#e30a17" d="M413 247.5c0 53-43.6 95.9-97.5 95.9s-97.6-43-97.6-96 43.7-95.8 97.6-95.8 97.6 42.9 97.6 95.9z"/>
    <path fill="#fff" d="m430.7 191.5-1 44.3-41.3 11.2 40.8 14.5-1 40.7 26.5-31.8 40.2 14-23.2-34.1 28.3-33.9-43.5 12-25.8-37z"/>
  </svg>
);

const FlagGB = () => (
  <svg className="w-5 h-4 rounded-sm shadow-sm" viewBox="0 0 640 480">
    <path fill="#012169" d="M0 0h640v480H0z"/>
    <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
    <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
    <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
    <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
  </svg>
);

const FlagDE = () => (
  <svg className="w-5 h-4 rounded-sm shadow-sm" viewBox="0 0 640 480">
    <path fill="#ffce00" d="M0 320h640v160H0z"/>
    <path fill="#000" d="M0 0h640v160H0z"/>
    <path fill="#d00" d="M0 160h640v160H0z"/>
  </svg>
);

const FlagSA = () => (
  <svg className="w-5 h-4 rounded-sm shadow-sm" viewBox="0 0 640 480">
    <path fill="#006c35" d="M0 0h640v480H0z"/>
    <path fill="#fff" d="M170.6 178h36.3v145h-36.3zm60.5 0h36.3v145h-36.3zm60.5 0h36.3v145h-36.3zm60.5 0h36.3v145h-36.3zm60.5 0h36.3v145h-36.3zM170.6 178h242v36.3h-242zm0 108.7h242V323h-242z"/>
    <path fill="#fff" d="M206.9 359.3c0 23.1 18.7 41.8 41.8 41.8h145c23.1 0 41.8-18.7 41.8-41.8v-8.7H206.9v8.7z"/>
  </svg>
);

const FlagFR = () => (
  <svg className="w-5 h-4 rounded-sm shadow-sm" viewBox="0 0 640 480">
    <path fill="#fff" d="M0 0h640v480H0z"/>
    <path fill="#002654" d="M0 0h213.3v480H0z"/>
    <path fill="#ce1126" d="M426.7 0H640v480H426.7z"/>
  </svg>
);

const FlagES = () => (
  <svg className="w-5 h-4 rounded-sm shadow-sm" viewBox="0 0 640 480">
    <path fill="#c60b1e" d="M0 0h640v480H0z"/>
    <path fill="#ffc400" d="M0 120h640v240H0z"/>
  </svg>
);

// Bayrak bileşenleri mapping
const flagComponents: Record<string, React.FC> = {
  tr: FlagTR,
  en: FlagGB,
  de: FlagDE,
  ar: FlagSA,
  fr: FlagFR,
  es: FlagES,
};

interface LanguageSelectorProps {
  variant?: 'light' | 'dark';
  showLabel?: boolean;
  className?: string;
}

export function LanguageSelector({ 
  variant = 'dark', 
  showLabel = false,
  className = ''
}: LanguageSelectorProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = (newLocale: string) => {
    // Seçilen dili localStorage'a kaydet
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale);
    }
    router.replace(pathname, { locale: newLocale as 'tr' | 'en' | 'de' | 'ar' | 'fr' | 'es' });
    setIsOpen(false);
  };

  // Sayfa yüklendiğinde localStorage'dan dili kontrol et
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('preferred-locale');
      if (savedLocale && savedLocale !== locale && ['tr', 'en', 'de', 'ar', 'fr', 'es'].includes(savedLocale)) {
        router.replace(pathname, { locale: savedLocale as 'tr' | 'en' | 'de' | 'ar' | 'fr' | 'es' });
      }
    }
  }, []);

  const currentLocale = localeInfo[locale];
  const locales = Object.entries(localeInfo);
  const CurrentFlag = flagComponents[locale];

  const buttonClass = variant === 'light'
    ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
    : 'text-slate-400 hover:text-white hover:bg-slate-700';

  const dropdownClass = variant === 'light'
    ? 'bg-white border-gray-200'
    : 'bg-slate-800 border-slate-700';

  const itemClass = variant === 'light'
    ? 'text-gray-700 hover:bg-gray-50'
    : 'text-slate-300 hover:bg-slate-700';

  const activeClass = variant === 'light'
    ? 'bg-violet-50 text-violet-600'
    : 'bg-violet-900/30 text-violet-400';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-2 rounded-lg transition-colors flex items-center gap-2
          ${buttonClass}
        `}
        aria-label="Dil Seç"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {CurrentFlag && <CurrentFlag />}
        {showLabel ? (
          <span className="text-sm font-medium">{currentLocale?.nativeName}</span>
        ) : (
          <span className="text-xs font-medium uppercase">{locale}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div 
            className={`
              absolute right-0 mt-2 w-48 rounded-xl shadow-2xl z-20 border py-2 overflow-hidden
              ${dropdownClass}
            `}
            role="listbox"
            aria-label="Dil seçimi"
          >
            {locales.map(([code, info]) => {
              const FlagComponent = flagComponents[code];
              return (
                <button
                  key={code}
                  onClick={() => handleLocaleChange(code)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                    ${locale === code ? activeClass : itemClass}
                  `}
                  role="option"
                  aria-selected={locale === code}
                  dir={info.dir}
                >
                  {FlagComponent && <FlagComponent />}
                  <span className={info.dir === 'rtl' ? 'font-arabic' : ''}>{info.nativeName}</span>
                  {locale === code && (
                    <svg className="w-4 h-4 ml-auto text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default LanguageSelector;

