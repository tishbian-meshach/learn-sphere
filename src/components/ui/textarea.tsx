import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    const id = React.useId();

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-surface-700 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          id={id}
          className={cn(
            'flex min-h-[120px] w-full rounded-lg border bg-white px-4 py-3 text-surface-900 transition-all duration-200',
            'placeholder:text-surface-400 focus:outline-none resize-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-surface-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-surface-500">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
