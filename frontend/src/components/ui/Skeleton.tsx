'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Hazır Skeleton Bileşenleri
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </div>
      </div>
      <Skeleton variant="rounded" height={100} />
      <div className="flex space-x-2">
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="flex space-x-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="text" width={`${20 + i * 5}%`} height={16} />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="px-6 py-4 border-b last:border-b-0">
          <div className="flex items-center space-x-4">
            <Skeleton variant="circular" width={36} height={36} />
            <div className="flex-1 flex space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="text" width={`${15 + i * 5}%`} height={14} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton variant="text" width={80} height={14} />
              <Skeleton variant="text" width={60} height={28} />
            </div>
            <Skeleton variant="circular" width={48} height={48} />
          </div>
          <Skeleton variant="text" width={120} height={12} className="mt-4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border p-4 flex items-center space-x-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="50%" height={14} />
          </div>
          <Skeleton variant="rounded" width={60} height={28} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <SkeletonStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonTable rows={5} />
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <Skeleton variant="text" width="40%" height={24} />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="text" width={100} height={14} />
            <Skeleton variant="rounded" height={40} />
          </div>
        ))}
      </div>
      <div className="flex justify-end space-x-3">
        <Skeleton variant="rounded" width={80} height={40} />
        <Skeleton variant="rounded" width={100} height={40} />
      </div>
    </div>
  );
}

