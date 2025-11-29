import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { authService } from './auth.service.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

// Types
export interface OAuthUserData {
  provider: 'google' | 'facebook';
  providerId: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface FacebookUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

class OAuthService {
  // ==========================================
  // Google OAuth
  // ==========================================

  /**
   * Generate Google OAuth URL
   */
  getGoogleAuthUrl(): string {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new ApiError(500, 'Google OAuth nije konfigurisan');
    }

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: `${env.FRONTEND_URL}/api/auth/callback/google`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange Google authorization code for tokens
   */
  async getGoogleTokens(code: string): Promise<GoogleTokenResponse> {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new ApiError(500, 'Google OAuth nije konfigurisan');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${env.FRONTEND_URL}/api/auth/callback/google`,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error({ error }, 'Google token exchange failed');
      throw new ApiError(400, 'Greška pri Google autentifikaciji');
    }

    return response.json();
  }

  /**
   * Get Google user info using access token
   */
  async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new ApiError(400, 'Greška pri dobijanju Google korisničkih podataka');
    }

    return response.json();
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(code: string) {
    // Exchange code for tokens
    const tokens = await this.getGoogleTokens(code);

    // Get user info
    const googleUser = await this.getGoogleUserInfo(tokens.access_token);

    if (!googleUser.email) {
      throw new ApiError(400, 'Email nije dostupan sa Google naloga');
    }

    // Find or create user
    return this.findOrCreateOAuthUser({
      provider: 'google',
      providerId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    });
  }

  // ==========================================
  // Facebook OAuth
  // ==========================================

  /**
   * Generate Facebook OAuth URL
   */
  getFacebookAuthUrl(): string {
    if (!env.FACEBOOK_APP_ID) {
      throw new ApiError(500, 'Facebook OAuth nije konfigurisan');
    }

    const params = new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID,
      redirect_uri: `${env.FRONTEND_URL}/api/auth/callback/facebook`,
      response_type: 'code',
      scope: 'email,public_profile',
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange Facebook authorization code for tokens
   */
  async getFacebookTokens(code: string): Promise<FacebookTokenResponse> {
    if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET) {
      throw new ApiError(500, 'Facebook OAuth nije konfigurisan');
    }

    const params = new URLSearchParams({
      code,
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      redirect_uri: `${env.FRONTEND_URL}/api/auth/callback/facebook`,
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error({ error }, 'Facebook token exchange failed');
      throw new ApiError(400, 'Greška pri Facebook autentifikaciji');
    }

    return response.json();
  }

  /**
   * Get Facebook user info using access token
   */
  async getFacebookUserInfo(accessToken: string): Promise<FacebookUserInfo> {
    const params = new URLSearchParams({
      fields: 'id,name,email,picture',
      access_token: accessToken,
    });

    const response = await fetch(`https://graph.facebook.com/me?${params.toString()}`);

    if (!response.ok) {
      throw new ApiError(400, 'Greška pri dobijanju Facebook korisničkih podataka');
    }

    return response.json();
  }

  /**
   * Handle Facebook OAuth callback
   */
  async handleFacebookCallback(code: string) {
    // Exchange code for tokens
    const tokens = await this.getFacebookTokens(code);

    // Get user info
    const fbUser = await this.getFacebookUserInfo(tokens.access_token);

    if (!fbUser.email) {
      throw new ApiError(400, 'Email nije dostupan sa Facebook naloga. Molimo koristite drugi način prijave.');
    }

    // Find or create user
    return this.findOrCreateOAuthUser({
      provider: 'facebook',
      providerId: fbUser.id,
      email: fbUser.email,
      name: fbUser.name,
      picture: fbUser.picture?.data?.url,
    });
  }

  // ==========================================
  // Common OAuth Logic
  // ==========================================

  /**
   * Find existing user or create new one from OAuth data
   */
  async findOrCreateOAuthUser(data: OAuthUserData) {
    const { provider, providerId, email, name, picture } = data;

    // First, try to find user by email
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        company: true,
        worker: true,
        household: true,
      },
    });

    if (user) {
      // User exists - update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          emailVerified: true, // OAuth emails are verified by provider
        },
      });

      logger.info({ email, provider }, 'Existing user logged in via OAuth');
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: '', // OAuth users don't have password
          role: 'EMPLOYER',
          emailVerified: true, // OAuth emails are verified by provider
          gdprConsent: true, // Will require explicit consent on frontend
          gdprConsentAt: new Date(),
          lastLoginAt: new Date(),
        },
        include: {
          company: true,
          worker: true,
          household: true,
        },
      });

      logger.info({ email, provider }, 'New user created via OAuth');
    }

    // Generate JWT tokens
    const tokens = authService.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        role: user.role,
        profileType: user.profileType,
        hasCompany: !!user.company,
        hasWorkerProfile: !!user.worker,
        hasHousehold: !!user.household,
      },
      tokens,
      isNewUser: !user.company && !user.worker && !user.household,
    };
  }

  /**
   * Check if OAuth provider is configured
   */
  isProviderConfigured(provider: 'google' | 'facebook'): boolean {
    if (provider === 'google') {
      return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
    }
    if (provider === 'facebook') {
      return !!(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET);
    }
    return false;
  }

  /**
   * Get available OAuth providers
   */
  getAvailableProviders(): string[] {
    const providers: string[] = [];
    if (this.isProviderConfigured('google')) providers.push('google');
    if (this.isProviderConfigured('facebook')) providers.push('facebook');
    return providers;
  }
}

export const oauthService = new OAuthService();
