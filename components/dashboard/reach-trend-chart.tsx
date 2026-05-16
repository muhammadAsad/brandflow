'use client';

import { TrendingUp } from 'lucide-react';

// Real reach data will be fetched from analytics_snapshots via API.
// Shows a placeholder until social accounts are connected.
export function ReachTrendChart() {
  return (
    <div style={{
      height: 70,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(124,58,237,0.04)',
      borderRadius: 10,
      gap: 8,
      color: '#c4b5fd',
    }}>
      <TrendingUp size={16} />
      <span style={{ fontSize: 12, fontWeight: 500 }}>Connect social accounts to see reach trend</span>
    </div>
  );
}
