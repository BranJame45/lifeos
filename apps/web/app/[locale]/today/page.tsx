'use client';
import { useTranslations } from 'next-intl';
import TodayMeals from '@/components/today/TodayMeals';
import TodayWorkout from '@/components/today/TodayWorkout';
import TodayHabits from '@/components/today/TodayHabits';

export default function TodayPage() {
  const t = useTranslations('today');
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TodayMeals />
        <TodayWorkout />
        <TodayHabits />
      </div>
    </div>
  );
}
