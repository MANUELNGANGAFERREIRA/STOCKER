'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function PaginaInicial() {
  const { utilizadorFirebase, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!carregando) {
      router.replace(utilizadorFirebase ? '/dashboard/' : '/login/');
    }
  }, [carregando, utilizadorFirebase, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-bgapp">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
