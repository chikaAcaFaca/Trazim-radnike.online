'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthTokens, useIsAuthenticated, useUser } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  sender: {
    id: string;
    email: string;
    role: string;
  };
}

interface Thread {
  id: string;
  type: 'BOT' | 'SUPPORT' | 'JOB_INQUIRY';
  status: 'OPEN' | 'CLOSED' | 'ESCALATED';
  job: {
    id: string;
    title: string;
    slug: string;
  } | null;
  participantA: {
    id: string;
    email: string;
  };
  participantB: {
    id: string;
    email: string;
  } | null;
  messages: Message[];
}

export default function PorukeThread() {
  const router = useRouter();
  const params = useParams();
  const threadId = params.id as string;

  const tokens = useAuthTokens();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();

  const [thread, setThread] = useState<Thread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/prijava');
      return;
    }
    loadThread();
  }, [isAuthenticated, router, threadId]);

  useEffect(() => {
    scrollToBottom();
  }, [thread?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadThread = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/threads/${threadId}`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setThread(data.data.thread);
      } else {
        setError(data.error || 'Greška pri učitavanju razgovora');
      }
    } catch (err) {
      setError('Greška pri povezivanju sa serverom');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ message: newMessage }),
      });

      const data = await response.json();

      if (data.success) {
        // Add new message to thread
        if (thread) {
          setThread({
            ...thread,
            messages: [...thread.messages, data.data.message],
          });
        }
        setNewMessage('');
        inputRef.current?.focus();
      } else {
        setError(data.error || 'Greška pri slanju poruke');
      }
    } catch (err) {
      setError('Greška pri slanju poruke');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('sr-Latn', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Učitavanje razgovora...</p>
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error || 'Razgovor nije pronađen'}
          </div>
          <Link href="/kontrolna-tabla/poruke">
            <Button variant="outline">Nazad na poruke</Button>
          </Link>
        </div>
      </div>
    );
  }

  const otherParticipant =
    thread.participantA.id === user?.id ? thread.participantB : thread.participantA;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/kontrolna-tabla/poruke">
                <Button variant="ghost" size="sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-gray-900">
                    {thread.job ? thread.job.title : thread.type === 'BOT' ? 'AI Asistent' : 'Podrška'}
                  </h1>
                  {getTypeBadge(thread.type)}
                  {getStatusBadge(thread.status)}
                </div>
                {otherParticipant && (
                  <p className="text-sm text-gray-500">{otherParticipant.email}</p>
                )}
              </div>
            </div>
            {thread.job && (
              <Link href={`/kontrolna-tabla/oglasi/${thread.job.id}`}>
                <Button variant="outline" size="sm">
                  Pogledaj oglas
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            {thread.messages.map((message) => {
              const isOwnMessage = message.sender.id === user?.id;
              const isBot = message.sender.role === 'ADMIN' && thread.type === 'BOT';

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[80%] rounded-2xl px-4 py-3
                      ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : isBot
                          ? 'bg-gradient-to-br from-purple-100 to-blue-100 text-gray-800 rounded-bl-md'
                          : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
                      }
                    `}
                  >
                    {!isOwnMessage && (
                      <div className="flex items-center gap-2 mb-1">
                        {isBot && <span className="text-sm">🤖</span>}
                        <span className="text-xs font-medium text-gray-500">
                          {isBot ? 'AI Asistent' : message.sender.email}
                        </span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                      {isOwnMessage && message.readAt && (
                        <span className="ml-2">✓ Pročitano</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      {thread.status !== 'CLOSED' && (
        <div className="bg-white border-t sticky bottom-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Napišite poruku..."
                className="
                  flex-1 px-4 py-3
                  border border-gray-200 rounded-xl
                  resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  min-h-[48px] max-h-[200px]
                "
                rows={1}
                disabled={isSending}
              />
              <Button
                onClick={sendMessage}
                disabled={isSending || !newMessage.trim()}
                className="px-6"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Closed notice */}
      {thread.status === 'CLOSED' && (
        <div className="bg-gray-100 border-t">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-gray-600">
            Ovaj razgovor je zatvoren. Za nova pitanja, otvorite novi razgovor.
          </div>
        </div>
      )}
    </div>
  );
}
