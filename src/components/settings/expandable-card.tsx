'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableCardProps {
  title: string;
  description: string;
  collapsed: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function ExpandableCard({
  title,
  description,
  collapsed,
  children,
  defaultOpen = false,
}: ExpandableCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <button
        type="button"
        className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors duration-150"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          {!isOpen && <div className="mt-3">{collapsed}</div>}
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-zinc-400 shrink-0 ml-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'transition-all duration-200 ease-out overflow-hidden',
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-6 pb-5 pt-2">{children}</div>
      </div>
    </Card>
  );
}
