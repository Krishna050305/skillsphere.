import React, { useState } from 'react';
import axios from 'axios';

export default function ProposalList({ proposals, onActionComplete }) {
  const [activeNegotiationId, setActiveNegotiationId] = useState(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [negotiateMessage, setNegotiateMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStatusUpdate = async (proposalId, status) => {
    setLoading(true);
    setError(null);

    const token = sessionStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      await axios.patch(
        `http://localhost:5000/api/proposals/${proposalId}/status`,
        { status },
        { headers }
      );
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error('Status update failed:', err);
      setError(err.response?.data?.message || 'Failed to update proposal status.');
    } finally {
      setLoading(false);
    }
  };

  const handleNegotiate = async (e, proposalId, action) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = sessionStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      await axios.post(
        `http://localhost:5000/api/proposals/${proposalId}/negotiate`,
        {
          action,
          amount: action === 'counter' ? Number(counterAmount) : undefined,
          message: negotiateMessage,
        },
        { headers }
      );

      setCounterAmount('');
      setNegotiateMessage('');
      setActiveNegotiationId(null);
      
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error('Negotiation failed:', err);
      setError(err.response?.data?.message || 'Failed to negotiate proposal.');
    } finally {
      setLoading(false);
    }
  };

  if (proposals.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-900/30 border border-slate-800 rounded-2xl">
        <p className="text-sm text-slate-400">No proposals received yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {proposals.map((proposal) => {
        const {
          _id,
          freelancer = {},
          coverLetter,
          bidAmount,
          estimatedDays,
          matchScore,
          status,
          negotiationHistory = [],
        } = proposal;

        const isPending = status === 'pending';
        const hasCounterOffer = negotiationHistory.length > 0;
        const lastOffer = negotiationHistory[negotiationHistory.length - 1];
        const isLastOfferByFreelancer = lastOffer?.by === 'freelancer';

        return (
          <div key={_id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 hover:border-slate-700/60 transition-all duration-300">
            {/* Header info */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={freelancer.avatarUrl || 'https://via.placeholder.com/150'}
                  alt={freelancer.name}
                  className="w-12 h-12 rounded-full border border-slate-800 object-cover"
                />
                <div>
                  <h4 className="text-md font-bold text-slate-200">{freelancer.name}</h4>
                  <p className="text-xs text-slate-400">{freelancer.freelancerProfile?.headline || 'Freelancer'}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                {matchScore !== undefined && (
                  <span className="bg-indigo-500/10 text-indigo-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    Match Score: {Math.round(matchScore * 100)}%
                  </span>
                )}
                <span className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded ${
                  status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                  status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                  status === 'withdrawn' ? 'bg-slate-800 text-slate-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {status}
                </span>
              </div>
            </div>

            {/* Proposal Details */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line">
              {coverLetter}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-b border-slate-800/80 py-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block uppercase">Original Bid</span>
                <span className="text-md font-bold text-slate-200">${bidAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase">Est. Days</span>
                <span className="text-md font-bold text-slate-200">{estimatedDays} Days</span>
              </div>
              {hasCounterOffer && (
                <div>
                  <span className="text-slate-500 block uppercase">Last Counter Offer</span>
                  <span className="text-md font-bold text-indigo-400">${lastOffer.amount} ({lastOffer.by})</span>
                </div>
              )}
            </div>

            {/* Negotiation History Log */}
            {hasCounterOffer && (
              <div className="space-y-2 bg-slate-950/30 p-4 rounded-xl border border-slate-900 text-xs font-mono">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Negotiation History</span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {negotiationHistory.map((history, idx) => (
                    <div key={idx} className="flex justify-between items-start border-b border-slate-900/40 pb-1.5">
                      <span className="text-slate-400"><strong className="text-slate-300 capitalize">{history.by}:</strong> {history.message || 'Counter offer'}</span>
                      <span className="text-indigo-400 font-bold">${history.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Panel */}
            {isPending && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex gap-2">
                  <button
                    disabled={loading}
                    onClick={() => handleStatusUpdate(_id, 'accepted')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-md transition-colors"
                  >
                    Accept Proposal
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => handleStatusUpdate(_id, 'rejected')}
                    className="bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 text-xs font-bold py-2 px-5 rounded-xl border border-slate-700/80 transition-colors"
                  >
                    Reject
                  </button>
                </div>

                <div className="flex gap-2">
                  {isLastOfferByFreelancer && (
                    <button
                      disabled={loading}
                      onClick={(e) => handleNegotiate(e, _id, 'accept')}
                      className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-bold py-2 px-4 rounded-xl border border-indigo-500/30 transition-all"
                    >
                      Accept Counter Offer (${lastOffer.amount})
                    </button>
                  )}

                  <button
                    onClick={() => setActiveNegotiationId(activeNegotiationId === _id ? null : _id)}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold py-2 px-4 rounded-xl border border-slate-700/85 transition-colors"
                  >
                    {activeNegotiationId === _id ? 'Cancel Offer' : 'Propose Counter'}
                  </button>
                </div>
              </div>
            )}

            {/* Negotiation Counter Form */}
            {activeNegotiationId === _id && (
              <form
                onSubmit={(e) => handleNegotiate(e, _id, 'counter')}
                className="bg-slate-950/60 p-4 border border-indigo-950 rounded-xl space-y-3 animate-fadeIn"
              >
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block">Counter Price ($)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(e.target.value)}
                      placeholder="e.g. 450"
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block">Message (Optional)</label>
                    <input
                      type="text"
                      value={negotiateMessage}
                      onChange={(e) => setNegotiateMessage(e.target.value)}
                      placeholder="I can do it for $450 if we..."
                      className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={loading || !counterAmount}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 px-4 rounded-lg transition-colors"
                  >
                    Submit Counter
                  </button>
                </div>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
