import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function FraudFlagsList() {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('all');

  const { data: fraudRes, isLoading, isError } = useQuery({
    queryKey: ['adminFraudFlags', page],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/admin/fraud-flags?page=${page}&limit=10`, { headers });
      return res.data;
    },
  });

  const flags = fraudRes?.flags || [];
  const pagination = fraudRes?.pagination || { total: 0, pages: 1 };

  // Filter flags client-side
  const filteredFlags = flags.filter((flag) => {
    if (filterType === 'all') return true;
    return flag.metadata?.flagType === filterType;
  });

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/25';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-750';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/20 border border-slate-900 rounded-2xl p-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Security Flags Logs</h3>
          <p className="text-[10px] text-slate-500 font-mono">Real-time system heuristics monitoring potential transaction or activity abuse.</p>
        </div>
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-xl py-1.5 px-3 text-xs text-slate-350 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Flags Types</option>
            <option value="suspicious_activity">Suspicious Activity</option>
            <option value="rapid_review">Rapid Review Submission</option>
            <option value="high_value_transaction">High Value Escrow</option>
            <option value="plagiarism_match">AI Matching Plagiarism</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-500">Syncing fraud records...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-6 text-center text-red-400 text-xs font-mono">
          Failed to fetch security logs.
        </div>
      ) : filteredFlags.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/10 border border-slate-900 rounded-3xl text-slate-550 space-y-2">
          <span className="text-3xl block">🛡️</span>
          <p className="text-xs font-bold text-slate-400 font-mono">No security flags found</p>
          <p className="text-[10px] text-slate-500 font-mono">All transactions are operating within standard parameters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto bg-slate-900/40 border border-slate-850 rounded-3xl backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-[10px] font-mono text-slate-500 uppercase tracking-wider bg-slate-900/60">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Flag Type</th>
                  <th className="py-4 px-6">Target Entity</th>
                  <th className="py-4 px-6">Arbitration / Reason</th>
                  <th className="py-4 px-6">Severity</th>
                  <th className="py-4 px-6">Admin Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs">
                {filteredFlags.map((flag) => {
                  const date = new Date(flag.createdAt).toLocaleString();
                  const severity = flag.metadata?.severity || 'info';

                  return (
                    <tr key={flag._id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-400 text-[11px] whitespace-nowrap">{date}</td>
                      <td className="py-4 px-6 font-semibold text-slate-200 capitalize">
                        {flag.metadata?.flagType?.replace(/_/g, ' ') || 'Fraud Alert'}
                      </td>
                      <td className="py-4 px-6 font-mono text-[10px] text-slate-500 space-y-0.5">
                        <div className="font-bold text-slate-400">{flag.targetType}</div>
                        <div>ID: {flag.targetId}</div>
                      </td>
                      <td className="py-4 px-6 max-w-sm text-slate-350 leading-relaxed font-sans">
                        {flag.metadata?.reason || 'System flagged anomalous pattern.'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-mono font-bold uppercase tracking-wider ${getSeverityStyle(severity)}`}>
                          {severity}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-400">{flag.admin?.name || 'Automated Sentinel'}</div>
                        <div className="text-[10px] font-mono text-slate-500">{flag.admin?.email || 'system@skillsphere.local'}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between bg-slate-900/20 border border-slate-900 rounded-2xl p-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="bg-slate-850 hover:bg-slate-850/80 text-slate-300 font-bold py-1.5 px-4 rounded-xl text-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                ◀ Previous
              </button>
              <span className="text-xs font-mono text-slate-500">
                Page {page} of {pagination.pages}
              </span>
              <button
                disabled={page === pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="bg-slate-850 hover:bg-slate-850/80 text-slate-300 font-bold py-1.5 px-4 rounded-xl text-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Next ▶
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
