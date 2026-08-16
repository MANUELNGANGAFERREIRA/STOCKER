'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primaria' | 'secundaria' | 'perigo' | 'fantasma';
  aCarregar?: boolean;
  tamanho?: 'sm' | 'md' | 'lg';
}

const estilosVariante: Record<string, string> = {
  primaria: 'bg-primary text-white hover:bg-primary-700 focus-visible:ring-primary-600',
  secundaria: 'bg-secondary text-white hover:bg-secondary-700 focus-visible:ring-secondary-600',
  perigo: 'bg-risco text-white hover:bg-red-700 focus-visible:ring-red-600',
  fantasma: 'bg-transparent text-primary hover:bg-primary-50 focus-visible:ring-primary-600',
};

const estilosTamanho: Record<string, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-5 py-3',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variante = 'primaria', tamanho = 'md', aCarregar, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || aCarregar}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          estilosVariante[variante],
          estilosTamanho[tamanho],
          className
        )}
        {...props}
      >
        {aCarregar && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
