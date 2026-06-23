'use client';
import { useTranslations, usePathname, useRouter } from '@/i18n/routing';
import {
  Sun, Calendar, Apple, Dumbbell, CheckSquare,
  ShoppingCart, BarChart3, MessageSquare, Settings,
} from 'lucide-react';

const navItems = [
  { href: '/today', icon: Sun, labelKey: 'today' },
  { href: '/calendar', icon: Calendar, labelKey: 'calendar' },
  { href: '/nutrition', icon: Apple, labelKey: 'nutrition' },
  { href: '/workout', icon: Dumbbell, labelKey: 'workout' },
  { href: '/habits', icon: CheckSquare, labelKey: 'habits' },
  { href: '/shopping', icon: ShoppingCart, labelKey: 'shopping' },
  { href: '/reports', icon: BarChart3, labelKey: 'reports' },
  { href: '/chat', icon: MessageSquare, labelKey: 'chat' },
];

export default function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-emerald-600">LifeOS</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              {t(item.labelKey)}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => router.push('/setup')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Settings size={18} />
          {t('setup')}
        </button>
      </div>
    </aside>
  );
}
