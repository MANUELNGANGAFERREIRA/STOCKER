import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg bg-white p-4 shadow-sm border border-gray-100', className)}
      {...props}
    />
  );
}

export function CardTitulo({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-sm font-medium text-gray-500', className)} {...props} />;
}

export function CardValor({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-2xl font-bold text-gray-900 mt-1', className)} {...props} />;
}
