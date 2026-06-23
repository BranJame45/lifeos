'use client';
import { useTranslations } from 'next-intl';

export default function TodayHabits() {
  const t = useTranslations('today');
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">{t('habits')}</h2>
      <p className="text-gray-400 text-sm">{t('noHabits')}</p>
    </div>
  );
}
