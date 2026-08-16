'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
  const [sidebarAberta, setSidebarAberta] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-bgapp">
        <Sidebar aberta={sidebarAberta} aoFechar={() => setSidebarAberta(false)} />

        <div className="flex-1 min-w-0 flex flex-col">
          <Header aoAbrirMenu={() => setSidebarAberta(true)} />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
