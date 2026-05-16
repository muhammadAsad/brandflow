import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const DEMO_REPLIES = [
  "Thanks for reaching out! I'd love to help. Could you share a bit more detail so I can give you the best answer?",
  "Hi! Great to hear from you 😊 Let me look into that and get back to you shortly.",
  "That's a great question! Here's what I'd suggest — feel free to reach out if you need anything else.",
  "Thanks for your message! We really appreciate your interest. I'll have someone from our team follow up with you soon.",
  "Absolutely! We'd love to set up a quick call to walk you through everything. What time works best for you?",
];

interface MessagePayload {
  direction: 'inbound' | 'outbound';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, platform } = body as { messages: MessagePayload[]; platform: string };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_key_here') {
      return NextResponse.json({ reply: DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)] });
    }

    const client = new Anthropic({ apiKey });

    const history = (messages ?? []).slice(-6).map((m: MessagePayload) =>
      `${m.direction === 'inbound' ? 'Customer' : 'You'}: ${m.content}`
    ).join('\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `You are a professional social media manager. Write a helpful, friendly reply to this ${platform} conversation. Keep it concise (under 120 words), warm, and on-brand. Output only the reply text with no prefix or quotes.

Conversation:
${history || 'No previous messages.'}`,
      }],
    });

    const reply = response.content[0].type === 'text'
      ? response.content[0].text
      : DEMO_REPLIES[0];

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)] });
  }
}
