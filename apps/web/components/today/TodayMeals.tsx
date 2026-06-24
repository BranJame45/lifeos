'use client';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/useApiData';
import { Apple, Check } from 'lucide-react';

interface Meal {
  id: string;
  type: string;
  description: string;
  completed: boolean;
  date: string;
}

interface MealPlan { meals: Meal[] }

const TYPE_ORDER = ['breakfast', 'snack', 'lunch', 'dinner'];

export default function TodayMeals() {
  const t = useTranslations('today');
  const { data: plan, loading, mutate } = useApiData<MealPlan | null>('/meal-plans/current');

  const todayStr = new Date().toISOString().split('T')[0];
  const meals = (plan?.meals ?? [])
    .filter((m) => new Date(m.date).toISOString().split('T')[0] === todayStr)
    .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));

  async function toggleMeal(id: string) {
    const flip = (p: MealPlan | null | undefined): MealPlan | null =>
      p ? { ...p, meals: p.meals.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)) } : null;
    // Optimista: actualiza UI + caché al instante.
    mutate((prev) => flip(prev) as MealPlan);
    try {
      await api.patch(`/meal-plans/meal/${id}`, {});
    } catch {
      mutate((prev) => flip(prev) as MealPlan);
    }
  }

  const typeLabel: Record<string, string> = {
    breakfast: t('breakfast'),
    lunch: t('lunch'),
    snack: t('snack'),
    dinner: t('dinner'),
  };

  const completedCount = meals.filter((m) => m.completed).length;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Apple size={18} className="text-emerald-600" />
          <h2 className="text-base font-semibold">{t('meals')}</h2>
        </div>
        {meals.length > 0 && (
          <span className="text-xs font-medium text-gray-500">
            {completedCount}/{meals.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : meals.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('noMeals')}</p>
      ) : (
        <div className="space-y-2">
          {meals.map((meal) => (
            <button
              key={meal.id}
              onClick={() => toggleMeal(meal.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                meal.completed
                  ? 'bg-emerald-50 border-emerald-200 opacity-75'
                  : 'bg-gray-50 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wide w-16 shrink-0 ${
                  meal.completed ? 'text-emerald-600' : 'text-emerald-500'
                }`}
              >
                {typeLabel[meal.type] || meal.type}
              </span>
              <span
                className={`text-sm flex-1 ${meal.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}
              >
                {meal.description}
              </span>
              {meal.completed && <Check size={14} className="text-emerald-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
