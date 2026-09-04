const BASE_URL = 'https://atmoscopilot-backend.onrender.com/api';

// Precision client-side reverse geocoder prioritizing hyper-local BBMP ward & neighborhood data
export const reverseGeocodeCoordinates = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=18&addressdetails=1&namedetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const addr = data.address || {};

    // Micro-locality hierarchy (Prioritizes exact sub-locality, e.g., JJR Nagar / Jagajyothi West)
    const microLocality = 
      addr.suburb || 
      addr.neighbourhood || 
      addr.residential || 
      addr.city_district || 
      addr.quarter || 
      addr.subdistrict ||
      addr.village ||
      addr.hamlet;

    const mainCity = addr.city || addr.state_district || 'Bengaluru';

    if (microLocality) {
      // Format clean names like "J J R Nagar, Bengaluru"
      const cleanLocality = microLocality.replace(/\b(Ward|BBMP|Zone)\b/gi, '').trim();
      if (cleanLocality.toLowerCase() !== mainCity.toLowerCase()) {
        return `${cleanLocality}, ${mainCity}`;
      }
      return cleanLocality;
    }

    return mainCity ? `${mainCity}, Karnataka` : 'Bengaluru, Karnataka';
  } catch (err) {
    console.warn('Client reverse-geocode fallback:', err);
    return null;
  }
};

export const registerUser = async (userData) => {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error('Registration failed');
  return res.json();
};

export const fetchWeatherTelemetry = async (lat, lon, customName = null) => {
  let url = `${BASE_URL}/weather-telemetry?lat=${lat}&lon=${lon}`;
  if (customName) {
    url += `&city=${encodeURIComponent(customName)}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error('Telemetry retrieval failed');
  const data = await res.json();

  if (customName) {
    data.resolved_city = customName;
  }
  return data;
};

export const sendAIChatQuery = async (query, lat, lon) => {
  const res = await fetch(`${BASE_URL}/ai-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, lat, lon }),
  });
  if (!res.ok) throw new Error('Query dispatch failed');
  return res.json();
};
