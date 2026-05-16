'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, ChevronLeft, ChevronRight, Calendar, List,
  Pencil, Trash2, Clock, Upload, X, CheckCircle2, Sparkles,
} from 'lucide-react';
import {
  InstagramIcon, FacebookIcon, LinkedinIcon, TikTokIcon, XIcon, YoutubeIcon,
} from '@/components/ui/platform-icons';
import type { FC } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  content: string;
  platforms: string[];
  scheduled_at: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  media_urls: string[];
  created_at: string;
}

interface IconProps { size?: number; color?: string; }

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORMS: { key: string; label: string; color: string; bg: string; cardBg: string; Icon: FC<IconProps>; limit: number }[] = [
  { key: 'instagram', label: 'Instagram', color: '#e1306c', bg: '#fce4ec', cardBg: '#fff0f5', Icon: InstagramIcon, limit: 2200  },
  { key: 'facebook',  label: 'Facebook',  color: '#1877f2', bg: '#e8f0fe', cardBg: '#f0f5ff', Icon: FacebookIcon,  limit: 63206 },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0077b5', bg: '#e3f2fd', cardBg: '#f0f8ff', Icon: LinkedinIcon,  limit: 3000  },
  { key: 'tiktok',    label: 'TikTok',    color: '#010101', bg: '#f3f4f6', cardBg: '#f8f8f8', Icon: TikTokIcon,    limit: 2200  },
  { key: 'x',         label: 'X',         color: '#000',    bg: '#f3f4f6', cardBg: '#f8f8f8', Icon: XIcon,         limit: 280   },
  { key: 'youtube',   label: 'YouTube',   color: '#ff0000', bg: '#ffebee', cardBg: '#fff5f5', Icon: YoutubeIcon,   limit: 5000  },
];

const BEST_TIMES = ['Mon 6:00 PM', 'Wed 12:00 PM', 'Fri 9:00 AM'];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  scheduled:  { bg: '#eff6ff', color: '#3b82f6', label: 'Scheduled'  },
  draft:      { bg: '#f8fafc', color: '#94a3b8', label: 'Draft'       },
  published:  { bg: '#f0fdf4', color: '#22c55e', label: 'Published'  },
  failed:     { bg: '#fef2f2', color: '#ef4444', label: 'Failed'      },
};

// No demo data — posts load from Supabase via /api/social/posts

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMonthGrid(date: Date): Date[][] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const start    = getMondayOf(firstDay);
  const weeks: Date[][] = [];
  let cur = new Date(start);
  while (cur <= lastDay || weeks.length < 4) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) { week.push(new Date(cur)); cur = addDays(cur, 1); }
    weeks.push(week);
    if (cur > lastDay && weeks.length >= 4) break;
  }
  return weeks;
}

function getMondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getPlatform(key: string) {
  return PLATFORMS.find(p => p.key === key) ?? PLATFORMS[0];
}

// ── Schedule Post Modal ───────────────────────────────────────────────────────

function ScheduleModal({
  onClose,
  onSaved,
  editPost,
}: {
  onClose: () => void;
  onSaved: (post: Post) => void;
  editPost?: Post | null;
}) {
  const [step, setStep]                 = useState(1);
  const [content, setContent]           = useState(editPost?.content ?? '');
  const [selPlatforms, setSelPlatforms] = useState<string[]>(editPost?.platforms ?? ['instagram']);
  const [scheduledAt, setScheduledAt]   = useState<string>(
    editPost?.scheduled_at ? new Date(editPost.scheduled_at).toISOString().slice(0, 16) : ''
  );
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  const togglePlatform = (key: string) =>
    setSelPlatforms(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const charLimitWarn = selPlatforms.some(pk => {
    const p = getPlatform(pk);
    return content.length > p.limit;
  });

  const handleSave = async (postNow?: boolean) => {
    if (!content.trim()) { setError('Please write some content.'); return; }
    if (selPlatforms.length === 0) { setError('Select at least one platform.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        content,
        platforms: selPlatforms,
        scheduled_at: postNow ? null : (scheduledAt ? new Date(scheduledAt).toISOString() : null),
        status: postNow ? 'published' : (scheduledAt ? 'scheduled' : 'draft'),
        media_urls: [],
        ...(editPost ? { id: editPost.id } : {}),
      };

      const res = await fetch('/api/social/posts', {
        method: editPost ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to save'); return; }
      onSaved(json.post);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', zIndex: 1 }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              {editPost ? 'Edit Post' : 'Schedule Post'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
              {step === 1 ? 'Write your content' : step === 2 ? 'Choose when to publish' : 'Preview & confirm'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <X size={16} />
          </button>
        </div>

        {/* Step indicators */}
        <div style={{ padding: '16px 24px', display: 'flex', gap: 8, alignItems: 'center' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                onClick={() => s < step && setStep(s)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, cursor: s < step ? 'pointer' : 'default',
                  background: s === step ? '#7c3aed' : s < step ? '#ede9fe' : '#f1f5f9',
                  color: s === step ? '#fff' : s < step ? '#7c3aed' : '#94a3b8',
                  transition: 'all 0.2s',
                }}
              >
                {s < step ? <CheckCircle2 size={14} /> : s}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: s === step ? '#7c3aed' : '#94a3b8' }}>
                {s === 1 ? 'Content' : s === 2 ? 'Schedule' : 'Preview'}
              </span>
              {s < 3 && <div style={{ width: 32, height: 2, background: s < step ? '#7c3aed' : '#e2e8f0', borderRadius: 2 }} />}
            </div>
          ))}
        </div>

        <div style={{ padding: '0 24px 24px' }}>

          {/* ── Step 1: Content ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Platform selector */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Platforms</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PLATFORMS.map(p => {
                    const sel = selPlatforms.includes(p.key);
                    return (
                      <button
                        key={p.key}
                        onClick={() => togglePlatform(p.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '7px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                          border: sel ? `2px solid ${p.color}` : '2px solid #e2e8f0',
                          background: sel ? p.bg : '#fafaf9',
                          fontWeight: 600, fontSize: 12, color: sel ? p.color : '#64748b',
                        }}
                      >
                        <p.Icon size={13} color={sel ? p.color : '#94a3b8'} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content textarea */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Content</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your post content here..."
                  rows={6}
                  style={{
                    width: '100%', borderRadius: 12, border: `1.5px solid ${charLimitWarn ? '#fca5a5' : '#e2e8f0'}`,
                    padding: '12px 14px', fontSize: 14, color: '#1e293b', resize: 'vertical',
                    fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box',
                    background: '#fafaf9',
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {selPlatforms.map(pk => {
                    const p = getPlatform(pk);
                    const over = content.length > p.limit;
                    return (
                      <span key={pk} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: over ? '#fef2f2' : '#f8fafc', color: over ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>
                        <p.Icon size={10} color={over ? '#ef4444' : '#94a3b8'} /> {p.label}: {content.length}/{p.limit}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Media upload */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Media (optional)</label>
                <div style={{
                  border: '2px dashed #e2e8f0', borderRadius: 12, padding: '28px 20px', textAlign: 'center',
                  background: '#fafaf9', cursor: 'pointer', transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7c3aed')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <Upload size={24} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Drag & drop images or videos</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>PNG, JPG, MP4 · Max 100MB</div>
                </div>
              </div>

              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>{error}</div>}

              <button
                onClick={() => { if (!content.trim() || selPlatforms.length === 0) { setError('Add content and select at least one platform.'); return; } setError(''); setStep(2); }}
                style={{ height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Continue to Schedule →
              </button>
            </div>
          )}

          {/* ── Step 2: Schedule ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{
                    width: '100%', height: 48, borderRadius: 12, border: '1.5px solid #e2e8f0',
                    padding: '0 16px', fontSize: 14, color: '#1e293b', background: '#fafaf9',
                    outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Sparkles size={14} color="#7c3aed" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>AI Best Times</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {BEST_TIMES.map(t => (
                    <button
                      key={t}
                      onClick={() => {
                        const [dayStr, time, period] = t.split(' ');
                        const today = new Date();
                        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                        const targetDay = days.indexOf(dayStr);
                        const diff = (targetDay - today.getDay() + 7) % 7 || 7;
                        const d = addDays(today, diff);
                        const [h, m] = time.split(':').map(Number);
                        const hour24 = period === 'PM' && h !== 12 ? h + 12 : (period === 'AM' && h === 12 ? 0 : h);
                        d.setHours(hour24, m, 0, 0);
                        setScheduledAt(d.toISOString().slice(0, 16));
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 20, border: '1.5px solid #ede9fe', background: '#f5f3ff', color: '#7c3aed', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Clock size={11} /> {t}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, margin: '8px 0 0' }}>Based on your audience engagement patterns</p>
              </div>

              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, height: 46, borderRadius: 12, background: '#f1f5f9', border: 'none', color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 2, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Preview →
                </button>
              </div>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                style={{ height: 44, borderRadius: 12, border: '1.5px solid #7c3aed', background: '#fff', color: '#7c3aed', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                ⚡ Post Now
              </button>
            </div>
          )}

          {/* ── Step 3: Preview ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Post Preview</div>
                {selPlatforms.map(pk => {
                  const p = getPlatform(pk);
                  return (
                    <div key={pk} style={{ background: p.cardBg, border: `1.5px solid ${p.color}22`, borderRadius: 14, padding: 16, marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${p.color}33` }}>
                          <p.Icon size={14} color={p.color} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Your Account</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.label}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: 11, color: p.color, fontWeight: 600, background: p.bg, padding: '3px 8px', borderRadius: 20 }}>{p.label}</div>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{content}</p>
                      {scheduledAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 11, color: '#94a3b8' }}>
                          <Clock size={11} />
                          Scheduled for {new Date(scheduledAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, height: 46, borderRadius: 12, background: '#f1f5f9', border: 'none', color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  style={{ flex: 2, height: 46, borderRadius: 12, background: saving ? '#a78bfa' : 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
                >
                  {saving ? 'Saving…' : '✓ Confirm & Schedule'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PlannerPage() {
  const [posts, setPosts]           = useState<Post[]>([]);
  const [loading, setLoading]       = useState(true);
  const [weekStart, setWeekStart]   = useState(() => getMondayOf(new Date()));
  const [monthDate, setMonthDate]   = useState(() => new Date());
  const [viewMode, setViewMode]     = useState<'week' | 'month'>('week');
  const [showModal, setShowModal]   = useState(false);
  const [editPost, setEditPost]     = useState<Post | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today    = new Date();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let from: string, to: string;
      if (viewMode === 'month') {
        const y = monthDate.getFullYear(), m = monthDate.getMonth();
        from = new Date(y, m, 1).toISOString();
        to   = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
      } else {
        from = weekStart.toISOString();
        to   = addDays(weekStart, 6).toISOString();
      }
      const res = await fetch(`/api/social/posts?from=${from}&to=${to}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPosts(json.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [weekStart, monthDate, viewMode]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/social/posts?id=${id}`, { method: 'DELETE' });
    setPosts(p => p.filter(x => x.id !== id));
  };

  const handleSaved = (post: Post) => {
    setPosts(prev => {
      const exists = prev.find(p => p.id === post.id);
      return exists ? prev.map(p => p.id === post.id ? post : p) : [post, ...prev];
    });
  };

  const getPostsForDay = (day: Date) =>
    posts.filter(p => p.scheduled_at && isSameDay(new Date(p.scheduled_at), day));

  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .planner-fade{animation:fadeUp 0.3s ease both}
        .post-card:hover{opacity:0.85;transform:scale(1.01)}
        .action-btn:hover{background:#f1f0ff!important}
        .day-col:hover .add-btn{opacity:1!important}
      `}</style>

      <div className="planner-fade" style={{ padding: '0 28px 32px' }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' }}>Social Planner</h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>
                {scheduledCount > 0
                  ? `${scheduledCount} post${scheduledCount > 1 ? 's' : ''} scheduled this week`
                  : 'No posts scheduled this week'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 3, gap: 2 }}>
              {(['week', 'month'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                    background: viewMode === v ? '#fff' : 'transparent',
                    color: viewMode === v ? '#7c3aed' : '#94a3b8',
                    boxShadow: viewMode === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {v === 'week' ? <><Calendar size={13} /> Week</> : <><List size={13} /> Month</>}
                </button>
              ))}
            </div>

            {/* Week / Month navigator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 10, padding: '4px 8px', border: '1.5px solid #e2e8f0' }}>
              {viewMode === 'week' ? (
                <>
                  <button onClick={() => setWeekStart(d => addDays(d, -7))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4, borderRadius: 6 }}>
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', minWidth: 150, textAlign: 'center' }}>
                    {fmtDate(weekStart)} – {fmtDate(addDays(weekStart, 6))}
                  </span>
                  <button onClick={() => setWeekStart(d => addDays(d, 7))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4, borderRadius: 6 }}>
                    <ChevronRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4, borderRadius: 6 }}>
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', minWidth: 150, textAlign: 'center' }}>
                    {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4, borderRadius: 6 }}>
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => { setEditPost(null); setShowModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}
            >
              <Plus size={15} /> Schedule Post
            </button>
          </div>
        </div>

        {/* ── Two-column layout: Calendar + Sidebar ──────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 20, alignItems: 'start' }}>

          {/* LEFT COLUMN — calendar (month or week) + post queue */}
          <div>

          {/* ── Month Grid ────────────────────────────────────────────────── */}
          {viewMode === 'month' && (
            <div style={{ marginBottom: 24 }}>
              {/* Day-of-week headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 6 }}>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>
                ))}
              </div>
              {/* Weeks */}
              {getMonthGrid(monthDate).map((week, wi) => (
                <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 6 }}>
                  {week.map((day, di) => {
                    const isCurrentMonth = day.getMonth() === monthDate.getMonth();
                    const isToday = isSameDay(day, today);
                    const dayPosts = getPostsForDay(day);
                    return (
                      <div key={di} style={{
                        background: isToday ? '#faf5ff' : '#fff',
                        borderRadius: 10,
                        border: isToday ? '2px solid #7c3aed' : '1.5px solid #f1f0ff',
                        padding: '6px 8px', minHeight: 72,
                        opacity: isCurrentMonth ? 1 : 0.35,
                        cursor: 'default',
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#7c3aed' : '#64748b', marginBottom: 4 }}>
                          {day.getDate()}
                        </div>
                        {loading ? null : dayPosts.slice(0, 2).map(post => {
                          const p = getPlatform(post.platforms[0] ?? 'instagram');
                          return (
                            <div key={post.id}
                              onClick={() => { setEditPost(post); setShowModal(true); }}
                              style={{ background: p.bg, borderRadius: 4, padding: '2px 5px', marginBottom: 2, cursor: 'pointer', borderLeft: `2px solid ${p.color}` }}
                            >
                              <div style={{ fontSize: 9, color: '#334155', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {post.content.slice(0, 22)}
                              </div>
                            </div>
                          );
                        })}
                        {dayPosts.length > 2 && (
                          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>+{dayPosts.length - 2} more</div>
                        )}
                        {dayPosts.length === 0 && isCurrentMonth && (
                          <button
                            onClick={() => { setEditPost(null); setShowModal(true); }}
                            style={{ display: 'none', width: '100%', background: 'none', border: '1px dashed #e2e8f0', borderRadius: 4, padding: '2px', cursor: 'pointer', fontSize: 9, color: '#cbd5e1' }}
                            className="month-add-btn"
                          >+</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── Calendar Grid (Week View) ──────────────────────────────────── */}
          {viewMode === 'week' && <div>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 8 }}>
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, today);
                return (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#7c3aed' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{DAY_NAMES[i]}</div>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', margin: '4px auto 0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                      background: isToday ? '#7c3aed' : 'transparent',
                      color: isToday ? '#fff' : '#475569',
                    }}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
                {[0,1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ background: '#f8f7ff', borderRadius: 12, height: 200, animation: 'pulse 1.5s ease-in-out infinite' }}>
                    <style>{`@keyframes pulse{0%{opacity:0.6}50%{opacity:1}100%{opacity:0.6}}`}</style>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
                {weekDays.map((day, i) => {
                  const dayPosts = getPostsForDay(day);
                  const isToday  = isSameDay(day, today);
                  return (
                    <div
                      key={i}
                      className="day-col"
                      style={{
                        background: '#fff', borderRadius: 14, padding: '10px 8px', minHeight: 180,
                        border: isToday ? '2px solid #7c3aed' : '1.5px solid #f1f0ff',
                        boxShadow: isToday ? '0 0 0 3px #ede9fe' : '0 2px 8px rgba(0,0,0,0.04)',
                        position: 'relative',
                      }}
                    >
                      {dayPosts.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 120 }}>
                          <button
                            className="add-btn"
                            onClick={() => { setEditPost(null); setShowModal(true); }}
                            style={{ opacity: 0, width: 32, height: 32, borderRadius: '50%', background: '#f5f3ff', border: '1.5px dashed #c4b5fd', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', transition: 'opacity 0.2s' }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {dayPosts.map(post => {
                            const platform = post.platforms[0] ?? 'instagram';
                            const p = getPlatform(platform);
                            return (
                              <div
                                key={post.id}
                                className="post-card"
                                style={{ background: p.bg, borderRadius: 8, padding: '7px 8px', cursor: 'pointer', transition: 'all 0.15s', borderLeft: `3px solid ${p.color}` }}
                                onClick={() => { setEditPost(post); setShowModal(true); }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                                  <p.Icon size={10} color={p.color} />
                                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                                    {post.scheduled_at ? fmtTime(post.scheduled_at) : 'Draft'}
                                  </span>
                                </div>
                                <p style={{ margin: 0, fontSize: 10, color: '#334155', fontWeight: 500, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                  {post.content.slice(0, 50)}{post.content.length > 50 ? '…' : ''}
                                </p>
                                {post.platforms.length > 1 && (
                                  <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                                    {post.platforms.slice(1).map(pk => {
                                      const pp = getPlatform(pk);
                                      return <pp.Icon key={pk} size={9} color={pp.color} />;
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <button
                            onClick={() => { setEditPost(null); setShowModal(true); }}
                            style={{ width: '100%', padding: '5px', background: 'none', border: '1px dashed #e2e8f0', borderRadius: 7, cursor: 'pointer', color: '#cbd5e1', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>}

            {/* ── Post Queue Table ─────────────────────────────────────────── */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f0ff', overflow: 'hidden', marginTop: 24 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f0ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Post Queue</h3>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{posts.length} total posts</span>
              </div>

              {posts.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>No posts scheduled this week</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Schedule your first post to get started</div>
                  <button
                    onClick={() => { setEditPost(null); setShowModal(true); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Plus size={14} /> Schedule your first post →
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fafaf9' }}>
                        {['Platform', 'Content', 'Scheduled', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post, idx) => {
                        const platform = post.platforms[0] ?? 'instagram';
                        const p = getPlatform(platform);
                        const st = STATUS_STYLES[post.status] ?? STATUS_STYLES.draft;
                        return (
                          <tr key={post.id} style={{ borderTop: '1px solid #f8f7ff', background: idx % 2 === 0 ? '#fff' : '#fafaf9' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <p.Icon size={13} color={p.color} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{p.label}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', maxWidth: 260 }}>
                              <span style={{ fontSize: 13, color: '#475569', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {post.content}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: 12, color: '#64748b' }}>
                                {post.scheduled_at
                                  ? new Date(post.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                                  : '—'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: st.bg, color: st.color }}>
                                {st.label}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="action-btn"
                                  onClick={() => { setEditPost(post); setShowModal(true); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer', fontWeight: 600, transition: 'background 0.15s' }}
                                >
                                  <Pencil size={11} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(post.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                                >
                                  <Trash2 size={11} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>{/* end LEFT COLUMN */}

          {/* ── Right Sidebar ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Best times card */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f0ff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <Sparkles size={14} color="#7c3aed" />
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Best Times to Post</h4>
              </div>
              {[
                { time: '6:00 – 8:00 PM', days: 'Mon–Fri', boost: '3× reach',      color: '#7c3aed' },
                { time: '12:00 – 1:00 PM', days: 'Tue–Thu', boost: '2.4× saves',  color: '#0ea5e9' },
                { time: '9:00 – 11:00 AM', days: 'Weekend',  boost: '1.8× clicks', color: '#10b981' },
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px solid #f8f7ff' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: t.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={14} color={t.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{t.time}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.days}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.color, marginTop: 2 }}>{t.boost}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f0ff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>This Week</h4>
              {[
                { label: 'Scheduled', count: posts.filter(p => p.status === 'scheduled').length,  color: '#3b82f6' },
                { label: 'Drafts',    count: posts.filter(p => p.status === 'draft').length,       color: '#94a3b8' },
                { label: 'Published', count: posts.filter(p => p.status === 'published').length,  color: '#22c55e' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8f7ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{s.count}</span>
                </div>
              ))}
            </div>

            {/* Platform breakdown */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f0ff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>By Platform</h4>
              {PLATFORMS.slice(0, 4).map(p => {
                const count = posts.filter(post => post.platforms.includes(p.key)).length;
                if (count === 0) return null;
                return (
                  <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <p.Icon size={12} color={p.color} />
                    </div>
                    <span style={{ flex: 1, fontSize: 12, color: '#64748b', fontWeight: 500 }}>{p.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <ScheduleModal
          onClose={() => { setShowModal(false); setEditPost(null); }}
          onSaved={handleSaved}
          editPost={editPost}
        />
      )}
    </>
  );
}
