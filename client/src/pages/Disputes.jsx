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
  const [resolution, setResolution] = useState('released');
  const [adminNotes, setAdminNotes] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [newDisputeReason, setNewDisputeReason] = useState('');
  const [newDisputePaymentId, setNewDisputePaymentId] = useState('');
  const [raiseLoading, setRaiseLoading] = useState(false);

  // Fetch disputes list
  const { data: disputesRes, isLoading: listLoading, isError: listError } = useQuery({
    queryKey: ['disputesList'],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('http://localhost:5000/api/disputes', { headers });
      return res.data;
    },
  });

  // Fetch selected dispute details
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

  const disputes = disputesRes?.disputes || [];
  const selectedDispute = disputeDetailsRes?.dispute;

  // Upload evidence
  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceFile) { alert('Please select a file.'); return; }
    try {
      setEvidenceLoading(true);
      const token = sessionStorage.getItem('token');
      const formData = new FormData();
      formData.append('evidence', evidenceFile);
      formData.append('description', evidenceDescription);
      await axios.post(
        `http://localhost:5000/api/disputes/${selectedDispute._id}/evidence`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      setEvidenceFile(null);
      setEvidenceDescription('');
      queryClient.invalidateQueries(['disputeDetails', selectedDispute._id]);
    } catch (err) {
      alert(err.response?.data?.message || 'Evidence upload failed.');
    } finally {
      setEvidenceLoading(false);
    }
  };

  // Admin resolve
  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!adminNotes.trim()) { alert('Please provide ruling notes.'); return; }
    try {
      setResolveLoading(true);
      const token = sessionStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/disputes/${selectedDispute._id}/resolve`,
        { resolution, adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdminNotes('');
      queryClient.invalidateQueries(['disputeDetails', selectedDispute._id]);
      queryClient.invalidateQueries(['disputesList']);
    } catch (err) {
      alert(err.response?.data?.message || 'Resolution failed.');
    } finally {
      setResolveLoading(false);
    }
  };

  // Raise new dispute
  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!newDisputePaymentId.trim() || !newDisputeReason.trim()) {
      alert('Please fill in both fields.');
      return;
    }
    try {
      setRaiseLoading(true);
      const token = sessionStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/disputes',
        { paymentId: newDisputePaymentId, reason: newDisputeReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowRaiseModal(false);
      setNewDisputePaymentId('');
      setNewDisputeReason('');
      queryClient.invalidateQueries(['disputesList']);
      if (res.data?.dispute?._id) setSelectedDisputeId(res.data.dispute._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to raise dispute.');
    } finally {
      setRaiseLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open': return 'badge badge-gold';
      case 'under_review': return 'badge badge-purple';
      case 'resolved_client': return 'badge badge-blue';
      case 'resolved_freelancer': return 'badge badge-green';
      default: return 'badge badge-gray';
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-10 flex-grow w-full space-y-8">
        {/* Page header */}
        <div className="flex items-start justify-between border-b pb-5" style={{ borderColor: 'var(--border-primary)' }}>
          <div>
            <h1 className="text-2xl font-black font-display" style={{ color: 'var(--text-primary)' }}>
              Dispute Resolution Desk
            </h1>
            <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
              File evidence, review claims, and unlock escrow funds under system administration.
            </p>
          </div>
          <button
            onClick={() => setShowRaiseModal(true)}
            className="btn-primary text-sm"
          >
            + Raise Dispute
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Disputes list */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest font-mono" style={{ color: 'var(--text-muted)' }}>
              Claims & Cases
            </h2>

            {listLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-5 h-20 animate-pulse border"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
                  />
                ))}
              </div>
            ) : listError ? (
              <div
                className="p-4 rounded-xl border text-center text-xs font-mono"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}
              >
                ⚠️ Failed to load cases.
              </div>
            ) : disputes.length === 0 ? (
              <div
                className="p-10 rounded-3xl border text-center"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
              >
                <span className="text-3xl block mb-2">⚖️</span>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No disputes filed</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  All your projects are running smoothly!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {disputes.map((dispute) => {
                  const payment = dispute.payment;
                  const isSelected = selectedDisputeId === dispute._id;
                  return (
                    <button
                      key={dispute._id}
                      onClick={() => setSelectedDisputeId(dispute._id)}
                      className="w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2"
                      style={{
                        background: isSelected ? 'rgba(45,80,22,0.07)' : 'var(--bg-card)',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                        borderLeftWidth: isSelected ? '3px' : '1px',
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          CASE: {dispute._id.substring(0, 8)}...
                        </span>
                        <span className={getStatusBadge(dispute.status) + ' text-[8px]'}>
                          {dispute.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <strong className="text-xs font-bold truncate block" style={{ color: 'var(--text-primary)' }}>
                        {payment?.gig?.title || 'Gig details not available'}
                      </strong>
                      <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        <span>Milestone Amount:</span>
                        <span className="font-bold" style={{ color: 'var(--accent-secondary)' }}>
                          ${payment?.amount}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Case details */}
          <div className="lg:col-span-8">
            {!selectedDisputeId ? (
              <div
                className="rounded-3xl p-16 text-center flex flex-col justify-center items-center border h-full min-h-[300px]"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
              >
                <span className="text-5xl">⚖️</span>
                <p className="text-sm font-bold mt-5" style={{ color: 'var(--text-primary)' }}>
                  Select a dispute case
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Pick an active claim from the left panel to view documents and upload evidence.
                </p>
              </div>
            ) : detailsLoading ? (
              <div
                className="rounded-3xl p-16 text-center border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
              >
                <div
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                  style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
                />
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Fetching case evidence...</p>
              </div>
            ) : !selectedDispute ? (
              <div
                className="p-6 rounded-2xl border text-center text-xs font-mono"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}
              >
                Case details unavailable.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Main details card */}
                <div className="card p-6 rounded-3xl border space-y-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2" style={{ borderColor: 'var(--border-secondary)' }}>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>
                        CASE RESOLUTION DESK
                      </span>
                      <h2 className="text-base font-bold font-display mt-0.5" style={{ color: 'var(--text-primary)' }}>
                        {selectedDispute.payment?.gig?.title}
                      </h2>
                    </div>
                    <span className={getStatusBadge(selectedDispute.status)}>
                      {selectedDispute.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl p-4 text-xs font-mono space-y-2 border" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
                      <span className="block font-semibold uppercase text-[9px] tracking-widest" style={{ color: 'var(--text-muted)' }}>
                        MILESTONE DETAILS
                      </span>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Amount: <strong style={{ color: 'var(--accent-secondary)' }}>${selectedDispute.payment?.amount}</strong>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Platform Fee: <strong style={{ color: 'var(--text-muted)' }}>${selectedDispute.payment?.platformFee}</strong>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Status: <span className="capitalize">{selectedDispute.payment?.state}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl p-4 text-xs font-mono space-y-2 border" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
                      <span className="block font-semibold uppercase text-[9px] tracking-widest" style={{ color: 'var(--text-muted)' }}>
                        CLAIMANT DETAILS
                      </span>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Raised By: <strong style={{ color: 'var(--text-primary)' }}>{selectedDispute.raisedBy?.name}</strong>{' '}
                        ({selectedDispute.raisedBy?.role})
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Contact: {selectedDispute.raisedBy?.email}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Filed: {new Date(selectedDispute.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      Dispute Reason
                    </h3>
                    <p
                      className="rounded-2xl p-4 text-xs leading-relaxed border"
                      style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--text-secondary)' }}
                    >
                      {selectedDispute.reason}
                    </p>
                  </div>
                </div>

                {/* Evidence section */}
                <div className="card p-6 rounded-3xl border space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Submitted Case Evidence
                  </h3>

                  {selectedDispute.evidence.length === 0 ? (
                    <p
                      className="text-xs font-mono text-center py-6 rounded-2xl border"
                      style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}
                    >
                      No files or evidence uploaded yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDispute.evidence.map((ev, idx) => {
                        const isImage = ev.url.match(/\.(jpeg|jpg|gif|png|webp)/i);
                        return (
                          <div key={idx} className="rounded-2xl p-4 space-y-3 border" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
                            {isImage ? (
                              <img src={ev.url} alt={`Evidence ${idx + 1}`} className="w-full h-40 object-cover rounded-xl border" style={{ borderColor: 'var(--border-secondary)' }} />
                            ) : (
                              <div className="w-full h-40 rounded-xl flex flex-col justify-center items-center gap-2 border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}>
                                <span className="text-2xl">📄</span>
                                <span className="text-xs font-mono">Document / File</span>
                              </div>
                            )}
                            <div className="text-xs space-y-1">
                              <span className="block font-mono text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>DESCRIPTION</span>
                              <p className="truncate" style={{ color: 'var(--text-secondary)' }}>{ev.description || 'No description provided.'}</p>
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block font-bold font-mono text-[10px] mt-1 hover:underline"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                View File ↗
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Evidence upload */}
                  {['open', 'under_review'].includes(selectedDispute.status) && (
                    <form onSubmit={handleUploadEvidence} className="border-t pt-5 space-y-4" style={{ borderColor: 'var(--border-secondary)' }}>
                      <h4 className="text-xs font-bold font-mono" style={{ color: 'var(--text-primary)' }}>Upload New Evidence</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold font-mono uppercase block" style={{ color: 'var(--text-muted)' }}>
                            Evidence File (Image/PDF)
                          </label>
                          <input
                            type="file"
                            required
                            onChange={(e) => setEvidenceFile(e.target.files[0])}
                            className="w-full rounded-xl text-xs py-1.5 px-3 outline-none"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold font-mono uppercase block" style={{ color: 'var(--text-muted)' }}>
                            Description / Note
                          </label>
                          <input
                            type="text"
                            required
                            value={evidenceDescription}
                            onChange={(e) => setEvidenceDescription(e.target.value)}
                            placeholder="Brief label for this file..."
                            className="w-full rounded-xl text-xs py-2 px-3 outline-none"
                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={evidenceLoading}
                        className="btn-primary text-xs px-6 py-2 disabled:opacity-50"
                      >
                        {evidenceLoading ? '⏳ Uploading...' : '📤 Submit Evidence'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Admin resolution panel */}
                {user?.role === 'admin' && ['open', 'under_review'].includes(selectedDispute.status) && (
                  <div
                    className="card p-6 rounded-3xl border space-y-4"
                    style={{ background: 'var(--bg-card)', borderColor: '#ef4444' }}
                  >
                    <div className="border-b pb-2" style={{ borderColor: '#ef4444' }}>
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-red-500">
                        ADMINISTRATIVE ACTION CORE
                      </span>
                      <h3 className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                        Arbitrate Escrow Dispute
                      </h3>
                    </div>
                    <form onSubmit={handleResolveDispute} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold font-mono uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                          Escrow Arbitration Decision
                        </label>
                        <select
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          className="w-full rounded-xl py-2 px-3 text-xs outline-none"
                          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        >
                          <option value="released">Release to Freelancer (Pay)</option>
                          <option value="refunded">Refund to Client (Refund)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold font-mono uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                          Administrative Ruling Explanation
                        </label>
                        <textarea
                          required
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Provide the formal ruling explanation..."
                          className="w-full h-20 rounded-xl py-2 px-3 text-xs outline-none resize-none"
                          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={resolveLoading}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
                      >
                        {resolveLoading ? 'Arbitrating...' : '⚖️ Finalize Arbitration Ruling'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Resolved ruling notes */}
                {!['open', 'under_review'].includes(selectedDispute.status) && (
                  <div className="card p-6 rounded-3xl border space-y-3 font-mono text-xs" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
                    <span className="uppercase text-[10px] font-bold block" style={{ color: 'var(--text-muted)' }}>
                      COURT OF ARBITRATION RULING
                    </span>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Resolved By: <strong style={{ color: 'var(--text-primary)' }}>{selectedDispute.resolvedBy?.name || 'System Admin'}</strong>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Decision: <strong className="capitalize" style={{ color: 'var(--accent-primary)' }}>{selectedDispute.status.replace('resolved_', '')}</strong>
                    </div>
                    <div className="space-y-1 pt-2">
                      <span className="uppercase text-[9px] block" style={{ color: 'var(--text-muted)' }}>RULING NOTES</span>
                      <p className="rounded-xl p-4 border font-sans text-xs" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--text-secondary)' }}>
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

      {/* Raise Dispute Modal */}
      {showRaiseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-3xl border p-8 max-w-md w-full shadow-2xl space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>Raise a Dispute</h3>
              <button onClick={() => setShowRaiseModal(false)} className="text-xl" style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleRaiseDispute} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold font-mono uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Payment / Milestone ID
                </label>
                <input
                  type="text"
                  required
                  value={newDisputePaymentId}
                  onChange={(e) => setNewDisputePaymentId(e.target.value)}
                  placeholder="Paste the payment ID..."
                  className="w-full text-sm rounded-xl px-4 py-2.5 outline-none"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold font-mono uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Reason / Description
                </label>
                <textarea
                  required
                  value={newDisputeReason}
                  onChange={(e) => setNewDisputeReason(e.target.value)}
                  placeholder="Describe the issue clearly..."
                  rows={4}
                  className="w-full text-sm rounded-xl px-4 py-2.5 outline-none resize-none"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowRaiseModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={raiseLoading} className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-50">
                  {raiseLoading ? 'Filing...' : '⚖️ File Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="py-6 text-center text-xs border-t" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}>
        © 2026 SkillSphere Escrow Court. All Rights Reserved.
      </footer>
    </div>
  );
}
