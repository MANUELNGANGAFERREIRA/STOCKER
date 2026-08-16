'use client';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Produto } from '@/types';
import { gerarCodigoProduto } from '@/lib/utils';

export interface DadosFormularioProduto {
  nome: string;
  categoria: string;
  codigo: string;
  unidade: string;
  quantidade: number;
  quantidadeMinima: number;
  precoCompra: number;
  precoVenda: number;
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
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState('');

  async function lidarComSubmissao(e: FormEvent) {
    e.preventDefault();
    setErro('');

    if (!nome.trim() || !categoria.trim()) {
      setErro('Preencha o nome e a categoria do produto.');
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
      <div className="grid grid-cols-2 gap-3">
        <Input rotulo="Unidade" value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="unidade, kg, caixa..." />
        <Input
          rotulo="Quantidade mínima"
          type="number"
          min={0}
          value={quantidadeMinima}
          onChange={(e) => setQuantidadeMinima(e.target.value)}
        />
      </div>
      <Input
        rotulo="Quantidade em stock"
        type="number"
        min={0}
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          rotulo="Preço de compra (Kz)"
          type="number"
          min={0}
          step="0.01"
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
