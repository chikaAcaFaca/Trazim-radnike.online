'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Briefcase, MapPin } from 'lucide-react';

export default function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (location) params.set('location', location);
    router.push(`/oglasi?${params}`);
  };

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div className="bg-slate-800 rounded-xl p-6">
        <h4 className="text-center text-slate-400 mb-4">Pretraga oglasa</h4>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Zanat (npr. pekar, vozač...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Mesto (npr. Beograd...)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Search className="h-5 w-5" />
            Traži
          </button>
        </form>
        <p className="text-center text-slate-500 text-sm mt-4">
          Pretraga po zanatu i mestu rada
        </p>
      </div>
    </div>
  );
}
