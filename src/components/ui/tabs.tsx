'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

const Tabs = ({ tabs, activeTab, onChange, className }: TabsProps) => {
  return (
    <div className={cn('flex items-center border-b border-border', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all relative top-[1px]',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-surface-300'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

interface TabPanelProps {
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
}

const TabPanel = ({ children, isActive, className }: TabPanelProps) => {
  if (!isActive) return null;
  return <div className={cn('py-6 animate-fade-in', className)}>{children}</div>;
};

export { Tabs, TabPanel };
