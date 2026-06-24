import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import AppShell from '@/components/layout/AppShell';
import { ThemeProvider } from '@/lib/theme';
import '../globals.css';

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }];
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-1)' }}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
