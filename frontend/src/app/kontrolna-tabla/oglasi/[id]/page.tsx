'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useIsAuthenticated, useAuthTokens } from '@/stores/auth.store';
import { FileUpload, FileList } from '@/components/FileUpload';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Job {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  urgency: string;
  descriptionFull: string;
  descriptionPublic: string | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  numWorkers: number;
  location: string;
  locationCity: string | null;
  locationCountry: string | null;
  workHours: string | null;
  housing: boolean;
  housingDesc: string | null;
  experience: string | null;
  languages: string[];
  requirements: string | null;
  benefits: string | null;
  secretToken: string | null;
  secretExpiresAt: string | null;
  createdAt: string;
  postedAt: string | null;
  closedAt: string | null;
  company: {
    id: string;
    name: string;
    country: string | null;
    city: string | null;
  };
  uploads?: UploadedFile[];
}

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadType: string;
  description: string | null;
  createdAt: string;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const tokens = useAuthTokens();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [secretLinkDays, setSecretLinkDays] = useState('30');
  const [generatedSecretUrl, setGeneratedSecretUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/prijava');
      return;
    }
    if (tokens?.accessToken && jobId) {
      loadJob();
    }
  }, [isAuthenticated, tokens?.accessToken, jobId]);

  const loadJob = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri ucitavanju oglasa');
      }

      setJob(data.data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri ucitavanju');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    setActionLoading('publish');
    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri objavljivanju');
      }

      await loadJob();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Greska');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async () => {
    setActionLoading('close');
    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri zatvaranju');
      }

      await loadJob();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Greska');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateSecretLink = async () => {
    setActionLoading('secret');
    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/secret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ expiresInDays: parseInt(secretLinkDays) }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri kreiranju linka');
      }

      setGeneratedSecretUrl(data.data.secretUrl);
      await loadJob();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Greska');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetSecretLink = async () => {
    setActionLoading('reset');
    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}/secret/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri ponistenju linka');
      }

      setGeneratedSecretUrl(null);
      await loadJob();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Greska');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setActionLoading('delete');
    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri brisanju');
      }

      router.push('/kontrolna-tabla/oglasi');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Greska');
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link je kopiran u clipboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-Latn-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      POSTED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-red-100 text-red-700',
      FILLED: 'bg-blue-100 text-blue-700',
    };
    const labels: Record<string, string> = {
      DRAFT: 'Nacrt',
      POSTED: 'Aktivan',
      CLOSED: 'Zatvoren',
      FILLED: 'Popunjen',
    };
    return (
      <span className={`text-sm px-3 py-1 rounded-full ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getVisibilityBadge = (visibility: string) => {
    const styles: Record<string, string> = {
      PRIVATE: 'bg-gray-100 text-gray-700',
      SECRET: 'bg-purple-100 text-purple-700',
      PUBLIC: 'bg-blue-100 text-blue-700',
    };
    const labels: Record<string, string> = {
      PRIVATE: 'Privatno',
      SECRET: 'Tajni link',
      PUBLIC: 'Javno',
    };
    return (
      <span className={`text-sm px-3 py-1 rounded-full ${styles[visibility] || 'bg-gray-100'}`}>
        {labels[visibility] || visibility}
      </span>
    );
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

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Ucitavanje...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error || 'Oglas nije pronadjen'}
          </div>
          <Link href="/kontrolna-tabla/oglasi" className="mt-4 inline-block text-blue-600">
            &larr; Nazad na oglase
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Trazim-Radnike.online
          </Link>
          <Link href="/kontrolna-tabla" className="text-sm text-gray-600 hover:text-gray-900">
            Kontrolna tabla
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/kontrolna-tabla/oglasi" className="text-blue-600 hover:text-blue-800 text-sm">
            &larr; Nazad na oglase
          </Link>
        </div>

        {/* Title and status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {getStatusBadge(job.status)}
              {getVisibilityBadge(job.visibility)}
              {getUrgencyBadge(job.urgency)}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/kontrolna-tabla/oglasi/${jobId}/izmeni`}>
              <Button variant="outline" size="sm">
                Izmeni
              </Button>
            </Link>
            {job.status === 'DRAFT' && (
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={actionLoading === 'publish'}
              >
                {actionLoading === 'publish' ? 'Objavljujem...' : 'Objavi'}
              </Button>
            )}
            {job.status === 'POSTED' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClose}
                disabled={actionLoading === 'close'}
              >
                {actionLoading === 'close' ? 'Zatvaram...' : 'Zatvori oglas'}
              </Button>
            )}
          </div>
        </div>

        {/* Secret link section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Tajni link za deljenje</CardTitle>
            <CardDescription>
              Generisi tajni link koji mozete podeliti sa potencijalnim kandidatima
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {job.secretToken && job.visibility === 'SECRET' ? (
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-md">
                  <p className="text-sm text-purple-800 mb-2">
                    <strong>Aktivni tajni link:</strong>
                  </p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={generatedSecretUrl || `${window.location.origin}/oglas/${job.slug}?rf=${job.secretToken}`}
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          generatedSecretUrl ||
                            `${window.location.origin}/oglas/${job.slug}?rf=${job.secretToken}`
                        )
                      }
                    >
                      Kopiraj
                    </Button>
                  </div>
                  {job.secretExpiresAt && (
                    <p className="text-xs text-purple-600 mt-2">
                      Istice: {formatDate(job.secretExpiresAt)}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetSecretLink}
                  disabled={actionLoading === 'reset'}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {actionLoading === 'reset' ? 'Ponistavam...' : 'Ponisti tajni link'}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor="secretLinkDays">Vazenje linka (dana)</Label>
                  <Input
                    id="secretLinkDays"
                    type="number"
                    min="1"
                    max="365"
                    value={secretLinkDays}
                    onChange={(e) => setSecretLinkDays(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleGenerateSecretLink}
                  disabled={actionLoading === 'secret'}
                >
                  {actionLoading === 'secret' ? 'Kreiram...' : 'Generisi tajni link'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Detalji oglasa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {job.salary && (
                <div>
                  <p className="text-sm text-gray-500">Plata</p>
                  <p className="font-medium">{job.salary}</p>
                </div>
              )}
              {(job.salaryMin || job.salaryMax) && (
                <div>
                  <p className="text-sm text-gray-500">Raspon plate</p>
                  <p className="font-medium">
                    {job.salaryMin || '?'} - {job.salaryMax || '?'} {job.salaryCurrency}
                  </p>
                </div>
              )}
              {job.workHours && (
                <div>
                  <p className="text-sm text-gray-500">Radno vreme</p>
                  <p className="font-medium">{job.workHours}</p>
                </div>
              )}
              {job.experience && (
                <div>
                  <p className="text-sm text-gray-500">Iskustvo</p>
                  <p className="font-medium">{job.experience}</p>
                </div>
              )}
            </div>

            {job.housing && (
              <div className="p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Smestaj obezbedjen</strong>
                  {job.housingDesc && `: ${job.housingDesc}`}
                </p>
              </div>
            )}

            {job.languages && job.languages.length > 0 && (
              <div>
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
            <div>
              <p className="text-sm text-gray-500 mb-1">Detaljan opis</p>
              <p className="whitespace-pre-wrap">{job.descriptionFull}</p>
            </div>

            {job.descriptionPublic && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Javni opis</p>
                <p className="whitespace-pre-wrap text-gray-600">{job.descriptionPublic}</p>
              </div>
            )}

            {job.requirements && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Zahtevi</p>
                <p className="whitespace-pre-wrap">{job.requirements}</p>
              </div>
            )}

            {job.benefits && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Beneficije</p>
                <p className="whitespace-pre-wrap">{job.benefits}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File uploads */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Dokumenti</CardTitle>
            <CardDescription>
              Dodajte dokumentaciju vezanu za ovaj oglas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              jobId={jobId}
              uploadType="JOB_DOCUMENT"
              multiple={true}
              onUploadComplete={() => loadJob()}
            />
            {job.uploads && job.uploads.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Postojeci dokumenti:</p>
                <FileList
                  files={job.uploads}
                  onDelete={async (id) => {
                    try {
                      await fetch(`${API_URL}/api/uploads/${id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
                      });
                      loadJob();
                    } catch (err) {
                      console.error('Error deleting file:', err);
                    }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Istorija</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Kreiran:</span>
                <span>{formatDate(job.createdAt)}</span>
              </div>
              {job.postedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Objavljen:</span>
                  <span>{formatDate(job.postedAt)}</span>
                </div>
              )}
              {job.closedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Zatvoren:</span>
                  <span>{formatDate(job.closedAt)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-700">Opasna zona</CardTitle>
          </CardHeader>
          <CardContent>
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-red-700">
                  Da li ste sigurni da zelite da obrisete ovaj oglas? Ova akcija se ne moze ponistiti.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Odustani
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDelete}
                    disabled={actionLoading === 'delete'}
                  >
                    {actionLoading === 'delete' ? 'Brisem...' : 'Da, obrisi oglas'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Obrisi oglas
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
