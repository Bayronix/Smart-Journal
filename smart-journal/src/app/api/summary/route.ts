import { NextRequest, NextResponse } from 'next/server';
import { startOfWeek } from 'date-fns';
import type { JournalEntry, WeeklySummary, Mood } from '@/types';

function localSummary(entries: JournalEntry[]): WeeklySummary {
  const analyzed = entries.filter((e) => e.analysis);
  const moodCounts: Record<string, number> = {};
  let totalStress = 0;
  const topicCounts: Record<string, number> = {};

  for (const e of analyzed) {
    const mood = e.analysis!.mood;
    moodCounts[mood] = (moodCounts[mood] ?? 0) + 1;
    totalStress += e.analysis!.stressLevel;
    for (const t of e.analysis!.keyTopics) {
      topicCounts[t] = (topicCounts[t] ?? 0) + 1;
    }
  }

  const dominantMood: Mood = analyzed.length
    ? (Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0] as Mood)
    : 'neutral';

  const avgStressLevel = analyzed.length ? Math.round(totalStress / analyzed.length) : 5;

  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

  const moodLabel: Record<string, string> = {
    happy: 'happiness and positivity', sad: 'some sadness and difficulty',
    anxious: 'stress and anxiety', motivated: 'motivation and drive',
    frustrated: 'frustration and tension', grateful: 'gratitude and appreciation',
    excited: 'excitement and energy', neutral: 'calm and balance',
  };

  const stressNote = avgStressLevel <= 3
    ? 'Stress levels were low — you managed your energy well this week.'
    : avgStressLevel <= 6
    ? 'Stress was moderate — some pressure but within a manageable range.'
    : 'Stress levels were elevated — consider what you can simplify or delegate.';

  const topicsNote = topTopics.length
    ? `Your main themes were: ${topTopics.slice(0, 3).join(', ')}.`
    : 'You explored a variety of personal topics.';

  const summary = `This week your journal reflected a dominant feeling of ${moodLabel[dominantMood] ?? dominantMood}. ${stressNote} ${topicsNote} Keep writing — regular journaling builds self-awareness and emotional resilience over time.`;

  return {
    weekStart: startOfWeek(new Date()).toISOString(),
    summary,
    dominantMood,
    avgStressLevel,
    topTopics: topTopics.length ? topTopics : ['personal reflection'],
    generatedAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const { entries } = await request.json() as { entries: JournalEntry[] };

    if (!entries?.length) {
      return NextResponse.json({ error: 'No entries provided' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey && apiKey.startsWith('sk-ant')) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey });
        const entriesText = entries.slice(0, 10).map((e) =>
          `Date: ${e.createdAt.slice(0, 10)}\nTitle: ${e.title}\nContent: ${e.content}\nMood: ${e.analysis?.mood ?? 'unknown'}`
        ).join('\n\n---\n\n');

        const message = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Write a weekly journal summary. Return JSON with: summary (3-4 warm sentences), dominantMood (happy|sad|anxious|neutral|motivated|frustrated|grateful|excited), avgStressLevel (1-10), topTopics (array of 3-5 themes).\n\n${entriesText}\n\nReturn ONLY valid JSON.`,
          }],
        });
        const text = message.content[0].type === 'text' ? message.content[0].text : '';
        const parsed = JSON.parse(text.trim());
        return NextResponse.json({ summary: { ...parsed, weekStart: startOfWeek(new Date()).toISOString(), generatedAt: new Date().toISOString() } });
      } catch {
        // fall through to local
      }
    }

    return NextResponse.json({ summary: localSummary(entries) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/summary]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
