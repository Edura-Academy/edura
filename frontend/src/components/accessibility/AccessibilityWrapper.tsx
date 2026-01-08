'use client';

import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { AccessibilityToggle } from './AccessibilityToggle';
import { ChatbotWidget } from './ChatbotWidget';
import { useAuth } from '@/contexts/AuthContext';

interface AccessibilityWrapperProps {
  children: React.ReactNode;
}

export function AccessibilityWrapper({ children }: AccessibilityWrapperProps) {
  return (
    <AccessibilityProvider>
      {children}
      <AccessibilityComponents />
    </AccessibilityProvider>
  );
}

// Auth kontrolü ile komponetleri göster
function AccessibilityComponents() {
  const { isAuthenticated, isLoading } = useAuth();

  // Yükleniyor veya giriş yapılmamışsa gösterme
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <AccessibilityToggle />
      <ChatbotWidget />
    </>
  );
}

export default AccessibilityWrapper;

