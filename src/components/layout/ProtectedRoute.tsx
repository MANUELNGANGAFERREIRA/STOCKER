'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Protege as rotas do dashboard: redireciona para o login se o
// utilizador não estiver autenticado, e bloqueia o acesso se a conta
// tiver sido desativada por um administrador.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { utilizadorFirebase, perfil, carregando, sair } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando && !utilizadorFirebase) {
      router.replace('/login/');
    }
  }, [carregando, utilizadorFirebase, router]);

  useEffect(() => {
    if (perfil && perfil.ativo === false) {
      sair();
      router.replace('/login/?desativado=1');
    }
  }, [perfil, sair, router]);

  if (carregando || !utilizadorFirebase) {
    return (
      <div className="flex h-screen items-center justify-center bg-bgapp">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
