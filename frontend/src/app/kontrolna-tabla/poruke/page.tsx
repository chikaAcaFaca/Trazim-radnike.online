'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthTokens, useIsAuthenticated, useUser } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ChatThread {
  id: string;
  type: 'BOT' | 'SUPPORT' | 'JOB_INQUIRY';
  status: 'OPEN' | 'CLOSED' | 'ESCALATED';
  job: {
    id: string;
    title: string;
  } | null;
  otherParticipant: {
    id: string;
    email: string;
  } | null;
  lastMessage: {
    content: string;
    createdAt: string;
    readAt: string | null;
    sender: { id: string };
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export default function PorukePodrska() {
  const router = useRouter();
  const tokens = useAuthTokens();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/prijava');
      return;
    }
    loadThreads();
  }, [isAuthenticated, router]);

  const loadThreads = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/threads`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setThreads(data.data.threads);
      } else {
        setError(data.error || 'Greška pri učitavanju poruka');
      }
    } catch (err) {
      setError('Greška pri povezivanju sa serverom');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Juče';
    } else if (days < 7) {
      return date.toLocaleDateString('sr-Latn', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Otvoreno</span>;
      case 'ESCALATED':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Eskalacija</span>;
      case 'CLOSED':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Zatvoreno</span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'BOT':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">AI Chat</span>;
      case 'SUPPORT':
        return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">Podrška</span>;
      case 'JOB_INQUIRY':
        return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">Oglas</span>;
      default:
        return null;
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Učitavanje poruka...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Poruke</h1>
              <p className="text-gray-600 mt-1">
                Vaši razgovori sa podrškom i AI asistentom
              </p>
            </div>
            <Link href="/kontrolna-tabla">
              <Button variant="outline">Nazad</Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Threads List */}
        <div className="space-y-4">
          {threads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nemate poruka
                </h3>
                <p className="text-gray-600 mb-4">
                  Koristite AI asistenta ili kontaktirajte podršku za vaše oglase
                </p>
                <Button onClick={() => window.location.reload()}>
                  Osvježi
                </Button>
              </CardContent>
            </Card>
          ) : (
            threads.map((thread) => (
              <Link key={thread.id} href={`/kontrolna-tabla/poruke/${thread.id}`}>
                <Card className={`
                  cursor-pointer transition-all hover:shadow-md hover:border-blue-200
                  ${thread.unreadCount > 0 ? 'border-blue-400 bg-blue-50/50' : ''}
                `}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeBadge(thread.type)}
                          {getStatusBadge(thread.status)}
                          {thread.unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-600 text-white">
                              {thread.unreadCount} nova
                            </span>
                          )}
                        </div>

                        <h3 className="font-medium text-gray-900">
                          {thread.job ? (
                            <>Oglas: {thread.job.title}</>
                          ) : thread.type === 'BOT' ? (
                            'AI Asistent'
                          ) : (
                            'Podrška'
                          )}
                        </h3>

                        {thread.lastMessage && (
                          <p className={`
                            text-sm mt-1 truncate
                            ${thread.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}
                          `}>
                            {thread.lastMessage.sender.id === user?.id ? 'Vi: ' : ''}
                            {truncateMessage(thread.lastMessage.content)}
                          </p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-sm text-gray-500">
                          {formatDate(thread.updatedAt)}
                        </p>
                        <div className="mt-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 text-gray-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.25 4.5l7.5 7.5-7.5 7.5"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Trebate pomoć?</CardTitle>
            <CardDescription>
              Naš tim je tu za vas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => {
                // Open chatbot
                const event = new CustomEvent('openChatbot');
                window.dispatchEvent(event);
              }}>
                🤖 AI Asistent
              </Button>
              <Link href="/kontrolna-tabla/oglasi">
                <Button variant="outline">
                  📋 Moji oglasi
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
