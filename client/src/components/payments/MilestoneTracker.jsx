import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth.js';
import RazorpayCheckout from './RazorpayCheckout.jsx';
import ProgressTracker from '../projects/ProgressTracker.jsx';

export default function MilestoneTracker({ gig }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeDisputeMilestone, setActiveDisputeMilestone] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  const isClient = user?.role === 'client' && gig.client._id === user?._id;
  const isFreelancer = user?.role === 'freelancer' && gig.assignedFreelancer?._id === user?._id;

  // 1. Fetch payments associated with this user
  const { data: paymentsRes, isLoading: paymentsLoading } = useQuery({
    queryKey: ['milestonePayments', gig._id],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/payments/history?limit=100`, { headers });
      return res.data;
    },
  });

  const payments = paymentsRes?.payments || [];

  // Match milestones with payment records
  const milestonesWithPayments = gig.milestones.map((milestone) => {
    const payment = payments.find((p) => p.milestone === milestone._id || p.milestone?._id === milestone._id);
    return { ...milestone, payment };
  });

  // Mutations
  const startMutation = useMutation({
    mutationFn: async (paymentId) => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`http://localhost:5000/api/payments/${paymentId}/start`, {}, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['milestonePayments', gig._id]);
      queryClient.invalidateQueries(['gig', gig._id]);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (paymentId) => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`http://localhost:5000/api/payments/${paymentId}/submit`, {}, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['milestonePayments', gig._id]);
      queryClient.invalidateQueries(['gig', gig._id]);
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (paymentId) => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`http://localhost:5000/api/payments/${paymentId}/release`, {}, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['milestonePayments', gig._id]);
      queryClient.invalidateQueries(['gig', gig._id]);
    },
  });

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim() || disputeReason.length < 10) {
      alert('Please provide a reason with at least 10 characters.');
      return;
    }

    try {
      setDisputeLoading(true);
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `http://localhost:5000/api/disputes`,
        {
          paymentId: activeDisputeMilestone.payment._id,
          reason: disputeReason,
        },
        { headers }
      );

      alert('Dispute raised successfully. Escrow funds are locked.');
      setActiveDisputeMilestone(null);
      setDisputeReason('');
      queryClient.invalidateQueries(['milestonePayments', gig._id]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to raise dispute.');
    } finally {
      setDisputeLoading(false);
    }
  };

  const getStatusStyle = (state) => {
    switch (state) {
      case 'funded':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
      case 'submitted_for_review':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'released':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'disputed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'refunded':
        return 'bg-slate-500/10 text-slate-400 border-slate-550';
      default:
        return 'bg-slate-900/60 text-slate-500 border-slate-800';
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-850 pb-4">
        <div>
          <h2 className="text-md font-bold text-slate-100">Milestone Tracker & Escrow</h2>
          <p className="text-xs text-slate-500 font-mono">Assigned: {gig.assignedFreelancer?.name || 'Unassigned'}</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-350 text-[10px] font-mono border border-slate-700 uppercase">
          {gig.status}
        </span>
      </div>

      {paymentsLoading ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-500">Loading escrow status...</p>
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
          {milestonesWithPayments.map((milestone, idx) => {
            const payment = milestone.payment;
            const currentState = payment ? payment.state : 'unfunded';

            return (
              <div key={milestone._id} className="pl-10 relative group">
                {/* Timeline node */}
                <div
                  className={`absolute left-[10px] top-1.5 w-3.5 h-3.5 rounded-full border-2 transform -translate-x-1/2 transition-colors ${
                    currentState === 'released'
                      ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                      : currentState === 'disputed'
                      ? 'bg-red-500 border-red-400'
                      : currentState === 'unfunded'
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-indigo-500 border-indigo-400'
                  }`}
                ></div>

                <div className="bg-slate-900/30 border border-slate-850 hover:border-slate-800/80 rounded-2xl p-5 space-y-4 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">{milestone.title}</h3>
                      <p className="text-xs text-slate-450 mt-1">{milestone.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        ${milestone.amount}
                      </span>
                      <span
                        className={`text-[9px] uppercase tracking-wider font-mono border px-2 py-0.5 rounded-full font-bold ${getStatusStyle(
                          currentState
                        )}`}
                      >
                        {currentState.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions depending on the current state */}
                  <div className="pt-2 flex flex-wrap gap-3">
                    {/* State: UNFUNDED */}
                    {currentState === 'unfunded' && (
                      <>
                        {isClient ? (
                          <RazorpayCheckout
                            gigId={gig._id}
                            milestoneId={milestone._id}
                            milestoneTitle={milestone.title}
                            amount={milestone.amount}
                            onSuccess={(updatedPayment) => {
                              alert('Payment deposit successful! Escrow funded.');
                              queryClient.invalidateQueries(['milestonePayments', gig._id]);
                              queryClient.invalidateQueries(['gig', gig._id]);
                            }}
                            onFailure={(err) => {
                              alert(`Payment failed: ${err}`);
                            }}
                          />
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">⌛ Awaiting client funding</span>
                        )}
                      </>
                    )}

                    {/* State: FUNDED */}
                    {currentState === 'funded' && (
                      <>
                        {isFreelancer ? (
                          <button
                            onClick={() => startMutation.mutate(payment._id)}
                            disabled={startMutation.isLoading}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
                          >
                            🚀 Start Milestone Work
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">✓ Funded (Awaiting freelancer to start)</span>
                        )}
                      </>
                    )}

                    {/* State: IN PROGRESS */}
                    {currentState === 'in_progress' && (
                      <>
                        {isFreelancer ? (
                          <button
                            onClick={() => submitMutation.mutate(payment._id)}
                            disabled={submitMutation.isLoading}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
                          >
                            📤 Submit Deliverables
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">⚙️ Freelancer is currently working</span>
                        )}
                      </>
                    )}

                    {/* State: SUBMITTED FOR REVIEW */}
                    {currentState === 'submitted_for_review' && (
                      <>
                        {isClient ? (
                          <div className="flex gap-3 w-full sm:w-auto">
                            <button
                              onClick={() => releaseMutation.mutate(payment._id)}
                              disabled={releaseMutation.isLoading}
                              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
                            >
                              ✓ Approve & Release Funds
                            </button>
                            <button
                              onClick={() => {
                                setActiveDisputeMilestone(milestone);
                                setDisputeReason('');
                              }}
                              className="flex-1 sm:flex-initial bg-red-600/10 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-all active:scale-95"
                            >
                              ⚠️ Raise Dispute
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">⏳ Deliverables submitted. Awaiting client approval.</span>
                        )}
                      </>
                    )}

                    {/* State: RELEASED */}
                    {currentState === 'released' && (
                      <span className="text-xs text-emerald-400 font-mono">✓ Milestone completed and funds paid out</span>
                    )}

                    {/* State: DISPUTED */}
                    {currentState === 'disputed' && (
                      <span className="text-xs text-red-400 font-mono">⚠️ Milestone escrow locked in dispute resolution</span>
                    )}

                    {/* State: REFUNDED */}
                    {currentState === 'refunded' && (
                      <span className="text-xs text-slate-400 font-mono">↩️ Escrow funds refunded to client</span>
                    )}
                  </div>
                  
                  {/* Progress Tracker Section (Rendered for active milestones) */}
                  {(currentState === 'in_progress' || currentState === 'submitted_for_review') && (
                    <ProgressTracker gig={gig} milestone={milestone} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Raise Dispute Dialog */}
      {activeDisputeMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-slate-200">Raise Escrow Dispute</h3>
              <button
                onClick={() => setActiveDisputeMilestone(null)}
                className="text-slate-400 hover:text-slate-250 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRaiseDispute} className="space-y-4">
              <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
                <span className="text-slate-500 block font-mono">MILESTONE</span>
                <strong>{activeDisputeMilestone.title}</strong> (${activeDisputeMilestone.amount})
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 block font-mono">Reason for dispute</label>
                <textarea
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explain why you are raising a dispute (minimum 10 characters)..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveDisputeMilestone(null)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-350 font-bold py-2 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeLoading}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {disputeLoading ? 'Filing...' : 'File Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
