'use client';
import { usePathname, useRouter } from '@/i18n/routing';
import { useTheme } from '@/lib/theme';
import { Globe, Sun, Moon } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();

  return (
    <header className="h-14 border-b flex items-center justify-end px-6 shrink-0 gap-3 transition-colors"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-card) 85%, transparent)',
        borderColor: 'var(--border-soft)',
        backdropFilter: 'blur(8px)',
      }}>

      {/* Toggle dark/light */}
      <button
        onClick={toggle}
        className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95"
        style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-2)' }}
        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      >
        {theme === 'dark'
          ? <Sun size={15} className="text-amber-400" />
          : <Moon size={15} className="text-teal-600" />}
      </button>

      {/* Selector de idioma */}
      <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border text-xs"
        style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-soft)', color: 'var(--text-2)' }}>
        <Globe size={12} className="text-teal-500" />
        <button
          onClick={() => router.replace(pathname, { locale: 'es' })}
          className="font-semibold px-1.5 py-0.5 rounded-lg hover:text-teal-600 transition-colors"
        >
          ES
        </button>
        <span className="opacity-30">|</span>
        <button
          onClick={() => router.replace(pathname, { locale: 'en' })}
          className="font-semibold px-1.5 py-0.5 rounded-lg hover:text-teal-600 transition-colors"
        >
          EN
        </button>
      </div>
    </header>
  );
}
