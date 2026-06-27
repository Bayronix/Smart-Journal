'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Wind, Droplets, RefreshCw, ChevronDown, Thermometer, AlertCircle } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import {
  getPosition, getCityName, fetchWeather,
  wmoEmoji, wmoLabel,
  type WeatherData,
} from '@/services/weather';
import { useLangStore } from '@/store/langStore';

const DAY_UA = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_PL = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];

function dayLabel(dateStr: string, lang: 'uk' | 'en' | 'pl'): string {
  const d = parseISO(dateStr);
  const days = lang === 'en' ? DAY_EN : lang === 'pl' ? DAY_PL : DAY_UA;
  if (isToday(d)) return lang === 'en' ? 'Today' : lang === 'pl' ? 'Dziś' : 'Сьогодні';
  if (isTomorrow(d)) return lang === 'en' ? 'Tomorrow' : lang === 'pl' ? 'Jutro' : 'Завтра';
  return days[d.getDay()];
}

export default function WeatherWidget() {
  const lang = useLangStore((s) => s.lang);
  const wmoLang = lang === 'uk' ? 'ua' : lang as 'en' | 'pl';

  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [permitted, setPermitted] = useState<boolean | null>(null); // null = not asked yet

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { lat, lon } = await getPosition();
      setPermitted(true);
      const [weather, city] = await Promise.all([
        fetchWeather(lat, lon),
        getCityName(lat, lon),
      ]);
      setData({ ...weather, city });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('denied') || msg.includes('User denied')) {
        setPermitted(false);
        setError(lang === 'en' ? 'Location access denied' : lang === 'pl' ? 'Odmowa dostępu do lokalizacji' : 'Доступ до геолокації відхилено');
      } else {
        setError(lang === 'en' ? 'Failed to load weather' : lang === 'pl' ? 'Błąd ładowania pogody' : 'Помилка завантаження погоди');
      }
    } finally {
      setLoading(false);
    }
  }, [lang]);

  // Auto-load on mount
  useEffect(() => {
    load();
  }, [load]);

  // ── Not asked / ask permission ─────────────────────────────────────────────
  if (permitted === null && !loading && !data && !error) {
    return (
      <div className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌤️</span>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {lang === 'en' ? 'Weather Forecast' : lang === 'pl' ? 'Prognoza pogody' : 'Прогноз погоди'}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              {lang === 'en' ? 'Allow location to see weather' : lang === 'pl' ? 'Zezwól na lokalizację' : 'Дозволь геолокацію для прогнозу'}
            </p>
          </div>
        </div>
        <button onClick={load}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
        >
          {lang === 'en' ? 'Allow' : lang === 'pl' ? 'Zezwól' : 'Дозволити'}
        </button>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-5 flex items-center gap-3">
        <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
        <span className="text-sm text-slate-500 dark:text-zinc-500">
          {lang === 'en' ? 'Loading weather…' : lang === 'pl' ? 'Ładowanie pogody…' : 'Завантаження погоди…'}
        </span>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3">
        <AlertCircle size={16} className="text-amber-500 shrink-0" />
        <span className="text-sm text-slate-600 dark:text-zinc-400 flex-1">{error}</span>
        {permitted !== false && (
          <button onClick={load} className="text-xs text-indigo-500 hover:text-indigo-400 shrink-0">
            {lang === 'en' ? 'Retry' : lang === 'pl' ? 'Spróbuj ponownie' : 'Повторити'}
          </button>
        )}
      </div>
    );
  }

  if (!data) return null;

  const { current, daily, city } = data;
  const todayEmoji = wmoEmoji(current.weatherCode, current.isDay);
  const todayLabel = wmoLabel(current.weatherCode, wmoLang);

  return (
    <motion.div
      layout
      className="bg-white/70 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* ── Current weather ── */}
      <div
        className="px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: city + description */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-4xl leading-none shrink-0">{todayEmoji}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-500 mb-0.5">
                <MapPin size={11} />
                <span className="truncate">{city}</span>
              </div>
              <p className="text-slate-800 dark:text-zinc-200 text-sm font-medium truncate">{todayLabel}</p>
            </div>
          </div>

          {/* Right: temperature + controls */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900 dark:text-zinc-100 leading-none">{current.temperature}°</p>
              <p className="text-xs text-slate-400 dark:text-zinc-600 mt-0.5">
                {lang === 'en' ? 'Feels' : lang === 'pl' ? 'Odczuwalna' : 'Відчувається'} {current.feelsLike}°
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={(e) => { e.stopPropagation(); load(); }}
                className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-600 hover:text-indigo-500 hover:bg-white/50 dark:hover:bg-white/10 transition-all"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={15} className="text-slate-400 dark:text-zinc-600" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-zinc-500">
          <span className="flex items-center gap-1"><Droplets size={11} />{current.humidity}%</span>
          <span className="flex items-center gap-1"><Wind size={11} />{current.windSpeed} км/г</span>
          {current.precipitation > 0 && (
            <span className="flex items-center gap-1">🌧️ {current.precipitation.toFixed(1)} мм</span>
          )}
          <span className="ml-auto text-[10px] text-slate-400 dark:text-zinc-600">
            {format(new Date(), 'HH:mm')}
          </span>
        </div>
      </div>

      {/* ── 7-day forecast ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/30 dark:border-white/10 px-4 py-3">
              <div className="grid grid-cols-7 gap-1">
                {daily.map((day) => {
                  const emoji = wmoEmoji(day.weatherCode, true);
                  const label = dayLabel(day.date, lang === 'uk' ? 'uk' : lang as 'en' | 'pl');
                  const isRainy = day.precipitationProbability > 40;

                  return (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                    >
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-500 truncate">{label}</span>
                      <span className="text-xl">{emoji}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{day.tempMax}°</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-600">{day.tempMin}°</span>
                      {isRainy && (
                        <span className="text-[9px] text-blue-500 dark:text-blue-400 font-medium">
                          {day.precipitationProbability}%
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Detailed today row */}
              <div className="mt-3 pt-3 border-t border-white/20 dark:border-white/5 grid grid-cols-3 gap-2">
                {[
                  { icon: <Thermometer size={13} />, label: lang === 'en' ? 'Max/Min' : lang === 'pl' ? 'Maks/Min' : 'Макс/Мін', val: `${daily[0]?.tempMax}° / ${daily[0]?.tempMin}°` },
                  { icon: <Droplets size={13} />, label: lang === 'en' ? 'Rain prob.' : lang === 'pl' ? 'Deszcz' : 'Імовірн. дощу', val: `${daily[0]?.precipitationProbability}%` },
                  { icon: <Wind size={13} />, label: lang === 'en' ? 'Max wind' : lang === 'pl' ? 'Wiatr max' : 'Макс вітер', val: `${daily[0]?.windSpeedMax} км/г` },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5 text-center">
                    <span className="text-slate-400 dark:text-zinc-600">{icon}</span>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-600">{label}</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
