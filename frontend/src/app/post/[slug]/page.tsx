'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PostImage {
  id: string;
  url: string;
  caption: string | null;
  order: number;
}

interface Company {
  name: string;
  slug: string | null;
  logoUrl: string | null;
  city: string | null;
  country: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  type: string;
  excerpt: string | null;
  coverImage: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  viewCount: number;
  shareCount: number;
  publishedAt: string | null;
  createdAt: string;
  images: PostImage[];
  company: Company;
}

export default function PublicPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts/public/${slug}`);
      const data = await response.json();

      if (data.success) {
        setPost(data.data.post);
      } else {
        setError('Post nije pronadjen');
      }
    } catch (err) {
      setError('Greska pri ucitavanju posta');
    } finally {
      setIsLoading(false);
    }
  };

  const trackShare = async () => {
    try {
      await fetch(`${API_URL}/api/posts/public/${slug}/share`, {
        method: 'POST',
      });
    } catch (err) {
      // Silent fail
    }
  };

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  };

  const handleShareFacebook = () => {
    trackShare();
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  };

  const handleShareLinkedIn = () => {
    trackShare();
    const url = encodeURIComponent(getShareUrl());
    const title = encodeURIComponent(post?.title || '');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
  };

  const handleShareTwitter = () => {
    trackShare();
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(post?.title || '');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
  };

  const handleShareWhatsApp = () => {
    trackShare();
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`${post?.title}\n\n${post?.excerpt || ''}\n\n`);
    window.open(`https://wa.me/?text=${text}${url}`, '_blank');
  };

  const handleShareViber = () => {
    trackShare();
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`${post?.title}\n\n`);
    window.open(`viber://forward?text=${text}${url}`, '_blank');
  };

  const handleCopyLink = async () => {
    trackShare();
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = getShareUrl();
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Ucitavanje...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Post nije pronadjen</h1>
        <p className="text-gray-600 mb-6">
          Ovaj post ne postoji ili je uklonjen.
        </p>
        <Link href="/">
          <Button>Nazad na pocetnu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Trazim-Radnike<span className="text-gray-400">.online</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/oglasi"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Oglasi
            </Link>
            <Link
              href="/registracija"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Postavi oglas
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Company info */}
        <div className="flex items-center gap-4 mb-6">
          {post.company.logoUrl ? (
            <img
              src={post.company.logoUrl}
              alt={post.company.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-xl">🏢</span>
            </div>
          )}
          <div>
            <h2 className="font-semibold text-gray-900">{post.company.name}</h2>
            {post.company.city && (
              <p className="text-sm text-gray-500">{post.company.city}</p>
            )}
          </div>
        </div>

        {/* Post title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
          {post.publishedAt && (
            <span>📅 {formatDate(post.publishedAt)}</span>
          )}
          <span>👁️ {post.viewCount} pregleda</span>
          <span>🔗 {post.shareCount} deljenja</span>
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <div className="mb-8">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full rounded-xl shadow-lg cursor-pointer"
              onClick={() => setSelectedImage(post.coverImage)}
            />
          </div>
        )}

        {/* Share buttons */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Podelite ovaj post</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleShareFacebook}
              className="bg-[#1877F2] hover:bg-[#166FE5] text-white"
            >
              <span className="mr-2">📘</span> Facebook
            </Button>
            <Button
              onClick={handleShareLinkedIn}
              className="bg-[#0A66C2] hover:bg-[#004182] text-white"
            >
              <span className="mr-2">💼</span> LinkedIn
            </Button>
            <Button
              onClick={handleShareTwitter}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <span className="mr-2">𝕏</span> X/Twitter
            </Button>
            <Button
              onClick={handleShareWhatsApp}
              className="bg-[#25D366] hover:bg-[#128C7E] text-white"
            >
              <span className="mr-2">💬</span> WhatsApp
            </Button>
            <Button
              onClick={handleShareViber}
              className="bg-[#7360F2] hover:bg-[#59267c] text-white"
            >
              <span className="mr-2">📱</span> Viber
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyLink}
            >
              {copied ? '✓ Kopirano!' : '🔗 Kopiraj link'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="prose prose-lg max-w-none">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index} className="text-gray-700 mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Image gallery */}
        {post.images.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Galerija slika</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {post.images.map((image) => (
                <div
                  key={image.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedImage(image.url)}
                >
                  <img
                    src={image.url}
                    alt={image.caption || 'Slika'}
                    className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
                  />
                  {image.caption && (
                    <p className="text-sm text-gray-500 mt-1">{image.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-blue-600 rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Zainteresovani ste?</h3>
          <p className="mb-6 text-blue-100">
            Registrujte se da biste kontaktirali ovu kompaniju ili postavili svoj oglas
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/registracija">
              <Button className="bg-white text-blue-600 hover:bg-blue-50">
                Registruj se
              </Button>
            </Link>
            <Link href="/oglasi">
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                Pogledaj oglase
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© 2025 Trazim-Radnike.online | NKNet-Consulting.com</p>
        </div>
      </footer>

      {/* Image lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            &times;
          </button>
          <img
            src={selectedImage}
            alt="Uvecana slika"
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
