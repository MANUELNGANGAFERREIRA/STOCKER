'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Truck,
  Users,
  FileBarChart,
  ShieldCheck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  aberta: boolean;
  aoFechar: () => void;
}

const itensMenu = [
  { href: '/dashboard/', rotulo: 'Painel', icone: LayoutDashboard },
  { href: '/produtos/', rotulo: 'Produtos', icone: Package },
  { href: '/entradas/', rotulo: 'Entradas', icone: ArrowDownToLine },
  { href: '/saidas/', rotulo: 'Saídas', icone: ArrowUpFromLine },
  { href: '/inventario/', rotulo: 'Inventário', icone: ClipboardList },
  { href: '/fornecedores/', rotulo: 'Fornecedores', icone: Truck },
  { href: '/clientes/', rotulo: 'Clientes', icone: Users },
  { href: '/relatorios/', rotulo: 'Relatórios', icone: FileBarChart },
];

export function Sidebar({ aberta, aoFechar }: SidebarProps) {
  const pathname = usePathname();
  const { ehAdmin } = useAuth();

  return (
    <>
      {/* Sobreposição escura em mobile quando a sidebar está aberta */}
      {aberta && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={aoFechar}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform bg-primary text-white transition-transform duration-200 ease-in-out',
          'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          aberta ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <span className="text-lg font-bold">ContaFácil AO</span>
          <button onClick={aoFechar} className="lg:hidden" aria-label="Fechar menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-2 flex flex-col gap-1 px-2 overflow-y-auto">
          {itensMenu.map(({ href, rotulo, icone: Icone }) => {
            const ativo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={aoFechar}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  ativo ? 'bg-white text-primary' : 'text-white/90 hover:bg-white/10'
                )}
              >
                <Icone className="h-5 w-5 shrink-0" />
                {rotulo}
              </Link>
            );
          })}

          {ehAdmin && (
            <Link
              href="/admin/"
              onClick={aoFechar}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mt-2 border-t border-white/10 pt-3',
                pathname === '/admin/' ? 'bg-secondary text-white' : 'text-secondary hover:bg-white/10'
              )}
            >
              <ShieldCheck className="h-5 w-5 shrink-0" />
              Painel Admin
            </Link>
          )}
        </nav>
      </aside>
    </>
  );
}
