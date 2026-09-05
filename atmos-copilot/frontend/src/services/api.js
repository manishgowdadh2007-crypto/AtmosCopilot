const BASE_URL = 'https://atmoscopilot-backend.onrender.com/api';

// Live device reverse-geocoding via OpenStreetMap Nominatim
export const reverseGeocodeCoordinates = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=18&addressdetails=1&namedetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    const addr = data.address || {};

    let locality =
      addr.neighbourhood ||
      addr.suburb ||
      addr.residential ||
      addr.quarter ||
      addr.road ||
      addr.city_district ||
      addr.subdistrict ||
      addr.village ||
      addr.town;

    // Normalize BBMP administrative ward tags to standard neighborhood naming
    if (
      locality &&
      (locality.toLowerCase().includes('salappa') ||
        locality.toLowerCase().includes('jagajyothi'))
    ) {
      locality = 'J J R Nagar';
    }

    const mainCity = addr.city || addr.state_district || 'Bengaluru';

    if (locality && mainCity && locality.toLowerCase() !== mainCity.toLowerCase()) {
      return `${locality}, ${mainCity}`;
    }
    return locality || mainCity || 'Bengaluru, Karnataka';
  } catch (err) {
    console.warn('Reverse geocode error:', err);
    return 'J J R Nagar, Bengaluru';
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
