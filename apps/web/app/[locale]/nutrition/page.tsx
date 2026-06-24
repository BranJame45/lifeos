'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { Sparkles, Check, RefreshCw, ShoppingCart } from 'lucide-react';

interface Meal {
  id: string;
  type: string;
  description: string;
  completed: boolean;
  date: string;
}

interface MealPlan {
  id: string;
  weekStart: string;
  weekEnd: string;
  confirmed: boolean;
  meals: Meal[];
}

const TYPE_ORDER = ['breakfast', 'snack', 'lunch', 'dinner'];

function groupByDay(meals: Meal[]) {
  const groups: Record<string, Meal[]> = {};
  for (const meal of meals) {
    const d = new Date(meal.date).toISOString().split('T')[0];
    if (!groups[d]) groups[d] = [];
    groups[d].push(meal);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, meals]) => ({
      date,
      meals: meals.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)),
    }));
}

export default function NutritionPage() {
  const t = useTranslations('nutrition');
  const tc = useTranslations('common');
  const tt = useTranslations('today');
  const locale = useLocale();
  const intlLocale = locale === 'en' ? 'en-US' : 'es-PE';

  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [preview, setPreview] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [generatingShop, setGeneratingShop] = useState(false);
  const [period, setPeriod] = useState<'weekly' | 'biweekly'>('weekly');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [current, prev] = await Promise.all([
        api.get<MealPlan | null>('/meal-plans/current').catch(() => null),
        api.get<MealPlan | null>('/meal-plans/preview').catch(() => null),
      ]);
      setPlan(current);
      setPreview(prev);
    } catch {}
    setLoading(false);
  }

  async function generatePlan() {
    setGenerating(true);
    try {
      const res = await api.post<{ plan: MealPlan }>('/meal-plans/generate', {
        weeks: period === 'biweekly' ? 2 : 1,
      });
      setPreview(res.plan);
      setPlan(null);
    } catch {}
    setGenerating(false);
  }

  async function confirmPlan() {
    if (!preview) return;
    setConfirming(true);
    try {
      const confirmed = await api.post<MealPlan>(`/meal-plans/confirm/${preview.id}`, {});
      setPlan(confirmed);
      setPreview(null);
    } catch {}
    setConfirming(false);
  }

  async function toggleMeal(id: string) {
    if (!plan) return;
    try {
      await api.patch(`/meal-plans/meal/${id}`, {});
      setPlan((p) => p ? { ...p, meals: p.meals.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)) } : p);
    } catch {}
  }

  async function generateShoppingList() {
    if (!plan) return;
    setGeneratingShop(true);
    try {
      await api.post(`/shopping-list/generate/${plan.id}`, {});
      alert(t('shoppingGenerated'));
    } catch {}
    setGeneratingShop(false);
  }

  const typeLabel: Record<string, string> = {
    breakfast: tt('breakfast'),
    lunch: tt('lunch'),
    snack: tt('snack'),
    dinner: tt('dinner'),
  };

  const dayLabel = (date: string) =>
    new Date(date + 'T12:00:00').toLocaleDateString(intlLocale, { weekday: 'short', day: 'numeric' });

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-200" />)}</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(['weekly', 'biweekly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  period === p ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p === 'weekly' ? t('weekly') : t('biweekly')}
              </button>
            ))}
          </div>
          <button
            onClick={generatePlan}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-70 transition-colors"
          >
            {generating ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {generating ? t('generating') : plan ? t('regenerate') : t('generate')}
          </button>
        </div>
      </div>

      {preview && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-amber-800">{t('pendingConfirmation')}</p>
              <p className="text-sm text-amber-600 mt-0.5">{t('pendingHint')}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={generatePlan}
                disabled={generating}
                className="px-3 py-1.5 border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
              >
                {t('regenerate')}
              </button>
              <button
                onClick={confirmPlan}
                disabled={confirming}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-70 transition-colors"
              >
                {confirming ? tc('loading') : t('confirm')}
              </button>
            </div>
          </div>
          <PlanView days={groupByDay(preview.meals)} typeLabel={typeLabel} dayLabel={dayLabel} onToggle={() => {}} readOnly />
        </div>
      )}

      {plan ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {t('weekOf')} {new Date(plan.weekStart.split('T')[0] + 'T12:00:00').toLocaleDateString(intlLocale, { day: 'numeric', month: 'long' })}
            </p>
            <button
              onClick={generateShoppingList}
              disabled={generatingShop}
              className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium hover:underline disabled:opacity-50"
            >
              <ShoppingCart size={14} />
              {generatingShop ? t('generating') : t('generateShopping')}
            </button>
          </div>
          <PlanView days={groupByDay(plan.meals)} typeLabel={typeLabel} dayLabel={dayLabel} onToggle={toggleMeal} />
        </>
      ) : !preview && !plan ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🥗</span>
          </div>
          <p className="text-sm">{t('noPlan')}</p>
          <p className="text-xs mt-1">{t('noPlanHint')}</p>
        </div>
      ) : null}
    </div>
  );
}

function PlanView({ days, typeLabel, dayLabel, onToggle, readOnly = false }: {
  days: ReturnType<typeof groupByDay>;
  typeLabel: Record<string, string>;
  dayLabel: (date: string) => string;
  onToggle: (id: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-4">
      {days.map(({ date, meals }) => (
        <div key={date} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700 capitalize">{dayLabel(date)}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {meals.map((meal) => (
              <button
                key={meal.id}
                onClick={() => !readOnly && onToggle(meal.id)}
                disabled={readOnly}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  meal.completed ? 'bg-emerald-50' : readOnly ? 'cursor-default' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wide w-16 shrink-0 ${meal.completed ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {typeLabel[meal.type] || meal.type}
                </span>
                <span className={`text-sm flex-1 ${meal.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {meal.description}
                </span>
                {meal.completed && <Check size={14} className="text-emerald-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
