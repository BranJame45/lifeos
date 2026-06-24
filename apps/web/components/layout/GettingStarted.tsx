'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useApiData } from '@/lib/useApiData';
import { Check, Circle, Sparkles, X } from 'lucide-react';

const STORAGE_KEY = 'lifeos_onboarding_dismissed';

/**
 * Checklist "Primeros pasos" en el sidebar. Detecta el progreso real del
 * usuario (rutina, plan de comidas, hábitos) reusando la caché compartida,
 * así no agrega latencia. Se auto-oculta cuando todo está hecho (descartable).
 */
export default function GettingStarted() {
  const t = useTranslations('onboarding');
  const router = useRouter();

  // Mismas claves que usan las páginas -> comparten caché (cero costo extra).
  const { data: workout } = useApiData<{ id: string } | null>('/workout-plans/current');
  const { data: meal } = useApiData<{ id: string } | null>('/meal-plans/current');
  const { data: habits } = useApiData<unknown[]>('/habits');

  const [dismissed, setDismissed] = useState(true); // oculto hasta leer localStorage
  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  const steps = [
    { key: 'workout', done: !!workout, href: '/workout' as const },
    { key: 'meals', done: !!meal, href: '/nutrition' as const },
    { key: 'habits', done: Array.isArray(habits) && habits.length > 0, href: '/habits' as const },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="mx-3 mb-2 rounded-xl bg-teal-800/30 border border-teal-700/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-teal-100 flex items-center gap-1.5">
          <Sparkles size={12} className="text-teal-300" />
          {t('title')}
        </span>
        {allDone && (
          <button onClick={dismiss} title={t('dismiss')} className="text-teal-400 hover:text-teal-100 transition-colors">
            <X size={13} />
          </button>
        )}
      </div>

      {allDone ? (
        <p className="text-[11px] text-teal-300">{t('allDone')}</p>
      ) : (
        <>
          <div className="h-1 bg-teal-900/60 rounded-full mb-2.5 overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all duration-300"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-0.5">
            {steps.map((s) => (
              <li key={s.key}>
                <button
                  onClick={() => router.push(s.href)}
                  onMouseEnter={() => router.prefetch(s.href)}
                  className="w-full flex items-center gap-2 text-left text-[11px] py-0.5 rounded hover:bg-teal-800/40 px-1 -mx-1 transition-colors"
                >
                  {s.done ? (
                    <Check size={13} className="text-teal-300 shrink-0" />
                  ) : (
                    <Circle size={13} className="text-teal-500 shrink-0" />
                  )}
                  <span className={s.done ? 'text-teal-400 line-through' : 'text-teal-100'}>{t(s.key)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
