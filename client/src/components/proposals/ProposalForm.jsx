import React, { useState } from 'react';
import axios from 'axios';

export default function ProposalForm({ gigId, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = sessionStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      await axios.post(
        'http://localhost:5000/api/proposals',
        {
          gig: gigId,
          coverLetter,
          bidAmount: Number(bidAmount),
          estimatedDays: Number(estimatedDays),
        },
        { headers }
      );
      
      // Success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Proposal submit error:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.join(', ') || 
        'Failed to submit proposal.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
        <span>📝</span> Submit a Proposal
      </h3>
      <p className="text-xs text-slate-400">Introduce yourself and explain why you're a great fit for this project.</p>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Cover Letter */}
      <div className="space-y-1">
        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Cover Letter (Min 50 chars)</label>
        <textarea
          required
          rows="5"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="I have extensive experience working with..."
          className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors"
        ></textarea>
        <div className="text-[10px] text-right text-slate-500 font-mono">
          {coverLetter.length} characters (min 50)
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Bid Amount */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Your Bid ($)</label>
          <input
            required
            type="number"
            min="1"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="500"
            className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Estimated Days */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Estimated Days</label>
          <input
            required
            type="number"
            min="1"
            max="365"
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value)}
            placeholder="10"
            className="w-full text-sm bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || coverLetter.length < 50}
        className="w-full text-center bg-indigo-600 disabled:opacity-40 hover:bg-indigo-500 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/30 transition-all duration-300"
      >
        {loading ? 'Submitting...' : 'Send Proposal'}
      </button>
    </form>
  );
}
