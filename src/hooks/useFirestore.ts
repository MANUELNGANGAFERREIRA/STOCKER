'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  type QueryConstraint,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/client';
import { useAuth } from './useAuth';

// Hook genérico que escuta uma coleção do Firestore em tempo real,
// filtrada automaticamente pelo utilizador atual (a não ser que seja
// admin, caso em que vê todos os documentos — útil no painel admin).
export function useColecao<T>(
  nomeColecao: string,
  opcoes?: { todosUtilizadores?: boolean; ordenarPor?: string; ordemDesc?: boolean }
) {
  const { utilizadorFirebase, ehAdmin } = useAuth();
  const [dados, setDados] = useState<T[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!utilizadorFirebase) {
      setDados([]);
      setCarregando(false);
      return;
    }

    const db = getFirebaseDb();
    const restricoes: QueryConstraint[] = [];

    // Utilizadores comuns só veem os seus próprios dados. Admins podem
    // ver tudo se opcoes.todosUtilizadores for verdadeiro.
    if (!(ehAdmin && opcoes?.todosUtilizadores)) {
      restricoes.push(where('donoId', '==', utilizadorFirebase.uid));
    }

    if (opcoes?.ordenarPor) {
      restricoes.push(orderBy(opcoes.ordenarPor, opcoes.ordemDesc ? 'desc' : 'asc'));
    }

    const q = query(collection(db, nomeColecao), ...restricoes);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        setDados(lista);
        setCarregando(false);
        setErro(null);
      },
      (err) => {
        console.error(`Erro ao ler coleção ${nomeColecao}:`, err);
        setErro('Não foi possível carregar os dados. A tentar novamente quando a ligação voltar.');
        setCarregando(false);
      }
    );

    return () => unsub();
  }, [utilizadorFirebase, ehAdmin, nomeColecao, opcoes?.todosUtilizadores, opcoes?.ordenarPor, opcoes?.ordemDesc]);

  return { dados, carregando, erro };
}

// Funções auxiliares para criar/editar/apagar documentos, usadas pelos
// formulários. Mantidas fora do hook para poderem ser chamadas
// diretamente a partir de handlers de submit.
export async function criarDocumento<T extends Record<string, any>>(nomeColecao: string, dados: T) {
  const db = getFirebaseDb();
  return addDoc(collection(db, nomeColecao), dados);
}

export async function atualizarDocumento(nomeColecao: string, id: string, dados: Record<string, any>) {
  const db = getFirebaseDb();
  return updateDoc(doc(db, nomeColecao, id), dados);
}

export async function apagarDocumento(nomeColecao: string, id: string) {
  const db = getFirebaseDb();
  return deleteDoc(doc(db, nomeColecao, id));
}
