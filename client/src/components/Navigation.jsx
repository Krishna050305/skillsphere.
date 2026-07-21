import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import NotificationBell from './common/NotificationBell.jsx';
import ThemeToggle from './common/ThemeToggle.jsx';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? 'font-bold'
        : ''
    }`;

  const linkStyle = (path) => ({
    color: isActive(path) ? 'var(--accent-primary)' : 'var(--text-secondary)',
  });

  return (
    <nav
      className="glass sticky top-0 z-50 px-6 py-3"
      style={{
        borderBottom: '1px solid var(--border-secondary)',
        boxShadow: 'var(--shadow-nav)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: 'var(--gradient-brand)' }}
          >
            <span className="text-xl font-black text-white font-display">S</span>
          </div>
          <div>
            <span
              className="text-xl font-bold tracking-tight font-display"
              style={{ color: 'var(--accent-primary)' }}
            >
              Skill
              <span style={{ color: 'var(--accent-secondary)' }}>Sphere</span>
            </span>
            <span
              className="text-[9px] block font-mono tracking-[0.2em] uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              Hyperlocal Freelance
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-5">
          <Link to="/" className={linkClass('/')} style={linkStyle('/')}>
            Dashboard
          </Link>

          {isAuthenticated && user && user.role === 'freelancer' && (
            <>
              <Link to="/gigs" className={linkClass('/gigs')} style={linkStyle('/gigs')}>
                Find Gigs
              </Link>
              <Link to="/recommended-gigs" className={linkClass('/recommended-gigs')} style={linkStyle('/recommended-gigs')}>
                AI Match
              </Link>
              <Link to="/freelancer/analytics" className={linkClass('/freelancer/analytics')} style={linkStyle('/freelancer/analytics')}>
                Analytics
              </Link>
            </>
          )}

          {isAuthenticated && user && user.role === 'client' && (
            <>
              <Link to="/gigs/post" className={linkClass('/gigs/post')} style={linkStyle('/gigs/post')}>
                Post Gig
              </Link>
              <Link to="/gigs" className={linkClass('/gigs')} style={linkStyle('/gigs')}>
                Marketplace
              </Link>
              <Link to="/payments/history" className={linkClass('/payments/history')} style={linkStyle('/payments/history')}>
                Payments
              </Link>
            </>
          )}

          {isAuthenticated && (
            <>
              <Link to="/messages" className={linkClass('/messages')} style={linkStyle('/messages')}>
                Messages
              </Link>
              <Link to="/disputes" className={linkClass('/disputes')} style={linkStyle('/disputes')}>
                Disputes
              </Link>
            </>
          )}

          {isAuthenticated && user && user.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              className={linkClass('/admin/dashboard')}
              style={linkStyle('/admin/dashboard')}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />

              {/* Profile Pill */}
              <Link
                to={`/profile/${user._id}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: 'var(--gradient-brand)' }}
                >
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-xs font-semibold hidden md:inline">
                  {user.name?.split(' ')[0]}
                </span>
                <span
                  className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full"
                  style={{
                    background: user.role === 'freelancer'
                      ? 'rgba(26, 107, 75, 0.1)'
                      : user.role === 'client'
                      ? 'rgba(201, 162, 39, 0.1)'
                      : 'rgba(220, 38, 38, 0.1)',
                    color: user.role === 'freelancer'
                      ? 'var(--brand-green)'
                      : user.role === 'client'
                      ? 'var(--brand-gold-dark)'
                      : 'var(--danger)',
                  }}
                >
                  {user.role}
                </span>
              </Link>

              <button
                onClick={handleSignOut}
                className="text-xs font-semibold py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)',
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-semibold py-2 px-5 rounded-xl transition-all duration-200"
                style={{
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--accent-primary)',
                }}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="btn-primary text-sm"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="lg:hidden mt-3 pt-3 pb-2 flex flex-col gap-2"
          style={{ borderTop: '1px solid var(--border-secondary)' }}
        >
          <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm py-2 px-3 rounded-lg" style={{ color: 'var(--text-primary)' }}>Dashboard</Link>
          {isAuthenticated && user && user.role === 'freelancer' && (
            <>
              <Link to="/gigs" onClick={() => setMobileOpen(false)} className="text-sm py-2 px-3 rounded-lg" style={{ color: 'var(--text-secondary)' }}>Find Gigs</Link>
              <Link to="/recommended-gigs" onClick={() => setMobileOpen(false)} className="text-sm py-2 px-3 rounded-lg" style={{ color: 'var(--text-secondary)' }}>AI Match</Link>
              <Link to="/freelancer/analytics" onClick={() => setMobileOpen(false)} className="text-sm py-2 px-3 rounded-lg" style={{ color: 'var(--text-secondary)' }}>Analytics</Link>
            </>
          )}
          {isAuthenticated && user && user.role === 'client' && (
            <>
              <Link to="/gigs/post" onClick={() => setMobileOpen(false)} className="text-sm py-2 px-3 rounded-lg" style={{ color: 'var(--text-secondary)' }}>Post Gig</Link>
              <Link to="/gigs" onClick={() => setMobileOpen(false)} className="text-sm py-2 px-3 rounded-lg" style={{ color: 'var(--text-secondary)' }}>Marketplace</Link>
              <Link to="/payments/history" onClick={() => setMobileOpen(false)} className="text-sm py-2 px-3 rounded-lg" style={{ color: 'var(--text-secondary)' }}>Payments</Link>
            </>
          )}
          {isAuthenticated && (
            <>
              <Link to="/messages" onClick={() => setMobileOpen(false)} className="text-sm py-2 px-3 rounded-lg" style={{ color: 'var(--text-secondary)' }}>Messages</Link>
              <Link to="/disputes" onClick={() => setMobileOpen(false)} className="text-sm py-2 px-3 rounded-lg" style={{ color: 'var(--text-secondary)' }}>Disputes</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
