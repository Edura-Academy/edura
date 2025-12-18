'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';

interface UserData {
  role: string;
  ad?: string;
  soyad?: string;
}

export default function Home() {
  const router = useRouter();
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
          <span className="text-white text-2xl font-bold">E</span>
        </div>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-500">Yükleniyor...</p>
      </div>
    </div>
  );
}
