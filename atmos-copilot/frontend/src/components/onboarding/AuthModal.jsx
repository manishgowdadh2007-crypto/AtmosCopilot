import React, { useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { registerUser } from '../../services/api';

export default function AuthModal({ onAuthorized }) {
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('atmos_user');
      return saved ? JSON.parse(saved) : { name: '', email: '', phone: '' };
    } catch {
      return { name: '', email: '', phone: '' };
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const now = new Date();
    const loginTimestamp = {
      date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      raw: now.toISOString()
    };

    const proceedWithCoords = async (accurateCoords) => {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        lastLoginDate: loginTimestamp.date,
        lastLoginTime: loginTimestamp.time,
      };

      // Store in device session
      localStorage.setItem('atmos_user', JSON.stringify(userData));

      try {
        await registerUser({ ...userData, latitude: accurateCoords.lat, longitude: accurateCoords.lon });
      } catch (err) {
        console.warn("Backend registration sync warning:", err);
      }

      setIsLoading(false);
      onAuthorized(accurateCoords, userData);
    };

    if (!navigator.geolocation) {
      proceedWithCoords({ lat: 12.9716, lon: 77.5946 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        proceedWithCoords({
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lon: parseFloat(pos.coords.longitude.toFixed(6)),
        });
      },
      () => {
        proceedWithCoords({ lat: 12.9716, lon: 77.5946 });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  return (
    <div className="h-screen w-screen bg-[#070a13] flex items-center justify-center p-4 text-white font-sans">
      <form onSubmit={handleSubmit} className="max-w-md w-full bg-[#0d1220] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-5">
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
              placeholder="e.g. Manish Gowda" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Email Address</label>
            <input 
              required 
              type="email" 
              placeholder="name@domain.com" 
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Mobile Contact</label>
            <input 
              required 
              type="tel" 
              placeholder="+91 9876543210" 
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-white"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-[11px] text-amber-200">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>Device satellite GPS is verified to lock hyper-local telemetry.</span>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-amber-500 hover:opacity-90 font-semibold py-3.5 rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-white"
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Authorize & Lock Telemetry"
          )}
        </button>
      </form>
    </div>
  );
}
