'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthTokens, useIsAuthenticated } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestedActions?: string[];
}

interface SuggestedAction {
  label: string;
  action: string;
}

interface CollectedCompanyData {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  pib?: string;
  maticniBroj?: string;
  city?: string;
  country?: string;
}

// Generate a unique guest session ID - runs synchronously on first call
const getOrCreateGuestSessionId = (): string => {
  if (typeof window === 'undefined') return '';

  let guestId = localStorage.getItem('chatbot_guest_session_id');
  if (!guestId) {
    guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('chatbot_guest_session_id', guestId);
  }
  return guestId;
};

export function Chatbot() {
  const tokens = useAuthTokens();
  const isAuthenticated = useIsAuthenticated();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [collectedData, setCollectedData] = useState<CollectedCompanyData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get session ID synchronously when needed (avoids race condition)
  const getSessionId = useCallback(() => {
    if (isAuthenticated) return undefined;
    return getOrCreateGuestSessionId();
  }, [isAuthenticated]);

  // Initial greeting will be loaded from API
  const [initialGreeting, setInitialGreeting] = useState<ChatMessage>({
    id: 'initial',
    role: 'bot',
    content: `Dobrodošli na Tražim-Radnike.online! 👋

Ja sam vaš AI asistent i tu sam da vam pomognem sa svim pitanjima o našim uslugama.

Kako vam mogu pomoći danas?`,
    timestamp: new Date(),
    suggestedActions: [
      'Kako da postavim oglas?',
      'Zašto da koristim vašu platformu?',
      'Šta mi je sve potrebno?',
      'Koji su sledeći koraci?',
    ],
  });

  // Load greeting from API
  const loadGreeting = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/bot/greeting`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInitialGreeting({
            id: 'initial',
            role: 'bot',
            content: data.data.response,
            timestamp: new Date(),
            suggestedActions: data.data.suggestedActions || [],
          });
        }
      }
    } catch (error) {
      console.error('Failed to load greeting:', error);
    }
  };

  // Load greeting on mount
  useEffect(() => {
    loadGreeting();
  }, []);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Load conversation history when authenticated and chat opens
  useEffect(() => {
    if (isOpen && isAuthenticated && !hasLoadedHistory) {
      loadHistory();
    }
  }, [isOpen, isAuthenticated, hasLoadedHistory]);

  // Set initial greeting when chat first opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([initialGreeting]);
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/bot/history?limit=20`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.messages.length > 0) {
          const historyMessages: ChatMessage[] = data.data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.senderType === 'USER' ? 'user' : 'bot',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          }));
          setMessages([initialGreeting, ...historyMessages]);
        }
      }
      setHasLoadedHistory(true);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setHasLoadedHistory(true);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      // Only add auth header if we have a token
      if (tokens?.accessToken) {
        headers['Authorization'] = `Bearer ${tokens.accessToken}`;
      }

      const response = await fetch(`${API_URL}/api/chat/bot/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          guestSessionId: getSessionId(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'bot',
          content: data.data.response,
          timestamp: new Date(),
          suggestedActions: data.data.suggestedActions,
        };
        setMessages((prev) => [...prev, botMessage]);

        // Store collected data if present
        if (data.data.collectedData) {
          setCollectedData(data.data.collectedData);
          // Also store in localStorage for persistence
          localStorage.setItem('chatbot_collected_data', JSON.stringify(data.data.collectedData));
        }

        // Handle registration action
        if (data.data.action === 'REGISTER' && data.data.collectedData) {
          localStorage.setItem('chatbot_collected_data', JSON.stringify(data.data.collectedData));
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'bot',
        content: 'Izvinjavamo se, došlo je do greške. Molimo pokušajte ponovo ili nas kontaktirajte direktno.',
        timestamp: new Date(),
        suggestedActions: ['Pokušaj ponovo', 'Kontaktiraj podršku'],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedAction = (action: string) => {
    if (action === 'Registruj se') {
      window.location.href = '/registracija';
      return;
    }
    if (action === 'Prijavi se') {
      window.location.href = '/prijava';
      return;
    }
    if (action === 'Kontaktiraj podršku') {
      escalateToHuman();
      return;
    }
    // Handle registration completion with pre-filled data
    if (action.includes('Zavrsi registraciju') || action.includes('registraciju')) {
      const storedData = localStorage.getItem('chatbot_collected_data');
      if (storedData) {
        // Redirect to registration with pre-filled data indicator
        window.location.href = '/registracija?prefilled=true';
      } else {
        window.location.href = '/registracija';
      }
      return;
    }
    sendMessage(action);
  };

  const escalateToHuman = async () => {
    if (!isAuthenticated) {
      handleSuggestedAction('Prijavi se');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/chat/bot/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ reason: 'User requested human support' }),
      });

      const data = await response.json();

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: data.success
          ? `Vaš zahtev je prosleđen našem timu! 🎯

Jedan od naših saradnika će vas kontaktirati u najkraćem mogućem roku.

U međuvremenu, možete nastaviti da postavljate pitanja ovde.`
          : 'Izvinjavamo se, došlo je do greške pri povezivanju sa podrškom.',
        timestamp: new Date(),
        suggestedActions: ['Kako da postavim oglas?', 'Koji su sledeći koraci?'],
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Escalation error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('sr-Latn', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-blue-600 hover:bg-blue-700
          text-white shadow-lg
          flex items-center justify-center
          transition-all duration-300
          ${isOpen ? 'scale-0' : 'scale-100'}
        `}
        aria-label="Otvori chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-7 h-7"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      </button>

      {/* Chat Window */}
      <div
        className={`
          fixed bottom-6 right-6 z-50
          w-[380px] max-w-[calc(100vw-48px)]
          transition-all duration-300 origin-bottom-right
          ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `}
      >
        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Header */}
          <CardHeader className="bg-blue-600 text-white py-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">AI Asistent</CardTitle>
                  <p className="text-xs text-blue-100">Online • Spreman da pomogne</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Zatvori chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="p-0">
            <div className="h-[350px] overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] rounded-2xl px-4 py-2.5
                      ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
                      }
                    `}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>

                    {/* Suggested Actions */}
                    {message.suggestedActions && message.suggestedActions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestedActions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestedAction(action)}
                            className="
                              text-xs px-3 py-1.5 rounded-full
                              bg-blue-50 text-blue-600
                              hover:bg-blue-100 transition-colors
                              border border-blue-200
                            "
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <span
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Postavite pitanje..."
                  className="
                    flex-1 px-4 py-2.5
                    border border-gray-200 rounded-full
                    text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  "
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage(inputValue)}
                  disabled={isLoading || !inputValue.trim()}
                  className="
                    w-10 h-10 rounded-full
                    bg-blue-600 hover:bg-blue-700
                    disabled:bg-gray-300 disabled:cursor-not-allowed
                    text-white flex items-center justify-center
                    transition-colors
                  "
                  aria-label="Pošalji poruku"
                >
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
                </button>
              </div>

              {/* Escalate to human link */}
              <div className="mt-2 text-center">
                <button
                  onClick={escalateToHuman}
                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Želite da razgovarate sa operaterom?
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
