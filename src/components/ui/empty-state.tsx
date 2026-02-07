import { LucideIcon, Info } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Info,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center rounded-md border border-dashed border-border bg-slate-50/50",
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-6 h-6 text-surface-300" />
      </div>
      <h3 className="text-sm font-extrabold text-surface-900 uppercase tracking-widest">{title}</h3>
      <p className="mt-2 text-xs text-surface-500 max-w-sm font-medium">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          <Button size="sm" variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
