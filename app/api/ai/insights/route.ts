import Anthropic from '@anthropic-ai/sdk';
import { Redis } from '@upstash/redis';
import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// ── Rate limiter (Upstash Redis) ──────────────────────────────────────────────

function getRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  if (!redis) return { allowed: true, remaining: 20 };
  const day = new Date().toISOString().split('T')[0];
  const key = `rl:ai:insights:${userId}:${day}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 86400);
  return { allowed: count <= 20, remaining: Math.max(0, 20 - count) };
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a social media analytics expert and marketing strategist. You analyze social media performance data and provide specific, actionable insights. Always respond with a JSON object containing: { "title": string, "description": string, "action": string, "metric": string, "change": string }. Be specific with numbers. Be concise — title under 60 characters, description under 120 characters.`;

// ── Demo fallback ─────────────────────────────────────────────────────────────

const DEMO_INSIGHTS: Record<string, { title: string; description: string; action: string; metric: string; change: string }> = {
  performance: {
    title: 'Instagram driving 3× more reach than average',
    description: 'Your Instagram posts outperform all other platforms by 3.2×. Prioritize Instagram for key announcements.',
    action: 'Increase Instagram posting frequency from 4 to 7 posts per week',
    metric: '2.4M total reach',
    change: '+18%',
  },
  content: {
    title: 'Video content generates 5× higher engagement',
    description: 'Reels and TikTok videos are your top performers — static images average 2.1% engagement vs 6.8% for video.',
    action: 'Convert your top 5 performing static posts into short-form videos',
    metric: '6.8% avg video engagement',
    change: '+124%',
  },
  audience: {
    title: '25-34 age group is your fastest-growing segment',
    description: 'The 25-34 demographic grew 28% this month, representing 38% of total followers. Tailor content to this group.',
    action: 'Create content addressing career growth and entrepreneurship for 25-34 audience',
    metric: '38% of audience share',
    change: '+28%',
  },
  campaign: {
    title: 'Summer launch campaign ROI exceeds target by 2.1×',
    description: 'Campaign drove 72K reach at $0.004 per impression — 52% below industry average cost.',
    action: 'Increase budget allocation to Instagram Stories by 30% for next campaign',
    metric: '$0.004 per impression',
    change: '-52% vs benchmark',
  },
};

// ── POST /api/ai/insights ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit check
    const { allowed, remaining } = await checkRateLimit(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Daily AI limit reached (20/day). Resets at midnight UTC.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const type: string = body.type ?? 'performance';
    const context: Record<string, unknown> = body.context ?? {};

    // Fetch last 30 days of analytics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const { data: snapshots } = await supabase
      .from('analytics_snapshots')
      .select('platform, snapshot_date, reach, engagement, impressions, clicks, followers')
      .eq('user_id', user.id)
      .gte('snapshot_date', thirtyDaysAgo)
      .order('snapshot_date', { ascending: false });

    // Compute aggregates from real data (or use demo values)
    const data = snapshots ?? [];
    const totalReach      = data.reduce((s, r) => s + (r.reach ?? 0), 0) || 2_400_000;
    const totalEngagement = data.reduce((s, r) => s + (r.engagement ?? 0), 0) || 128_000;
    const totalImpressions = data.reduce((s, r) => s + (r.impressions ?? 0), 0) || 5_600_000;
    const engRate = totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(2) : '3.4';

    // Top platform by reach
    const platformTotals: Record<string, number> = {};
    data.forEach(r => { platformTotals[r.platform] = (platformTotals[r.platform] ?? 0) + (r.reach ?? 0); });
    const topPlatform = Object.entries(platformTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Instagram';

    // Follower change (first vs last snapshot)
    const sorted = [...data].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
    const firstFollowers = sorted[0]?.followers ?? 87000;
    const lastFollowers  = sorted[sorted.length - 1]?.followers ?? 89200;
    const followerChange = lastFollowers - firstFollowers;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Fallback to demo if no API key
    if (!apiKey || apiKey === 'your_anthropic_key_here') {
      const demo = DEMO_INSIGHTS[type] ?? DEMO_INSIGHTS.performance;
      await saveInsight(supabase, user.id, type, demo);
      return NextResponse.json({ insight: demo, remaining });
    }

    const client = new Anthropic({ apiKey });

    const userPrompt = `Analyze this social media data for the past 30 days:
- Total reach: ${totalReach.toLocaleString()}
- Engagement rate: ${engRate}%
- Top platform: ${topPlatform}
- Followers growth: ${followerChange > 0 ? '+' : ''}${followerChange}
- Best performing post: ${(context.best_post_type as string) ?? 'Video/Reels'}
- Additional context: ${JSON.stringify(context)}

Generate one specific, actionable insight about ${type}.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    let insight: { title: string; description: string; action: string; metric: string; change: string };

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      insight = jsonMatch ? JSON.parse(jsonMatch[0]) : DEMO_INSIGHTS[type] ?? DEMO_INSIGHTS.performance;
    } catch {
      insight = DEMO_INSIGHTS[type] ?? DEMO_INSIGHTS.performance;
    }

    await saveInsight(supabase, user.id, type, insight);
    return NextResponse.json({ insight, remaining }, { headers: { 'X-RateLimit-Remaining': String(remaining) } });

  } catch (err) {
    console.error('AI insights error:', err);
    const fallback = DEMO_INSIGHTS.performance;
    return NextResponse.json({ insight: fallback, remaining: 20 });
  }
}

// GET: fetch saved insights for the current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ insights: [] });
    return NextResponse.json({ insights: data ?? [] });
  } catch {
    return NextResponse.json({ insights: [] });
  }
}

// PATCH: mark insight as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    await supabase.from('ai_insights').update({ is_read: true }).eq('id', id).eq('user_id', user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveInsight(supabase: any, userId: string, type: string, insight: { title: string; description: string; action: string; metric?: string; change?: string }) {
  try {
    await supabase.from('ai_insights').insert({
      user_id: userId,
      title: insight.title,
      description: insight.description,
      insight_type: type,
      action_url: insight.action,
      is_read: false,
    });
  } catch {}
}
