'use client';

import * as React from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  searchable?: boolean;
}

export function Select({
  label,
  placeholder = 'Select option...',
  options,
  value,
  onChange,
  error,
  className,
  searchable = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={cn('w-full space-y-1.5', className)} ref={containerRef}>
      {label && <label className="text-xs font-semibold text-surface-700 uppercase tracking-wider">{label}</label>}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm shadow-none transition-colors hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus:ring-destructive',
            isOpen && 'ring-1 ring-ring border-primary'
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            <span className={cn(selectedOption ? 'text-surface-900' : 'text-muted-foreground')}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-surface-400 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <div className="absolute top-[calc(100%+4px)] z-50 w-full min-w-[8rem] overflow-hidden rounded-md border border-border bg-white text-surface-900 shadow-lg animate-slide-up">
            {searchable && (
              <div className="flex items-center border-b border-border px-3 py-2">
                <Search className="mr-2 h-4 w-4 shrink-0 text-surface-400" />
                <input
                  className="flex h-6 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Filter resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <p className="p-2 text-xs text-center text-muted-foreground">No matches found.</p>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={cn(
                      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-surface-50 focus:bg-surface-100 transition-colors',
                      value === option.value && 'text-primary font-medium'
                    )}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {value === option.value && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
