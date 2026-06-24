'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const isAuthPage = pathname === '/login';

  useEffect(() => {
    if (isAuthPage) {
      setReady(true);
      return;
    }
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      setReady(true);
    }
  }, [isAuthPage]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--bg-app)' }}>{children}</main>
      </div>
    </div>
  );
}
