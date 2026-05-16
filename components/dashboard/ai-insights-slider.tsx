'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export interface Insight {
  id: string;
  title: string;
  description: string;
  insight_type: string;
}

const SLIDE_COLORS = ['#7c3aed', '#0ea5e9', '#f59e0b'];

export function AIInsightsSlider({ insights }: { insights: Insight[] }) {
  const [slide, setSlide] = useState(0);
  const ins = insights[slide];
  const color = SLIDE_COLORS[slide % SLIDE_COLORS.length];

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f0ff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} color="#7c3aed" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>AI Insights</h3>
        </div>
        <button style={{ background: 'none', border: 'none', fontSize: 12, color: '#7c3aed', cursor: 'pointer', fontWeight: 600 }}>View all</button>
      </div>

      {!ins ? (
        <div style={{ background: 'linear-gradient(135deg,#7c3aeddd,#7c3aed99)', borderRadius: 14, padding: '18px 20px', color: '#fff', minHeight: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Sparkles size={22} style={{ marginBottom: 8, opacity: 0.7 }} />
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>No insights yet</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>AI insights will appear once your social accounts are connected</div>
        </div>
      ) : (
        <div style={{
          background: `linear-gradient(135deg, ${color}dd, ${color}99)`,
          borderRadius: 14,
          padding: '18px 20px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 110,
          transition: 'background 0.4s ease',
        }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', left: -10, bottom: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, marginBottom: 6, position: 'relative' }}>{ins.title}</div>
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 16, lineHeight: 1.5, position: 'relative' }}>{ins.description}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <button style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', fontSize: 12, padding: '5px 14px', borderRadius: 20, cursor: 'pointer', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
              See full report →
            </button>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {insights.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setSlide(i)}
                  style={{ width: i === slide ? 20 : 6, height: 6, borderRadius: 3, background: i === slide ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
