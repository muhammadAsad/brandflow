import { Suspense } from 'react';
import { Eye, Heart, Target, DollarSign, TrendingUp, MessageCircle, Crown, Globe } from 'lucide-react';
import { OrbitSphere } from '@/components/dashboard/orbit-sphere';
import { ReachTrendChart } from '@/components/dashboard/reach-trend-chart';
import { TasksList } from '@/components/dashboard/tasks-list';
import { AIInsightsSlider } from '@/components/dashboard/ai-insights-slider';
import { AudiencePanel, TopPerformingPanel } from '@/components/dashboard/bottom-panels';
import { InstagramIcon, LinkedinIcon, FacebookIcon, YoutubeIcon, TikTokIcon, WhatsAppIcon } from '@/components/ui/platform-icons';
import { createClient } from '@/lib/supabase-server';
import type { Task } from '@/components/dashboard/tasks-list';
import type { Insight } from '@/components/dashboard/ai-insights-slider';
import type { FC } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats { reach: number; engagement: number; conversions: number; }
interface IconProps { size?: number; color?: string; }

// ── Demo fallbacks ─────────────────────────────────────────────────────────────

const DEMO_TASKS: Task[] = [
  { id: '1', title: 'Schedule Instagram campaign',  due_at: new Date(Date.now() + 2*3600000).toISOString(), priority: 'urgent', completed_at: null },
  { id: '2', title: 'Reply to 15 unread messages',  due_at: new Date(Date.now() + 4*3600000).toISOString(), priority: 'high',   completed_at: null },
  { id: '3', title: 'Review new leads',             due_at: new Date(Date.now() + 6*3600000).toISOString(), priority: 'high',   completed_at: null },
  { id: '4', title: 'Approve content calendar',     due_at: new Date(Date.now() + 24*3600000).toISOString(), priority: 'medium', completed_at: null },
  { id: '5', title: 'Analyze campaign performance', due_at: new Date(Date.now() + 24*3600000).toISOString(), priority: 'medium', completed_at: null },
];

const DEMO_INSIGHTS: Insight[] = [
  { id: '1', title: 'Your engagement is 24% higher than last week! 🎉', description: 'Best performing channel: Instagram. Your recent reels are driving exceptional reach.', insight_type: 'performance' },
  { id: '2', title: 'Best time to post: 6–8 PM weekdays',               description: 'Posts published between 6–8 PM receive 3× more engagement based on your last 30 days.', insight_type: 'audience' },
  { id: '3', title: 'TikTok videos under 30s get 2× completions',        description: 'Optimize your short-form content for higher completion rates and better algorithm reach.', insight_type: 'content' },
];

const DEMO_CONVS = [
  { name: 'Jane Cooper',        msg: 'Interested in boosting our brand visibility...', time: '2m ago',  platform: 'instagram' },
  { name: 'Brooklyn Simmons',   msg: 'Can you share more about your services?',        time: '15m ago', platform: 'facebook'  },
  { name: 'Dianne Russell',     msg: 'Thanks! That helps a lot.',                       time: '1h ago',  platform: 'whatsapp'  },
  { name: 'Cameron Williamson', msg: 'When can we schedule a demo call?',              time: '2h ago',  platform: 'linkedin'  },
];

const TOP_CONTENT = [
  { img: 'https://picsum.photos/160/160?random=1', platform: 'instagram', likes: '12.4K', type: 'Reel'    },
  { img: 'https://picsum.photos/160/160?random=2', platform: 'tiktok',    likes: '8.7K',  type: 'Video'   },
  { img: 'https://picsum.photos/160/160?random=3', platform: 'linkedin',  likes: '6.3K',  type: 'Article' },
];

// ── Data fetch ────────────────────────────────────────────────────────────────

async function fetchDashboardData() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { stats: null, tasks: null, insights: null, conversations: null };

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const [snapRes, tasksRes, insightsRes, convsRes] = await Promise.all([
      supabase
        .from('analytics_snapshots')
        .select('reach, engagement, clicks')
        .eq('user_id', user.id)
        .gte('snapshot_date', thirtyDaysAgo),
      supabase
        .from('tasks')
        .select('id, title, due_at, priority, completed_at')
        .eq('user_id', user.id)
        .order('due_at', { ascending: true })
        .limit(5),
      supabase
        .from('ai_insights')
        .select('id, title, description, insight_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('conversations')
        .select('id, contact_id, platform, last_message, last_message_at, unread_count')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false })
        .limit(4),
    ]);

    const snaps = snapRes.data ?? [];
    const stats: Stats = {
      reach:       snaps.reduce((s, r) => s + (r.reach ?? 0), 0),
      engagement:  snaps.reduce((s, r) => s + (r.engagement ?? 0), 0),
      conversions: snaps.reduce((s, r) => s + (r.clicks ?? 0), 0),
    };

    return {
      stats: snaps.length > 0 ? stats : null,
      tasks: tasksRes.data && tasksRes.data.length > 0 ? tasksRes.data as Task[] : null,
      insights: insightsRes.data && insightsRes.data.length > 0 ? insightsRes.data as Insight[] : null,
      conversations: convsRes.data && convsRes.data.length > 0 ? convsRes.data : null,
    };
  } catch {
    return { stats: null, tasks: null, insights: null, conversations: null };
  }
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

// ── Sub-components ────────────────────────────────────────────────────────────

const PLATFORM_MAP: Record<string, { color: string; Icon: FC<IconProps> }> = {
  instagram: { color: '#e1306c', Icon: InstagramIcon },
  facebook:  { color: '#1877f2', Icon: FacebookIcon  },
  linkedin:  { color: '#0077b5', Icon: LinkedinIcon  },
  tiktok:    { color: '#010101', Icon: TikTokIcon    },
  whatsapp:  { color: '#25d366', Icon: WhatsAppIcon  },
  youtube:   { color: '#ff0000', Icon: YoutubeIcon   },
};

function PlatformIcon({ platform, size = 14 }: { platform: string; size?: number }) {
  const p = PLATFORM_MAP[platform] ?? { color: '#999', Icon: Globe };
  return <p.Icon size={size} color={p.color} />;
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];
  const color = COLORS[name.length % COLORS.length];
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color + '18', color, fontWeight: 700, fontSize: size * 0.35, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${color}28` }}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, change, icon: Icon, color }: { label: string; value: string; change: string; icon: FC<{ size?: number; color?: string }>; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f0ff', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{label}</div>
        <div style={{ color: '#0f172a', fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
      </div>
      <div style={{ background: '#ecfdf5', color: '#059669', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <TrendingUp size={11} /> {change}
      </div>
    </div>
  );
}


function SkeletonDashboard() {
  const pulse = { animation: 'pulse 1.5s ease-in-out infinite', background: 'linear-gradient(90deg,#f1f0ff 25%,#e8e6ff 50%,#f1f0ff 75%)', backgroundSize: '200% 100%' };
  return (
    <>
      <style>{`@keyframes pulse{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ padding: '0 28px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #f1f0ff', height: 84 }}>
              <div style={{ ...pulse, borderRadius: 8, height: 14, width: '60%', marginBottom: 10 }} />
              <div style={{ ...pulse, borderRadius: 8, height: 22, width: '40%' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ ...pulse, borderRadius: 18, height: 420 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ ...pulse, borderRadius: 16, height: 280 }} />
              <div style={{ ...pulse, borderRadius: 16, height: 280 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...pulse, borderRadius: 16, height: 180 }} />
            <div style={{ ...pulse, borderRadius: 16, height: 260 }} />
            <div style={{ ...pulse, borderRadius: 16, height: 260 }} />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

async function DashboardContent() {
  const { stats, tasks, insights, conversations } = await fetchDashboardData();

  const displayStats = [
    {
      label: 'Total Reach',
      value: stats ? fmtNum(stats.reach) : '2.4M',
      change: '+18%',
      icon: Eye,
      color: '#7c3aed',
    },
    {
      label: 'Engagement',
      value: stats ? fmtNum(stats.engagement) : '128K',
      change: '+24%',
      icon: Heart,
      color: '#0ea5e9',
    },
    {
      label: 'Conversions',
      value: stats ? fmtNum(stats.conversions) : '3.6K',
      change: '+16%',
      icon: Target,
      color: '#10b981',
    },
    {
      label: 'Revenue',
      value: '$86.7K',
      change: '+22%',
      icon: DollarSign,
      color: '#f59e0b',
    },
  ];

  const displayTasks = tasks ?? DEMO_TASKS;
  const displayInsights = insights ?? DEMO_INSIGHTS;
  const displayConvs = conversations
    ? conversations.map((c: { platform: string; last_message: string | null; last_message_at: string | null }) => ({
        name: 'Contact',
        msg: c.last_message ?? '—',
        time: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        platform: c.platform,
      }))
    : DEMO_CONVS;

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .dash-fade { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div className="dash-fade" style={{ padding: '0 28px 28px' }}>

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          {displayStats.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* ── Two-column layout: flex row so each column fills naturally ─── */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* ── Left column — orbit + audience overview ──────────────────── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Panel A — Orbit sphere + Reach trend */}
            <div style={{ background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 2px 16px rgba(124,58,237,0.07)', border: '1px solid #f1f0ff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, #f5f3ff 0%, #fff 65%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <OrbitSphere />
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Reach Trend</span>
                    <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, background: '#f5f3ff', padding: '3px 10px', borderRadius: 20 }}>↑ 18% this month</span>
                  </div>
                  <ReachTrendChart />
                </div>
              </div>
            </div>

            {/* Audience Overview — KPIs + geo map + growth chart */}
            <AudiencePanel />
          </div>

          {/* ── Right column — insights + tasks + conversations + top content */}
          <div style={{ width: 350, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* AI Insights slider */}
            <AIInsightsSlider insights={displayInsights} />

            {/* Tasks */}
            <TasksList initial={displayTasks} />

            {/* Conversations */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f0ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Recent Conversations</h3>
                <button style={{ background: 'none', border: 'none', fontSize: 12, color: '#7c3aed', cursor: 'pointer', fontWeight: 600 }}>View all</button>
              </div>
              {displayConvs.map((conv, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < displayConvs.length - 1 ? '1px solid #f8f7ff' : 'none' }}>
                  <Avatar name={conv.name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{conv.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.msg}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{conv.time}</div>
                    <PlatformIcon platform={conv.platform} size={14} />
                  </div>
                </div>
              ))}
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <button style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: 20, padding: '7px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <MessageCircle size={12} />
                  12 unread conversations
                </button>
              </div>
            </div>

            {/* Top Performing Content */}
            <TopPerformingPanel />
          </div>
        </div>
      </div>

      {/* ── Footer bar ──────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderTop: '1px solid #ede9fe', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Trusted by growth-focused teams</span>
        {['Loom', 'ClickUp', 'Notion', 'Zapier', 'HubSpot'].map(b => (
          <span key={b} style={{ fontSize: 12, fontWeight: 700, color: '#c7c6d8', letterSpacing: '0.3px' }}>{b}</span>
        ))}
      </div>
    </>
  );
}

export default function CommandCenterPage() {
  return (
    <Suspense fallback={<SkeletonDashboard />}>
      <DashboardContent />
    </Suspense>
  );
}
