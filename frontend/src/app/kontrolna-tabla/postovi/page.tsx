'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useIsAuthenticated, useAuthTokens, useAuthStore } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PostImage {
  id: string;
  url: string;
  caption: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  type: string;
  status: string;
  excerpt: string | null;
  coverImage: string | null;
  viewCount: number;
  shareCount: number;
  publishedAt: string | null;
  createdAt: string;
  images: PostImage[];
}

export default function PostsPage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const tokens = useAuthTokens();
  const logout = useAuthStore((state) => state.logout);

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/prijava');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (tokens?.accessToken) {
      loadPosts();
    }
  }, [tokens?.accessToken]);

  const loadPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setPosts(data.data.posts);
      }
    } catch (err) {
      setError('Greska pri ucitavanju postova');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Da li ste sigurni da zelite da obrisete ovaj post?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (err) {
      alert('Greska pri brisanju posta');
    }
  };

  const handlePublish = async (postId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        loadPosts();
      }
    } catch (err) {
      alert('Greska pri objavljivanju posta');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sr-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Objavljeno</span>;
      case 'DRAFT':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Nacrt</span>;
      case 'ARCHIVED':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">Arhivirano</span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'STORY':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Story</span>;
      case 'PROMO':
        return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">Promo</span>;
      case 'NEWS':
        return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">Vest</span>;
      case 'UPDATE':
        return <span className="px-2 py-1 text-xs bg-teal-100 text-teal-700 rounded-full">Update</span>;
      default:
        return null;
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Ucitavanje...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Trazim-Radnike.online
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/kontrolna-tabla" className="text-sm text-gray-600 hover:text-gray-900">
              Kontrolna tabla
            </Link>
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Odjavi se
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Moji postovi</h1>
            <p className="text-gray-600">Kreirajte promo sadrzaj za deljenje na drustvenim mrezama</p>
          </div>
          <Link href="/kontrolna-tabla/postovi/novi">
            <Button>
              <span className="mr-2">+</span>
              Novi post
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Ucitavanje postova...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nemate postova</h3>
              <p className="text-gray-600 mb-6">
                Kreirajte svoj prvi promo post sa slikama i podelite ga na drustvenim mrezama
              </p>
              <Link href="/kontrolna-tabla/postovi/novi">
                <Button>Kreiraj prvi post</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <div className="flex">
                  {/* Cover image */}
                  <div className="w-48 h-40 flex-shrink-0 bg-gray-100">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-4xl">🖼️</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(post.status)}
                          {getTypeBadge(post.type)}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {post.excerpt || post.content.slice(0, 150)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📅 {formatDate(post.createdAt)}</span>
                        <span>👁️ {post.viewCount} pregleda</span>
                        <span>🔗 {post.shareCount} deljenja</span>
                        <span>🖼️ {post.images.length} slika</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {post.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublish(post.id)}
                          >
                            Objavi
                          </Button>
                        )}
                        <Link href={`/kontrolna-tabla/postovi/${post.id}`}>
                          <Button variant="outline" size="sm">
                            Izmeni
                          </Button>
                        </Link>
                        {post.status === 'PUBLISHED' && (
                          <Link href={`/post/${post.slug}`} target="_blank">
                            <Button variant="outline" size="sm">
                              Pogledaj
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(post.id)}
                        >
                          Obrisi
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Saveti za promo postove</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Koristite kvalitetne slike radnog mesta i smestaja</li>
            <li>• Opisite prednosti rada kod vas (plata, beneficije, uslovi)</li>
            <li>• Podelite post na Facebook, Instagram i LinkedIn za veci doseg</li>
            <li>• Redovno objavljujte nove postove da privucete vise kandidata</li>
          </ul>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <Link href="/kontrolna-tabla" className="text-blue-600 hover:text-blue-800">
            &larr; Nazad na kontrolnu tablu
          </Link>
        </div>
      </main>
    </div>
  );
}
