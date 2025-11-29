'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { api } from '@/lib/api';

type VerificationStatus = 'loading' | 'success' | 'error' | 'no-token';

export default function VerifikacijaEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    const verifyEmail = async () => {
      try {
        await api.post('/auth/email/verify', { token });
        setStatus('success');

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/kontrolna-tabla');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(
          error.response?.data?.message || 'Greška pri verifikaciji. Pokušajte ponovo.'
        );
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verifikacija Email Adrese</CardTitle>
          <CardDescription>Tražim-Radnike.online</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              <p className="text-gray-600 text-center">
                Verifikujemo vašu email adresu...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-green-700">
                  Email Uspešno Verifikovan!
                </h3>
                <p className="text-gray-600">
                  Vaš nalog je sada aktivan. Bićete preusmereni na kontrolnu tablu...
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/kontrolna-tabla">
                  Idi na Kontrolnu Tablu
                </Link>
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="rounded-full bg-red-100 p-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-red-700">
                  Verifikacija Neuspešna
                </h3>
                <p className="text-gray-600">{errorMessage}</p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/prijava">
                    Prijavite se ponovo
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/">
                    Nazad na početnu
                  </Link>
                </Button>
              </div>
            </>
          )}

          {status === 'no-token' && (
            <>
              <div className="rounded-full bg-yellow-100 p-4">
                <Mail className="h-16 w-16 text-yellow-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-yellow-700">
                  Nema Verifikacionog Tokena
                </h3>
                <p className="text-gray-600">
                  Link za verifikaciju nije validan. Proverite email i kliknite na ispravni link.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Button asChild className="w-full">
                  <Link href="/prijava">
                    Prijavite se
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/">
                    Nazad na početnu
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
