'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore, useUser, useIsAuthenticated, useAuthTokens } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Job {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  urgency: string;
  numWorkers: number;
  location: string;
  salary: string | null;
  createdAt: string;
  postedAt: string | null;
}

export default function JobsListPage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const tokens = useAuthTokens();
  const logout = useAuthStore((state) => state.logout);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/prijava');
    }
  }, [isAuthenticated, router]);

  // Load jobs
  useEffect(() => {
    if (tokens?.accessToken) {
      loadJobs();
    }
  }, [tokens?.accessToken, filter]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`${API_URL}/api/jobs?${params}`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      });
      const data = await response.json();

      if (data.success) {
        setJobs(data.data.jobs);
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
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
      <span className={`text-xs px-2 py-1 rounded-full ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
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
      <span className={`text-xs px-2 py-1 rounded-full ${styles[urgency] || 'bg-gray-100'}`}>
        {labels[urgency] || urgency}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-Latn-RS', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Ucitavanje...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Trazim-Radnike.online
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/kontrolna-tabla" className="text-sm text-gray-600 hover:text-gray-900">
              Kontrolna tabla
            </Link>
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Odjavi se
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Moji oglasi</h1>
          <Link href="/kontrolna-tabla/novi-oglas">
            <Button disabled={!user.phoneVerified}>
              + Novi oglas
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Pretrazi oglase..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadJobs()}
                />
              </div>
              <div className="flex gap-2">
                {['all', 'DRAFT', 'POSTED', 'CLOSED'].map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(status)}
                  >
                    {status === 'all' ? 'Svi' :
                     status === 'DRAFT' ? 'Nacrti' :
                     status === 'POSTED' ? 'Aktivni' : 'Zatvoreni'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs list */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Ucitavanje oglasa...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">
                {filter === 'all'
                  ? 'Nemate nijedan oglas'
                  : `Nema oglasa sa statusom "${filter === 'DRAFT' ? 'nacrt' : filter === 'POSTED' ? 'aktivan' : 'zatvoren'}"`}
              </p>
              {user.phoneVerified ? (
                <Link href="/kontrolna-tabla/novi-oglas">
                  <Button>Kreiraj prvi oglas</Button>
                </Link>
              ) : (
                <p className="text-sm text-yellow-600">
                  Verifikujte telefon da biste mogli kreirati oglase
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <Link
                        href={`/kontrolna-tabla/oglasi/${job.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {job.title}
                      </Link>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getStatusBadge(job.status)}
                        {getUrgencyBadge(job.urgency)}
                        <span className="text-sm text-gray-500">
                          {job.location}
                        </span>
                        <span className="text-sm text-gray-500">
                          {job.numWorkers} radnika
                        </span>
                        {job.salary && (
                          <span className="text-sm text-gray-500">
                            {job.salary}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Kreiran: {formatDate(job.createdAt)}
                        {job.postedAt && ` • Objavljen: ${formatDate(job.postedAt)}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/kontrolna-tabla/oglasi/${job.id}`}>
                        <Button variant="outline" size="sm">
                          Detalji
                        </Button>
                      </Link>
                      <Link href={`/kontrolna-tabla/oglasi/${job.id}/izmeni`}>
                        <Button variant="outline" size="sm">
                          Izmeni
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/kontrolna-tabla" className="text-blue-600 hover:text-blue-800">
            &larr; Nazad na kontrolnu tablu
          </Link>
        </div>
      </main>
    </div>
  );
}
