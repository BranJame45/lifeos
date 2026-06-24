'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { Sparkles, Check, RefreshCw, ChevronDown, ChevronUp, Repeat, StickyNote } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  completed: boolean;
}

interface WorkoutSession {
  id: string;
  date: string;
  muscleGroup: string;
  completed: boolean;
  notes: string | null;
  exercises: Exercise[];
}

interface WorkoutPlan {
  id: string;
  weekStart: string;
  weekEnd: string;
  confirmed: boolean;
  sessions: WorkoutSession[];
}

interface Suggestion { name: string; sets: number; reps: string; reason: string }

export default function WorkoutPage() {
  const t = useTranslations('workout');
  const tc = useTranslations('common');
  const locale = useLocale();
  const intlLocale = locale === 'en' ? 'en-US' : 'es-PE';

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [preview, setPreview] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [subs, setSubs] = useState<Record<string, { loading: boolean; suggestions: Suggestion[] }>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [pendingEx, setPendingEx] = useState<Set<string>>(new Set()); // toggles en vuelo
  const [savedWeight, setSavedWeight] = useState<string | null>(null); // ✓ peso guardado

  // Formulario de generación: qué días entrenas y cuántos minutos cada uno.
  const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
  const DURATIONS = [30, 45, 60, 75, 90, 105, 120, 135, 150]; // 30min a 2h30, cada 15min

  // 30 -> "30 min", 60 -> "1h", 90 -> "1h 30min", 150 -> "2h 30min"
  function formatDuration(m: number) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min} ${t('minutesUnit')}`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}${t('minutesUnit')}`;
  }
  const [genDays, setGenDays] = useState<Record<string, number>>({ mon: 60, wed: 60, fri: 60 });
  const [showForm, setShowForm] = useState(false);

  function toggleDay(day: string) {
    setGenDays((prev) => {
      const next = { ...prev };
      if (day in next) delete next[day];
      else next[day] = 60;
      return next;
    });
  }

  function setDayMinutes(day: string, minutes: number) {
    setGenDays((prev) => ({ ...prev, [day]: minutes }));
  }

  // Etiqueta corta del día según el locale (Lun, Mar… / Mon, Tue…).
  function dayLabel(day: string) {
    const ref = new Date(2024, 0, 1 + DAY_KEYS.indexOf(day as (typeof DAY_KEYS)[number])); // 2024-01-01 = lunes
    return ref.toLocaleDateString(intlLocale, { weekday: 'short' });
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [current, prev] = await Promise.all([
        api.get<WorkoutPlan | null>('/workout-plans/current').catch(() => null),
        api.get<WorkoutPlan | null>('/workout-plans/preview').catch(() => null),
      ]);
      setPlan(current);
      if (!current) setPreview(prev);
      if (current?.sessions) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todaySession = current.sessions.find((s) => new Date(s.date).toISOString().split('T')[0] === todayStr);
        if (todaySession) setExpanded(new Set([todaySession.id]));
        setNoteDrafts(Object.fromEntries(current.sessions.map((s) => [s.id, s.notes || ''])));
      }
    } catch {}
    setLoading(false);
  }

  async function generatePlan() {
    const days = Object.entries(genDays).map(([day, minutes]) => ({ day, minutes }));
    if (days.length === 0) return;
    setGenerating(true);
    try {
      const res = await api.post<{ plan: WorkoutPlan }>('/workout-plans/generate', { days });
      setPreview(res.plan);
      setPlan(null);
      setShowForm(false);
    } catch {}
    setGenerating(false);
  }

  async function confirmPlan() {
    if (!preview) return;
    setConfirming(true);
    try {
      const confirmed = await api.post<WorkoutPlan>(`/workout-plans/confirm/${preview.id}`, {});
      setPlan(confirmed);
      setPreview(null);
      setNoteDrafts(Object.fromEntries(confirmed.sessions.map((s) => [s.id, s.notes || ''])));
    } catch {}
    setConfirming(false);
  }

  function patchExercise(sessionId: string, exerciseId: string, changes: Partial<Exercise>) {
    setPlan((p) => {
      if (!p) return p;
      return {
        ...p,
        sessions: p.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, exercises: s.exercises.map((e) => (e.id === exerciseId ? { ...e, ...changes } : e)) }
            : s,
        ),
      };
    });
  }

  async function toggleExercise(exerciseId: string, sessionId: string) {
    if (!plan) return;
    if (pendingEx.has(exerciseId)) return; // ignora doble-click mientras está en vuelo
    const current = plan.sessions.find((s) => s.id === sessionId)?.exercises.find((e) => e.id === exerciseId);
    const was = !!current?.completed;
    // Optimista: cambia la UI al instante (no hay lapso de carga).
    patchExercise(sessionId, exerciseId, { completed: !was });
    setPendingEx((p) => new Set(p).add(exerciseId));
    try {
      await api.patch(`/workout-plans/exercise/${exerciseId}`, {});
    } catch {
      patchExercise(sessionId, exerciseId, { completed: was }); // revierte si falla
    } finally {
      setPendingEx((p) => {
        const n = new Set(p);
        n.delete(exerciseId);
        return n;
      });
    }
  }

  async function saveWeight(exerciseId: string, sessionId: string, value: string) {
    const weight = value === '' ? null : Number(value);
    // Optimista + confirmación visual breve.
    patchExercise(sessionId, exerciseId, { weight });
    try {
      await api.patch(`/workout-plans/exercise/${exerciseId}/weight`, { weight });
      setSavedWeight(exerciseId);
      setTimeout(() => setSavedWeight((s) => (s === exerciseId ? null : s)), 1500);
    } catch {}
  }

  async function saveNotes(sessionId: string) {
    try {
      await api.patch(`/workout-plans/session/${sessionId}/notes`, { notes: noteDrafts[sessionId] || '' });
      setSavedNote(sessionId);
      setTimeout(() => setSavedNote((s) => (s === sessionId ? null : s)), 2000);
    } catch {}
  }

  async function loadSubstitutes(exerciseId: string) {
    setSubs((prev) => ({ ...prev, [exerciseId]: { loading: true, suggestions: prev[exerciseId]?.suggestions || [] } }));
    try {
      const res = await api.post<{ original: string; suggestions: Suggestion[] }>(`/workout-plans/exercise/${exerciseId}/substitute`, {});
      setSubs((prev) => ({ ...prev, [exerciseId]: { loading: false, suggestions: res.suggestions || [] } }));
    } catch {
      setSubs((prev) => ({ ...prev, [exerciseId]: { loading: false, suggestions: [] } }));
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const SessionList = ({ sessions, readOnly }: { sessions: WorkoutSession[]; readOnly: boolean }) => (
    <div className="space-y-3">
      {sessions.map((session) => {
        const isOpen = expanded.has(session.id);
        const dateStr = session.date.includes('T') ? session.date : `${session.date}T12:00:00`;
        const d = new Date(dateStr);
        const dayLabel = d.toLocaleDateString(intlLocale, { weekday: 'short', day: 'numeric' });
        const completedExercises = session.exercises.filter((e) => e.completed).length;

        return (
          <div key={session.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleExpand(session.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${session.completed ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{session.muscleGroup}</p>
                  <p className="text-xs text-gray-500 capitalize">{dayLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{completedExercises}/{session.exercises.length}</span>
                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100">
                <div className="divide-y divide-gray-100">
                  {session.exercises.map((exercise) => {
                    const sub = subs[exercise.id];
                    return (
                      <div key={exercise.id} className={exercise.completed ? 'bg-emerald-50' : ''}>
                        <div className="flex items-center gap-3 px-4 py-3">
                          <button
                            onClick={() => !readOnly && toggleExercise(exercise.id, session.id)}
                            disabled={readOnly}
                            className="flex-1 text-left"
                          >
                            <p className={`text-sm font-medium ${exercise.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {exercise.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {exercise.sets} {t('sets')} × {exercise.reps} {t('reps')}
                            </p>
                          </button>

                          {!readOnly && (
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                step="0.5"
                                defaultValue={exercise.weight ?? ''}
                                placeholder={t('weightPlaceholder')}
                                onBlur={(e) => saveWeight(exercise.id, session.id, e.target.value)}
                                className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                              />
                              {savedWeight === exercise.id && <Check size={13} className="text-emerald-500 shrink-0" />}
                              <button
                                onClick={() => loadSubstitutes(exercise.id)}
                                title={t('substitute')}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Repeat size={14} />
                              </button>
                            </div>
                          )}
                          {exercise.completed && <Check size={14} className="text-emerald-500 shrink-0" />}
                        </div>

                        {sub && (
                          <div className="px-4 pb-3 -mt-1">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                              <p className="text-xs font-semibold text-blue-700 mb-2">
                                {t('substituteTitle')} "{exercise.name}"
                              </p>
                              {sub.loading ? (
                                <p className="text-xs text-blue-500">{t('substituteLoading')}</p>
                              ) : sub.suggestions.length === 0 ? (
                                <p className="text-xs text-gray-500">{t('noSuggestions')}</p>
                              ) : (
                                <ul className="space-y-1.5">
                                  {sub.suggestions.map((s, i) => (
                                    <li key={i} className="text-xs text-gray-700">
                                      <span className="font-medium">{s.name}</span>
                                      <span className="text-gray-400"> · {s.sets}×{s.reps}</span>
                                      {s.reason && <span className="block text-gray-500">{s.reason}</span>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!readOnly && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <StickyNote size={12} /> {t('notes')}
                    </label>
                    <p className="text-[11px] text-gray-400 mb-1.5">{t('notesHint')}</p>
                    <textarea
                      value={noteDrafts[session.id] ?? ''}
                      onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [session.id]: e.target.value }))}
                      placeholder={t('notesPlaceholder')}
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => saveNotes(session.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        {t('saveNotes')}
                      </button>
                      {savedNote === session.id && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1"><Check size={12} /> {t('noteSaved')}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-200" />)}</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        {plan && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Sparkles size={15} />
            {t('regenerate')}
          </button>
        )}
      </div>

      {(showForm || (!plan && !preview)) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-blue-600" />
            <h2 className="font-semibold">{t('configureTitle')}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">{t('configureHint')}</p>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('daysLabel')}</p>
          <div className="space-y-2 mb-5">
            {DAY_KEYS.map((day) => {
              const on = day in genDays;
              return (
                <div key={day} className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => toggleDay(day)}
                    className={`w-16 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                      on ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {dayLabel(day)}
                  </button>
                  {on && (
                    <div className="flex gap-1">
                      {DURATIONS.map((m) => (
                        <button
                          key={m}
                          onClick={() => setDayMinutes(day, m)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            genDays[day] === m
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {formatDuration(m)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={generatePlan}
              disabled={generating || Object.keys(genDays).length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {generating ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {generating ? t('generating') : t('generate')}
            </button>
            {Object.keys(genDays).length === 0 && (
              <span className="text-xs text-gray-400">{t('selectDays')}</span>
            )}
            {(plan || preview) && (
              <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:underline ml-auto">
                {tc('cancel')}
              </button>
            )}
          </div>
        </div>
      )}

      {preview && !plan && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-amber-800">{t('pendingConfirmation')}</p>
              <p className="text-sm text-amber-600 mt-0.5">{t('pendingHint')}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={generatePlan} disabled={generating} className="px-3 py-1.5 border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100">
                {t('regenerate')}
              </button>
              <button onClick={confirmPlan} disabled={confirming} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-70">
                {confirming ? tc('loading') : t('confirm')}
              </button>
            </div>
          </div>
          <SessionList sessions={preview.sessions} readOnly />
        </div>
      )}

      {plan ? (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {t('weekOf')} {new Date(plan.weekStart.split('T')[0] + 'T12:00:00').toLocaleDateString(intlLocale, { day: 'numeric', month: 'long' })}
          </p>
          <SessionList sessions={plan.sessions} readOnly={false} />
        </>
      ) : null}
    </div>
  );
}
