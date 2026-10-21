/** @type {import('next').NextConfig} */
// Configuração para EXPORTAÇÃO ESTÁTICA - obrigatório porque não usamos
// API Routes do Next.js. Toda a lógica de servidor fica nas Firebase
// Cloud Functions. Isto permite fazer deploy em Cloudflare Pages, que
// serve apenas ficheiros estáticos.
const nextConfig = {
  // Diretório isolado evita conflitos de leitura/escrita do manifesto no Windows.
  distDir: '.next-conexore',
  output: 'export',
  // Necessário porque a exportação estática não suporta o otimizador
  // de imagens do Next.js (que precisa de um servidor a correr).
  images: {
    unoptimized: true,
  },
  // Garante que cada página gera um ficheiro index.html dentro da sua
  // própria pasta (ex: /produtos/index.html), o que funciona melhor
  // com hospedagem estática como o Cloudflare Pages.
  trailingSlash: true,
  reactStrictMode: true,
};

module.exports = nextConfig;
