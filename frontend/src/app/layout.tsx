import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Chatbot } from '@/components/Chatbot';

const inter = Inter({ subsets: ['latin', 'latin-ext'] });

export const metadata: Metadata = {
  title: {
    default: 'Tražim Radnike - Diskretna regrutacija radnika',
    template: '%s | Tražim Radnike',
  },
  description:
    'Diskretna platforma za poslodavce - postavljajte oglase za radnike brzo, jednostavno i besplatno. Pokrivamo region Balkana.',
  keywords: [
    'posao',
    'radnici',
    'regrutacija',
    'oglasi za posao',
    'Srbija',
    'Balkan',
    'zapošljavanje',
  ],
  authors: [{ name: 'Tražim Radnike' }],
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    url: 'https://trazim-radnike.online',
    siteName: 'Tražim Radnike',
    title: 'Tražim Radnike - Diskretna regrutacija radnika',
    description:
      'Diskretna platforma za poslodavce - postavljajte oglase za radnike brzo, jednostavno i besplatno.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body className={inter.className}>
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
