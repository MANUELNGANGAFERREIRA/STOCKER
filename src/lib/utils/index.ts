import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combina classes Tailwind de forma segura, evitando conflitos.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formata um valor numérico como Kwanza (moeda de Angola).
export function formatarKz(valor: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
  }).format(valor);
}

// Formata uma data (timestamp em ms) no formato dd/mm/aaaa
export function formatarData(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatarDataHora(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Converte um input type="date" (string "aaaa-mm-dd") para timestamp em ms
export function dataInputParaTimestamp(valor: string): number {
  return new Date(`${valor}T00:00:00`).getTime();
}

export function timestampParaDataInput(timestamp: number): string {
  const d = new Date(timestamp);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Gera um código simples para novos produtos (ex: PRD-0001)
export function gerarCodigoProduto(): string {
  const aleatorio = Math.floor(1000 + Math.random() * 9000);
  return `PRD-${aleatorio}`;
}
