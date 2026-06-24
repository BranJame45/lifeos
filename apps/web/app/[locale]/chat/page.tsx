'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { Send, Bot, User } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ChatResponse {
  message: ChatMessage;
  history: ChatMessage[];
}

export default function ChatPage() {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadHistory() {
    try {
      const data = await api.get<ChatMessage[]>('/ai/chat');
      setMessages(data);
    } catch {}
    setLoading(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    setInput('');
    setSending(true);

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMsg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    const typingMsg: ChatMessage = {
      id: 'typing',
      role: 'assistant',
      content: t('loading'),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, typingMsg]);

    try {
      const res = await api.post<ChatResponse>('/ai/chat', { message: userMsg, locale });
      setMessages(res.history);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== 'typing').map((m) =>
        m.id === tempMsg.id ? m : m,
      ));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 shrink-0">{t('title')}</h1>

      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
              <Bot size={28} className="text-emerald-600" />
            </div>
            <p className="font-semibold text-gray-800 mb-2">{t('greeting')}</p>
            <p className="text-sm text-gray-500 mb-4">
              {t('intro')}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {[t('suggestion1'), t('suggestion2'), t('suggestion3')].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'assistant' ? 'bg-emerald-100' : 'bg-blue-100'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot size={16} className="text-emerald-600" />
                    : <User size={16} className="text-blue-600" />
                  }
                </div>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : msg.id === 'typing'
                    ? 'bg-gray-100 text-gray-400 italic rounded-tl-sm animate-pulse'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="p-4 border-t border-gray-100 shrink-0">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('placeholder')}
              disabled={sending}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
