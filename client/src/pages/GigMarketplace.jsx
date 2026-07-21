import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Navigation from '../components/Navigation.jsx';
import GigCard from '../components/gigs/GigCard.jsx';
import GigFilters from '../components/gigs/GigFilters.jsx';

export default function GigMarketplace() {
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const limit = 6;

  // Build query string from filters
  const buildQueryString = () => {
    const params = new URLSearchParams({
      page,
      limit,
      sortBy,
      status: 'open',
    });

    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    return params.toString();
  };

  // Fetch gigs with React Query
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

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to page 1 on filter change
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const totalPages = data?.totalPages || 1;
  const gigs = data?.gigs || [];
  const totalGigs = data?.total || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filter Panel */}
        <div className="lg:col-span-1">
          <GigFilters onChange={handleFilterChange} initialFilters={filters} />
        </div>

        {/* Gig Listings */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header & Sorting Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/30 p-4 border border-slate-800 rounded-2xl backdrop-blur-sm">
            <div>
              <h2 className="text-xl font-extrabold text-slate-100">Browse Gigs</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Showing {gigs.length} of {totalGigs} open projects</p>
            </div>
            
            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-xs font-mono text-slate-400 uppercase tracking-wider">Sort By</label>
              <select
                id="sort"
                value={sortBy}
                onChange={handleSortChange}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl py-1.5 px-3 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="newest">Newest Posted</option>
                <option value="budget">Highest Budget</option>
              </select>
            </div>
          </div>

          {/* Loading, Error or Empty States */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {[...Array(limit)].map((_, i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 h-60 animate-pulse flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-6 w-3/4 bg-slate-800 rounded"></div>
                    <div className="h-4 w-1/2 bg-slate-800 rounded"></div>
                  </div>
                  <div className="h-10 bg-slate-850 rounded"></div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-2xl">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-lg font-bold mt-4 text-slate-200">Error Loading Gigs</h3>
              <p className="text-sm text-slate-400 mt-2">{error.message || 'Something went wrong.'}</p>
            </div>
          ) : gigs.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl backdrop-blur-sm">
              <span className="text-4xl">🔍</span>
              <h3 className="text-lg font-bold mt-4 text-slate-200">No Gigs Found</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">We couldn't find any gigs matching your filter criteria. Try resetting or adjusting filters.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {gigs.map((gig) => (
                <GigCard key={gig._id} gig={gig} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 font-bold py-2 px-4 rounded-xl transition-all"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const pNum = index + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-10 h-10 font-bold rounded-xl border text-sm transition-all ${
                        page === pNum
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="bg-slate-900 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 font-bold py-2 px-4 rounded-xl transition-all"
              >
                Next
              </button>
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
