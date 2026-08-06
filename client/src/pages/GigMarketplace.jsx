import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Navigation from '../components/Navigation.jsx';
import GigCard from '../components/gigs/GigCard.jsx';
import GigFilters from '../components/gigs/GigFilters.jsx';

const LIMIT = 6;

export default function GigMarketplace() {
  const currentUser = useSelector((state) => state.auth?.user);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '' && v !== false);

  const buildQueryString = () => {
    const params = new URLSearchParams({ page, limit: LIMIT, sortBy, status: 'open' });
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') params.append(key, val);
    });
    return params.toString();
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['gigs', page, sortBy, filters],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/gigs?${buildQueryString()}`, { headers });
      return res.data;
    },
    keepPreviousData: true,
  });

  // Fetch match scores for freelancers
  const { data: matchData } = useQuery({
    queryKey: ['recommendedGigs', currentUser?._id],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      if (!token || currentUser?.role !== 'freelancer') return null;
      const res = await axios.get(
        `http://localhost:5000/api/matching/freelancers/${currentUser._id}/recommended-gigs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    enabled: !!currentUser?._id && currentUser?.role === 'freelancer',
    staleTime: 1000 * 60 * 5,
  });

  const matchScoreMap = {};
  if (matchData?.recommendations) {
    matchData.recommendations.forEach((r) => {
      matchScoreMap[r.gig?._id || r._id] = r.matchScore ?? r.score;
    });
  }

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleClearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const gigs = data?.gigs || [];
  const totalGigs = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <GigFilters onChange={handleFilterChange} initialFilters={filters} />
        </div>

        {/* Main listing area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header row */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
          >
            <div>
              <h1 className="text-xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>
                Browse Gigs
              </h1>
              <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Showing {gigs.length} of {totalGigs} open projects
              </p>
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  ✕ Clear Filters
                </button>
              )}
              <label htmlFor="sort" className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Sort By
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="text-sm rounded-xl py-1.5 px-3 outline-none cursor-pointer transition-all"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="newest">Newest Posted</option>
                <option value="budget">Highest Budget</option>
              </select>
            </div>
          </div>

          {/* Loading state — 6 skeleton cards */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {[...Array(LIMIT)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 h-64 animate-pulse flex flex-col justify-between border"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
                >
                  <div className="space-y-3">
                    <div className="h-5 w-3/4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
                    <div className="h-3 w-1/2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
                    <div className="h-3 w-full rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
                    <div className="h-3 w-5/6 rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 rounded-full" style={{ background: 'var(--bg-tertiary)' }} />
                    <div className="h-6 w-14 rounded-full" style={{ background: 'var(--bg-tertiary)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div
              className="text-center py-16 rounded-2xl border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
            >
              <span className="text-3xl">⚠️</span>
              <h3 className="text-lg font-bold mt-4" style={{ color: 'var(--text-primary)' }}>
                Error Loading Gigs
              </h3>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                {error?.message || 'Something went wrong. Please try again.'}
              </p>
            </div>
          ) : gigs.length === 0 ? (
            <div
              className="text-center py-20 rounded-2xl border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
            >
              <span className="text-5xl">🔍</span>
              <h3 className="text-lg font-bold mt-5" style={{ color: 'var(--text-primary)' }}>
                No Gigs Found
              </h3>
              <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                {hasActiveFilters
                  ? "We couldn't find any gigs matching your current filters. Try adjusting your criteria or clearing filters."
                  : 'No gigs have been posted yet. Check back soon or be the first to post a project!'}
              </p>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} className="btn-primary mt-6 text-sm px-6 py-2.5">
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {gigs.map((gig) => (
                <GigCard
                  key={gig._id}
                  gig={gig}
                  matchScore={matchScoreMap[gig._id]}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="font-bold py-2 px-4 rounded-xl border text-sm transition-all disabled:opacity-30"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
              >
                ← Prev
              </button>

              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className="w-9 h-9 font-bold rounded-xl border text-sm transition-all"
                      style={
                        page === pNum
                          ? { background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: '#fff' }
                          : { background: 'var(--bg-card)', borderColor: 'var(--border-secondary)', color: 'var(--text-secondary)' }
                      }
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="font-bold py-2 px-4 rounded-xl border text-sm transition-all disabled:opacity-30"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-xs border-t" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}>
        © 2026 SkillSphere Hyperlocal Freelance Marketplace. All Rights Reserved.
      </footer>
    </div>
  );
}
