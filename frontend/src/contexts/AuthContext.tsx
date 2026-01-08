'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';

export type UserRole = 'admin' | 'kursSahibi' | 'mudur' | 'ogretmen' | 'sekreter' | 'ogrenci' | 'veli';

export interface Sinif {
  id: string;
  ad: string;
  seviye: number;
  tip: 'ORTAOKUL' | 'LISE';
}

export interface Kurs {
  id: string;
  ad: string;
}

export interface User {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  role: UserRole;
  kursId?: string;
  sinifId?: string;
  sinif?: Sinif;
  kurs?: Kurs;
  ogrenciNo?: string;
  brans?: string;
  telefon?: string;
  sifreDegistirildiMi?: boolean;
  profilFoto?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role'a göre izin verilen path'ler
const rolePathMap: Record<UserRole, string[]> = {
  admin: ['/admin'],
  kursSahibi: ['/kurs-sahibi'],
  mudur: ['/mudur', '/personel'],
  ogretmen: ['/ogretmen', '/personel'],
  sekreter: ['/sekreter', '/personel'],
  ogrenci: ['/ogrenci'],
  veli: ['/veli'],
};

// Role'a göre ana sayfa
const roleHomeMap: Record<UserRole, string> = {
  admin: '/admin',
  kursSahibi: '/kurs-sahibi',
  mudur: '/mudur',
  ogretmen: '/ogretmen',
  sekreter: '/sekreter',
  ogrenci: '/ogrenci',
  veli: '/veli',
};

// Herkese açık sayfalar
const publicPaths = ['/login', '/register', '/forgot-password', '/change-password', '/test'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // İlk mount kontrolü
  useEffect(() => {
    setMounted(true);
  }, []);

  // LocalStorage'dan auth bilgilerini yükle
  const loadAuth = useCallback(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        setToken(storedToken);
        setUser(parsedUser);
        return { token: storedToken, user: parsedUser };
      }
    } catch (error) {
      console.error('Auth yüklenirken hata:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    setToken(null);
    setUser(null);
    return null;
  }, []);

  // Mount olduğunda auth'u yükle
  useEffect(() => {
    if (!mounted) return;
    
    loadAuth();
    setIsLoading(false);
  }, [mounted, loadAuth]);

  // Storage event dinleyicisi - başka sekmede değişiklik olursa
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      // Token veya user değiştiğinde
      if (e.key === 'token' || e.key === 'user') {
        const authData = loadAuth();
        
        // Eğer auth bilgisi temizlendiyse login'e yönlendir
        if (!authData && !publicPaths.some(p => pathname.includes(p))) {
          router.push('/login');
          return;
        }

        // Eğer role değiştiyse doğru sayfaya yönlendir
        if (authData && user && authData.user.role !== user.role) {
          const correctHome = roleHomeMap[authData.user.role];
          // Mevcut sayfanın yeni role için izinli olup olmadığını kontrol et
          const allowedPaths = rolePathMap[authData.user.role];
          const isAllowed = allowedPaths.some(p => pathname.startsWith(p));
          
          if (!isAllowed) {
            router.push(correctHome);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mounted, pathname, router, loadAuth, user]);

  // Sayfa değiştiğinde rol kontrolü yap
  useEffect(() => {
    if (!mounted || isLoading) return;
    
    // Public path'lerde kontrol yapma
    if (publicPaths.some(p => pathname.includes(p))) return;
    
    // Ana sayfa kontrolü
    if (pathname === '/' || pathname === '') {
      if (user) {
        router.replace(roleHomeMap[user.role]);
      } else {
        router.push('/login');
      }
      return;
    }

    // Auth yoksa login'e yönlendir
    if (!user || !token) {
      router.push('/login');
      return;
    }

    // Role bazlı erişim kontrolü
    const allowedPaths = rolePathMap[user.role];
    const isAllowed = allowedPaths.some(p => pathname.startsWith(p));

    if (!isAllowed) {
      // Yanlış modüldeyse kendi modülüne yönlendir
      console.warn(`[AuthContext] Yetkisiz erişim: ${user.role} rolü ${pathname} sayfasına erişemez`);
      router.replace(roleHomeMap[user.role]);
    }
  }, [mounted, isLoading, pathname, user, token, router]);

  const login = useCallback((newUser: User, newToken: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  // SSR'da hiçbir şey render etme
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Role bazlı koruma hook'u
export function useRoleGuard(allowedRoles: UserRole[]) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace(roleHomeMap[user.role]);
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  return {
    isAllowed: user ? allowedRoles.includes(user.role) : false,
    isLoading,
    user,
  };
}

