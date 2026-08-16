import { cn } from '@/lib/utils';
import type { StatusProduto } from '@/types';

const estilos: Record<StatusProduto, string> = {
  ok: 'bg-green-100 text-ok',
  critico: 'bg-amber-100 text-secondary-700',
  sem_stock: 'bg-red-100 text-risco',
};

const rotulos: Record<StatusProduto, string> = {
  ok: 'Em stock',
  critico: 'Crítico',
  sem_stock: 'Sem stock',
};

export function BadgeStatus({ status }: { status: StatusProduto }) {
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-1 text-xs font-semibold', estilos[status])}>
      {rotulos[status]}
    </span>
  );
}
