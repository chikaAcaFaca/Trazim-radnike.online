'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Worker {
  id: string;
  slug: string;
  displayName: string;
  profession: string;
  professions: string[];
  bio: string;
  city: string;
  country: string;
  hourlyRate: number | null;
  dailyRate: number | null;
  currency: string;
  availability: string;
  rating: number;
  reviewCount: number;
  avatarUrl: string | null;
  isVerified: boolean;
  isPro: boolean;
  phone: string | null;
}

interface Profession {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  icon: string;
}

interface ProfessionGroup {
  [key: string]: Profession[];
}

const CATEGORY_NAMES: { [key: string]: string } = {
  CONSTRUCTION: 'Građevina',
  HOME_SERVICES: 'Kućne usluge',
  AUTOMOTIVE: 'Auto',
  CLEANING: 'Čišćenje',
  GARDEN: 'Baštovanstvo',
  TRANSPORT: 'Transport',
  OTHER: 'Ostalo',
};

const AVAILABILITY_STATUS: { [key: string]: { label: string; color: string } } = {
  AVAILABLE: { label: 'Dostupan', color: 'bg-green-100 text-green-800' },
  BUSY: { label: 'Zauzet', color: 'bg-yellow-100 text-yellow-800' },
  NOT_AVAILABLE: { label: 'Nedostupan', color: 'bg-red-100 text-red-800' },
};

export default function MajstoriPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [groupedProfessions, setGroupedProfessions] = useState<ProfessionGroup>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [betaStatus, setBetaStatus] = useState<{
    isBeta: boolean;
    freeMatching: boolean;
    progress?: { current: number; target: number; percentage: number };
  } | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    profession: searchParams.get('profession') || '',
    city: searchParams.get('city') || '',
    available: searchParams.get('available') || '',
    minRating: searchParams.get('minRating') || '',
    sort: searchParams.get('sort') || 'rating',
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Load beta status
  useEffect(() => {
    const loadBetaStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/workers/beta-status`);
        const data = await res.json();
        if (data.success) {
          setBetaStatus(data.data);
        }
      } catch (err) {
        console.error('Error loading beta status:', err);
      }
    };
    loadBetaStatus();
  }, []);

  // Load professions
  useEffect(() => {
    const loadProfessions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/workers/professions`);
        const data = await res.json();
        if (data.success) {
          setProfessions(data.data.professions);
          setGroupedProfessions(data.data.grouped);
        }
      } catch (err) {
        console.error('Error loading professions:', err);
      }
    };
    loadProfessions();
  }, []);

  // Load workers
  useEffect(() => {
    const loadWorkers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.profession) params.set('profession', filters.profession);
        if (filters.city) params.set('city', filters.city);
        if (filters.available) params.set('available', filters.available);
        if (filters.minRating) params.set('minRating', filters.minRating);
        params.set('sort', filters.sort);
        params.set('page', String(pagination.page));
        params.set('limit', String(pagination.limit));

        const res = await fetch(`${API_URL}/api/workers?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          setWorkers(data.data.workers);
          setPagination(data.data.pagination);
        } else {
          setError(data.message || 'Greška pri učitavanju');
        }
      } catch (err) {
        setError('Greška pri povezivanju sa serverom');
        console.error('Error loading workers:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkers();
  }, [filters, pagination.page]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/majstori?${params.toString()}`);
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400">
            ★
          </span>
        );
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <span key={i} className="text-yellow-400">
            ☆
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-gray-300">
            ★
          </span>
        );
      }
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Beta Banner */}
      {betaStatus?.isBeta && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <span className="font-bold">BETA PERIOD</span>
                <span className="hidden md:inline">-</span>
                <span>Svi kontakti su BESPLATNI!</span>
              </div>
              {betaStatus.progress && (
                <div className="flex items-center gap-3">
                  <span className="text-sm">
                    {betaStatus.progress.current}/{betaStatus.progress.target} majstora
                  </span>
                  <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${betaStatus.progress.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{betaStatus.progress.percentage}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Pronađi Majstora</h1>
          <p className="mt-2 text-gray-600">
            Pretražite preko {pagination.total || '...'} majstora u vašoj okolini
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Filteri pretrage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Profession */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profesija
                </label>
                <Select
                  value={filters.profession}
                  onValueChange={(val) => handleFilterChange('profession', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sve profesije" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sve profesije</SelectItem>
                    {Object.entries(groupedProfessions).map(([category, profs]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100">
                          {CATEGORY_NAMES[category] || category}
                        </div>
                        {profs.map((prof) => (
                          <SelectItem key={prof.id} value={prof.name}>
                            {prof.icon} {prof.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grad
                </label>
                <Input
                  placeholder="Npr. Beograd"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                />
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dostupnost
                </label>
                <Select
                  value={filters.available}
                  onValueChange={(val) => handleFilterChange('available', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Svi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Svi</SelectItem>
                    <SelectItem value="true">Samo dostupni</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min. ocena
                </label>
                <Select
                  value={filters.minRating}
                  onValueChange={(val) => handleFilterChange('minRating', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sve ocene" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sve ocene</SelectItem>
                    <SelectItem value="4">4+ zvezde</SelectItem>
                    <SelectItem value="3">3+ zvezde</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sortiraj po
                </label>
                <Select
                  value={filters.sort}
                  onValueChange={(val) => handleFilterChange('sort', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Oceni</SelectItem>
                    <SelectItem value="price">Ceni</SelectItem>
                    <SelectItem value="recent">Aktivnosti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Učitavanje majstora...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Pokušaj ponovo
            </Button>
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              Nema majstora koji odgovaraju vašim kriterijumima.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setFilters({
                  profession: '',
                  city: '',
                  available: '',
                  minRating: '',
                  sort: 'rating',
                });
                router.push('/majstori');
              }}
            >
              Očisti filtere
            </Button>
          </div>
        ) : (
          <>
            {/* Worker Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map((worker) => (
                <Link key={worker.id} href={`/majstori/${worker.slug || worker.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {worker.avatarUrl ? (
                            <img
                              src={worker.avatarUrl}
                              alt={worker.displayName}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-2xl text-blue-600">
                                {worker.displayName?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {worker.displayName}
                            </h3>
                            {worker.isVerified && (
                              <span className="text-blue-500" title="Verifikovan">
                                ✓
                              </span>
                            )}
                            {worker.isPro && (
                              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">
                                PRO
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {worker.profession}
                          </p>
                          <p className="text-sm text-gray-500">
                            {worker.city}, {worker.country}
                          </p>
                        </div>
                      </div>

                      {/* Bio */}
                      {worker.bio && (
                        <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                          {worker.bio}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {renderStars(worker.rating || 0)}
                          <span className="text-sm text-gray-600 ml-1">
                            ({worker.reviewCount || 0})
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            AVAILABILITY_STATUS[worker.availability]?.color ||
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {AVAILABILITY_STATUS[worker.availability]?.label || worker.availability}
                        </span>
                      </div>

                      {/* Price */}
                      {(worker.hourlyRate || worker.dailyRate) && (
                        <div className="mt-3 pt-3 border-t text-sm">
                          {worker.hourlyRate && (
                            <span className="text-gray-900 font-medium">
                              {worker.hourlyRate} {worker.currency}/sat
                            </span>
                          )}
                          {worker.hourlyRate && worker.dailyRate && (
                            <span className="mx-2 text-gray-300">|</span>
                          )}
                          {worker.dailyRate && (
                            <span className="text-gray-600">
                              {worker.dailyRate} {worker.currency}/dan
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  Prethodna
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                  Strana {pagination.page} od {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Sledeća
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA */}
      <div className="bg-blue-600 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold">Vi ste majstor?</h2>
          <p className="mt-2 text-blue-100">
            Registrujte se besplatno i primajte zahteve za posao u vašoj okolini.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="mt-6"
            onClick={() => router.push('/kontrolna-tabla/majstor-profil')}
          >
            Kreiraj majstorski profil
          </Button>
        </div>
      </div>
    </div>
  );
}
