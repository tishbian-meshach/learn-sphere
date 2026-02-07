'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end';
}

export function DropdownMenu({ trigger, children, align = 'end' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[180px] rounded-lg border border-surface-200 bg-white py-1 shadow-lg animate-slide-down',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
                onClick: () => {
                  (child.props as { onClick?: () => void }).onClick?.();
                  setIsOpen(false);
                },
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
  className?: string;
}

export function DropdownMenuItem({ children, onClick, variant = 'default', icon, className }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors',
        variant === 'danger'
          ? 'text-red-600 hover:bg-red-50'
          : 'text-surface-700 hover:bg-surface-50',
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-surface-100" />;
}
