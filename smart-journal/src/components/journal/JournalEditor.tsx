'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Brain, Save, X, Plus, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { z } from 'zod';
import type { JournalEntry } from '@/types';
import { useJournalStore } from '@/store/journalStore';
import { analyzeEntry } from '@/services/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useT, useLangStore } from '@/store/langStore';
import AIInsights from './AIInsights';

interface Props {
  entry?: JournalEntry;
}

// Web Speech API types (not in default TS lib)
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

const MAX_CHARS = 5000;
const MIN_CHARS = 5;

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export default function JournalEditor({ entry }: Props) {
  const router = useRouter();
  const addEntry = useJournalStore((s) => s.addEntry);
  const updateEntry = useJournalStore((s) => s.updateEntry);
  const setAnalysis = useJournalStore((s) => s.setAnalysis);
  const t = useT();
  const lang = useLangStore((s) => s.lang);

  const [title, setTitle] = useState(entry?.title ?? '');
  const [content, setContent] = useState(entry?.content ?? '');
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analysis, setLocalAnalysis] = useState(entry?.analysis ?? null);
  const [currentId, setCurrentId] = useState(entry?.id ?? '');

  // Voice input
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    // Browser API detection — must run client-side, setState here is intentional
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoiceSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  // Stop the microphone when the component unmounts to avoid mic staying open
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const SPEECH_LANG: Record<string, string> = { en: 'en-US', uk: 'uk-UA', pl: 'pl-PL' };

  const startRecording = useCallback(() => {
    const SR: SpeechRecognitionConstructor | undefined =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = SPEECH_LANG[lang] ?? 'uk-UA';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (finalText) {
        const captured = finalText;
        setContent((prev) => {
          const sep = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
          return prev + sep + captured;
        });
      }
      setTranscript(interim);
    };

    recognition.onerror = () => {
      setRecording(false);
      setTranscript('');
    };

    recognition.onend = () => {
      setTranscript((currentTranscript) => {
        if (currentTranscript.trim()) {
          const captured = currentTranscript.trim();
          setContent((prev) => {
            const sep = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
            return prev + sep + captured;
          });
        }
        return '';
      });
      setRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setTranscript((currentTranscript) => {
      if (currentTranscript.trim()) {
        const captured = currentTranscript.trim();
        setContent((prev) => {
          const sep = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
          return prev + sep + captured;
        });
      }
      return '';
    });
    recognitionRef.current?.stop();
    setRecording(false);
  }, []);

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError(t.editor.validationTitleRequired);
      return;
    }
    setTitleError(null);

    const schema = z.string()
      .min(1, t.editor.validationRequired)
      .min(MIN_CHARS, t.editor.validationMinChars)
      .max(MAX_CHARS, t.editor.validationMaxChars);

    const result = schema.safeParse(fullText);
    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }

    setValidationError(null);
    setSaveError(null);
    setSaveStatus('saving');

    try {
      if (entry) {
        updateEntry(entry.id, { title, content, tags });
      } else {
        const newEntry = addEntry({ title, content, tags });
        setCurrentId(newEntry.id);
        router.replace(`/journal/${newEntry.id}`);
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.editor.saveError;
      setSaveError(msg);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleAnalyze = async () => {
    const fullContent = (content + (transcript ? ' ' + transcript : '')).trim();
    if (!fullContent) return;

    if (fullContent !== content) setContent(fullContent);

    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const id = currentId || entry?.id;
      if (!id) {
        const newEntry = addEntry({ title, content: fullContent, tags });
        setCurrentId(newEntry.id);
        const result = await analyzeEntry({ title, content: fullContent }, lang);
        setAnalysis(newEntry.id, result);
        setLocalAnalysis(result);
      } else {
        const result = await analyzeEntry({ title, content: fullContent }, lang);
        setAnalysis(id, result);
        setLocalAnalysis(result);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setAnalyzeError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const fullText = (content + (transcript ? ' ' + transcript : '')).trim();
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;
  const charCount = fullText.length;
  const isOverLimit = charCount > MAX_CHARS;
  const charCountColor =
    charCount > MAX_CHARS
      ? 'text-red-500 dark:text-red-400'
      : charCount > MAX_CHARS * 0.9
      ? 'text-amber-500 dark:text-amber-400'
      : 'text-slate-400 dark:text-zinc-600';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(null); }}
            placeholder={t.editor.titlePlaceholder}
            aria-label="Entry title"
            aria-invalid={!!titleError}
            aria-describedby={titleError ? 'title-error' : undefined}
            className="bg-transparent text-2xl font-bold text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-700 outline-none w-full border-none focus:ring-0"
          />
          <AnimatePresence>
            {titleError && (
              <motion.p
                id="title-error"
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1"
              >
                <XCircle size={12} className="shrink-0" />
                {titleError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <Tag size={13} className="text-slate-600 dark:text-zinc-200" />
          {tags.map((tag) => (
            <Badge key={tag} variant="tag" className="gap-1">
              #{tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-400 ml-0.5">
                <X size={10} />
              </button>
            </Badge>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
              placeholder={t.editor.tagPlaceholder}
              className="bg-transparent text-xs text-slate-700 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-700 outline-none w-24 border-b border-slate-200 dark:border-zinc-800 focus:border-indigo-500 pb-0.5 transition-colors"
            />
            <button onClick={addTag} className="text-slate-600 dark:text-zinc-200 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-zinc-800" />

        {/* Content area */}
        <div className="relative">
          <textarea
            value={content + (transcript ? ' ' + transcript : '')}
            onChange={(e) => {
              if (!recording) {
                setContent(e.target.value);
                if (validationError) setValidationError(null);
              }
            }}
            placeholder={t.editor.contentPlaceholder}
            aria-label="Entry content"
            aria-invalid={!!validationError}
            aria-describedby={validationError ? 'content-error' : undefined}
            className={[
              'w-full min-h-[320px] bg-transparent text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-700 text-base leading-relaxed outline-none resize-none border-none focus:ring-0 transition-colors',
              validationError ? 'placeholder-red-300 dark:placeholder-red-800' : '',
            ].join(' ')}
          />

          {/* Live voice preview */}
          <AnimatePresence>
            {recording && transcript && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-indigo-400/60 italic"
              >
                {' '}{transcript}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Recording pulse */}
          {recording && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute top-0 right-0 flex items-center gap-2 text-xs text-red-400"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {t.editor.recording}
            </motion.div>
          )}
        </div>

        {/* Char count + validation error */}
        <div className="flex items-start justify-between gap-2 -mt-3">
          <AnimatePresence mode="wait">
            {validationError ? (
              <motion.p
                key="error"
                id="content-error"
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1"
              >
                <XCircle size={12} className="shrink-0" />
                {validationError}
              </motion.p>
            ) : (
              <span key="empty" />
            )}
          </AnimatePresence>

          <span className={`text-xs ml-auto tabular-nums shrink-0 transition-colors ${charCountColor}`}>
            {charCount} / {MAX_CHARS}
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-t border-slate-200 dark:border-zinc-800 pt-4">
          {/* Left: word count */}
          <span className="text-xs text-slate-600 dark:text-zinc-200 shrink-0">{t.editor.words(wordCount)}</span>

          {/* Center: save feedback */}
          <div className="flex-1 flex justify-center">
            <AnimatePresence mode="wait">
              {saveStatus === 'success' && (
                <motion.span
                  key="success"
                  initial={{ opacity: 0, scale: 0.85, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                >
                  <CheckCircle2 size={13} />
                  {t.editor.saved}
                </motion.span>
              )}
              {saveStatus === 'error' && saveError && (
                <motion.span
                  key="error"
                  initial={{ opacity: 0, scale: 0.85, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-500 dark:text-red-400"
                >
                  <XCircle size={13} />
                  {saveError}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {voiceSupported && (
              <Button
                variant={recording ? 'danger' : 'secondary'}
                size="sm"
                onClick={recording ? stopRecording : startRecording}
              >
                {recording ? <MicOff size={14} /> : <Mic size={14} />}
                {recording ? t.editor.stopRecording : t.editor.dictate}
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              loading={analyzing}
              onClick={handleAnalyze}
              disabled={!fullText}
            >
              <Brain size={14} />
              {analyzing ? t.editor.analyzing : t.editor.analyze}
            </Button>

            <Button
              variant="primary"
              size="sm"
              loading={saveStatus === 'saving'}
              onClick={handleSave}
              disabled={saveStatus === 'saving' || isOverLimit}
            >
              <Save size={14} />
              {t.editor.save}
            </Button>
          </div>
        </div>

        {/* Analyze error */}
        <AnimatePresence>
          {analyzeError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
            >
              <span className="shrink-0">⚠</span>
              <span>{analyzeError}</span>
              <button onClick={() => setAnalyzeError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Insights */}
        <AnimatePresence>
          {analysis && (
            <AIInsights key={analysis.analyzedAt} analysis={analysis} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
