'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, useUser, useIsAuthenticated, useAuthTokens } from '@/stores/auth.store';
import { PhoneVerification } from '@/components/PhoneVerification';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Stats {
  totalJobs: number;
  activeJobs: number;
  unreadMessages: number;
}

interface Job {
  id: string;
  title: string;
  slug: string;
  status: string;
  urgency: string;
  numWorkers: number;
  location: string;
  createdAt: string;
  postedAt: string | null;
}

interface Company {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const tokens = useAuthTokens();
  const logout = useAuthStore((state) => state.logout);

  const [stats, setStats] = useState<Stats>({ totalJobs: 0, activeJobs: 0, unreadMessages: 0 });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/prijava');
    }
  }, [isAuthenticated, router]);

  // Load dashboard data
  useEffect(() => {
    if (tokens?.accessToken) {
      loadDashboardData();
    }
  }, [tokens?.accessToken]);

  const loadDashboardData = async () => {
    try {
      const [statsRes, jobsRes, companyRes] = await Promise.all([
        fetch(`${API_URL}/api/profile/stats`, {
          headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        }),
        fetch(`${API_URL}/api/profile/jobs/recent`, {
          headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        }),
        fetch(`${API_URL}/api/profile/company`, {
          headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const jobsData = await jobsRes.json();
      const companyData = await companyRes.json();

      if (statsData.success) {
        setStats(statsData.data.stats);
      }
      if (jobsData.success) {
        setRecentJobs(jobsData.data.jobs);
      }
      if (companyData.success && companyData.data.company) {
        setCompany(companyData.data.company);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleResendEmail = async () => {
    try {
      await fetch(`${API_URL}/api/auth/email/resend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      });
      alert('Email za verifikaciju je poslat');
    } catch (err) {
      alert('Greska pri slanju emaila');
    }
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
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Odjavi se
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Kontrolna tabla</h1>

        {/* Status cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status naloga</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className={user.emailVerified ? 'text-green-600' : 'text-yellow-600'}>
                    {user.emailVerified ? 'Verifikovan' : 'Nije verifikovan'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telefon:</span>
                  <span className={user.phoneVerified ? 'text-green-600' : 'text-yellow-600'}>
                    {user.phone ? (user.phoneVerified ? 'Verifikovan' : 'Nije verifikovan') : 'Nije unet'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uloga:</span>
                  <span className="text-gray-900">{user.role === 'EMPLOYER' ? 'Poslodavac' : user.role}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Moji oglasi</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-gray-500">Ucitavanje...</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-blue-600 mb-2">{stats.activeJobs}</p>
                  <p className="text-sm text-gray-600">Aktivnih oglasa</p>
                  {stats.totalJobs > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Ukupno: {stats.totalJobs}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Poruke</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-gray-500">Ucitavanje...</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-blue-600 mb-2">{stats.unreadMessages}</p>
                  <p className="text-sm text-gray-600">Neprocitanih poruka</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Phone verification modal */}
        {showPhoneVerification && user.phone && !user.phoneVerified && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="max-w-md w-full">
              <PhoneVerification
                phone={user.phone}
                onVerified={() => {
                  setShowPhoneVerification(false);
                  loadDashboardData();
                }}
              />
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setShowPhoneVerification(false)}
              >
                Zatvori
              </Button>
            </div>
          </div>
        )}

        {/* Verification alerts */}
        {(!user.emailVerified || (user.phone && !user.phoneVerified) || !user.phone) && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-800">Potrebna verifikacija</CardTitle>
              <CardDescription className="text-yellow-700">
                Verifikujte vase podatke da biste mogli kreirati oglase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!user.emailVerified && (
                <div className="flex items-center justify-between p-3 bg-white rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">Email verifikacija</p>
                    <p className="text-sm text-gray-600">
                      Proverite vase sandue za verifikacioni link
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleResendEmail}>
                    Posalji ponovo
                  </Button>
                </div>
              )}
              {!user.phone && (
                <div className="flex items-center justify-between p-3 bg-white rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">Dodajte broj telefona</p>
                    <p className="text-sm text-gray-600">
                      Potreban je broj telefona za verifikaciju
                    </p>
                  </div>
                  <Link href="/kontrolna-tabla/podesavanja">
                    <Button variant="outline" size="sm">
                      Dodaj telefon
                    </Button>
                  </Link>
                </div>
              )}
              {user.phone && !user.phoneVerified && (
                <div className="flex items-center justify-between p-3 bg-white rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">Telefon verifikacija</p>
                    <p className="text-sm text-gray-600">{user.phone}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPhoneVerification(true)}
                  >
                    Verifikuj
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Company profile alert */}
        {!isLoading && !company && user.phoneVerified && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">Kreirajte profil kompanije</CardTitle>
              <CardDescription className="text-blue-700">
                Pre kreiranja oglasa potrebno je sacuvati podatke o vasoj kompaniji
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-white rounded-md">
                <div>
                  <p className="font-medium text-gray-900">Profil kompanije</p>
                  <p className="text-sm text-gray-600">
                    Unesite naziv firme, lokaciju i kontakt informacije
                  </p>
                </div>
                <Link href="/kontrolna-tabla/podesavanja">
                  <Button size="sm">
                    Kreiraj profil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent jobs */}
        {recentJobs.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Nedavni oglasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-600">
                        {job.location} • {job.numWorkers} radnika
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          job.status === 'POSTED'
                            ? 'bg-green-100 text-green-700'
                            : job.status === 'DRAFT'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {job.status === 'POSTED' ? 'Aktivan' : job.status === 'DRAFT' ? 'Nacrt' : job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Brze akcije</CardTitle>
            <CardDescription>
              Sta zelite da uradite danas?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Button
                className="h-auto py-4 flex flex-col items-center"
                disabled={!user.phoneVerified}
                onClick={() => router.push('/kontrolna-tabla/novi-oglas')}
              >
                <span className="text-lg mb-1">+</span>
                <span>Novi oglas</span>
              </Button>
              <Link href="/kontrolna-tabla/oglasi" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center">
                  <span className="text-lg mb-1">📋</span>
                  <span>Moji oglasi</span>
                </Button>
              </Link>
              <Link href="/kontrolna-tabla/postovi" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center">
                  <span className="text-lg mb-1">📸</span>
                  <span>Promo postovi</span>
                </Button>
              </Link>
              <Link href="/kontrolna-tabla/poruke" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center">
                  <span className="text-lg mb-1">💬</span>
                  <span>Poruke</span>
                </Button>
              </Link>
              <Link href="/kontrolna-tabla/podesavanja" className="w-full">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center">
                  <span className="text-lg mb-1">⚙️</span>
                  <span>Podesavanja</span>
                </Button>
              </Link>
            </div>
            {!user.phoneVerified && (
              <p className="mt-4 text-sm text-yellow-600">
                * Za kreiranje oglasa potrebna je verifikacija telefona
              </p>
            )}
          </CardContent>
        </Card>

        {/* Info box */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Kako funkcionise nasa platforma?</h3>
          <p className="text-sm text-blue-700">
            Mi smo konsalting agencija koja vam pomaze u pripremi dokumentacije za zaposljavanje
            radnika. Kroz nasu platformu mozete opisati vase potrebe za radnicima, a mi cemo vam
            pomoci da pripremite svu potrebnu dokumentaciju i savetovati vas kroz proces.
          </p>
        </div>
      </main>
    </div>
  );
}
