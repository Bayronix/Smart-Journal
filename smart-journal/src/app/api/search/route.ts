import { NextRequest, NextResponse } from 'next/server';
import type { JournalEntry, SearchResult } from '@/types';
import { localSearch } from '@/lib/search';
import { extractSnippet } from '@/lib/utils';

function buildSearchPrompt(query: string, entryList: string): string {
  return `Search query: "${query}"

Find the most relevant journal entries below. Return a JSON array (top 5 max) with:
- index: [index] number
- relevance: float 0.0-1.0
- reason: one short phrase why it matches

Return ONLY a valid JSON array, nothing else.

Entries:
${entryList}`;
}

export async function POST(request: NextRequest) {
  try {
    const { query, entries } = await request.json() as { query: string; entries: JournalEntry[] };

    if (!query?.trim() || !entries?.length) {
      return NextResponse.json({ results: [] });
    }

    // Local search first — fast and works offline
    const localResults = localSearch(entries, query);
    if (localResults.length > 0) {
      return NextResponse.json({ results: localResults });
    }

    // AI semantic search fallback
    const entryList = entries.slice(0, 30)
      .map((e, i) => `[${i}] ${e.createdAt.slice(0, 10)} | ${e.title}: ${e.content.slice(0, 200)}`)
      .join('\n');

    const groqKey = process.env.GROQ_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // Try Groq (use smaller/faster model for search)
    if (groqKey && groqKey.startsWith('gsk_')) {
      try {
        const { default: Groq } = await import('groq-sdk');
        const groq = new Groq({ apiKey: groqKey });
        const completion = await groq.chat.completions.create({
          model: 'mixtral-8x7b-32768',
          max_tokens: 512,
          temperature: 0.1,
          messages: [{ role: 'user', content: buildSearchPrompt(query, entryList) }],
        });
        const text = completion.choices[0]?.message?.content ?? '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const matches = JSON.parse(jsonMatch[0]) as { index: number; relevance: number; reason: string }[];
          const results: SearchResult[] = matches
            .filter((m) => entries[m.index])
            .map((m) => ({ entry: entries[m.index], relevance: m.relevance, snippet: extractSnippet(entries[m.index].content, m.reason) }));
          return NextResponse.json({ results });
        }
      } catch {
        // fall through
      }
    }

    // Try Anthropic
    if (anthropicKey && anthropicKey.startsWith('sk-ant')) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: anthropicKey });
        const message = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          messages: [{ role: 'user', content: buildSearchPrompt(query, entryList) }],
        });
        const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
        const matches = JSON.parse(text.trim()) as { index: number; relevance: number; reason: string }[];
        const results: SearchResult[] = matches
          .filter((m) => entries[m.index])
          .map((m) => ({ entry: entries[m.index], relevance: m.relevance, snippet: extractSnippet(entries[m.index].content, m.reason) }));
        return NextResponse.json({ results });
      } catch {
        // fall through
      }
    }

    return NextResponse.json({ results: [] });
  } catch (error) {
    console.error('[/api/search]', error instanceof Error ? error.message : error);
    return NextResponse.json({ results: [] });
  }
}
