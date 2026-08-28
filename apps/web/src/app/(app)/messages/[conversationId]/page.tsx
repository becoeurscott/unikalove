'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import { playSound } from '@/lib/sound';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  reactions: Record<string, string> | null;
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const history = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => api<{ items: Message[] }>(`/conversations/${conversationId}/messages?limit=50`),
  });

  // AI icebreakers, fetched only for an empty thread.
  const starters = useQuery({
    queryKey: ['starters', conversationId],
    queryFn: () => api<{ starters: string[] }>(`/ai/starters/${conversationId}`),
    enabled: messages.length === 0 && !history.isLoading,
    staleTime: Infinity,
    retry: false,
  });

  // On-demand reply suggestions for the last received message.
  const [replies, setReplies] = useState<string[]>([]);
  const suggestReplies = useMutation({
    mutationFn: () => {
      const lastIncoming = [...messages].reverse().find((m) => m.senderId !== user?.id);
      return api<{ replies: string[] }>('/ai/reply-suggestions', {
        method: 'POST',
        body: {
          lastMessage: lastIncoming?.content ?? '',
          history: messages.slice(-6).map((m) => m.content),
        },
      });
    },
    onSuccess: (res) => setReplies(res.replies),
    onError: () => setReplies([]),
  });

  useEffect(() => {
    if (history.data) setMessages([...history.data.items].reverse());
  }, [history.data]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('conversation.join', { conversationId });
    socket.emit('read', { conversationId });

    const onNew = (msg: Message & { conversationId?: string }) => {
      // Only the other side's messages chime; the echo of your own is silent.
      if (msg.senderId !== user?.id) playSound('message');
      setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
      setOtherTyping(false);
      socket.emit('read', { conversationId });
      qc.invalidateQueries({ queryKey: ['counts'] });
    };
    const onTyping = (e: { conversationId: string; isTyping: boolean; userId: string }) => {
      if (e.conversationId === conversationId && e.userId !== user?.id) {
        setOtherTyping(e.isTyping);
      }
    };
    const onRead = (e: { conversationId: string }) => {
      if (e.conversationId === conversationId) {
        setMessages((m) =>
          m.map((msg) =>
            msg.senderId === user?.id && !msg.readAt
              ? { ...msg, readAt: new Date().toISOString() }
              : msg,
          ),
        );
      }
    };
    socket.on('message.new', onNew);
    socket.on('typing', onTyping);
    socket.on('read', onRead);
    return () => {
      socket.off('message.new', onNew);
      socket.off('typing', onTyping);
      socket.off('read', onRead);
    };
  }, [conversationId, user?.id, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  function send(text: string) {
    const content = text.trim();
    if (!content) return;
    const socket = getSocket();
    socket.emit(
      'message.send',
      { conversationId, content },
      (msg: Message) => msg?.id && setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg])),
    );
    socket.emit('typing', { conversationId, isTyping: false });
    playSound('sent');
    setDraft('');
  }

  function onDraftChange(v: string) {
    setDraft(v);
    const socket = getSocket();
    socket.emit('typing', { conversationId, isTyping: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => socket.emit('typing', { conversationId, isTyping: false }),
      1500,
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/messages" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Conversation</h1>
        {otherTyping && <span className="text-sm text-brand">écrit…</span>}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto rounded-card border border-gray-100 bg-white p-4">
        {messages.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  mine ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-gray-100'
                }`}
              >
                <p>{m.content}</p>
                <div
                  className={`mt-0.5 text-right text-[10px] ${mine ? 'text-white/70' : 'text-gray-400'}`}
                >
                  {new Date(m.createdAt).toLocaleTimeString('fr', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {mine && (m.readAt ? ' · Lu' : ' · Envoyé')}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && !history.isLoading && (
          <div className="py-8 text-center">
            <p className="mb-3 flex items-center justify-center gap-1.5 text-sm text-gray-400">
              <Sparkles size={14} className="text-brand" />
              {starters.isLoading ? 'Suggestions en cours…' : 'Brisez la glace :'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {(starters.data?.starters ?? []).map((line) => (
                <button
                  key={line}
                  onClick={() => send(line)}
                  className="rounded-full bg-brand-soft px-3 py-1.5 text-xs text-brand hover:opacity-80"
                >
                  {line}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => suggestReplies.mutate()}
            disabled={suggestReplies.isPending}
            className="flex items-center gap-1.5 rounded-full border border-brand/30 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft disabled:opacity-50"
          >
            <Sparkles size={13} />
            {suggestReplies.isPending ? 'Réflexion…' : 'Suggérer une réponse'}
          </button>
          {replies.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setDraft(r);
                setReplies([]);
              }}
              className="rounded-full bg-brand-soft px-3 py-1.5 text-xs text-brand hover:opacity-80"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Votre message…"
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          <Send size={16} />
          Envoyer
        </button>
      </form>
    </div>
  );
}
