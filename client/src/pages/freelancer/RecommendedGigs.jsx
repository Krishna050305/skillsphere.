import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Navigation from '../../components/Navigation.jsx';
import { IconAlert, IconEmpty } from '../../components/icons';
import GigCard from '../../components/gigs/GigCard.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function RecommendedGigs() {
  const { user } = useAuth();

  const { data: recommendations, isLoading, isError, error } = useQuery({
    queryKey: ['recommendedGigs', user?._id],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/freelancers/${user._id}/recommended-gigs`, { headers });
      return res.data?.results || [];
    },
    enabled: !!user?._id,
  });

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navigation />

      <main className="max-w-6xl mx-auto px-6 py-12 flex-grow w-full space-y-8">
        <div>
          <h1 className="text-3xl font-black">AI Recommended Gigs</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Gigs matching your skill profile and travel coordinates, ranked by suitability.</p>
        </div>

        {/* Dashboard Widget */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 12, padding: 24 }}>
          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl p-6 h-60 animate-pulse flex flex-col justify-between" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}>
                  <div className="space-y-3">
                    <div className="h-6 w-3/4 rounded" style={{ background: 'var(--border-secondary)' }}></div>
                    <div className="h-4 w-1/2 rounded" style={{ background: 'var(--border-secondary)' }}></div>
                  </div>
                  <div className="h-10 rounded" style={{ background: 'var(--border-secondary)' }}></div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-10 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}>
              <IconAlert className="mx-auto mb-2" style={{ color: 'var(--accent-primary)' }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)', marginTop: 8 }}>Error Loading Recommendations</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: 6 }}>{error.message || 'Failed to fetch recommendations.'}</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}>
              <IconEmpty className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-md font-bold" style={{ color: 'var(--text-primary)', marginTop: 8 }}>No Personalized Matches Yet</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: 8, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>Make sure to add skills (like React, Node.js) and select your coordinates on your freelancer profile to unlock AI scoring.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {recommendations.map((rec) => (
                <div key={rec.gig._id} className="flex flex-col h-full relative">
                  {/* Detailed Match Indicator Meter */}
                  <div className="rounded-2xl p-6 flex-grow flex flex-col justify-between" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)' }}>
                    <GigCard gig={rec.gig} matchScore={rec.score} />
                    
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-secondary)' }}>
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recommendation Index</span>
                        <span style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>{Math.round(rec.score * 100)}% Match</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-secondary)', marginTop: 6 }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(rec.score * 100)}%`, background: 'linear-gradient(90deg, #6366f1, #a78bfa)' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        <p>© 2026 SkillSphere Hyperlocal Freelance Marketplace. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
