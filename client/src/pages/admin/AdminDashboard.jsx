import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Navigation from '../../components/Navigation.jsx';
import AnalyticsCharts from '../../components/admin/AnalyticsCharts.jsx';
import FraudFlagsList from '../../components/admin/FraudFlagsList.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <Navigation />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm animate-fade-in">
            <span className="text-4xl">⚠️</span>
            <h3 className="text-lg font-bold text-slate-200 font-mono">403 - FORBIDDEN ACCESS</h3>
            <p className="text-xs text-slate-500 font-mono leading-relaxed">
              Administrative credentials are required to access this sector. Secure logging triggered.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('analytics');

  // Users tab state
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Gigs tab state
  const [gigPage, setGigPage] = useState(1);

  // 1. Fetch Analytics
  const { data: analyticsRes, isLoading: analyticsLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/admin/analytics`, { headers });
      return res.data;
    },
    enabled: activeTab === 'analytics',
  });

  // 2. Fetch Users
  const { data: usersRes, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers', userPage, userSearch, userRoleFilter],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const roleQuery = userRoleFilter ? `&role=${userRoleFilter}` : '';
      const searchQuery = userSearch ? `&search=${userSearch}` : '';
      const res = await axios.get(
        `http://localhost:5000/api/admin/users?page=${userPage}&limit=10${roleQuery}${searchQuery}`,
        { headers }
      );
      return res.data;
    },
    enabled: activeTab === 'users',
  });

  // 3. Fetch Gigs (Moderation Queue)
  const { data: gigsRes, isLoading: gigsLoading } = useQuery({
    queryKey: ['adminGigs', gigPage],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Fetching all Gigs for moderation
      const res = await axios.get(`http://localhost:5000/api/gigs?page=${gigPage}&limit=10`, { headers });
      return res.data;
    },
    enabled: activeTab === 'gigs',
  });

  // Mutations
  const suspendMutation = useMutation({
    mutationFn: async ({ userId, status }) => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`http://localhost:5000/api/admin/users/${userId}/suspend`, { status }, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      alert('User account status updated successfully.');
    },
  });

  const verifyFreelancerMutation = useMutation({
    mutationFn: async ({ userId, isVerified }) => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`http://localhost:5000/api/admin/users/${userId}/verify`, { isVerified }, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      alert('Freelancer verification status updated.');
    },
  });

  const moderateGigMutation = useMutation({
    mutationFn: async ({ gigId, status }) => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`http://localhost:5000/api/admin/gigs/${gigId}/approve`, { status }, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminGigs']);
      alert('Gig moderation status applied successfully.');
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400 font-bold';
      case 'suspended':
        return 'text-amber-400 font-bold';
      case 'banned':
        return 'text-red-400 font-bold';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Marketplace Administration</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Platform-wide statistics, user management, and safety controls.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-900 gap-6">
          {[
            { id: 'analytics', label: '📊 Core Analytics' },
            { id: 'users', label: '👤 User Accounts' },
            { id: 'gigs', label: '💼 Gigs Moderation' },
            { id: 'fraud', label: '🛡️ Security Flags' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-xs font-bold font-mono tracking-wider transition-all border-b-2 uppercase ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-450 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && (
            <>
              {analyticsLoading ? (
                <div className="py-24 text-center space-y-2">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-mono text-slate-500">Calculating platform statistics...</p>
                </div>
              ) : (
                <AnalyticsCharts analytics={analyticsRes?.analytics} />
              )}
            </>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* User search bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/20 border border-slate-900 rounded-2xl p-4">
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-slate-950 border border-slate-850 rounded-xl py-1.5 px-3 text-xs text-slate-350 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-slate-950 border border-slate-850 rounded-xl py-1.5 px-3 text-xs text-slate-350 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Roles</option>
                  <option value="client">Client</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {usersLoading ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-mono text-slate-500">Loading user profiles...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="overflow-x-auto bg-slate-900/40 border border-slate-850 rounded-3xl backdrop-blur-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-[10px] font-mono text-slate-500 uppercase tracking-wider bg-slate-900/60">
                          <th className="py-4 px-6">User</th>
                          <th className="py-4 px-6">Role</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">Verification</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-xs">
                        {usersRes?.users.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-semibold text-slate-200">{u.name}</div>
                              <div className="text-[10px] font-mono text-slate-500">{u.email}</div>
                            </td>
                            <td className="py-4 px-6 font-mono capitalize">{u.role}</td>
                            <td className="py-4 px-6 font-mono capitalize">
                              <span className={getStatusColor(u.status)}>{u.status}</span>
                            </td>
                            <td className="py-4 px-6">
                              {u.role === 'freelancer' ? (
                                <span className={u.freelancerProfile?.isVerifiedFreelancer ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                                  {u.freelancerProfile?.isVerifiedFreelancer ? '✓ Verified' : 'Unverified'}
                                </span>
                              ) : (
                                <span className="text-slate-600 font-mono">—</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right space-x-3">
                              {u.role === 'freelancer' && (
                                <button
                                  onClick={() =>
                                    verifyFreelancerMutation.mutate({
                                      userId: u._id,
                                      isVerified: !u.freelancerProfile?.isVerifiedFreelancer,
                                    })
                                  }
                                  className="bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-400 hover:text-white font-bold py-1 px-3 rounded-xl text-[10px] transition-all"
                                >
                                  {u.freelancerProfile?.isVerifiedFreelancer ? 'Revoke Verification' : 'Verify'}
                                </button>
                              )}

                              {u.status === 'active' ? (
                                <button
                                  onClick={() => suspendMutation.mutate({ userId: u._id, status: 'suspended' })}
                                  className="bg-amber-600/10 hover:bg-amber-600 border border-amber-500/30 text-amber-400 hover:text-white font-bold py-1 px-3 rounded-xl text-[10px] transition-all"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => suspendMutation.mutate({ userId: u._id, status: 'active' })}
                                  className="bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white font-bold py-1 px-3 rounded-xl text-[10px] transition-all"
                                >
                                  Activate
                                </button>
                              )}

                              {u.status !== 'banned' && (
                                <button
                                  onClick={() => suspendMutation.mutate({ userId: u._id, status: 'banned' })}
                                  className="bg-red-600/10 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white font-bold py-1 px-3 rounded-xl text-[10px] transition-all"
                                >
                                  Ban
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {usersRes?.pagination.pages > 1 && (
                    <div className="flex items-center justify-between bg-slate-900/20 border border-slate-900 rounded-2xl p-4">
                      <button
                        disabled={userPage === 1}
                        onClick={() => setUserPage((p) => p - 1)}
                        className="bg-slate-850 hover:bg-slate-850/80 text-slate-300 font-bold py-1.5 px-4 rounded-xl text-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        ◀ Previous
                      </button>
                      <span className="text-xs font-mono text-slate-500">
                        Page {userPage} of {usersRes.pagination.pages}
                      </span>
                      <button
                        disabled={userPage === usersRes.pagination.pages}
                        onClick={() => setUserPage((p) => p + 1)}
                        className="bg-slate-850 hover:bg-slate-850/80 text-slate-300 font-bold py-1.5 px-4 rounded-xl text-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        Next ▶
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GIGS MODERATION */}
          {activeTab === 'gigs' && (
            <div className="space-y-6">
              {gigsLoading ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-mono text-slate-500">Loading marketplace listings...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="overflow-x-auto bg-slate-900/40 border border-slate-850 rounded-3xl backdrop-blur-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-[10px] font-mono text-slate-500 uppercase tracking-wider bg-slate-900/60">
                          <th className="py-4 px-6">Gig details</th>
                          <th className="py-4 px-6">Client</th>
                          <th className="py-4 px-6 text-right">Budget</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-xs">
                        {gigsRes?.gigs.map((g) => (
                          <tr key={g._id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="py-4 px-6 space-y-1">
                              <strong className="text-slate-200 block truncate max-w-xs">{g.title}</strong>
                              <span className="text-[10px] font-mono text-slate-500 block truncate max-w-xs">ID: {g._id}</span>
                            </td>
                            <td className="py-4 px-6 font-mono">{g.client?.name || 'Client owner'}</td>
                            <td className="py-4 px-6 text-right font-bold font-mono text-slate-300">${g.budgetMax || g.budgetMin}</td>
                            <td className="py-4 px-6 font-mono capitalize">
                              <span className={g.status === 'cancelled' ? 'text-red-400' : 'text-slate-350'}>{g.status}</span>
                            </td>
                            <td className="py-4 px-6 text-right space-x-3">
                              {g.status !== 'cancelled' ? (
                                <button
                                  onClick={() => moderateGigMutation.mutate({ gigId: g._id, status: 'cancelled' })}
                                  className="bg-red-600/10 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white font-bold py-1 px-3 rounded-xl text-[10px] transition-all"
                                >
                                  Flag / Cancel Gig
                                </button>
                              ) : (
                                <button
                                  onClick={() => moderateGigMutation.mutate({ gigId: g._id, status: 'open' })}
                                  className="bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-400 hover:text-white font-bold py-1 px-3 rounded-xl text-[10px] transition-all"
                                >
                                  Re-open Gig
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {gigsRes?.pagination?.pages > 1 && (
                    <div className="flex items-center justify-between bg-slate-900/20 border border-slate-900 rounded-2xl p-4">
                      <button
                        disabled={gigPage === 1}
                        onClick={() => setGigPage((p) => p - 1)}
                        className="bg-slate-850 hover:bg-slate-850/80 text-slate-300 font-bold py-1.5 px-4 rounded-xl text-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        ◀ Previous
                      </button>
                      <span className="text-xs font-mono text-slate-500">
                        Page {gigPage} of {gigsRes.pagination.pages}
                      </span>
                      <button
                        disabled={gigPage === gigsRes.pagination.pages}
                        onClick={() => setGigPage((p) => p + 1)}
                        className="bg-slate-850 hover:bg-slate-850/80 text-slate-300 font-bold py-1.5 px-4 rounded-xl text-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        Next ▶
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SECURITY FLAGS */}
          {activeTab === 'fraud' && <FraudFlagsList />}
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        <p>© 2026 SkillSphere Administrative Division. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
