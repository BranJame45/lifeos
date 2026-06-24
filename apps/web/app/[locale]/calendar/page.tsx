'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useApiData } from '@/lib/useApiData';
import { ChevronLeft, ChevronRight, Utensils, Dumbbell, CheckSquare } from 'lucide-react';

type View = 'day' | 'week' | 'month';

interface DayBucket {
  habits: number;
  workouts: number;
  meals: number;
  completed: number;
  planned: number;
}

interface MonthView {
  month: number;
  year: number;
  days: Record<string, DayBucket>;
}

interface DayView {
  date: string;
  meals: Array<{ id: string; type: string; description: string; completed: boolean }>;
  workoutSessions: Array<{ id: string; muscleGroup: string; completed: boolean; exercises: { id: string }[] }>;
  habits: Array<{ id: string; habit: { name: string; color: string } }>;
}

interface WeekView {
  weekStart: string;
  days: DayView[];
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const mon = new Date(d);
  mon.setDate(diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function useIntlLocale() {
  const locale = useLocale();
  return locale === 'en' ? 'en-US' : 'es-PE';
}

export default function CalendarPage() {
  const t = useTranslations('calendar');
  const intlLocale = useIntlLocale();
  const now = new Date();

  const [view, setView] = useState<View>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dayDate, setDayDate] = useState<Date>(new Date());
  const [weekFrom, setWeekFrom] = useState<Date>(getMonday(new Date()));

  const todayStr = ymd(now);

  // Una clave por vista; las inactivas son null (el hook no hace nada).
  // Cada mes/semana/día se cachea por su query exacta -> volver es instantáneo.
  const monthKey = view === 'month' ? `/calendar/month?month=${month}&year=${year}` : null;
  const dayKey = view === 'day' ? `/calendar/day?date=${ymd(dayDate)}` : null;
  const weekKey = view === 'week' ? `/calendar/week?from=${ymd(weekFrom)}` : null;

  const { data: monthData, loading: lm } = useApiData<MonthView>(monthKey);
  const { data: dayData, loading: ld } = useApiData<DayView>(dayKey);
  const { data: weekData, loading: lw } = useApiData<WeekView>(weekKey);
  const loading = view === 'month' ? lm : view === 'day' ? ld : lw;

  function step(dir: number) {
    if (view === 'month') {
      let m = month + dir, y = year;
      if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
      setMonth(m); setYear(y);
    } else if (view === 'day') {
      const d = new Date(dayDate); d.setDate(d.getDate() + dir); setDayDate(d);
    } else {
      const d = new Date(weekFrom); d.setDate(d.getDate() + dir * 7); setWeekFrom(d);
    }
  }

  const periodLabel =
    view === 'month'
      ? new Date(year, month - 1, 1).toLocaleDateString(intlLocale, { month: 'long', year: 'numeric' })
      : view === 'day'
      ? dayDate.toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long' })
      : `${weekFrom.toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })} — ${new Date(weekFrom.getFullYear(), weekFrom.getMonth(), weekFrom.getDate() + 6).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })}`;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(['day', 'week', 'month'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 font-medium transition-colors ${
                view === v ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t(v)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => step(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <h2 className="font-semibold text-gray-800 capitalize">{periodLabel}</h2>
          <button onClick={() => step(1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => <div key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />)}
          </div>
        ) : view === 'month' ? (
          <MonthGrid monthData={monthData ?? null} year={year} month={month} todayStr={todayStr} />
        ) : view === 'week' ? (
          <WeekList weekData={weekData ?? null} todayStr={todayStr} />
        ) : (
          <DayDetail dayData={dayData ?? null} />
        )}
      </div>
    </div>
  );
}

function dayColor(data: DayBucket | undefined, dateKey: string, todayStr: string): string {
  if (!data || (data.planned === 0 && data.completed === 0)) return 'bg-gray-50';
  if (dateKey > todayStr) return 'bg-blue-50'; // planificado, aún no vencido
  const ratio = data.planned > 0 ? data.completed / data.planned : data.completed > 0 ? 1 : 0;
  if (ratio >= 1) return 'bg-emerald-400';
  if (ratio > 0) return 'bg-amber-300';
  return 'bg-red-300';
}

function MonthGrid({ monthData, year, month, todayStr }: {
  monthData: MonthView | null; year: number; month: number; todayStr: string;
}) {
  const t = useTranslations('calendar');
  const intlLocale = useIntlLocale();
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayRaw = new Date(year, month - 1, 1).getDay();
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1; // Mon=0

  return (
    <>
      <div className="grid grid-cols-7 mb-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="text-center text-xs font-semibold text-gray-400 pb-2 capitalize">
            {new Date(2024, 0, i + 1).toLocaleDateString(intlLocale, { weekday: 'short' })}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const data = monthData?.days[dateKey];
          const isToday = dateKey === todayStr;
          return (
            <div
              key={day}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${dayColor(data, dateKey, todayStr)} ${
                isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
              }`}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-emerald-700 font-bold' : data ? 'text-gray-700' : 'text-gray-400'}`}>{day}</span>
              {data && data.habits + data.workouts + data.meals > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {data.habits > 0 && <div className="w-1 h-1 rounded-full bg-purple-400" />}
                  {data.workouts > 0 && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                  {data.meals > 0 && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100 flex-wrap">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-xs text-gray-500">{t('complete')}</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-300" /><span className="text-xs text-gray-500">{t('partial')}</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-300" /><span className="text-xs text-gray-500">{t('none')}</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-50 border border-gray-200" /><span className="text-xs text-gray-500">{t('upcoming')}</span></div>
      </div>
    </>
  );
}

function WeekList({ weekData, todayStr }: { weekData: WeekView | null; todayStr: string }) {
  const t = useTranslations('calendar');
  const intlLocale = useIntlLocale();
  if (!weekData) return <p className="text-sm text-gray-400 text-center py-8">{t('noData')}</p>;
  return (
    <div className="space-y-2">
      {weekData.days.map((day) => {
        const d = new Date(day.date);
        const isToday = day.date.split('T')[0] === todayStr;
        return (
          <div key={day.date} className={`rounded-lg border p-3 ${isToday ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200'}`}>
            <p className="text-sm font-semibold text-gray-700 capitalize mb-2">
              {d.toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric' })}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1"><Dumbbell size={12} className="text-blue-500" />
                {day.workoutSessions.map((s) => s.muscleGroup).join(', ') || '—'}
              </span>
              <span className="flex items-center gap-1"><Utensils size={12} className="text-emerald-500" />{day.meals.length} {t('meals')}</span>
              <span className="flex items-center gap-1"><CheckSquare size={12} className="text-purple-500" />{day.habits.length} {t('habits')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayDetail({ dayData }: { dayData: DayView | null }) {
  const t = useTranslations('calendar');
  if (!dayData) return <p className="text-sm text-gray-400 text-center py-8">{t('noData')}</p>;
  return (
    <div className="space-y-4">
      <Section icon={<Utensils size={14} className="text-emerald-500" />} title={t('meals')}>
        {dayData.meals.length === 0 ? <Empty /> : dayData.meals.map((m) => (
          <li key={m.id} className={`text-sm ${m.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{m.description}</li>
        ))}
      </Section>
      <Section icon={<Dumbbell size={14} className="text-blue-500" />} title={t('exercise')}>
        {dayData.workoutSessions.length === 0 ? <Empty /> : dayData.workoutSessions.map((s) => (
          <li key={s.id} className="text-sm text-gray-700">{s.muscleGroup} · {s.exercises.length} ej.</li>
        ))}
      </Section>
      <Section icon={<CheckSquare size={14} className="text-purple-500" />} title={t('habits')}>
        {dayData.habits.length === 0 ? <Empty /> : dayData.habits.map((h) => (
          <li key={h.id} className="text-sm text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.habit.color }} />{h.habit.name}
          </li>
        ))}
      </Section>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">{icon}<span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</span></div>
      <ul className="space-y-1 pl-1">{children}</ul>
    </div>
  );
}

function Empty() {
  const t = useTranslations('calendar');
  return <li className="text-sm text-gray-300">{t('noActivity')}</li>;
}
