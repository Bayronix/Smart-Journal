'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Brain, Save, X, Plus, Tag } from 'lucide-react';
import type { JournalEntry } from '@/types';
import { useJournalStore } from '@/store/journalStore';
import { analyzeEntry } from '@/services/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
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

export default function JournalEditor({ entry }: Props) {
  const router = useRouter();
  const addEntry = useJournalStore((s) => s.addEntry);
  const updateEntry = useJournalStore((s) => s.updateEntry);
  const setAnalysis = useJournalStore((s) => s.setAnalysis);

  const [title, setTitle] = useState(entry?.title ?? '');
  const [content, setContent] = useState(entry?.content ?? '');
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setLocalAnalysis] = useState(entry?.analysis ?? null);
  const [saved, setSaved] = useState(false);
  const [currentId, setCurrentId] = useState(entry?.id ?? '');

  // Voice input
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      setVoiceSupported(!!SR);
    }
  }, []);

  const startRecording = useCallback(() => {
    const SR: SpeechRecognitionConstructor | undefined =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(interim);
      if (finalTranscript) {
        setContent((prev) => prev + finalTranscript);
        finalTranscript = '';
      }
    };

    recognition.onerror = () => setRecording(false);
    recognition.onend = () => {
      setRecording(false);
      setTranscript('');
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setRecording(false);
    setTranscript('');
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
    if (!content.trim()) return;
    setSaving(true);
    try {
      if (entry) {
        updateEntry(entry.id, { title, content, tags });
        setSaved(true);
      } else {
        const newEntry = addEntry({ title, content, tags });
        setCurrentId(newEntry.id);
        setSaved(true);
        router.replace(`/journal/${newEntry.id}`);
      }
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleAnalyze = async () => {
    const id = currentId || entry?.id;
    if (!content.trim()) return;
    setAnalyzing(true);
    try {
      // Save first if not saved
      if (!id) {
        const newEntry = addEntry({ title, content, tags });
        setCurrentId(newEntry.id);
        const result = await analyzeEntry({ title, content });
        setAnalysis(newEntry.id, result);
        setLocalAnalysis(result);
      } else {
        const result = await analyzeEntry({ title, content });
        setAnalysis(id, result);
        setLocalAnalysis(result);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-5">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title…"
          className="bg-transparent text-2xl font-bold text-zinc-100 placeholder-zinc-700 outline-none w-full border-none focus:ring-0"
        />

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          <Tag size={13} className="text-zinc-600" />
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
              placeholder="Add tag…"
              className="bg-transparent text-xs text-zinc-400 placeholder-zinc-700 outline-none w-24 border-b border-zinc-800 focus:border-indigo-600 pb-0.5 transition-colors"
            />
            <button onClick={addTag} className="text-zinc-600 hover:text-indigo-400 transition-colors">
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-800" />

        {/* Content area */}
        <div className="relative">
          <textarea
            value={content + (transcript ? ' ' + transcript : '')}
            onChange={(e) => {
              if (!recording) setContent(e.target.value);
            }}
            placeholder="Start writing… or tap the mic to speak"
            className="w-full min-h-[320px] bg-transparent text-zinc-300 placeholder-zinc-700 text-base leading-relaxed outline-none resize-none border-none focus:ring-0"
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
              Recording…
            </motion.div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap border-t border-zinc-800 pt-4">
          <span className="text-xs text-zinc-600">{wordCount} word{wordCount !== 1 ? 's' : ''}</span>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {/* Voice button */}
            {voiceSupported && (
              <Button
                variant={recording ? 'danger' : 'secondary'}
                size="sm"
                onClick={recording ? stopRecording : startRecording}
              >
                {recording ? <MicOff size={14} /> : <Mic size={14} />}
                {recording ? 'Stop' : 'Dictate'}
              </Button>
            )}

            {/* Analyze */}
            <Button
              variant="secondary"
              size="sm"
              loading={analyzing}
              onClick={handleAnalyze}
              disabled={!content.trim()}
            >
              <Brain size={14} />
              {analyzing ? 'Analyzing…' : 'Analyze'}
            </Button>

            {/* Save */}
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              onClick={handleSave}
              disabled={!content.trim()}
            >
              <Save size={14} />
              {saved ? 'Saved!' : 'Save'}
            </Button>
          </div>
        </div>

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
