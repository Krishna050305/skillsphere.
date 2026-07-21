import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import ThemeToggle from '../components/common/ThemeToggle.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, error, loading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => { clearError(); setValidationError(''); }, [clearError]);
  useEffect(() => { if (isAuthenticated) navigate('/', { replace: true }); }, [isAuthenticated, navigate]);

  const params = new URLSearchParams(location.search);
  const isVerified = params.get('verified') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    if (!email || !password) { setValidationError('Please fill in all fields.'); return; }
    const res = await login(email, password);
    if (res.meta.requestStatus === 'fulfilled') {
      const user = res.payload.user;
      if (user.role === 'freelancer' && (!user.freelancerProfile?.headline || !user.freelancerProfile?.bio)) navigate('/onboarding');
      else if (user.role === 'client' && !user.clientProfile?.companyName) navigate('/onboarding');
      else navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Brand Panel */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-secondary)' }}>
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'var(--gradient-brand)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: 'var(--gradient-gold)' }} />

        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'var(--gradient-brand)' }}>
            <span className="text-xl font-black text-white font-display">S</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight font-display" style={{ color: 'var(--accent-primary)' }}>
              Skill<span style={{ color: 'var(--accent-secondary)' }}>Sphere</span>
            </span>
            <span className="text-[9px] block font-mono tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)' }}>
              Hyperlocal Freelance
            </span>
          </div>
        </div>

        <div className="my-auto relative z-10 max-w-lg">
          <span className="text-xs uppercase font-mono tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(26,107,75,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(26,107,75,0.2)' }}>
            Secure Escrow Engine
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mt-6 leading-tight font-display" style={{ color: 'var(--text-primary)' }}>
            Connect locally.<br />
            Collaborate{' '}
            <span style={{ color: 'var(--accent-secondary)' }}>globally.</span>
          </h1>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            SkillSphere is the premium marketplace linking elite developers, writers, and designers with clients seeking verified skills. Track work with milestones, protect budgets with secure escrows, and leverage AI job matching.
          </p>
        </div>

        <div className="text-xs font-mono relative z-10" style={{ color: 'var(--text-muted)' }}>
          © 2026 SkillSphere. All rights reserved.
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-16">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <div className="w-full max-w-md">
          <div className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight font-display" style={{ color: 'var(--text-primary)' }}>Welcome Back</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Sign in to manage your active milestones and proposals.
            </p>
          </div>

          {isVerified && (
            <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
              <span style={{ color: 'var(--success)' }}>✓</span>
              <div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Email Verified</h4>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Your account is active. Log in to start.</p>
              </div>
            </div>
          )}

          {(error || validationError) && (
            <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
              <span>⚠️</span>
              <div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>Authentication Error</h4>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{error || validationError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs uppercase font-mono tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <input
                id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 outline-none transition-all text-sm"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs uppercase font-mono tracking-wider" style={{ color: 'var(--text-muted)' }}>Password</label>
                <Link to="/forgot-password" className="text-xs font-mono" style={{ color: 'var(--accent-primary)' }}>Forgot Password?</Link>
              </div>
              <input
                id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 outline-none transition-all text-sm"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: 'var(--text-tertiary)' }}>
            New to SkillSphere?{' '}
            <Link to="/register" className="font-semibold" style={{ color: 'var(--accent-primary)' }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
