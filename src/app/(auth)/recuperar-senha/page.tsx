'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { mensagemErroFirebase } from '@/lib/utils/erros';

export default function PaginaRecuperarSenha() {
  const { recuperarSenha } = useAuth();
  const [email, setEmail] = useState('');
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);

  async function lidarComSubmissao(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setACarregar(true);
    try {
      await recuperarSenha(email.trim());
      setEnviado(true);
    } catch (err) {
      const codigo = (err as { code?: string })?.code;
      if (codigo === 'auth/user-not-found') {
        // Mantém a mesma resposta para endereços existentes e inexistentes.
        setEnviado(true);
      } else {
        setErro(mensagemErroFirebase(err));
      }
    } finally {
      setACarregar(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bgapp px-4 py-8">
      <div className="w-full max-w-sm">
        <Link href="/login/" className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Recuperar palavra-passe</h1>

          {enviado ? (
            <div className="mt-4 flex flex-col items-center text-center py-4">
              <MailCheck className="h-10 w-10 text-ok mb-2" />
              <p className="text-sm text-gray-700">
                Se existir uma conta associada a <strong>{email}</strong>, enviaremos um email com o link seguro para redefinir a palavra-passe.
              </p>
              <p className="mt-2 text-xs text-gray-500">Abra o link recebido, escolha uma nova palavra-passe e depois entre novamente. Verifique também a pasta de spam.</p>
              <Button type="button" variante="fantasma" className="mt-4" onClick={() => setEnviado(false)}>
                Enviar outro link
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Introduza o email da sua conta. Enviaremos um link seguro para criar uma nova palavra-passe.
              </p>
              <form onSubmit={lidarComSubmissao} className="space-y-4">
                <Input
                  rotulo="Email"
                  id="email"
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {erro && <p className="text-sm text-risco">{erro}</p>}
                <Button type="submit" className="w-full" aCarregar={aCarregar}>
                  Enviar link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
