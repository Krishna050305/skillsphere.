import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Navigation from '../components/Navigation.jsx';

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'funded' },
  { label: 'Active', value: 'in_progress' },
  { label: 'Submitted', value: 'submitted_for_review' },
  { label: 'Released', value: 'released' },
  { label: 'Disputed', value: 'disputed' },
];

const getBadgeClass = (state) => {
  switch (state) {
    case 'funded': return 'badge-blue';
    case 'in_progress': return 'badge-gold';
    case 'submitted_for_review': return 'badge-purple';
    case 'released': return 'badge-green';
    case 'disputed': return 'badge-red';
    case 'refunded': return 'badge-gray';
    default: return 'badge-gray';
  }
};

export default function PaymentHistory() {
  const currentUser = useSelector((state) => state.auth?.user);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');

  const { data: paymentsRes, isLoading, isError } = useQuery({
    queryKey: ['paymentHistory', page, activeTab],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = new URLSearchParams({ page, limit: 10 });
      if (activeTab !== 'all') params.append('state', activeTab);
      const res = await axios.get(`http://localhost:5000/api/payments/history?${params}`, { headers });
      return res.data;
    },
  });

  const payments = paymentsRes?.payments || [];
  const pagination = paymentsRes?.pagination || { total: 0, pages: 1 };

  // Summary row values
  const totalAmount = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalFees = payments.reduce((acc, p) => acc + (p.platformFee || 0), 0);
  const releasedCount = payments.filter((p) => p.state === 'released').length;

  // Release payment mutation (client action)
  const releaseMutation = useMutation({
    mutationFn: async (paymentId) => {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5000/api/payments/${paymentId}/release`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paymentHistory']);
    },
  });

  // Submit milestone mutation (freelancer action)
  const submitMutation = useMutation({
    mutationFn: async (paymentId) => {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5000/api/payments/${paymentId}/submit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['paymentHistory']);
    },
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navigation />

      <main className="max-w-6xl mx-auto px-6 py-10 flex-grow w-full space-y-6">
        {/* Page header */}
        <div className="border-b pb-5" style={{ borderColor: 'var(--border-primary)' }}>
          <h1 className="text-2xl font-black font-display" style={{ color: 'var(--text-primary)' }}>
            Escrow Transaction History
          </h1>
          <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
            Review your funded milestones, payouts, and locked escrow statuses.
          </p>
        </div>

        {/* Summary row */}
        {!isLoading && payments.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Volume', value: `$${totalAmount.toLocaleString()}`, accent: 'var(--accent-secondary)' },
              { label: 'Platform Fees', value: `$${totalFees.toLocaleString()}`, accent: 'var(--text-muted)' },
              { label: 'Released Payments', value: releasedCount, accent: 'var(--accent-primary)' },
            ].map(({ label, value, accent }) => (
              <div
                key={label}
                className="card p-4 rounded-2xl border flex flex-col gap-1"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
              >
                <span className="text-[10px] uppercase font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </span>
                <span className="text-2xl font-extrabold font-display" style={{ color: accent }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setPage(1); }}
              className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={
                activeTab === tab.value
                  ? { background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: '#fff' }
                  : { background: 'var(--bg-card)', borderColor: 'var(--border-secondary)', color: 'var(--text-secondary)' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 h-16 animate-pulse border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
              />
            ))}
          </div>
        ) : isError ? (
          <div className="card p-6 text-center border rounded-2xl" style={{ borderColor: 'var(--border-secondary)' }}>
            <span className="text-2xl">⚠️</span>
            <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>
              Failed to retrieve transaction history
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Please refresh the page.</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="card p-16 text-center rounded-3xl border" style={{ borderColor: 'var(--border-secondary)' }}>
            <span className="text-4xl block">💵</span>
            <p className="text-sm font-bold mt-4" style={{ color: 'var(--text-primary)' }}>No transactions found</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {activeTab !== 'all'
                ? 'No payments match this filter. Try switching tabs.'
                : "You haven't funded or received any milestone payments yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="overflow-x-auto rounded-3xl border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="text-[10px] font-mono uppercase tracking-wider border-b"
                    style={{ color: 'var(--text-muted)', borderColor: 'var(--border-secondary)' }}
                  >
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Gig / Milestone</th>
                    <th className="py-4 px-6">Counterparty</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                    <th className="py-4 px-6 text-right">Fee</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const date = new Date(payment.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                    });
                    const isClient = currentUser?.role === 'client';
                    const isFreelancer = currentUser?.role === 'freelancer';
                    const canRelease = isClient && payment.state === 'submitted_for_review';
                    const canSubmit = isFreelancer && payment.state === 'in_progress';

                    return (
                      <tr
                        key={payment._id}
                        className="border-t transition-colors"
                        style={{ borderColor: 'var(--border-secondary)' }}
                      >
                        <td className="py-4 px-6 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{date}</td>
                        <td className="py-4 px-6 space-y-1">
                          <strong className="text-xs block truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>
                            {payment.gig?.title || 'Unknown Gig'}
                          </strong>
                          <span className="text-[10px] font-mono block" style={{ color: 'var(--text-muted)' }}>
                            ID: {payment.milestone?.substring(0, 8) || payment._id?.substring(0, 8)}...
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            {payment.freelancer?.name || payment.client?.name || '—'}
                          </div>
                          <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                            {payment.freelancer?.email || payment.client?.email || ''}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-bold font-mono text-sm" style={{ color: 'var(--accent-secondary)' }}>
                          ${payment.amount}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          ${payment.platformFee}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`badge ${getBadgeClass(payment.state)} text-[9px] uppercase tracking-wider`}>
                            {(payment.state || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {canRelease && (
                            <button
                              onClick={() => releaseMutation.mutate(payment._id)}
                              disabled={releaseMutation.isLoading}
                              className="btn-primary text-[10px] py-1.5 px-3"
                            >
                              Release ✓
                            </button>
                          )}
                          {canSubmit && (
                            <button
                              onClick={() => submitMutation.mutate(payment._id)}
                              disabled={submitMutation.isLoading}
                              className="text-[10px] py-1.5 px-3 rounded-lg border font-semibold transition-all"
                              style={{
                                background: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              Submit ↗
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div
                className="flex items-center justify-between rounded-2xl border p-4"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
              >
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-xs font-bold py-1.5 px-4 rounded-xl border transition-all disabled:opacity-30"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--text-secondary)' }}
                >
                  ← Previous
                </button>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  Page {page} of {pagination.pages}
                </span>
                <button
                  disabled={page === pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs font-bold py-1.5 px-4 rounded-xl border transition-all disabled:opacity-30"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--text-secondary)' }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs border-t" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}>
        © 2026 SkillSphere Escrow Services. All Rights Reserved.
      </footer>
    </div>
  );
}
