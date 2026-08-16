'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase/client';
import type { Utilizador } from '@/types';

// Quando não há Cloud Functions, ninguém consegue "forçar" logout de uma
// conta desativada a partir de um backend. Em vez disso, o próprio
// cliente reage em tempo real: assim que o documento de perfil chega com
// ativo=false, terminamos a sessão localmente e mandamos para o login
// com o aviso. Isto é imediato sempre que há ligação (onSnapshot em
// tempo real); offline, a aplicação continua a confiar nos dados em
// cache até à próxima sincronização — nesse momento as Firestore Rules
// (que também verificam "ativo") bloqueiam qualquer escrita pendente.

interface AuthContextValor {
  utilizadorFirebase: User | null;
  perfil: Utilizador | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  registar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  recuperarSenha: (email: string) => Promise<void>;
  ehAdmin: boolean;
}

const AuthContext = createContext<AuthContextValor | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilizadorFirebase, setUtilizadorFirebase] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Utilizador | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    let unsubPerfil: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUtilizadorFirebase(user);

      if (unsubPerfil) {
        unsubPerfil();
        unsubPerfil = undefined;
      }

      if (user) {
        // Escuta em tempo real o documento de perfil, para refletir
        // imediatamente alterações feitas por um admin (ex: desativar conta).
        const ref = doc(db, 'utilizadores', user.uid);
        unsubPerfil = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const dados = snap.data() as Utilizador;
            if (dados.ativo === false) {
              // Conta desativada/excluída por um admin: termina a sessão
              // localmente e avisa (o próprio Firestore vai recusar
              // qualquer escrita, mas isto dá feedback imediato).
              firebaseSignOut(auth).finally(() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/login/?desativado=1';
                }
              });
              return;
            }
            setPerfil(dados);
          }
          setCarregando(false);
        });
      } else {
        setPerfil(null);
        setCarregando(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubPerfil) unsubPerfil();
    };
  }, []);

  async function entrar(email: string, senha: string) {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, senha);
  }

  async function registar(nome: string, email: string, senha: string) {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(cred.user, { displayName: nome });

    // Cria o documento de perfil na coleção "utilizadores". O primeiro
    // utilizador registado no sistema nunca é admin automaticamente por
    // segurança — o próprio administrador do projeto deve definir o
    // primeiro admin diretamente na consola do Firebase (Firestore →
    // utilizadores/{uid} → papel: "admin"). A partir daí, esse admin
    // promove outros diretamente pelo Painel Administrativo.
    const novoPerfil: Utilizador = {
      uid: cred.user.uid,
      nome,
      email,
      papel: 'utilizador',
      ativo: true,
      criadoEm: Date.now(),
    };
    await setDoc(doc(db, 'utilizadores', cred.user.uid), novoPerfil);
  }

  async function sair() {
    await firebaseSignOut(getFirebaseAuth());
  }

  async function recuperarSenha(email: string) {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  }

  const valor: AuthContextValor = {
    utilizadorFirebase,
    perfil,
    carregando,
    entrar,
    registar,
    sair,
    recuperarSenha,
    ehAdmin: perfil?.papel === 'admin',
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return ctx;
}
