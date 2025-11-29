import type { Metadata } from 'next';

// For secret links (?rf=...), we should not index the page
// This is a static metadata that will be overridden in generateMetadata
export const metadata: Metadata = {
  title: 'Oglas za posao',
  description: 'Pogledajte detalje oglasa za posao na Tražim-Radnike.online',
};

export default function JobPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
