'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // Role göre doğru sayfaya yönlendir
      switch (user.role) {
        case 'admin':
          router.replace('/admin');
          break;
        case 'ogrenci':
          router.replace('/ogrenci');
          break;
        case 'mudur':
        case 'ogretmen':
        case 'sekreter':
          router.replace('/personel');
          break;
        default:
          // Bilinmeyen rol - login'e yönlendir
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
        <p className="mt-4 text-gray-500">Yönlendiriliyor...</p>
      </div>
    </div>
  );
}
