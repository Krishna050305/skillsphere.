import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth.js';
import Navigation from '../components/Navigation.jsx';
import { 
  DollarSign, CheckCircle2, Star, Eye, Bot, MessageSquare, 
  BarChart3, User as UserIcon, ClipboardList, CreditCard, 
  PlusCircle, Scale 
} from 'lucide-react';

const API = 'http://localhost:5000/api';

function StatCard({ icon, label, value, accent, delay }) {
  return (
    <div className={`stat-card animate-fade-in-up-delay-${delay}`}>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ background: accent === 'gold' ? 'rgba(201,162,39,0.12)' : 'rgba(26,107,75,0.1)' }}
        >
          {icon}
        </div>
        <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <p className="text-3xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

function QuickAction({ to, icon, title, desc }) {
  return (
    <Link to={to} className="card p-5 flex items-start gap-4 group no-underline">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ background: 'rgba(26,107,75,0.08)' }}
      >
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h4>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
      </div>
    </Link>
  );
}

function GigCard({ gig }) {
  return (
    <Link to={`/gigs/${gig._id}`} className="card p-5 no-underline block">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
          {gig.title}
        </h4>
        <span className="badge badge-gold ml-2 flex-shrink-0">
          ${gig.budgetMax}
        </span>
      </div>
      <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-tertiary)' }}>
        {gig.description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {gig.requiredSkills?.slice(0, 3).map((s, i) => (
          <span key={i} className="badge badge-green text-[10px]">{s}</span>
        ))}
      </div>
    </Link>
  );
}

// ============================================================
// Freelancer Dashboard
// ============================================================
function FreelancerDashboard({ user }) {
  const token = sessionStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const { data: analytics } = useQuery({
    queryKey: ['freelancerAnalytics'],
    queryFn: async () => {
      const res = await axios.get(`${API}/analytics/freelancer`, { headers });
      return res.data;
    },
    retry: false,
  });

  const { data: recentGigs } = useQuery({
    queryKey: ['recentOpenGigs'],
    queryFn: async () => {
      const res = await axios.get(`${API}/gigs?status=open&limit=4`, { headers });
      return res.data?.gigs || [];
    },
    retry: false,
  });

  const fp = user.freelancerProfile || {};

  return (
    <>
      {/* Hero Welcome */}
      <div className="animate-fade-in-up mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>
              Welcome back, <span style={{ color: 'var(--accent-primary)' }}>{user.name?.split(' ')[0]}</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {fp.headline || 'Your freelance dashboard — manage gigs, track earnings, and grow your career.'}
            </p>
          </div>
          <Link to="/gigs" className="btn-primary flex items-center gap-2 text-sm no-underline whitespace-nowrap">
            🔍 Browse Gigs
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<DollarSign className="w-5 h-5 text-[var(--accent-secondary)]" />} label="Total Earnings" value={`$${fp.totalEarnings?.toLocaleString() || 0}`} accent="gold" delay={1} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)]" />} label="Completed Gigs" value={fp.completedGigs || 0} accent="green" delay={1} />
        <StatCard icon={<Star className="w-5 h-5 text-[var(--accent-secondary)]" />} label="Reputation" value={fp.reputationScore?.toFixed(1) || '—'} accent="gold" delay={2} />
        <StatCard icon={<Eye className="w-5 h-5 text-[var(--accent-primary)]" />} label="Profile Views" value={fp.profileViews || 0} accent="green" delay={2} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-3 animate-fade-in-up-delay-2">
          <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Quick Actions
          </h3>
          <QuickAction to="/recommended-gigs" icon={<Bot className="w-5 h-5 text-[var(--accent-primary)]" />} title="AI-Matched Gigs" desc="See gigs tailored to your skills" />
          <QuickAction to="/messages" icon={<MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />} title="Messages" desc="Chat with clients in real-time" />
          <QuickAction to="/freelancer/analytics" icon={<BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />} title="Analytics" desc="Revenue breakdown & ratings" />
          <QuickAction to={`/profile/${user._id}`} icon={<UserIcon className="w-5 h-5 text-[var(--accent-primary)]" />} title="My Profile" desc="Edit your public profile" />
        </div>

        {/* Recent Gigs */}
        <div className="lg:col-span-2 animate-fade-in-up-delay-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Recent Open Gigs
            </h3>
            <Link to="/gigs" className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>
              View All →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {(recentGigs || []).slice(0, 4).map((gig) => (
              <GigCard key={gig._id} gig={gig} />
            ))}
            {(!recentGigs || recentGigs.length === 0) && (
              <div className="col-span-2 text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <p className="text-sm">No open gigs available right now.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Client Dashboard
// ============================================================
function ClientDashboard({ user }) {
  const token = sessionStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const { data: myGigs } = useQuery({
    queryKey: ['clientGigs'],
    queryFn: async () => {
      const res = await axios.get(`${API}/gigs?clientId=${user._id}&limit=6`, { headers });
      return res.data?.gigs || [];
    },
    retry: false,
  });

  const cp = user.clientProfile || {};

  return (
    <>
      <div className="animate-fade-in-up mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>
              Welcome, <span style={{ color: 'var(--accent-secondary)' }}>{cp.companyName || user.name}</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Manage your posted gigs, track freelancer progress, and handle payments.
            </p>
          </div>
          <Link to="/gigs/post" className="btn-gold flex items-center gap-2 text-sm no-underline whitespace-nowrap">
            ＋ Post New Gig
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<ClipboardList className="w-5 h-5 text-[var(--accent-primary)]" />} label="Gigs Posted" value={cp.gigsPosted || 0} accent="green" delay={1} />
        <StatCard icon={<CreditCard className="w-5 h-5 text-[var(--accent-secondary)]" />} label="Total Spent" value={`$${cp.totalSpent?.toLocaleString() || 0}`} accent="gold" delay={1} />
        <StatCard icon={<BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />} label="Active Gigs" value={(myGigs || []).filter(g => g.status === 'assigned').length} accent="green" delay={2} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-[var(--accent-secondary)]" />} label="Completed" value={(myGigs || []).filter(g => g.status === 'completed').length} accent="gold" delay={2} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3 animate-fade-in-up-delay-2">
          <h3 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Quick Actions
          </h3>
          <QuickAction to="/gigs/post" icon={<PlusCircle className="w-5 h-5 text-[var(--accent-primary)]" />} title="Post a New Gig" desc="Find the perfect freelancer" />
          <QuickAction to="/messages" icon={<MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />} title="Messages" desc="Chat with your freelancers" />
          <QuickAction to="/payments/history" icon={<DollarSign className="w-5 h-5 text-[var(--accent-primary)]" />} title="Payment History" desc="Track all escrow payments" />
          <QuickAction to="/disputes" icon={<Scale className="w-5 h-5 text-[var(--accent-primary)]" />} title="Disputes" desc="Resolve any payment issues" />
        </div>

        <div className="lg:col-span-2 animate-fade-in-up-delay-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Your Gigs
            </h3>
            <Link to="/gigs" className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>
              View All →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {(myGigs || []).slice(0, 4).map((gig) => (
              <div key={gig._id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-bold line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {gig.title}
                  </h4>
                  <span className={`badge text-[10px] ml-2 flex-shrink-0 ${gig.status === 'completed' ? 'badge-gold' : 'badge-green'}`}>
                    {gig.status}
                  </span>
                </div>
                <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  {gig.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent-secondary)' }}>
                    ${gig.budgetMax}
                  </span>
                  <Link to={`/gigs/${gig._id}`} className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>
                    View →
                  </Link>
                </div>
              </div>
            ))}
            {(!myGigs || myGigs.length === 0) && (
              <div className="col-span-2 text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <p className="text-sm">You haven't posted any gigs yet.</p>
                <Link to="/gigs/post" className="btn-primary mt-4 inline-block text-xs no-underline">Post Your First Gig</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Main Dashboard Page
// ============================================================
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'freelancer' && (!user.freelancerProfile?.headline || !user.freelancerProfile?.bio)) {
        navigate('/onboarding');
      } else if (user.role === 'client' && !user.clientProfile?.companyName) {
        navigate('/onboarding');
      }
    }
  }, [user, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Navigation />
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        {user?.role === 'freelancer' && <FreelancerDashboard user={user} />}
        {user?.role === 'client' && <ClientDashboard user={user} />}
        {user?.role === 'admin' && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-extrabold font-display mb-4" style={{ color: 'var(--text-primary)' }}>
              Admin Dashboard
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
              Head to the full admin panel for analytics, user management, and fraud detection.
            </p>
            <Link to="/admin/dashboard" className="btn-primary inline-block no-underline">
              Open Admin Panel →
            </Link>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)' }} className="py-6 text-center">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          © 2026 SkillSphere Hyperlocal Freelance Marketplace. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
