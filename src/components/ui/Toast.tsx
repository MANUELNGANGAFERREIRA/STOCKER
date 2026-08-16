'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type TipoToast = 'sucesso' | 'erro' | 'info';

interface Toast {
  id: number;
  tipo: TipoToast;
  mensagem: string;
}

interface ToastContextValor {
  mostrarToast: (mensagem: string, tipo?: TipoToast) => void;
}

const ToastContext = createContext<ToastContextValor | undefined>(undefined);

const icones: Record<TipoToast, ReactNode> = {
  sucesso: <CheckCircle2 className="h-5 w-5 text-ok shrink-0" />,
  erro: <XCircle className="h-5 w-5 text-risco shrink-0" />,
  info: <Info className="h-5 w-5 text-primary shrink-0" />,
};

const bordas: Record<TipoToast, string> = {
  sucesso: 'border-l-4 border-ok',
  erro: 'border-l-4 border-risco',
  info: 'border-l-4 border-primary',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrarToast = useCallback((mensagem: string, tipo: TipoToast = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((atual) => [...atual, { id, mensagem, tipo }]);
    setTimeout(() => {
      setToasts((atual) => atual.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  function remover(id: number) {
    setToasts((atual) => atual.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-96">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-2 rounded-lg bg-white p-3 shadow-lg',
              bordas[t.tipo]
            )}
          >
            {icones[t.tipo]}
            <p className="flex-1 text-sm text-gray-800">{t.mensagem}</p>
            <button onClick={() => remover(t.id)} aria-label="Fechar notificação">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de um ToastProvider');
  return ctx;
}
