'use client';
import { useTranslations } from 'next-intl';

export default function ReportsPage() {
  const t = useTranslations('reports');
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <p className="text-gray-500">{t('weekly')}</p>
    </div>
  );
}
