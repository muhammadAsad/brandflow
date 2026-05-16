'use client';

import { useState } from 'react';
import { TrendingUp, MessageCircle, Award, Bell, CheckCheck, Trash2, Filter } from 'lucide-react';

interface Notification {
  id: number;
  icon: React.ElementType;
  color: string;
  title: string;
  body: string;
  time: string;
  category: 'analytics' | 'messages' | 'campaigns' | 'system';
  read: boolean;
}

const INITIAL: Notification[] = [
  { id: 1,  icon: TrendingUp,    color: '#10b981', title: 'Milestone reached!',           body: 'Your Instagram account has reached 1,000,000 impressions this month.',    time: '5 minutes ago',  category: 'analytics', read: false },
  { id: 2,  icon: MessageCircle, color: '#0ea5e9', title: '12 new messages',               body: 'You have 12 unread messages in your Conversations inbox.',                time: '12 minutes ago', category: 'messages',  read: false },
  { id: 3,  icon: Award,         color: '#f59e0b', title: "Campaign 'Summer Sale' live",   body: "Your scheduled campaign has gone live and is now reaching your audience.", time: '1 hour ago',     category: 'campaigns', read: false },
  { id: 4,  icon: TrendingUp,    color: '#8b5cf6', title: 'Engagement up 24%',             body: 'Your engagement rate increased by 24% compared to last week.',            time: '3 hours ago',    category: 'analytics', read: true  },
  { id: 5,  icon: Award,         color: '#ec4899', title: 'Post published',                body: "Your post 'Top 5 growth hacks for 2024' was published successfully.",     time: '5 hours ago',    category: 'campaigns', read: true  },
  { id: 6,  icon: MessageCircle, color: '#0ea5e9', title: 'New lead from CRM',             body: 'Jane Cooper has been added to your contacts from the landing page form.',  time: 'Yesterday',      category: 'messages',  read: true  },
  { id: 7,  icon: Bell,          color: '#64748b', title: 'Trial ending in 7 days',        body: 'Your free trial ends in 7 days. Upgrade to keep access to all features.', time: 'Yesterday',      category: 'system',    read: true  },
  { id: 8,  icon: TrendingUp,    color: '#10b981', title: 'Weekly report ready',           body: 'Your weekly analytics report is ready to view.',                         time: '2 days ago',     category: 'analytics', read: true  },
  { id: 9,  icon: Award,         color: '#f59e0b', title: "Campaign 'Brand Awareness' ended", body: 'Your Brand Awareness Q2 campaign ended. View the final performance report.', time: '3 days ago', category: 'campaigns', read: true  },
];

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All', analytics: 'Analytics', messages: 'Messages', campaigns: 'Campaigns', system: 'System',
};

export default function NotificationsPage() {
  const [notifs,    setNotifs]    = useState<Notification[]>(INITIAL);
  const [filter,    setFilter]    = useState<'all' | Notification['category']>('all');
  const [showUnread,setShowUnread]= useState(false);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));

  const markRead = (id: number) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));

  const deleteNotif = (id: number) => setNotifs(n => n.filter(x => x.id !== id));

  const visible = notifs
    .filter(n => filter === 'all' || n.category === filter)
    .filter(n => !showUnread || !n.read);

  return (
    <div style={{ padding: '28px', fontFamily: "'DM Sans','Segoe UI',sans-serif", maxWidth: 720 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Notifications</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f5f3ff', border: '1.5px solid #ede9fe', borderRadius: 10, color: '#7c3aed', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Filter size={13} color="#94a3b8" />
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button key={key}
            onClick={() => setFilter(key as typeof filter)}
            style={{
              padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: filter === key ? '#7c3aed' : '#f1f5f9',
              color:      filter === key ? '#fff'    : '#64748b',
              transition: 'all 0.15s',
            }}
          >{label}</button>
        ))}
        <button
          onClick={() => setShowUnread(v => !v)}
          style={{
            padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: showUnread ? '#fef3c7' : '#f1f5f9',
            color:      showUnread ? '#d97706' : '#64748b',
            marginLeft: 'auto',
          }}
        >
          {showUnread ? '✓ Unread only' : 'Unread only'}
        </button>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8' }}>
            <Bell size={32} color="#cbd5e1" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>No notifications</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>You&apos;re all caught up!</div>
          </div>
        ) : visible.map(n => (
          <div key={n.id}
            onClick={() => markRead(n.id)}
            style={{
              display: 'flex', gap: 14, padding: '14px 18px',
              background: n.read ? '#fff' : '#f8f7ff',
              borderRadius: 14,
              border: `1.5px solid ${n.read ? '#f1f5f9' : '#ede9fe'}`,
              cursor: 'pointer', transition: 'background 0.15s',
              position: 'relative',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = n.read ? '#fafaf9' : '#f3f0ff')}
            onMouseLeave={e => (e.currentTarget.style.background = n.read ? '#fff' : '#f8f7ff')}
          >
            {/* Unread dot */}
            {!n.read && (
              <div style={{ position: 'absolute', top: 16, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#7c3aed' }} />
            )}

            {/* Icon */}
            <div style={{ width: 40, height: 40, borderRadius: 12, background: n.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <n.icon size={18} color={n.color} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: '#0f172a', marginBottom: 2 }}>{n.title}</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>{n.body}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{n.time}</div>
            </div>

            {/* Delete */}
            <button
              onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 4, borderRadius: 6, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
