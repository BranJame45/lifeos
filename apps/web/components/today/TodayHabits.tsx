'use client';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/useApiData';
import { CheckSquare, Check, Flame } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  category: string;
  color: string;
  streak: number;
  target: string | null;
  completed: boolean;
}

export default function TodayHabits() {
  const t = useTranslations('today');
  const { data, loading, mutate } = useApiData<Habit[]>('/habits/today');
  const habits = data ?? [];

  const flip = (h: Habit): Habit =>
    h.completed
      ? { ...h, completed: false, streak: h.streak - 1 }
      : { ...h, completed: true, streak: h.streak + 1 };

  async function toggleHabit(id: string) {
    // Optimista: actualiza UI + caché al instante.
    mutate((prev) => (prev ?? []).map((h) => (h.id === id ? flip(h) : h)));
    try {
      await api.post(`/habits/${id}/log`, {});
    } catch {
      // Revertir si falla.
      mutate((prev) => (prev ?? []).map((h) => (h.id === id ? flip(h) : h)));
    }
  }

  const completedCount = habits.filter((h) => h.completed).length;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare size={18} className="text-purple-600" />
          <h2 className="text-base font-semibold">{t('habits')}</h2>
        </div>
        {habits.length > 0 && (
          <span className="text-xs font-medium text-gray-500">
            {completedCount}/{habits.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('noHabits')}</p>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <button
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                habit.completed
                  ? 'bg-purple-50 border-purple-200 opacity-75'
                  : 'bg-gray-50 border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: habit.color || '#8B5CF6' }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${habit.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {habit.name}
                </p>
                {habit.target && (
                  <p className="text-xs text-gray-500 truncate">{habit.target}</p>
                )}
              </div>
              {habit.streak > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <Flame size={12} className="text-orange-400" />
                  <span className="text-xs font-medium text-orange-500">{habit.streak}</span>
                </div>
              )}
              {habit.completed && <Check size={14} className="text-purple-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
