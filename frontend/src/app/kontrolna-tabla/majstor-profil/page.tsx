'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Profession {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  icon: string;
}

interface WorkerFormData {
  displayName: string;
  firstName: string;
  lastName: string;
  profession: string;
  professions: string[];
  bio: string;
  city: string;
  country: string;
  workRadius: number;
  hourlyRate: number;
  dailyRate: number;
  currency: string;
  availability: string;
  yearsExperience: number;
  skills: string[];
  certificates: string[];
  languages: string[];
  showPhone: boolean;
  showEmail: boolean;
  isPublicProfile: boolean;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  websiteUrl: string;
}

const COUNTRIES = [
  { code: 'RS', name: 'Srbija' },
  { code: 'ME', name: 'Crna Gora' },
  { code: 'HR', name: 'Hrvatska' },
  { code: 'BA', name: 'Bosna i Hercegovina' },
  { code: 'MK', name: 'Severna Makedonija' },
  { code: 'BG', name: 'Bugarska' },
  { code: 'RO', name: 'Rumunija' },
];

const CURRENCIES = ['RSD', 'EUR', 'USD', 'BAM', 'HRK', 'BGN', 'RON'];

const CATEGORY_NAMES: { [key: string]: string } = {
  CONSTRUCTION: 'Građevina',
  HOME_SERVICES: 'Kućne usluge',
  AUTOMOTIVE: 'Auto',
  CLEANING: 'Čišćenje',
  GARDEN: 'Baštovanstvo',
  TRANSPORT: 'Transport',
  OTHER: 'Ostalo',
};

export default function WorkerProfilePage() {
  const router = useRouter();
  const { user, tokens } = useAuthStore();
  const token = tokens?.accessToken;

  const [formData, setFormData] = useState<WorkerFormData>({
    displayName: '',
    firstName: '',
    lastName: '',
    profession: '',
    professions: [],
    bio: '',
    city: '',
    country: 'RS',
    workRadius: 50,
    hourlyRate: 0,
    dailyRate: 0,
    currency: 'RSD',
    availability: 'AVAILABLE',
    yearsExperience: 0,
    skills: [],
    certificates: [],
    languages: ['Srpski'],
    showPhone: false,
    showEmail: true,
    isPublicProfile: true,
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    websiteUrl: '',
  });

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [groupedProfessions, setGroupedProfessions] = useState<{ [key: string]: Profession[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  // Skill input
  const [newSkill, setNewSkill] = useState('');
  const [newCertificate, setNewCertificate] = useState('');

  // Check authentication
  useEffect(() => {
    if (!user || !token) {
      router.push('/prijava?redirect=/kontrolna-tabla/majstor-profil');
    }
  }, [user, token, router]);

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

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/workers/me/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (data.success && data.data.worker) {
          const worker = data.data.worker;
          setHasExistingProfile(true);
          setFormData({
            displayName: worker.displayName || '',
            firstName: worker.firstName || '',
            lastName: worker.lastName || '',
            profession: worker.profession || '',
            professions: worker.professions || [],
            bio: worker.bio || '',
            city: worker.city || '',
            country: worker.country || 'RS',
            workRadius: worker.workRadius || 50,
            hourlyRate: worker.hourlyRate || 0,
            dailyRate: worker.dailyRate || 0,
            currency: worker.currency || 'RSD',
            availability: worker.availability || 'AVAILABLE',
            yearsExperience: worker.yearsExperience || 0,
            skills: worker.skills || [],
            certificates: worker.certificates || [],
            languages: worker.languages || ['Srpski'],
            showPhone: worker.showPhone || false,
            showEmail: worker.showEmail ?? true,
            isPublicProfile: worker.isPublicProfile ?? true,
            facebookUrl: worker.facebookUrl || '',
            instagramUrl: worker.instagramUrl || '',
            youtubeUrl: worker.youtubeUrl || '',
            websiteUrl: worker.websiteUrl || '',
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/workers/me/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Profil uspešno sačuvan!');
        setHasExistingProfile(true);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Greška pri čuvanju profila');
      }
    } catch (err) {
      setError('Greška pri povezivanju sa serverom');
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addCertificate = () => {
    if (newCertificate.trim() && !formData.certificates.includes(newCertificate.trim())) {
      setFormData((prev) => ({
        ...prev,
        certificates: [...prev.certificates, newCertificate.trim()],
      }));
      setNewCertificate('');
    }
  };

  const removeCertificate = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((c) => c !== cert),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {hasExistingProfile ? 'Uredi majstorski profil' : 'Kreiraj majstorski profil'}
        </h1>
        <p className="mt-2 text-gray-600">
          {hasExistingProfile
            ? 'Ažurirajte vaš profil da privučete više klijenata.'
            : 'Kreirajte profil i počnite da primate zahteve za posao.'}
        </p>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Osnovne informacije</CardTitle>
            <CardDescription>Podaci koji će biti prikazani na vašem profilu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayName">Ime za prikaz *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="Npr. Petar M."
                  required
                />
              </div>
              <div>
                <Label htmlFor="profession">Glavna profesija *</Label>
                <Select
                  value={formData.profession}
                  onValueChange={(val) => setFormData({ ...formData, profession: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite profesiju" />
                  </SelectTrigger>
                  <SelectContent>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Ime</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Vaše ime"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Prezime</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Vaše prezime"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">O meni</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Opišite vaše iskustvo, specijalnosti i zašto bi klijenti trebali da vas izaberu..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Lokacija i dostupnost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Grad *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Npr. Beograd"
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">Država</Label>
                <Select
                  value={formData.country}
                  onValueChange={(val) => setFormData({ ...formData, country: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="workRadius">Radijus rada (km)</Label>
                <Input
                  id="workRadius"
                  type="number"
                  value={formData.workRadius}
                  onChange={(e) =>
                    setFormData({ ...formData, workRadius: parseInt(e.target.value) || 0 })
                  }
                  min={0}
                  max={500}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="availability">Dostupnost</Label>
              <Select
                value={formData.availability}
                onValueChange={(val) => setFormData({ ...formData, availability: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Dostupan - Primam nove poslove</SelectItem>
                  <SelectItem value="BUSY">Zauzet - Ograničena dostupnost</SelectItem>
                  <SelectItem value="NOT_AVAILABLE">Nedostupan - Ne primam nove poslove</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Cene i iskustvo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="hourlyRate">Cena po satu</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hourlyRate: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="dailyRate">Cena po danu</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  value={formData.dailyRate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dailyRate: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="currency">Valuta</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(val) => setFormData({ ...formData, currency: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="yearsExperience">Godine iskustva</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  value={formData.yearsExperience || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      yearsExperience: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={60}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Veštine i sertifikati</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Veštine</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Dodajte veštinu"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill}>
                  Dodaj
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label>Sertifikati / Kvalifikacije</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newCertificate}
                  onChange={(e) => setNewCertificate(e.target.value)}
                  placeholder="Dodajte sertifikat"
                  onKeyPress={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addCertificate())
                  }
                />
                <Button type="button" onClick={addCertificate}>
                  Dodaj
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.certificates.map((cert) => (
                  <span
                    key={cert}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    ✓ {cert}
                    <button
                      type="button"
                      onClick={() => removeCertificate(cert)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Privatnost i linkovi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublicProfile"
                  checked={formData.isPublicProfile}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublicProfile: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isPublicProfile">Profil je javan (vidljiv u pretrazi)</Label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showPhone"
                  checked={formData.showPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, showPhone: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="showPhone">Prikaži broj telefona (delimično)</Label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showEmail"
                  checked={formData.showEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, showEmail: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="showEmail">Prikaži email adresu</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <Label htmlFor="websiteUrl">Web sajt</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, websiteUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="facebookUrl">Facebook</Label>
                <Input
                  id="facebookUrl"
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, facebookUrl: e.target.value })
                  }
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <Label htmlFor="instagramUrl">Instagram</Label>
                <Input
                  id="instagramUrl"
                  type="url"
                  value={formData.instagramUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, instagramUrl: e.target.value })
                  }
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <Label htmlFor="youtubeUrl">YouTube</Label>
                <Input
                  id="youtubeUrl"
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, youtubeUrl: e.target.value })
                  }
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving ? 'Čuvanje...' : hasExistingProfile ? 'Sačuvaj izmene' : 'Kreiraj profil'}
          </Button>
          {hasExistingProfile && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push(`/majstori/${formData.displayName?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
            >
              Pregledaj profil
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
