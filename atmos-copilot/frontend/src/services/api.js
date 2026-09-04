const BASE_URL = 'http://localhost:8000/api';

export const registerUser = async (userData) => {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error('Registration failed');
  return res.json();
};

export const fetchWeatherTelemetry = async (lat, lon) => {
  const res = await fetch(`${BASE_URL}/weather-telemetry?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error('Telemetry retrieval failed');
  return res.json();
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