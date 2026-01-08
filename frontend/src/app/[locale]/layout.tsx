import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ToastProvider } from '@/components/ToastProvider';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AccessibilityWrapper } from '@/components/accessibility';
import { rtlLocales } from '@/i18n/routing';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  
  // RTL (sağdan sola) dil kontrolü
  const isRTL = rtlLocales.includes(locale);
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir} lang={locale} className={isRTL ? 'rtl' : 'ltr'}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider defaultTheme="system">
          <AuthProvider>
            <AccessibilityWrapper>
              <ToastProvider />
              <ConfirmProvider>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </ConfirmProvider>
            </AccessibilityWrapper>
          </AuthProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </div>
  );
}