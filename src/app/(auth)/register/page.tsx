'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { mensagemErroFirebase } from '@/lib/utils/erros';

export default function PaginaRegisto() {
  const { registar } = useAuth();
  const router = useRouter();
  const { mostrarToast } = useToast();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState('');

  async function lidarComSubmissao(e: FormEvent) {
    e.preventDefault();
    setErro('');

    if (senha !== confirmarSenha) {
      setErro('As palavras-passe não coincidem.');
      return;
    }
    if (senha.length < 6) {
      setErro('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    setACarregar(true);
    try {
      await registar(nome, email, senha);
      mostrarToast('Conta criada com sucesso! Bem-vindo(a).', 'sucesso');
      router.replace('/dashboard/');
    } catch (err) {
      setErro(mensagemErroFirebase(err));
    } finally {
      setACarregar(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bgapp px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-white">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="mt-1 text-sm text-gray-500">Comece a gerir o seu stock em minutos</p>
        </div>

        <form onSubmit={lidarComSubmissao} className="space-y-4 rounded-lg bg-white p-5 shadow-sm">
          <Input
            rotulo="Nome completo"
            id="nome"
            required
            placeholder="Ex: João Manuel"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <Input
            rotulo="Email"
            id="email"
            type="email"
            required
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            rotulo="Palavra-passe"
            id="senha"
            type="password"
            required
            placeholder="Mínimo 6 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <Input
            rotulo="Confirmar palavra-passe"
            id="confirmarSenha"
            type="password"
            required
            placeholder="••••••••"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />

          {erro && <p className="text-sm text-risco">{erro}</p>}

          <Button type="submit" className="w-full" aCarregar={aCarregar}>
            Criar conta
          </Button>

          <p className="text-center text-sm pt-1">
            Já tem conta?{' '}
            <Link href="/login/" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
