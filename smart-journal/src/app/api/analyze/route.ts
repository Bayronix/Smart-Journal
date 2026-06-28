import { NextRequest, NextResponse } from 'next/server';
import type { AIAnalysis, Mood } from '@/types';

// ── Trilingual keyword lists (English + Ukrainian + Polish) ──────────────────

const MOOD_KEYWORDS: Record<Mood, string[]> = {
  happy: [
    // EN
    'happy', 'joy', 'joyful', 'great', 'amazing', 'wonderful', 'love', 'glad',
    'smile', 'good', 'positive', 'fun', 'laugh', 'celebrate', 'fantastic', 'awesome',
    // UA
    'радість', 'щасливий', 'щастя', 'чудово', 'прекрасно', 'радий', 'відмінно',
    'добрий настрій', 'позитив', 'весело', 'круто', 'кайф', 'кайфую', 'чудовий',
    'гарно', 'приємно', 'задоволений', 'насолоджуюся', 'радую', 'класно',
    // PL
    'szczęśliwy', 'radość', 'wspaniale', 'świetnie', 'cudownie', 'miło', 'dobry nastrój',
    'pozytywnie', 'wesoło', 'super', 'fantastycznie', 'cieszę się', 'uśmiecham',
  ],
  sad: [
    // EN
    'sad', 'unhappy', 'cry', 'crying', 'depressed', 'miserable', 'lonely',
    'miss', 'grief', 'sorrow', 'hurt', 'pain', 'hopeless', 'heartbreak',
    // UA
    'сумно', 'сум', 'плачу', 'сумний', 'горе', 'смуток', 'тужу', 'нудно',
    'депресія', 'зневіра', 'погано', 'пригнічений', 'самотній', 'самотньо',
    'важко на душі', 'розбитий', 'журба', 'скучно', 'нещасний',
    // PL
    'smutny', 'smutek', 'płaczę', 'płakać', 'depresja', 'samotny', 'przygnębiony',
    'żal', 'ból', 'beznadziejny', 'nieszczęśliwy', 'tęsknię', 'brak mi',
  ],
  anxious: [
    // EN
    'anxious', 'anxiety', 'stress', 'stressed', 'worry', 'worried', 'nervous',
    'panic', 'fear', 'scared', 'overwhelm', 'pressure', 'deadline', 'tense',
    // UA
    'тривога', 'тривожно', 'хвилююся', 'нервую', 'стрес', 'нервово', 'страх',
    'боюся', 'переживаю', 'паніка', 'хвилювання', 'тривожний', 'напружений',
    'не можу заспокоїтися', 'турбуюся', 'занепокоєний', 'дедлайн', 'терміново',
    // PL
    'stres', 'stresujący', 'martwię się', 'niepokój', 'nerwowy', 'panika', 'strach',
    'przestraszony', 'boję się', 'deadline', 'pilnie', 'przytłoczony', 'zaniepokojony',
  ],
  motivated: [
    // EN
    'motivated', 'productive', 'focus', 'goal', 'achieve', 'progress', 'success',
    'drive', 'ambitious', 'determined', 'energy', 'work', 'build', 'create',
    // UA
    'мотивація', 'мотивований', 'ціль', 'план', 'продуктивно', 'результат',
    'досягнення', 'вперед', 'рухаюся', 'прогрес', 'успіх', 'роблю', 'виконую',
    'ефективно', 'натхнення', 'натхненний', 'цілеспрямований', 'зосереджений',
    // PL
    'zmotywowany', 'cel', 'plan', 'produktywny', 'sukces', 'postęp', 'osiągnięcia',
    'skupiony', 'ambicja', 'determinacja', 'działam', 'tworzę', 'buduję',
  ],
  frustrated: [
    // EN
    'frustrated', 'angry', 'annoyed', 'irritated', 'upset', 'mad', 'hate',
    'fail', 'wrong', 'broken', 'stuck', 'useless', 'tired of',
    // UA
    'злий', 'злість', 'дратує', 'розчарований', 'розчарування', 'жах',
    'кошмар', 'жахливо', 'набридло', 'не можу', 'не виходить', 'безглуздо',
    'злюся', 'роздратований', 'не вдається', 'провал', 'невдача', 'бісить',
  ],
  grateful: [
    // EN
    'grateful', 'thankful', 'blessed', 'appreciate', 'gratitude', 'fortunate',
    'lucky', 'thank', 'privilege',
    // UA
    'вдячний', 'дякую', 'вдячність', 'ціную', 'цінну', 'щасливий мати',
    'пощастило', 'дякую богу', 'ціною це', 'вдячна', 'доброта',
    // PL
    'wdzięczny', 'dziękuję', 'wdzięczność', 'cenię', 'doceniam', 'szczęście',
    'błogosławiony', 'miałem szczęście', 'jestem wdzięczny',
  ],
  excited: [
    // EN
    'excited', 'thrilled', 'enthusiastic', 'pumped', 'eager', 'amazing',
    'incredible', 'cant wait', "can't wait", 'looking forward', 'wow',
    // UA
    'захоплення', 'захоплений', 'не можу дочекатися', 'з нетерпінням',
    'цікаво', 'цікавий', 'неймовірно', 'вражає', 'супер', 'захоплюєтися',
    'в захваті', 'очікую', 'хочу', 'мрію',
    // PL
    'podekscytowany', 'niecierpliwie czekam', 'z niecierpliwością', 'ciekawy',
    'niesamowite', 'zachwycony', 'czekam z niecierpliwością', 'wow',
  ],
  neutral: [
    // EN
    'okay', 'fine', 'normal', 'usual', 'regular', 'alright',
    // UA
    'нормально', 'звичайно', 'так само', 'нічого особливого', 'якось',
    'ок', 'нейтрально', 'буденно', 'як завжди',
    // PL
    'normalnie', 'zwyczajnie', 'tak samo', 'nic szczególnego', 'w porządku',
    'ok', 'neutralnie', 'jak zwykle',
  ],
};

// High-stress words raise score, calm words lower it
const STRESS_HIGH: string[] = [
  // EN
  'stress', 'deadline', 'pressure', 'overwhelm', 'panic', 'crisis', 'urgent',
  'fail', 'anxiety', 'worry', 'fear', 'problem', 'trouble', 'terrible',
  'exhausted', 'burned out', 'falling apart', 'can\'t cope', 'losing it',
  // UA
  'стрес', 'дедлайн', 'паніка', 'криза', 'терміново', 'провал', 'тривога',
  'страх', 'проблема', 'жах', 'не можу', 'важко', 'складно', 'перевантажений',
  'виснажений', 'втома', 'не справляюся', 'кошмар', 'жахливо', 'катастрофа',
  'безнадія', 'безвихідь', 'зламаний', 'розбитий', 'нервовий зрив', 'плачу',
  // PL
  'stres', 'deadline', 'panika', 'kryzys', 'pilnie', 'niepowodzenie', 'niepokój',
  'strach', 'problem', 'koszmar', 'okropnie', 'trudno', 'przepracowany',
  'zmęczenie', 'nie daję rady', 'katastrofa', 'rozpadać się', 'płaczę',
];
const STRESS_LOW: string[] = [
  // EN
  'relax', 'calm', 'peace', 'rest', 'breathe', 'meditate', 'happy', 'joy',
  'grateful', 'good', 'great', 'wonderful', 'enjoying', 'vacation', 'holiday',
  // UA
  // PL calm
  'relaks', 'spokój', 'odpoczynek', 'medytacja', 'szczęśliwy', 'radość',
  'wdzięczny', 'dobrze', 'świetnie', 'cieszę się', 'przyjemnie', 'harmonia',
  // UA calm
  'відпочинок', 'спокій', 'розслабляюся', 'медитація', 'щасливий', 'радість',
  'добре', 'вдячний', 'відпочиваю', 'насолоджуюся', 'спокійно', 'гармонія',
  'рівновага', 'задоволений', 'приємно', 'легко', 'вільно',
];

const TOPIC_PATTERNS: [RegExp, string][] = [
  [/\b(work|job|office|boss|colleague|meeting|project|deadline|career|робота|офіс|колега|зустріч|проект|дедлайн|кар'єра|начальник|праця|praca|szef|kolega|spotkanie|projekt|kariera)\b/i, 'робота / praca'],
  [/\b(family|mom|dad|parent|sister|brother|child|kids|home|сім'я|мама|тато|батьки|сестра|брат|дитина|діти|родина|rodzina|mama|tata|siostra|brat|dziecko|dom)\b/i, 'сім\'я / rodzina'],
  [/\b(friend|social|relationship|dating|love|partner|друг|друзі|стосунки|любов|партнер|кохання|дружба|przyjaciel|relacja|miłość|randka|związek)\b/i, 'стосунки / relacje'],
  [/\b(health|sick|exercise|gym|sleep|tired|energy|body|diet|food|здоров'я|хвороба|спорт|сон|втома|їжа|zdrowie|choroba|sport|sen|zmęczenie|jedzenie)\b/i, 'здоров\'я / zdrowie'],
  [/\b(money|finance|bills|debt|salary|spend|budget|гроші|фінанси|борг|зарплата|витрати|кошти|pieniądze|finanse|dług|pensja|budżet)\b/i, 'фінанси / finanse'],
  [/\b(school|study|learn|exam|university|course|grade|навчання|університет|школа|іспит|оцінки|курс|вчуся)\b/i, 'навчання'],
  [/\b(future|goal|plan|dream|hope|change|decision|ціль|план|мрія|зміни|рішення|майбутнє|надія)\b/i, 'особистий розвиток'],
  [/\b(feel|emotion|mind|thought|think|believe|reflect|відчуваю|думаю|вірю|роздуми|емоції|внутрішнє)\b/i, 'саморефлексія'],
  [/\b(travel|trip|adventure|city|country|vacation|подорож|поїздка|місто|країна|відпустка|мандрівка)\b/i, 'подорожі'],
  [/\b(creative|art|music|write|create|design|idea|творчість|мистецтво|музика|пишу|ідея|малюю|творю)\b/i, 'творчість'],
];

const INSIGHTS: Record<Mood, string[]> = {
  happy:      ['Твій запис випромінює позитивну енергію. Цей стан щастя часто виникає, коли наші дії відповідають нашим цінностям.', 'Ти зараз у гарному потоці. Позитивні емоції розширюють мислення і будують стійкість на складніші часи.'],
  sad:        ['Твій запис відображає емоційний біль. Визнання суму — це здорово: воно сигналізує, що щось важливе для тебе має значення.', 'Складні емоції тимчасові і мають сенс. Вони часто вказують на те, що потребує уваги або зцілення в твоєму житті.'],
  anxious:    ['Твій запис показує ознаки стресу і тривоги. Занепокоєння часто вказує на сфери, де ти відчуваєш невизначеність або брак контролю.', 'Занепокоєння — це сигнал твого розуму готуватися. Ключ у тому, щоб спрямувати його продуктивно, а не застрявати в роздумах.'],
  motivated:  ['Твій запис показує сильну цілеспрямованість. Цей мотивований стан цінний — твій розум налаштований на продуктивні дії.', 'Ти явно енергійний і зосереджений на цілях. Такий імпульс варто підхопити і розвинути.'],
  frustrated: ['Твій запис виявляє розчарування, яке часто приховує глибші почуття безпорадності або незадоволених очікувань.', 'Розчарування — сигнал того, що щось у твоєму середовищі не відповідає твоїм цінностям. Це варто дослідити, а не просто виплеснути.'],
  grateful:   ['Твій запис сповнений вдячності, яка стабільно пов\'язана з більшим добробутом і задоволенням від життя.', 'Вдячність перемикає увагу з нестачі на достаток. Ця перспектива справді захищає психічне здоров\'я.'],
  excited:    ['Твій запис наповнений ентузіазмом та очікуванням. Цей стан збудження живить творчість і відкритість до нового.', 'Ти явно наснажений тим, що попереду. Це збудження — потужний мотиватор, використай його поки воно сильне.'],
  neutral:    ['Твій запис відображає збалансований, виважений стан думок. Нейтральні дні недооцінені — вони дають стабільність, якої не можуть дати інтенсивніші дні.', 'Спокійний, рефлексивний настрій — це час, коли відбувається найбільш чесна самооцінка. Є цінність у цьому тихішому емоційному просторі.'],
};

const ADVICE: Record<Mood, string[]> = {
  happy:      ['Запиши, що зробило сьогодні таким гарним, щоб ти міг навмисно відтворити ці умови.', 'Поділися цією позитивною енергією з кимось, хто може потребувати її сьогодні.'],
  sad:        ['Дозволь собі відчувати це без осуду. Спробуй написати кілька речень про те, що конкретно болить.', 'Зв\'яжися з однією людиною, якій довіряєш — навіть просто щоб сказати привіт. Зв\'язок — потужний засіб від суму.'],
  anxious:    ['Спробуй техніку "5-4-3-2-1": назви 5 речей, які бачиш, 4 — що можеш торкнутися, 3 — що чуєш, 2 — що відчуваєш на запах, 1 — на смак.', 'Запиши своє головне занепокоєння і один маленький крок, який можеш зробити сьогодні — дія зменшує тривогу краще за роздуми.'],
  motivated:  ['Дій поки є запал: вибери своє найважливіше завдання і попрацюй над ним 90 зосереджених хвилин прямо зараз.', 'Постав чітку мету для цієї енергії — що одне зробить сьогодні успішним?'],
  frustrated: ['Перш ніж реагувати, зупинись і запиши, що конкретно викликало це відчуття і чого ти насправді потребуєш.', 'Фізичний рух — навіть 10 хвилин прогулянки — може розірвати цикл розчарування і дати свіжий погляд.'],
  grateful:   ['Запиши три конкретні речі, за які ти вдячний — конкретність посилює ефект.', 'Розглянь можливість висловити подяку безпосередньо комусь, хто позитивно вплинув на твоє життя нещодавно.'],
  excited:    ['Спрямуй це збудження в конкретне планування — запиши три дії, які можеш зробити щоб рухатися вперед.', 'Поділися своїм ентузіазмом з кимось, хто тебе підтримає. Збудження росте, коли ним діляться.'],
  neutral:    ['Використай цей спокійний стан для рефлексії: що добре працювало останнім часом і що хотів би змінити?', 'Нейтральний день — гарний день для формування звичок: низька емоційність означає менший опір для початку чогось нового.'],
};

// ── Detection functions ───────────────────────────────────────────────────────

function detectMood(text: string): Mood {
  const lower = text.toLowerCase();
  const scores: Record<Mood, number> = {
    happy: 0, sad: 0, anxious: 0, neutral: 0,
    motivated: 0, frustrated: 0, grateful: 0, excited: 0,
  };
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS) as [Mood, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[mood] += kw.length > 5 ? 2 : 1; // longer phrases = stronger signal
    }
  }
  const sorted = (Object.entries(scores) as [Mood, number][]).sort((a, b) => b[1] - a[1]);
  // Return top mood only if it clearly dominates; otherwise neutral
  if (sorted[0][1] === 0) return 'neutral';
  if (sorted[0][0] === 'neutral' && sorted[1][1] > 0) return sorted[1][0]; // neutral shouldn't win over real mood
  return sorted[0][0];
}

function detectStress(text: string): number {
  const lower = text.toLowerCase();
  let score = 3; // Start lower than 5 so default leans calm
  for (const w of STRESS_HIGH) {
    if (lower.includes(w)) score += w.length > 8 ? 2 : 1; // longer phrases weigh more
  }
  for (const w of STRESS_LOW) {
    if (lower.includes(w)) score -= 1;
  }
  return Math.max(1, Math.min(10, score));
}

function extractTopics(text: string): string[] {
  const found: string[] = [];
  for (const [pattern, label] of TOPIC_PATTERNS) {
    if (pattern.test(text) && !found.includes(label)) found.push(label);
    if (found.length >= 5) break;
  }
  if (found.length === 0) found.push('особисті роздуми');
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

// ── Shared prompt ─────────────────────────────────────────────────────────────

const LANG_NAME: Record<string, string> = {
  en: 'English',
  uk: 'Ukrainian',
  pl: 'Polish',
};

function buildSystemPrompt(lang: string): string {
  const language = LANG_NAME[lang] ?? 'Ukrainian';
  return `You are a psychologically-informed journal analyst.
Always respond in ${language}, regardless of what language the journal entry is written in.
Be empathetic, insightful, and specific to what they actually wrote. Never give generic responses.`;
}

function buildUserPrompt(title: string, content: string, lang: string): string {
  const language = LANG_NAME[lang] ?? 'Ukrainian';
  return `Analyze this journal entry and return a JSON object with exactly these fields:
- mood: one of: happy | sad | anxious | neutral | motivated | frustrated | grateful | excited
- stressLevel: integer 1-10 (1=none, 10=extreme — be accurate, don't default to 5)
- keyTopics: array of 3-5 short topic strings in ${language}
- insights: 2-3 sentences of genuine psychological insight in ${language}
- advice: 1-2 concrete, actionable sentences in ${language}

Journal entry:
Title: ${title || '(untitled)'}
Content: ${content}

Return ONLY valid JSON. No markdown, no explanation.`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { title, content, lang = 'uk' } = await request.json() as { title: string; content: string; lang?: string };

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // 1️⃣ Try Groq — LLaMA 3.3 70B first, Mixtral as fallback
    if (groqKey && groqKey.startsWith('gsk_')) {
      for (const model of ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768']) {
        try {
          const { default: Groq } = await import('groq-sdk');
          const groq = new Groq({ apiKey: groqKey });
          const completion = await groq.chat.completions.create({
            model,
            max_tokens: 1024,
            temperature: 0.4,
            messages: [
              { role: 'system', content: buildSystemPrompt(lang) },
              { role: 'user', content: buildUserPrompt(title, content, lang) },
            ],
          });
          const text = completion.choices[0]?.message?.content ?? '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis: AIAnalysis = { ...JSON.parse(jsonMatch[0]), analyzedAt: new Date().toISOString() };
            return NextResponse.json({ analysis });
          }
        } catch {
          // try next model
        }
      }
    }

    // 2️⃣ Try Anthropic Claude
    if (anthropicKey && anthropicKey.startsWith('sk-ant')) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: anthropicKey });
        const message = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: buildSystemPrompt(lang),
          messages: [{ role: 'user', content: buildUserPrompt(title, content, lang) }],
        });
        const text = message.content[0].type === 'text' ? message.content[0].text : '';
        const analysis: AIAnalysis = { ...JSON.parse(text.trim()), analyzedAt: new Date().toISOString() };
        return NextResponse.json({ analysis });
      } catch {
        // Fall through to local analysis
      }
    }

    // 3️⃣ Local keyword fallback
    return NextResponse.json({ analysis: localAnalyze(title, content) });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/analyze]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
