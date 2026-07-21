import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Navigation from '../components/Navigation.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function Disputes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDisputeId, setSelectedDisputeId] = useState(null);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  // Admin resolution form state
  const [resolution, setResolution] = useState('released');
  const [adminNotes, setAdminNotes] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  // 1. Fetch Disputes List
  const { data: disputesRes, isLoading: listLoading, isError: listError } = useQuery({
    queryKey: ['disputesList'],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/disputes`, { headers });
      return res.data;
    },
  });

  const disputes = disputesRes?.disputes || [];

  // 2. Fetch Selected Dispute Details
  const { data: disputeDetailsRes, isLoading: detailsLoading } = useQuery({
    queryKey: ['disputeDetails', selectedDisputeId],
    queryFn: async () => {
      if (!selectedDisputeId) return null;
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/disputes/${selectedDisputeId}`, { headers });
      return res.data;
    },
    enabled: !!selectedDisputeId,
  });

  const selectedDispute = disputeDetailsRes?.dispute;

  // Handle uploading evidence
  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceFile) {
      alert('Please select a file to upload.');
      return;
    }

    try {
      setEvidenceLoading(true);
      const token = sessionStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };

      const formData = new FormData();
      formData.append('evidence', evidenceFile);
      formData.append('description', evidenceDescription);

      await axios.post(
        `http://localhost:5000/api/disputes/${selectedDispute._id}/evidence`,
        formData,
        { headers }
      );

      alert('Evidence uploaded successfully.');
      setEvidenceFile(null);
      setEvidenceDescription('');
      queryClient.invalidateQueries(['disputeDetails', selectedDispute._id]);
    } catch (err) {
      alert(err.response?.data?.message || 'Evidence upload failed.');
    } finally {
      setEvidenceLoading(false);
    }
  };

  // Handle Admin Resolution
  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!adminNotes.trim()) {
      alert('Please provide notes explaining this resolution.');
      return;
    }

    try {
      setResolveLoading(true);
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(
        `http://localhost:5000/api/disputes/${selectedDispute._id}/resolve`,
        { resolution, adminNotes },
        { headers }
      );

      alert(`Dispute resolved. Escrow funds were ${resolution}.`);
      setAdminNotes('');
      queryClient.invalidateQueries(['disputeDetails', selectedDispute._id]);
      queryClient.invalidateQueries(['disputesList']);
    } catch (err) {
      alert(err.response?.data?.message || 'Resolution failed.');
    } finally {
      setResolveLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      case 'under_review':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/20 animate-pulse';
      case 'resolved_client':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'resolved_freelancer':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Dispute Resolution Desk</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            File evidence, review claims, and unlock escrow funds under system administration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Disputes List */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Claims & Cases</h2>

            {listLoading ? (
              <div className="py-12 text-center space-y-2 bg-slate-900/20 border border-slate-900 rounded-3xl">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-[10px] font-mono text-slate-500">Syncing cases...</p>
              </div>
            ) : listError ? (
              <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 text-[10px] font-mono rounded-xl text-center">
                Failed to sync cases.
              </div>
            ) : disputes.length === 0 ? (
              <div className="p-8 bg-slate-900/25 border border-slate-900 text-slate-500 text-xs font-mono rounded-3xl text-center">
                No disputes filed.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {disputes.map((dispute) => {
                  const payment = dispute.payment;
                  const isSelected = selectedDisputeId === dispute._id;

                  return (
                    <button
                      key={dispute._id}
                      onClick={() => setSelectedDisputeId(dispute._id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-slate-900 border-slate-700 shadow-md shadow-slate-950'
                          : 'bg-slate-900/30 border-slate-850/80 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-mono text-slate-500">CASE: {dispute._id.substring(0, 8)}...</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-mono font-bold uppercase tracking-wider ${getStatusColor(dispute.status)}`}>
                          {dispute.status.replace('_', ' ')}
                        </span>
                      </div>
                      <strong className="text-slate-200 text-xs font-bold truncate block w-full">
                        {payment?.gig?.title || 'Gig details not available'}
                      </strong>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-450 mt-1">
                        <span>Milestone Amount:</span>
                        <span className="font-bold text-slate-350">${payment?.amount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Case Details */}
          <div className="lg:col-span-8">
            {!selectedDisputeId ? (
              <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-16 text-center text-slate-550 space-y-2 h-full flex flex-col justify-center items-center">
                <span className="text-4xl">⚖️</span>
                <p className="text-sm font-bold text-slate-400">Select a dispute case</p>
                <p className="text-xs text-slate-500">Pick an active claim from the panel to view documents and upload evidence.</p>
              </div>
            ) : detailsLoading ? (
              <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-16 text-center space-y-4">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-mono text-slate-450">Fetching case evidence...</p>
              </div>
            ) : !selectedDispute ? (
              <div className="p-6 bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-mono rounded-2xl text-center">
                Case details unavailable.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Main details */}
                <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 backdrop-blur-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-850 pb-4 gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">CASE RESOLUTION DESK</span>
                      <h2 className="text-md font-bold text-slate-200">{selectedDispute.payment?.gig?.title}</h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full border text-[9px] font-mono font-bold uppercase tracking-wider w-fit ${getStatusColor(selectedDispute.status)}`}>
                      {selectedDispute.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 text-xs font-mono space-y-2">
                      <span className="text-slate-500 block">MILESTONE DETAILS</span>
                      <div>Amount: <strong className="text-slate-350">${selectedDispute.payment?.amount}</strong></div>
                      <div>Platform Fee: <strong className="text-slate-550">${selectedDispute.payment?.platformFee}</strong></div>
                      <div>Status: <span className="capitalize">{selectedDispute.payment?.state}</span></div>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 text-xs font-mono space-y-2">
                      <span className="text-slate-500 block">CLAIMANT DETAILS</span>
                      <div>Raised By: <strong className="text-slate-350">{selectedDispute.raisedBy?.name}</strong> ({selectedDispute.raisedBy?.role})</div>
                      <div>Contact: <span className="text-slate-450">{selectedDispute.raisedBy?.email}</span></div>
                      <div>Date Filed: <span>{new Date(selectedDispute.createdAt).toLocaleString()}</span></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 font-mono">Dispute Reason</h3>
                    <p className="bg-slate-950/55 border border-slate-850 p-4 rounded-2xl text-xs text-slate-350 leading-relaxed font-sans">
                      {selectedDispute.reason}
                    </p>
                  </div>
                </div>

                {/* Evidence Section */}
                <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 backdrop-blur-sm space-y-6">
                  <h3 className="text-xs font-bold text-slate-400 font-mono">Submitted Case Evidence</h3>

                  {selectedDispute.evidence.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono text-center py-6 bg-slate-950/20 border border-slate-850 rounded-2xl">
                      No files or evidence uploaded yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDispute.evidence.map((ev, idx) => {
                        const isImage = ev.url.match(/\.(jpeg|jpg|gif|png|webp)/i);
                        return (
                          <div key={idx} className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 space-y-3">
                            {isImage ? (
                              <img
                                src={ev.url}
                                alt={`Evidence ${idx + 1}`}
                                className="w-full h-40 object-cover rounded-xl border border-slate-800"
                              />
                            ) : (
                              <div className="w-full h-40 bg-slate-900 border border-slate-850 rounded-xl flex flex-col justify-center items-center gap-2 text-slate-500 font-mono text-xs">
                                <span className="text-2xl">📄</span>
                                Document / Raw File
                              </div>
                            )}
                            <div className="text-xs space-y-1">
                              <span className="text-slate-500 block font-mono text-[9px] uppercase">DESCRIPTION</span>
                              <p className="text-slate-300 truncate">{ev.description || 'No description provided.'}</p>
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-indigo-400 hover:text-indigo-300 font-bold font-mono text-[10px] mt-1"
                              >
                                View File ↗
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Evidence Upload Form */}
                  {['open', 'under_review'].includes(selectedDispute.status) && (
                    <form onSubmit={handleUploadEvidence} className="border-t border-slate-850/80 pt-6 space-y-4">
                      <h4 className="text-xs font-bold text-slate-350 font-mono">Upload New Evidence</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 font-mono uppercase block">Evidence File (Image/PDF)</label>
                          <input
                            type="file"
                            required
                            onChange={(e) => setEvidenceFile(e.target.files[0])}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs py-1.5 px-3 text-slate-300 focus:outline-none focus:border-indigo-500 file:bg-slate-850 file:border-none file:text-slate-300 file:text-[10px] file:font-mono file:font-bold file:px-3 file:py-1 file:rounded-lg file:mr-3 file:cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 font-mono uppercase block">Description / Note</label>
                          <input
                            type="text"
                            required
                            value={evidenceDescription}
                            onChange={(e) => setEvidenceDescription(e.target.value)}
                            placeholder="Brief label for this file..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-300 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={evidenceLoading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                      >
                        {evidenceLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Uploading File...
                          </>
                        ) : (
                          '📤 Submit Evidence'
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* Admin Resolution Panel */}
                {user?.role === 'admin' && ['open', 'under_review'].includes(selectedDispute.status) && (
                  <div className="bg-slate-900/40 border border-red-950 rounded-3xl p-6 backdrop-blur-sm space-y-4">
                    <div className="border-b border-red-950 pb-2">
                      <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">ADMINISTRATIVE ACTION CORE</span>
                      <h3 className="text-sm font-bold text-slate-200">Arbitrate Escrow Dispute</h3>
                    </div>

                    <form onSubmit={handleResolveDispute} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 font-mono uppercase block">Escrow Arbitration Decision</label>
                          <select
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="released">Release to Freelancer (Pay)</option>
                            <option value="refunded">Refund to Client (Refund)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 font-mono uppercase block">Administrative Ruling Explanation</label>
                        <textarea
                          required
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Provide the formal ruling explanation that justifies this payout/refund action. (Logged securely)..."
                          className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={resolveLoading}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {resolveLoading ? 'Arbitrating...' : '⚖️ Finalize Arbitration Ruling'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Display Admin Ruling Notes if Resolved */}
                {!['open', 'under_review'].includes(selectedDispute.status) && (
                  <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 backdrop-blur-sm space-y-3 font-mono text-xs">
                    <span className="text-slate-500 block uppercase text-[10px] font-bold">COURT OF ARBITRATION RULING</span>
                    <div>Resolved By: <strong className="text-slate-350">{selectedDispute.resolvedBy?.name || 'System Admin'}</strong></div>
                    <div>Decision: <strong className="text-indigo-400 capitalize">{selectedDispute.status.replace('resolved_', '')}</strong></div>
                    <div className="space-y-1 pt-2">
                      <span className="text-slate-500 block uppercase text-[9px]">RULING NOTES</span>
                      <p className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl text-slate-300 font-sans text-xs">
                        {selectedDispute.adminNotes || 'No notes left by arbitrator.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        <p>© 2026 SkillSphere Escrow Court. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
