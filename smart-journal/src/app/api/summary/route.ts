import { NextRequest, NextResponse } from 'next/server';
import { startOfWeek } from 'date-fns';
import type { JournalEntry, WeeklySummary, Mood } from '@/types';
import { groqComplete, hasGroqKey } from '@/lib/groq';

const MAX_BODY_BYTES = 200_000;
const ALLOWED_LANGS = new Set(['en', 'uk', 'pl']);

const LANG_NAME: Record<string, string> = {
  en: 'English',
  uk: 'Ukrainian',
  pl: 'Polish',
};

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

function buildSummaryPrompt(entriesText: string, lang: string): string {
  const language = LANG_NAME[lang] ?? 'Ukrainian';
  return `You are a warm, supportive journal therapist. Based on these journal entries, write a thoughtful weekly summary in ${language}.

Return a JSON object:
- summary: 3-4 warm, insightful sentences about the week's emotional journey, written in ${language}
- dominantMood: happy|sad|anxious|neutral|motivated|frustrated|grateful|excited
- avgStressLevel: rounded average stress 1-10 (be accurate)
- topTopics: array of 3-5 recurring themes in ${language}

Journal entries:
${entriesText}

Return ONLY valid JSON.`;
}

export async function POST(request: NextRequest) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  try {
    const { entries, lang: rawLang } = await request.json() as {
      entries: JournalEntry[];
      lang?: string;
    };

    if (!entries?.length) {
      return NextResponse.json({ error: 'No entries provided' }, { status: 400 });
    }

    const lang = ALLOWED_LANGS.has(rawLang ?? '') ? rawLang! : 'uk';

    const entriesText = entries.slice(0, 10).map((e) =>
      `[${e.createdAt.slice(0, 10)}] ${e.title.slice(0, 100)}: ${e.content.slice(0, 300)} (mood: ${e.analysis?.mood ?? '?'}, stress: ${e.analysis?.stressLevel ?? '?'})`
    ).join('\n\n');

    // 1️⃣ Try Groq via shared singleton
    if (hasGroqKey()) {
      try {
        const text = await groqComplete({
          messages: [{ role: 'user', content: buildSummaryPrompt(entriesText, lang) }],
          maxTokens: 1024,
          temperature: 0.5,
        });
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            summary: { ...parsed, weekStart: startOfWeek(new Date()).toISOString(), generatedAt: new Date().toISOString(), lang },
          });
        }
      } catch {
        // fall through to Anthropic
      }
    }

    // 2️⃣ Try Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey?.startsWith('sk-ant')) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: anthropicKey });
        const message = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{ role: 'user', content: buildSummaryPrompt(entriesText, lang) }],
        });
        const text = message.content[0].type === 'text' ? message.content[0].text : '';
        const parsed = JSON.parse(text.trim());
        return NextResponse.json({
          summary: { ...parsed, weekStart: startOfWeek(new Date()).toISOString(), generatedAt: new Date().toISOString(), lang },
        });
      } catch {
        // fall through
      }
    }

    // 3️⃣ Local fallback
    return NextResponse.json({ summary: localSummary(entries) });

  } catch (error) {
    console.error('[/api/summary]', error);
    return NextResponse.json({ error: 'Summary generation failed. Please try again.' }, { status: 500 });
  }
}
