'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Plus, Trash2, Flame, X } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  category: string;
  color: string;
  streak: number;
  target: string | null;
  frequency: string[];
  active: boolean;
}

const CATEGORIES = ['health', 'study', 'personal', 'work', 'other'];
const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const defaultForm = {
  name: '',
  category: 'health',
  color: '#10B981',
  frequency: ['daily'],
  target: '',
};

export default function HabitsPage() {
  const t = useTranslations('habits');
  const tc = useTranslations('common');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadHabits();
  }, []);

  async function loadHabits() {
    try {
      const data = await api.get<Habit[]>('/habits');
      setHabits(data);
    } catch {}
    setLoading(false);
  }

  async function createHabit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const newHabit = await api.post<Habit>('/habits', {
        name: form.name,
        category: form.category,
        color: form.color,
        frequency: form.frequency,
        target: form.target || null,
      });
      setHabits((prev) => [...prev, newHabit]);
      setForm(defaultForm);
      setShowForm(false);
    } catch {}
    setSaving(false);
  }

  async function deleteHabit(id: string) {
    try {
      await api.delete(`/habits/${id}`);
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch {}
  }

  function toggleFrequencyDay(day: string) {
    setForm((prev) => {
      if (prev.frequency.includes('daily')) return { ...prev, frequency: [day] };
      const has = prev.frequency.includes(day);
      const next = has ? prev.frequency.filter((d) => d !== day) : [...prev.frequency, day];
      return { ...prev, frequency: next.length === 0 ? ['daily'] : next };
    });
  }

  const categoryLabel: Record<string, string> = {
    health: t('categories.health'),
    study: t('categories.study'),
    personal: t('categories.personal'),
    work: t('categories.work'),
    other: t('categories.other'),
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} />
          {t('add')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">{t('add')}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={createHabit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('name')}</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{t('category')}</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{categoryLabel[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">{t('target')}</label>
                <input
                  value={form.target}
                  onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))}
                  placeholder={t('targetPlaceholder')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">{t('color')}</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, color: c }))}
                    className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">{t('frequency')}</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, frequency: ['daily'] }))}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    form.frequency.includes('daily')
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-emerald-300'
                  }`}
                >
                  {t('daily')}
                </button>
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleFrequencyDay(day)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      !form.frequency.includes('daily') && form.frequency.includes(day)
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-emerald-300'
                    }`}
                  >
                    {tc(day)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {saving ? tc('loading') : tc('save')}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                {tc('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-200" />)}
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckSquarePlaceholder />
          <p className="mt-3 text-sm">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-300 transition-colors group"
            >
              <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-800 truncate">{habit.name}</p>
                <p className="text-xs text-gray-400">
                  {categoryLabel[habit.category] || habit.category}
                  {habit.target && ` · ${habit.target}`}
                  {' · '}
                  {habit.frequency.includes('daily') ? t('daily') : habit.frequency.map((d) => tc(d)).join(', ')}
                </p>
              </div>
              {habit.streak > 0 && (
                <div className="flex items-center gap-1">
                  <Flame size={14} className="text-orange-400" />
                  <span className="text-sm font-semibold text-orange-500">{habit.streak}</span>
                </div>
              )}
              <button
                onClick={() => deleteHabit(habit.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckSquarePlaceholder() {
  return (
    <div className="flex justify-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
        <span className="text-3xl">✓</span>
      </div>
    </div>
  );
}
