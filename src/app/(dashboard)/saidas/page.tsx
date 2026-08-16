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
import type { Produto, Saida, Cliente } from '@/types';
import { formatarData, formatarKz, dataInputParaTimestamp, timestampParaDataInput } from '@/lib/utils';

export default function PaginaSaidas() {
  const { utilizadorFirebase } = useAuth();
  const { dados: produtos } = useColecao<Produto>('produtos');
  const { dados: clientes } = useColecao<Cliente>('clientes');
  const { dados: saidas, carregando } = useColecao<Saida>('saidas', { ordenarPor: 'data', ordemDesc: true });
  const { mostrarToast } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [data, setData] = useState(timestampParaDataInput(Date.now()));
  const [observacao, setObservacao] = useState('');
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState('');

  const saidasFiltradas = useMemo(() => {
    return saidas.filter((s) => {
      if (filtroDataInicio && s.data < dataInputParaTimestamp(filtroDataInicio)) return false;
      if (filtroDataFim && s.data > dataInputParaTimestamp(filtroDataFim) + 86400000) return false;
      return true;
    });
  }, [saidas, filtroDataInicio, filtroDataFim]);

  function limparFormulario() {
    setProdutoId('');
    setQuantidade('');
    setClienteId('');
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
    if (!qtd || qtd <= 0) {
      setErro('Introduza uma quantidade válida.');
      return;
    }
    if (qtd > produto.quantidade) {
      setErro(`Stock insuficiente. Disponível: ${produto.quantidade} ${produto.unidade}.`);
      return;
    }
    if (!utilizadorFirebase) return;

    setACarregar(true);
    try {
      const cliente = clientes.find((c) => c.id === clienteId);

      await criarDocumento('saidas', {
        donoId: utilizadorFirebase.uid,
        produtoId: produto.id,
        produtoNome: produto.nome,
        quantidade: qtd,
        precoUnitario: produto.precoVenda,
        clienteId: cliente?.id || null,
        clienteNome: cliente?.nome || null,
        data: dataInputParaTimestamp(data),
        observacao: observacao || null,
        registadoPor: utilizadorFirebase.uid,
        criadoEm: Date.now(),
      });

      // Atualiza automaticamente o stock do produto (requisito obrigatório)
      await atualizarDocumento('produtos', produto.id, {
        quantidade: produto.quantidade - qtd,
        atualizadoEm: Date.now(),
      });

      mostrarToast('Saída registada e stock atualizado!', 'sucesso');
      limparFormulario();
      setModalAberto(false);
    } catch (err) {
      setErro('Não foi possível registar a saída. Tente novamente.');
    } finally {
      setACarregar(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Saídas</h1>
          <p className="text-sm text-gray-500">Registe a venda ou saída de mercadoria</p>
        </div>
        <Button onClick={() => setModalAberto(true)} disabled={produtos.length === 0}>
          <Plus className="h-4 w-4" /> Registar Saída
        </Button>
      </div>

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
      ) : saidasFiltradas.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhuma saída registada.</p>
      ) : (
        <div className="space-y-2">
          {saidasFiltradas.map((s) => (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{s.produtoNome}</p>
                <p className="text-xs text-gray-500">
                  {formatarData(s.data)}
                  {s.clienteNome ? ` · ${s.clienteNome}` : ''}
                  {s.observacao ? ` · ${s.observacao}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-risco">-{s.quantidade}</p>
                <p className="text-xs text-gray-500">{formatarKz(s.precoUnitario)}/un</p>
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
        titulo="Registar Saída"
      >
        <form onSubmit={lidarComSubmissao} className="space-y-3">
          <Select rotulo="Produto" required value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
            <option value="">Selecione um produto</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} (stock atual: {p.quantidade})
              </option>
            ))}
          </Select>

          <Input
            rotulo="Quantidade"
            type="number"
            min={1}
            required
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />

          <Select rotulo="Cliente (opcional)" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Nenhum</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
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
