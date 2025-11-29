'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Briefcase,
  Euro,
  Users,
  Home,
  Clock,
  ArrowRight,
  RefreshCw,
  Building2,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Job {
  id: string;
  title: string;
  slug: string;
  descriptionPublic: string | null;
  salary: string | null;
  location: string;
  locationCity: string | null;
  numWorkers: number;
  housing: boolean;
  createdAt: string;
  company: {
    name: string;
    city: string | null;
    logoUrl: string | null;
  };
}

interface SearchResult {
  jobs: Job[];
  total: number;
  page: number;
  totalPages: number;
}

export default function OglasnaTabla() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchJobs = useCallback(async (q?: string, loc?: string, page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (loc) params.set('location', loc);
      params.set('page', page.toString());
      params.set('limit', '12');

      const res = await fetch(`${API_URL}/api/jobs/search?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await res.json();
      setResults(data.data);
    } catch (err) {
      setError('Greška pri učitavanju oglasa. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchJobs(searchParams.get('q') || '', searchParams.get('location') || '');
  }, [searchParams, searchJobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (location) params.set('location', location);
    router.push(`/oglasi?${params}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Danas';
    if (days === 1) return 'Juče';
    if (days < 7) return `Pre ${days} dana`;
    if (days < 30) return `Pre ${Math.floor(days / 7)} nedelja`;
    return date.toLocaleDateString('sr-RS');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Tražim-Radnike<span className="text-slate-400">.online</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/prijava"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Prijava
            </Link>
            <Link
              href="/registracija"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Postavi oglas
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero / Search Section */}
      <section className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Oglasna tabla</h1>
            <p className="text-slate-300">
              Pretraži oglase za posao po zanatu i lokaciji
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Zanat ili pozicija (npr. pekar, vozač...)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Grad ili mesto (npr. Beograd...)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Search className="h-5 w-5" />
                Traži
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Results Section */}
      <section className="container mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {results && (
              <p className="text-slate-600">
                {results.total === 0
                  ? 'Nema rezultata'
                  : `Pronađeno ${results.total} ${results.total === 1 ? 'oglas' : results.total < 5 ? 'oglasa' : 'oglasa'}`}
                {(query || location) && (
                  <span className="text-slate-400">
                    {query && ` za "${query}"`}
                    {location && ` u "${location}"`}
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => searchJobs(query, location)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Osveži
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-500">Učitavanje oglasa...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="bg-red-50 text-red-700 p-6 rounded-lg inline-block">
              <p>{error}</p>
              <button
                onClick={() => searchJobs(query, location)}
                className="mt-4 px-4 py-2 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                Pokušaj ponovo
              </button>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && results && results.jobs.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Nema oglasa</h3>
            <p className="text-slate-500 mb-6">
              {query || location
                ? 'Nema oglasa koji odgovaraju vašoj pretrazi. Pokušajte sa drugim pojmovima.'
                : 'Trenutno nema aktivnih oglasa. Vratite se kasnije.'}
            </p>
            <Link
              href="/registracija"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Postavi prvi oglas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Job Cards Grid */}
        {!loading && !error && results && results.jobs.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/oglas/${job.slug}`}
                  className="bg-white rounded-xl border hover:shadow-lg transition-all group"
                >
                  <div className="p-6">
                    {/* Company Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        {job.company.logoUrl ? (
                          <img
                            src={job.company.logoUrl}
                            alt={job.company.name}
                            className="w-10 h-10 object-contain rounded"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {job.company.name}
                        </p>
                        {job.company.city && (
                          <p className="text-xs text-slate-500">{job.company.city}</p>
                        )}
                      </div>
                    </div>

                    {/* Job Title */}
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>

                    {/* Job Details */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        <MapPin className="h-3 w-3" />
                        {job.locationCity || job.location}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        <Users className="h-3 w-3" />
                        {job.numWorkers} {job.numWorkers === 1 ? 'radnik' : job.numWorkers < 5 ? 'radnika' : 'radnika'}
                      </span>
                      {job.housing && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          <Home className="h-3 w-3" />
                          Smeštaj
                        </span>
                      )}
                    </div>

                    {/* Salary */}
                    {job.salary && (
                      <div className="flex items-center gap-2 text-sm text-slate-700 mb-3">
                        <Euro className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{job.salary}</span>
                      </div>
                    )}

                    {/* Description Preview */}
                    {job.descriptionPublic && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                        {job.descriptionPublic}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(job.createdAt)}
                      </span>
                      <span className="text-sm font-medium text-blue-600 group-hover:underline">
                        Pogledaj oglas →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {results.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {Array.from({ length: results.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (query) params.set('q', query);
                      if (location) params.set('location', location);
                      params.set('page', page.toString());
                      router.push(`/oglasi?${params}`);
                    }}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      page === results.page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Tražite radnike?</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            Postavite besplatan oglas i pronađite radnike. Specijalizovani smo za radnike iz Indije, Nepala, Egipta i Bangladeša.
          </p>
          <Link
            href="/registracija"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Postavi besplatan oglas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© 2025 Tražim-Radnike.online | NKNet-Consulting.com</p>
        </div>
      </footer>
    </div>
  );
}
