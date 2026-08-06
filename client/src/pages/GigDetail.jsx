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
import { IconStar, IconMapPin, IconSend, IconCheck, IconUser, IconAward, IconExternal, IconPaperclip, IconGlobe, IconMessage } from '../components/icons';

const API = 'http://localhost:5000/api';

export default function GigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [activeTab, setActiveTab] = useState('proposals'); 
  const [inviteStatus, setInviteStatus] = useState({});

  // 1. Fetch Gig Details
  const { data: gigData, isLoading: gigLoading, isError: gigError } = useQuery({
    queryKey: ['gig', id],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/gigs/${id}`, { headers });
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
      const res = await axios.get(`${API}/proposals/gig/${id}`, { headers });
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
      const res = await axios.get(`${API}/gigs/${id}/recommended-freelancers`, { headers });
      return res.data?.results || [];
    },
    enabled: !!gigData && isOwner,
  });

  const isFreelancer = user?.role === 'freelancer';

  // Fetch own proposal if freelancer
  const { data: myProposalData } = useQuery({
    queryKey: ['myProposal', id],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/proposals/my-proposal/gig/${id}`, { headers });
      return res.data?.proposal;
    },
    enabled: !!gigData && isFreelancer,
  });

  // 4. Invite Freelancer Mutation
  const inviteMutation = useMutation({
    mutationFn: async (freelancerId) => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(
        `${API}/gigs/${id}/invite`,
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

  // Render Stars
  const renderStars = (score = 5) => {
    const stars = [];
    const count = Math.round(score);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <IconStar
          key={i}
          className={`w-3.5 h-3.5 ${i <= count ? 'text-[var(--accent-secondary)] fill-[var(--accent-secondary)]' : ''}`}
          style={i <= count ? { color: 'var(--accent-secondary)' } : { color: 'var(--text-muted)' }}
        />
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  // Loading Skeleton State
  if (gigLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Navigation />
        <main className="max-w-6xl mx-auto px-6 py-12 flex-grow w-full space-y-8 animate-pulse">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-8 space-y-6">
                <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="h-20 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="h-10 w-1/2 bg-gray-200 dark:bg-gray-800 rounded"></div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="card p-6 h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error State
  if (gigError || !gigData) {
    return (
      <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <Navigation />
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="card p-12 text-center max-w-md w-full space-y-4">
            <span className="text-4xl block">⚠️</span>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Gig Not Found</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>The project link might be broken or the gig has been removed.</p>
            <Link to="/gigs" className="btn-primary inline-block text-xs no-underline">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasSubmittedProposal = !!myProposalData || proposalsData?.some(
    (p) => p.freelancer?._id === user?._id || p.freelancer === user?._id
  );

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navigation />

      <main className="max-w-6xl mx-auto px-6 py-12 flex-grow w-full space-y-8">
        {/* Back Link */}
        <Link to="/gigs" className="text-xs font-semibold hover:underline flex items-center gap-1.5 w-fit" style={{ color: 'var(--accent-primary)' }}>
          <span>←</span> Back to Marketplace
        </Link>

        {/* Prominent Assigned Freelancer Card (if assigned) */}
        {gigData.assignedFreelancer && (
          <div className="card p-6 border-l-4" style={{ borderLeftColor: 'var(--accent-primary)' }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md text-lg" style={{ background: 'var(--gradient-brand)' }}>
                  {gigData.assignedFreelancer.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Assigned Freelancer</span>
                    <span className="badge badge-green text-[10px]">Active Hire</span>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{gigData.assignedFreelancer.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{gigData.assignedFreelancer.email}</p>
                </div>
              </div>
                <Link to="/messages" className="btn-primary text-xs flex items-center gap-2 no-underline">
                <IconSend className="w-3.5 h-3.5" /> Message Freelancer
              </Link>
            </div>
          </div>
        )}

        {/* Main Grid Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gig Details Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-8 space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="space-y-2">
                  <span className={`badge ${gigData.status === 'open' ? 'badge-green' : 'badge-gold'}`}>
                    ● {gigData.status?.toUpperCase()}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-extrabold font-display" style={{ color: 'var(--text-primary)' }}>
                    {gigData.title}
                  </h1>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    Posted by <strong style={{ color: 'var(--text-primary)' }}>{gigData.client?.name || 'Client'}</strong> • {new Date(gigData.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono block" style={{ color: 'var(--text-muted)' }}>Est. Budget</span>
                  <span className="text-2xl font-extrabold font-display" style={{ color: 'var(--accent-secondary)' }}>
                    ${gigData.budgetMin?.toLocaleString()}
                    {gigData.budgetMax ? ` - $${gigData.budgetMax.toLocaleString()}` : '+'}
                  </span>
                  <span className="text-xs block font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    {gigData.budgetType === 'hourly' ? 'Hourly Rate' : 'Fixed Price'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--text-muted)' }}>
                  Job Description
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line font-sans" style={{ color: 'var(--text-secondary)' }}>
                  {gigData.description}
                </p>
              </div>

              {/* Required Skills */}
              <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono mb-2" style={{ color: 'var(--text-muted)' }}>
                  Required Skills & Qualifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {gigData.requiredSkills?.map((skill, idx) => (
                    <span key={idx} className="badge badge-green text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Project Milestones Table */}
              {gigData.milestones && gigData.milestones.length > 0 && (
                <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--text-muted)' }}>
                    Project Milestones ({gigData.milestones.length})
                  </h3>
                  <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-secondary)' }}>
                    <table className="w-full text-left text-xs">
                      <thead className="font-mono uppercase text-[10px]" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Milestone</th>
                          <th className="p-3">Due Date</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
                        {gigData.milestones.map((m, idx) => (
                          <tr key={m._id || idx}>
                            <td className="p-3 font-mono" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                            <td className="p-3 font-bold" style={{ color: 'var(--text-primary)' }}>{m.title}</td>
                            <td className="p-3 font-mono" style={{ color: 'var(--text-secondary)' }}>
                              {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'Flexible'}
                            </td>
                            <td className="p-3 text-right font-bold" style={{ color: 'var(--accent-secondary)' }}>
                              ${m.amount?.toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <span className="badge badge-green text-[10px] font-mono">
                                {m.status || 'pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Attachments List */}
              {gigData.attachments && gigData.attachments.length > 0 && (
                <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--text-muted)' }}>
                    Project Attachments
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {gigData.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="card p-3 flex items-center gap-2 text-xs no-underline hover:border-[var(--accent-primary)] transition-all"
                        style={{ background: 'var(--bg-tertiary)' }}
                      >
                        <IconPaperclip className="w-4 h-4 text-[var(--accent-primary)]" />
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{att.name || `Attachment ${idx + 1}`}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Owner Section: Proposals & Recommendations Tabs */}
            {canSeeProposals && (
              <div className="space-y-6">
                <div className="flex border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                  <button
                    onClick={() => setActiveTab('proposals')}
                    className={`py-3 px-6 font-bold text-sm transition-all border-b-2 cursor-pointer ${
                      activeTab === 'proposals'
                        ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Proposals Received ({proposalsData?.length || 0})
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className={`py-3 px-6 font-bold text-sm transition-all border-b-2 cursor-pointer ${
                        activeTab === 'recommendations'
                          ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      ★ Recommended Freelancers ({recommendations?.length || 0})
                    </button>
                  )}
                </div>

                {activeTab === 'proposals' ? (
                  <ProposalList proposals={proposalsData || []} onActionComplete={refetchProposals} />
                ) : (
                  <div className="space-y-4">
                    {recommendations?.length === 0 ? (
                      <div className="card p-8 text-center" style={{ background: 'var(--bg-card)' }}>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No recommended freelancers found matching this gig's required skills.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {recommendations?.map((rec) => {
                          const { freelancer: fl, score } = rec;
                          const hasInvited = gigData.invitedFreelancers?.includes(fl._id) || inviteStatus[fl._id] === 'invited';

                          return (
                            <div key={fl._id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md text-lg shrink-0" style={{ background: 'var(--gradient-brand)' }}>
                                  {fl.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{fl.name}</h4>
                                    <span className="badge badge-gold text-[10px]">
                                      Match {Math.round(score * 100)}%
                                    </span>
                                  </div>
                                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{fl.freelancerProfile?.headline || 'Verified Local Freelancer'}</p>
                                  <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                                    {renderStars(fl.freelancerProfile?.reputationScore || 5)}
                                    <span>${fl.freelancerProfile?.hourlyRate || 35}/hr</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                disabled={hasInvited || inviteMutation.isLoading}
                                onClick={() => inviteMutation.mutate(fl._id)}
                                className={`btn-primary text-xs shrink-0 ${hasInvited ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {hasInvited ? '✓ Invited' : 'Invite Freelancer'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
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
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 20, padding: 16 }} className="text-center text-xs" >
                          <span style={{ color: 'var(--text-secondary)' }}>No accepted proposal found to review.</span>
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
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 20, padding: 16 }} className="text-center text-xs animate-pulse">
                        <span style={{ color: 'var(--text-secondary)' }}>Loading your proposal information for review...</span>
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
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 12, padding: 16 }} className="text-xs font-mono">
                <h3 className="text-sm font-bold uppercase tracking-wider block font-mono" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-secondary)', paddingBottom: 8 }}>Details</h3>
              
                <div className="space-y-3" style={{ marginTop: 8 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>CLIENT</span>
                    <span className="font-bold text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{gigData.client?.name}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>WORK LOCATION</span>
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {gigData.isRemoteOk ? (
                        <><IconGlobe className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} /> Remote OK</>
                      ) : (
                        <><IconMapPin className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} /> {gigData.location?.city || 'On-site'}</>
                      )}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>BUDGET TYPE</span>
                    <span className="font-bold text-sm uppercase" style={{ color: 'var(--text-primary)' }}>{gigData.budgetType}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>DATE POSTED</span>
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {new Date(gigData.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Start Conversation CTA */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 12, padding: 12 }} className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold" style={{ color: 'var(--text-primary)', margin: 0 }}>Start Conversation</h4>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Have a quick question? Message the client directly.</p>
                </div>
                <Link to="/messages" className="btn-primary text-xs flex items-center gap-2 no-underline">
                  <MessageCircle className="w-4 h-4" /> Message
                </Link>
              </div>

            {/* Freelancer actions panel */}
            {user?.role === 'freelancer' && (
              <div className="space-y-4">
                {hasSubmittedProposal ? (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 12, padding: 16 }} className="text-center space-y-2">
                    <IconCheck className="mx-auto" style={{ width: 28, height: 28, color: 'var(--accent-primary)' }} />
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Proposal Submitted</h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>You have already submitted a proposal for this gig. You will be notified if the client initiates negotiations.</p>
                  </div>
                ) : gigData.status !== 'open' ? (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 12, padding: 16 }} className="text-center">
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Applications are closed for this gig (Status: {gigData.status}).</p>
                  </div>
                ) : (
                  <>
                    {!showProposalForm ? (
                      <button
                        onClick={() => setShowProposalForm(true)}
                        className="btn-primary w-full text-xs font-bold py-3 px-4 rounded-xl transition-all duration-300"
                      >
                        <span className="flex items-center justify-center gap-2"><IconSend className="w-4 h-4" /> Apply for this Job</span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowProposalForm(false)}
                          className="btn-secondary w-full text-xs font-bold py-2 px-4 rounded-xl"
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

      <footer style={{ borderTop: '1px solid var(--border-secondary)', background: 'var(--bg-primary)', paddingTop: 24, paddingBottom: 24 }} className="text-center text-xs">
        <p style={{ color: 'var(--text-muted)' }}>© 2026 SkillSphere Hyperlocal Freelance Marketplace. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
