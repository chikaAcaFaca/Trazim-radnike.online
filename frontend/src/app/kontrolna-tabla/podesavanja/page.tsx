'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, useUser, useIsAuthenticated, useAuthTokens } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ChatbotCollectedData {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  pib?: string;
  maticniBroj?: string;
  city?: string;
  country?: string;
}

// Country list for Balkans
const COUNTRIES = [
  { code: 'RS', name: 'Srbija' },
  { code: 'ME', name: 'Crna Gora' },
  { code: 'HR', name: 'Hrvatska' },
  { code: 'BA', name: 'Bosna i Hercegovina' },
  { code: 'MK', name: 'Severna Makedonija' },
  { code: 'BG', name: 'Bugarska' },
  { code: 'RO', name: 'Rumunija' },
  { code: 'SI', name: 'Slovenija' },
  { code: 'AL', name: 'Albanija' },
  { code: 'XK', name: 'Kosovo' },
];

const INDUSTRIES = [
  'Građevinarstvo',
  'Proizvodnja',
  'Ugostiteljstvo',
  'Transport i logistika',
  'Poljoprivreda',
  'IT i tehnologija',
  'Zdravstvo',
  'Trgovina',
  'Usluge',
  'Ostalo',
];

interface Company {
  id: string;
  slug: string;
  name: string;
  country: string;
  city: string | null;
  industry: string | null;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  pib: string | null;
  maticniBroj: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  eVizitkUrl: string | null;
  bzrPortalUrl: string | null;
  isPublicProfile: boolean;
  profileTemplate: string;
  profileColorSet: string;
  profilePrimaryColor: string | null;
  profileSecondaryColor: string | null;
  profileAccentColor: string | null;
}

// Template options
const PROFILE_TEMPLATES = [
  { id: 'modern', name: 'Modern', description: 'Cist dizajn sa velikim headerom i kartama' },
  { id: 'classic', name: 'Klasican', description: 'Tradicionalni poslovni izgled' },
  { id: 'minimal', name: 'Minimalisticki', description: 'Jednostavan sa fokusom na sadrzaj' },
  { id: 'bold', name: 'Izrazajan', description: 'Smele boje i veliki tipografija' },
  { id: 'elegant', name: 'Elegantan', description: 'Sofisticiran sa suptilnim detaljima' },
];

// Predefined color sets
const COLOR_SETS = [
  { id: 'blue', name: 'Plava', primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6' },
  { id: 'green', name: 'Zelena', primary: '#059669', secondary: '#047857', accent: '#10b981' },
  { id: 'purple', name: 'Ljubicasta', primary: '#7c3aed', secondary: '#6d28d9', accent: '#8b5cf6' },
  { id: 'orange', name: 'Narandzasta', primary: '#ea580c', secondary: '#c2410c', accent: '#f97316' },
  { id: 'custom', name: 'Prilagodi', primary: null, secondary: null, accent: null },
];

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const tokens = useAuthTokens();
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [prefilledData, setPrefilledData] = useState<ChatbotCollectedData | null>(null);

  // Profile form
  const [phone, setPhone] = useState('');

  // Company form
  const [companyForm, setCompanyForm] = useState({
    name: '',
    country: 'RS',
    city: '',
    industry: '',
    description: '',
    website: '',
    pib: '',
    maticniBroj: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    eVizitkUrl: '',
    bzrPortalUrl: '',
    isPublicProfile: false,
    profileTemplate: 'modern',
    profileColorSet: 'blue',
    profilePrimaryColor: '',
    profileSecondaryColor: '',
    profileAccentColor: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/prijava');
    }
  }, [isAuthenticated, router]);

  // Check for setup mode and load prefilled data from chatbot
  useEffect(() => {
    const isSetup = searchParams.get('setup') === 'true';
    if (isSetup) {
      setIsSetupMode(true);
      const storedData = localStorage.getItem('chatbot_collected_data');
      if (storedData) {
        try {
          const data: ChatbotCollectedData = JSON.parse(storedData);
          setPrefilledData(data);
          // Pre-fill company form with chatbot data
          setCompanyForm(prev => ({
            ...prev,
            name: data.companyName || prev.name,
            city: data.city || prev.city,
            pib: data.pib || '',
            maticniBroj: data.maticniBroj || '',
          }));
          // Pre-fill phone
          if (data.phone) {
            setPhone(data.phone);
          }
          // Clear the stored data after loading
          // localStorage.removeItem('chatbot_collected_data');
        } catch (e) {
          console.error('Error parsing chatbot data:', e);
        }
      }
    }
  }, [searchParams]);

  // Load company data
  useEffect(() => {
    if (tokens?.accessToken) {
      loadCompany();
    }
  }, [tokens?.accessToken]);

  // Set phone from user
  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user?.phone]);

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
        setCompanyForm({
          name: data.data.company.name || '',
          country: data.data.company.country || 'RS',
          city: data.data.company.city || '',
          industry: data.data.company.industry || '',
          description: data.data.company.description || '',
          website: data.data.company.website || '',
          pib: data.data.company.pib || '',
          maticniBroj: data.data.company.maticniBroj || '',
          contactName: data.data.company.contactName || '',
          contactPhone: data.data.company.contactPhone || '',
          contactEmail: data.data.company.contactEmail || '',
          address: data.data.company.address || '',
          facebookUrl: data.data.company.facebookUrl || '',
          instagramUrl: data.data.company.instagramUrl || '',
          twitterUrl: data.data.company.twitterUrl || '',
          linkedinUrl: data.data.company.linkedinUrl || '',
          eVizitkUrl: data.data.company.eVizitkUrl || '',
          bzrPortalUrl: data.data.company.bzrPortalUrl || '',
          isPublicProfile: data.data.company.isPublicProfile || false,
          profileTemplate: data.data.company.profileTemplate || 'modern',
          profileColorSet: data.data.company.profileColorSet || 'blue',
          profilePrimaryColor: data.data.company.profilePrimaryColor || '',
          profileSecondaryColor: data.data.company.profileSecondaryColor || '',
          profileAccentColor: data.data.company.profileAccentColor || '',
        });
        // Set logo preview if exists
        if (data.data.company.logoUrl) {
          setLogoPreview(data.data.company.logoUrl);
        }
      }
    } catch (err) {
      console.error('Error loading company:', err);
    } finally {
      setIsLoadingCompany(false);
    }
  };

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ phone: phone || null }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri cuvanju');
      }

      updateUser({ phone: data.data.user.phone, phoneVerified: false });
      setSuccess('Telefon uspesno sacuvan. Verifikujte broj.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri cuvanju');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const method = company ? 'PUT' : 'POST';
      const response = await fetch(`${API_URL}/api/profile/company`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          name: companyForm.name,
          country: companyForm.country,
          city: companyForm.city || undefined,
          industry: companyForm.industry || undefined,
          description: companyForm.description || undefined,
          website: companyForm.website || undefined,
          pib: companyForm.pib || undefined,
          maticniBroj: companyForm.maticniBroj || undefined,
          contactName: companyForm.contactName || undefined,
          contactPhone: companyForm.contactPhone || undefined,
          contactEmail: companyForm.contactEmail || undefined,
          address: companyForm.address || undefined,
          facebookUrl: companyForm.facebookUrl || undefined,
          instagramUrl: companyForm.instagramUrl || undefined,
          twitterUrl: companyForm.twitterUrl || undefined,
          linkedinUrl: companyForm.linkedinUrl || undefined,
          eVizitkUrl: companyForm.eVizitkUrl || undefined,
          bzrPortalUrl: companyForm.bzrPortalUrl || undefined,
          isPublicProfile: companyForm.isPublicProfile,
          profileTemplate: companyForm.profileTemplate,
          profileColorSet: companyForm.profileColorSet,
          profilePrimaryColor: companyForm.profileColorSet === 'custom' ? companyForm.profilePrimaryColor || undefined : undefined,
          profileSecondaryColor: companyForm.profileColorSet === 'custom' ? companyForm.profileSecondaryColor || undefined : undefined,
          profileAccentColor: companyForm.profileColorSet === 'custom' ? companyForm.profileAccentColor || undefined : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri cuvanju');
      }

      setCompany(data.data.company);
      setSuccess('Podaci o kompaniji uspesno sacuvani');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri cuvanju');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Samo slike su dozvoljene');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo mora biti manji od 5MB');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setIsUploadingLogo(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await fetch(`${API_URL}/api/profile/company/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri uploadu');
      }

      setCompany(data.data.company);
      setLogoFile(null);
      setSuccess('Logo uspesno uploadovan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri uploadu');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    setIsUploadingLogo(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/profile/company/logo`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri brisanju');
      }

      setCompany(data.data.company);
      setLogoPreview(null);
      setLogoFile(null);
      setSuccess('Logo uspesno obrisan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri brisanju');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Podesavanja</h1>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Account info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informacije o nalogu</CardTitle>
            <CardDescription>Osnovni podaci o vasem nalogu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status emaila</p>
                  <p className={user.emailVerified ? 'text-green-600' : 'text-yellow-600'}>
                    {user.emailVerified ? 'Verifikovan' : 'Nije verifikovan'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Uloga</p>
                  <p className="font-medium">{user.role === 'EMPLOYER' ? 'Poslodavac' : user.role}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status telefona</p>
                  <p className={user.phoneVerified ? 'text-green-600' : 'text-yellow-600'}>
                    {user.phone ? (user.phoneVerified ? 'Verifikovan' : 'Nije verifikovan') : 'Nije unet'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phone number */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Broj telefona</CardTitle>
            <CardDescription>
              Broj telefona je potreban za verifikaciju i kreiranje oglasa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePhone} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Broj telefona</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+381601234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500">
                  Format: +381601234567 (sa pozivnim brojem drzave)
                </p>
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Cuvanje...' : 'Sacuvaj telefon'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Setup mode banner */}
        {isSetupMode && prefilledData && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <h3 className="font-semibold text-green-800">Dobrodosli! Podaci su vec popunjeni</h3>
                <p className="text-sm text-green-700 mt-1">
                  Podaci koje ste uneli kroz razgovor sa AI asistentom su vec popunjeni ispod.
                  Pregledajte ih i sacuvajte profil kompanije da biste mogli kreirati oglase.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Company Logo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Logo kompanije</CardTitle>
            <CardDescription>
              Dodajte logo vase kompanije (max 5MB, samo slike)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              {/* Logo preview */}
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo kompanije"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                    {company?.logoUrl && (
                      <button
                        type="button"
                        onClick={handleLogoDelete}
                        disabled={isUploadingLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                        title="Obrisi logo"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-4xl">?</span>
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex-1 space-y-3">
                <div>
                  <input
                    type="file"
                    id="logoUpload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    disabled={isUploadingLogo}
                  />
                  <label
                    htmlFor="logoUpload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                  >
                    Izaberi sliku
                  </label>
                </div>

                {logoFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{logoFile.name}</span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleLogoUpload}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? 'Upload...' : 'Uploaduj'}
                    </Button>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Preporucene dimenzije: 200x200px. Podrzani formati: JPG, PNG, GIF, WebP.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Podaci o kompaniji</CardTitle>
            <CardDescription>
              Informacije o vasoj kompaniji koje ce videti nas tim
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCompany ? (
              <p className="text-gray-500">Ucitavanje...</p>
            ) : (
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Naziv kompanije *</Label>
                    <Input
                      id="companyName"
                      placeholder="Naziv vase kompanije"
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      required
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Drzava *</Label>
                    <select
                      id="country"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={companyForm.country}
                      onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                      required
                      disabled={isSaving}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Grad</Label>
                    <Input
                      id="city"
                      placeholder="Beograd"
                      value={companyForm.city}
                      onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industrija</Label>
                    <select
                      id="industry"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={companyForm.industry}
                      onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                      disabled={isSaving}
                    >
                      <option value="">Izaberite industriju</option>
                      {INDUSTRIES.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Business registration fields */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-4">Registracioni podaci firme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pib">PIB (Poreski identifikacioni broj)</Label>
                      <Input
                        id="pib"
                        placeholder="123456789"
                        value={companyForm.pib}
                        onChange={(e) => setCompanyForm({ ...companyForm, pib: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                        disabled={isSaving}
                        maxLength={9}
                      />
                      <p className="text-xs text-gray-500">9 cifara</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maticniBroj">Maticni broj</Label>
                      <Input
                        id="maticniBroj"
                        placeholder="12345678"
                        value={companyForm.maticniBroj}
                        onChange={(e) => setCompanyForm({ ...companyForm, maticniBroj: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                        disabled={isSaving}
                        maxLength={8}
                      />
                      <p className="text-xs text-gray-500">8 cifara</p>
                    </div>
                  </div>
                </div>

                {/* Contact info fields */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-4">Kontakt informacije</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Ime kontakt osobe</Label>
                      <Input
                        id="contactName"
                        placeholder="Ime i prezime"
                        value={companyForm.contactName}
                        onChange={(e) => setCompanyForm({ ...companyForm, contactName: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Kontakt telefon</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        placeholder="+381601234567"
                        value={companyForm.contactPhone}
                        onChange={(e) => setCompanyForm({ ...companyForm, contactPhone: e.target.value })}
                        disabled={isSaving}
                      />
                      <p className="text-xs text-gray-500">Telefon za kontakt u vezi oglasa</p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="contactEmail">Kontakt email (javni)</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="info@firma.rs"
                        value={companyForm.contactEmail}
                        onChange={(e) => setCompanyForm({ ...companyForm, contactEmail: e.target.value })}
                        disabled={isSaving}
                      />
                      <p className="text-xs text-gray-500">Javni email za kontakt sa klijentima</p>
                    </div>
                  </div>
                </div>

                {/* Address for Google Maps */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-4">Lokacija (za prikaz na mapi)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresa</Label>
                    <textarea
                      id="address"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Unesite punu adresu kompanije (ulica, broj, postanski broj, grad)..."
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      disabled={isSaving}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500">
                      Adresa ce biti koriscena za pozicioniranje na Google mapi na nasem sajtu.
                      {companyForm.address.length > 0 && ` ${companyForm.address.length}/500 karaktera`}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Web sajt</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.example.com"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Opis kompanije</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Kratki opis vase kompanije i delatnosti..."
                    value={companyForm.description}
                    onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                    disabled={isSaving}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500">
                    {companyForm.description.length}/1000 karaktera
                  </p>
                </div>

                {/* Social media links */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium text-gray-900 mb-4">Drustvene mreze i online profili</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebookUrl">Facebook</Label>
                      <Input
                        id="facebookUrl"
                        type="url"
                        placeholder="https://facebook.com/vasa-stranica"
                        value={companyForm.facebookUrl}
                        onChange={(e) => setCompanyForm({ ...companyForm, facebookUrl: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagramUrl">Instagram</Label>
                      <Input
                        id="instagramUrl"
                        type="url"
                        placeholder="https://instagram.com/vas-profil"
                        value={companyForm.instagramUrl}
                        onChange={(e) => setCompanyForm({ ...companyForm, instagramUrl: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitterUrl">X (Twitter)</Label>
                      <Input
                        id="twitterUrl"
                        type="url"
                        placeholder="https://x.com/vas-profil"
                        value={companyForm.twitterUrl}
                        onChange={(e) => setCompanyForm({ ...companyForm, twitterUrl: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedinUrl">LinkedIn</Label>
                      <Input
                        id="linkedinUrl"
                        type="url"
                        placeholder="https://linkedin.com/company/vasa-firma"
                        value={companyForm.linkedinUrl}
                        onChange={(e) => setCompanyForm({ ...companyForm, linkedinUrl: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eVizitkUrl">e-Vizitka</Label>
                      <Input
                        id="eVizitkUrl"
                        type="url"
                        placeholder="https://e-vizitka.online/vasa-firma"
                        value={companyForm.eVizitkUrl}
                        onChange={(e) => setCompanyForm({ ...companyForm, eVizitkUrl: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bzrPortalUrl">BZR Portal</Label>
                      <Input
                        id="bzrPortalUrl"
                        type="url"
                        placeholder="https://www.bzr-portal.com/vasa-firma"
                        value={companyForm.bzrPortalUrl}
                        onChange={(e) => setCompanyForm({ ...companyForm, bzrPortalUrl: e.target.value })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>

                {/* Public profile toggle */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Javni profil kompanije</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Kada je ukljuceno, vasa kompanija ce imati javno dostupnu stranicu sa osnovnim informacijama,
                        kontakt podacima i linkovima ka drustvenim mrezama. Na ovoj stranici se NE prikazuju oglasi za radnike.
                      </p>
                      {company?.slug && companyForm.isPublicProfile && (
                        <p className="text-sm text-blue-600 mt-2">
                          Vas javni profil: <a href={`/firma/${company.slug}`} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">/firma/{company.slug}</a>
                        </p>
                      )}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={companyForm.isPublicProfile}
                        onChange={(e) => setCompanyForm({ ...companyForm, isPublicProfile: e.target.checked })}
                        disabled={isSaving}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Profile template selection */}
                {companyForm.isPublicProfile && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium text-gray-900 mb-4">Izgled profila</h3>

                    {/* Template selection */}
                    <div className="mb-6">
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Izaberite template</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {PROFILE_TEMPLATES.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => setCompanyForm({ ...companyForm, profileTemplate: template.id })}
                            disabled={isSaving}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                              companyForm.profileTemplate === template.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="font-medium text-gray-900">{template.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color set selection */}
                    <div className="mb-6">
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Izaberite boje</Label>
                      <div className="flex flex-wrap gap-3">
                        {COLOR_SETS.map((colorSet) => (
                          <button
                            key={colorSet.id}
                            type="button"
                            onClick={() => setCompanyForm({ ...companyForm, profileColorSet: colorSet.id })}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                              companyForm.profileColorSet === colorSet.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            {colorSet.primary ? (
                              <div className="flex -space-x-1">
                                <div className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: colorSet.primary }}></div>
                                <div className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: colorSet.secondary || colorSet.primary }}></div>
                                <div className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: colorSet.accent || colorSet.primary }}></div>
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500"></div>
                            )}
                            <span className="text-sm font-medium text-gray-700">{colorSet.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom colors */}
                    {companyForm.profileColorSet === 'custom' && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">Prilagodite boje</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="primaryColor" className="text-xs text-gray-600">Primarna boja</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                id="primaryColor"
                                value={companyForm.profilePrimaryColor || '#2563eb'}
                                onChange={(e) => setCompanyForm({ ...companyForm, profilePrimaryColor: e.target.value })}
                                disabled={isSaving}
                                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                              />
                              <Input
                                value={companyForm.profilePrimaryColor || '#2563eb'}
                                onChange={(e) => setCompanyForm({ ...companyForm, profilePrimaryColor: e.target.value })}
                                placeholder="#2563eb"
                                disabled={isSaving}
                                className="flex-1 font-mono text-sm"
                                maxLength={7}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="secondaryColor" className="text-xs text-gray-600">Sekundarna boja</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                id="secondaryColor"
                                value={companyForm.profileSecondaryColor || '#1e40af'}
                                onChange={(e) => setCompanyForm({ ...companyForm, profileSecondaryColor: e.target.value })}
                                disabled={isSaving}
                                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                              />
                              <Input
                                value={companyForm.profileSecondaryColor || '#1e40af'}
                                onChange={(e) => setCompanyForm({ ...companyForm, profileSecondaryColor: e.target.value })}
                                placeholder="#1e40af"
                                disabled={isSaving}
                                className="flex-1 font-mono text-sm"
                                maxLength={7}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="accentColor" className="text-xs text-gray-600">Akcenat boja</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                id="accentColor"
                                value={companyForm.profileAccentColor || '#3b82f6'}
                                onChange={(e) => setCompanyForm({ ...companyForm, profileAccentColor: e.target.value })}
                                disabled={isSaving}
                                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                              />
                              <Input
                                value={companyForm.profileAccentColor || '#3b82f6'}
                                onChange={(e) => setCompanyForm({ ...companyForm, profileAccentColor: e.target.value })}
                                placeholder="#3b82f6"
                                disabled={isSaving}
                                className="flex-1 font-mono text-sm"
                                maxLength={7}
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          Unesite hex kod boje (npr. #2563eb) ili koristite color picker.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Button type="submit" disabled={isSaving || !companyForm.name}>
                  {isSaving ? 'Cuvanje...' : company ? 'Sacuvaj izmene' : 'Kreiraj kompaniju'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Back link */}
        <div className="text-center">
          <Link href="/kontrolna-tabla" className="text-blue-600 hover:text-blue-800">
            &larr; Nazad na kontrolnu tablu
          </Link>
        </div>
      </main>
    </div>
  );
}
