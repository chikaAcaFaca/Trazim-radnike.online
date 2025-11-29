'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PublicCompany {
  id: string;
  slug: string;
  name: string;
  country: string;
  city: string | null;
  industry: string | null;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  eVizitkUrl: string | null;
  bzrPortalUrl: string | null;
  profileTemplate: string;
  profileColorSet: string;
  profilePrimaryColor: string | null;
  profileSecondaryColor: string | null;
  profileAccentColor: string | null;
}

// Country code to name mapping
const COUNTRY_NAMES: Record<string, string> = {
  RS: 'Srbija',
  ME: 'Crna Gora',
  HR: 'Hrvatska',
  BA: 'Bosna i Hercegovina',
  MK: 'Severna Makedonija',
  BG: 'Bugarska',
  RO: 'Rumunija',
  SI: 'Slovenija',
  AL: 'Albanija',
  XK: 'Kosovo',
};

// Predefined color sets
const COLOR_SETS: Record<string, { primary: string; secondary: string; accent: string }> = {
  blue: { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6' },
  green: { primary: '#059669', secondary: '#047857', accent: '#10b981' },
  purple: { primary: '#7c3aed', secondary: '#6d28d9', accent: '#8b5cf6' },
  orange: { primary: '#ea580c', secondary: '#c2410c', accent: '#f97316' },
};

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Get colors for company
function getColors(company: PublicCompany) {
  if (company.profileColorSet === 'custom') {
    return {
      primary: company.profilePrimaryColor || '#2563eb',
      secondary: company.profileSecondaryColor || '#1e40af',
      accent: company.profileAccentColor || '#3b82f6',
    };
  }
  return COLOR_SETS[company.profileColorSet] || COLOR_SETS.blue;
}

export default function PublicCompanyProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadCompany();
    }
  }, [slug]);

  const loadCompany = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profile/public/${slug}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Kompanija nije pronadjena');
      }

      setCompany(data.data.company);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri ucitavanju');
    } finally {
      setIsLoading(false);
    }
  };

  const colors = useMemo(() => company ? getColors(company) : COLOR_SETS.blue, [company]);
  const template = company?.profileTemplate || 'modern';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ucitavanje...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Trazim-Radnike.online
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profil nije dostupan</h1>
          <p className="text-gray-600 mb-6">
            {error || 'Trazena kompanija ne postoji ili njen profil nije javan.'}
          </p>
          <Link href="/">
            <Button>Nazad na pocetnu</Button>
          </Link>
        </main>
      </div>
    );
  }

  const hasSocialLinks = company.facebookUrl || company.instagramUrl || company.twitterUrl ||
                          company.linkedinUrl || company.eVizitkUrl || company.bzrPortalUrl;

  const hasLocation = company.latitude && company.longitude;
  const mapUrl = hasLocation
    ? `https://www.google.com/maps?q=${company.latitude},${company.longitude}`
    : company.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}`
      : null;

  // Template-specific rendering
  if (template === 'minimal') {
    return <MinimalTemplate company={company} colors={colors} hasSocialLinks={!!hasSocialLinks} mapUrl={mapUrl} hasLocation={!!hasLocation} />;
  }

  if (template === 'classic') {
    return <ClassicTemplate company={company} colors={colors} hasSocialLinks={!!hasSocialLinks} mapUrl={mapUrl} hasLocation={!!hasLocation} />;
  }

  if (template === 'bold') {
    return <BoldTemplate company={company} colors={colors} hasSocialLinks={!!hasSocialLinks} mapUrl={mapUrl} hasLocation={!!hasLocation} />;
  }

  if (template === 'elegant') {
    return <ElegantTemplate company={company} colors={colors} hasSocialLinks={!!hasSocialLinks} mapUrl={mapUrl} hasLocation={!!hasLocation} />;
  }

  // Default: Modern template
  return <ModernTemplate company={company} colors={colors} hasSocialLinks={!!hasSocialLinks} mapUrl={mapUrl} hasLocation={!!hasLocation} />;
}

// Template props
interface TemplateProps {
  company: PublicCompany;
  colors: { primary: string; secondary: string; accent: string };
  hasSocialLinks: boolean;
  mapUrl: string | null;
  hasLocation: boolean;
}

// Social links component (shared)
function SocialLinks({ company, colors }: { company: PublicCompany; colors: { primary: string; secondary: string; accent: string } }) {
  return (
    <div className="space-y-3">
      {company.facebookUrl && (
        <a href={company.facebookUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <Facebook className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-gray-700">Facebook</span>
          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
        </a>
      )}
      {company.instagramUrl && (
        <a href={company.instagramUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-gray-700">Instagram</span>
          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
        </a>
      )}
      {company.twitterUrl && (
        <a href={company.twitterUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
            <XIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-gray-700">X (Twitter)</span>
          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
        </a>
      )}
      {company.linkedinUrl && (
        <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
            <Linkedin className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-gray-700">LinkedIn</span>
          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
        </a>
      )}
      {company.eVizitkUrl && (
        <a href={company.eVizitkUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-gray-700">e-Vizitka</span>
          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
        </a>
      )}
      {company.bzrPortalUrl && (
        <a href={company.bzrPortalUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium text-gray-700">BZR Portal</span>
          <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
        </a>
      )}
    </div>
  );
}

// ===========================================
// MODERN TEMPLATE (default)
// ===========================================
function ModernTemplate({ company, colors, hasSocialLinks, mapUrl, hasLocation }: TemplateProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold" style={{ color: colors.primary }}>
            Trazim-Radnike.online
          </Link>
          <Link href="/prijava">
            <Button variant="outline" size="sm">Prijava</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6 overflow-hidden">
          <div className="h-32" style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}></div>
          <CardContent className="relative pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 sm:-mt-12">
              <div className="flex-shrink-0">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={`${company.name} logo`}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-4 border-white bg-white object-cover shadow-lg" />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-4 border-white bg-gray-100 flex items-center justify-center shadow-lg">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 pb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{company.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-gray-600">
                  {company.industry && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${colors.accent}20`, color: colors.primary }}>
                      {company.industry}
                    </span>
                  )}
                  <span className="text-sm">
                    {company.city && `${company.city}, `}
                    {COUNTRY_NAMES[company.country] || company.country}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {company.description && (
              <Card>
                <CardHeader><CardTitle className="text-lg">O kompaniji</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">{company.description}</p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle className="text-lg">Kontakt informacije</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {company.contactName && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Kontakt osoba</p>
                      <p className="font-medium">{company.contactName}</p>
                    </div>
                  </div>
                )}
                {company.contactPhone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.primary}20` }}>
                      <Phone className="w-5 h-5" style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telefon</p>
                      <a href={`tel:${company.contactPhone}`} className="font-medium hover:underline" style={{ color: colors.primary }}>
                        {company.contactPhone}
                      </a>
                    </div>
                  </div>
                )}
                {company.contactEmail && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.accent}20` }}>
                      <Mail className="w-5 h-5" style={{ color: colors.accent }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href={`mailto:${company.contactEmail}`} className="font-medium hover:underline" style={{ color: colors.primary }}>
                        {company.contactEmail}
                      </a>
                    </div>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Web sajt</p>
                      <a href={company.website} target="_blank" rel="noopener noreferrer"
                        className="font-medium hover:underline inline-flex items-center gap-1" style={{ color: colors.primary }}>
                        {company.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Adresa</p>
                      {mapUrl ? (
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                          className="font-medium hover:underline inline-flex items-center gap-1" style={{ color: colors.primary }}>
                          {company.address}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="font-medium">{company.address}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {(hasLocation || company.address) && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Lokacija</CardTitle></CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={hasLocation
                        ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${company.latitude},${company.longitude}&zoom=15`
                        : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(company.address!)}`
                      } />
                  </div>
                  {mapUrl && (
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm hover:underline" style={{ color: colors.primary }}>
                      Otvori u Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
            {hasSocialLinks && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Drustvene mreze</CardTitle></CardHeader>
                <CardContent>
                  <SocialLinks company={company} colors={colors} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Ovaj profil je javno dostupan. Za vise informacija, <Link href="/" className="hover:underline" style={{ color: colors.primary }}>posetite nas sajt</Link>.</p>
        </div>
      </main>
    </div>
  );
}

// ===========================================
// MINIMAL TEMPLATE
// ===========================================
function MinimalTemplate({ company, colors, hasSocialLinks, mapUrl, hasLocation }: TemplateProps) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-lg font-medium text-gray-900">Trazim-Radnike.online</Link>
          <Link href="/prijava"><Button variant="ghost" size="sm">Prijava</Button></Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2" style={{ borderColor: colors.primary }} />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${colors.primary}10` }}>
              <Building2 className="w-10 h-10" style={{ color: colors.primary }} />
            </div>
          )}
          <h1 className="text-3xl font-light text-gray-900 mb-2">{company.name}</h1>
          <p className="text-gray-500">
            {company.industry && <span className="mr-2">{company.industry}</span>}
            {company.city && `${company.city}, `}
            {COUNTRY_NAMES[company.country] || company.country}
          </p>
        </div>

        {company.description && (
          <div className="mb-12 text-center max-w-xl mx-auto">
            <p className="text-gray-600 leading-relaxed">{company.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-4">Kontakt</h2>
            <div className="space-y-3 text-sm">
              {company.contactName && <p><span className="text-gray-500">Kontakt:</span> {company.contactName}</p>}
              {company.contactPhone && (
                <p><span className="text-gray-500">Telefon:</span>{' '}
                  <a href={`tel:${company.contactPhone}`} className="hover:underline" style={{ color: colors.primary }}>{company.contactPhone}</a>
                </p>
              )}
              {company.contactEmail && (
                <p><span className="text-gray-500">Email:</span>{' '}
                  <a href={`mailto:${company.contactEmail}`} className="hover:underline" style={{ color: colors.primary }}>{company.contactEmail}</a>
                </p>
              )}
              {company.website && (
                <p><span className="text-gray-500">Web:</span>{' '}
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: colors.primary }}>
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </p>
              )}
              {company.address && <p><span className="text-gray-500">Adresa:</span> {company.address}</p>}
            </div>
          </div>

          {hasSocialLinks && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-4">Online</h2>
              <div className="flex flex-wrap gap-3">
                {company.facebookUrl && (
                  <a href={company.facebookUrl} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Facebook className="w-5 h-5 text-gray-600" />
                  </a>
                )}
                {company.instagramUrl && (
                  <a href={company.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Instagram className="w-5 h-5 text-gray-600" />
                  </a>
                )}
                {company.twitterUrl && (
                  <a href={company.twitterUrl} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <XIcon className="w-5 h-5 text-gray-600" />
                  </a>
                )}
                {company.linkedinUrl && (
                  <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Linkedin className="w-5 h-5 text-gray-600" />
                  </a>
                )}
                {company.eVizitkUrl && (
                  <a href={company.eVizitkUrl} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Globe className="w-5 h-5 text-gray-600" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {(hasLocation || company.address) && (
          <div className="aspect-[2/1] rounded-lg overflow-hidden bg-gray-100 mb-12">
            <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={hasLocation
                ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${company.latitude},${company.longitude}&zoom=15`
                : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(company.address!)}`
              } />
          </div>
        )}

        <div className="text-center text-xs text-gray-400 border-t pt-8">
          <Link href="/" className="hover:text-gray-600">Trazim-Radnike.online</Link>
        </div>
      </main>
    </div>
  );
}

// ===========================================
// CLASSIC TEMPLATE
// ===========================================
function ClassicTemplate({ company, colors, hasSocialLinks, mapUrl, hasLocation }: TemplateProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f5f0' }}>
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-serif" style={{ color: colors.secondary }}>Trazim-Radnike.online</Link>
          <Link href="/prijava"><Button variant="outline" size="sm">Prijava</Button></Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8 border-b-4" style={{ borderColor: colors.primary }}>
            <div className="flex items-center gap-6">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name}
                  className="w-24 h-24 rounded border-2 object-cover" style={{ borderColor: colors.primary }} />
              ) : (
                <div className="w-24 h-24 rounded border-2 flex items-center justify-center bg-gray-50" style={{ borderColor: colors.primary }}>
                  <Building2 className="w-12 h-12" style={{ color: colors.primary }} />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-serif text-gray-900">{company.name}</h1>
                <p className="text-gray-600 mt-1">
                  {company.industry && <span className="font-medium">{company.industry}</span>}
                  {company.industry && company.city && ' | '}
                  {company.city && `${company.city}, `}
                  {COUNTRY_NAMES[company.country] || company.country}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                {company.description && (
                  <div className="mb-8">
                    <h2 className="text-lg font-serif mb-3" style={{ color: colors.secondary }}>O nama</h2>
                    <p className="text-gray-700 leading-relaxed">{company.description}</p>
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-serif mb-3" style={{ color: colors.secondary }}>Kontakt podaci</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {company.contactName && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{company.contactName}</span>
                      </div>
                    )}
                    {company.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${company.contactPhone}`} className="hover:underline" style={{ color: colors.primary }}>{company.contactPhone}</a>
                      </div>
                    )}
                    {company.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${company.contactEmail}`} className="hover:underline" style={{ color: colors.primary }}>{company.contactEmail}</a>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: colors.primary }}>
                          {company.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {company.address && (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{company.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {(hasLocation || company.address) && (
                  <div>
                    <h2 className="text-lg font-serif mb-3" style={{ color: colors.secondary }}>Lokacija</h2>
                    <div className="aspect-square rounded overflow-hidden bg-gray-100">
                      <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={hasLocation
                          ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${company.latitude},${company.longitude}&zoom=15`
                          : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(company.address!)}`
                        } />
                    </div>
                  </div>
                )}

                {hasSocialLinks && (
                  <div>
                    <h2 className="text-lg font-serif mb-3" style={{ color: colors.secondary }}>Na mrezi</h2>
                    <div className="flex flex-wrap gap-2">
                      {company.facebookUrl && (
                        <a href={company.facebookUrl} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1 text-sm border rounded hover:bg-gray-50">Facebook</a>
                      )}
                      {company.instagramUrl && (
                        <a href={company.instagramUrl} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1 text-sm border rounded hover:bg-gray-50">Instagram</a>
                      )}
                      {company.linkedinUrl && (
                        <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1 text-sm border rounded hover:bg-gray-50">LinkedIn</a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-8">
          <Link href="/" className="hover:underline">Trazim-Radnike.online</Link>
        </div>
      </main>
    </div>
  );
}

// ===========================================
// BOLD TEMPLATE
// ===========================================
function BoldTemplate({ company, colors, hasSocialLinks, mapUrl, hasLocation }: TemplateProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.secondary }}>
      <header className="px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-black text-white">TRAZIM-RADNIKE</Link>
          <Link href="/prijava"><Button variant="secondary" size="sm">Prijava</Button></Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name}
              className="w-32 h-32 rounded-2xl mx-auto mb-6 object-cover border-4 border-white shadow-2xl" />
          ) : (
            <div className="w-32 h-32 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-white/10 border-4 border-white/30">
              <Building2 className="w-16 h-16 text-white" />
            </div>
          )}
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4">{company.name}</h1>
          <div className="flex flex-wrap justify-center gap-3">
            {company.industry && (
              <span className="px-4 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: colors.accent, color: 'white' }}>
                {company.industry}
              </span>
            )}
            <span className="px-4 py-2 rounded-full text-sm font-bold bg-white/20 text-white">
              {company.city && `${company.city}, `}
              {COUNTRY_NAMES[company.country] || company.country}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {company.description && (
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-black mb-4" style={{ color: colors.primary }}>O NAMA</h2>
              <p className="text-gray-700 text-lg leading-relaxed">{company.description}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-black mb-4" style={{ color: colors.primary }}>KONTAKT</h2>
            <div className="space-y-4">
              {company.contactPhone && (
                <a href={`tel:${company.contactPhone}`}
                  className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors text-lg font-bold"
                  style={{ color: colors.primary }}>
                  <Phone className="w-6 h-6" /> {company.contactPhone}
                </a>
              )}
              {company.contactEmail && (
                <a href={`mailto:${company.contactEmail}`}
                  className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors text-lg"
                  style={{ color: colors.primary }}>
                  <Mail className="w-6 h-6" /> {company.contactEmail}
                </a>
              )}
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors text-lg"
                  style={{ color: colors.primary }}>
                  <Globe className="w-6 h-6" /> {company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>

          {(hasLocation || company.address) && (
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
              <div className="aspect-video">
                <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={hasLocation
                    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${company.latitude},${company.longitude}&zoom=15`
                    : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(company.address!)}`
                  } />
              </div>
            </div>
          )}

          {hasSocialLinks && (
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-black mb-4" style={{ color: colors.primary }}>PRATITE NAS</h2>
              <div className="grid grid-cols-2 gap-3">
                {company.facebookUrl && (
                  <a href={company.facebookUrl} target="_blank" rel="noopener noreferrer"
                    className="p-4 rounded-xl bg-blue-600 text-white font-bold text-center hover:bg-blue-700 transition-colors">
                    Facebook
                  </a>
                )}
                {company.instagramUrl && (
                  <a href={company.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="p-4 rounded-xl bg-gradient-to-br from-purple-600 to-orange-500 text-white font-bold text-center hover:opacity-90 transition-opacity">
                    Instagram
                  </a>
                )}
                {company.linkedinUrl && (
                  <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="p-4 rounded-xl bg-blue-700 text-white font-bold text-center hover:bg-blue-800 transition-colors">
                    LinkedIn
                  </a>
                )}
                {company.twitterUrl && (
                  <a href={company.twitterUrl} target="_blank" rel="noopener noreferrer"
                    className="p-4 rounded-xl bg-black text-white font-bold text-center hover:bg-gray-800 transition-colors">
                    X
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-white/60 mt-12">
          <Link href="/" className="hover:text-white">Trazim-Radnike.online</Link>
        </div>
      </main>
    </div>
  );
}

// ===========================================
// ELEGANT TEMPLATE
// ===========================================
function ElegantTemplate({ company, colors, hasSocialLinks, mapUrl, hasLocation }: TemplateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg font-light tracking-wider" style={{ color: colors.secondary }}>
            Trazim-Radnike
          </Link>
          <Link href="/prijava"><Button variant="ghost" size="sm" className="font-light">Prijava</Button></Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-start gap-12 mb-16">
          <div className="flex-shrink-0">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name}
                className="w-36 h-36 rounded-full object-cover shadow-lg ring-4 ring-white" />
            ) : (
              <div className="w-36 h-36 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white"
                style={{ backgroundColor: `${colors.primary}10` }}>
                <Building2 className="w-16 h-16" style={{ color: colors.primary }} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {company.industry && (
                <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${colors.primary}10`, color: colors.primary }}>
                  {company.industry}
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-light text-gray-900 mb-3">{company.name}</h1>
            <p className="text-lg text-gray-500 font-light">
              {company.city && `${company.city}, `}
              {COUNTRY_NAMES[company.country] || company.country}
            </p>
            {company.description && (
              <p className="mt-6 text-gray-600 leading-relaxed max-w-2xl">{company.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b border-gray-200">
              Kontakt informacije
            </h2>
            <div className="space-y-6">
              {company.contactName && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Kontakt osoba</p>
                  <p className="text-lg text-gray-900">{company.contactName}</p>
                </div>
              )}
              {company.contactPhone && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Telefon</p>
                  <a href={`tel:${company.contactPhone}`} className="text-lg hover:underline" style={{ color: colors.primary }}>
                    {company.contactPhone}
                  </a>
                </div>
              )}
              {company.contactEmail && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Email</p>
                  <a href={`mailto:${company.contactEmail}`} className="text-lg hover:underline" style={{ color: colors.primary }}>
                    {company.contactEmail}
                  </a>
                </div>
              )}
              {company.website && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Web sajt</p>
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-lg hover:underline" style={{ color: colors.primary }}>
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {company.address && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Adresa</p>
                  <p className="text-lg text-gray-900">{company.address}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-12">
            {(hasLocation || company.address) && (
              <div>
                <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b border-gray-200">
                  Lokacija
                </h2>
                <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
                  <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={hasLocation
                      ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${company.latitude},${company.longitude}&zoom=15`
                      : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(company.address!)}`
                    } />
                </div>
              </div>
            )}

            {hasSocialLinks && (
              <div>
                <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-6 pb-2 border-b border-gray-200">
                  Drustvene mreze
                </h2>
                <div className="flex gap-4">
                  {company.facebookUrl && (
                    <a href={company.facebookUrl} target="_blank" rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
                      <Facebook className="w-5 h-5 text-gray-600" />
                    </a>
                  )}
                  {company.instagramUrl && (
                    <a href={company.instagramUrl} target="_blank" rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
                      <Instagram className="w-5 h-5 text-gray-600" />
                    </a>
                  )}
                  {company.linkedinUrl && (
                    <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
                      <Linkedin className="w-5 h-5 text-gray-600" />
                    </a>
                  )}
                  {company.twitterUrl && (
                    <a href={company.twitterUrl} target="_blank" rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
                      <XIcon className="w-5 h-5 text-gray-600" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-gray-400 mt-20 pt-8 border-t border-gray-100">
          <Link href="/" className="text-sm font-light tracking-wider hover:text-gray-600">Trazim-Radnike.online</Link>
        </div>
      </main>
    </div>
  );
}
