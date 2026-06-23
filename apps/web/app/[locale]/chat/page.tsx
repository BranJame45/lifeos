'use client';
import { useTranslations } from 'next-intl';

export default function ChatPage() {
  const t = useTranslations('chat');
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <p className="text-gray-500">{t('placeholder')}</p>
    </div>
  );
}
