'use client';
import { usePathname, useRouter } from '@/i18n/routing';
import { Globe } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-2">
        <Globe size={16} className="text-gray-400" />
        <button onClick={() => router.replace(pathname, { locale: 'es' })} className="text-sm px-2 py-1 rounded hover:bg-gray-100">ES</button>
        <span className="text-gray-300">|</span>
        <button onClick={() => router.replace(pathname, { locale: 'en' })} className="text-sm px-2 py-1 rounded hover:bg-gray-100">EN</button>
      </div>
    </header>
  );
}
