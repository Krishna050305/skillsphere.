import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Navigation from '../../components/Navigation.jsx';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navigation />

      <main className="max-w-6xl mx-auto px-6 py-12 flex-grow w-full space-y-8">
        <div>
          <h1 className="text-3xl font-black">AI Recommended Gigs</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Gigs matching your skill profile and travel coordinates, ranked by suitability.</p>
        </div>

        {/* Dashboard Widget */}
        <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-sm space-y-6">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 h-60 animate-pulse flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-6 w-3/4 bg-slate-850 rounded"></div>
                    <div className="h-4 w-1/2 bg-slate-850 rounded"></div>
                  </div>
                  <div className="h-10 bg-slate-850 rounded"></div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-10 bg-slate-950/40 border border-slate-800 rounded-xl">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-sm font-bold text-slate-200 mt-2">Error Loading Recommendations</h3>
              <p className="text-xs text-slate-400 mt-1">{error.message || 'Failed to fetch recommendations.'}</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-16 bg-slate-950/40 border border-slate-800 rounded-2xl">
              <span className="text-3xl">🤖</span>
              <h3 className="text-md font-bold text-slate-200 mt-3">No Personalized Matches Yet</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">Make sure to add skills (like React, Node.js) and select your coordinates on your freelancer profile to unlock AI scoring.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {recommendations.map((rec) => (
                <div key={rec.gig._id} className="flex flex-col h-full relative">
                  {/* Detailed Match Indicator Meter */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex-grow flex flex-col justify-between">
                    <GigCard gig={rec.gig} matchScore={rec.score} />
                    
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 uppercase">Recommendation Index</span>
                        <span className="text-indigo-400 font-bold">{Math.round(rec.score * 100)}% Match</span>
                      </div>
                      <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(rec.score * 100)}%` }}
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
