import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, formatCurrency, formatDate, formatRelativeTime, slugify, truncate } from '@/lib/utils';

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'conditional', false && 'not-applied');
    expect(result).toBe('base conditional');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    // tailwind-merge should resolve px-4 as the final padding-x
    expect(result).toContain('py-1');
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
  });

  it('should handle arrays', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toBe('class1 class2');
  });

  it('should handle objects', () => {
    const result = cn({ active: true, disabled: false });
    expect(result).toBe('active');
  });

  it('should handle undefined and null', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toBe('base end');
  });
});

describe('formatCurrency', () => {
  it('should format EUR by default', () => {
    const result = formatCurrency(1000);
    // Serbian locale formats EUR - could be "€" or "EUR" depending on environment
    expect(result).toContain('1.000');
    expect(result.match(/€|EUR/i)).toBeTruthy();
  });

  it('should format with custom currency', () => {
    const result = formatCurrency(500, 'USD');
    expect(result).toContain('500');
    // Could be "$", "US$" or "USD" depending on environment
    expect(result.match(/\$|USD/i)).toBeTruthy();
  });

  it('should not show decimal places', () => {
    const result = formatCurrency(1234.56);
    // minimumFractionDigits: 0, maximumFractionDigits: 0
    expect(result).toContain('1.235'); // Rounded
    expect(result).not.toContain(',56');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('should handle large numbers', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1.000.000');
  });
});

describe('formatDate', () => {
  it('should format date with Serbian locale by default', () => {
    const result = formatDate(new Date('2024-01-15'));
    // Should contain month name in Serbian
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('should accept date string', () => {
    const result = formatDate('2024-06-20');
    expect(result).toContain('2024');
    expect(result).toContain('20');
  });

  it('should handle different locales', () => {
    const result = formatDate(new Date('2024-03-10'), 'en-US');
    expect(result).toContain('March');
    expect(result).toContain('10');
    expect(result).toContain('2024');
  });
});

describe('formatRelativeTime', () => {
  let realDate: typeof Date;

  beforeEach(() => {
    realDate = global.Date;
    // Mock current date to 2024-01-15 12:00:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    global.Date = realDate;
  });

  it('should return "malopre" for recent times (< 60s)', () => {
    const result = formatRelativeTime(new Date('2024-01-15T11:59:30'));
    expect(result).toBe('malopre');
  });

  it('should return minutes for times < 1 hour', () => {
    const result = formatRelativeTime(new Date('2024-01-15T11:30:00'));
    expect(result).toContain('min');
    expect(result).toContain('30');
  });

  it('should return hours for times < 1 day', () => {
    const result = formatRelativeTime(new Date('2024-01-15T09:00:00'));
    expect(result).toContain('h');
    expect(result).toContain('3');
  });

  it('should return days for times < 1 week', () => {
    const result = formatRelativeTime(new Date('2024-01-13T12:00:00'));
    expect(result).toContain('dana');
    expect(result).toContain('2');
  });

  it('should return formatted date for older times', () => {
    const result = formatRelativeTime(new Date('2024-01-01T12:00:00'));
    // More than a week, should return formatted date
    expect(result).toContain('2024');
    expect(result).toContain('1');
  });
});

describe('slugify', () => {
  it('should convert to lowercase', () => {
    const result = slugify('Hello World');
    expect(result).toBe('hello-world');
  });

  it('should replace spaces with hyphens', () => {
    const result = slugify('hello world test');
    expect(result).toBe('hello-world-test');
  });

  it('should handle Serbian characters', () => {
    expect(slugify('čevapčići')).toBe('cevapcici');
    expect(slugify('žaba')).toBe('zaba');
    expect(slugify('šuma')).toBe('suma');
    expect(slugify('đak')).toBe('djak');
  });

  it('should remove special characters', () => {
    const result = slugify('hello! world? test@123');
    expect(result).toBe('hello-world-test123');
  });

  it('should collapse multiple hyphens', () => {
    const result = slugify('hello   world---test');
    expect(result).toBe('hello-world-test');
  });

  it('should trim hyphens from start and end', () => {
    const result = slugify('  -hello world-  ');
    expect(result).toBe('hello-world');
  });

  it('should handle empty string', () => {
    const result = slugify('');
    expect(result).toBe('');
  });

  it('should handle string with only special characters', () => {
    const result = slugify('!@#$%^&*()');
    expect(result).toBe('');
  });

  it('should handle mixed content', () => {
    const result = slugify('Tražim Radnike - Beograd 2024!');
    expect(result).toBe('trazim-radnike-beograd-2024');
  });
});

describe('truncate', () => {
  it('should not truncate short text', () => {
    const result = truncate('Hello', 10);
    expect(result).toBe('Hello');
  });

  it('should truncate long text', () => {
    const result = truncate('Hello World', 5);
    expect(result).toBe('Hello...');
  });

  it('should add ellipsis to truncated text', () => {
    const result = truncate('This is a very long text', 10);
    expect(result).toContain('...');
    expect(result.length).toBeLessThanOrEqual(13); // 10 + '...'
  });

  it('should trim whitespace before adding ellipsis', () => {
    const result = truncate('Hello World Test', 6);
    // "Hello " trimmed to "Hello", then "..."
    expect(result).toBe('Hello...');
  });

  it('should handle exact length', () => {
    const result = truncate('Hello', 5);
    expect(result).toBe('Hello');
    expect(result).not.toContain('...');
  });

  it('should handle empty string', () => {
    const result = truncate('', 10);
    expect(result).toBe('');
  });

  it('should handle length of 0', () => {
    const result = truncate('Hello', 0);
    expect(result).toBe('...');
  });
});
