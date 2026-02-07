'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const variantStyles = {
    danger: {
      icon: 'text-red-500 bg-red-50',
      button: 'danger' as const,
    },
    warning: {
      icon: 'text-amber-500 bg-amber-50',
      button: 'primary' as const,
    },
    info: {
      icon: 'text-blue-500 bg-blue-50',
      button: 'primary' as const,
    },
  };

  const style = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', style.icon)}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-surface-900">{title}</h3>
          <p className="text-sm text-surface-600">{description}</p>
        </div>

        <div className="flex items-center gap-3 w-full pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={style.button}
            onClick={handleConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
