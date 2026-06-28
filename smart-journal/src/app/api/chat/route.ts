import { NextRequest, NextResponse } from 'next/server';
import { hasGroqKey, groqStream } from '@/lib/groq';
import type { JournalEntry } from '@/types';

const LANG_NAME: Record<string, string> = {
  en: 'English',
  uk: 'Ukrainian',
  pl: 'Polish',
};

function buildSystemPrompt(entries: JournalEntry[], lang: string): string {
  const language = LANG_NAME[lang] ?? 'Ukrainian';
  const recentEntries = entries.slice(0, 15);
  const journalContext = recentEntries.length
    ? recentEntries.map((e) => {
        const mood = e.analysis ? ` [mood: ${e.analysis.mood}, stress: ${e.analysis.stressLevel}/10]` : '';
        return `[${e.createdAt.slice(0, 10)}] "${e.title || 'Untitled'}":${mood}\n${e.content.slice(0, 400)}`;
      }).join('\n\n---\n\n')
    : '(no journal entries yet)';

  return `You are a warm, intelligent personal journal assistant named "Aria". You have full access to the user's private journal entries and can deeply understand their emotional patterns, recurring themes, and personal growth over time.

Your role:
- Answer questions about their journal with specific references to actual entries
- Identify emotional patterns, recurring themes, and trends
- Offer psychological insights and gentle advice
- Help them reflect on past experiences
- Be conversational, warm, and genuinely caring
- Always respond in ${language}, regardless of what language the journal entries are written in

The user's journal entries (most recent first):
${journalContext}

Guidelines:
- Always reference specific entries when relevant ("In your entry from March 5th, you mentioned...")
- Be honest but empathetic about patterns you notice
- Suggest what to reflect on or actions to take when appropriate
- Keep responses focused and not too long unless the user asks for detail`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, entries, lang = 'uk' } = await request.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      entries: JournalEntry[];
      lang?: string;
    };

    if (!hasGroqKey()) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured. Add it in your environment variables.' },
        { status: 503 }
      );
    }

    const systemPrompt = buildSystemPrompt(entries, lang);

    const stream = await groqStream({
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      maxTokens: 1024,
      temperature: 0.7,
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/chat]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
