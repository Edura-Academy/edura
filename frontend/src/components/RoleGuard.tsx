'use client';

import { useRoleGuard, UserRole } from '@/contexts/AuthContext';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

/**
 * Role bazlı sayfa koruma bileşeni
 * 
 * Kullanım:
 * <RoleGuard allowedRoles={['mudur']}>
 *   <MudurDashboard />
 * </RoleGuard>
 */
export function RoleGuard({ allowedRoles, children, loadingComponent }: RoleGuardProps) {
  const { isAllowed, isLoading } = useRoleGuard(allowedRoles);

  if (isLoading) {
    return loadingComponent || (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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

  if (!isAllowed) {
    // Yönlendirme useRoleGuard içinde yapılıyor, burada sadece boş döndür
    return null;
  }

  return <>{children}</>;
}

export default RoleGuard;

