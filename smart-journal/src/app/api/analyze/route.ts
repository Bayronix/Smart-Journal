import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { AIAnalysis } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json() as { title: string; content: string };

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a psychologically-informed journal analyst. Analyze the following journal entry and return a JSON object with these exact fields:

- mood: one of exactly these values: happy | sad | anxious | neutral | motivated | frustrated | grateful | excited
- stressLevel: integer from 1 (none) to 10 (extreme)
- keyTopics: array of 3-5 short topic strings (e.g. "work pressure", "family", "self-doubt")
- insights: 2-3 sentences of genuine psychological insight about the writer's emotional state
- advice: 1-2 concrete, actionable sentences of advice

Journal Entry:
Title: ${title || '(untitled)'}
Content: ${content}

Return ONLY a valid JSON object. No markdown, no explanation, no code fences.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const analysis: AIAnalysis = {
      ...(JSON.parse(text.trim()) as Omit<AIAnalysis, 'analyzedAt'>),
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/analyze]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
