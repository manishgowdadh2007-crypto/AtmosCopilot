import React, { useState } from 'react';
import { ShieldCheck, User, Mail, Phone, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthModal({ onAuthorized, theme = 'dark' }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Registration States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Login States
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or Mobile
  const [loginPassword, setLoginPassword] = useState('');

  // Feedback Notification
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Retrieve user database from storage
  const getRegisteredUsers = () => {
    try {
      const stored = localStorage.getItem('atmos_user_registry');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setErrorNotice('All credentials (Name, Mobile, Email, Password) are mandatory.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const users = getRegisteredUsers();

    // Check whether user credentials match existing registered records
    const duplicate = users.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.phone.replace(/\D/g, '') === cleanPhone
    );

    if (duplicate) {
      setErrorNotice('Account already exists with this Email or Mobile Number. Please Log In.');
      return;
    }

    const now = new Date();
    const newUser = {
      id: 'opr_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: password, // For client-side storage demo
      lastLoginDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastLoginTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };

    const updatedRegistry = [...users, newUser];
    localStorage.setItem('atmos_user_registry', JSON.stringify(updatedRegistry));

    setSuccessNotice('Registration verified. Teleporting to AtmosCopilot node...');
    setTimeout(() => {
      onAuthorized(null, newUser);
    }, 600);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorNotice('Please provide your registered Email or Mobile and Password.');
      return;
    }

    const cleanId = loginIdentifier.trim().toLowerCase();
    const cleanPhone = loginIdentifier.trim().replace(/\D/g, '');
    const users = getRegisteredUsers();

    // Find registered account matching either Email or Mobile
    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === cleanId || (cleanPhone.length > 5 && u.phone.replace(/\D/g, '') === cleanPhone)
    );

    if (!matchedUser) {
      setErrorNotice('No registered operator found matching these details. Please Register first.');
      return;
    }

    // Verify Password
    if (matchedUser.password !== loginPassword) {
      setErrorNotice('Invalid password authorization. Credentials do not match.');
      return;
    }

    const now = new Date();
    const authenticatedUser = {
      ...matchedUser,
      lastLoginDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastLoginTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };

    setSuccessNotice('Operator Authenticated. Connecting to telemetry grid...');
    setTimeout(() => {
      onAuthorized(null, authenticatedUser);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050811]/90 backdrop-blur-xl">
      <div className="w-full max-w-md rounded-3xl border border-slate-700/60 bg-[#0d1322]/95 p-6 sm:p-8 shadow-2xl relative">
        
        {/* Header Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Operator Authentication Node' : 'Register Operator Terminal'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            {mode === 'login' ? 'Enter verified credentials to access live core' : 'Create new operator credentials'}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {errorNotice && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 mb-5 text-xs font-mono">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorNotice(''); }}
            className={`py-2 rounded-xl transition ${mode === 'login' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorNotice(''); }}
            className={`py-2 rounded-xl transition ${mode === 'register' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Email or Mobile Number</label>
              <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-700 bg-slate-950/60 focus-within:border-amber-500 transition">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. operator@atmos.io or 6362324718"
                  className="bg-transparent text-xs text-white outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Security Password</label>
              <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-700 bg-slate-950/60 focus-within:border-amber-500 transition">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent text-xs text-white outline-none w-full"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Authenticate & Teleport</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Registration Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Operator Full Name</label>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-700 bg-slate-950/60 focus-within:border-amber-500 transition">
                <User className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Commander Apex"
                  className="bg-transparent text-xs text-white outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Mobile Contact Number</label>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-700 bg-slate-950/60 focus-within:border-amber-500 transition">
                <Phone className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 6362324718"
                  className="bg-transparent text-xs text-white outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Registered Operator Email</label>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-700 bg-slate-950/60 focus-within:border-amber-500 transition">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@atmoscopilot.io"
                  className="bg-transparent text-xs text-white outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Set Password</label>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-700 bg-slate-950/60 focus-within:border-amber-500 transition">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent text-xs text-white outline-none w-full"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Register & Enter Gateway</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
