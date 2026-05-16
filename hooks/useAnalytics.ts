'use client';

import { useEffect, useState } from 'react';
import type { AnalyticsData } from '@/types';

export function useAnalytics(platform?: string) {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = platform ? `/api/analytics?platform=${platform}` : '/api/analytics';
    fetch(url)
      .then((r) => r.json())
      .then((d) => setData(d.data ?? []))
      .finally(() => setLoading(false));
  }, [platform]);

  return { data, loading };
}
