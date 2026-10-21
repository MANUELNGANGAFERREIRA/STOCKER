'use client';

import { useMemo, useState } from 'react';
import { FileDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BadgeStatus } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useColecao } from '@/hooks/useFirestore';
import { calcularStatusProduto, type Produto, type Entrada, type Saida } from '@/types';
import { formatarKz, formatarData } from '@/lib/utils';
import { exportarRelatorioPDF, type ColunaRelatorio } from '@/lib/utils/pdf';

type TipoRelatorio =
  | 'inventario_atual'
  | 'entradas_periodo'
  | 'saidas_periodo'
  | 'mais_vendidos'
  | 'menos_vendidos'
  | 'produtos_parados'
  | 'abaixo_minimo'
  | 'historico_movimentacoes';

const opcoesRelatorio: { valor: TipoRelatorio; rotulo: string }[] = [
  { valor: 'inventario_atual', rotulo: 'Inventário Atual' },
  { valor: 'abaixo_minimo', rotulo: 'Produtos Abaixo do Mínimo' },
  { valor: 'produtos_parados', rotulo: 'Produtos Parados (30+ dias)' },
  { valor: 'mais_vendidos', rotulo: 'Mais Vendidos (Top 10)' },
  { valor: 'menos_vendidos', rotulo: 'Menos Vendidos (Bottom 10)' },
  { valor: 'entradas_periodo', rotulo: 'Entradas por Período' },
  { valor: 'saidas_periodo', rotulo: 'Saídas por Período' },
  { valor: 'historico_movimentacoes', rotulo: 'Histórico de Movimentações' },
];

export default function PaginaRelatorios() {
  const { perfil } = useAuth();
  const { dados: produtos } = useColecao<Produto>('produtos');
  const { dados: entradas } = useColecao<Entrada>('entradas', { ordenarPor: 'data', ordemDesc: true });
  const { dados: saidas } = useColecao<Saida>('saidas', { ordenarPor: 'data', ordemDesc: true });

  const [tipo, setTipo] = useState<TipoRelatorio>('inventario_atual');
  const [aGerarPdf, setAGerarPdf] = useState(false);

  const valorTotalStock = useMemo(
    () => produtos.reduce((soma, p) => soma + p.quantidade * p.precoCompra, 0),
    [produtos]
  );

  const proveitosVendas = useMemo(
    () => saidas.reduce((soma, s) => soma + (s.valorTotal ?? s.precoUnitario * s.quantidade), 0),
    [saidas]
  );

  const vendasPorProduto = useMemo(() => {
    const mapa = new Map<string, { nome: string; totalVendido: number }>();
    for (const s of saidas) {
      const atual = mapa.get(s.produtoId) || { nome: s.produtoNome, totalVendido: 0 };
      atual.totalVendido += s.quantidade;
      mapa.set(s.produtoId, atual);
    }
    return Array.from(mapa.values());
  }, [saidas]);

  const maisVendidos = useMemo(
    () => [...vendasPorProduto].sort((a, b) => b.totalVendido - a.totalVendido).slice(0, 10),
    [vendasPorProduto]
  );

  const menosVendidos = useMemo(
    () => [...vendasPorProduto].sort((a, b) => a.totalVendido - b.totalVendido).slice(0, 10),
    [vendasPorProduto]
  );

  const produtosParados = useMemo(() => {
    const trintaDiasAtras = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return produtos.filter((p) => {
      const teveSaidaRecente = saidas.some((s) => s.produtoId === p.id && s.data >= trintaDiasAtras);
      return !teveSaidaRecente;
    });
  }, [produtos, saidas]);

  const abaixoMinimo = useMemo(
    () => produtos.filter((p) => calcularStatusProduto(p) !== 'ok'),
    [produtos]
  );

  const historicoMovimentacoes = useMemo(() => {
    const entradasMarcadas = entradas.map((e) => ({ tipo: 'Entrada' as const, ...e }));
    const saidasMarcadas = saidas.map((s) => ({ tipo: 'Saída' as const, ...s }));
    return [...entradasMarcadas, ...saidasMarcadas].sort((a, b) => b.data - a.data);
  }, [entradas, saidas]);

  // Monta os dados (colunas, linhas, resumo) do PDF para o relatório
  // atualmente selecionado. Tudo calculado a partir dos dados já
  // carregados em memória — nenhuma chamada extra, funciona offline.
  function obterDadosPdf(): { titulo: string; colunas: ColunaRelatorio[]; linhas: Record<string, string | number>[]; resumo?: { rotulo: string; valor: string }[] } {
    switch (tipo) {
      case 'inventario_atual':
        return {
          titulo: 'Inventário Atual',
          colunas: [
            { cabecalho: 'Produto', chave: 'nome' },
            { cabecalho: 'Categoria', chave: 'categoria' },
            { cabecalho: 'Qtd.', chave: 'quantidade', alinhamento: 'right' },
            { cabecalho: 'Preço unit. custo', chave: 'custoUnitario', alinhamento: 'right' },
            { cabecalho: 'Preço unit. venda', chave: 'vendaUnitario', alinhamento: 'right' },
            { cabecalho: 'Estado', chave: 'estado' },
            { cabecalho: 'Valor (custo)', chave: 'valor', alinhamento: 'right' },
            { cabecalho: 'Valor (venda)', chave: 'valorVenda', alinhamento: 'right' },
          ],
          linhas: produtos.map((p) => ({
            nome: p.nome,
            categoria: p.categoria,
            quantidade: `${p.quantidade} ${p.unidade}`,
            custoUnitario: formatarKz(p.precoCompra),
            vendaUnitario: formatarKz(p.precoVenda),
            estado: rotuloStatus(calcularStatusProduto(p)),
            valor: formatarKz(p.quantidade * p.precoCompra),
            valorVenda: formatarKz(p.quantidade * p.precoVenda),
          })),
          resumo: [
            { rotulo: 'Produtos', valor: String(produtos.length) },
            { rotulo: 'Valor total em stock', valor: formatarKz(valorTotalStock) },
            { rotulo: 'Valor potencial de venda', valor: formatarKz(produtos.reduce((s, p) => s + p.quantidade * p.precoVenda, 0)) },
          ],
        };
      case 'abaixo_minimo':
        return {
          titulo: 'Produtos Abaixo do Mínimo',
          colunas: [
            { cabecalho: 'Produto', chave: 'nome' },
            { cabecalho: 'Stock atual', chave: 'quantidade', alinhamento: 'right' },
            { cabecalho: 'Mínimo', chave: 'minimo', alinhamento: 'right' },
            { cabecalho: 'Estado', chave: 'estado' },
          ],
          linhas: abaixoMinimo.map((p) => ({
            nome: p.nome,
            quantidade: p.quantidade,
            minimo: p.quantidadeMinima,
            estado: rotuloStatus(calcularStatusProduto(p)),
          })),
          resumo: [{ rotulo: 'Produtos críticos', valor: String(abaixoMinimo.length) }],
        };
      case 'produtos_parados':
        return {
          titulo: 'Produtos Parados (30+ dias sem saída)',
          colunas: [
            { cabecalho: 'Produto', chave: 'nome' },
            { cabecalho: 'Stock atual', chave: 'quantidade', alinhamento: 'right' },
          ],
          linhas: produtosParados.map((p) => ({ nome: p.nome, quantidade: p.quantidade })),
          resumo: [{ rotulo: 'Produtos parados', valor: String(produtosParados.length) }],
        };
      case 'mais_vendidos':
        return {
          titulo: 'Mais Vendidos (Top 10)',
          colunas: [
            { cabecalho: '#', chave: 'posicao', alinhamento: 'right' },
            { cabecalho: 'Produto', chave: 'nome' },
            { cabecalho: 'Total vendido', chave: 'total', alinhamento: 'right' },
          ],
          linhas: maisVendidos.map((v, i) => ({ posicao: i + 1, nome: v.nome, total: `${v.totalVendido} un.` })),
        };
      case 'menos_vendidos':
        return {
          titulo: 'Menos Vendidos (Bottom 10)',
          colunas: [
            { cabecalho: '#', chave: 'posicao', alinhamento: 'right' },
            { cabecalho: 'Produto', chave: 'nome' },
            { cabecalho: 'Total vendido', chave: 'total', alinhamento: 'right' },
          ],
          linhas: menosVendidos.map((v, i) => ({ posicao: i + 1, nome: v.nome, total: `${v.totalVendido} un.` })),
        };
      case 'entradas_periodo':
        return {
          titulo: 'Entradas por Período',
          colunas: [
            { cabecalho: 'Data', chave: 'data' },
            { cabecalho: 'Produto', chave: 'nome' },
            { cabecalho: 'Fornecedor', chave: 'fornecedor' },
            { cabecalho: 'Qtd.', chave: 'quantidade', alinhamento: 'right' },
          ],
          linhas: entradas.map((e) => ({
            data: formatarData(e.data),
            nome: e.produtoNome,
            fornecedor: e.fornecedorNome || '—',
            quantidade: `+${e.quantidade}`,
          })),
          resumo: [{ rotulo: 'Total de entradas', valor: String(entradas.length) }],
        };
      case 'saidas_periodo':
        return {
          titulo: 'Saídas por Período',
          colunas: [
            { cabecalho: 'Data', chave: 'data' },
            { cabecalho: 'Produto', chave: 'nome' },
            { cabecalho: 'Cliente', chave: 'cliente' },
            { cabecalho: 'Qtd.', chave: 'quantidade', alinhamento: 'right' },
            { cabecalho: 'Preço unit. venda', chave: 'precoUnitario', alinhamento: 'right' },
            { cabecalho: 'Proveitos', chave: 'proveitos', alinhamento: 'right' },
          ],
          linhas: saidas.map((s) => ({
            data: formatarData(s.data),
            nome: s.produtoNome,
            cliente: s.clienteNome || '—',
            quantidade: `-${s.quantidade}`,
            precoUnitario: formatarKz(s.precoUnitario),
            proveitos: formatarKz(s.valorTotal ?? s.precoUnitario * s.quantidade),
          })),
          resumo: [
            { rotulo: 'Registos de saída', valor: String(saidas.length) },
            { rotulo: 'Proveitos totais das vendas', valor: formatarKz(proveitosVendas) },
          ],
        };
      case 'historico_movimentacoes':
        return {
          titulo: 'Histórico de Movimentações',
          colunas: [
            { cabecalho: 'Data', chave: 'data' },
            { cabecalho: 'Tipo', chave: 'tipo' },
            { cabecalho: 'Produto', chave: 'nome' },
            { cabecalho: 'Qtd.', chave: 'quantidade', alinhamento: 'right' },
          ],
          linhas: historicoMovimentacoes.map((m) => ({
            data: formatarData(m.data),
            tipo: m.tipo,
            nome: m.produtoNome,
            quantidade: m.tipo === 'Entrada' ? `+${m.quantidade}` : `-${m.quantidade}`,
          })),
        };
    }
  }

  function lidarComExportarPdf() {
    setAGerarPdf(true);
    try {
      const { titulo, colunas, linhas, resumo } = obterDadosPdf();
      exportarRelatorioPDF({
        titulo,
        colunas,
        linhas,
        resumo,
        nomeNegocio: perfil?.nome,
        nomeFicheiro: `Conexore_${tipo}_${new Date().toISOString().slice(0, 10)}`,
      });
    } finally {
      setAGerarPdf(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500">Consulte os relatórios do seu negócio</p>
        </div>
        <Button tamanho="sm" onClick={lidarComExportarPdf} aCarregar={aGerarPdf}>
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <Card>
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoRelatorio)}>
          {opcoesRelatorio.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </Select>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <p className="text-sm text-gray-500">Valor total investido em stock (custo)</p>
          <p className="text-2xl font-bold text-gray-900">{formatarKz(valorTotalStock)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Proveitos das vendas registadas</p>
          <p className="text-2xl font-bold text-ok">{formatarKz(proveitosVendas)}</p>
        </Card>
      </div>

      {tipo === 'inventario_atual' && (
        <ListaRelatorio
          vazio="Nenhum produto cadastrado."
          itens={produtos}
          render={(p) => (
            <>
              <div>
                <p className="font-medium text-gray-900">{p.nome}</p>
                <p className="text-xs text-gray-500">{p.categoria} · {p.quantidade} {p.unidade}</p>
              </div>
              <div className="text-right">
                <BadgeStatus status={calcularStatusProduto(p)} />
                <p className="text-xs text-gray-500 mt-1">{formatarKz(p.quantidade * p.precoCompra)}</p>
              <p className="text-xs text-gray-500">Custo unit.: {formatarKz(p.precoCompra)} · Venda: {formatarKz(p.precoVenda)}</p>
              <p className="text-xs text-gray-500">Valor potencial: {formatarKz(p.quantidade * p.precoVenda)}</p>
              </div>
            </>
          )}
        />
      )}

      {tipo === 'abaixo_minimo' && (
        <ListaRelatorio
          vazio="Nenhum produto abaixo do mínimo. 🎉"
          itens={abaixoMinimo}
          render={(p) => (
            <>
              <div>
                <p className="font-medium text-gray-900">{p.nome}</p>
                <p className="text-xs text-gray-500">
                  Stock: {p.quantidade} · Mínimo: {p.quantidadeMinima}
                </p>
              </div>
              <BadgeStatus status={calcularStatusProduto(p)} />
            </>
          )}
        />
      )}

      {tipo === 'produtos_parados' && (
        <ListaRelatorio
          vazio="Nenhum produto parado."
          itens={produtosParados}
          render={(p) => (
            <div>
              <p className="font-medium text-gray-900">{p.nome}</p>
              <p className="text-xs text-gray-500">Sem saída nos últimos 30 dias · Stock: {p.quantidade}</p>
            </div>
          )}
        />
      )}

      {tipo === 'mais_vendidos' && (
        <ListaRelatorio
          vazio="Ainda não há vendas registadas."
          itens={maisVendidos}
          render={(v, i) => (
            <>
              <p className="font-medium text-gray-900">
                {i + 1}. {v.nome}
              </p>
              <p className="font-semibold text-ok">{v.totalVendido} un.</p>
            </>
          )}
        />
      )}

      {tipo === 'menos_vendidos' && (
        <ListaRelatorio
          vazio="Ainda não há vendas registadas."
          itens={menosVendidos}
          render={(v, i) => (
            <>
              <p className="font-medium text-gray-900">
                {i + 1}. {v.nome}
              </p>
              <p className="font-semibold text-gray-500">{v.totalVendido} un.</p>
            </>
          )}
        />
      )}

      {tipo === 'entradas_periodo' && (
        <ListaRelatorio
          vazio="Nenhuma entrada registada."
          itens={entradas}
          render={(e) => (
            <>
              <div>
                <p className="font-medium text-gray-900">{e.produtoNome}</p>
                <p className="text-xs text-gray-500">{formatarData(e.data)}</p>
              </div>
              <p className="font-semibold text-ok">+{e.quantidade}</p>
            </>
          )}
        />
      )}

      {tipo === 'saidas_periodo' && (
        <ListaRelatorio
          vazio="Nenhuma saída registada."
          itens={saidas}
          render={(s) => (
            <>
              <div>
                <p className="font-medium text-gray-900">{s.produtoNome}</p>
                <p className="text-xs text-gray-500">{formatarData(s.data)} · {formatarKz(s.precoUnitario)}/un</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-risco">-{s.quantidade}</p>
                <p className="text-xs text-gray-500">Proveitos: {formatarKz(s.valorTotal ?? s.precoUnitario * s.quantidade)}</p>
              </div>
            </>
          )}
        />
      )}

      {tipo === 'historico_movimentacoes' && (
        <ListaRelatorio
          vazio="Nenhuma movimentação registada."
          itens={historicoMovimentacoes}
          render={(m) => (
            <>
              <div>
                <p className="font-medium text-gray-900">{m.produtoNome}</p>
                <p className="text-xs text-gray-500">
                  {m.tipo} · {formatarData(m.data)}
                </p>
              </div>
              <p className={`font-semibold ${m.tipo === 'Entrada' ? 'text-ok' : 'text-risco'}`}>
                {m.tipo === 'Entrada' ? '+' : '-'}
                {m.quantidade}
              </p>
            </>
          )}
        />
      )}
    </div>
  );
}

function rotuloStatus(status: ReturnType<typeof calcularStatusProduto>): string {
  if (status === 'sem_stock') return 'Sem stock';
  if (status === 'critico') return 'Crítico';
  return 'OK';
}

function ListaRelatorio<T>({
  itens,
  vazio,
  render,
}: {
  itens: T[];
  vazio: string;
  render: (item: T, indice: number) => React.ReactNode;
}) {
  if (itens.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">{vazio}</p>;
  }
  return (
    <div className="space-y-2">
      {itens.map((item, i) => (
        <Card key={i} className="flex items-center justify-between">
          {render(item, i)}
        </Card>
      ))}
    </div>
  );
}
