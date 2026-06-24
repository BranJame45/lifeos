'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      window.location.href = '/today';
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0a3b37 0%, #0f4f4a 40%, #115e59 100%)' }}>

      {/* Orbs decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2dd4bf, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #14b8a6, transparent)' }} />
      </div>

      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-teal-100 p-10 w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #2dd4bf, #0d9488)' }}>
            <span className="text-2xl">🌿</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LifeOS</h1>
          <p className="text-teal-600 text-sm mt-1 font-medium">{t('tagline')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="brandon@lifeos.app"
              className="w-full px-3.5 py-2.5 border border-teal-100 bg-teal-50/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-shadow text-gray-800 placeholder-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 border border-teal-100 bg-teal-50/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-shadow text-gray-800"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            style={{ background: 'linear-gradient(90deg, #0d9488, #14b8a6)' }}
          >
            {loading ? t('signingIn') : t('signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
