'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { mensagemErroFirebase } from '@/lib/utils/erros';

export default function PaginaLogin() {
  const { entrar } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { mostrarToast } = useToast();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState('');

  const desativado = params?.get('desativado') === '1';

  async function lidarComSubmissao(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setACarregar(true);
    try {
      await entrar(email, senha);
      mostrarToast('Sessão iniciada com sucesso!', 'sucesso');
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
          <h1 className="text-2xl font-bold text-gray-900">ContaFácil AO</h1>
          <p className="mt-1 text-sm text-gray-500">Gestão de stock simples para o seu negócio</p>
        </div>

        {desativado && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-risco">
            A sua conta foi desativada. Contacte o administrador do sistema.
          </div>
        )}

        <form onSubmit={lidarComSubmissao} className="space-y-4 rounded-lg bg-white p-5 shadow-sm">
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
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {erro && <p className="text-sm text-risco">{erro}</p>}

          <Button type="submit" className="w-full" aCarregar={aCarregar}>
            Entrar
          </Button>

          <div className="flex items-center justify-between text-sm pt-1">
            <Link href="/recuperar-senha/" className="text-primary hover:underline">
              Esqueceu a senha?
            </Link>
            <Link href="/register/" className="text-primary hover:underline">
              Criar conta
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
