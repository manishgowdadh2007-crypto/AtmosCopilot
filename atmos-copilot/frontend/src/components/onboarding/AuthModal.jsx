import React, { useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { registerUser } from '../../services/api';

export default function AuthModal({ onAuthorized }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    if (!navigator.geolocation) {
      setErrorMsg("Geolocation hardware is required for hyper-local forecasting.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // High-precision coordinates rounded to 6 decimals (sub-meter resolution)
        const coords = {
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lon: parseFloat(pos.coords.longitude.toFixed(6)),
          accuracy: pos.coords.accuracy
        };

        // Request Microphone Access
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
          console.warn("Microphone not approved, voice queries will be limited.");
        }

        // Store to backend SQLite database
        try {
          await registerUser({ ...formData, latitude: coords.lat, longitude: coords.lon });
        } catch (err) {
          console.warn("Continuing session offline:", err);
        }

        setIsLoading(false);
        onAuthorized(coords);
      },
      (err) => {
        console.warn("Precise GPS acquisition failed:", err);
        setErrorMsg("Precise location is mandatory: " + err.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Bypasses stale cached coordinates
      }
    );
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-4 text-white font-sans">
      <form onSubmit={handleSubmit} className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-5">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100">Access Telemetry Node</h2>
          <p className="text-xs text-slate-400 mt-1">Provide credentials to initialize live hyper-local observation feeds.</p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Full Name</label>
            <input 
              required 
              type="text" 
              placeholder="Arya Patel" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Email Address</label>
            <input 
              required 
              type="email" 
              placeholder="arya.patel@domain.in" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Mobile Contact</label>
            <input 
              required 
              type="tel" 
              placeholder="+91 9876543210" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-white"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-[11px] text-amber-200">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>Requires GPS coordinates and microphone access to power the live Sun AI Copilot.</span>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-amber-500 hover:opacity-90 font-semibold py-3.5 rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            "Authorize & Launch"
          )}
        </button>
      </form>
    </div>
  );
}
