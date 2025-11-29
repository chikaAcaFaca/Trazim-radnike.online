import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Site Settings Service
 * Manages beta mode and dynamic pricing configuration
 */
class SettingsService {
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private cacheTTL = 60000; // 1 minute cache

  /**
   * Get a setting value with caching
   */
  async getSetting(key: string): Promise<string | null> {
    // Check cache
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Fetch from DB
    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (setting) {
      // Update cache
      this.cache.set(key, {
        value: setting.value,
        expiresAt: Date.now() + this.cacheTTL,
      });
      return setting.value;
    }

    return null;
  }

  /**
   * Get a setting as boolean
   */
  async getSettingBool(key: string, defaultValue = false): Promise<boolean> {
    const value = await this.getSetting(key);
    if (value === null) return defaultValue;
    return value === 'true' || value === '1';
  }

  /**
   * Get a setting as number
   */
  async getSettingNumber(key: string, defaultValue = 0): Promise<number> {
    const value = await this.getSetting(key);
    if (value === null) return defaultValue;
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Set a setting value
   */
  async setSetting(key: string, value: string, description?: string): Promise<void> {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });

    // Update cache
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.cacheTTL,
    });

    logger.info({ key, value }, 'Site setting updated');
  }

  /**
   * Check if beta mode is active
   */
  async isBetaMode(): Promise<boolean> {
    return this.getSettingBool('BETA_MODE', true); // Default to beta
  }

  /**
   * Check if free matching is enabled (beta feature)
   */
  async isFreeMatchingEnabled(): Promise<boolean> {
    const betaMode = await this.isBetaMode();
    if (!betaMode) return false;
    return this.getSettingBool('BETA_FREE_MATCHING', true);
  }

  /**
   * Get free tier credits count
   */
  async getFreeTierCredits(): Promise<number> {
    return this.getSettingNumber('FREE_TIER_CREDITS', 6); // Default 6 for beta
  }

  /**
   * Get contact reveal price
   */
  async getContactRevealPrice(): Promise<number> {
    return this.getSettingNumber('CONTACT_REVEAL_PRICE', 30);
  }

  /**
   * Get priority listing price
   */
  async getPriorityPrice(): Promise<number> {
    return this.getSettingNumber('PRIORITY_LISTING_PRICE', 150);
  }

  /**
   * Get urgent listing price
   */
  async getUrgentPrice(): Promise<number> {
    return this.getSettingNumber('URGENT_LISTING_PRICE', 300);
  }

  /**
   * Check if platform has enough users to exit beta
   */
  async shouldExitBeta(): Promise<{ ready: boolean; workerCount: number; minRequired: number }> {
    const minWorkers = await this.getSettingNumber('MIN_WORKERS_FOR_PRODUCTION', 100);

    const workerCount = await prisma.worker.count({
      where: {
        isPublicProfile: true,
        deletedAt: null,
      },
    });

    return {
      ready: workerCount >= minWorkers,
      workerCount,
      minRequired: minWorkers,
    };
  }

  /**
   * Get all settings for admin panel
   */
  async getAllSettings(): Promise<Array<{ key: string; value: string; description: string | null }>> {
    const settings = await prisma.siteSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return settings;
  }

  /**
   * Get public beta status info
   */
  async getBetaStatus(): Promise<{
    isBeta: boolean;
    freeMatching: boolean;
    freeCredits: number;
    progress?: { current: number; target: number; percentage: number };
  }> {
    const isBeta = await this.isBetaMode();
    const freeMatching = await this.isFreeMatchingEnabled();
    const freeCredits = await this.getFreeTierCredits();

    let progress;
    if (isBeta) {
      const betaCheck = await this.shouldExitBeta();
      progress = {
        current: betaCheck.workerCount,
        target: betaCheck.minRequired,
        percentage: Math.min(100, Math.round((betaCheck.workerCount / betaCheck.minRequired) * 100)),
      };
    }

    return {
      isBeta,
      freeMatching,
      freeCredits,
      progress,
    };
  }

  /**
   * Clear cache (useful after admin updates)
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Settings cache cleared');
  }
}

export const settingsService = new SettingsService();
