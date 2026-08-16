import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'ContaFácil AO - Gestão de Stock',
  description: 'Sistema de gestão de stock simples para pequenos comerciantes angolanos',
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
