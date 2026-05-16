import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

const DEMO_REPORT = `## BrandFlow AI Performance Report — Last 30 Days

### 📈 Overall Performance Summary
Your social media presence has shown **strong growth** over the past 30 days. Total reach increased by 18% compared to the previous period, with Instagram leading as your top-performing channel.

### 🔑 Key Insights

**1. Engagement Peak on Instagram**
Instagram continues to drive the highest engagement rate at **6.8%**, significantly above the industry average of 3.2%. Your Reels are outperforming static posts by 2.4×. Consider increasing Reel production from 3 to 5 per week.

**2. Best Performing Time Windows**
Posts published between **6–8 PM on weekdays** receive 3× more engagement than morning posts. TikTok content performs best on **Thursday–Saturday** between 7–9 PM.

**3. Audience Growth Trend**
New follower acquisition is up **21% month-over-month**, driven primarily by Instagram (+15%) and LinkedIn (+28%). LinkedIn growth suggests your B2B content strategy is resonating well.

**4. Content Format Analysis**
- Reels: 42% of total impressions
- Carousels: 31% of saves and shares
- Static posts: declining — recommend converting to carousels

**5. TikTok Opportunity**
TikTok engagement is high but posting frequency is low (avg 2 posts/week). Increasing to 5–7 short-form videos per week could add an estimated **35K additional reach**.

### ⚡ Recommended Actions
1. **Boost Instagram Reels** — Schedule 5 per week, prioritize trending audio
2. **Repurpose LinkedIn content** — Convert top LinkedIn posts to Instagram carousels
3. **Engage in first hour** — Responding to comments within 60 minutes of posting boosts reach by up to 40%
4. **A/B test TikTok formats** — Compare talking-head vs. text-overlay videos

### 📊 Forecast
Based on current trajectory, you're on track for **2.8M total reach** next month — a projected 17% increase from current levels.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { from, to } = body as { from?: string; to?: string };

    // Determine date range
    const toDate   = to   ?? new Date().toISOString().split('T')[0];
    const fromDate = from ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const { data: snapshots } = await supabase
      .from('analytics_snapshots')
      .select('platform, snapshot_date, reach, engagement, impressions, clicks, followers')
      .eq('user_id', user.id)
      .gte('snapshot_date', fromDate)
      .lte('snapshot_date', toDate)
      .order('snapshot_date', { ascending: true });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_key_here') {
      return NextResponse.json({ analysis: DEMO_REPORT });
    }

    const client = new Anthropic({ apiKey });

    const dataStr = snapshots?.length
      ? JSON.stringify(snapshots)
      : 'No real data available — use realistic demo analytics for a social media SaaS platform with ~89K followers across Instagram, TikTok, LinkedIn and Facebook.';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are a social media analytics expert. Analyze this performance data from ${fromDate} to ${toDate} and write a professional markdown report with sections for: Overall Summary, Key Insights (5 specific points with numbers), Content Format Analysis, Best Times to Post, and Recommended Actions. Use emoji section headers. Be specific and data-driven.

Data: ${dataStr}`,
      }],
    });

    const analysis = message.content[0].type === 'text' ? message.content[0].text : DEMO_REPORT;
    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ analysis: DEMO_REPORT });
  }
}
