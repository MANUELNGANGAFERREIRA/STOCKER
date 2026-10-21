'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  PackageX,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card, CardTitulo, CardValor } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useColecao } from '@/hooks/useFirestore';
import { calcularStatusProduto, type Produto, type Entrada, type Saida } from '@/types';
import { formatarKz, formatarData } from '@/lib/utils';

export default function PaginaDashboard() {
  const { dados: produtos, carregando: carregandoProdutos } = useColecao<Produto>('produtos');
  const { dados: entradas } = useColecao<Entrada>('entradas', { ordenarPor: 'data', ordemDesc: true });
  const { dados: saidas } = useColecao<Saida>('saidas', { ordenarPor: 'data', ordemDesc: true });

  const estatisticas = useMemo(() => {
    const stockTotal = produtos.length;
    let emRisco = 0;
    let semStock = 0;
    let valorTotal = 0;

    for (const p of produtos) {
      const status = calcularStatusProduto(p);
      if (status === 'critico') emRisco++;
      if (status === 'sem_stock') semStock++;
      valorTotal += p.quantidade * p.precoCompra;
    }

    return { stockTotal, emRisco, semStock, valorTotal };
  }, [produtos]);

  const produtosParados = useMemo(() => {
    const trintaDiasAtras = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return produtos.filter((p) => {
      const teveSaidaRecente = saidas.some((s) => s.produtoId === p.id && s.data >= trintaDiasAtras);
      return !teveSaidaRecente && p.quantidade > 0 && p.quantidade > p.quantidadeMinima;
    });
  }, [produtos, saidas]);

  // Dados do gráfico: movimentação (entradas vs saídas) dos últimos 7 dias
  const dadosGrafico = useMemo(() => {
    const dias: { data: string; entradas: number; saidas: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const inicioDia = d.getTime();
      const fimDia = inicioDia + 24 * 60 * 60 * 1000;

      const totalEntradas = entradas
        .filter((e) => e.data >= inicioDia && e.data < fimDia)
        .reduce((soma, e) => soma + e.quantidade, 0);
      const totalSaidas = saidas
        .filter((s) => s.data >= inicioDia && s.data < fimDia)
        .reduce((soma, s) => soma + s.quantidade, 0);

      dias.push({
        data: d.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' }),
        entradas: totalEntradas,
        saidas: totalSaidas,
      });
    }
    return dias;
  }, [entradas, saidas]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Painel</h1>
        <p className="text-sm text-gray-500">Resumo geral do seu negócio</p>
      </div>

      {/* Alertas automáticos */}
      {(estatisticas.emRisco > 0 || produtosParados.length > 0) && !carregandoProdutos && (
        <div className="space-y-2">
          {estatisticas.emRisco > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <AlertTriangle className="h-5 w-5 text-secondary-700 shrink-0 mt-0.5" />
              <p className="text-sm text-secondary-700">
                <strong>Stock mínimo:</strong> {estatisticas.emRisco} produto(s) atingiram a quantidade mínima definida.
              </p>
            </div>
          )}
          {produtosParados.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-gray-100 border border-gray-200 p-3">
              <TrendingUp className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                <strong>Pouca saída:</strong> {produtosParados.length} produto(s) não tiveram saídas nos últimos 30 dias (com stock acima do mínimo).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cartões de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitulo>Stock Total</CardTitulo>
            <Package className="h-5 w-5 text-primary" />
          </div>
          <CardValor>{estatisticas.stockTotal}</CardValor>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <CardTitulo>Em Risco</CardTitulo>
            <AlertTriangle className="h-5 w-5 text-secondary" />
          </div>
          <CardValor className="text-secondary-700">{estatisticas.emRisco}</CardValor>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <CardTitulo>Sem Stock</CardTitulo>
            <PackageX className="h-5 w-5 text-risco" />
          </div>
          <CardValor className="text-risco">{estatisticas.semStock}</CardValor>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <CardTitulo>Valor do Stock</CardTitulo>
            <Wallet className="h-5 w-5 text-ok" />
          </div>
          <CardValor className="text-base sm:text-2xl">{formatarKz(estatisticas.valorTotal)}</CardValor>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardTitulo>Valor do stock ao custo médio (CUMP)</CardTitulo>
          <CardValor className="text-base sm:text-2xl">{formatarKz(produtos.reduce((s, p) => s + p.quantidade * p.precoCompra, 0))}</CardValor>
          <p className="text-xs text-gray-500 mt-1">Quantidade × custo médio unitário</p>
        </Card>
        <Card>
          <CardTitulo>Valor potencial de venda</CardTitulo>
          <CardValor className="text-base sm:text-2xl">{formatarKz(produtos.reduce((s, p) => s + p.quantidade * p.precoVenda, 0))}</CardValor>
          <p className="text-xs text-gray-500 mt-1">Lucro bruto potencial: {formatarKz(produtos.reduce((s, p) => s + p.quantidade * (p.precoVenda - p.precoCompra), 0))}</p>
        </Card>
      </div>

      {/* Botões rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/entradas/">
          <Button className="w-full" variante="primaria">
            <ArrowDownToLine className="h-4 w-4" /> Registar Entrada
          </Button>
        </Link>
        <Link href="/saidas/">
          <Button className="w-full" variante="secundaria">
            <ArrowUpFromLine className="h-4 w-4" /> Registar Saída
          </Button>
        </Link>
        <Link href="/produtos/">
          <Button className="w-full" variante="fantasma">
            <Search className="h-4 w-4" /> Consultar Stock
          </Button>
        </Link>
      </div>

      {/* Gráfico de movimentação */}
      <Card>
        <CardTitulo className="mb-3">Movimentação dos últimos 7 dias</CardTitulo>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="data" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="entradas" stroke="#1E40AF" strokeWidth={2} name="Entradas" />
              <Line type="monotone" dataKey="saidas" stroke="#F59E0B" strokeWidth={2} name="Saídas" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Listas recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardTitulo className="mb-3">Últimas Entradas</CardTitulo>
          {entradas.length === 0 ? (
            <p className="text-sm text-gray-400">Ainda não há entradas registadas.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {entradas.slice(0, 5).map((e) => (
                <li key={e.id} className="flex justify-between py-2 text-sm">
                  <span className="text-gray-700">{e.produtoNome}</span>
                  <span className="text-gray-500">
                    +{e.quantidade} · {formatarData(e.data)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitulo className="mb-3">Últimas Saídas</CardTitulo>
          {saidas.length === 0 ? (
            <p className="text-sm text-gray-400">Ainda não há saídas registadas.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {saidas.slice(0, 5).map((s) => (
                <li key={s.id} className="flex justify-between py-2 text-sm">
                  <span className="text-gray-700">{s.produtoNome}</span>
                  <span className="text-gray-500">
                    -{s.quantidade} · {formatarData(s.data)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
