import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${APP_URL}/prijava?error=${encodeURIComponent('Google prijava je otkazana')}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${APP_URL}/prijava?error=${encodeURIComponent('Nedostaje authorization code')}`
    );
  }

  try {
    // Exchange code for tokens via backend
    const response = await fetch(`${API_URL}/api/auth/oauth/google/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Google autentifikacija nije uspela');
    }

    // Create URL with tokens as hash params (more secure than query params)
    const redirectUrl = new URL('/oauth-callback', APP_URL);
    redirectUrl.hash = new URLSearchParams({
      accessToken: data.data.tokens.accessToken,
      refreshToken: data.data.tokens.refreshToken,
      isNewUser: data.data.isNewUser.toString(),
    }).toString();

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    const message = err instanceof Error ? err.message : 'Greška pri Google prijavi';
    return NextResponse.redirect(
      `${APP_URL}/prijava?error=${encodeURIComponent(message)}`
    );
  }
}
