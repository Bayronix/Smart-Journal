import { NextRequest, NextResponse } from 'next/server';
import type { JournalEntry, SearchResult } from '@/types';
import { localSearch } from '@/lib/search';
import { extractSnippet } from '@/lib/utils';
import { groqComplete, hasGroqKey } from '@/lib/groq';

const MAX_BODY_BYTES = 300_000;

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
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ results: [] }, { status: 413 });
  }

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

    // AI semantic search fallback — trim entries before building prompt
    const entryList = entries.slice(0, 30)
      .map((e, i) => `[${i}] ${e.createdAt.slice(0, 10)} | ${e.title.slice(0, 80)}: ${e.content.slice(0, 200)}`)
      .join('\n');

    // Try Groq via shared singleton
    if (hasGroqKey()) {
      try {
        const text = await groqComplete({
          messages: [{ role: 'user', content: buildSearchPrompt(query, entryList) }],
          maxTokens: 512,
          temperature: 0.1,
        });
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const matches = JSON.parse(jsonMatch[0]) as { index: number; relevance: number; reason: string }[];
          const results: SearchResult[] = matches
            .filter((m) => entries[m.index])
            .map((m) => ({ entry: entries[m.index], relevance: m.relevance, snippet: extractSnippet(entries[m.index].content, m.reason) }));
          return NextResponse.json({ results });
        }
      } catch {
        // fall through to Anthropic
      }
    }

    // Try Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey?.startsWith('sk-ant')) {
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
    console.error('[/api/search]', error);
    return NextResponse.json({ results: [] });
  }
}
