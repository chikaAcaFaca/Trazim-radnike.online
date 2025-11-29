'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function ZaboravljenaLozinkaPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
    } catch (error: any) {
      setError(
        error.response?.data?.message || 'Greška pri slanju. Pokušajte ponovo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-green-100 p-4 w-fit mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Proverite Email</CardTitle>
            <CardDescription>
              Ako nalog sa ovom email adresom postoji, poslaćemo vam link za resetovanje lozinke.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">Ne vidite email?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Proverite spam/junk folder</li>
                <li>Email može stići za nekoliko minuta</li>
                <li>Proverite da li ste uneli ispravnu adresu</li>
              </ul>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href="/prijava">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Nazad na prijavu
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto rounded-full bg-blue-100 p-4 w-fit mb-4">
            <Mail className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Zaboravili ste lozinku?</CardTitle>
          <CardDescription>
            Unesite vašu email adresu i poslaćemo vam link za resetovanje lozinke.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email adresa</Label>
              <Input
                id="email"
                type="email"
                placeholder="vas@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Slanje...
                </>
              ) : (
                'Pošalji Link za Reset'
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/prijava"
                className="text-sm text-blue-600 hover:underline inline-flex items-center"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Nazad na prijavu
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
