import Groq from 'groq-sdk';

// Primary model: LLaMA 3.3 70B. Mixtral as automatic fallback.
export const GROQ_MODELS = ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'] as const;

let _groq: Groq | null = null;

export function getGroq(): Groq {
  if (!_groq) {
    const apiKey = process.env.GROQ_API_KEY ?? '';
    _groq = new Groq({ apiKey });
  }
  return _groq;
}

export function hasGroqKey(): boolean {
  const k = process.env.GROQ_API_KEY ?? '';
  return k.startsWith('gsk_');
}

interface CompletionOptions {
  messages: Groq.Chat.ChatCompletionMessageParam[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: false;
}

/** Try LLaMA 3.3 70B first, fall back to Mixtral automatically. Returns text. */
export async function groqComplete(opts: CompletionOptions): Promise<string> {
  const groq = getGroq();
  const messages: Groq.Chat.ChatCompletionMessageParam[] = opts.system
    ? [{ role: 'system', content: opts.system }, ...opts.messages]
    : opts.messages;

  for (const model of GROQ_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.6,
        messages,
      });
      const text = completion.choices[0]?.message?.content ?? '';
      if (text) return text;
    } catch {
      // try next model
    }
  }
  throw new Error('All Groq models failed');
}

/** Stream chat completion from LLaMA 3.3 70B (or Mixtral fallback). */
export async function groqStream(
  opts: CompletionOptions
): Promise<ReadableStream<Uint8Array>> {
  const groq = getGroq();
  const messages: Groq.Chat.ChatCompletionMessageParam[] = opts.system
    ? [{ role: 'system', content: opts.system }, ...opts.messages]
    : opts.messages;

  const encoder = new TextEncoder();

  for (const model of GROQ_MODELS) {
    try {
      const stream = await groq.chat.completions.create({
        model,
        max_tokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature ?? 0.7,
        messages,
        stream: true,
      });

      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta?.content ?? '';
              if (delta) controller.enqueue(encoder.encode(delta));
            }
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });
    } catch {
      // try next model
    }
  }
  throw new Error('All Groq models failed');
}
