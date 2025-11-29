'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PublicJob {
  id: string;
  slug: string;
  title: string;
  descriptionPublic: string | null;
  descriptionFull?: string;
  numWorkers: number;
  location: string;
  locationCity: string | null;
  locationCountry: string | null;
  salary?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  workHours?: string | null;
  housing?: boolean;
  housingDesc?: string | null;
  experience?: string | null;
  languages?: string[];
  requirements?: string | null;
  benefits?: string | null;
  urgency?: string;
  company: {
    name: string;
    city?: string | null;
  };
  accessLevel: 'public' | 'secret';
}

export default function PublicJobPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const secretToken = searchParams.get('rf');

  const [job, setJob] = useState<PublicJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadJob();
    }
  }, [slug, secretToken]);

  const loadJob = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `${API_URL}/api/jobs/public/${slug}`;
      if (secretToken) {
        url += `?rf=${secretToken}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Oglas nije pronadjen');
      }

      setJob(data.data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri ucitavanju');
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-600',
      NORMAL: 'bg-blue-100 text-blue-600',
      HIGH: 'bg-orange-100 text-orange-600',
      URGENT: 'bg-red-100 text-red-600',
    };
    const labels: Record<string, string> = {
      LOW: 'Nisko',
      NORMAL: 'Normalno',
      HIGH: 'Visoko',
      URGENT: 'Hitno',
    };
    return (
      <span className={`text-sm px-3 py-1 rounded-full ${styles[urgency] || 'bg-gray-100'}`}>
        {labels[urgency] || urgency}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Ucitavanje oglasa...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Trazim-Radnike.online
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Oglas nije pronadjen</h2>
              <p className="text-gray-600 mb-4">
                {error || 'Ovaj oglas ne postoji ili je istekao.'}
              </p>
              <Link href="/">
                <Button>Nazad na pocetnu</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isFullAccess = job.accessLevel === 'secret';

  return (
    <>
      {/* Add noindex for secret links */}
      {secretToken && (
        <head>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="googlebot" content="noindex, nofollow" />
        </head>
      )}

      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Trazim-Radnike.online
          </Link>
          <Link href="/prijava">
            <Button variant="outline" size="sm">
              Prijavi se
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Access level indicator */}
        {isFullAccess && (
          <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-md">
            <p className="text-sm text-purple-700">
              Pristupate ovom oglasu putem tajnog linka. Imate pristup svim detaljima.
            </p>
          </div>
        )}

        {/* Job header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                <p className="text-gray-600 mt-1">
                  {job.company.name}
                  {job.company.city && ` • ${job.company.city}`}
                </p>
              </div>
              {job.urgency && getUrgencyBadge(job.urgency)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Lokacija</p>
                <p className="font-medium">
                  {job.location}
                  {job.locationCity && `, ${job.locationCity}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Broj radnika</p>
                <p className="font-medium">{job.numWorkers}</p>
              </div>
              {isFullAccess && job.salary && (
                <div>
                  <p className="text-sm text-gray-500">Plata</p>
                  <p className="font-medium">{job.salary}</p>
                </div>
              )}
              {isFullAccess && (job.salaryMin || job.salaryMax) && (
                <div>
                  <p className="text-sm text-gray-500">Raspon plate</p>
                  <p className="font-medium">
                    {job.salaryMin || '?'} - {job.salaryMax || '?'} {job.salaryCurrency}
                  </p>
                </div>
              )}
              {isFullAccess && job.workHours && (
                <div>
                  <p className="text-sm text-gray-500">Radno vreme</p>
                  <p className="font-medium">{job.workHours}</p>
                </div>
              )}
              {isFullAccess && job.experience && (
                <div>
                  <p className="text-sm text-gray-500">Iskustvo</p>
                  <p className="font-medium">{job.experience}</p>
                </div>
              )}
            </div>

            {isFullAccess && job.housing && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Smestaj obezbedjen</strong>
                  {job.housingDesc && `: ${job.housingDesc}`}
                </p>
              </div>
            )}

            {isFullAccess && job.languages && job.languages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">Potrebni jezici</p>
                <div className="flex flex-wrap gap-2">
                  {job.languages.map((lang: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Opis posla</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFullAccess && job.descriptionFull ? (
              <div>
                <p className="whitespace-pre-wrap">{job.descriptionFull}</p>
              </div>
            ) : job.descriptionPublic ? (
              <div>
                <p className="whitespace-pre-wrap">{job.descriptionPublic}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Detaljan opis nije dostupan javno. Kontaktirajte poslodavca za vise informacija.
              </p>
            )}

            {isFullAccess && job.requirements && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Zahtevi</p>
                <p className="whitespace-pre-wrap">{job.requirements}</p>
              </div>
            )}

            {isFullAccess && job.benefits && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Beneficije</p>
                <p className="whitespace-pre-wrap">{job.benefits}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact / CTA */}
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Zainteresovani ste?</h3>
              <p className="text-gray-600 mb-4">
                Mi smo konsalting agencija koja pomaze poslodavcima u pripremi dokumentacije
                za zaposljavanje radnika. Ako ste zainteresovani za ovu poziciju, kontaktirajte
                poslodavca direktno ili nas za vise informacija.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/registracija">
                  <Button>Registruj se kao poslodavac</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">Saznaj vise o nama</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limited access notice */}
        {!isFullAccess && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Napomena:</strong> Vidite ogranicenu verziju ovog oglasa. Neki detalji
              kao sto su plata, radno vreme i pun opis posla nisu prikazani. Za pristup
              svim informacijama, kontaktirajte poslodavca.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Trazim-Radnike.online - Konsalting agencija za
            pripremu dokumentacije
          </p>
        </div>
      </footer>
      </div>
    </>
  );
}
