const BASE_URL = 'https://atmoscopilot-backend.onrender.com/api';

// High-precision client-side reverse geocoding via OpenStreetMap Nominatim
export const reverseGeocodeCoordinates = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const addr = data.address || {};

    // Micro-locality priority extraction
    const neighborhood = 
      addr.neighbourhood || 
      addr.suburb || 
      addr.residential || 
      addr.city_district || 
      addr.quarter || 
      addr.village || 
      addr.town;

    const mainCity = addr.city || addr.state_district || 'Bengaluru';

    if (neighborhood && mainCity && neighborhood.toLowerCase() !== mainCity.toLowerCase()) {
      return `${neighborhood}, ${mainCity}`;
    }
    return neighborhood || mainCity || 'Bengaluru, Karnataka';
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

  // Enforce client-resolved accurate micro-locality name
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
