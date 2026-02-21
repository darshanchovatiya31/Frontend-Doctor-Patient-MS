import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Base Skeleton Component
 * Provides a shimmering loading placeholder
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_2s_infinite]',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

/**
 * Table Skeleton Loader
 * Displays skeleton rows for table loading state
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6,
}) => {
  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="hidden lg:grid grid-cols-6 gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
        {Array.from({ length: columns }).map((_, idx) => (
          <Skeleton key={idx} height={20} className="h-5" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="space-y-3 p-3 sm:p-4">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="lg:hidden rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="space-y-3">
              <Skeleton height={20} className="h-5 w-3/4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Skeleton height={16} className="h-4 w-16" />
                    <Skeleton height={16} className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Rows */}
      <div className="hidden lg:block">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 dark:border-gray-800 last:border-b-0"
          >
            {Array.from({ length: columns }).map((_, colIdx) => (
              <Skeleton key={colIdx} height={20} className="h-5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Card Skeleton Loader
 * Displays skeleton for stat cards
 */
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton height={16} className="h-4 w-24" />
              <Skeleton height={32} className="h-8 w-16" />
            </div>
            <Skeleton variant="circular" width={48} height={48} className="flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Dashboard Skeleton Loader
 * Full page skeleton for dashboard loading
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Skeleton height={32} className="h-8 w-64 mb-2" />
        <Skeleton height={16} className="h-4 w-96" />
      </div>

      {/* Stats Cards */}
      <CardSkeleton count={4} />

      {/* Additional Content Skeleton */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <Skeleton height={24} className="h-6 w-48 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-800">
              <div className="flex items-center gap-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="space-y-2">
                  <Skeleton height={16} className="h-4 w-32" />
                  <Skeleton height={14} className="h-3.5 w-48" />
                </div>
              </div>
              <Skeleton height={14} className="h-3.5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Form Skeleton Loader
 * Skeleton for form loading state
 */
export const FormSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="space-y-2">
            <Skeleton height={16} className="h-4 w-24" />
            <Skeleton height={40} className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-4">
        <Skeleton height={40} className="h-10 w-32" />
        <Skeleton height={40} className="h-10 w-32" />
      </div>
    </div>
  );
};

export default Skeleton;

