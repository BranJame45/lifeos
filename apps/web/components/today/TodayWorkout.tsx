'use client';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/useApiData';
import { Dumbbell, Check } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  completed: boolean;
}

interface WorkoutSession {
  id: string;
  date: string;
  muscleGroup: string;
  completed: boolean;
  exercises: Exercise[];
}

interface WorkoutPlan { sessions: WorkoutSession[] }

export default function TodayWorkout() {
  const t = useTranslations('today');
  const { data: plan, loading, mutate } = useApiData<WorkoutPlan | null>('/workout-plans/current');

  const todayStr = new Date().toISOString().split('T')[0];
  const session =
    plan?.sessions?.find((s) => new Date(s.date).toISOString().split('T')[0] === todayStr) ?? null;

  async function toggleExercise(id: string) {
    const flip = (p: WorkoutPlan | null | undefined): WorkoutPlan | null =>
      p
        ? { ...p, sessions: p.sessions.map((s) => ({ ...s, exercises: s.exercises.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)) })) }
        : null;
    // Optimista: actualiza UI + caché al instante.
    mutate((prev) => flip(prev) as WorkoutPlan);
    try {
      await api.patch(`/workout-plans/exercise/${id}`, {});
    } catch {
      mutate((prev) => flip(prev) as WorkoutPlan);
    }
  }

  const completedCount = session?.exercises.filter((e) => e.completed).length ?? 0;
  const totalCount = session?.exercises.length ?? 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Dumbbell size={18} className="text-blue-600" />
          <h2 className="text-base font-semibold">{t('workout')}</h2>
        </div>
        {session && (
          <span className="text-xs font-medium text-gray-500">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !session ? (
        <p className="text-gray-400 text-sm">{t('noWorkout')}</p>
      ) : (
        <>
          <div className="mb-3 px-3 py-1.5 bg-blue-50 rounded-lg inline-block">
            <span className="text-xs font-semibold text-blue-700">{session.muscleGroup}</span>
          </div>
          <div className="space-y-2">
            {session.exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => toggleExercise(exercise.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  exercise.completed
                    ? 'bg-blue-50 border-blue-200 opacity-75'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <div className="flex-1">
                  <p className={`text-sm font-medium ${exercise.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {exercise.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {exercise.sets} {t('series')} × {exercise.reps}
                  </p>
                </div>
                {exercise.completed && <Check size={14} className="text-blue-500 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
