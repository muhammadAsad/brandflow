import { createAdminClient } from './supabase-admin';

const ALL_FLAGS = [
  'social_planner', 'ai_insights', 'automation', 'crm_contacts',
  'analytics_advanced', 'conversations', 'api_access', 'white_label',
] as const;

export type FeatureKey = typeof ALL_FLAGS[number];

export async function getUserFeatures(userId: string): Promise<Record<FeatureKey, boolean>> {
  const result = {} as Record<FeatureKey, boolean>;

  // Try Upstash Redis cache first (5-minute TTL)
  try {
    const { Redis } = await import('@upstash/redis');
    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token && !url.startsWith('your_')) {
      const redis = new Redis({ url, token });
      const cached = await redis.get<Record<FeatureKey, boolean>>(`features:${userId}`);
      if (cached) return cached;
    }
  } catch { /* Redis not available */ }

  // Query Supabase RPC has_feature for each flag
  try {
    const db = createAdminClient();
    await Promise.all(
      ALL_FLAGS.map(async (key) => {
        const { data } = await db.rpc('has_feature', { p_user_id: userId, p_feature_key: key });
        result[key] = data === true;
      })
    );

    // Cache result
    try {
      const { Redis } = await import('@upstash/redis');
      const url   = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (url && token && !url.startsWith('your_')) {
        const redis = new Redis({ url, token });
        await redis.set(`features:${userId}`, result, { ex: 300 });
      }
    } catch { /* ignore */ }

    return result;
  } catch {
    // Fallback: all features enabled (fail open for UX)
    ALL_FLAGS.forEach(k => { result[k] = true; });
    return result;
  }
}

export async function invalidateUserFeatures(userId: string): Promise<void> {
  try {
    const { Redis } = await import('@upstash/redis');
    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token && !url.startsWith('your_')) {
      const redis = new Redis({ url, token });
      await redis.del(`features:${userId}`);
    }
  } catch { /* ignore */ }
}
