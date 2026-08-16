'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, WifiOff, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOffline } from '@/hooks/useOffline';

export function Header({ aoAbrirMenu }: { aoAbrirMenu: () => void }) {
  const { perfil, sair } = useAuth();
  const offline = useOffline();
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);

  async function lidarComSaida() {
    await sair();
    router.replace('/login/');
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
      <button onClick={aoAbrirMenu} className="lg:hidden text-gray-600" aria-label="Abrir menu">
        <Menu className="h-6 w-6" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        {offline && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-secondary-700">
            <WifiOff className="h-3.5 w-3.5" />
            Modo Offline
          </span>
        )}

        <div className="relative">
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100"
          >
            <UserCircle className="h-7 w-7 text-primary" />
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {perfil?.nome || 'Utilizador'}
            </span>
          </button>

          {menuAberto && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white py-1 shadow-lg border border-gray-100">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">{perfil?.nome}</p>
                <p className="text-xs text-gray-500 truncate">{perfil?.email}</p>
              </div>
              <button
                onClick={lidarComSaida}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-risco hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
