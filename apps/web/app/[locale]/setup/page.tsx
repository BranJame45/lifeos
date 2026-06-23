'use client';
import { useTranslations } from 'next-intl';

export default function SetupPage() {
  const t = useTranslations('setup');
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <p className="text-gray-500">{t('save')}</p>
    </div>
  );
}
