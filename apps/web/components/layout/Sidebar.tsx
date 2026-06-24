'use client';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  Sun, Calendar, Apple, Dumbbell, CheckSquare,
  ShoppingCart, BarChart3, MessageSquare, Settings,
} from 'lucide-react';
import GettingStarted from './GettingStarted';

const navItems = [
  { href: '/today',     icon: Sun,          labelKey: 'today' },
  { href: '/calendar',  icon: Calendar,     labelKey: 'calendar' },
  { href: '/nutrition', icon: Apple,        labelKey: 'nutrition' },
  { href: '/workout',   icon: Dumbbell,     labelKey: 'workout' },
  { href: '/habits',    icon: CheckSquare,  labelKey: 'habits' },
  { href: '/shopping',  icon: ShoppingCart, labelKey: 'shopping' },
  { href: '/reports',   icon: BarChart3,    labelKey: 'reports' },
  { href: '/chat',      icon: MessageSquare,labelKey: 'chat' },
];

export default function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-60 flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0f4f4a 0%, #0a3b37 100%)' }}>

      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #2dd4bf, #14b8a6)' }}>
          <span className="text-white text-sm font-black">L</span>
        </div>
        <div>
          <span className="text-white font-bold text-base tracking-wide">LifeOS</span>
          <p className="text-teal-400 text-[10px] font-medium leading-none mt-0.5">lifestyle · os</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-teal-800/60 mb-2" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              onMouseEnter={() => router.prefetch(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'text-teal-300/80 hover:text-teal-100 hover:bg-teal-800/40'
              }`}
              style={isActive ? {
                background: 'linear-gradient(90deg, rgba(45,212,191,0.22) 0%, rgba(45,212,191,0.08) 100%)',
                boxShadow: 'inset 3px 0 0 #2dd4bf',
              } : undefined}
            >
              <Icon size={17} className={isActive ? 'text-teal-300' : ''} />
              {t(item.labelKey)}
            </button>
          );
        })}
      </nav>

      {/* Primeros pasos (se auto-oculta al completar) */}
      <GettingStarted />

      {/* Divider */}
      <div className="mx-4 h-px bg-teal-800/60 mt-1" />

      {/* Setup */}
      <div className="px-3 py-3">
        <button
          onClick={() => router.push('/setup')}
          onMouseEnter={() => router.prefetch('/setup')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-teal-300/80 hover:text-teal-100 hover:bg-teal-800/40 transition-all duration-150"
        >
          <Settings size={17} />
          {t('setup')}
        </button>
      </div>
    </aside>
  );
}
