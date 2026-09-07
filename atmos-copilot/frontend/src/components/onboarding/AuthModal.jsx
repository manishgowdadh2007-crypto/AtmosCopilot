import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, Lock, User, Mail, Phone, ArrowRight, CheckCircle2, KeyRound, Send } from 'lucide-react';
import { registerUser, loginUser, resetPassword, requestPhoneOtp } from '../../services/api';

export default function AuthModal({ onAuthorized }) {
  const [mode, setMode] = useState('signup'); // 'signup' | 'login' | 'forgot'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    newPassword: '',
    otp: ''
  });
  
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [errorPopup, setErrorPopup] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setInterval(() => setOtpCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      if (/^[a-zA-Z\s]*$/.test(value)) setFormData(prev => ({ ...prev, [name]: value }));
    } else if (name === 'phone' || name === 'otp') {
      const maxLen = name === 'phone' ? 10 : 6;
      if (new RegExp(`^\\d{0,${maxLen}}$`).test(value)) setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorPopup('');
    setSuccessMsg('');
    setOtpSent(false);
  };

  const handleSendOtp = async () => {
    setErrorPopup('');
    setSuccessMsg('');
    if (formData.phone.length !== 10) {
      setErrorPopup("Enter a valid 10-digit mobile number before requesting an OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await requestPhoneOtp(formData.phone, mode);
      setOtpSent(true);
      setOtpCooldown(60);
      setSuccessMsg(res.test_otp ? `OTP Dispatched! (Dev Code: ${res.test_otp})` : "OTP dispatched to your phone.");
    } catch (err) {
      setErrorPopup(err.message || "Failed to dispatch verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorPopup('');
    setSuccessMsg('');

    if (formData.phone.length !== 10) {
      setErrorPopup("Mobile contact must be strictly 10 numerical digits.");
      return;
    }

    if ((mode === 'signup' || mode === 'forgot') && formData.otp.length !== 6) {
      setErrorPopup("Please enter the 6-digit verification OTP.");
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await registerUser(formData);
        const userData = {
          ...res.user,
          lastLoginDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          lastLoginTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
        onAuthorized(null, userData);
      } else if (mode === 'login') {
        const res = await loginUser({
          identifier: formData.email,
          phone: formData.phone,
          password: formData.password
        });
        const userData = {
          ...res.user,
          lastLoginDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          lastLoginTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
        onAuthorized(null, userData);
      } else if (mode === 'forgot') {
        await resetPassword({
          identifier: formData.email,
          phone: formData.phone,
          new_password: formData.newPassword,
          otp: formData.otp
        });
        setSuccessMsg("Password reset successfully! Teleporting to Login...");
        setTimeout(() => switchMode('login'), 1800);
      }
    } catch (err) {
      setErrorPopup(err.message || "Authentication exception encountered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030610]/80 backdrop-blur-xl p-4 font-sans select-none">
      <div className="w-full max-w-md bg-[#0b101d]/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Header Icon & Title */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
            {mode === 'forgot' ? <KeyRound className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'signup' ? "Initialize Telemetry Node" : mode === 'login' ? "Access Telemetry Node" : "Reset Access Credentials"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'signup' ? "Mobile OTP-verified operator onboarding." : mode === 'login' ? "Authenticate registered terminal credentials." : "Verify mobile OTP to unlock password reset."}
          </p>
        </div>

        {/* Tab Switcher */}
        {mode !== 'forgot' && (
          <div className="flex bg-[#050811] p-1 rounded-2xl border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signup' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up (OTP Verified)
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                mode === 'login' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              Log In Node
            </button>
          </div>
        )}

        {errorPopup && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-rose-200 font-medium">{errorPopup}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-emerald-200 font-medium">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">OPERATOR NAME (WORDS ONLY)</label>
              <div className="flex items-center gap-2.5 bg-[#050811] border border-slate-700/80 px-3.5 py-2.5 rounded-xl focus-within:border-amber-400">
                <User className="w-4 h-4 text-slate-400" />
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

          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">
              {mode === 'signup' ? "VALID EMAIL ADDRESS" : "REGISTERED EMAIL OR NAME"}
            </label>
            <div className="flex items-center gap-2.5 bg-[#050811] border border-slate-700/80 px-3.5 py-2.5 rounded-xl focus-within:border-amber-400">
              <Mail className="w-4 h-4 text-slate-400" />
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

          {/* Mobile + OTP trigger button */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">MOBILE NUMBER (10 DIGITS)</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-[#050811] border border-slate-700/80 px-3.5 py-2.5 rounded-xl focus-within:border-amber-400">
                <Phone className="w-4 h-4 text-slate-400" />
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
              {(mode === 'signup' || mode === 'forgot') && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || otpCooldown > 0}
                  className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold whitespace-nowrap transition disabled:opacity-50"
                >
                  {otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? "Resend" : "Send OTP"}
                </button>
              )}
            </div>
          </div>

          {/* OTP Input Field */}
          {(mode === 'signup' || mode === 'forgot') && (
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">6-DIGIT SMS VERIFICATION CODE</label>
              <div className="flex items-center gap-2.5 bg-[#050811] border border-slate-700/80 px-3.5 py-2.5 rounded-xl focus-within:border-amber-400">
                <Send className="w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  className="w-full bg-transparent text-xs text-white font-mono tracking-widest outline-none"
                />
              </div>
            </div>
          )}

          {/* Password fields */}
          {mode !== 'forgot' ? (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-mono text-slate-400">PASSWORD (MIN 6 CHARS)</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[10px] text-amber-400 hover:text-amber-300"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2.5 bg-[#050811] border border-slate-700/80 px-3.5 py-2.5 rounded-xl focus-within:border-amber-400">
                <Lock className="w-4 h-4 text-slate-400" />
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
          ) : (
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">NEW PASSWORD (MIN 6 CHARS)</label>
              <div className="flex items-center gap-2.5 bg-[#050811] border border-slate-700/80 px-3.5 py-2.5 rounded-xl focus-within:border-amber-400">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  minLength={6}
                  required
                  className="w-full bg-transparent text-xs text-white outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/25 disabled:opacity-60"
          >
            <span>
              {loading
                ? "Verifying Telemetry Access..."
                : mode === 'signup'
                ? "Verify OTP & Complete Sign Up"
                : mode === 'login'
                ? "Verify & Teleport to Dashboard"
                : "Verify OTP & Reset Password"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-3.5 border-t border-slate-800 text-center">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-xs text-amber-400 font-semibold hover:underline"
            >
              ← Back to Log In
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">
              {mode === 'signup' ? "Already registered on this node? " : "New operator terminal? "}
              <button
                type="button"
                onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
                className="text-amber-400 font-semibold hover:underline ml-1"
              >
                {mode === 'signup' ? "Log In" : "Sign Up"}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
