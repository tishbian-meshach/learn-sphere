import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'default' | 'gradient';
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function Progress({
  value,
  max = 100,
  className,
  size = 'md',
  showLabel = false,
  variant = 'default',
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-surface-600">Progress</span>
          <span className="font-medium text-surface-900">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full rounded-full bg-surface-200 overflow-hidden', sizeClasses[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variant === 'gradient' ? 'gradient-primary' : 'bg-primary-600'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
