'use client';

import { useEffect, useState } from 'react';

// Deteta se o utilizador está sem ligação à internet, para mostrarmos
// o indicador visual de "Modo Offline". O Firestore continua a funcionar
// normalmente graças à persistência local (ver lib/firebase/client.ts) —
// este hook serve apenas para dar feedback visual ao utilizador.
export function useOffline(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);

    function aoFicarOnline() {
      setOffline(false);
    }
    function aoFicarOffline() {
      setOffline(true);
    }

    window.addEventListener('online', aoFicarOnline);
    window.addEventListener('offline', aoFicarOffline);

    return () => {
      window.removeEventListener('online', aoFicarOnline);
      window.removeEventListener('offline', aoFicarOffline);
    };
  }, []);

  return offline;
}
