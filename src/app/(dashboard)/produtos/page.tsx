'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { BadgeStatus } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useColecao, criarDocumento, atualizarDocumento, apagarDocumento } from '@/hooks/useFirestore';
import { calcularStatusProduto, type Produto, type StatusProduto } from '@/types';
import { formatarKz } from '@/lib/utils';
import { FormularioProduto, type DadosFormularioProduto } from '@/components/forms/FormularioProduto';

export default function PaginaProdutos() {
  const { utilizadorFirebase, ehAdmin } = useAuth();
  const { dados: produtos, carregando } = useColecao<Produto>('produtos');
  const { mostrarToast } = useToast();

  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusProduto>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<Produto | null>(null);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);

  const categorias = useMemo(
    () => Array.from(new Set(produtos.map((p) => p.categoria))).sort(),
    [produtos]
  );

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const status = calcularStatusProduto(p);
      const correspondeBusca =
        !busca ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busca.toLowerCase());
      const correspondeCategoria = filtroCategoria === 'todas' || p.categoria === filtroCategoria;
      const correspondeStatus = filtroStatus === 'todos' || status === filtroStatus;
      return correspondeBusca && correspondeCategoria && correspondeStatus;
    });
  }, [produtos, busca, filtroCategoria, filtroStatus]);

  function abrirModalNovo() {
    setProdutoEmEdicao(null);
    setModalAberto(true);
  }

  function abrirModalEdicao(p: Produto) {
    setProdutoEmEdicao(p);
    setModalAberto(true);
  }

  async function lidarComSubmissao(dados: DadosFormularioProduto) {
    if (!utilizadorFirebase) return;

    if (produtoEmEdicao) {
      await atualizarDocumento('produtos', produtoEmEdicao.id, {
        ...dados,
        atualizadoEm: Date.now(),
      });
      mostrarToast('Produto atualizado com sucesso!', 'sucesso');
    } else {
      await criarDocumento('produtos', {
        ...dados,
        donoId: utilizadorFirebase.uid,
        criadoEm: Date.now(),
        atualizadoEm: Date.now(),
      });
      mostrarToast('Produto criado com sucesso!', 'sucesso');
    }
    setModalAberto(false);
  }

  async function confirmarExclusao() {
    if (!produtoParaExcluir) return;
    await apagarDocumento('produtos', produtoParaExcluir.id);
    mostrarToast('Produto excluído.', 'sucesso');
    setProdutoParaExcluir(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500">Consulte e gira o seu catálogo de produtos</p>
        </div>
        <Button onClick={abrirModalNovo}>
          <Plus className="h-4 w-4" /> Novo Produto
        </Button>
      </div>

      <Card className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
            placeholder="Procurar por nome ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="todas">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as any)}>
            <option value="todos">Todos os status</option>
            <option value="ok">Em stock</option>
            <option value="critico">Crítico</option>
            <option value="sem_stock">Sem stock</option>
          </Select>
        </div>
      </Card>

      {carregando ? (
        <p className="text-sm text-gray-400 text-center py-8">A carregar produtos...</p>
      ) : produtosFiltrados.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhum produto encontrado.</p>
      ) : (
        <div className="space-y-2">
          {produtosFiltrados.map((p) => {
            const status = calcularStatusProduto(p);
            return (
              <Card key={p.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 truncate">{p.nome}</p>
                    <BadgeStatus status={status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.categoria} · Cód: {p.codigo} · {p.quantidade} {p.unidade}
                  </p>
                  <p className="text-xs text-gray-500">Venda: {formatarKz(p.precoVenda)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => abrirModalEdicao(p)}
                    className="p-2 text-primary hover:bg-primary-50 rounded-lg"
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {ehAdmin && (
                    <button
                      onClick={() => setProdutoParaExcluir(p)}
                      className="p-2 text-risco hover:bg-red-50 rounded-lg"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        titulo={produtoEmEdicao ? 'Editar Produto' : 'Novo Produto'}
      >
        <FormularioProduto
          produtoInicial={produtoEmEdicao}
          aoSubmeter={lidarComSubmissao}
          aoCancelar={() => setModalAberto(false)}
        />
      </Modal>

      <Modal
        aberto={!!produtoParaExcluir}
        aoFechar={() => setProdutoParaExcluir(null)}
        titulo="Confirmar exclusão"
      >
        <p className="text-sm text-gray-600 mb-4">
          Tem certeza que deseja excluir o produto <strong>{produtoParaExcluir?.nome}</strong>? Esta ação não
          pode ser desfeita.
        </p>
        <div className="flex gap-2">
          <Button variante="fantasma" className="flex-1" onClick={() => setProdutoParaExcluir(null)}>
            Cancelar
          </Button>
          <Button variante="perigo" className="flex-1" onClick={confirmarExclusao}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
