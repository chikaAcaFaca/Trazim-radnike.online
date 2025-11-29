'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useIsAuthenticated, useAuthTokens } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Company {
  id: string;
  name: string;
}

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
}

const initialFormData: JobFormData = {
  title: '',
  descriptionFull: '',
  descriptionPublic: '',
  salary: '',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'EUR',
  numWorkers: '1',
  location: '',
  locationCity: '',
  locationCountry: 'RS',
  workHours: '',
  housing: false,
  housingDesc: '',
  experience: '',
  languages: '',
  requirements: '',
  benefits: '',
  urgency: 'NORMAL',
};

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

export default function NewJobPage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const tokens = useAuthTokens();

  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Wait for client-side hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load company data
  useEffect(() => {
    if (isMounted && tokens?.accessToken) {
      loadCompany();
    } else if (isMounted && !tokens?.accessToken) {
      setIsLoadingCompany(false);
    }
  }, [isMounted, tokens?.accessToken]);

  const loadCompany = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile/company`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });
      const data = await response.json();

      if (data.success && data.data.company) {
        setCompany(data.data.company);
      }
    } catch (err) {
      console.error('Error loading company:', err);
    } finally {
      setIsLoadingCompany(false);
    }
  };

  // Redirect if not authenticated or phone not verified
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push('/prijava');
    } else if (isMounted && user && !user.phoneVerified) {
      router.push('/kontrolna-tabla');
    }
  }, [isMounted, isAuthenticated, user, router]);

  // Show loading while checking auth or company
  if (!isMounted || isLoadingCompany) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Ucitavanje...</p>
      </div>
    );
  }

  // Show message if company doesn't exist
  if (!company) {
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
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Potreban je profil kompanije</CardTitle>
              <CardDescription className="text-yellow-700">
                Pre kreiranja oglasa morate sacuvati podatke o vasoj kompaniji
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Da biste mogli kreirati oglase za radnike, prvo morate popuniti podatke o vasoj kompaniji
                u podesavanjima. Ovo ukljucuje naziv firme, lokaciju i kontakt informacije.
              </p>
              <div className="flex gap-3">
                <Link href="/kontrolna-tabla/podesavanja">
                  <Button>
                    Idi na podesavanja
                  </Button>
                </Link>
                <Link href="/kontrolna-tabla">
                  <Button variant="outline">
                    Nazad na kontrolnu tablu
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = true) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare data
      const jobData = {
        title: formData.title,
        descriptionFull: formData.descriptionFull,
        descriptionPublic: formData.descriptionPublic || undefined,
        salary: formData.salary || undefined,
        salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
        salaryCurrency: formData.salaryCurrency,
        numWorkers: parseInt(formData.numWorkers) || 1,
        location: formData.location,
        locationCity: formData.locationCity || undefined,
        locationCountry: formData.locationCountry || undefined,
        workHours: formData.workHours || undefined,
        housing: formData.housing,
        housingDesc: formData.housing ? formData.housingDesc : undefined,
        experience: formData.experience || undefined,
        languages: formData.languages ? formData.languages.split(',').map((l) => l.trim()) : undefined,
        requirements: formData.requirements || undefined,
        benefits: formData.benefits || undefined,
        urgency: formData.urgency,
      };

      const response = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri kreiranju oglasa');
      }

      const jobId = data.data.job.id;

      // If not saving as draft, publish immediately
      if (!saveAsDraft) {
        const publishResponse = await fetch(`${API_URL}/api/jobs/${jobId}/publish`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
        });

        const publishData = await publishResponse.json();
        if (!publishResponse.ok || !publishData.success) {
          // Job created but publish failed - redirect to job page
          router.push(`/kontrolna-tabla/oglasi/${jobId}`);
          return;
        }
      }

      router.push(`/kontrolna-tabla/oglasi/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri kreiranju oglasa');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Novi oglas za radnike</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, true)}>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="Opisite detaljno sta podrazumeva posao, kakvi su uslovi rada, koje su duznosti..."
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
                  placeholder="Kratak opis koji ce biti vidljiv javno (ako oglas bude javan)"
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
            <Link href="/kontrolna-tabla/oglasi">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Odustani
              </Button>
            </Link>
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Cuvanje...' : 'Sacuvaj kao nacrt'}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, false)}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Objavljujem...' : 'Sacuvaj i objavi'}
            </Button>
          </div>
        </form>

        {/* Info box */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Napomena</h3>
          <p className="text-sm text-blue-700">
            Mi smo konsalting agencija koja vam pomaze u pripremi dokumentacije za zaposljavanje
            radnika. Ovaj oglas sluzi da nam opisete vase potrebe kako bismo vam mogli pomoci
            sa pripremom potrebne dokumentacije i savjetovati vas kroz proces.
          </p>
        </div>
      </main>
    </div>
  );
}
