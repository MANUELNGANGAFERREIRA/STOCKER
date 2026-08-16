'use client';

import { useState, type FormEvent } from 'react';
import { Plus, Trash2, History } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useColecao, criarDocumento, apagarDocumento } from '@/hooks/useFirestore';
import type { Cliente, Saida } from '@/types';
import { formatarData, formatarKz } from '@/lib/utils';

export default function PaginaClientes() {
  const { utilizadorFirebase } = useAuth();
  const { dados: clientes, carregando } = useColecao<Cliente>('clientes');
  const { dados: saidas } = useColecao<Saida>('saidas', { ordenarPor: 'data', ordemDesc: true });
  const { mostrarToast } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [clienteHistorico, setClienteHistorico] = useState<Cliente | null>(null);
  const [nome, setNome] = useState('');
  const [contacto, setContacto] = useState('');
  const [email, setEmail] = useState('');
  const [aCarregar, setACarregar] = useState(false);

  async function lidarComSubmissao(e: FormEvent) {
    e.preventDefault();
    if (!utilizadorFirebase || !nome.trim() || !contacto.trim()) return;

    setACarregar(true);
    try {
      await criarDocumento('clientes', {
        donoId: utilizadorFirebase.uid,
        nome: nome.trim(),
        contacto: contacto.trim(),
        email: email.trim() || null,
        criadoEm: Date.now(),
      });
      mostrarToast('Cliente adicionado!', 'sucesso');
      setNome('');
      setContacto('');
      setEmail('');
      setModalAberto(false);
    } finally {
      setACarregar(false);
    }
  }

  async function excluir(id: string) {
    await apagarDocumento('clientes', id);
    mostrarToast('Cliente removido.', 'sucesso');
  }

  const historicoVendas = clienteHistorico ? saidas.filter((s) => s.clienteId === clienteHistorico.id) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">Gira os seus clientes</p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      {carregando ? (
        <p className="text-sm text-gray-400 text-center py-8">A carregar...</p>
      ) : clientes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhum cliente cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {clientes.map((c) => (
            <Card key={c.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{c.nome}</p>
                <p className="text-xs text-gray-500">
                  {c.contacto}
                  {c.email ? ` · ${c.email}` : ''}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setClienteHistorico(c)}
                  className="p-2 text-primary hover:bg-primary-50 rounded-lg"
                  aria-label="Ver histórico"
                >
                  <History className="h-4 w-4" />
                </button>
                <button
                  onClick={() => excluir(c.id)}
                  className="p-2 text-risco hover:bg-red-50 rounded-lg"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal aberto={modalAberto} aoFechar={() => setModalAberto(false)} titulo="Novo Cliente">
        <form onSubmit={lidarComSubmissao} className="space-y-3">
          <Input rotulo="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input rotulo="Contacto (telefone)" required value={contacto} onChange={(e) => setContacto(e.target.value)} />
          <Input rotulo="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="flex gap-2 pt-2">
            <Button type="button" variante="fantasma" className="flex-1" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" aCarregar={aCarregar}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        aberto={!!clienteHistorico}
        aoFechar={() => setClienteHistorico(null)}
        titulo={`Histórico de compras — ${clienteHistorico?.nome || ''}`}
      >
        {historicoVendas.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma venda registada para este cliente.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {historicoVendas.map((s) => (
              <li key={s.id} className="py-2 text-sm flex justify-between">
                <span>
                  {s.produtoNome} ({s.quantidade})
                </span>
                <span className="text-gray-500">
                  {formatarData(s.data)} · {formatarKz(s.precoUnitario * s.quantidade)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
