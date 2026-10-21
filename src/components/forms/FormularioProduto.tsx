'use client';

import { useState, type FormEvent } from 'react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Produto, UnidadePersonalizada, Fornecedor } from '@/types';
import { gerarCodigoProduto } from '@/lib/utils';
import { criarDocumento, useColecao } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Plus } from 'lucide-react';

export interface DadosFormularioProduto {
  nome: string;
  categoria: string;
  codigo: string;
  unidade: string;
  quantidade: number;
  quantidadeMinima: number;
  precoCompra: number;
  precoVenda: number;
  fornecedorId: string;
  fornecedorNome: string;
  unidadesPorCaixa?: number | null;
}

interface Props {
  produtoInicial?: Produto | null;
  aoSubmeter: (dados: DadosFormularioProduto) => Promise<void>;
  aoCancelar: () => void;
}

export function FormularioProduto({ produtoInicial, aoSubmeter, aoCancelar }: Props) {
  const [nome, setNome] = useState(produtoInicial?.nome || '');
  const [categoria, setCategoria] = useState(produtoInicial?.categoria || '');
  const [codigo, setCodigo] = useState(produtoInicial?.codigo || gerarCodigoProduto());
  const [unidade, setUnidade] = useState(produtoInicial?.unidade || 'unidade');
  const [quantidade, setQuantidade] = useState(produtoInicial?.quantidade?.toString() || '0');
  const [quantidadeMinima, setQuantidadeMinima] = useState(produtoInicial?.quantidadeMinima?.toString() || '5');
  const [precoCompra, setPrecoCompra] = useState(produtoInicial?.precoCompra?.toString() || '');
  const [precoVenda, setPrecoVenda] = useState(produtoInicial?.precoVenda?.toString() || '');
  const [fornecedorId, setFornecedorId] = useState(produtoInicial?.fornecedorId || '');
  const [unidadesPorCaixa, setUnidadesPorCaixa] = useState(produtoInicial?.unidadesPorCaixa?.toString() || '');
  const [novaUnidade, setNovaUnidade] = useState('');
  const [aAdicionarUnidade, setAAdicionarUnidade] = useState(false);
  const { utilizadorFirebase } = useAuth();
  const { dados: fornecedores } = useColecao<Fornecedor>('fornecedores');
  const { dados: unidadesPersonalizadas } = useColecao<UnidadePersonalizada>('unidades');
  const unidadesBase = ['unidade', 'kg', 'g', 'litro', 'ml', 'metro', 'm²', 'par', 'dúzia'];
  const unidades = Array.from(new Set([...unidadesBase, produtoInicial?.unidade, ...unidadesPersonalizadas.map((u) => u.nome)].filter(Boolean) as string[])).sort();
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState('');

  async function adicionarUnidade() {
    const nome = novaUnidade.trim();
    if (!nome || !utilizadorFirebase) return;
    if (unidades.some((unidadeExistente) => unidadeExistente.toLocaleLowerCase() === nome.toLocaleLowerCase())) {
      setErro('Esta unidade já existe na lista.');
      return;
    }
    setAAdicionarUnidade(true);
    try {
      await criarDocumento('unidades', { donoId: utilizadorFirebase.uid, nome, criadoEm: Date.now() });
      setUnidade(nome);
      setNovaUnidade('');
      setErro('');
    } catch {
      setErro('Não foi possível adicionar a unidade. Verifique a ligação.');
    } finally {
      setAAdicionarUnidade(false);
    }
  }

  async function lidarComSubmissao(e: FormEvent) {
    e.preventDefault();
    setErro('');

    if (!nome.trim() || !categoria.trim()) {
      setErro('Preencha o nome e a categoria do produto.');
      return;
    }
    if (unidadesPorCaixa && (!Number.isInteger(Number(unidadesPorCaixa)) || Number(unidadesPorCaixa) < 1)) {
      setErro('A quantidade por caixa deve ser um número inteiro igual ou superior a 1.');
      return;
    }
    if (Number(quantidade) > 0 && (!precoCompra.trim() || Number(precoCompra) <= 0)) {
      setErro('Indique um preço de compra superior a zero para o stock inicial.');
      return;
    }

    setACarregar(true);
    try {
      await aoSubmeter({
        nome: nome.trim(),
        categoria: categoria.trim(),
        codigo: codigo.trim(),
        unidade,
        quantidade: Number(quantidade) || 0,
        quantidadeMinima: Number(quantidadeMinima) || 0,
        precoCompra: Number(precoCompra) || 0,
        precoVenda: Number(precoVenda) || 0,
        fornecedorId,
        fornecedorNome: fornecedores.find((f) => f.id === fornecedorId)?.nome || '',
        unidadesPorCaixa: unidadesPorCaixa ? Number(unidadesPorCaixa) : null,
      });
    } catch (err) {
      setErro('Não foi possível guardar o produto. Tente novamente.');
    } finally {
      setACarregar(false);
    }
  }

  return (
    <form onSubmit={lidarComSubmissao} className="space-y-3">
      <Input rotulo="Nome do produto" required value={nome} onChange={(e) => setNome(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input rotulo="Categoria" required value={categoria} onChange={(e) => setCategoria(e.target.value)} />
        <Input rotulo="Código" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
      </div>
      <Select rotulo="Fornecedor principal (opcional)" value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
        <option value="">Sem fornecedor associado</option>
        {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Select rotulo="Unidade de stock e venda" required value={unidade} onChange={(e) => setUnidade(e.target.value)}>
          {unidades.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
        </Select>
        <Input
          rotulo="Quantidade mínima"
          type="number"
          min={0}
          required
          value={quantidadeMinima}
          onChange={(e) => setQuantidadeMinima(e.target.value)}
        />
      </div>
      <div className="flex items-end gap-2">
        <Input rotulo="Adicionar outra unidade" value={novaUnidade} maxLength={24} onChange={(e) => setNovaUnidade(e.target.value)} placeholder="Ex.: saco" />
        <Button type="button" variante="secundaria" disabled={!novaUnidade.trim() || aAdicionarUnidade} aCarregar={aAdicionarUnidade} onClick={adicionarUnidade} aria-label="Adicionar unidade">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
        <p className="text-sm font-medium text-gray-800">Compra em caixa (opcional)</p>
        <p className="mb-2 text-xs text-gray-500">Define quantas unidades de stock existem numa caixa. Nas entradas poderás registar caixas completas ou unidades avulsas.</p>
        <Input rotulo={`Unidades de ${unidade || 'stock'} por caixa`} type="number" min={1} step={1} value={unidadesPorCaixa} onChange={(e) => setUnidadesPorCaixa(e.target.value)} placeholder="Ex.: 12" />
      </div>
      <Input
        rotulo="Quantidade em stock"
        type="number"
        min={0}
        step="any"
        required
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          rotulo="Preço de compra (Kz)"
          type="number"
          min={0.01}
          step="any"
          required={Number(quantidade) > 0}
          value={precoCompra}
          onChange={(e) => setPrecoCompra(e.target.value)}
        />
        <Input
          rotulo="Preço de venda (Kz)"
          type="number"
          min={0}
          step="0.01"
          value={precoVenda}
          onChange={(e) => setPrecoVenda(e.target.value)}
        />
      </div>

      {erro && <p className="text-sm text-risco">{erro}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="button" variante="fantasma" className="flex-1" onClick={aoCancelar}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" aCarregar={aCarregar}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
