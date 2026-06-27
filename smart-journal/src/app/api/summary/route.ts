import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { startOfWeek } from 'date-fns';
import type { JournalEntry, WeeklySummary } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { entries } = await request.json() as { entries: JournalEntry[] };

    if (!entries?.length) {
      return NextResponse.json({ error: 'No entries provided' }, { status: 400 });
    }

    const recentEntries = entries.slice(0, 10);
    const entriesText = recentEntries
      .map(
        (e) =>
          `Date: ${e.createdAt.slice(0, 10)}\nTitle: ${e.title}\nContent: ${e.content}\nMood: ${e.analysis?.mood ?? 'unknown'}\nStress: ${e.analysis?.stressLevel ?? 'unknown'}`
      )
      .join('\n\n---\n\n');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a supportive journal therapist. Based on these recent journal entries, write a thoughtful weekly summary. Return a JSON object with these exact fields:

- summary: 3-4 sentences of warm, insightful summary of the week's emotional journey
- dominantMood: the most prominent mood from: happy | sad | anxious | neutral | motivated | frustrated | grateful | excited
- avgStressLevel: rounded average stress level (1-10)
- topTopics: array of 3-5 recurring themes or topics

Journal Entries:
${entriesText}

Return ONLY valid JSON. No markdown, no code fences.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text.trim());

    const summary: WeeklySummary = {
      ...parsed,
      weekStart: startOfWeek(new Date()).toISOString(),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/summary]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
