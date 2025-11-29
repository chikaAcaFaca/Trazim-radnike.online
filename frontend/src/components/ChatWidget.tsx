'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotResponse {
  response: string;
  suggestedActions?: string[];
  collectedData?: Record<string, any>;
  action?: string | null;
}

// Generate or retrieve session ID from localStorage
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const storageKey = 'chatbot_session_id';
  let sessionId = localStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [guestSessionId] = useState(getOrCreateSessionId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Load initial greeting when chat opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadGreeting();
    }
  }, [isOpen, messages.length]);

  const loadGreeting = async () => {
    try {
      const data = await api.get<ChatbotResponse>('/chat/bot/greeting');

      setMessages([{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }]);

      if (data.suggestedActions?.length) {
        setSuggestedActions(data.suggestedActions);
      }
    } catch (error) {
      console.error('Failed to load greeting:', error);
      // Fallback greeting
      setMessages([{
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Zdravo! 👋\n\nDobrodošli na Tražim-Radnike.online!\n\nKako vam mogu pomoći danas?`,
        timestamp: new Date(),
      }]);
      setSuggestedActions(['📝 Kreiraj oglas', '❓ Imam pitanje']);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSuggestedActions([]);
    setIsLoading(true);

    try {
      const data = await api.post<ChatbotResponse>('/chat/bot/message', {
        message: text.trim(),
        guestSessionId,
      });

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.suggestedActions?.length) {
        setSuggestedActions(data.suggestedActions);
      }

      // Handle actions
      if (data.action === 'CREATE_JOB') {
        // Could show a button to go to job creation
      } else if (data.action === 'REGISTER') {
        // Could show a button to register
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'Izvinite, došlo je do greške. Molimo pokušajte ponovo.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestedAction = (action: string) => {
    sendMessage(action);
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Headers with emoji
        if (line.startsWith('━')) {
          return <div key={i} className="border-t border-gray-200 my-2" />;
        }
        if (line.includes('✅') || line.includes('🔹') || line.includes('📝') ||
            line.includes('💰') || line.includes('📋') || line.includes('🎯') ||
            line.includes('👋') || line.includes('🚀') || line.includes('❓')) {
          return (
            <p key={i} className="my-1" dangerouslySetInnerHTML={{ __html: line }} />
          );
        }
        return line ? (
          <p key={i} className="my-1" dangerouslySetInnerHTML={{ __html: line }} />
        ) : (
          <br key={i} />
        );
      });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-blue-600 hover:bg-blue-700 animate-pulse hover:animate-none'
        }`}
        aria-label={isOpen ? 'Zatvori chat' : 'Otvori chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Asistent</h3>
                <p className="text-xs text-blue-100">Online • Spreman da pomogne</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] min-h-[300px] bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    {message.role === 'assistant'
                      ? formatMessage(message.content)
                      : message.content
                    }
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 rounded-bl-md">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Kucam...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Actions */}
          {suggestedActions.length > 0 && !isLoading && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2">
              {suggestedActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedAction(action)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Napišite poruku..."
                disabled={isLoading}
                className="flex-1 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
