'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useColecao, criarDocumento, atualizarDocumento } from '@/hooks/useFirestore';
import type { Produto, Entrada, Fornecedor } from '@/types';
import { formatarData, formatarKz, dataInputParaTimestamp, timestampParaDataInput } from '@/lib/utils';

export default function PaginaEntradas() {
  const { utilizadorFirebase } = useAuth();
  const { dados: produtos } = useColecao<Produto>('produtos');
  const { dados: fornecedores } = useColecao<Fornecedor>('fornecedores');
  const { dados: entradas, carregando } = useColecao<Entrada>('entradas', {
    ordenarPor: 'data',
    ordemDesc: true,
  });
  const { mostrarToast } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [tipoQuantidade, setTipoQuantidade] = useState<'unidade' | 'caixa'>('unidade');
  const [precoUnitario, setPrecoUnitario] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [data, setData] = useState(timestampParaDataInput(Date.now()));
  const [observacao, setObservacao] = useState('');
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState('');

  const entradasFiltradas = useMemo(() => {
    return entradas.filter((e) => {
      if (filtroDataInicio && e.data < dataInputParaTimestamp(filtroDataInicio)) return false;
      if (filtroDataFim && e.data > dataInputParaTimestamp(filtroDataFim) + 86400000) return false;
      return true;
    });
  }, [entradas, filtroDataInicio, filtroDataFim]);

  function limparFormulario() {
    setProdutoId('');
    setQuantidade('');
    setTipoQuantidade('unidade');
    setPrecoUnitario('');
    setFornecedorId('');
    setData(timestampParaDataInput(Date.now()));
    setObservacao('');
    setErro('');
  }

  async function lidarComSubmissao(e: FormEvent) {
    e.preventDefault();
    setErro('');

    const produto = produtos.find((p) => p.id === produtoId);
    const qtd = Number(quantidade);

    if (!produto) {
      setErro('Selecione um produto.');
      return;
    }
    if (!Number.isFinite(qtd) || qtd <= 0) {
      setErro('Introduza uma quantidade válida.');
      return;
    }
    if (tipoQuantidade === 'caixa' && !Number.isInteger(qtd)) {
      setErro('A quantidade de caixas deve ser um número inteiro.');
      return;
    }
    const precoInserido = Number(precoUnitario);
    if (!precoUnitario.trim() || !Number.isFinite(precoInserido) || precoInserido <= 0) {
      setErro('Introduza o preço de compra por unidade ou por caixa. O valor deve ser superior a zero.');
      return;
    }
    if (tipoQuantidade === 'caixa' && (!produto.unidadesPorCaixa || produto.unidadesPorCaixa < 1)) {
      setErro('Este produto ainda não tem a quantidade de unidades por caixa definida. Edite o produto primeiro.');
      return;
    }
    if (!utilizadorFirebase) return;

    setACarregar(true);
    try {
      const fornecedor = fornecedores.find((f) => f.id === fornecedorId);
      const fatorConversao = tipoQuantidade === 'caixa' ? (produto.unidadesPorCaixa || 1) : 1;
      const quantidadeBase = qtd * fatorConversao;
      const precoInformado = Number(precoUnitario);
      const custoEntrada = precoInformado / fatorConversao;
      const quantidadeAnterior = produto.quantidade;
      const custoMedioAnterior = produto.precoCompra;
      const novoCustoMedio = quantidadeAnterior + quantidadeBase > 0
        ? ((quantidadeAnterior * custoMedioAnterior) + (quantidadeBase * custoEntrada)) / (quantidadeAnterior + quantidadeBase)
        : custoEntrada;

      // Regista a entrada
      await criarDocumento('entradas', {
        donoId: utilizadorFirebase.uid,
        produtoId: produto.id,
        produtoNome: produto.nome,
        quantidade: quantidadeBase,
        unidadeBase: produto.unidade,
        precoUnitario: custoEntrada,
        ...(tipoQuantidade === 'caixa' ? {
          quantidadeEmbalagens: qtd,
          unidadeEmbalagem: 'caixa',
          ...(precoInformado > 0 ? { precoEmbalagem: precoInformado } : {}),
        } : {}),
        custoMedioAposEntrada: novoCustoMedio,
        valorTotal: quantidadeBase * custoEntrada,
        fornecedorId: fornecedor?.id || null,
        fornecedorNome: fornecedor?.nome || null,
        data: dataInputParaTimestamp(data),
        observacao: observacao || null,
        registadoPor: utilizadorFirebase.uid,
        criadoEm: Date.now(),
      });

      // Atualiza automaticamente o stock do produto (requisito obrigatório)
      await atualizarDocumento('produtos', produto.id, {
        quantidade: produto.quantidade + quantidadeBase,
        precoCompra: novoCustoMedio,
        ...(produto.margemLucro != null
          ? { precoVenda: novoCustoMedio * (1 + produto.margemLucro / 100) }
          : {}),
        ...(fornecedor ? { fornecedorId: fornecedor.id, fornecedorNome: fornecedor.nome } : {}),
        atualizadoEm: Date.now(),
      });

      mostrarToast('Entrada registada e stock atualizado!', 'sucesso');
      limparFormulario();
      setModalAberto(false);
    } catch (err) {
      setErro('Não foi possível registar a entrada. Tente novamente.');
    } finally {
      setACarregar(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Entradas</h1>
          <p className="text-sm text-gray-500">Registe a chegada de mercadoria</p>
        </div>
        <Button onClick={() => setModalAberto(true)} disabled={produtos.length === 0}>
          <Plus className="h-4 w-4" /> Registar Entrada
        </Button>
      </div>

      {produtos.length === 0 && (
        <Card>
          <p className="text-sm text-gray-500">
            Ainda não tem produtos cadastrados. Vá a <strong>Produtos</strong> para criar o seu primeiro produto.
          </p>
        </Card>
      )}

      <Card className="grid grid-cols-2 gap-3">
        <Input
          rotulo="De"
          type="date"
          value={filtroDataInicio}
          onChange={(e) => setFiltroDataInicio(e.target.value)}
        />
        <Input rotulo="Até" type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} />
      </Card>

      {carregando ? (
        <p className="text-sm text-gray-400 text-center py-8">A carregar...</p>
      ) : entradasFiltradas.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhuma entrada registada.</p>
      ) : (
        <div className="space-y-2">
          {entradasFiltradas.map((ent) => (
            <Card key={ent.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{ent.produtoNome}</p>
                <p className="text-xs text-gray-500">
                  {formatarData(ent.data)}
                  {ent.fornecedorNome ? ` · ${ent.fornecedorNome}` : ''}
                  {ent.observacao ? ` · ${ent.observacao}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-ok">+{ent.quantidade} {ent.unidadeBase || ''} {ent.quantidadeEmbalagens ? `(${ent.quantidadeEmbalagens} caixas)` : ''}</p>
                <p className="text-xs text-gray-500">{formatarKz(ent.precoUnitario)}/un · Total {formatarKz(ent.valorTotal ?? ent.precoUnitario * ent.quantidade)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        aberto={modalAberto}
        aoFechar={() => {
          setModalAberto(false);
          limparFormulario();
        }}
        titulo="Registar Entrada"
      >
        <form onSubmit={lidarComSubmissao} className="space-y-3">
          <Select rotulo="Produto" required value={produtoId} onChange={(e) => {
            const produtoEscolhido = produtos.find((p) => p.id === e.target.value);
            setProdutoId(e.target.value);
            setTipoQuantidade(produtoEscolhido?.unidadesPorCaixa ? 'caixa' : 'unidade');
          }}>
            <option value="">Selecione um produto</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} (stock atual: {p.quantidade})
              </option>
            ))}
          </Select>

          {(() => {
            const produtoSelecionado = produtos.find((p) => p.id === produtoId);
            if (!produtoSelecionado?.unidadesPorCaixa) return null;
            return (
              <Select rotulo="Tipo de quantidade recebida" value={tipoQuantidade} onChange={(e) => setTipoQuantidade(e.target.value as 'unidade' | 'caixa')}>
                <option value="unidade">Unidades avulsas ({produtoSelecionado.unidade})</option>
                <option value="caixa">Caixas ({produtoSelecionado.unidadesPorCaixa} {produtoSelecionado.unidade} por caixa)</option>
              </Select>
            );
          })()}

          <div className="grid grid-cols-2 gap-3">
            <Input
              rotulo={tipoQuantidade === 'caixa' ? 'Quantidade de caixas' : `Quantidade (${produtos.find((p) => p.id === produtoId)?.unidade || 'unidades'})`}
              type="number"
              min={tipoQuantidade === 'caixa' ? 1 : 0.01}
              step={tipoQuantidade === 'caixa' ? 1 : 'any'}
              required
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
            <Input
              rotulo={tipoQuantidade === 'caixa' ? 'Preço por caixa (Kz)' : 'Preço por unidade (Kz)'}
              type="number"
              min={0.01}
              step="any"
              required
              value={precoUnitario}
              onChange={(e) => setPrecoUnitario(e.target.value)}
              placeholder="Obrigatório"
            />
          </div>

          <Select rotulo="Fornecedor (opcional)" value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
            <option value="">Nenhum</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Select>

          <Input rotulo="Data" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
          <Input
            rotulo="Observação"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Opcional"
          />

          {erro && <p className="text-sm text-risco">{erro}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="button" variante="fantasma" className="flex-1" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" aCarregar={aCarregar}>
              Registar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
