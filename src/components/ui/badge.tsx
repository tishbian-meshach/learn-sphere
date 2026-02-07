import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'danger' | 'outline' | 'secondary';
  size?: 'sm' | 'md';
}

const Badge = ({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: BadgeProps) => {
  const variants = {
    default: 'bg-surface-100 text-surface-600 border-surface-200',
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-destructive/10 text-destructive border-destructive/20',
    danger: 'bg-red-50 text-red-700 border-red-200',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    outline: 'bg-transparent text-surface-600 border-surface-200',
  };

  const sizes = {
    sm: 'px-1.5 py-0.25 text-[10px] uppercase tracking-wider font-bold',
    md: 'px-2 py-0.5 text-xs font-medium',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};

export { Badge };
