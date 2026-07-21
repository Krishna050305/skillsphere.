import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Navigation from '../components/Navigation.jsx';

export default function PaymentHistory() {
  const [page, setPage] = useState(1);

  const { data: paymentsRes, isLoading, isError } = useQuery({
    queryKey: ['paymentHistory', page],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/payments/history?page=${page}&limit=10`, { headers });
      return res.data;
    },
  });

  const payments = paymentsRes?.payments || [];
  const pagination = paymentsRes?.pagination || { total: 0, pages: 1 };

  const getBadgeStyle = (state) => {
    switch (state) {
      case 'funded':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'submitted_for_review':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
      case 'released':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'disputed':
        return 'bg-red-500/10 text-red-400 border-red-500/25';
      case 'refunded':
        return 'bg-slate-500/10 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-900/60 text-slate-500 border-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navigation />

      <main className="max-w-6xl mx-auto px-6 py-12 flex-grow w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-100">Escrow Transaction History</h1>
            <p className="text-xs text-slate-500 font-mono mt-1">Review your funded milestones, payouts, and locked escrow statuses.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-mono text-slate-500">Loading transactions...</p>
          </div>
        ) : isError ? (
          <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-6 text-center text-red-400 text-xs font-mono">
            ⚠️ Failed to retrieve transaction history. Please refresh the page.
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-12 text-center text-slate-500 space-y-2">
            <span className="text-3xl block">💵</span>
            <p className="text-sm font-bold text-slate-400">No transactions found</p>
            <p className="text-xs text-slate-500">You haven't funded or received any milestone payments yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto bg-slate-900/40 border border-slate-850 rounded-3xl backdrop-blur-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] font-mono text-slate-500 uppercase tracking-wider bg-slate-900/60">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Gig / Milestone</th>
                    <th className="py-4 px-6">Counterparty</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                    <th className="py-4 px-6 text-right">Platform Fee</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Order Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs">
                  {payments.map((payment) => {
                    const date = new Date(payment.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <tr key={payment._id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 px-6 font-mono text-slate-400">{date}</td>
                        <td className="py-4 px-6 space-y-1">
                          <strong className="text-slate-200 block text-xs truncate max-w-xs">{payment.gig?.title || 'Unknown Gig'}</strong>
                          <span className="text-[10px] font-mono text-slate-500 block">Milestone ID: {payment.milestone?.substring(0, 8)}...</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-300">{payment.freelancer?.name || payment.client?.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{payment.freelancer?.email || payment.client?.email}</div>
                        </td>
                        <td className="py-4 px-6 text-right font-bold font-mono text-slate-200">${payment.amount}</td>
                        <td className="py-4 px-6 text-right font-mono text-slate-500">${payment.platformFee}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold uppercase tracking-wider ${getBadgeStyle(payment.state)}`}>
                            {payment.state.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-[10px] text-slate-500 space-y-0.5">
                          <div>ORD: {payment.razorpayOrderId || 'N/A'}</div>
                          <div>PAY: {payment.razorpayPaymentId || 'N/A'}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
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
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        <p>© 2026 SkillSphere Escrow Services. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
