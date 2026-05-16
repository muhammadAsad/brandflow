'use client';

import { useEffect, useState } from 'react';
import type { SocialAccount } from '@/types';

export function useSocialAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/social/connect')
      .then((r) => r.json())
      .then((data) => setAccounts(data.accounts ?? []))
      .finally(() => setLoading(false));
  }, []);

  return { accounts, loading };
}
