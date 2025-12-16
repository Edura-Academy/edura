import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // Desteklenen diller
  locales: ['tr', 'en', 'es', 'ja', 'fr'],
  
  // Varsayılan dil
  defaultLocale: 'tr',
  
  // URL'de dil prefix'i göster (tr için gizle)
  localePrefix: 'as-needed'
});

// Navigation helper'ları
export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);

