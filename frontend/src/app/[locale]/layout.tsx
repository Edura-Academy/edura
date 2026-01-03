import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ToastProvider } from '@/components/ToastProvider';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <ToastProvider />
          <ConfirmProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ConfirmProvider>
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}