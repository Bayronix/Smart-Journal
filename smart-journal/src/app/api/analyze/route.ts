import { NextRequest, NextResponse } from 'next/server';
import type { AIAnalysis, Mood } from '@/types';

// ── Local keyword-based fallback ──────────────────────────────────────────────

const MOOD_KEYWORDS: Record<Mood, string[]> = {
  happy:      ['happy', 'joy', 'great', 'amazing', 'wonderful', 'love', 'excited', 'glad', 'smile', 'good', 'positive', 'fun', 'laugh', 'celebrate'],
  sad:        ['sad', 'unhappy', 'cry', 'depressed', 'miserable', 'lonely', 'miss', 'grief', 'sorrow', 'hurt', 'pain', 'lost', 'hopeless'],
  anxious:    ['anxious', 'anxiety', 'stress', 'stressed', 'worry', 'worried', 'nervous', 'panic', 'fear', 'scared', 'overwhelm', 'pressure', 'deadline'],
  motivated:  ['motivated', 'productive', 'focus', 'goal', 'achieve', 'progress', 'success', 'drive', 'ambition', 'determined', 'energy', 'work', 'build'],
  frustrated: ['frustrated', 'angry', 'annoyed', 'irritated', 'upset', 'mad', 'stupid', 'hate', 'ugh', 'fail', 'wrong', 'broken'],
  grateful:   ['grateful', 'thankful', 'blessed', 'appreciate', 'gratitude', 'fortunate', 'lucky', 'thank'],
  excited:    ['excited', 'thrilled', 'enthusiastic', 'pumped', 'eager', 'cant wait', "can't wait", 'looking forward', 'amazing', 'incredible'],
  neutral:    ['okay', 'fine', 'normal', 'usual', 'regular', 'nothing special', 'same'],
};

const STRESS_WORDS = ['stress', 'deadline', 'pressure', 'overwhelm', 'panic', 'crisis', 'urgent', 'fail', 'anxiety', 'worry', 'fear', 'problem', 'issue', 'trouble'];
const CALM_WORDS   = ['relax', 'calm', 'peace', 'rest', 'breathe', 'meditate', 'happy', 'joy', 'grateful', 'good'];

const TOPIC_PATTERNS: [RegExp, string][] = [
  [/\b(work|job|office|boss|colleague|meeting|project|deadline|career)\b/i, 'work'],
  [/\b(family|mom|dad|parent|sister|brother|child|kids|home)\b/i, 'family'],
  [/\b(friend|social|party|people|relationship|dating|love|partner)\b/i, 'relationships'],
  [/\b(health|sick|exercise|gym|sleep|tired|energy|body|diet|food)\b/i, 'health'],
  [/\b(money|finance|bills|debt|salary|spend|budget|cost)\b/i, 'finances'],
  [/\b(school|study|learn|class|exam|university|course|grade)\b/i, 'education'],
  [/\b(future|goal|plan|dream|hope|change|decision|choice)\b/i, 'personal growth'],
  [/\b(feel|emotion|mind|mental|thought|think|believe|reflect)\b/i, 'self-reflection'],
  [/\b(travel|trip|adventure|place|city|country|vacation)\b/i, 'travel'],
  [/\b(creative|art|music|write|create|design|project|idea)\b/i, 'creativity'],
];

const INSIGHTS: Record<Mood, string[]> = {
  happy:      ['Your entry radiates positive energy and contentment. This state of happiness often comes from alignment between your values and daily actions.', 'You seem to be in a good flow right now. Positive emotions like these broaden your thinking and build resilience for harder times.'],
  sad:        ['Your entry reflects a period of emotional pain. Acknowledging sadness is healthy — it signals that something meaningful matters to you.', 'Difficult emotions like these are temporary and serve a purpose. They often point toward what needs attention or healing in your life.'],
  anxious:    ['Your entry shows signs of stress and worry. Anxiety often points to areas where we feel uncertain or out of control.', 'The concerns you are carrying seem significant. Anxiety is your mind trying to prepare you — the key is channeling it productively rather than ruminating.'],
  motivated:  ['Your entry shows strong drive and focus. This motivated state is valuable — your mind is primed for productive action and problem-solving.', 'You are clearly energized and goal-oriented right now. This kind of momentum is worth capturing and building on.'],
  frustrated: ['Your entry reveals frustration, which often masks deeper feelings of helplessness or unmet expectations.', 'Frustration is a signal that something in your environment is misaligned with your values or needs. It deserves to be explored, not just vented.'],
  grateful:   ['Your entry is filled with gratitude, which research consistently links to greater wellbeing and life satisfaction.', 'Gratitude shifts attention toward abundance rather than scarcity. This perspective you have right now is genuinely protective for mental health.'],
  excited:    ['Your entry buzzes with enthusiasm and anticipation. This excited state fuels creativity and openness to new experiences.', 'You are clearly energized by what lies ahead. This excitement is a powerful motivator — use it while it is strong.'],
  neutral:    ['Your entry reflects a balanced, measured state of mind. Neutral days are underrated — they provide the stability that more intense days cannot.', 'A calm, reflective mood like this is often when the most honest self-assessment happens. There is value in this quieter emotional space.'],
};

const ADVICE: Record<Mood, string[]> = {
  happy:      ['Capture what made today good so you can recreate these conditions intentionally.', 'Share this positive energy with someone who might need it today.'],
  sad:        ['Give yourself permission to feel this without judgment. Try writing a few sentences about what specifically is hurting.', 'Reach out to one person you trust, even just to say hello. Connection is a powerful antidote to sadness.'],
  anxious:    ['Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.', 'Write down your top worry and one small step you could take toward it today — action reduces anxiety better than thinking.'],
  motivated:  ['Strike while the iron is hot: pick your most important task and work on it for 90 focused minutes right now.', 'Set a clear outcome for this energy so it does not scatter — what is the one thing that would make today a success?'],
  frustrated: ['Before reacting, pause and write down what specifically triggered this feeling and what you actually need.', 'Physical movement — even a 10-minute walk — can break the frustration cycle and give you fresh perspective.'],
  grateful:   ['Write down three specific things you are grateful for with detail — specificity amplifies the effect.', 'Consider expressing appreciation directly to someone who has made a positive difference in your life recently.'],
  excited:    ['Channel this excitement into concrete planning — write down three specific actions you can take to move forward.', 'Share your enthusiasm with someone who will encourage you. Excitement grows when it is witnessed.'],
  neutral:    ['Use this calm state for reflection: what has been working well lately, and what would you like to change?', 'A neutral day is a good day to build habits — low emotion means lower resistance to starting something new.'],
};

function detectMood(text: string): Mood {
  const lower = text.toLowerCase();
  const scores: Record<Mood, number> = {
    happy: 0, sad: 0, anxious: 0, neutral: 0,
    motivated: 0, frustrated: 0, grateful: 0, excited: 0,
  };
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS) as [Mood, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[mood]++;
    }
  }
  const top = (Object.entries(scores) as [Mood, number][]).sort((a, b) => b[1] - a[1])[0];
  return top[1] > 0 ? top[0] : 'neutral';
}

function detectStress(text: string): number {
  const lower = text.toLowerCase();
  let score = 5;
  for (const w of STRESS_WORDS) if (lower.includes(w)) score++;
  for (const w of CALM_WORDS)   if (lower.includes(w)) score--;
  return Math.max(1, Math.min(10, score));
}

function extractTopics(text: string): string[] {
  const found: string[] = [];
  for (const [pattern, label] of TOPIC_PATTERNS) {
    if (pattern.test(text) && !found.includes(label)) found.push(label);
    if (found.length >= 5) break;
  }
  if (found.length === 0) found.push('personal reflection');
  return found;
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function localAnalyze(title: string, content: string): AIAnalysis {
  const text = `${title} ${content}`;
  const mood = detectMood(text);
  return {
    mood,
    stressLevel: detectStress(text),
    keyTopics: extractTopics(text),
    insights: pick(INSIGHTS[mood]),
    advice: pick(ADVICE[mood]),
    analyzedAt: new Date().toISOString(),
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json() as { title: string; content: string };

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Use Claude if API key is present and valid-looking
    if (apiKey && apiKey.startsWith('sk-ant')) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey });
        const message = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `You are a psychologically-informed journal analyst. Analyze this journal entry and return a JSON object with:
- mood: one of: happy | sad | anxious | neutral | motivated | frustrated | grateful | excited
- stressLevel: integer 1-10
- keyTopics: array of 3-5 short topic strings
- insights: 2-3 sentences of psychological insight
- advice: 1-2 actionable sentences

Title: ${title || '(untitled)'}
Content: ${content}

Return ONLY valid JSON. No markdown.`,
          }],
        });
        const text = message.content[0].type === 'text' ? message.content[0].text : '';
        const analysis: AIAnalysis = { ...JSON.parse(text.trim()), analyzedAt: new Date().toISOString() };
        return NextResponse.json({ analysis });
      } catch {
        // Fall through to local analysis
      }
    }

    // Local fallback — works without any API key
    return NextResponse.json({ analysis: localAnalyze(title, content) });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/analyze]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
