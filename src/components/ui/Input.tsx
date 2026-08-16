'use client';

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo?: string;
  erro?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, rotulo, erro, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {rotulo && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {rotulo}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent',
            erro && 'border-risco focus:ring-risco',
            className
          )}
          {...props}
        />
        {erro && <p className="mt-1 text-xs text-risco">{erro}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  rotulo?: string;
  erro?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, rotulo, erro, id, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {rotulo && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {rotulo}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white',
            'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent',
            erro && 'border-risco focus:ring-risco',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {erro && <p className="mt-1 text-xs text-risco">{erro}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
