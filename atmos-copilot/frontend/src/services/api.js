const BASE_URL = 'https://atmoscopilot-backend.onrender.com/api';

// 1. Resolve neighborhood directly from GPS coordinates
export const reverseGeocodeCoordinates = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const addr = data.address || {};

    const locality =
      addr.neighbourhood ||
      addr.suburb ||
      addr.residential ||
      addr.quarter ||
      addr.road ||
      addr.city_district ||
      addr.village ||
      addr.city ||
      'Current Location';

    const city = addr.city || addr.state_district || 'Bengaluru';
    return locality.toLowerCase() !== city.toLowerCase()
      ? `${locality}, ${city}`
      : city;
  } catch (err) {
    console.warn('Geocoding fallback:', err);
    return 'Bengaluru, Karnataka';
  }
};

export const registerUser = async (userData) => {
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return res.json();
  } catch {
    return { status: 'offline_cached' };
  }
};

// 2. WMO weather code classifier
const mapWmoCode = (code) => {
  if (code === 0) return "Clear";
  if (code === 1 || code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "Rain";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Partly Cloudy";
};

// 3. High-precision GPS meteorological fetcher
export const fetchWeatherTelemetry = async (lat, lon, customName = null) => {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('Telemetry request failed');
    const data = await res.json();

    const current = data.current || {};
    const dailyRaw = data.daily || {};
    const hourlyRaw = data.hourly || {};

    const daily = (dailyRaw.time || []).slice(0, 7).map((t, idx) => {
      const dateObj = new Date(t);
      return {
        day: idx === 0 ? "Today" : dayNames[dateObj.getDay()],
        max_temp: Math.round(dailyRaw.temperature_2m_max[idx] ?? 29),
        min_temp: Math.round(dailyRaw.temperature_2m_min[idx] ?? 20),
        condition: mapWmoCode(dailyRaw.weather_code?.[idx] ?? 1),
        chance_of_rain: dailyRaw.precipitation_probability_max?.[idx] ?? 10
      };
    });

    const currentHour = new Date().getHours();
    const hourly = [];
    for (let i = currentHour; i < Math.min(currentHour + 24, (hourlyRaw.time || []).length); i += 3) {
      const dateObj = new Date(hourlyRaw.time[i]);
      const hour = dateObj.getHours();
      const label = hour === 0 ? "12 am" : hour === 12 ? "12 pm" : hour > 12 ? `${hour - 12} pm` : `${hour} am`;

      hourly.push({
        time: label,
        temp: Math.round(hourlyRaw.temperature_2m[i] ?? 26),
        precip: hourlyRaw.precipitation_probability?.[i] ?? 0,
        wind: Math.round(hourlyRaw.wind_speed_10m?.[i] ?? 10)
      });
    }

    const temp = Math.round(current.temperature_2m ?? 28);
    const humidity = Math.round(current.relative_humidity_2m ?? 52);

    return {
      latitude: lat,
      longitude: lon,
      resolved_city: customName || "Bengaluru, Karnataka",
      current: {
        temp,
        condition: mapWmoCode(current.weather_code ?? 1),
        humidity,
        wind: Math.round(current.wind_speed_10m ?? 15),
        precipitation: Math.round(current.precipitation ?? 0),
        dew_point: Math.round(temp - ((100 - humidity) / 5)),
        sunrise: "06:09",
        sunset: "18:28"
      },
      hourly: hourly.length > 0 ? hourly : [
        { time: "12 pm", temp: 28, precip: 0, wind: 14 },
        { time: "3 pm", temp: 29, precip: 5, wind: 15 },
        { time: "6 pm", temp: 27, precip: 10, wind: 12 },
        { time: "9 pm", temp: 24, precip: 5, wind: 9 }
      ],
      daily
    };
  } catch (err) {
    console.error("Telemetry fetch error:", err);
    throw err;
  }
};

export const sendAIChatQuery = async (query, lat, lon) => {
  const res = await fetch(`${BASE_URL}/ai-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, lat, lon }),
  });
  if (!res.ok) throw new Error('Query failed');
  return res.json();
};
