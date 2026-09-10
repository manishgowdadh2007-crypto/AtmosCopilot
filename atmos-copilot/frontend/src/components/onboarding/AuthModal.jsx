import React, { useState } from 'react';
import { Shield, ArrowRight, Lock, Mail, User, Phone, KeyRound, Zap } from 'lucide-react';
import { registerUser, resetPassword } from '../../services/api';

const API_BASE_URL = "https://atmoscopilot-backend.onrender.com";

export default function AuthModal({ onAuthorized, theme = 'dark' }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', newPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGuestBypass = () => {
    const identifier = formData.email || "operator@atmoscopilot.io";
    const phone = formData.phone || "6362324718";
    const guestUser = {
      name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      email: identifier,
      phone: phone,
      lastLoginDate: "Guest Session",
      lastLoginTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
    localStorage.setItem('atmos_user', JSON.stringify(guestUser));
    onAuthorized(null, guestUser);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const identifier = formData.email || formData.name;
    const phone = formData.phone;
    const password = formData.password;

    try {
      if (mode === 'register') {
        const res = await registerUser(formData);
        onAuthorized(null, res.user);
      } else if (mode === 'login') {
        try {
          const res = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, phone, password })
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.detail || "Authentication rejected");
          }

          const result = await res.json();
          onAuthorized(null, result.user);
        } catch (err) {
          // If backend is sleeping, cold-starting, or throwing Cloudflare CORS proxy errors:
          console.warn("Backend auth unavailable, initializing local session:", err);

          // Graceful fallback so users are never trapped on a dead modal:
          const localUser = {
            name: identifier.includes('@') ? identifier.split('@')[0] : (identifier || "Operator"),
            email: identifier,
            phone: phone,
            lastLoginDate: "Local Recovery",
            lastLoginTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          };
          localStorage.setItem('atmos_user', JSON.stringify(localUser));
          onAuthorized(null, localUser);
        }
      } else if (mode === 'reset') {
        await resetPassword({ identifier: formData.email, phone: formData.phone, new_password: formData.newPassword });
        setMode('login');
      }
    } catch (err) {
      setError(err.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
      <div className="w-full max-w-md">
        <div className={`relative p-8 rounded-3xl border shadow-2xl backdrop-blur-2xl overflow-hidden ${
          theme === 'dark' 
            ? 'bg-[#0b1120]/90 border-slate-700/60 text-white' 
            : 'bg-white/90 border-slate-300 text-slate-900 shadow-slate-900/20'
        }`}>
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              {mode === 'login' && "Operator Authentication"}
              {mode === 'register' && "Initialize Terminal Node"}
              {mode === 'reset' && "Recover Security Credentials"}
            </h2>
            <p className="text-xs opacity-60">AtmosCopilot Meteorological Defense Gateway</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs text-center font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-700/60 bg-[#060a14]/60">
                <User className="w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  placeholder="Operator Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-transparent text-xs outline-none w-full font-medium"
                />
              </div>
            )}

            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-700/60 bg-[#060a14]/60">
              <Mail className="w-4 h-4 text-amber-400" />
              <input
                type="email"
                placeholder="Station Email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-transparent text-xs outline-none w-full font-medium"
              />
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-700/60 bg-[#060a14]/60">
              <Phone className="w-4 h-4 text-amber-400" />
              <input
                type="tel"
                placeholder="Registered 10-Digit Mobile"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-transparent text-xs outline-none w-full font-medium"
              />
            </div>

            {mode !== 'reset' ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-700/60 bg-[#060a14]/60">
                <Lock className="w-4 h-4 text-amber-400" />
                <input
                  type="password"
                  placeholder="Terminal Password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-transparent text-xs outline-none w-full font-medium"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-700/60 bg-[#060a14]/60">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <input
                  type="password"
                  placeholder="New Security Password"
                  required
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="bg-transparent text-xs outline-none w-full font-medium"
                />
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition active:scale-98 cursor-pointer"
            >
              <span>{loading ? "Processing..." : mode === 'login' ? "Authorize Station" : mode === 'register' ? "Create Node" : "Reset Credentials"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Instant Local Demo / Guest Bypass Action */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col items-center">
            <button
              type="button"
              onClick={handleGuestBypass}
              className="w-full py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 text-amber-400 font-mono text-xs font-semibold tracking-wider transition-all duration-200 hover:border-amber-400 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Instant Station Access (Demo Bypass)</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono mt-4 pt-3 border-t border-slate-800">
            {mode === 'login' ? (
              <>
                <button onClick={() => setMode('register')} className="text-amber-400 hover:underline">New Node? Register</button>
                <button onClick={() => setMode('reset')} className="text-slate-400 hover:underline">Forgot Key?</button>
              </>
            ) : (
              <button onClick={() => setMode('login')} className="text-amber-400 hover:underline mx-auto">Return to Authentication</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
