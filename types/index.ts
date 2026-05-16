export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';
  account_name: string;
  followers: number;
  connected_at: string;
}

export interface Post {
  id: string;
  content: string;
  platforms: SocialAccount['platform'][];
  scheduled_at: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  media_urls: string[];
  analytics: {
    reach: number;
    impressions: number;
    engagement: number;
    clicks: number;
  };
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  reach: number;
  ctr: number;
  start_date: string;
  end_date: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'lead' | 'prospect' | 'customer' | 'churned';
  tags: string[];
  created_at: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  platform: SocialAccount['platform'];
  status: 'open' | 'closed' | 'pending';
  last_message: string;
  unread_count: number;
}

export interface AnalyticsData {
  date: string;
  reach: number;
  engagement: number;
  impressions: number;
  clicks: number;
  platform: SocialAccount['platform'];
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'performance' | 'audience' | 'content' | 'competitor';
  created_at: string;
}
