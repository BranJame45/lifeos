import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import '../globals.css';

type Props = { children: React.ReactNode; params: { locale: string } };

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }];
}

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
