'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import {
  Search, X, CheckCircle2, Send, Smile, Paperclip, Sparkles,
  ChevronRight, Tag, Calendar, MessageSquare, Check, UserPlus,
  ChevronDown,
} from 'lucide-react';
import type { FC } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type ConvStatus = 'open' | 'resolved' | 'archived';
type PlatformFilter = 'all' | 'Instagram' | 'Facebook' | 'WhatsApp' | 'LinkedIn' | 'Twitter';
type StatusFilter = 'all' | 'open' | 'resolved';

interface ConvContact {
  id: string;
  full_name?: string;
  name?: string;
  company?: string;
  email?: string;
}

interface Conversation {
  id: string;
  platform: string;
  status: ConvStatus;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  created_at: string;
  contact_id: string | null;
  contact?: ConvContact;
  contact_name?: string;
  contact_username?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  read_at: string | null;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, { color: string; bg: string }> = {
  Instagram: { color: '#e1306c', bg: '#fce4ec' },
  Facebook:  { color: '#1877f2', bg: '#e8f0fe' },
  WhatsApp:  { color: '#25d366', bg: '#e8f5e9' },
  LinkedIn:  { color: '#0077b5', bg: '#e3f2fd' },
  Twitter:   { color: '#111827', bg: '#f3f4f6' },
};

const PLATFORM_CHAR_LIMIT: Record<string, number | null> = {
  Twitter: 280, Instagram: null, Facebook: null, WhatsApp: null, LinkedIn: null,
};

const EMOJIS = ['😊','😂','❤️','👍','🎉','🙌','💪','🔥','✨','👏','😍','🤝','💡','📈','🚀','👋','😎','🌟','💯','🎯','😅','🏆','💬','📣','🎨','⚡','🌈','🙏','👀','💎'];

// ── No demo data ───────────────────────────────────────────────────────────────

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const AV_COLORS = ['#7c3aed','#0ea5e9','#059669','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7)  return `${d}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function genId() { return Math.random().toString(36).slice(2, 10); }

function convName(conv: Conversation): string {
  return conv.contact_name
    || conv.contact?.full_name
    || conv.contact?.name
    || 'Unknown';
}

// ── Platform Icon ──────────────────────────────────────────────────────────────

const PlatformIcon: FC<{ platform: string; size?: number }> = ({ platform, size = 16 }) => {
  const c = PLATFORM_COLORS[platform]?.color ?? '#6b7280';
  if (platform === 'Instagram') return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={c}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162S8.597 18.163 12 18.163s6.162-2.759 6.162-6.162S15.403 5.838 12 5.838zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  );
  if (platform === 'Facebook') return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={c}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  );
  if (platform === 'WhatsApp') return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={c}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  );
  if (platform === 'LinkedIn') return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={c}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  );
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={c}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
  );
};

// ── Avatar ─────────────────────────────────────────────────────────────────────

const Avatar: FC<{ name: string; size?: number }> = ({ name, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: avatarColor(name), color: '#fff', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.36, fontWeight: 700,
  }}>
    {getInitials(name)}
  </div>
);

// ── Typing Indicator ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px', background: '#f3f4f6', borderRadius: 16, borderBottomLeftRadius: 4, width: 'fit-content' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1}}`}</style>
    </div>
  );
}

// ── Emoji Picker ───────────────────────────────────────────────────────────────

function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return (
    <div ref={ref} style={{
      position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
      background: '#fff', borderRadius: 12, padding: 10,
      boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb',
      display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4, zIndex: 50, width: 220,
    }}>
      {EMOJIS.map(e => (
        <button key={e} onClick={() => { onPick(e); onClose(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4, borderRadius: 6 }}
          onMouseEnter={ev => (ev.currentTarget.style.background = '#f5f3ff')}
          onMouseLeave={ev => (ev.currentTarget.style.background = 'none')}
        >{e}</button>
      ))}
    </div>
  );
}

// ── Message Bubble Group ───────────────────────────────────────────────────────

function MessageGroup({ msgs, direction, name }: { msgs: Message[]; direction: 'inbound' | 'outbound'; name: string }) {
  const isOut = direction === 'outbound';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOut ? 'flex-end' : 'flex-start', gap: 2, marginBottom: 2 }}>
      <span style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2, paddingLeft: isOut ? 0 : 4, paddingRight: isOut ? 4 : 0 }}>
        {isOut ? 'You' : name}
      </span>
      {msgs.map((msg, idx) => (
        <div key={msg.id} style={{
          maxWidth: '72%', padding: '10px 14px',
          background: isOut ? '#7c3aed' : '#f3f4f6',
          color: isOut ? '#fff' : '#111827',
          borderRadius: 16,
          borderBottomRightRadius: isOut && idx === msgs.length - 1 ? 4 : 16,
          borderBottomLeftRadius: !isOut && idx === msgs.length - 1 ? 4 : 16,
          fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
      ))}
      <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, paddingLeft: isOut ? 0 : 4, paddingRight: isOut ? 4 : 0 }}>
        {fmtTime(msgs[msgs.length - 1].created_at)}
      </span>
    </div>
  );
}

function buildGroups(msgs: Message[]) {
  type G = { direction: 'inbound' | 'outbound'; msgs: Message[]; dateLabel: string | null };
  const result: G[] = [];
  let lastDate = '';
  for (const msg of msgs) {
    const dl = fmtDate(msg.created_at);
    const showDate = dl !== lastDate;
    if (showDate) lastDate = dl;
    const last = result[result.length - 1];
    const gap = last
      ? (new Date(msg.created_at).getTime() - new Date(last.msgs[last.msgs.length - 1].created_at).getTime()) / 60000
      : Infinity;
    if (last && last.direction === msg.direction && gap < 5 && !showDate) {
      last.msgs.push(msg);
    } else {
      result.push({ direction: msg.direction, msgs: [msg], dateLabel: showDate ? dl : null });
    }
  }
  return result;
}

// ── Contact Info Panel ─────────────────────────────────────────────────────────

function ContactInfoPanel({ conv, onNote }: { conv: Conversation; onNote: (n: string) => void }) {
  const [note, setNote] = useState('');
  const name = convName(conv);
  const pc = PLATFORM_COLORS[conv.platform] ?? PLATFORM_COLORS.Instagram;

  return (
    <div style={{ width: 280, flexShrink: 0, borderLeft: '1px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <Avatar name={name} size={50} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{name}</h3>
        {conv.contact?.company && (
          <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px' }}>{conv.contact.company}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 10 }}>
          <PlatformIcon platform={conv.platform} size={13} />
          <span style={{ fontSize: 12, color: pc.color, fontWeight: 600 }}>{conv.platform}</span>
          {conv.contact_username && (
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{conv.contact_username}</span>
          )}
        </div>
        <a href="/crm" style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, fontWeight: 600, color: '#7c3aed', textDecoration: 'none',
          padding: '5px 12px', borderRadius: 999, background: '#f5f3ff',
        }}>
          View in CRM <ChevronRight size={12} />
        </a>
      </div>

      <div style={{ padding: '12px 18px', borderBottom: '1px solid #f3f4f6' }}>
        <h4 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Recent Activity</h4>
        {[
          { text: `Conversation started`, time: timeAgo(conv.created_at) },
          { text: `Last message`, time: timeAgo(conv.last_message_at) },
          { text: `Status: ${conv.status}`, time: '' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
            <span style={{ color: '#374151' }}>{item.text}</span>
            <span style={{ color: '#9ca3af' }}>{item.time}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 18px', borderBottom: '1px solid #f3f4f6' }}>
        <h4 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Quick Actions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            { icon: <UserPlus size={13} />, label: 'Add to CRM',       color: '#7c3aed', bg: '#f5f3ff' },
            { icon: <Calendar size={13} />,  label: 'Schedule a Post',  color: '#0ea5e9', bg: '#f0f9ff' },
            { icon: <Tag size={13} />,        label: 'Add Tag',          color: '#059669', bg: '#ecfdf5' },
          ].map(({ icon, label, color, bg }) => (
            <button key={label} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
              borderRadius: 8, border: 'none', background: bg, color, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 18px', flex: 1 }}>
        <h4 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Notes</h4>
        <textarea
          value={note} onChange={e => setNote(e.target.value)}
          placeholder="Add a note about this contact…"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, resize: 'vertical', minHeight: 80, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
        <button
          onClick={() => { if (note.trim()) { onNote(note.trim()); setNote(''); } }}
          disabled={!note.trim()}
          style={{
            marginTop: 8, width: '100%', padding: '7px', borderRadius: 8, border: 'none',
            background: note.trim() ? '#7c3aed' : '#e5e7eb',
            color: note.trim() ? '#fff' : '#9ca3af',
            fontSize: 12, fontWeight: 600, cursor: note.trim() ? 'pointer' : 'default',
          }}
        >Save Note</button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [typing, setTyping] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bulkRef = useRef<HTMLDivElement>(null);

  // ── Fetch conversations ──
  const fetchConversations = useCallback(async () => {
    try {
      const p = new URLSearchParams();
      if (statusFilter !== 'all')   p.set('status', statusFilter);
      if (platformFilter !== 'all') p.set('platform', platformFilter);
      if (search) p.set('search', search);
      const res = await fetch(`/api/conversations?${p}`);
      if (!res.ok) throw new Error('failed');
      const json = await res.json();
      setConversations(json.conversations ?? []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, platformFilter, search]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // ── Fetch messages when conversation selected ──
  useEffect(() => {
    if (!selected) return;
    setAiSuggestion('');
    setMsgLoading(true);
    // Mark as read
    fetch(`/api/conversations/${selected.id}/messages`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read' }),
    }).catch(() => {});
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, unread_count: 0 } : c));

    fetch(`/api/conversations/${selected.id}/messages`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => setMessages(j.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false));
  }, [selected?.id]);

  // ── Scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Supabase Realtime subscription ──
  useEffect(() => {
    if (!selected) return;
    const sb = createClient();
    const channel = sb
      .channel(`msgs:${selected.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${selected.id}`,
      }, (payload: { new: unknown }) => {
        const msg = payload.new as Message;
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        setConversations(prev => prev.map(c =>
          c.id === selected.id ? { ...c, last_message: msg.content, last_message_at: msg.created_at } : c
        ));
        if (document.hidden && msg.direction === 'inbound' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(`New message from ${convName(selected)}`, { body: msg.content });
        }
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [selected?.id]);

  // ── Request notification permission ──
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── Close bulk menu on outside click ──
  useEffect(() => {
    const h = (e: MouseEvent) => { if (bulkRef.current && !bulkRef.current.contains(e.target as Node)) setBulkOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Send message ──
  async function sendMessage() {
    if (!inputText.trim() || !selected) return;
    const text = inputText.trim();
    setInputText('');
    setTyping(true);
    setTimeout(() => setTyping(false), 1400);

    const optimistic: Message = {
      id: `opt-${genId()}`, conversation_id: selected.id,
      content: text, direction: 'outbound',
      read_at: new Date().toISOString(), created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setConversations(prev => prev.map(c =>
      c.id === selected.id ? { ...c, last_message: text, last_message_at: optimistic.created_at } : c
    ));
    try {
      await fetch(`/api/conversations/${selected.id}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, direction: 'outbound' }),
      });
    } catch {}
  }

  // ── AI Reply ──
  async function getAIReply() {
    if (!selected || aiLoading) return;
    setAiLoading(true);
    setAiSuggestion('');
    try {
      const res = await fetch('/api/ai/reply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.slice(-5), platform: selected.platform }),
      });
      const json = await res.json();
      setAiSuggestion(json.reply ?? "Thanks for reaching out! I'd love to help. Could you share more details?");
    } catch {
      setAiSuggestion("Thanks for reaching out! I'd love to help. Could you share more details?");
    } finally {
      setAiLoading(false);
    }
  }

  // ── Resolve / Reopen ──
  function handleResolve() {
    if (!selected) return;
    const next: ConvStatus = selected.status === 'resolved' ? 'open' : 'resolved';
    setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, status: next } : c));
    setSelected(prev => prev ? { ...prev, status: next } : null);
    fetch('/api/conversations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, status: next }),
    }).catch(() => {});
  }

  // ── Bulk actions ──
  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function handleBulkAction(action: 'read' | 'archive') {
    const ids = Array.from(selectedIds);
    if (action === 'read') {
      setConversations(prev => prev.map(c => ids.includes(c.id) ? { ...c, unread_count: 0 } : c));
    } else {
      setConversations(prev => prev.filter(c => !ids.includes(c.id)));
      if (selected && ids.includes(selected.id)) setSelected(null);
    }
    setSelectedIds(new Set());
    setBulkOpen(false);
  }

  // ── Derived state ──
  const filtered = useMemo(() => {
    let list = conversations;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => convName(c).toLowerCase().includes(q) || c.last_message.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all')   list = list.filter(c => c.status === statusFilter);
    if (platformFilter !== 'all') list = list.filter(c => c.platform === platformFilter);
    return list;
  }, [conversations, search, statusFilter, platformFilter]);

  const counts = useMemo(() => ({
    all:      conversations.length,
    open:     conversations.filter(c => c.status === 'open').length,
    resolved: conversations.filter(c => c.status === 'resolved').length,
    unread:   conversations.reduce((s, c) => s + c.unread_count, 0),
  }), [conversations]);

  const groups = useMemo(() => buildGroups(messages), [messages]);
  const charLimit = selected ? (PLATFORM_CHAR_LIMIT[selected.platform] ?? null) : null;
  const name = selected ? convName(selected) : '';
  const PLATFORMS: PlatformFilter[] = ['all', 'Instagram', 'Facebook', 'WhatsApp', 'LinkedIn', 'Twitter'];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 104px)', background: '#f4f5ff', overflow: 'hidden' }}>

      {/* ── PANEL 1: Inbox List ── */}
      <div style={{ width: 320, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0, flex: 1 }}>Inbox</h1>
            {counts.unread > 0 && (
              <span style={{ background: '#7c3aed', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
                {counts.unread}
              </span>
            )}
            {selectedIds.size > 0 && (
              <div ref={bulkRef} style={{ position: 'relative' }}>
                <button onClick={() => setBulkOpen(o => !o)} style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                  borderRadius: 7, border: '1.5px solid #7c3aed', background: '#f5f3ff',
                  color: '#7c3aed', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  {selectedIds.size} sel. <ChevronDown size={12} />
                </button>
                {bulkOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: '#fff', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb', zIndex: 50, minWidth: 160, overflow: 'hidden' }}>
                    <button onClick={() => handleBulkAction('read')}    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 13, color: '#374151', background: '#fff', border: 'none', cursor: 'pointer' }}>✓ Mark as Read</button>
                    <button onClick={() => handleBulkAction('archive')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 13, color: '#dc2626', background: '#fff', border: 'none', cursor: 'pointer' }}>Archive Selected</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…"
              style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', background: '#f9fafb', boxSizing: 'border-box' }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={12} color="#9ca3af" />
              </button>
            )}
          </div>

          {/* Status tabs */}
          <div style={{ display: 'flex', marginBottom: 8 }}>
            {(['all', 'open', 'resolved'] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                flex: 1, padding: '6px 0', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: statusFilter === s ? 700 : 500,
                color: statusFilter === s ? '#7c3aed' : '#6b7280',
                borderBottom: statusFilter === s ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                textTransform: 'capitalize',
              }}>
                {s === 'all' ? `All (${counts.all})` : s === 'open' ? `Open (${counts.open})` : `Done (${counts.resolved})`}
              </button>
            ))}
          </div>

          {/* Platform filter */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            {PLATFORMS.map(p => (
              <button key={p} onClick={() => setPlatformFilter(p)} style={{
                padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: platformFilter === p ? 700 : 500,
                background: platformFilter === p ? '#7c3aed' : 'transparent',
                color: platformFilter === p ? '#fff' : '#6b7280',
                border: platformFilter === p ? 'none' : '1px solid #e5e7eb',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {p === 'all' ? 'All' : p}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 14px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f3f4f6', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, background: '#f3f4f6', borderRadius: 4, marginBottom: 6, width: '55%' }} />
                  <div style={{ height: 10, background: '#f3f4f6', borderRadius: 4, width: '80%' }} />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <MessageSquare size={32} color="#d1d5db" style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>No conversations yet</p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Connect your social accounts to start receiving messages</p>
            </div>
          ) : (
            filtered.map(conv => {
              const isActive   = selected?.id === conv.id;
              const isSelected = selectedIds.has(conv.id);
              const cName      = convName(conv);
              const hasUnread  = conv.unread_count > 0;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelected(isActive ? null : conv)}
                  style={{
                    display: 'flex', gap: 10, padding: '11px 14px', cursor: 'pointer', position: 'relative',
                    background: isActive ? '#faf5ff' : isSelected ? '#fefce8' : '#fff',
                    borderLeft: isActive ? '3px solid #7c3aed' : '3px solid transparent',
                    borderBottom: '1px solid #f9fafb',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#fafafa'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isSelected ? '#fefce8' : '#fff'; }}
                >
                  {/* Bulk checkbox */}
                  <div onClick={e => toggleSelect(conv.id, e)}
                    style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', zIndex: 2, opacity: isSelected ? 1 : 0, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.opacity = '0'; }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isSelected ? '#7c3aed' : '#d1d5db'}`, background: isSelected ? '#7c3aed' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                    </div>
                  </div>

                  <Avatar name={cName} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: hasUnread ? 700 : 500, color: '#111827', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>
                        {cName}
                      </span>
                      <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 6 }}>
                        {timeAgo(conv.last_message_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: hasUnread ? '#374151' : '#9ca3af', margin: '0 0 4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: hasUnread ? 500 : 400 }}>
                      {conv.last_message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <PlatformIcon platform={conv.platform} size={13} />
                      {conv.unread_count > 0 && (
                        <span style={{ background: '#7c3aed', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── PANEL 2: Message Thread ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', overflow: 'hidden' }}>
        {selected ? (
          <>
            {/* Thread header */}
            <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <Avatar name={name} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, background: PLATFORM_COLORS[selected.platform]?.bg ?? '#f3f4f6' }}>
                    <PlatformIcon platform={selected.platform} size={12} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: PLATFORM_COLORS[selected.platform]?.color ?? '#6b7280' }}>{selected.platform}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                    background: selected.status === 'open' ? '#ecfdf5' : '#f3f4f6',
                    color: selected.status === 'open' ? '#059669' : '#6b7280',
                  }}>
                    {selected.status === 'open' ? '● Open' : '✓ Resolved'}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                  {selected.contact_username || selected.contact?.email || ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={getAIReply} disabled={aiLoading} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8,
                  border: '1.5px solid #d8b4fe', background: '#f5f3ff', color: '#7c3aed',
                  fontSize: 12, fontWeight: 600, cursor: aiLoading ? 'default' : 'pointer',
                }}>
                  <Sparkles size={13} /> {aiLoading ? 'Thinking…' : 'AI Reply'}
                </button>
                <button onClick={handleResolve} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8,
                  border: '1.5px solid #e5e7eb', background: '#fff',
                  color: selected.status === 'open' ? '#059669' : '#6b7280',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  <CheckCircle2 size={13} />
                  {selected.status === 'open' ? 'Resolve' : 'Reopen'}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
              {msgLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <div style={{ width: 24, height: 24, border: '3px solid #e9d5ff', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : (
                <>
                  {groups.map((g, gi) => (
                    <div key={gi}>
                      {g.dateLabel && (
                        <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                          <span style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', padding: '4px 12px', borderRadius: 999 }}>{g.dateLabel}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: g.direction === 'outbound' ? 'flex-end' : 'flex-start', marginBottom: 12, alignItems: 'flex-end', gap: 8 }}>
                        {g.direction === 'inbound' && <Avatar name={name} size={26} />}
                        <MessageGroup msgs={g.msgs} direction={g.direction} name={name} />
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
                      <Avatar name={name} size={26} />
                      <TypingIndicator />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* AI Suggestion Box */}
            {aiSuggestion && (
              <div style={{ margin: '0 16px 8px', padding: '12px 14px', background: '#f5f3ff', border: '1.5px solid #d8b4fe', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={12} /> AI Suggested Reply
                  </span>
                  <button onClick={() => setAiSuggestion('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#a78bfa' }}>
                    <X size={13} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: '#374151', margin: '0 0 10px', lineHeight: 1.6 }}>{aiSuggestion}</p>
                <button
                  onClick={() => { setInputText(aiSuggestion); setAiSuggestion(''); setTimeout(() => inputRef.current?.focus(), 50); }}
                  style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Use this reply →
                </button>
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '10px 16px 14px', background: '#fff', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
              {charLimit && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: inputText.length > charLimit * 0.9 ? '#ef4444' : '#9ca3af' }}>
                    {inputText.length}/{charLimit}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: '#f9fafb', borderRadius: 12, border: '1.5px solid #e5e7eb', padding: '8px 10px' }}>
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Message ${name}…`}
                  maxLength={charLimit ?? undefined}
                  rows={1}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowEmoji(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4, color: '#9ca3af' }}>
                      <Smile size={18} />
                    </button>
                    {showEmoji && <EmojiPicker onPick={e => setInputText(t => t + e)} onClose={() => setShowEmoji(false)} />}
                  </div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4, color: '#9ca3af' }}>
                    <Paperclip size={18} />
                  </button>
                  <button onClick={sendMessage} disabled={!inputText.trim()} style={{
                    padding: '7px 14px', borderRadius: 8, border: 'none',
                    background: inputText.trim() ? '#7c3aed' : '#e5e7eb',
                    color: inputText.trim() ? '#fff' : '#9ca3af',
                    cursor: inputText.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600,
                  }}>
                    <Send size={14} /> Send
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={30} color="#7c3aed" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Select a conversation</h3>
              <p style={{ fontSize: 13, color: '#6b7280' }}>Choose from the inbox to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* ── PANEL 3: Contact Info ── */}
      {selected && (
        <ContactInfoPanel conv={selected} onNote={(note) => {
          if (selected.contact_id) {
            fetch('/api/contacts', {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: selected.contact_id, notes: note }),
            }).catch(() => {});
          }
        }} />
      )}
    </div>
  );
}
