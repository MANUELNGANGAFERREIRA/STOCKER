'use client';

// Configuração do Firebase Client SDK.
// Este ficheiro corre APENAS no browser (front-end). Todas as operações
// administrativas sensíveis passam pelas Cloud Functions (ver functions.ts).

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

// Nota: este projeto NÃO usa Cloud Functions nem plano Blaze. Toda a
// lógica (incluindo administração de utilizadores) corre diretamente
// no cliente contra o Firestore, protegida pelas Security Rules — o
// que também é o que permite ao sistema funcionar 100% offline, já
// que uma callable function nunca funcionaria sem rede.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Inicialização "lazy" e segura para evitar recriar a app em cada
// hot-reload durante o desenvolvimento (padrão comum em apps Next.js).
function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

// Firestore com persistência offline ativada (Offline First).
// Usamos persistentLocalCache com persistentMultipleTabManager para que
// os dados fiquem disponíveis mesmo sem internet e sincronizem quando a
// ligação voltar, incluindo suporte a múltiplos separadores abertos.
export function getFirebaseDb(): Firestore {
  if (!db) {
    try {
      db = initializeFirestore(getFirebaseApp(), {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch (err) {
      // Se a persistência já foi inicializada (ex: hot reload), apenas
      // reutilizamos a instância existente.
      console.warn('Firestore já inicializado, a reutilizar instância existente.', err);
    }
  }
  return db;
}
