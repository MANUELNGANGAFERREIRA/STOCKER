'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldOff, Trash2, Eye, UserCog, Loader2, RotateCcw, ShieldMinus } from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  where,
  limit,
} from 'firebase/firestore';
import { Card, CardTitulo, CardValor } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseDb } from '@/lib/firebase/client';
import type { Utilizador } from '@/types';

// Este painel fala diretamente com o Firestore — não há Cloud Functions
// neste projeto. Todas as ações abaixo são permitidas pelas Firestore
// Security Rules apenas a quem tiver papel="admin" (ver firestore.rules).
// "Excluir" é sempre um soft-delete: nunca apagamos a conta do Firebase
// Authentication nem os dados do utilizador — só marcamos
// ativo=false e excluido=true, o que bloqueia o acesso imediatamente
// (ver useAuth.tsx e as regras). Isto mantém tudo a funcionar sem
// servidor e sem depender de rede.

export default function PaginaAdmin() {
  const { ehAdmin, carregando: carregandoAuth, utilizadorFirebase } = useAuth();
  const router = useRouter();
  const { mostrarToast } = useToast();

  const [usuarios, setUsuarios] = useState<Utilizador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [acaoEmCurso, setAcaoEmCurso] = useState<string | null>(null);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<Utilizador | null>(null);
  const [usuarioParaAlterarPapel, setUsuarioParaAlterarPapel] = useState<Utilizador | null>(null);
  const [usuarioDetalhe, setUsuarioDetalhe] = useState<{
    usuario: Utilizador;
    totalProdutos: number;
    totalEntradas: number;
    totalSaidas: number;
  } | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  useEffect(() => {
    if (!carregandoAuth && !ehAdmin) {
      router.replace('/dashboard/');
    }
  }, [carregandoAuth, ehAdmin, router]);

  // Escuta em tempo real a coleção de utilizadores (permitido pelas
  // regras porque quem lê é admin).
  useEffect(() => {
    if (!ehAdmin) return;
    setCarregando(true);
    const db = getFirebaseDb();
    const q = query(collection(db, 'utilizadores'), orderBy('criadoEm', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setUsuarios(snap.docs.map((d) => d.data() as Utilizador));
        setCarregando(false);
      },
      () => setCarregando(false)
    );
    return () => unsub();
  }, [ehAdmin]);

  async function confirmarAlteracaoPapel() {
    const u = usuarioParaAlterarPapel;
    if (!u) return;
    const novoPapel = u.papel === 'admin' ? 'utilizador' : 'admin';
    const adminsAtivos = usuarios.filter((usuario) => usuario.ativo && usuario.papel === 'admin').length;
    if (novoPapel === 'utilizador' && u.ativo && adminsAtivos <= 1) {
      mostrarToast('Não é possível rebaixar o último administrador ativo.', 'erro');
      return;
    }
    setAcaoEmCurso(u.uid);
    try {
      await updateDoc(doc(getFirebaseDb(), 'utilizadores', u.uid), { papel: novoPapel });
      mostrarToast(novoPapel === 'admin' ? 'Utilizador promovido a administrador.' : 'Administrador alterado para utilizador.', 'sucesso');
      setUsuarioParaAlterarPapel(null);
    } catch {
      mostrarToast('Não foi possível alterar o papel. Verifique a ligação e as permissões.', 'erro');
    } finally {
      setAcaoEmCurso(null);
    }
  }

  async function alternarAtivo(u: Utilizador) {
    if (u.ativo && u.papel === 'admin' && usuarios.filter((usuario) => usuario.ativo && usuario.papel === 'admin').length <= 1) {
      mostrarToast('Não é possível desativar o último administrador ativo.', 'erro');
      return;
    }
    setAcaoEmCurso(u.uid);
    try {
      await updateDoc(doc(getFirebaseDb(), 'utilizadores', u.uid), { ativo: !u.ativo });
      mostrarToast(u.ativo ? 'Utilizador desativado.' : 'Utilizador reativado.', 'sucesso');
    } catch {
      mostrarToast('Não foi possível alterar o utilizador. Verifique a sua ligação.', 'erro');
    } finally {
      setAcaoEmCurso(null);
    }
  }

  // Soft-delete: nunca apaga a conta real, só marca como excluída.
  async function excluirUsuario() {
    if (!usuarioParaExcluir) return;
    if (usuarioParaExcluir.ativo && usuarioParaExcluir.papel === 'admin' && usuarios.filter((u) => u.ativo && u.papel === 'admin').length <= 1) {
      mostrarToast('Não é possível excluir o último administrador ativo.', 'erro');
      return;
    }
    setAcaoEmCurso(usuarioParaExcluir.uid);
    try {
      await updateDoc(doc(getFirebaseDb(), 'utilizadores', usuarioParaExcluir.uid), {
        ativo: false,
        excluido: true,
        excluidoEm: Date.now(),
      });
      mostrarToast('Utilizador excluído. Os dados dele foram mantidos, mas o acesso está bloqueado.', 'sucesso');
      setUsuarioParaExcluir(null);
    } catch {
      mostrarToast('Não foi possível excluir o utilizador. Verifique a sua ligação.', 'erro');
    } finally {
      setAcaoEmCurso(null);
    }
  }

  async function verDetalhe(uid: string) {
    setCarregandoDetalhe(true);
    try {
      const db = getFirebaseDb();
      const [usuarioSnap, produtosSnap, entradasSnap, saidasSnap] = await Promise.all([
        getDoc(doc(db, 'utilizadores', uid)),
        getDocs(query(collection(db, 'produtos'), where('donoId', '==', uid))),
        getDocs(query(collection(db, 'entradas'), where('donoId', '==', uid), limit(500))),
        getDocs(query(collection(db, 'saidas'), where('donoId', '==', uid), limit(500))),
      ]);

      if (!usuarioSnap.exists()) {
        mostrarToast('Utilizador não encontrado.', 'erro');
        return;
      }

      setUsuarioDetalhe({
        usuario: usuarioSnap.data() as Utilizador,
        totalProdutos: produtosSnap.size,
        totalEntradas: entradasSnap.size,
        totalSaidas: saidasSnap.size,
      });
    } catch {
      mostrarToast('Não foi possível carregar os dados do utilizador. Verifique a sua ligação.', 'erro');
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  if (carregandoAuth || !ehAdmin) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalAtivos = usuarios.filter((u) => u.ativo).length;
  const totalAdmins = usuarios.filter((u) => u.papel === 'admin' && u.ativo).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-secondary" /> Painel Administrativo
        </h1>
        <p className="text-sm text-gray-500">Gira utilizadores, permissões e estado de acesso ao sistema.</p>
      </div>

      <Card className="border-primary-100 bg-primary-50">
        <p className="text-sm font-semibold text-gray-800">Controlo de acesso</p>
        <p className="mt-1 text-sm text-gray-600">Administradores podem consultar os dados do sistema e gerir utilizadores. Utilizadores têm acesso às áreas operacionais. Deve existir pelo menos um administrador ativo.</p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardTitulo>Total</CardTitulo>
          <CardValor>{usuarios.length}</CardValor>
        </Card>
        <Card>
          <CardTitulo>Ativos</CardTitulo>
          <CardValor className="text-ok">{totalAtivos}</CardValor>
        </Card>
        <Card>
          <CardTitulo>Admins</CardTitulo>
          <CardValor className="text-secondary-700">{totalAdmins}</CardValor>
        </Card>
      </div>

      {carregando ? (
        <p className="text-sm text-gray-400 text-center py-8">A carregar utilizadores...</p>
      ) : (
        <div className="space-y-2">
          {usuarios.map((u) => {
            const ehEuMesmo = u.uid === utilizadorFirebase?.uid;
            return (
              <Card key={u.uid} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{u.nome}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  <p className="text-xs mt-0.5">
                    <span className={u.papel === 'admin' ? 'text-secondary-700 font-semibold' : 'text-gray-400'}>
                      {u.papel === 'admin' ? 'Administrador' : 'Utilizador'}
                    </span>
                    {' · '}
                    <span className={u.ativo ? 'text-ok' : 'text-risco'}>
                      {u.excluido ? 'Excluído' : u.ativo ? 'Ativo' : 'Desativado'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => verDetalhe(u.uid)}
                    className="p-2 text-primary hover:bg-primary-50 rounded-lg"
                    aria-label="Ver dados"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {!ehEuMesmo && (
                    <>
                      <button
                        onClick={() => setUsuarioParaAlterarPapel(u)}
                        disabled={acaoEmCurso === u.uid || (u.ativo && u.papel === 'admin' && totalAdmins <= 1)}
                        className="p-2 text-secondary-700 hover:bg-amber-50 rounded-lg disabled:opacity-40"
                        aria-label={u.papel === 'admin' ? 'Tornar utilizador' : 'Tornar administrador'}
                        title={u.papel === 'admin' ? (totalAdmins <= 1 && u.ativo ? 'O sistema precisa de pelo menos um administrador ativo' : 'Tornar utilizador') : 'Tornar administrador'}
                      >
                        {u.papel === 'admin' ? <ShieldMinus className="h-4 w-4" /> : <UserCog className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => alternarAtivo(u)}
                        disabled={acaoEmCurso === u.uid || (u.ativo && u.papel === 'admin' && totalAdmins <= 1)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        aria-label={u.ativo ? 'Desativar' : 'Reativar'}
                      >
                        {u.ativo ? <ShieldOff className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                      </button>
                      {!u.excluido && (
                        <button
                          onClick={() => setUsuarioParaExcluir(u)}
                          disabled={u.ativo && u.papel === 'admin' && totalAdmins <= 1}
                          className="p-2 text-risco hover:bg-red-50 rounded-lg"
                          aria-label="Excluir"
                          title={u.ativo && u.papel === 'admin' && totalAdmins <= 1 ? 'O sistema precisa de pelo menos um administrador ativo' : 'Excluir utilizador'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal aberto={!!usuarioParaExcluir} aoFechar={() => setUsuarioParaExcluir(null)} titulo="Confirmar exclusão">
        <p className="text-sm text-gray-600 mb-4">
          Tem certeza que deseja excluir <strong>{usuarioParaExcluir?.nome}</strong>? O acesso dele será bloqueado
          imediatamente. Os dados (produtos, entradas, saídas) são mantidos — nada é apagado permanentemente.
        </p>
        <div className="flex gap-2">
          <Button variante="fantasma" className="flex-1" onClick={() => setUsuarioParaExcluir(null)}>
            Cancelar
          </Button>
          <Button variante="perigo" className="flex-1" onClick={excluirUsuario}>
            Excluir
          </Button>
        </div>
      </Modal>

      <Modal aberto={!!usuarioParaAlterarPapel} aoFechar={() => setUsuarioParaAlterarPapel(null)} titulo={usuarioParaAlterarPapel?.papel === 'admin' ? 'Rebaixar administrador' : 'Promover a administrador'}>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="font-medium text-gray-900">{usuarioParaAlterarPapel?.nome}</p>
            <p className="text-sm text-gray-500">{usuarioParaAlterarPapel?.email}</p>
            <p className="mt-2 text-sm text-gray-700">
              Papel atual: <strong>{usuarioParaAlterarPapel?.papel === 'admin' ? 'Administrador' : 'Utilizador'}</strong>
              {' → '}
              <strong>{usuarioParaAlterarPapel?.papel === 'admin' ? 'Utilizador' : 'Administrador'}</strong>
            </p>
          </div>
          <p className="text-sm text-gray-600">
            {usuarioParaAlterarPapel?.papel === 'admin'
              ? 'Este utilizador deixará de poder abrir o Painel Administrativo e gerir contas. O acesso às áreas normais continuará ativo.'
              : 'Este utilizador passará a poder abrir o Painel Administrativo e gerir as contas do sistema.'}
          </p>
          {usuarioParaAlterarPapel?.papel === 'admin' && totalAdmins <= 1 && usuarioParaAlterarPapel.ativo && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-risco">Esta alteração não pode ser feita porque deixaria o sistema sem administrador ativo.</p>
          )}
          <div className="flex gap-2">
            <Button variante="fantasma" className="flex-1" onClick={() => setUsuarioParaAlterarPapel(null)}>Cancelar</Button>
            <Button
              className="flex-1"
              variante={usuarioParaAlterarPapel?.papel === 'admin' ? 'perigo' : 'primaria'}
              aCarregar={!!usuarioParaAlterarPapel && acaoEmCurso === usuarioParaAlterarPapel.uid}
              disabled={!usuarioParaAlterarPapel || (usuarioParaAlterarPapel.ativo && usuarioParaAlterarPapel.papel === 'admin' && totalAdmins <= 1)}
              onClick={confirmarAlteracaoPapel}
            >
              {usuarioParaAlterarPapel?.papel === 'admin' ? 'Confirmar rebaixamento' : 'Confirmar promoção'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal aberto={!!usuarioDetalhe || carregandoDetalhe} aoFechar={() => setUsuarioDetalhe(null)} titulo="Dados do utilizador">
        {carregandoDetalhe && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {usuarioDetalhe && !carregandoDetalhe && (
          <div className="space-y-3 text-sm">
            <p>
              <strong>{usuarioDetalhe.usuario.nome}</strong> · {usuarioDetalhe.usuario.email}
            </p>
            <p className="text-gray-500">Produtos: {usuarioDetalhe.totalProdutos}</p>
            <p className="text-gray-500">Entradas: {usuarioDetalhe.totalEntradas}</p>
            <p className="text-gray-500">Saídas: {usuarioDetalhe.totalSaidas}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
