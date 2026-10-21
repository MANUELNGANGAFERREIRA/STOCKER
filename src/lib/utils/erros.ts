// Traduz códigos de erro do Firebase para mensagens amigáveis em
// português, como exigido pelos requisitos de UX do sistema.
export function mensagemErroFirebase(erro: unknown): string {
  const codigo = (erro as { code?: string })?.code || '';

  const mensagens: Record<string, string> = {
    'auth/invalid-email': 'O email introduzido não é válido.',
    'auth/user-disabled': 'Esta conta foi desativada. Contacte o administrador.',
    'auth/user-not-found': 'Não existe nenhuma conta com este email.',
    'auth/wrong-password': 'Palavra-passe incorreta. Tente novamente.',
    'auth/invalid-credential': 'Email ou palavra-passe incorretos.',
    'auth/email-already-in-use': 'Já existe uma conta registada com este email.',
    'auth/weak-password': 'A palavra-passe deve ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiadas tentativas. Aguarde alguns minutos e tente novamente.',
    'auth/network-request-failed': 'Sem ligação à internet. Verifique a sua rede e tente novamente.',
    'auth/unauthorized-continue-uri': 'O domínio deste site ainda não está autorizado no Firebase Authentication.',
    'auth/invalid-continue-uri': 'O endereço para voltar ao sistema não é válido. Contacte o administrador.',
    'auth/operation-not-allowed': 'A recuperação por email não está ativa no Firebase Authentication.',
    'auth/invalid-action-code': 'Este link já foi usado ou expirou. Peça um novo link de recuperação.',
    'permission-denied': 'Não tem permissão para realizar esta ação.',
    'unavailable': 'Sem ligação ao servidor. Os dados serão sincronizados quando a internet voltar.',
  };

  return mensagens[codigo] || 'Ocorreu um erro inesperado. Tente novamente.';
}
