'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Save, Check } from 'lucide-react';

interface Profile {
  name: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  goal: 'DEFICIT' | 'VOLUME';
  activityLevel: 'SEDENTARY' | 'MODERATE' | 'ACTIVE';
  restrictions: string[];
  mealPreferences: string[];
  trainingDays: string[];
  trainingType: 'GYM' | 'CALISTHENICS' | 'BOTH';
}

const MEAL_PREFS = ['breakfast', 'snack', 'lunch', 'dinner'];
const TRAINING_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const RESTRICTIONS = ['vegetariano', 'vegano', 'sin gluten', 'sin lácteos', 'sin cerdo', 'sin mariscos'];

export default function SetupPage() {
  const t = useTranslations('setup');
  const tc = useTranslations('common');
  const [profile, setProfile] = useState<Profile>({
    name: '', age: null, weight: null, height: null,
    goal: 'DEFICIT', activityLevel: 'MODERATE',
    restrictions: [], mealPreferences: ['breakfast', 'lunch', 'dinner'],
    trainingDays: ['mon', 'wed', 'fri'], trainingType: 'BOTH',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customRestriction, setCustomRestriction] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await api.get<Profile>('/profile');
      setProfile(data);
    } catch {}
    setLoading(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/profile', profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  }

  function toggleArray(key: keyof Profile, value: string) {
    setProfile((p) => {
      const arr = p[key] as string[];
      const has = arr.includes(value);
      return { ...p, [key]: has ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  }

  function addCustomRestriction() {
    const value = customRestriction.trim();
    if (!value) return;
    setProfile((p) => (p.restrictions.includes(value) ? p : { ...p, restrictions: [...p.restrictions, value] }));
    setCustomRestriction('');
  }

  const mealPrefLabel: Record<string, string> = {
    breakfast: t('breakfast'), snack: t('snack'),
    lunch: t('lunch'), dinner: t('dinner'),
  };

  if (loading) {
    return <div className="max-w-xl space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-200" />)}</div>;
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <form onSubmit={saveProfile} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide text-gray-500">{t('sectionPersonal')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('name')}</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('age')}</label>
              <input
                type="number"
                value={profile.age || ''}
                onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value ? Number(e.target.value) : null }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('weight')}</label>
              <input
                type="number"
                step="0.1"
                value={profile.weight || ''}
                onChange={(e) => setProfile((p) => ({ ...p, weight: e.target.value ? Number(e.target.value) : null }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('height')}</label>
              <input
                type="number"
                value={profile.height || ''}
                onChange={(e) => setProfile((p) => ({ ...p, height: e.target.value ? Number(e.target.value) : null }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-500">{t('sectionGoals')}</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">{t('goal')}</label>
            <div className="flex gap-2">
              {(['DEFICIT', 'VOLUME'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setProfile((p) => ({ ...p, goal: g }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    profile.goal === g ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-600 hover:border-emerald-300'
                  }`}
                >
                  {g === 'DEFICIT' ? t('deficit') : t('volume')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">{t('activityLevel')}</label>
            <div className="flex gap-2">
              {(['SEDENTARY', 'MODERATE', 'ACTIVE'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setProfile((p) => ({ ...p, activityLevel: level }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    profile.activityLevel === level ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-600 hover:border-emerald-300'
                  }`}
                >
                  {level === 'SEDENTARY' ? t('sedentary') : level === 'MODERATE' ? t('moderate') : t('active')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Nutrition */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-500">{t('sectionNutrition')}</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">{t('mealPreferences')}</label>
            <div className="flex flex-wrap gap-2">
              {MEAL_PREFS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleArray('mealPreferences', m)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    profile.mealPreferences.includes(m) ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-600 hover:border-emerald-300'
                  }`}
                >
                  {mealPrefLabel[m]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">{t('restrictions')}</label>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...RESTRICTIONS, ...profile.restrictions])).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleArray('restrictions', r)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    profile.restrictions.includes(r) ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-gray-300 text-gray-600 hover:border-orange-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                value={customRestriction}
                onChange={(e) => setCustomRestriction(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomRestriction(); } }}
                placeholder={t('addRestriction')}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                type="button"
                onClick={addCustomRestriction}
                className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {tc('add')}
              </button>
            </div>
          </div>
        </div>

        {/* Training */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-500">{t('sectionTraining')}</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">{t('trainingDays')}</label>
            <div className="flex gap-1.5">
              {TRAINING_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleArray('trainingDays', day)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    profile.trainingDays.includes(day) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-500 hover:border-blue-300'
                  }`}
                >
                  {tc(day)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">{t('trainingType')}</label>
            <div className="flex gap-2">
              {(['GYM', 'CALISTHENICS', 'BOTH'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProfile((p) => ({ ...p, trainingType: type }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    profile.trainingType === type ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {type === 'GYM' ? t('gym') : type === 'CALISTHENICS' ? t('calisthenics') : t('both')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-70 transition-colors"
        >
          {saved ? <><Check size={16} /> {t('saved')}</> : saving ? tc('loading') : <><Save size={16} /> {t('save')}</>}
        </button>
      </form>
    </div>
  );
}
