'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, useAuthTokens } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PhoneVerificationProps {
  phone: string;
  onVerified?: () => void;
}

export function PhoneVerification({ phone, onVerified }: PhoneVerificationProps) {
  const tokens = useAuthTokens();
  const updateUser = useAuthStore((state) => state.updateUser);

  const [step, setStep] = useState<'send' | 'verify'>('send');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleSendCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/phone/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Greska pri slanju koda');
      }

      // In development, we might get the code back
      if (data.devCode) {
        setDevCode(data.devCode);
      }

      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri slanju koda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/phone/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Neispravan kod');
      }

      // Update user state
      updateUser({ phoneVerified: true });

      // Callback
      onVerified?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri verifikaciji');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verifikacija telefona</CardTitle>
        <CardDescription>
          Verifikujte vas broj telefona: {phone}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {step === 'send' ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Kliknite dugme ispod da bismo vam poslali verifikacioni kod na broj: <strong>{phone}</strong>
            </p>
            <Button onClick={handleSendCode} disabled={isLoading}>
              {isLoading ? 'Slanje...' : 'Posalji verifikacioni kod'}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            {devCode && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-sm">
                <strong>Dev mode:</strong> Vas kod je <code className="bg-yellow-100 px-2 py-1 rounded">{devCode}</code>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Verifikacioni kod</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                disabled={isLoading}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-gray-500">
                Unesite 6-cifreni kod koji ste primili
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || code.length !== 6}>
                {isLoading ? 'Verifikacija...' : 'Verifikuj'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendCode}
                disabled={isLoading}
              >
                Posalji ponovo
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
