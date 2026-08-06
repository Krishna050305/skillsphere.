import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { IconUser, IconBriefcase, IconCheck, IconAlert, IconSend } from '../components/icons';
import { useAuth } from '../hooks/useAuth.js';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { register, isAuthenticated, error, loading, clearError } = useAuth();

  const roleParam = searchParams.get('role');
  const currentRole = (roleParam === 'freelancer' || roleParam === 'client') ? roleParam : null;

  // Local component state for role selection in Step 1
  const [selectedRole, setSelectedRole] = useState(currentRole || null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Clear errors when navigating away or changing role
  useEffect(() => {
    clearError();
    setValidationError('');
  }, [clearError, currentRole]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Keep selectedRole synced if URL query param changes
  useEffect(() => {
    if (currentRole) {
      setSelectedRole(currentRole);
    } else {
      setSelectedRole(null);
    }
  }, [currentRole]);

  const handleSelectAndProceed = (role) => {
    setSelectedRole(role);
    setSearchParams({ role });
  };

  const handleCardClick = (role) => {
    setSelectedRole(role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const activeRole = currentRole || selectedRole;

    if (!name || !email || !password || !activeRole) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    // Client-side password complexity checks matching model requirements
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }
    if (!passwordRegex.test(password)) {
      setValidationError(
        'Password must contain at least one uppercase letter, one number, and one special character.'
      );
      return;
    }

    if (phone) {
      const phoneRegex = /^[+]?[\d\s\-()]{7,15}$/;
      if (!phoneRegex.test(phone)) {
        setValidationError('Please enter a valid phone number (7 to 15 digits).');
        return;
      }
    }

    const payload = {
      name,
      email,
      password,
      role: activeRole,
      phone: phone || undefined,
    };

    const res = await register(payload);
    if (res.meta.requestStatus === 'fulfilled') {
      setIsSuccess(true);
    }
  };

  // STEP 1 — Role Selection Screen (shown first, when no valid role param is in URL)
  if (!currentRole) {
    return (
      <div className="min-h-screen flex flex-col justify-between p-6 md:p-12 relative overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        {/* Background glow effects matching brand theme */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: 'var(--gradient-brand)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: 'var(--gradient-gold)' }} />

        {/* Top Header / Branding */}
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'var(--gradient-brand)' }}>
              <span className="text-xl font-black text-white font-display">S</span>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight font-display" style={{ color: 'var(--accent-primary)' }}>
                Skill<span style={{ color: 'var(--accent-secondary)' }}>Sphere</span>
              </span>
              <span className="text-[9px] block font-mono tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>Hyperlocal Freelance</span>
            </div>
          </div>
          <Link to="/login" className="text-xs font-mono tracking-wider uppercase hover:underline" style={{ color: 'var(--text-tertiary)' }}>
            Log in →
          </Link>
        </div>

        {/* Main Step 1 Role Selection Content */}
        <div className="my-auto py-8 w-full max-w-4xl mx-auto relative z-10 text-center">
          <span className="text-xs uppercase font-mono tracking-widest px-3.5 py-1 rounded-full inline-block mb-4" style={{ background: 'rgba(26,107,75,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(26,107,75,0.2)' }}>
            Step 1 of 2 — Account Type
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>
            How do you plan to use <span style={{ color: 'var(--accent-primary)' }}>Skill</span><span style={{ color: 'var(--accent-secondary)' }}>Sphere</span>?
          </h1>
          <p className="mt-3 text-sm md:text-base max-w-xl mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Select your primary role to customize your workspace experience.
          </p>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 text-left">
            {/* Card 1 — Freelancer */}
            <div
              onClick={() => handleCardClick('freelancer')}
              className="relative rounded-2xl p-6 md:p-8 cursor-pointer transition-all duration-300 flex flex-col justify-between group"
              style={{
                background: selectedRole === 'freelancer' ? 'var(--bg-tertiary)' : 'var(--bg-card)',
                border: selectedRole === 'freelancer' ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                boxShadow: selectedRole === 'freelancer' ? '0 12px 35px rgba(26,107,75,0.15)' : 'var(--shadow-card)',
              }}
            >
              {/* Checkmark Badge */}
              <div className="absolute top-5 right-5">
                {selectedRole === 'freelancer' ? (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md animate-fade-in-up" style={{ background: 'var(--accent-primary)' }}>
                    <IconCheck className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 group-hover:border-slate-400"></div>
                )}
              </div>

              <div>
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md transition-transform group-hover:scale-105" style={{ background: 'rgba(26,107,75,0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(26,107,75,0.2)' }}>
                  <IconUser className="w-7 h-7" />
                </div>

                {/* Headline & Subtitle */}
                <h2 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                  I'm a Freelancer
                </h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  Offer your skills, find local gigs, and grow your reputation
                </p>

                {/* Bullets */}
                <ul className="mt-6 space-y-3 text-xs md:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'rgba(26,107,75,0.15)', color: 'var(--accent-primary)' }}>✓</span>
                    Find hyperlocal gigs
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'rgba(26,107,75,0.15)', color: 'var(--accent-primary)' }}>✓</span>
                    Build a verified portfolio
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'rgba(26,107,75,0.15)', color: 'var(--accent-primary)' }}>✓</span>
                    Get paid via secure milestones
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAndProceed('freelancer');
                }}
                className={`mt-8 w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  selectedRole === 'freelancer'
                    ? 'btn-primary shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>Continue as Freelancer</span>
                <span className="text-lg">→</span>
              </button>
            </div>

            {/* Card 2 — Client */}
            <div
              onClick={() => handleCardClick('client')}
              className="relative rounded-2xl p-6 md:p-8 cursor-pointer transition-all duration-300 flex flex-col justify-between group"
              style={{
                background: selectedRole === 'client' ? 'var(--bg-tertiary)' : 'var(--bg-card)',
                border: selectedRole === 'client' ? '2px solid var(--accent-secondary)' : '1px solid var(--border-primary)',
                boxShadow: selectedRole === 'client' ? '0 12px 35px rgba(201,162,39,0.15)' : 'var(--shadow-card)',
              }}
            >
              {/* Checkmark Badge */}
              <div className="absolute top-5 right-5">
                {selectedRole === 'client' ? (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-slate-900 text-xs font-bold shadow-md animate-fade-in-up" style={{ background: 'var(--accent-secondary)' }}>
                    <IconCheck className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 group-hover:border-slate-400"></div>
                )}
              </div>

              <div>
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md transition-transform group-hover:scale-105" style={{ background: 'rgba(201,162,39,0.12)', color: 'var(--accent-secondary)', border: '1px solid rgba(201,162,39,0.2)' }}>
                  <IconBriefcase className="w-7 h-7" />
                </div>

                {/* Headline & Subtitle */}
                <h2 className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                  I'm a Client
                </h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  Post projects, hire verified local talent, and pay securely
                </p>

                {/* Bullets */}
                <ul className="mt-6 space-y-3 text-xs md:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'rgba(201,162,39,0.15)', color: 'var(--accent-secondary)' }}>✓</span>
                    Post gigs instantly
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'rgba(201,162,39,0.15)', color: 'var(--accent-secondary)' }}>✓</span>
                    AI-matched candidates
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'rgba(201,162,39,0.15)', color: 'var(--accent-secondary)' }}>✓</span>
                    Milestone-based payments
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAndProceed('client');
                }}
                className={`mt-8 w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  selectedRole === 'client'
                    ? 'btn-gold shadow-lg shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>Continue as Client</span>
                <span className="text-lg">→</span>
              </button>
            </div>
          </div>

          {/* Already have an account link visible on Step 1 */}
          <p className="text-center text-sm mt-8" style={{ color: 'var(--text-tertiary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
              Log in
            </Link>
          </p>
        </div>

        {/* Footer Credit */}
        <div className="text-center text-xs font-mono relative z-10" style={{ color: 'var(--text-muted)' }}>
          © 2026 SkillSphere. All rights reserved.
        </div>
      </div>
    );
  }

  // STEP 2 — Registration Form (shown when role is selected)
  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Brand Panel */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-secondary)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'var(--gradient-brand)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: 'var(--gradient-gold)' }} />

        {/* Top Branding */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'var(--gradient-brand)' }}>
            <span className="text-xl font-black text-white font-display">S</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight font-display" style={{ color: 'var(--accent-primary)' }}>
              Skill<span style={{ color: 'var(--accent-secondary)' }}>Sphere</span>
            </span>
            <span className="text-[9px] block font-mono tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>Hyperlocal Freelance</span>
          </div>
        </div>

        {/* Marketing Tagline */}
        <div className="my-auto relative z-10 max-w-lg">
          <span className="text-xs uppercase font-mono tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(26,107,75,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(26,107,75,0.2)' }}>
            Smart Matching
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mt-6 leading-tight font-display" style={{ color: 'var(--text-primary)' }}>
            Discover verified<br />
            local{' '}
            <span style={{ color: 'var(--accent-secondary)' }}>experts.</span>
          </h1>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            Create an account to browse hyperlocal talent, create custom agreements, negotiate milestones, and interact via real-time sockets. Everything you need to complete projects securely is built right in.
          </p>
        </div>

        {/* Footer Credit */}
        <div className="text-xs font-mono relative z-10" style={{ color: 'var(--text-muted)' }}>
          © 2026 SkillSphere. All rights reserved.
        </div>
      </div>

      {/* Form Panel - Right side */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-16">
        <div className="w-full max-w-md">
          {isSuccess ? (
            /* Success State */
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-3xl text-emerald-400 mb-6 animate-bounce">
                ✉
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight font-display">Check your email</h2>
              <p className="text-slate-400 mt-4 leading-relaxed">
                We've sent a verification link to <span className="text-indigo-400 font-semibold">{email}</span>.
                Please verify your email address to activate your account.
              </p>
              <div className="mt-8 space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left text-xs text-slate-500 font-mono">
                  <span className="text-indigo-400 font-bold block mb-1">Developer Tip:</span>
                  Since we are in development mode, check your server terminal console to view the sent verification email with the link!
                </div>
                <Link
                  to="/login"
                  className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/30 w-full text-center"
                >
                  Proceed to Login
                </Link>
              </div>
            </div>
          ) : (
            /* Standard Registration Form */
            <>
              {/* Selected Role Badge / Pill at Top of Form */}
              <div className="flex items-center justify-between p-3.5 rounded-xl mb-6" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Role:</span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={
                      currentRole === 'client'
                        ? { background: 'rgba(201, 162, 39, 0.15)', color: 'var(--accent-secondary)', border: '1px solid rgba(201, 162, 39, 0.3)' }
                        : { background: 'rgba(26, 107, 75, 0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(26, 107, 75, 0.3)' }
                    }
                  >
                    <span className={`w-2 h-2 rounded-full ${currentRole === 'client' ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse`}></span>
                      Registering as {currentRole === 'client' ? 'Client' : 'Freelancer'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="text-xs font-semibold hover:underline transition-colors"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Change
                </button>
              </div>

              {/* Header */}
              <div className="text-center md:text-left mb-6">
                <h2 className="text-3xl font-extrabold tracking-tight font-display">Create Account</h2>
                <p className="text-slate-400 mt-2 text-sm">
                  Complete your details below to set up your {currentRole === 'client' ? 'Client' : 'Freelancer'} profile.
                </p>
              </div>

              {/* Error Banner */}
              {(error || validationError) && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                  <span className="text-rose-400 text-lg">⚠️</span>
                  <div>
                    <h4 className="text-sm font-semibold text-rose-300">Registration Error</h4>
                    <p className="text-xs text-slate-400 mt-1">{error || validationError}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-2">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 outline-none transition-all text-sm"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 outline-none transition-all text-sm"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    placeholder="you@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 outline-none transition-all text-sm"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    placeholder="+91 9876543210"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-2">
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 outline-none transition-all text-sm"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    placeholder="Minimum 8 characters"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
                    Must include: 8+ chars, 1 uppercase letter, 1 number, and 1 special symbol.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Register Account'
                  )}
                </button>

                {/* Social Divider */}
                <div className="relative flex py-2 items-center">
                  <div className="grow border-t border-slate-800"></div>
                  <span className="shrink mx-4 text-slate-500 text-xs font-mono uppercase tracking-widest">Or</span>
                  <div className="grow border-t border-slate-800"></div>
                </div>

                {/* Google OAuth (Stub) */}
                <div className="relative group w-full">
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 font-medium cursor-not-allowed opacity-80 hover:bg-slate-800/20 transition-all duration-300 relative border-dashed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A5.94 5.94 0 018.05 11.59a5.94 5.94 0 015.94-5.94c2.443 0 4.47 1.06 5.8 2.23l2.38-2.38A9.878 9.878 0 0013.99 2c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.59-4.05 9.59-9.76 0-.6-.05-1.25-.16-1.95H12.24z" />
                    </svg>
                    <span>Continue with Google</span>
                    <span className="ml-2 text-[9px] uppercase font-mono tracking-wider bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      Planned
                    </span>
                  </button>
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-indigo-500/30 text-indigo-300 text-xs px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 shadow-xl whitespace-nowrap z-10 font-medium font-mono">
                    Coming soon
                  </div>
                </div>
              </form>

              {/* Footer link */}
              <p className="text-center text-sm text-slate-400 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

