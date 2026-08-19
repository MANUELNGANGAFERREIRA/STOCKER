# Conexore 🇦🇴

Sistema de gestão de stock simples e mobile-first para pequenos comerciantes angolanos.

Construído com **Next.js 14 (App Router, Static Export)**, **TypeScript**, **Tailwind CSS** e **Firebase**
(apenas Authentication + Firestore — sem Cloud Functions, sem plano Blaze).

---

## 📐 Arquitetura

Este projeto **não usa API Routes do Next.js nem Cloud Functions**. É exportado como um site 100%
estático (`output: 'export'`), pensado para hospedagem em **Cloudflare Pages**. Toda a lógica —
incluindo administração de utilizadores, relatórios e cálculos de reposição — corre **diretamente
no cliente**, contra o Firestore, protegida pelas Security Rules (`firestore.rules`).

Isto foi uma escolha deliberada, não uma limitação: dá dois benefícios importantes.

1. **Sem plano Blaze.** Cloud Functions exigem sempre plano de faturação ativo na Google, mesmo
   dentro do nível gratuito. Sem elas, o projeto corre inteiramente no plano Spark (grátis).
2. **Offline verdadeiramente total.** Uma Cloud Function (`httpsCallable`) é sempre uma chamada de
   rede — nunca funciona offline, mesmo com Blaze ativo. Ao mover tudo para leituras/escritas
   diretas no Firestore (que tem cache local persistente), a aplicação inteira — incluindo o
   Painel Admin — continua a funcionar sem internet.

```
Browser (Next.js estático)
   │
   ├── Firebase Auth (login/registo)
   └── Firestore (leitura/escrita direta de todos os dados, com cache offline,
                   protegida pelas Security Rules — inclui operações admin)
```

### Exclusão de utilizador = soft-delete

Não há como um cliente (sem Admin SDK) apagar a conta de *outra pessoa* no Firebase Authentication.
Por isso, "excluir" um utilizador nunca apaga a conta nem os dados — apenas marca
`ativo: false` e `excluido: true` no documento em `utilizadores/{uid}`. As Security Rules bloqueiam
imediatamente qualquer leitura/escrita desse utilizador nos seus próprios dados, e o `useAuth`
termina a sessão dele automaticamente assim que essa alteração chega (em tempo real, se estiver
online). Os dados de negócio (produtos, entradas, saídas, etc.) são sempre preservados.

---

## 🚀 Instalação local

### 1. Pré-requisitos
- Node.js 20+
- Uma conta Google e um projeto Firebase criado em https://console.firebase.google.com

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar o Firebase

No Firebase Console, ative (plano **Spark**, gratuito — não precisa do Blaze):
- **Authentication** → método "Email/Palavra-passe"
- **Firestore Database** → crie a base de dados (modo produção)

Copie `.env.local.example` para `.env.local` e preencha com as credenciais do seu projeto
(Consola Firebase → Definições do projeto → Geral → As suas apps → Configuração do SDK):

```bash
cp .env.local.example .env.local
```

### 4. Publicar as regras de segurança

Instale a Firebase CLI (se ainda não tiver):

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # selecione o seu projeto Firebase
```

Publique as regras e os índices do Firestore (é tudo o que há para publicar — não há Cloud
Functions neste projeto):

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Criar o primeiro administrador

Por segurança, **nenhum utilizador se torna admin automaticamente**. Depois de registar a sua
primeira conta na aplicação (ecrã "Criar conta"), vá à Firestore Console e edite manualmente o
documento em `utilizadores/{uid}`, alterando o campo `papel` de `"utilizador"` para `"admin"`.
A partir daí, esse admin pode promover outros utilizadores diretamente pelo Painel Administrativo
do sistema.

### 6. Correr em desenvolvimento

```bash
npm run dev
```

Abra http://localhost:3000

---

## 🌱 Dados de exemplo (seed)

Para testar rapidamente o sistema com dados de um comerciante fictício ("Mercearia Kianda"):

1. Descarregue a chave de conta de serviço em: Consola Firebase → Definições do projeto →
   Contas de serviço → **Gerar nova chave privada**. Guarde o ficheiro como
   `serviceAccountKey.json` na raiz do projeto (este ficheiro está no `.gitignore` e nunca
   deve ser publicado).
2. Crie manualmente um utilizador de teste em Authentication e copie o UID gerado.
3. Edite `scripts/seed.js` e defina `UID_UTILIZADOR_TESTE` com esse UID.
4. Execute:

```bash
node scripts/seed.js
```

Isto cria produtos, fornecedores, clientes, entradas e saídas de exemplo, prontos para explorar
o dashboard, relatórios e alertas automáticos.

---

## 📦 Build e Deploy (Cloudflare Pages)

### Build local

```bash
npm run build
```

Isto gera uma pasta `out/` com o site estático completo.

### Deploy no Cloudflare Pages

**Opção A — Via Git (recomendado):**
1. Suba o código para um repositório (GitHub/GitLab).
2. Na Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Configure:
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Environment variables:** adicione todas as variáveis `NEXT_PUBLIC_FIREBASE_*` do seu
     `.env.local`
4. Clique em "Save and Deploy".

**Opção B — Via Wrangler CLI:**

```bash
npm install -g wrangler
npm run build
wrangler pages deploy out --project-name=Conexore
```

Depois do primeiro deploy, adicione as variáveis de ambiente em: Cloudflare Dashboard →
Workers & Pages → Conexore → Settings → Environment variables, e faça um novo deploy.

> ⚠️ **Importante:** como o site é 100% estático e as credenciais Firebase são chaves
> públicas do lado do cliente (protegidas pelas Firestore Security Rules, não por segredo),
> é seguro incluí-las como variáveis `NEXT_PUBLIC_*`.

---

## 🗂️ Estrutura de pastas

```
src/
├── app/
│   ├── (auth)/login, register, recuperar-senha
│   ├── (dashboard)/dashboard, produtos, entradas, saidas,
│   │                inventario, fornecedores, clientes,
│   │                relatorios, admin
│   └── layout.tsx
├── components/
│   ├── ui/        (Button, Card, Input, Modal, Toast, Badge)
│   ├── forms/      (FormularioProduto)
│   └── layout/     (Sidebar, Header, ProtectedRoute)
├── lib/
│   ├── firebase/   (client.ts, functions.ts)
│   └── utils/      (formatação, mensagens de erro)
├── hooks/          (useAuth, useFirestore, useOffline)
└── types/          (tipos TypeScript partilhados)

functions/          (Cloud Functions — index.js)
scripts/seed.js     (dados de exemplo)
firestore.rules     (regras de segurança)
```

---

## 🔑 Funcionalidades

- **Autenticação:** login, registo, recuperação de senha, proteção de rotas, papéis admin/utilizador
- **Dashboard:** cartões de stock, alertas automáticos, gráfico de movimentação de 7 dias
- **Produtos:** CRUD completo com filtros por categoria/status e busca
- **Entradas/Saídas:** registo com atualização automática do stock e validação de stock insuficiente
- **Inventário:** contagem física e correção de stock
- **Fornecedores/Clientes:** cadastro com histórico de compras/vendas
- **Relatórios:** inventário atual, abaixo do mínimo, produtos parados, mais/menos vendidos,
  entradas/saídas por período, histórico de movimentações
- **Painel Admin:** listar, promover, ativar/desativar e excluir (soft-delete) utilizadores; ver
  dados de qualquer utilizador — tudo via Firestore direto, funciona offline
- **Offline First:** persistência do Firestore ativada; indicador visual de "Modo Offline";
  literalmente nenhuma funcionalidade do sistema (incluindo o Painel Admin) depende de rede

---

## 🐛 Notas e limitações conhecidas

- Como não há Cloud Functions, a exclusão de utilizador é sempre um **soft-delete** (ver secção
  "Exclusão de utilizador = soft-delete" acima) — a conta do Firebase Authentication nunca é
  apagada, só bloqueada. Se precisar de exclusão real (ex: para libertar um email para reuso),
  isso exigiria um pequeno backend externo com Admin SDK — não incluído neste projeto por
  desenho, para manter tudo grátis e 100% offline.
- Para produção real, recomenda-se também configurar `firestore.indexes.json` (já incluído)
  publicando com `firebase deploy --only firestore:indexes`.

---

## 📄 Licença

Projeto de exemplo fornecido como está, para uso e adaptação livre por pequenos comerciantes
angolanos.
