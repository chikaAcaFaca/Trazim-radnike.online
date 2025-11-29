'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';

export default function ResetLozinkePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pass: string): string[] => {
    const errors: string[] = [];
    if (pass.length < 8) errors.push('Minimum 8 karaktera');
    if (!/[A-Z]/.test(pass)) errors.push('Jedno veliko slovo');
    if (!/[a-z]/.test(pass)) errors.push('Jedno malo slovo');
    if (!/[0-9]/.test(pass)) errors.push('Jedan broj');
    return errors;
  };

  const passwordErrors = validatePassword(password);
  const isPasswordValid = passwordErrors.length === 0;
  const doPasswordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Lozinka ne ispunjava sve uslove');
      return;
    }

    if (!doPasswordsMatch) {
      setError('Lozinke se ne poklapaju');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password });
      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/prijava');
      }, 3000);
    } catch (error: any) {
      setError(
        error.response?.data?.message || 'Greška pri resetovanju lozinke. Link je možda istekao.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-red-100 p-4 w-fit mb-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Nevažeći Link</CardTitle>
            <CardDescription>
              Link za resetovanje lozinke nije validan ili je istekao.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/zaboravljena-lozinka">
                Zatraži Novi Link
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-green-100 p-4 w-fit mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Lozinka Promenjena!</CardTitle>
            <CardDescription>
              Vaša lozinka je uspešno promenjena. Bićete preusmereni na stranicu za prijavu...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/prijava">
                Prijavite se
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
            <Lock className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Nova Lozinka</CardTitle>
          <CardDescription>
            Unesite novu lozinku za vaš nalog.
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
              <Label htmlFor="password">Nova lozinka</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password requirements */}
              <div className="text-xs space-y-1 mt-2">
                {['Minimum 8 karaktera', 'Jedno veliko slovo', 'Jedno malo slovo', 'Jedan broj'].map(
                  (req, i) => {
                    const isValid = !passwordErrors.includes(req);
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-1 ${
                          password ? (isValid ? 'text-green-600' : 'text-red-500') : 'text-gray-500'
                        }`}
                      >
                        {password ? (
                          isValid ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-400" />
                        )}
                        {req}
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potvrdite lozinku</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              {confirmPassword && !doPasswordsMatch && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Lozinke se ne poklapaju
                </p>
              )}
              {confirmPassword && doPasswordsMatch && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Lozinke se poklapaju
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Čuvanje...
                </>
              ) : (
                'Sačuvaj Novu Lozinku'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
