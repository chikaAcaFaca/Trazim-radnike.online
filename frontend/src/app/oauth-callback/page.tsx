'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get tokens from hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const isNewUser = params.get('isNewUser') === 'true';

        if (!accessToken || !refreshToken) {
          throw new Error('Nedostaju podaci za autentifikaciju');
        }

        // Fetch user data with the token
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Greška pri učitavanju korisnika');
        }

        // Store in auth store
        login(data.data.user, {
          accessToken,
          refreshToken,
          expiresIn: 900, // 15 minutes default
        });

        setStatus('success');

        // Clear the hash from URL for security
        window.history.replaceState(null, '', window.location.pathname);

        // Redirect based on user status
        setTimeout(() => {
          if (isNewUser) {
            // New user - go to profile setup
            router.push('/kontrolna-tabla/podesavanja?welcome=true');
          } else {
            // Existing user - go to dashboard
            router.push('/kontrolna-tabla');
          }
        }, 1500);
      } catch (err) {
        console.error('OAuth callback processing error:', err);
        const message = err instanceof Error ? err.message : 'Greška pri prijavi';
        setError(message);
        setStatus('error');

        // Redirect to login after delay
        setTimeout(() => {
          router.push(`/prijava?error=${encodeURIComponent(message)}`);
        }, 3000);
      }
    };

    processCallback();
  }, [login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            {status === 'processing' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Prijava u toku...
                </h2>
                <p className="text-gray-600">
                  Molimo sačekajte dok završimo prijavu.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Uspešna prijava!
                </h2>
                <p className="text-gray-600">
                  Preusmeravamo vas na kontrolnu tablu...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Greška pri prijavi
                </h2>
                <p className="text-red-600 mb-4">{error}</p>
                <p className="text-gray-600 text-sm">
                  Preusmeravamo vas nazad na stranicu za prijavu...
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
