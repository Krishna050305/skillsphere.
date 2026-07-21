import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import Navigation from '../../components/Navigation.jsx';
import AvailabilityCalendar from '../../components/scheduler/AvailabilityCalendar.jsx';

export default function AnalyticsDashboard() {
  const { data: res, isLoading, error } = useQuery({
    queryKey: ['freelancerAnalytics'],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const { data } = await axios.get('http://localhost:5000/api/freelancer/analytics', { headers });
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
        <Navigation />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-mono">Loading telemetry...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <Navigation />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-sm text-red-400 font-mono">Error loading analytics. Please try again later.</p>
        </main>
      </div>
    );
  }

  const { analytics } = res;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Freelancer Workspace & Analytics</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Track your growth, financial trajectory, and manage your availability.</p>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm hover:border-indigo-500/30 transition-colors">
            <p className="text-[10px] text-slate-500 font-mono uppercase font-bold tracking-wider mb-2">Total Earnings</p>
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 font-mono">
              ${analytics.totalEarnings.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm hover:border-indigo-500/30 transition-colors">
            <p className="text-[10px] text-slate-500 font-mono uppercase font-bold tracking-wider mb-2">Profile Views</p>
            <p className="text-3xl font-black text-indigo-400 font-mono">
              {analytics.profileViews}
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm hover:border-indigo-500/30 transition-colors">
            <p className="text-[10px] text-slate-500 font-mono uppercase font-bold tracking-wider mb-2">Applications</p>
            <p className="text-3xl font-black text-purple-400 font-mono">
              {analytics.applicationCount}
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm hover:border-indigo-500/30 transition-colors">
            <p className="text-[10px] text-slate-500 font-mono uppercase font-bold tracking-wider mb-2">Client Rating</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-amber-400 font-mono">
                {analytics.avgRating}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">({analytics.reviewCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Chart & Scheduler Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
            <h3 className="text-md font-bold text-slate-200 mb-6">Monthly Revenue Growth</h3>
            {analytics.monthlyRevenue.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500 font-mono border border-slate-850 rounded-xl bg-slate-950/50">
                No revenue data available yet.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', fontSize: '12px' }}
                      itemStyle={{ color: '#818cf8', fontFamily: 'monospace' }}
                      formatter={(value) => [`$${value}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={3} dot={{ fill: '#818cf8', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Availability Scheduler */}
          <AvailabilityCalendar />
        </div>
      </main>
    </div>
  );
}
