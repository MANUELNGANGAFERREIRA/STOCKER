'use client';

import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  children: ReactNode;
}

export function Modal({ aberto, aoFechar, titulo, children }: ModalProps) {
  // Bloqueia o scroll do fundo enquanto o modal está aberto — importante
  // em ecrãs pequenos (mobile-first) para não haver "double scroll".
  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-lg sm:rounded-lg bg-white shadow-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
