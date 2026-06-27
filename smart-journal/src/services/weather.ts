export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbability: number;
  windSpeedMax: number;
}

export interface WeatherData {
  city: string;
  current: CurrentWeather;
  daily: DailyForecast[];
  latitude: number;
  longitude: number;
}

// WMO weather code → emoji + Ukrainian + English + Polish labels
export const WMO: Record<number, { ua: string; en: string; pl: string; emoji: string; night?: string }> = {
  0:  { ua: 'Ясне небо',        en: 'Clear sky',          pl: 'Bezchmurnie',       emoji: '☀️', night: '🌙' },
  1:  { ua: 'Переважно ясно',   en: 'Mainly clear',       pl: 'Głównie słonecznie', emoji: '🌤️', night: '🌤️' },
  2:  { ua: 'Мінлива хмарність',en: 'Partly cloudy',      pl: 'Częściowe zachmurzenie', emoji: '⛅' },
  3:  { ua: 'Хмарно',           en: 'Overcast',           pl: 'Zachmurzenie',      emoji: '☁️' },
  45: { ua: 'Туман',            en: 'Foggy',              pl: 'Mgła',              emoji: '🌫️' },
  48: { ua: 'Ожеледний туман',  en: 'Freezing fog',       pl: 'Marznąca mgła',     emoji: '🌫️' },
  51: { ua: 'Легка мряка',      en: 'Light drizzle',      pl: 'Lekka mżawka',     emoji: '🌦️' },
  53: { ua: 'Мряка',            en: 'Drizzle',            pl: 'Mżawka',            emoji: '🌦️' },
  55: { ua: 'Сильна мряка',     en: 'Dense drizzle',      pl: 'Gęsta mżawka',     emoji: '🌦️' },
  61: { ua: 'Слабкий дощ',      en: 'Slight rain',        pl: 'Lekki deszcz',      emoji: '🌧️' },
  63: { ua: 'Дощ',              en: 'Moderate rain',      pl: 'Deszcz',            emoji: '🌧️' },
  65: { ua: 'Сильний дощ',      en: 'Heavy rain',         pl: 'Ulewny deszcz',     emoji: '🌧️' },
  71: { ua: 'Слабкий сніг',     en: 'Slight snow',        pl: 'Lekki śnieg',       emoji: '❄️' },
  73: { ua: 'Сніг',             en: 'Moderate snow',      pl: 'Śnieg',             emoji: '❄️' },
  75: { ua: 'Сильний сніг',     en: 'Heavy snow',         pl: 'Obfity śnieg',      emoji: '❄️' },
  77: { ua: 'Крупа',            en: 'Snow grains',        pl: 'Krupy śniegu',      emoji: '🌨️' },
  80: { ua: 'Короткочасний дощ',en: 'Rain showers',       pl: 'Przelotny deszcz',  emoji: '🌦️' },
  81: { ua: 'Зливи',            en: 'Rain showers',       pl: 'Ulewy',             emoji: '🌧️' },
  82: { ua: 'Сильні зливи',     en: 'Violent showers',    pl: 'Gwałtowne ulewy',   emoji: '⛈️' },
  85: { ua: 'Снігові шквали',   en: 'Snow showers',       pl: 'Opady śniegu',      emoji: '🌨️' },
  86: { ua: 'Сильні снігові шквали', en: 'Heavy snow showers', pl: 'Obfite opady śniegu', emoji: '❄️' },
  95: { ua: 'Гроза',            en: 'Thunderstorm',       pl: 'Burza',             emoji: '⛈️' },
  96: { ua: 'Гроза з градом',   en: 'Thunderstorm + hail',pl: 'Burza z gradem',    emoji: '⛈️' },
  99: { ua: 'Гроза з великим градом', en: 'Thunderstorm + heavy hail', pl: 'Burza z dużym gradem', emoji: '🌪️' },
};

export function wmoEmoji(code: number, isDay = true): string {
  const entry = WMO[code] ?? WMO[0];
  return (!isDay && entry.night) ? entry.night : entry.emoji;
}

export function wmoLabel(code: number, lang: 'ua' | 'en' | 'pl' = 'ua'): string {
  const entry = WMO[code] ?? WMO[0];
  return entry[lang] ?? entry.en;
}

export async function getPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000 }
    );
  });
}

export async function getCityName(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
      { headers: { 'Accept-Language': 'uk' } }
    );
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      'Невідоме місто'
    );
  } catch {
    return `${lat.toFixed(1)}°, ${lon.toFixed(1)}°`;
  }
}

export async function fetchWeather(lat: number, lon: number): Promise<Omit<WeatherData, 'city'>> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lon.toString());
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('wind_speed_unit', 'kmh');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Weather API failed');
  const d = await res.json();

  const current: CurrentWeather = {
    temperature: Math.round(d.current.temperature_2m),
    feelsLike: Math.round(d.current.apparent_temperature),
    humidity: d.current.relative_humidity_2m,
    windSpeed: Math.round(d.current.wind_speed_10m),
    precipitation: d.current.precipitation,
    weatherCode: d.current.weather_code,
    isDay: d.current.is_day === 1,
  };

  const daily: DailyForecast[] = d.daily.time.map((date: string, i: number) => ({
    date,
    weatherCode: d.daily.weather_code[i],
    tempMax: Math.round(d.daily.temperature_2m_max[i]),
    tempMin: Math.round(d.daily.temperature_2m_min[i]),
    precipitationSum: d.daily.precipitation_sum[i] ?? 0,
    precipitationProbability: d.daily.precipitation_probability_max[i] ?? 0,
    windSpeedMax: Math.round(d.daily.wind_speed_10m_max[i] ?? 0),
  }));

  return { current, daily, latitude: lat, longitude: lon };
}
