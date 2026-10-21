'use client';

import { useState } from 'react';
import { ClipboardCheck, FileDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useColecao, criarDocumento, atualizarDocumento } from '@/hooks/useFirestore';
import type { Produto, RegistoInventario } from '@/types';
import { formatarDataHora } from '@/lib/utils';
import { exportarRelatorioPDF } from '@/lib/utils/pdf';

export default function PaginaInventario() {
  const { utilizadorFirebase } = useAuth();
  const { dados: produtos, carregando } = useColecao<Produto>('produtos');
  const { dados: registos } = useColecao<RegistoInventario>('inventario', {
    ordenarPor: 'data',
    ordemDesc: true,
  });
  const { mostrarToast } = useToast();

  const [quantidadesReais, setQuantidadesReais] = useState<Record<string, string>>({});
  const [aCorrigir, setACorrigir] = useState<string | null>(null);

  function ultimoInventario(produtoId: string) {
    const registo = registos.find((r) => r.produtoId === produtoId);
    return registo ? formatarDataHora(registo.data) : 'Nunca';
  }

  async function corrigirStock(produto: Produto) {
    const valorDigitado = quantidadesReais[produto.id];
    if (valorDigitado === undefined || valorDigitado === '') {
      mostrarToast('Introduza a quantidade real contada.', 'erro');
      return;
    }
    const quantidadeReal = Number(valorDigitado);
    if (Number.isNaN(quantidadeReal) || quantidadeReal < 0) {
      mostrarToast('Quantidade inválida.', 'erro');
      return;
    }
    if (!utilizadorFirebase) return;

    setACorrigir(produto.id);
    try {
      const diferenca = quantidadeReal - produto.quantidade;

      await criarDocumento('inventario', {
        donoId: utilizadorFirebase.uid,
        produtoId: produto.id,
        produtoNome: produto.nome,
        quantidadeSistema: produto.quantidade,
        quantidadeReal,
        diferenca,
        data: Date.now(),
        registadoPor: utilizadorFirebase.uid,
      });

      await atualizarDocumento('produtos', produto.id, {
        quantidade: quantidadeReal,
        atualizadoEm: Date.now(),
      });

      mostrarToast(`Stock de "${produto.nome}" corrigido para ${quantidadeReal}.`, 'sucesso');
      setQuantidadesReais((atual) => ({ ...atual, [produto.id]: '' }));
    } catch (err) {
      mostrarToast('Não foi possível corrigir o stock.', 'erro');
    } finally {
      setACorrigir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Inventário</h1>
        <p className="text-sm text-gray-500">Conte o stock físico e corrija diferenças no sistema</p>
        <Button className="mt-3" variante="secundaria" onClick={() => exportarRelatorioPDF({
          titulo: 'Inventário Atual',
          colunas: [
            { cabecalho: 'Produto', chave: 'nome' },
            { cabecalho: 'Qtd.', chave: 'quantidade', alinhamento: 'right' },
            { cabecalho: 'Preço unitário (custo)', chave: 'custoUnitario', alinhamento: 'right' },
            { cabecalho: 'Preço unitário (venda)', chave: 'vendaUnitario', alinhamento: 'right' },
            { cabecalho: 'Total (custo)', chave: 'valorCusto', alinhamento: 'right' },
            { cabecalho: 'Total (venda)', chave: 'valorVenda', alinhamento: 'right' },
          ],
          linhas: produtos.map((p) => ({
            nome: p.nome,
            quantidade: `${p.quantidade} ${p.unidade}`,
            custoUnitario: `${p.precoCompra.toLocaleString('pt-AO')} Kz`,
            vendaUnitario: `${p.precoVenda.toLocaleString('pt-AO')} Kz`,
            valorCusto: `${(p.quantidade * p.precoCompra).toLocaleString('pt-AO')} Kz`,
            valorVenda: `${(p.quantidade * p.precoVenda).toLocaleString('pt-AO')} Kz`,
          })),
          resumo: [
            { rotulo: 'Valor ao custo', valor: produtos.reduce((s, p) => s + p.quantidade * p.precoCompra, 0).toLocaleString('pt-AO') + ' Kz' },
            { rotulo: 'Valor de venda', valor: produtos.reduce((s, p) => s + p.quantidade * p.precoVenda, 0).toLocaleString('pt-AO') + ' Kz' },
          ],
          nomeFicheiro: `Conexore_inventario_${new Date().toISOString().slice(0, 10)}`,
        })}>
          <FileDown className="h-4 w-4" /> Imprimir inventário
        </Button>
      </div>

      {carregando ? (
        <p className="text-sm text-gray-400 text-center py-8">A carregar...</p>
      ) : produtos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhum produto cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {produtos.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{p.nome}</p>
                  <p className="text-xs text-gray-500">
                    Stock: {p.quantidade} {p.unidade} · Custo unitário: {p.precoCompra.toLocaleString('pt-AO')} Kz · Último inventário: {ultimoInventario(p.id)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="Quantidade real contada"
                  value={quantidadesReais[p.id] || ''}
                  onChange={(e) =>
                    setQuantidadesReais((atual) => ({ ...atual, [p.id]: e.target.value }))
                  }
                  className="flex-1"
                />
                <Button
                  onClick={() => corrigirStock(p)}
                  aCarregar={aCorrigir === p.id}
                  variante="secundaria"
                >
                  <ClipboardCheck className="h-4 w-4" /> Corrigir stock
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
