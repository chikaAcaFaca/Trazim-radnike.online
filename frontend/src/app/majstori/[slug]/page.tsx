'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface WorkerProfile {
  id: string;
  slug: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  profession: string;
  professions: string[];
  bio: string | null;
  city: string;
  country: string;
  workRadius: number | null;
  hourlyRate: number | null;
  dailyRate: number | null;
  currency: string;
  availability: string;
  availableFrom: string | null;
  yearsExperience: number | null;
  skills: string[];
  certificates: string[];
  languages: string[];
  portfolioImages: string[];
  rating: number;
  reviewCount: number;
  profileViews: number;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  phone: string | null;
  email: string | null;
  contactRevealed: boolean;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  websiteUrl: string | null;
  isVerified: boolean;
  isPro: boolean;
  lastActiveAt: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  images: string[];
  createdAt: string;
}

const AVAILABILITY_STATUS: { [key: string]: { label: string; color: string } } = {
  AVAILABLE: { label: 'Dostupan', color: 'bg-green-100 text-green-800' },
  BUSY: { label: 'Zauzet', color: 'bg-yellow-100 text-yellow-800' },
  NOT_AVAILABLE: { label: 'Nedostupan', color: 'bg-red-100 text-red-800' },
};

export default function WorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, tokens } = useAuthStore();
  const token = tokens?.accessToken;

  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentQrCode, setPaymentQrCode] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isRequestingContact, setIsRequestingContact] = useState(false);
  const [isBetaMode, setIsBetaMode] = useState(true);
  const [betaFreeSuccess, setBetaFreeSuccess] = useState(false);

  // Load beta status
  useEffect(() => {
    const loadBetaStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/workers/beta-status`);
        const data = await res.json();
        if (data.success) {
          setIsBetaMode(data.data.isBeta && data.data.freeMatching);
        }
      } catch (err) {
        console.error('Error loading beta status:', err);
      }
    };
    loadBetaStatus();
  }, []);

  // Load worker profile
  useEffect(() => {
    const loadWorker = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}/api/workers/${slug}`, { headers });
        const data = await res.json();

        if (data.success) {
          setWorker(data.data.worker);
          setReviews(data.data.reviews || []);
          setPosts(data.data.posts || []);
        } else {
          setError(data.message || 'Majstor nije pronađen');
        }
      } catch (err) {
        setError('Greška pri povezivanju sa serverom');
        console.error('Error loading worker:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      loadWorker();
    }
  }, [slug, token]);

  const handleRequestContact = async () => {
    if (!user) {
      router.push('/prijava?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsRequestingContact(true);
    setBetaFreeSuccess(false);

    try {
      const res = await fetch(`${API_URL}/api/workers/${worker?.id}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        if (data.data.contactRevealed) {
          // Contact revealed - update state
          setWorker((prev) =>
            prev
              ? {
                  ...prev,
                  contactRevealed: true,
                  phone: data.data.phone,
                  email: data.data.email,
                }
              : null
          );
          // Show beta success message if it was free
          if (data.data.isBetaFree) {
            setBetaFreeSuccess(true);
            setTimeout(() => setBetaFreeSuccess(false), 5000);
          }
        } else {
          // Need to pay - show payment modal
          setMatchId(data.data.matchId);
          await initiatePayment(data.data.matchId);
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Greška pri kreiranju zahteva');
      console.error('Error requesting contact:', err);
    } finally {
      setIsRequestingContact(false);
    }
  };

  const initiatePayment = async (matchId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/payments/contact-reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matchId }),
      });

      const data = await res.json();

      if (data.success) {
        setPaymentQrCode(data.data.qrCode);
        setShowPaymentModal(true);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Greška pri kreiranju plaćanja');
      console.error('Error initiating payment:', err);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400 text-xl">
            ★
          </span>
        );
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <span key={i} className="text-yellow-400 text-xl">
            ☆
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-gray-300 text-xl">
            ★
          </span>
        );
      }
    }
    return stars;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Učitavanje profila...</p>
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Majstor nije pronađen'}</p>
          <Button onClick={() => router.push('/majstori')}>Nazad na pretragu</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-600 to-blue-800">
        {worker.coverImageUrl && (
          <img
            src={worker.coverImageUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="relative -mt-16 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 -mt-20 md:-mt-24">
                {worker.avatarUrl ? (
                  <img
                    src={worker.avatarUrl}
                    alt={worker.displayName}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-5xl text-blue-600">
                      {worker.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {worker.displayName}
                  </h1>
                  {worker.isVerified && (
                    <span
                      className="text-blue-500 text-xl"
                      title="Verifikovan majstor"
                    >
                      ✓
                    </span>
                  )}
                  {worker.isPro && (
                    <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full font-medium">
                      PRO
                    </span>
                  )}
                </div>

                <p className="text-lg text-gray-600 mb-2">{worker.profession}</p>
                <p className="text-gray-500 mb-4">
                  📍 {worker.city}, {worker.country}
                  {worker.workRadius && ` • Radi u radijusu ${worker.workRadius} km`}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  {renderStars(worker.rating || 0)}
                  <span className="text-gray-600">
                    {worker.rating?.toFixed(1) || '0.0'} ({worker.reviewCount} recenzija)
                  </span>
                </div>

                {/* Availability */}
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    AVAILABILITY_STATUS[worker.availability]?.color ||
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {AVAILABILITY_STATUS[worker.availability]?.label || worker.availability}
                </span>
              </div>

              {/* Contact / Price */}
              <div className="md:text-right">
                {(worker.hourlyRate || worker.dailyRate) && (
                  <div className="mb-4">
                    {worker.hourlyRate && (
                      <p className="text-2xl font-bold text-gray-900">
                        {worker.hourlyRate} {worker.currency}
                        <span className="text-sm font-normal text-gray-500">/sat</span>
                      </p>
                    )}
                    {worker.dailyRate && (
                      <p className="text-lg text-gray-600">
                        {worker.dailyRate} {worker.currency}/dan
                      </p>
                    )}
                  </div>
                )}

                {worker.contactRevealed ? (
                  <div className="space-y-2">
                    {betaFreeSuccess && (
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm mb-2">
                        🎉 Kontakt otkriven besplatno (beta period)!
                      </div>
                    )}
                    {worker.phone && (
                      <a
                        href={`tel:${worker.phone}`}
                        className="block bg-green-600 text-white px-6 py-3 rounded-lg text-center font-medium hover:bg-green-700"
                      >
                        📞 {worker.phone}
                      </a>
                    )}
                    {worker.email && (
                      <a
                        href={`mailto:${worker.email}`}
                        className="block bg-blue-600 text-white px-6 py-3 rounded-lg text-center font-medium hover:bg-blue-700"
                      >
                        ✉️ Pošalji email
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {isBetaMode && (
                      <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm text-center mb-2">
                        🎁 BETA: Besplatno!
                      </div>
                    )}
                    <Button
                      size="lg"
                      onClick={handleRequestContact}
                      disabled={isRequestingContact}
                      className="w-full md:w-auto"
                    >
                      {isRequestingContact
                        ? 'Molim sačekajte...'
                        : isBetaMode
                          ? 'Otkrij kontakt (BESPLATNO)'
                          : 'Otkrij kontakt (30 RSD)'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            {worker.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>O meni</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">{worker.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {worker.skills && worker.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Veštine</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio */}
            {worker.portfolioImages && worker.portfolioImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {worker.portfolioImages.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Recenzije ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-gray-500">Još nema recenzija.</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('sr-RS')}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalji</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {worker.yearsExperience && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Iskustvo:</span>
                    <span className="font-medium">{worker.yearsExperience} godina</span>
                  </div>
                )}
                {worker.languages && worker.languages.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Jezici:</span>
                    <span className="font-medium">{worker.languages.join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Pregleda profila:</span>
                  <span className="font-medium">{worker.profileViews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Poslednja aktivnost:</span>
                  <span className="font-medium">
                    {new Date(worker.lastActiveAt).toLocaleDateString('sr-RS')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Certificates */}
            {worker.certificates && worker.certificates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Sertifikati</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {worker.certificates.map((cert, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Social Links */}
            {(worker.facebookUrl ||
              worker.instagramUrl ||
              worker.youtubeUrl ||
              worker.websiteUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle>Linkovi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {worker.websiteUrl && (
                    <a
                      href={worker.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      🌐 Web sajt
                    </a>
                  )}
                  {worker.facebookUrl && (
                    <a
                      href={worker.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      📘 Facebook
                    </a>
                  )}
                  {worker.instagramUrl && (
                    <a
                      href={worker.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      📷 Instagram
                    </a>
                  )}
                  {worker.youtubeUrl && (
                    <a
                      href={worker.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      📺 YouTube
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Platite za otkrivanje kontakta</h3>
            <p className="text-gray-600 mb-4">
              Skenirajte QR kod u vašoj bankarskoj aplikaciji da platite 30 RSD i
              otkrijete kontakt majstora.
            </p>

            {paymentQrCode && (
              <div className="bg-gray-100 p-4 rounded-lg mb-4 flex justify-center">
                <img src={paymentQrCode} alt="IPS QR Code" className="w-48 h-48" />
              </div>
            )}

            <p className="text-sm text-gray-500 mb-4">
              Nakon što platite, kontakt će automatski biti otkriven. Ako ne dobijete
              kontakt u roku od 5 minuta, kontaktirajte podršku.
            </p>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPaymentModal(false)}
              >
                Otkaži
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  // Poll for payment status
                  setShowPaymentModal(false);
                  // In real implementation, start polling or use websocket
                }}
              >
                Platio sam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
