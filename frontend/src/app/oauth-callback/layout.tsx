import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prijava u toku...',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function OAuthCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
