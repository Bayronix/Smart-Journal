'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Wind, Droplets, RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import {
  getPosition, getCityName, fetchWeather,
  wmoEmoji, wmoLabel,
  type WeatherData,
} from '@/services/weather';
import { useLangStore } from '@/store/langStore';

const DAY_SHORT: Record<string, string[]> = {
  uk: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  pl: ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'],
};

function dayLabel(dateStr: string, lang: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return lang === 'en' ? 'Today' : lang === 'pl' ? 'Dziś' : 'Сьогодні';
  if (isTomorrow(d)) return lang === 'en' ? 'Tom.' : lang === 'pl' ? 'Jutro' : 'Завтра';
  return (DAY_SHORT[lang] ?? DAY_SHORT.uk)[d.getDay()];
}

export default function WeatherWidget() {
  const lang = useLangStore((s) => s.lang);
  const wmoL = lang === 'uk' ? 'ua' : lang as 'en' | 'pl';

  const [data, setData]         = useState<WeatherData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [asked, setAsked]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAsked(true);
    try {
      const { lat, lon } = await getPosition();
      const [weather, city] = await Promise.all([fetchWeather(lat, lon), getCityName(lat, lon)]);
      setData({ ...weather, city });
    } catch (err) {
      const m = err instanceof Error ? err.message : '';
      setError(
        m.includes('denied') || m.includes('User denied')
          ? (lang === 'en' ? 'Location denied' : lang === 'pl' ? 'Odmowa lokalizacji' : 'Доступ до геолокації відхилено')
          : (lang === 'en' ? 'Failed to load weather' : lang === 'pl' ? 'Błąd pogody' : 'Помилка завантаження')
      );
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => { load(); }, [load]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-5 flex items-center gap-3 h-full min-h-[120px]">
        <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
        <span className="text-sm text-slate-500 dark:text-zinc-500">
          {lang === 'en' ? 'Loading weather…' : lang === 'pl' ? 'Ładowanie…' : 'Завантаження погоди…'}
        </span>
      </div>
    );
  }

  // ── Error / Not asked ────────────────────────────────────────────────────
  if ((error || !asked) && !data) {
    return (
      <div className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-center min-h-[120px]">
        <span className="text-4xl">{error ? '⚠️' : '🌤️'}</span>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
            {error ?? (lang === 'en' ? 'Weather Forecast' : lang === 'pl' ? 'Prognoza pogody' : 'Прогноз погоди')}
          </p>
          {!error && (
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
              {lang === 'en' ? 'Allow location access' : lang === 'pl' ? 'Zezwól na lokalizację' : 'Дозволь геолокацію'}
            </p>
          )}
        </div>
        {(!error || !error.includes('denied')) && (
          <button onClick={load}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            {lang === 'en' ? 'Allow & load' : lang === 'pl' ? 'Zezwól' : 'Дозволити'}
          </button>
        )}
      </div>
    );
  }

  if (!data) return null;

  const { current, daily, city } = data;
  const todayEmoji = wmoEmoji(current.weatherCode, current.isDay);

  return (
    <motion.div layout className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm h-full">

      {/* ── Current weather header ── */}
      <div className="px-5 pt-4 pb-3 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-start justify-between gap-3">

          {/* Big emoji + temp */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="text-5xl leading-none">{todayEmoji}</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900 dark:text-zinc-100">{current.temperature}°</span>
                <span className="text-base text-slate-400 dark:text-zinc-600 font-normal">C</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-zinc-600 mt-0.5">
                {lang === 'en' ? 'Feels like' : lang === 'pl' ? 'Odczuwalna' : 'Відчувається'} {current.feelsLike}°
              </p>
            </div>
          </div>

          {/* City + refresh */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); load(); }}
                className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-600 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-white/10 transition-all"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={15} className="text-slate-400 dark:text-zinc-600" />
              </motion.div>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-500">
              <MapPin size={10} />
              <span className="max-w-[120px] truncate">{city}</span>
            </div>
          </div>
        </div>

        {/* Description + quick stats */}
        <div className="flex items-center gap-4 mt-3">
          <span className="text-sm text-slate-600 dark:text-zinc-400">{wmoLabel(current.weatherCode, wmoL)}</span>
          <div className="flex items-center gap-3 ml-auto text-xs text-slate-500 dark:text-zinc-500">
            <span className="flex items-center gap-1"><Droplets size={11} />{current.humidity}%</span>
            <span className="flex items-center gap-1"><Wind size={11} />{current.windSpeed} км/г</span>
          </div>
        </div>
      </div>

      {/* ── 7-day forecast strip (always visible) ── */}
      <div className="px-3 pb-3 border-t border-white/30 dark:border-white/10 pt-3">
        <div className="grid grid-cols-7 gap-0.5">
          {daily.map((day, i) => {
            const emoji = wmoEmoji(day.weatherCode, true);
            const label = dayLabel(day.date, lang);
            const isRain = day.precipitationProbability > 40;
            const isHot  = day.tempMax >= 30;

            return (
              <motion.div key={day.date}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex flex-col items-center gap-0.5 py-2 px-0.5 rounded-xl transition-colors cursor-default
                  ${i === 0 ? 'bg-indigo-50/80 dark:bg-indigo-900/20 ring-1 ring-indigo-200 dark:ring-indigo-800/40' : 'hover:bg-white/50 dark:hover:bg-white/5'}`}
              >
                <span className={`text-[10px] font-semibold truncate ${i === 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-zinc-500'}`}>
                  {label}
                </span>
                <span className="text-lg leading-tight">{emoji}</span>
                <span className={`text-xs font-bold ${isHot ? 'text-orange-500' : 'text-slate-800 dark:text-zinc-200'}`}>
                  {day.tempMax}°
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-600">{day.tempMin}°</span>
                {isRain && (
                  <span className="text-[9px] text-blue-500 dark:text-blue-400 font-medium leading-none">
                    {day.precipitationProbability}%
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Expanded detail ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/20 dark:border-white/5 px-5 py-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                {lang === 'en' ? "Today's details" : lang === 'pl' ? 'Szczegóły dnia' : 'Деталі на сьогодні'}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { emoji: '🌡️', label: lang === 'en' ? 'Max / Min' : 'Макс / Мін', val: `${daily[0]?.tempMax}° / ${daily[0]?.tempMin}°` },
                  { emoji: '🌧️', label: lang === 'en' ? 'Rain chance' : 'Шанс дощу', val: `${daily[0]?.precipitationProbability}%` },
                  { emoji: '💨', label: lang === 'en' ? 'Max wind' : 'Макс вітер', val: `${daily[0]?.windSpeedMax} км/г` },
                ].map(({ emoji, label, val }) => (
                  <div key={label} className="bg-white/40 dark:bg-white/5 rounded-xl px-3 py-2 text-center">
                    <p className="text-lg mb-0.5">{emoji}</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-600">{label}</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{val}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-2 text-right">
                Open-Meteo · {format(new Date(), 'HH:mm')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
