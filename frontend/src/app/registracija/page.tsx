'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';

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

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const setError = useAuthStore((state) => state.setError);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gdprConsent: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [prefilledData, setPrefilledData] = useState<ChatbotCollectedData | null>(null);
  const [showPrefilledBanner, setShowPrefilledBanner] = useState(false);

  // Load prefilled data from chatbot
  useEffect(() => {
    const isPrefilled = searchParams.get('prefilled') === 'true';
    if (isPrefilled) {
      const storedData = localStorage.getItem('chatbot_collected_data');
      if (storedData) {
        try {
          const data: ChatbotCollectedData = JSON.parse(storedData);
          setPrefilledData(data);
          setShowPrefilledBanner(true);
          // Pre-fill phone if available
          if (data.phone) {
            setFormData(prev => ({ ...prev, phone: data.phone || '' }));
          }
        } catch (e) {
          console.error('Error parsing chatbot data:', e);
        }
      }
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Email validation
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Unesite validnu email adresu');
    }

    // Password validation
    if (formData.password.length < 8) {
      errors.push('Lozinka mora imati najmanje 8 karaktera');
    }
    if (!/[A-Z]/.test(formData.password)) {
      errors.push('Lozinka mora sadrzati bar jedno veliko slovo');
    }
    if (!/[a-z]/.test(formData.password)) {
      errors.push('Lozinka mora sadrzati bar jedno malo slovo');
    }
    if (!/[0-9]/.test(formData.password)) {
      errors.push('Lozinka mora sadrzati bar jedan broj');
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.push('Lozinke se ne podudaraju');
    }

    // GDPR consent
    if (!formData.gdprConsent) {
      errors.push('Morate prihvatiti uslove koriscenja');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          gdprConsent: formData.gdprConsent,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Handle validation errors from server
        if (data.details && Array.isArray(data.details)) {
          const serverErrors = data.details.map(
            (d: { message: string }) => d.message
          );
          setValidationErrors(serverErrors);
          throw new Error('Greska u validaciji');
        }
        throw new Error(data.error || 'Registracija nije uspela');
      }

      // Store user and tokens
      login(data.data.user, data.data.tokens);

      // If we have prefilled company data, redirect to settings to complete profile
      if (prefilledData) {
        router.push('/kontrolna-tabla/podesavanja?setup=true');
      } else {
        // Redirect to verification or dashboard
        router.push('/kontrolna-tabla');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Greska pri registraciji';
      if (message !== 'Greska u validaciji') {
        setLocalError(message);
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Registracija</CardTitle>
          <CardDescription>
            Kreirajte besplatan nalog za pristup nasim uslugama
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showPrefilledBanner && prefilledData && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-semibold text-green-800">Podaci prikupljeni!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Prikupili smo sledece podatke kroz razgovor:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    {prefilledData.companyName && <li>Firma: <strong>{prefilledData.companyName}</strong></li>}
                    {prefilledData.contactName && <li>Kontakt: <strong>{prefilledData.contactName}</strong></li>}
                    {prefilledData.pib && <li>PIB: <strong>{prefilledData.pib}</strong></li>}
                    {prefilledData.maticniBroj && <li>Maticni broj: <strong>{prefilledData.maticniBroj}</strong></li>}
                    {prefilledData.phone && <li>Telefon: <strong>{prefilledData.phone}</strong></li>}
                    {prefilledData.city && <li>Grad: <strong>{prefilledData.city}</strong></li>}
                  </ul>
                  <p className="text-sm text-green-700 mt-2">
                    Samo unesite email i lozinku ispod, a ostalo ce biti automatski popunjeno!
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || validationErrors.length > 0) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error && <p>{error}</p>}
                {validationErrors.length > 0 && (
                  <ul className="list-disc list-inside">
                    {validationErrors.map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email adresa *</Label>
              <Input
                id="email"
                type="email"
                placeholder="vas@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Broj telefona (opciono)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+381601234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Format: +381601234567 (sa pozivnim brojem drzave)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lozinka *</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Minimum 8 karaktera, jedno veliko slovo, jedno malo slovo, jedan broj
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potvrdite lozinku *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="********"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex items-start space-x-2">
              <input
                id="gdprConsent"
                type="checkbox"
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.gdprConsent}
                onChange={(e) =>
                  setFormData({ ...formData, gdprConsent: e.target.checked })
                }
                disabled={isLoading}
              />
              <Label htmlFor="gdprConsent" className="text-sm text-gray-600">
                Prihvatam{' '}
                <Link href="/uslovi-koriscenja" className="text-blue-600 hover:text-blue-800" target="_blank">
                  Uslove korišćenja
                </Link>{' '}
                i{' '}
                <Link href="/politika-privatnosti" className="text-blue-600 hover:text-blue-800" target="_blank">
                  Politiku privatnosti
                </Link>{' '}
                (GDPR saglasnost) *
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registracija u toku...' : 'Registruj se'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Vec imate nalog? </span>
            <Link
              href="/prijava"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Prijavite se
            </Link>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-md text-xs text-blue-700">
            <p className="font-semibold mb-1">Napomena:</p>
            <p>
              Registracijom kreirate besplatan nalog. Mi smo konsalting agencija koja
              pomaze u pripremi dokumentacije za zaposljavanje - ne posredujemo u
              zaposljavanju.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
