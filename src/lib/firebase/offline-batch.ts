import type { WriteBatch } from 'firebase/firestore';

/**
 * Submits related Firestore changes atomically and lets the UI finish when
 * Firestore has queued them locally, without waiting indefinitely offline.
 */
export async function confirmarLoteOuEnfileirar(
  lote: WriteBatch,
  aoEnfileirar: () => void,
  aoSincronizar: () => void,
  aoFalharSincronizacao: () => void,
  esperaMs = 1500
): Promise<void> {
  const gravacao = lote.commit();
  let temporizador: ReturnType<typeof setTimeout> | undefined;

  let resultado: 'sincronizado' | 'pendente';
  try {
    resultado = await Promise.race([
      gravacao.then(() => 'sincronizado' as const),
      new Promise<'pendente'>((resolve) => {
        temporizador = setTimeout(() => resolve('pendente'), esperaMs);
      }),
    ]);
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }

  if (resultado === 'sincronizado') {
    aoSincronizar();
    return;
  }

  aoEnfileirar();
  void gravacao.then(aoSincronizar).catch(aoFalharSincronizacao);
}
