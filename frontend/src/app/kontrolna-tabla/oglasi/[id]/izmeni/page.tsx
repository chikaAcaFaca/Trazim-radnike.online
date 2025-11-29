'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useIsAuthenticated, useAuthTokens } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface JobFormData {
  title: string;
  descriptionFull: string;
  descriptionPublic: string;
  salary: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  numWorkers: string;
  location: string;
  locationCity: string;
  locationCountry: string;
  workHours: string;
  housing: boolean;
  housingDesc: string;
  experience: string;
  languages: string;
  requirements: string;
  benefits: string;
  urgency: string;
  visibility: string;
}

const countries = [
  { code: 'RS', name: 'Srbija' },
  { code: 'HR', name: 'Hrvatska' },
  { code: 'BA', name: 'Bosna i Hercegovina' },
  { code: 'ME', name: 'Crna Gora' },
  { code: 'SI', name: 'Slovenija' },
  { code: 'MK', name: 'Severna Makedonija' },
  { code: 'DE', name: 'Nemacka' },
  { code: 'AT', name: 'Austrija' },
];

const currencies = [
  { code: 'EUR', name: 'Euro (EUR)' },
  { code: 'RSD', name: 'Srpski dinar (RSD)' },
  { code: 'HRK', name: 'Hrvatska kuna (HRK)' },
  { code: 'BAM', name: 'Konvertibilna marka (BAM)' },
  { code: 'USD', name: 'Americki dolar (USD)' },
];

const urgencyLevels = [
  { value: 'LOW', label: 'Nisko - nije hitno' },
  { value: 'NORMAL', label: 'Normalno - standardno' },
  { value: 'HIGH', label: 'Visoko - sto pre' },
  { value: 'URGENT', label: 'Hitno - odmah' },
];

const visibilityOptions = [
  { value: 'PRIVATE', label: 'Privatno - samo vi vidite' },
  { value: 'SECRET', label: 'Tajni link - pristup samo sa linkom' },
  { value: 'PUBLIC', label: 'Javno - vidljivo svima (ogranicen prikaz)' },
];

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const tokens = useAuthTokens();

  const [formData, setFormData] = useState<JobFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const job = data.data.job;
      setFormData({
        title: job.title || '',
        descriptionFull: job.descriptionFull || '',
        descriptionPublic: job.descriptionPublic || '',
        salary: job.salary || '',
        salaryMin: job.salaryMin?.toString() || '',
        salaryMax: job.salaryMax?.toString() || '',
        salaryCurrency: job.salaryCurrency || 'EUR',
        numWorkers: job.numWorkers?.toString() || '1',
        location: job.location || '',
        locationCity: job.locationCity || '',
        locationCountry: job.locationCountry || 'RS',
        workHours: job.workHours || '',
        housing: job.housing || false,
        housingDesc: job.housingDesc || '',
        experience: job.experience || '',
        languages: Array.isArray(job.languages) ? job.languages.join(', ') : '',
        requirements: job.requirements || '',
        benefits: job.benefits || '',
        urgency: job.urgency || 'NORMAL',
        visibility: job.visibility || 'PRIVATE',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri ucitavanju');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
          }
        : null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const jobData = {
        title: formData.title,
        descriptionFull: formData.descriptionFull,
        descriptionPublic: formData.descriptionPublic || null,
        salary: formData.salary || null,
        salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
        salaryCurrency: formData.salaryCurrency,
        numWorkers: parseInt(formData.numWorkers) || 1,
        location: formData.location,
        locationCity: formData.locationCity || null,
        locationCountry: formData.locationCountry || null,
        workHours: formData.workHours || null,
        housing: formData.housing,
        housingDesc: formData.housing ? formData.housingDesc : null,
        experience: formData.experience || null,
        languages: formData.languages ? formData.languages.split(',').map((l) => l.trim()) : [],
        requirements: formData.requirements || null,
        benefits: formData.benefits || null,
        urgency: formData.urgency,
        visibility: formData.visibility,
      };

      const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri azuriranju oglasa');
      }

      router.push(`/kontrolna-tabla/oglasi/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri azuriranju oglasa');
    } finally {
      setIsSubmitting(false);
    }
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

  if (error && !formData) {
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
            {error}
          </div>
          <Link href="/kontrolna-tabla/oglasi" className="mt-4 inline-block text-blue-600">
            &larr; Nazad na oglase
          </Link>
        </main>
      </div>
    );
  }

  if (!formData) return null;

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
          <Link
            href={`/kontrolna-tabla/oglasi/${jobId}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            &larr; Nazad na oglas
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Izmeni oglas</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Osnovne informacije</CardTitle>
              <CardDescription>Unesite osnovne podatke o oglasu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Naziv pozicije *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="npr. Gradevinski radnik, Kuvar, Vozac..."
                  required
                  minLength={3}
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="numWorkers">Broj potrebnih radnika *</Label>
                  <Input
                    id="numWorkers"
                    name="numWorkers"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.numWorkers}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="urgency">Hitnost</Label>
                  <select
                    id="urgency"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {urgencyLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="visibility">Vidljivost</Label>
                  <select
                    id="visibility"
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {visibilityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Lokacija</CardTitle>
              <CardDescription>Gde ce radnici raditi?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">Lokacija rada *</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="npr. Beograd, Nemacka - Minhen, Remote..."
                  required
                  minLength={2}
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="locationCity">Grad</Label>
                  <Input
                    id="locationCity"
                    name="locationCity"
                    value={formData.locationCity}
                    onChange={handleChange}
                    placeholder="npr. Beograd"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="locationCountry">Drzava</Label>
                  <select
                    id="locationCountry"
                    name="locationCountry"
                    value={formData.locationCountry}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Opis posla</CardTitle>
              <CardDescription>Detaljno opisite posao i uslove</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="descriptionFull">Detaljan opis posla * (min. 50 karaktera)</Label>
                <Textarea
                  id="descriptionFull"
                  name="descriptionFull"
                  value={formData.descriptionFull}
                  onChange={handleChange}
                  placeholder="Opisite detaljno sta podrazumeva posao..."
                  required
                  minLength={50}
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.descriptionFull.length}/50 karaktera (minimum)
                </p>
              </div>

              <div>
                <Label htmlFor="descriptionPublic">Javni opis (opciono)</Label>
                <Textarea
                  id="descriptionPublic"
                  name="descriptionPublic"
                  value={formData.descriptionPublic}
                  onChange={handleChange}
                  placeholder="Kratak opis koji ce biti vidljiv javno"
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.descriptionPublic.length}/500 karaktera
                </p>
              </div>

              <div>
                <Label htmlFor="requirements">Zahtevi i kvalifikacije</Label>
                <Textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="Koje kvalifikacije, vestine ili iskustvo su potrebni..."
                  maxLength={1000}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="experience">Potrebno iskustvo</Label>
                <Input
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="npr. Minimum 2 godine iskustva, Bez iskustva..."
                  maxLength={500}
                />
              </div>

              <div>
                <Label htmlFor="languages">Potrebni jezici (odvojeni zarezom)</Label>
                <Input
                  id="languages"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  placeholder="npr. Srpski, Nemacki, Engleski"
                />
              </div>
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Plata i beneficije</CardTitle>
              <CardDescription>Informacije o kompenzaciji</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="salary">Plata (tekstualni opis)</Label>
                <Input
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="npr. 1500-2000 EUR mesecno, Po dogovoru..."
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="salaryMin">Minimalna plata</Label>
                  <Input
                    id="salaryMin"
                    name="salaryMin"
                    type="number"
                    min="0"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="salaryMax">Maksimalna plata</Label>
                  <Input
                    id="salaryMax"
                    name="salaryMax"
                    type="number"
                    min="0"
                    value={formData.salaryMax}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="salaryCurrency">Valuta</Label>
                  <select
                    id="salaryCurrency"
                    name="salaryCurrency"
                    value={formData.salaryCurrency}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="benefits">Beneficije</Label>
                <Textarea
                  id="benefits"
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  placeholder="npr. Zdravstveno osiguranje, Bonusi, Prevoz..."
                  maxLength={1000}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Work conditions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Uslovi rada</CardTitle>
              <CardDescription>Radno vreme, smestaj i ostalo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workHours">Radno vreme</Label>
                <Input
                  id="workHours"
                  name="workHours"
                  value={formData.workHours}
                  onChange={handleChange}
                  placeholder="npr. Puno radno vreme, 8h dnevno, Smenski rad..."
                  maxLength={200}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="housing"
                  name="housing"
                  checked={formData.housing}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="housing" className="text-sm font-normal">
                  Obezbedjujemo smestaj za radnike
                </Label>
              </div>

              {formData.housing && (
                <div>
                  <Label htmlFor="housingDesc">Opis smestaja</Label>
                  <Textarea
                    id="housingDesc"
                    name="housingDesc"
                    value={formData.housingDesc}
                    onChange={handleChange}
                    placeholder="Opisite kakav smestaj nudite..."
                    maxLength={500}
                    rows={2}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Link href={`/kontrolna-tabla/oglasi/${jobId}`}>
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Odustani
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? 'Cuvanje...' : 'Sacuvaj izmene'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
