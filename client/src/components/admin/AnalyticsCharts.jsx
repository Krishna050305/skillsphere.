import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function AnalyticsCharts({ analytics }) {
  if (!analytics) return null;

  const { totalRevenue, activeFreelancers, topCategories, jobSuccessRate, dailyRevenue } = analytics;

  // Formatting helpers
  const formatCurrency = (val) => `$${Number(val).toLocaleString()}`;
  const formatPercent = (val) => `${(Number(val) * 100).toFixed(1)}%`;

  // Prepare top categories for bar chart
  const categoriesData = topCategories.map((c) => ({
    name: c._id || 'Unknown',
    Gigs: c.count,
  }));

  // Prepare daily revenue for line chart
  const revenueChartData = dailyRevenue.map((d) => ({
    date: new Date(d._id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    Revenue: d.revenue,
    Volume: d.volume,
  }));

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total Platform Revenue</span>
          <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">{formatCurrency(totalRevenue)}</div>
          <span className="text-[10px] text-slate-450 mt-1 block">10% Platform fee on released milestone escrow.</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Job Success Rate</span>
          <div className="text-2xl font-black text-indigo-400 mt-2 font-mono">{formatPercent(jobSuccessRate)}</div>
          <span className="text-[10px] text-slate-450 mt-1 block">Ratio of successfully completed gigs to total assignments.</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Active Freelancers</span>
          <div className="text-2xl font-black text-purple-400 mt-2 font-mono">{activeFreelancers}</div>
          <span className="text-[10px] text-slate-450 mt-1 block">Users registered as freelancer with status active.</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total Escrow Volume</span>
          <div className="text-2xl font-black text-slate-200 mt-2 font-mono">
            {formatCurrency(dailyRevenue.reduce((acc, curr) => acc + curr.volume, 0))}
          </div>
          <span className="text-[10px] text-slate-450 mt-1 block">Aggregate transaction value routed through escrow contracts.</span>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Line Chart: Revenue Over Time */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-850 rounded-3xl p-6 backdrop-blur-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Revenue & Escrow Volume (Last 30 Days)</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Escrow fee deposits vs total transactions processed.</p>
          </div>

          <div className="h-72 w-full text-xs font-mono">
            {revenueChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono">
                No revenue logs to display.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 1 }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Volume" stroke="#6366f1" strokeWidth={2} dot={{ r: 1 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart: Top Gig Categories */}
        <div className="lg:col-span-4 bg-slate-900/40 border border-slate-850 rounded-3xl p-6 backdrop-blur-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Top Required Skills</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Most in-demand competencies specified in client gig postings.</p>
          </div>

          <div className="h-72 w-full text-xs font-mono">
            {categoriesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono">
                No skill categories logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoriesData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="Gigs" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
