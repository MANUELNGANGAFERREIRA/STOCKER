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
import type { Fornecedor, Entrada } from '@/types';
import { formatarData, formatarKz } from '@/lib/utils';

export default function PaginaFornecedores() {
  const { utilizadorFirebase } = useAuth();
  const { dados: fornecedores, carregando } = useColecao<Fornecedor>('fornecedores');
  const { dados: entradas } = useColecao<Entrada>('entradas', { ordenarPor: 'data', ordemDesc: true });
  const { mostrarToast } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [fornecedorHistorico, setFornecedorHistorico] = useState<Fornecedor | null>(null);
  const [nome, setNome] = useState('');
  const [contacto, setContacto] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [aCarregar, setACarregar] = useState(false);

  async function lidarComSubmissao(e: FormEvent) {
    e.preventDefault();
    if (!utilizadorFirebase || !nome.trim() || !contacto.trim()) return;

    setACarregar(true);
    try {
      await criarDocumento('fornecedores', {
        donoId: utilizadorFirebase.uid,
        nome: nome.trim(),
        contacto: contacto.trim(),
        email: email.trim() || null,
        endereco: endereco.trim() || null,
        criadoEm: Date.now(),
      });
      mostrarToast('Fornecedor adicionado!', 'sucesso');
      setNome('');
      setContacto('');
      setEmail('');
      setEndereco('');
      setModalAberto(false);
    } finally {
      setACarregar(false);
    }
  }

  async function excluir(id: string) {
    await apagarDocumento('fornecedores', id);
    mostrarToast('Fornecedor removido.', 'sucesso');
  }

  const historicoCompras = fornecedorHistorico
    ? entradas.filter((e) => e.fornecedorId === fornecedorHistorico.id)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-sm text-gray-500">Gira os seus fornecedores</p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4" /> Novo Fornecedor
        </Button>
      </div>

      {carregando ? (
        <p className="text-sm text-gray-400 text-center py-8">A carregar...</p>
      ) : fornecedores.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhum fornecedor cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {fornecedores.map((f) => (
            <Card key={f.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{f.nome}</p>
                <p className="text-xs text-gray-500">
                  {f.contacto}
                  {f.email ? ` · ${f.email}` : ''}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setFornecedorHistorico(f)}
                  className="p-2 text-primary hover:bg-primary-50 rounded-lg"
                  aria-label="Ver histórico"
                >
                  <History className="h-4 w-4" />
                </button>
                <button
                  onClick={() => excluir(f.id)}
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

      <Modal aberto={modalAberto} aoFechar={() => setModalAberto(false)} titulo="Novo Fornecedor">
        <form onSubmit={lidarComSubmissao} className="space-y-3">
          <Input rotulo="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input rotulo="Contacto (telefone)" required value={contacto} onChange={(e) => setContacto(e.target.value)} />
          <Input rotulo="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input rotulo="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
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
        aberto={!!fornecedorHistorico}
        aoFechar={() => setFornecedorHistorico(null)}
        titulo={`Histórico de compras — ${fornecedorHistorico?.nome || ''}`}
      >
        {historicoCompras.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma compra registada para este fornecedor.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {historicoCompras.map((e) => (
              <li key={e.id} className="py-2 text-sm flex justify-between">
                <span>
                  {e.produtoNome} ({e.quantidade})
                </span>
                <span className="text-gray-500">
                  {formatarData(e.data)} · {formatarKz(e.precoUnitario * e.quantidade)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
