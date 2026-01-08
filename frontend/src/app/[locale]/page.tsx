'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTheme } from '@/contexts/ThemeContext';

interface UserData {
  role: string;
  ad?: string;
  soyad?: string;
}

export default function Home() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Token ve kullanıcı bilgisi kontrolü
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user: UserData = JSON.parse(userStr);
        
        // Role göre yönlendir
        switch (user.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'ogrenci':
            router.push('/ogrenci');
            break;
          case 'mudur':
          case 'ogretmen':
          case 'sekreter':
            router.push('/personel');
            break;
          default:
            // Bilinmeyen rol - login'e yönlendir
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
        }
      } catch {
        // JSON parse hatası - login'e yönlendir
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } else {
      // Token yok - login'e yönlendir
      router.push('/login');
    }
  }, [mounted, router]);

  // Yükleniyor göstergesi
  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="text-center">
        <img 
          src={isDark ? "/logos/Edura-logo-dark-2.png" : "/logos/Edura-logo-nobg.png"} 
          alt="Edura Logo" 
          className="w-16 h-16 object-contain mx-auto mb-4"
        />
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-500">Yükleniyor...</p>
      </div>
    </div>
  );
}
