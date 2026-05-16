'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  dismissable: boolean;
}

const TYPE_STYLES = {
  info:    { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', color: '#60a5fa', icon: 'ℹ' },
  success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', color: '#34d399', icon: '✓' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', color: '#fbbf24', icon: '⚠' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  color: '#f87171', icon: '!' },
};

const STORAGE_KEY = 'brandflow_dismissed_announcements';

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveDismissed(ids: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

export function AnnouncementBanner() {
  const [banners, setBanners] = useState<Announcement[]>([]);

  useEffect(() => {
    const dismissed = getDismissed();
    fetch('/api/announcements')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.announcements) {
          setBanners(data.announcements.filter((a: Announcement) => !dismissed.includes(a.id)));
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = (id: string) => {
    const dismissed = getDismissed();
    saveDismissed([...dismissed, id]);
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  if (banners.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 20px 0' }}>
      {banners.map(banner => {
        const s = TYPE_STYLES[banner.type] || TYPE_STYLES.info;
        return (
          <div
            key={banner.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 14px', borderRadius: 8,
              background: s.bg, border: `1px solid ${s.border}`,
            }}
          >
            <span style={{ fontSize: 13, color: s.color, fontWeight: 700, flexShrink: 0 }}>{s.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {banner.title && (
                <span style={{ fontSize: 13, fontWeight: 600, color: s.color, marginRight: 6 }}>{banner.title}:</span>
              )}
              <span style={{ fontSize: 13, color: '#e2e8f0' }}>{banner.message}</span>
            </div>
            {banner.dismissable && (
              <button
                onClick={() => dismiss(banner.id)}
                style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, display: 'flex', alignItems: 'center' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
