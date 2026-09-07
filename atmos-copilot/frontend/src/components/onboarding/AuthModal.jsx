import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Lock, User, Mail, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { registerUser, loginUser } from '../../services/api';

export default function AuthModal({ onAuthorized }) {
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [errorPopup, setErrorPopup] = useState('');
  const [loading, setLoading] = useState(false);

  // Field change handler with strict input sanitization
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      // Strictly letters and spaces only
      if (/^[a-zA-Z\s]*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'phone') {
      // Strictly digits, max 10 digits
      if (/^\d{0,10}$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    setErrorPopup('');

    if (mode === 'signup') {
      if (!formData.name.trim()) {
        setErrorPopup("Operator Name can only contain words (letters and spaces).");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setErrorPopup("Please provide a valid email address (e.g. name@domain.com).");
        return false;
      }
    }

    if (formData.phone.length !== 10) {
      setErrorPopup("Mobile contact must be strictly 10 numerical digits.");
      return false;
    }

    if (formData.password.length < 6) {
      setErrorPopup("Password must contain a minimum of 6 characters.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorPopup('');

    try {
      if (mode === 'signup') {
        const res = await registerUser(formData);
        const userData = {
          ...res.user,
          lastLoginDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          lastLoginTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
        // Persist locally for device session recovery
        localStorage.setItem(`user_${formData.email}`, JSON.stringify(formData));
        onAuthorized(null, userData);
      } else {
        // Login mode
        let userData;
        try {
          const res = await loginUser({
            identifier: formData.email, // can be email or name
            phone: formData.phone,
            password: formData.password
          });
          userData = res.user;
        } catch (apiErr) {
          // Check local client storage mirror if backend database is sleeping
          const stored = localStorage.getItem(`user_${formData.email}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.phone === formData.phone && parsed.password === formData.password) {
              userData = parsed;
            } else {
              throw new Error("Credentials do not match. Verify your Mobile number and Password.");
            }
          } else {
            throw apiErr;
          }
        }

        userData = {
          ...userData,
          lastLoginDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          lastLoginTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
        onAuthorized(null, userData);
      }
    } catch (err) {
      setErrorPopup(err.message || "Authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030610]/80 backdrop-blur-xl p-4 font-sans select-none">
      <div className="w-full max-w-md bg-[#0b101d]/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {mode === 'signup' ? "Initialize Telemetry Node" : "Access Telemetry Node"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'signup' 
              ? "Register valid operator credentials to unlock feeds." 
              : "Authenticate registered credentials to resume observation."}
          </p>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex bg-[#050811] p-1 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorPopup(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'signup' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account (Sign Up)
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorPopup(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'login' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In Node
          </button>
        </div>

        {/* Error Popup Alert */}
        {errorPopup && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 animate-pulse">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 leading-relaxed font-medium">
              {errorPopup}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">OPERATOR NAME (WORDS ONLY)</label>
              <div className="flex items-center gap-2.5 bg-[#050811] border border-slate-700/80 px-3.5 py-2.5 rounded-xl focus-within:border-amber-400 transition">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Manish Gowda"
                  required
                  className="w-full bg-transparent text-xs text-white outline-none"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              {mode === 'signup' ? "VALID EMAIL ADDRESS" : "REGISTERED EMAIL OR NAME"}
            </label>
            <div className="flex items-center gap-2.5 bg-[#050811] border border-slate-700/80 px-3.5 py-2.5 rounded-xl focus-within:border-amber-400 transition">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@domain.com"
                required
                className="w-full bg-transparent text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Mobile Number (Strict 10 Digits) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-mono text-slate-400">MOBILE CONTACT (EXACT 10 DIGITS)</label>
              <span className="text-[10px] font-mono text-slate-500">{formData.phone.length}/10</span>
            </div>
            <div className="flex items-center gap-2.5 bg-[#050811] border border-slate-700/80 px-3.5 py-2.5 rounded-xl focus-within:border-amber-400 transition">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-xs font-mono text-slate-400">+91</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                maxLength={10}
                required
                className="w-full bg-transparent text-xs text-white font-mono outline-none"
              />
            </div>
          </div>

          {/* Password (Min 6 Characters) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-mono text-slate-400">PASSWORD (MIN 6 CHARACTERS)</label>
              <span className="text-[10px] font-mono text-slate-500">{formData.password.length} chars</span>
            </div>
            <div className="flex items-center gap-2.5 bg-[#050811] border border-slate-700/80 px-3.5 py-2.5 rounded-xl focus-within:border-amber-400 transition">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                minLength={6}
                required
                className="w-full bg-transparent text-xs text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/25 disabled:opacity-60"
          >
            <span>{loading ? "Authenticating Node..." : mode === 'signup' ? "Complete Registration & Lock" : "Verify & Teleport to Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <span className="text-[11px] text-slate-500">
            {mode === 'signup' ? "Already registered on this node? " : "First time accessing this node? "}
            <button
              type="button"
              onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setErrorPopup(''); }}
              className="text-amber-400 font-semibold hover:underline ml-1"
            >
              {mode === 'signup' ? "Log In" : "Sign Up"}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
