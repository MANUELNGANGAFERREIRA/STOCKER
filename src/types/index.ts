// Tipos centrais usados em toda a aplicação ContaFácil AO

export type PapelUtilizador = 'admin' | 'utilizador';

export interface Utilizador {
  uid: string;
  nome: string;
  email: string;
  papel: PapelUtilizador;
  ativo: boolean;
  // Soft-delete: quando um admin "exclui" um utilizador, nunca apagamos
  // a conta real (nem o Firebase Authentication, nem os dados) — só
  // marcamos excluido=true (além de ativo=false). Isto evita depender
  // de um backend/Cloud Functions e mantém tudo a funcionar offline.
  excluido?: boolean;
  excluidoEm?: number;
  criadoEm: number; // timestamp em ms
}

export type StatusProduto = 'ok' | 'critico' | 'sem_stock';

export interface Produto {
  id: string;
  donoId: string; // uid do utilizador que criou o produto
  nome: string;
  categoria: string;
  codigo: string;
  unidade: string; // ex: "unidade", "caixa", "kg", "litro"
  quantidade: number;
  quantidadeMinima: number;
  precoCompra: number;
  precoVenda: number;
  criadoEm: number;
  atualizadoEm: number;
}

export interface Entrada {
  id: string;
  donoId: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  fornecedorId?: string;
  fornecedorNome?: string;
  data: number; // timestamp em ms
  observacao?: string;
  registadoPor: string; // uid
  criadoEm: number;
}

export interface Saida {
  id: string;
  donoId: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number; // preço de venda usado nesta saída
  clienteId?: string;
  clienteNome?: string;
  data: number;
  observacao?: string;
  registadoPor: string;
  criadoEm: number;
}

export interface Fornecedor {
  id: string;
  donoId: string;
  nome: string;
  contacto: string;
  email?: string;
  endereco?: string;
  criadoEm: number;
}

export interface Cliente {
  id: string;
  donoId: string;
  nome: string;
  contacto: string;
  email?: string;
  criadoEm: number;
}

export interface RegistoInventario {
  id: string;
  donoId: string;
  produtoId: string;
  produtoNome: string;
  quantidadeSistema: number;
  quantidadeReal: number;
  diferenca: number;
  data: number;
  registadoPor: string;
}

// Calcula o status de um produto a partir da sua quantidade e mínimo
export function calcularStatusProduto(p: Pick<Produto, 'quantidade' | 'quantidadeMinima'>): StatusProduto {
  if (p.quantidade <= 0) return 'sem_stock';
  if (p.quantidade <= p.quantidadeMinima) return 'critico';
  return 'ok';
}
