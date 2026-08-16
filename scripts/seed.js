/**
 * Script de seed — cria dados de exemplo para um comerciante fictício
 * ("Mercearia Kianda") para testar rapidamente o ContaFácil AO.
 *
 * COMO USAR:
 * 1. Descarregue a chave de conta de serviço do seu projeto Firebase
 *    (Consola Firebase > Definições do projeto > Contas de serviço >
 *    Gerar nova chave privada) e guarde-a como "serviceAccountKey.json"
 *    na raiz do projeto.
 * 2. Crie manualmente, na Consola Firebase (Authentication), um
 *    utilizador de teste com o email/senha abaixo, e copie o UID gerado
 *    para a variável UID_UTILIZADOR_TESTE.
 * 3. Execute: node scripts/seed.js
 */

const admin = require('firebase-admin');
const path = require('path');

const CAMINHO_CHAVE = path.join(__dirname, '..', 'serviceAccountKey.json');

// >>> ALTERE ESTE VALOR para o UID do utilizador de teste criado no
// Firebase Authentication. <<<
const UID_UTILIZADOR_TESTE = 'COLOQUE_AQUI_O_UID_DO_UTILIZADOR';
const EMAIL_UTILIZADOR_TESTE = 'comerciante@contafacilao.test';
const NOME_UTILIZADOR_TESTE = 'Maria Kianda';

let serviceAccount;
try {
  serviceAccount = require(CAMINHO_CHAVE);
} catch (err) {
  console.error(
    '❌ Não foi possível encontrar "serviceAccountKey.json" na raiz do projeto.\n' +
      '   Descarregue a chave de conta de serviço na Consola Firebase e guarde-a com esse nome.'
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const agora = Date.now();
const diasAtras = (n) => agora - n * 24 * 60 * 60 * 1000;

async function semear() {
  if (UID_UTILIZADOR_TESTE === 'COLOQUE_AQUI_O_UID_DO_UTILIZADOR') {
    console.error('❌ Edite o script e defina UID_UTILIZADOR_TESTE com o UID real do utilizador de teste.');
    process.exit(1);
  }

  console.log('🌱 A criar dados de exemplo para "Mercearia Kianda"...');

  // Perfil do utilizador
  await db.collection('utilizadores').doc(UID_UTILIZADOR_TESTE).set({
    uid: UID_UTILIZADOR_TESTE,
    nome: NOME_UTILIZADOR_TESTE,
    email: EMAIL_UTILIZADOR_TESTE,
    papel: 'admin', // o utilizador de teste começa como admin para poder ver tudo
    ativo: true,
    criadoEm: diasAtras(60),
  });

  // Fornecedores
  const fornecedores = [
    { nome: 'Distribuidora Luanda Sul', contacto: '923 111 222', email: 'vendas@luandasul.co.ao' },
    { nome: 'Agro Angola Lda', contacto: '912 333 444', email: 'geral@agroangola.co.ao' },
  ];
  const idsFornecedores = [];
  for (const f of fornecedores) {
    const ref = await db.collection('fornecedores').add({
      donoId: UID_UTILIZADOR_TESTE,
      ...f,
      endereco: 'Luanda, Angola',
      criadoEm: diasAtras(55),
    });
    idsFornecedores.push(ref.id);
  }

  // Clientes
  const clientes = [
    { nome: 'João Sebastião', contacto: '924 555 666' },
    { nome: 'Ana Paula', contacto: '925 777 888' },
  ];
  const idsClientes = [];
  for (const c of clientes) {
    const ref = await db.collection('clientes').add({
      donoId: UID_UTILIZADOR_TESTE,
      ...c,
      criadoEm: diasAtras(50),
    });
    idsClientes.push(ref.id);
  }

  // Produtos
  const produtosBase = [
    { nome: 'Arroz Agulha 25kg', categoria: 'Cereais', unidade: 'saco', quantidade: 40, quantidadeMinima: 10, precoCompra: 18000, precoVenda: 22000 },
    { nome: 'Óleo de Palma 5L', categoria: 'Óleos', unidade: 'garrafa', quantidade: 8, quantidadeMinima: 10, precoCompra: 6500, precoVenda: 8000 },
    { nome: 'Açúcar 1kg', categoria: 'Mercearia', unidade: 'unidade', quantidade: 0, quantidadeMinima: 15, precoCompra: 900, precoVenda: 1300 },
    { nome: 'Farinha de Milho 25kg', categoria: 'Cereais', unidade: 'saco', quantidade: 25, quantidadeMinima: 8, precoCompra: 12000, precoVenda: 15500 },
    { nome: 'Sabão Azul e Branco', categoria: 'Higiene', unidade: 'unidade', quantidade: 60, quantidadeMinima: 20, precoCompra: 350, precoVenda: 550 },
    { nome: 'Cerveja Cuca 33cl (grade)', categoria: 'Bebidas', unidade: 'grade', quantidade: 30, quantidadeMinima: 10, precoCompra: 7500, precoVenda: 9500 },
    { nome: 'Refrigerante Blue 1.5L', categoria: 'Bebidas', unidade: 'unidade', quantidade: 3, quantidadeMinima: 12, precoCompra: 500, precoVenda: 750 },
    { nome: 'Feijão Catarino 1kg', categoria: 'Cereais', unidade: 'unidade', quantidade: 18, quantidadeMinima: 10, precoCompra: 1100, precoVenda: 1500 },
  ];

  const idsProdutos = [];
  for (const p of produtosBase) {
    const ref = await db.collection('produtos').add({
      donoId: UID_UTILIZADOR_TESTE,
      ...p,
      codigo: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      criadoEm: diasAtras(45),
      atualizadoEm: diasAtras(1),
    });
    idsProdutos.push({ id: ref.id, ...p });
  }

  // Entradas de exemplo (últimos 20 dias)
  for (let i = 0; i < 10; i++) {
    const produto = idsProdutos[i % idsProdutos.length];
    await db.collection('entradas').add({
      donoId: UID_UTILIZADOR_TESTE,
      produtoId: produto.id,
      produtoNome: produto.nome,
      quantidade: Math.floor(5 + Math.random() * 20),
      precoUnitario: produto.precoCompra,
      fornecedorId: idsFornecedores[i % idsFornecedores.length],
      fornecedorNome: fornecedores[i % fornecedores.length].nome,
      data: diasAtras(20 - i * 2),
      observacao: null,
      registadoPor: UID_UTILIZADOR_TESTE,
      criadoEm: diasAtras(20 - i * 2),
    });
  }

  // Saídas de exemplo (últimos 7 dias, para o gráfico do dashboard)
  for (let i = 0; i < 14; i++) {
    const produto = idsProdutos[i % idsProdutos.length];
    await db.collection('saidas').add({
      donoId: UID_UTILIZADOR_TESTE,
      produtoId: produto.id,
      produtoNome: produto.nome,
      quantidade: Math.floor(1 + Math.random() * 5),
      precoUnitario: produto.precoVenda,
      clienteId: idsClientes[i % idsClientes.length],
      clienteNome: clientes[i % clientes.length].nome,
      data: diasAtras(i % 7),
      observacao: null,
      registadoPor: UID_UTILIZADOR_TESTE,
      criadoEm: diasAtras(i % 7),
    });
  }

  console.log('✅ Dados de exemplo criados com sucesso!');
  console.log(`   Utilizador: ${EMAIL_UTILIZADOR_TESTE}`);
  console.log(`   Produtos: ${idsProdutos.length} · Fornecedores: ${fornecedores.length} · Clientes: ${clientes.length}`);
  process.exit(0);
}

semear().catch((err) => {
  console.error('❌ Erro ao semear dados:', err);
  process.exit(1);
});
