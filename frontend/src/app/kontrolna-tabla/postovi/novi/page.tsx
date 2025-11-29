'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useIsAuthenticated, useAuthTokens, useAuthStore } from '@/stores/auth.store';

// Dynamic import for the editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="border rounded-lg p-8 text-center text-gray-500">
      Ucitavanje editora...
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const POST_TYPES = [
  { value: 'STORY', label: 'Story', description: 'Prica o vasoj kompaniji ili timu', icon: '📖' },
  { value: 'PROMO', label: 'Promo', description: 'Promotivni sadrzaj za privlacenje radnika', icon: '🎯' },
  { value: 'NEWS', label: 'Vest', description: 'Novosti i obavestenja', icon: '📰' },
  { value: 'UPDATE', label: 'Update', description: 'Azuriranja i promene', icon: '🔄' },
];

export default function NewPostPage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const tokens = useAuthTokens();
  const logout = useAuthStore((state) => state.logout);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('PROMO');
  const [excerpt, setExcerpt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/prijava');
    }
  }, [isAuthenticated, router]);

  // Function to upload image and return URL
  const handleImageUpload = async (file: File): Promise<string> => {
    // First ensure we have a post to attach images to
    let currentPostId = postId;

    if (!currentPostId) {
      // Create a draft post first
      const createResponse = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          title: title || 'Novi post',
          content: content || '<p>Sadrzaj u pripremi...</p>',
          type,
        }),
      });

      const createData = await createResponse.json();
      if (createData.success) {
        currentPostId = createData.data.post.id;
        setPostId(currentPostId);
      } else {
        throw new Error(createData.error || 'Greska pri kreiranju posta');
      }
    }

    // Upload image
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}/api/posts/${currentPostId}/images`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens?.accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      return data.data.image.url;
    } else {
      throw new Error(data.error || 'Greska pri uploadu slike');
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      setError('Naslov je obavezan');
      return;
    }

    // Strip HTML to check if there's actual content
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
      setError('Sadrzaj je obavezan');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let currentPostId = postId;

      if (!currentPostId) {
        // Create new post
        const createResponse = await fetch(`${API_URL}/api/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({
            title,
            content,
            type,
            excerpt: excerpt || undefined,
          }),
        });

        const createData = await createResponse.json();
        if (!createResponse.ok || !createData.success) {
          throw new Error(createData.error || 'Greska pri kreiranju posta');
        }
        currentPostId = createData.data.post.id;
      } else {
        // Update existing post
        const updateResponse = await fetch(`${API_URL}/api/posts/${currentPostId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({
            title,
            content,
            type,
            excerpt: excerpt || undefined,
          }),
        });

        const updateData = await updateResponse.json();
        if (!updateResponse.ok || !updateData.success) {
          throw new Error(updateData.error || 'Greska pri azuriranju posta');
        }
      }

      // Publish if requested
      if (publish && currentPostId) {
        await fetch(`${API_URL}/api/posts/${currentPostId}/publish`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
        });
      }

      router.push('/kontrolna-tabla/postovi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greska pri cuvanju');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
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
      <header className="bg-white shadow-sm sticky top-0 z-50">
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novi post</h1>
            <p className="text-gray-600">Kreirajte vizuelni promo sadrzaj za deljenje</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? '✏️ Uredi' : '👁️ Pregled'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {previewMode ? (
          /* Preview Mode */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{POST_TYPES.find(t => t.value === type)?.icon}</span>
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                  {POST_TYPES.find(t => t.value === type)?.label}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {title || 'Naslov posta'}
              </h1>
              {excerpt && (
                <p className="text-lg text-gray-600 mb-6 pb-6 border-b">
                  {excerpt}
                </p>
              )}
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">Sadrzaj posta...</p>' }}
              />
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Post type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tip posta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {POST_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        type === t.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{t.icon}</span>
                      <div className="font-medium text-gray-900">{t.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{t.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Title */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Naslov</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Unesite privlacan naslov za vas post..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSaving}
                  className="text-xl font-semibold"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-2">{title.length}/200 karaktera</p>
              </CardContent>
            </Card>

            {/* Content - Rich Text Editor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Sadrzaj</CardTitle>
                <CardDescription>
                  Koristite toolbar za formatiranje teksta. Prevucite slike direktno u editor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  onImageUpload={handleImageUpload}
                  placeholder="Pocnite da pisete vas promo sadrzaj...&#10;&#10;Koristite toolbar iznad za formatiranje teksta, dodavanje naslova, listi i slika.&#10;&#10;Mozete i prevuci slike direktno u editor!"
                />
              </CardContent>
            </Card>

            {/* Excerpt for sharing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Kratki opis (za deljenje)</CardTitle>
                <CardDescription>
                  Ovaj tekst se prikazuje kada podelite link na drustvenim mrezama
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Kratak opis koji privlaci paznju na drustvenim mrezama..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  disabled={isSaving}
                  maxLength={300}
                />
                <p className="text-xs text-gray-500 mt-2">{excerpt.length}/300 karaktera</p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm sticky bottom-4">
              <Link href="/kontrolna-tabla/postovi">
                <Button variant="outline">Odustani</Button>
              </Link>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={isSaving || !title.trim()}
                >
                  {isSaving ? 'Cuvanje...' : '💾 Sacuvaj nacrt'}
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={isSaving || !title.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? 'Objavljivanje...' : '🚀 Objavi post'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3">💡 Saveti za kreiranje postova</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <strong>Formatiranje teksta:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Koristite naslove (H1, H2, H3) za strukturu</li>
                <li>• Bold i italic za isticanje bitnih delova</li>
                <li>• Liste za preglednost informacija</li>
              </ul>
            </div>
            <div>
              <strong>Rad sa slikama:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Prevucite slike direktno u editor (drag & drop)</li>
                <li>• Kopirajte i zalepite slike (Ctrl+V)</li>
                <li>• Kliknite 🖼️ za upload iz foldera</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
