import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Navigation from '../components/Navigation.jsx';
import ProposalForm from '../components/proposals/ProposalForm.jsx';
import ProposalList from '../components/proposals/ProposalList.jsx';
import { useAuth } from '../hooks/useAuth.js';
import ReviewForm from '../components/reviews/ReviewForm.jsx';
import MilestoneTracker from '../components/payments/MilestoneTracker.jsx';

export default function GigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [activeTab, setActiveTab] = useState('proposals'); // 'proposals' or 'recommendations'
  const [inviteStatus, setInviteStatus] = useState({});

  // 1. Fetch Gig Details
  const { data: gigData, isLoading: gigLoading, isError: gigError } = useQuery({
    queryKey: ['gig', id],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/gigs/${id}`, { headers });
      return res.data?.gig;
    },
  });

  // 2. Fetch Proposals (only if client owner or admin)
  const isOwner = gigData?.client?._id === user?._id;
  const isAdmin = user?.role === 'admin';
  const canSeeProposals = isOwner || isAdmin;

  const { data: proposalsData, refetch: refetchProposals } = useQuery({
    queryKey: ['proposals', id],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/proposals/gig/${id}`, { headers });
      return res.data?.proposals || [];
    },
    enabled: !!gigData && canSeeProposals,
  });

  // 3. Fetch Recommended Freelancers (only if client owner)
  const { data: recommendations } = useQuery({
    queryKey: ['recommendedFreelancers', id],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/gigs/${id}/recommended-freelancers`, { headers });
      return res.data?.results || [];
    },
    enabled: !!gigData && isOwner,
  });

  const isFreelancer = user?.role === 'freelancer';

  // Fetch own proposal if freelancer on a completed gig to get proposal ID for review
  const { data: myProposalData } = useQuery({
    queryKey: ['myProposal', id],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/proposals/my-proposal/gig/${id}`, { headers });
      return res.data?.proposal;
    },
    enabled: !!gigData && isFreelancer && gigData.status === 'completed',
  });

  // 4. Invite Freelancer Mutation
  const inviteMutation = useMutation({
    mutationFn: async (freelancerId) => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(
        `http://localhost:5000/api/gigs/${id}/invite`,
        { freelancerId },
        { headers }
      );
      return res.data;
    },
    onSuccess: (data, freelancerId) => {
      setInviteStatus(prev => ({ ...prev, [freelancerId]: 'invited' }));
      queryClient.invalidateQueries(['gig', id]);
    },
  });

  if (gigLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <Navigation />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-mono text-slate-400">Loading Gig Details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (gigError || !gigData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <Navigation />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <span className="text-4xl">⚠️</span>
            <h3 className="text-lg font-bold text-slate-200">Gig Not Found</h3>
            <p className="text-sm text-slate-400">The project link might be broken or the gig has been removed.</p>
            <Link to="/gigs" className="mt-4 inline-block bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl text-xs">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if current freelancer already submitted a proposal
  const hasSubmittedProposal = proposalsData?.some(
    (p) => p.freelancer?._id === user?._id || p.freelancer === user?._id
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navigation />

      <main className="max-w-6xl mx-auto px-6 py-12 flex-grow w-full space-y-8">
        {/* Back Link */}
        <Link to="/gigs" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 w-fit">
          <span>←</span> Back to Marketplace
        </Link>

        {/* Main Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gig Details Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="space-y-2">
                  <span className={`text-[9px] uppercase font-mono tracking-widest px-2.5 py-1 rounded-full ${
                    gigData.status === 'open' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {gigData.status} Status
                  </span>
                  <h1 className="text-2xl font-black text-slate-100">{gigData.title}</h1>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Est. Budget</span>
                  <span className="text-xl font-black text-indigo-400">
                    ${gigData.budgetMin.toLocaleString()}
                    {gigData.budgetMax ? ` - $${gigData.budgetMax.toLocaleString()}` : '+'}
                    {gigData.budgetType === 'hourly' ? '/hr' : ' Fixed'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider font-mono">Job Description</h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-sans">
                  {gigData.description}
                </p>
              </div>

              {/* Required Skills */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider font-mono">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {gigData.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/80 px-3 py-1 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              {gigData.milestones && gigData.milestones.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-800/80">
                  <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider font-mono">Project Milestones</h3>
                  <div className="space-y-3">
                    {gigData.milestones.map((milestone, idx) => (
                      <div
                        key={milestone._id || idx}
                        className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex items-center justify-between gap-4 text-xs font-mono"
                      >
                        <div className="space-y-1">
                          <span className="text-slate-200 font-bold block">{milestone.title}</span>
                          {milestone.dueDate && (
                            <span className="text-slate-500">Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-indigo-400 font-bold block">${milestone.amount.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
                            {milestone.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Client proposals viewing area */}
            {canSeeProposals && (
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex border-b border-slate-800">
                  <button
                    onClick={() => setActiveTab('proposals')}
                    className={`py-3 px-6 font-bold text-sm tracking-tight transition-all border-b-2 ${
                      activeTab === 'proposals'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Proposals Received ({proposalsData?.length || 0})
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className={`py-3 px-6 font-bold text-sm tracking-tight transition-all border-b-2 ${
                        activeTab === 'recommendations'
                          ? 'border-indigo-500 text-indigo-400'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      AI Recommended Freelancers ({recommendations?.length || 0})
                    </button>
                  )}
                </div>

                {activeTab === 'proposals' ? (
                  <ProposalList proposals={proposalsData || []} onActionComplete={refetchProposals} />
                ) : (
                  <div className="space-y-4">
                    {recommendations?.length === 0 ? (
                      <div className="text-center py-10 bg-slate-900/30 border border-slate-800 rounded-2xl">
                        <p className="text-sm text-slate-400">No matching freelancers found near this location with matching skills.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {recommendations?.map((rec) => {
                          const { freelancer: fl, score } = rec;
                          const hasInvited = gigData.invitedFreelancers?.includes(fl._id) || inviteStatus[fl._id] === 'invited';

                          return (
                            <div
                              key={fl._id}
                              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={fl.avatarUrl || 'https://via.placeholder.com/150'}
                                  alt={fl.name}
                                  className="w-12 h-12 rounded-full border border-slate-800 object-cover"
                                />
                                <div>
                                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                    {fl.name}
                                    <span className="bg-indigo-500/10 text-indigo-400 font-mono text-[9px] font-black px-2 py-0.5 rounded-full border border-indigo-500/20">
                                      Match {Math.round(score * 100)}%
                                    </span>
                                  </h4>
                                  <p className="text-xs text-slate-400">{fl.freelancerProfile?.headline}</p>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    Rating: {fl.freelancerProfile?.reputationScore || 0}/5 • Rate: ${fl.freelancerProfile?.hourlyRate}/hr
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  disabled={hasInvited || inviteMutation.isLoading}
                                  onClick={() => inviteMutation.mutate(fl._id)}
                                  className={`text-xs font-bold py-2 px-4 rounded-xl border transition-all ${
                                    hasInvited
                                      ? 'bg-slate-900 border-slate-850 text-slate-500 cursor-default'
                                      : 'bg-indigo-600/10 hover:bg-indigo-600 border-indigo-500/30 text-indigo-400 hover:text-white'
                                  }`}
                                >
                                  {hasInvited ? '✓ Invited' : 'Invite to Apply'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Render Milestone Tracker if Gig is Assigned */}
            {gigData.assignedFreelancer && (
              <div className="mt-6">
                <MilestoneTracker gig={gigData} />
              </div>
            )}

            {/* Conditionally Render Review Form for Completed Gigs */}
            {gigData.status === 'completed' && (
              <div className="mt-6">
                {isOwner && (
                  <div>
                    {(() => {
                      const acceptedProposal = proposalsData?.find(
                        (p) => p.status === 'accepted' || p.freelancer?._id === gigData.assignedFreelancer?._id || p.freelancer === gigData.assignedFreelancer
                      );
                      if (acceptedProposal) {
                        return (
                          <ReviewForm
                            proposalId={acceptedProposal._id}
                            onReviewSubmitted={() => {
                              queryClient.invalidateQueries(['gig', id]);
                            }}
                          />
                        );
                      }
                      return (
                        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-xs">
                          No accepted proposal found to review.
                        </div>
                      );
                    })()}
                  </div>
                )}

                {isFreelancer && (gigData.assignedFreelancer?._id === user?._id || gigData.assignedFreelancer === user?._id) && (
                  <div>
                    {myProposalData ? (
                      <ReviewForm
                        proposalId={myProposalData._id}
                        onReviewSubmitted={() => {
                          queryClient.invalidateQueries(['gig', id]);
                          queryClient.invalidateQueries(['myProposal', id]);
                        }}
                      />
                    ) : (
                      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-xs animate-pulse">
                        Loading your proposal information for review...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Context Sidebar Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Metadata Card */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 text-xs font-mono">
              <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider block font-mono border-b border-slate-800 pb-2">Details</h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 block">CLIENT</span>
                  <span className="text-slate-200 font-bold text-sm capitalize">{gigData.client?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">WORK LOCATION</span>
                  <span className="text-slate-200 font-bold text-sm">
                    {gigData.isRemoteOk ? '🌐 Remote OK' : `📍 ${gigData.location?.city || 'On-site'}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">BUDGET TYPE</span>
                  <span className="text-slate-200 font-bold text-sm uppercase">{gigData.budgetType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">DATE POSTED</span>
                  <span className="text-slate-200 font-bold text-sm">
                    {new Date(gigData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Freelancer actions panel */}
            {user?.role === 'freelancer' && (
              <div className="space-y-4">
                {hasSubmittedProposal ? (
                  <div className="bg-slate-900/35 border border-indigo-950/60 p-6 rounded-2xl text-center space-y-2">
                    <span className="text-2xl">✓</span>
                    <h3 className="text-sm font-bold text-slate-250">Proposal Submitted</h3>
                    <p className="text-xs text-slate-400">You have already submitted a proposal for this gig. You will be notified if the client initiates negotiations.</p>
                  </div>
                ) : gigData.status !== 'open' ? (
                  <div className="bg-slate-900/35 border border-slate-800 p-6 rounded-2xl text-center">
                    <p className="text-xs text-slate-400">Applications are closed for this gig (Status: {gigData.status}).</p>
                  </div>
                ) : (
                  <>
                    {!showProposalForm ? (
                      <button
                        onClick={() => setShowProposalForm(true)}
                        className="w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/30 transition-all duration-300"
                      >
                        Apply for this Job
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowProposalForm(false)}
                          className="w-full text-center bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold py-2 px-4 rounded-xl border border-slate-700/80 transition-colors"
                        >
                          Cancel Proposal
                        </button>
                        <ProposalForm
                          gigId={id}
                          onSuccess={() => {
                            setShowProposalForm(false);
                            refetchProposals();
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        <p>© 2026 SkillSphere Hyperlocal Freelance Marketplace. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
