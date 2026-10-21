'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, WifiOff, LogOut, UserCircle, Settings, ShieldCheck, KeyRound, UserRound } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useOffline } from '@/hooks/useOffline';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase/client';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { mensagemErroFirebase } from '@/lib/utils/erros';

export function Header({ aoAbrirMenu }: { aoAbrirMenu: () => void }) {
  const { perfil, utilizadorFirebase, ehAdmin, sair } = useAuth();
  const offline = useOffline();
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [nome, setNome] = useState(perfil?.nome || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [aGuardarNome, setAGuardarNome] = useState(false);
  const [aGuardarSenha, setAGuardarSenha] = useState(false);
  const { mostrarToast } = useToast();

  async function guardarNome(e: FormEvent) {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    if (!utilizadorFirebase || !nomeLimpo) return;
    setAGuardarNome(true);
    try {
      await updateProfile(utilizadorFirebase, { displayName: nomeLimpo });
      await updateDoc(doc(getFirebaseDb(), 'utilizadores', utilizadorFirebase.uid), { nome: nomeLimpo });
      mostrarToast('Nome atualizado com sucesso.', 'sucesso');
    } catch (erro) {
      mostrarToast(mensagemErroFirebase(erro), 'erro');
    } finally {
      setAGuardarNome(false);
    }
  }

  async function guardarSenha(e: FormEvent) {
    e.preventDefault();
    setErroSenha('');
    if (!utilizadorFirebase?.email) return;
    if (senhaNova.length < 6) {
      setErroSenha('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senhaNova !== confirmarSenha) {
      setErroSenha('A confirmação não coincide com a nova palavra-passe.');
      return;
    }
    setAGuardarSenha(true);
    try {
      const credencial = EmailAuthProvider.credential(utilizadorFirebase.email, senhaAtual);
      await reauthenticateWithCredential(utilizadorFirebase, credencial);
      await updatePassword(utilizadorFirebase, senhaNova);
      setSenhaAtual('');
      setSenhaNova('');
      setConfirmarSenha('');
      mostrarToast('Palavra-passe alterada com sucesso.', 'sucesso');
    } catch (erro) {
      const codigo = (erro as { code?: string })?.code;
      setErroSenha(codigo === 'auth/wrong-password' || codigo === 'auth/invalid-credential'
        ? 'A palavra-passe atual está incorreta.'
        : codigo === 'auth/requires-recent-login'
          ? 'Por segurança, termine a sessão e entre novamente antes de alterar a palavra-passe.'
          : mensagemErroFirebase(erro));
    } finally {
      setAGuardarSenha(false);
    }
  }

  async function lidarComSaida() {
    await sair();
    router.replace('/login/');
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
      <button onClick={aoAbrirMenu} className="lg:hidden text-gray-600" aria-label="Abrir menu">
        <Menu className="h-6 w-6" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        {offline && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-secondary-700">
            <WifiOff className="h-3.5 w-3.5" />
            Modo Offline
          </span>
        )}

        <div className="relative">
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100"
          >
            <UserCircle className="h-7 w-7 text-primary" />
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {perfil?.nome || 'Utilizador'}
            </span>
          </button>

          {menuAberto && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white py-1 shadow-lg border border-gray-100">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">{perfil?.nome}</p>
                <p className="text-xs text-gray-500 truncate">{perfil?.email}</p>
              </div>
              <button
                onClick={() => {
                  setNome(perfil?.nome || '');
                  setMenuAberto(false);
                  setPerfilAberto(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                Meu perfil
              </button>
              <button
                onClick={lidarComSaida}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-risco hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal aberto={perfilAberto} aoFechar={() => setPerfilAberto(false)} titulo="Meu perfil">
        <div className="space-y-5">
          <div className="rounded-xl bg-gradient-to-r from-primary to-blue-700 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15"><UserRound className="h-7 w-7" /></div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{perfil?.nome || 'Utilizador'}</p>
                <p className="truncate text-sm text-white/80">{perfil?.email}</p>
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
              {ehAdmin && <ShieldCheck className="h-3.5 w-3.5" />}
              {ehAdmin ? 'Administrador' : 'Utilizador'}
            </div>
          </div>

          <form onSubmit={guardarNome} className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Dados da conta</h3>
              <p className="text-xs text-gray-500">Atualize o nome que aparece no sistema.</p>
            </div>
            <Input rotulo="Nome" required maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} />
            <Input rotulo="Email" type="email" value={perfil?.email || ''} disabled />
            <Button type="submit" aCarregar={aGuardarNome} disabled={!nome.trim() || nome.trim() === perfil?.nome}>Guardar nome</Button>
          </form>

          <form onSubmit={guardarSenha} className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Alterar palavra-passe</h3>
                <p className="text-xs text-gray-500">Confirme a palavra-passe atual para proteger a sua conta.</p>
              </div>
            </div>
            <Input rotulo="Palavra-passe atual" type="password" autoComplete="current-password" required value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
            <Input rotulo="Nova palavra-passe" type="password" autoComplete="new-password" minLength={6} required value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} />
            <Input rotulo="Confirmar nova palavra-passe" type="password" autoComplete="new-password" minLength={6} required value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
            {erroSenha && <p className="text-sm text-risco">{erroSenha}</p>}
            <Button type="submit" variante="secundaria" aCarregar={aGuardarSenha}><KeyRound className="h-4 w-4" /> Atualizar palavra-passe</Button>
          </form>
        </div>
      </Modal>
    </header>
  );
}
