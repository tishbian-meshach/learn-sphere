'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay - Flat Neutral */}
      <div 
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-[2px] animate-fade-in" 
        onClick={onClose} 
      />
      
      {/* Content Carrier */}
      <div 
        className={cn(
          'relative w-full bg-white rounded-md shadow-xl border border-border animate-slide-up overflow-hidden',
          sizes[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50/50">
          <div>
            {title && <h2 className="text-sm font-extrabold text-surface-900 uppercase tracking-widest">{title}</h2>}
            {description && <p className="text-[10px] text-surface-500 font-medium uppercase tracking-wider mt-0.5">{description}</p>}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
