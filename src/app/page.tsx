'use client';

import Link from 'next/link';
import { ArrowRight, Boxes, ChartNoAxesCombined, ShieldCheck, Store } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PaginaInicial() {
  return (
    <main className="min-h-screen bg-bgapp">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 font-bold text-primary"><Store className="h-6 w-6" /> Conexore</div>
        <Link href="/login/"><Button variante="fantasma">Entrar <ArrowRight className="h-4 w-4" /></Button></Link>
      </header>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Gestão de stock simples para negócios em Angola</p>
          <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">Saiba o que tem. Entenda o que rende.</h1>
          <p className="mt-5 max-w-xl text-lg text-gray-600">O Conexore Stock ajuda lojas, armazéns e pequenos negócios angolanos a controlar produtos, entradas, saídas e inventário. Acompanhe o custo médio do stock e o valor potencial das vendas num só lugar.</p>
          <Link href="/login/" className="mt-7 inline-flex"><Button>Entrar no Conexore <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm"><Boxes className="mb-4 h-7 w-7 text-primary"/><h2 className="font-semibold">Stock sob controlo</h2><p className="mt-2 text-sm text-gray-500">Acompanhe quantidades, mínimos e movimentos em tempo real.</p></div>
          <div className="rounded-xl border bg-white p-5 shadow-sm"><ChartNoAxesCombined className="mb-4 h-7 w-7 text-ok"/><h2 className="font-semibold">Números claros</h2><p className="mt-2 text-sm text-gray-500">Compare custos e vendas e acompanhe o lucro bruto.</p></div>
          <div className="rounded-xl border bg-white p-5 shadow-sm sm:col-span-2"><ShieldCheck className="mb-4 h-7 w-7 text-secondary"/><h2 className="font-semibold">Acesso simples e seguro</h2><p className="mt-2 text-sm text-gray-500">Entre na sua conta para consultar os dados do seu negócio.</p></div>
        </div>
      </section>
      <footer className="border-t bg-white px-5 py-5 text-center text-sm text-gray-500">Conexore · Gestão de stock para pequenos negócios</footer>
    </main>
  );
}
