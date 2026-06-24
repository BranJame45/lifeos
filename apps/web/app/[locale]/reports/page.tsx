'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/useApiData';
import { useTheme } from '@/lib/theme';
import { Flame, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface HabitStreak { id: string; name: string; streak: number; color: string }

interface WeeklyReport {
  weekStart: string;
  habits: { total: number; completed: number; percentage: number };
  meals: { total: number; completed: number; percentage: number };
  workouts: { total: number; completed: number; percentage: number };
  habitStreaks: HabitStreak[];
  dailyData: Array<{ date: string; habits: number; meals: number; workouts: number }>;
}

interface Comparison {
  week1: WeeklyReport;
  week2: WeeklyReport;
  deltas: { habits: number; meals: number; workouts: number };
}

function getMonday(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const mon = new Date(d);
  mon.setDate(diff);
  return mon.toISOString().split('T')[0];
}

function StatCard({ label, percentage, completed, total, color }: {
  label: string; percentage: number; completed: number; total: number; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <div className="flex items-end justify-between mb-3">
        <p className="text-3xl font-bold" style={{ color }}>{percentage}%</p>
        <p className="text-xs text-gray-400">{completed}/{total}</p>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="inline-flex items-center gap-0.5 text-gray-400 text-xs"><Minus size={12} /> 0%</span>;
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{up ? '+' : ''}{value}%
    </span>
  );
}

export default function ReportsPage() {
  const t = useTranslations('reports');
  const locale = useLocale();
  const intlLocale = locale === 'en' ? 'en-US' : 'es-PE';
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Recharts colors that adapt to the current theme
  const chartColors = {
    grid: isDark ? '#1e293b' : '#e2e8f0',
    axisTick: isDark ? '#64748b' : '#475569',
    tooltipBg: isDark ? '#1a2540' : '#ffffff',
    tooltipBorder: isDark ? '#2a3a56' : '#e2e8f0',
    tooltipText: isDark ? '#e2e8f0' : '#0f172a',
    legendText: isDark ? '#94a3b8' : '#475569',
  };

  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Reporte y resumen IA cacheados por semana -> revisitar es instantáneo
  // (el resumen IA de Groq es lo más caro de regenerar, así que cachearlo pesa).
  const { data: report, loading } = useApiData<WeeklyReport>(`/reports/weekly?weekStart=${weekStart}`);
  const { data: summaryData, loading: summaryLoading } = useApiData<{ summary: string }>(
    `/reports/summary?weekStart=${weekStart}&locale=${locale}`,
  );
  const summary = summaryData?.summary ?? null;

  // Al cambiar de semana, oculta el comparativo previo.
  useEffect(() => {
    setComparison(null);
    setShowComparison(false);
  }, [weekStart]);

  async function loadComparison() {
    if (showComparison) { setShowComparison(false); return; }
    setShowComparison(true);
    if (comparison) return;
    const prev = new Date(weekStart + 'T12:00:00');
    prev.setDate(prev.getDate() - 7);
    const prevStr = prev.toISOString().split('T')[0];
    try {
      const data = await api.get<Comparison>(`/reports/comparison?week1=${prevStr}&week2=${weekStart}`);
      setComparison(data);
    } catch {}
  }

  function prevWeek() {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split('T')[0]);
  }

  function nextWeek() {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    const todayMonday = getMonday(new Date());
    if (d.toISOString().split('T')[0] <= todayMonday) {
      setWeekStart(d.toISOString().split('T')[0]);
    }
  }

  const chartData = report?.dailyData.map((d) => ({
    day: new Date(d.date.split('T')[0] + 'T12:00:00').toLocaleDateString(intlLocale, { weekday: 'short' }),
    [t('habits')]: d.habits,
    [t('meals')]: d.meals,
    [t('workouts')]: d.workouts,
  })) ?? [];

  const weekEnd = new Date(weekStart + 'T12:00:00');
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <button onClick={prevWeek} className="px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">←</button>
          <span className="font-medium">
            {new Date(weekStart.split('T')[0] + 'T12:00:00').toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })}
            {' — '}
            {weekEnd.toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' })}
          </span>
          <button onClick={nextWeek} className="px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">→</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-20 bg-white rounded-xl animate-pulse border border-gray-200" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-gray-200" />)}
          </div>
          <div className="h-56 bg-white rounded-xl animate-pulse border border-gray-200" />
        </div>
      ) : !report ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">{t('noData')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* AI summary */}
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={15} className="text-emerald-600" />
              <h3 className="text-sm font-semibold text-gray-700">{t('summary')}</h3>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-gray-400 animate-pulse">{t('summaryLoading')}</p>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <StatCard label={t('habits')} percentage={report.habits.percentage} completed={report.habits.completed} total={report.habits.total} color="#8B5CF6" />
            <StatCard label={t('meals')} percentage={report.meals.percentage} completed={report.meals.completed} total={report.meals.total} color="#10B981" />
            <StatCard label={t('workouts')} percentage={report.workouts.percentage} completed={report.workouts.completed} total={report.workouts.total} color="#3B82F6" />
          </div>

          {/* Comparison */}
          <div>
            <button onClick={loadComparison} className="text-sm text-emerald-700 font-medium hover:underline">
              {showComparison ? '▼' : '▶'} {t('vsPrevious')}
            </button>
            {showComparison && comparison && (
              <div className="mt-3 bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-3 gap-4">
                <div><p className="text-xs text-gray-500 mb-1">{t('habits')}</p><Delta value={comparison.deltas.habits} /></div>
                <div><p className="text-xs text-gray-500 mb-1">{t('meals')}</p><Delta value={comparison.deltas.meals} /></div>
                <div><p className="text-xs text-gray-500 mb-1">{t('workouts')}</p><Delta value={comparison.deltas.workouts} /></div>
              </div>
            )}
          </div>

          {/* Per-habit streaks */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('streaks')}</h3>
            {report.habitStreaks.length === 0 ? (
              <p className="text-sm text-gray-400">{t('noStreaks')}</p>
            ) : (
              <div className="space-y-2">
                {report.habitStreaks.map((h) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                    <span className="text-sm text-gray-700 flex-1 truncate">{h.name}</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-orange-500">
                      <Flame size={13} className="text-orange-400" />{h.streak} {t('days')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('dailyActivity')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: chartColors.axisTick }} className="capitalize" />
                <YAxis tick={{ fontSize: 11, fill: chartColors.axisTick }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    color: chartColors.tooltipText,
                    borderRadius: '10px',
                    fontSize: '13px',
                  }}
                  labelStyle={{ color: chartColors.tooltipText }}
                  itemStyle={{ color: chartColors.tooltipText }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: chartColors.legendText }} />
                <Bar dataKey={t('habits')} fill={isDark ? '#a78bfa' : '#8B5CF6'} radius={[3, 3, 0, 0]} />
                <Bar dataKey={t('meals')} fill={isDark ? '#34d399' : '#10B981'} radius={[3, 3, 0, 0]} />
                <Bar dataKey={t('workouts')} fill={isDark ? '#60a5fa' : '#3B82F6'} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
