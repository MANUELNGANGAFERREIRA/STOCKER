import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  metadataBase: new URL('https://conexore.vercel.app'),
  alternates: {
    canonical: '/',
  },
  title: 'Conexore Angola | Gestão de Stock e Inventário',
  description: 'Conexore é um sistema de gestão de stock em Angola para controlar produtos, entradas, saídas, inventário, custos e vendas num só lugar.',
  applicationName: 'Conexore',
  keywords: [
    'Conexore Angola',
    'Conexore Stock',
    'Conexore gestão de stock',
    'gestão de stock em Angola',
    'software de gestão de stock Angola',
    'sistema de controlo de stock',
    'gestão de inventário Angola',
    'controlo de stock para lojas',
    'gestão de armazém',
    'entradas e saídas de produtos',
    'custo unitário médio ponderado CUMP',
    'software para pequenos negócios angolanos',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_AO',
    siteName: 'Conexore',
    url: 'https://conexore.vercel.app/',
    title: 'Conexore Angola | Gestão de Stock e Inventário',
    description: 'Controle stock, entradas, saídas e inventário do seu negócio em Angola com o Conexore.',
  },
  twitter: {
    card: 'summary',
    title: 'Conexore Angola | Gestão de Stock e Inventário',
    description: 'Gestão de stock, inventário, compras e vendas para pequenos negócios angolanos.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: 'hh9fuKGxf5LFrQtdRRQ6eQVGQ5myXx03397coar2PE4',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1E40AF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO">
      <body className="bg-bgapp text-gray-900 antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
