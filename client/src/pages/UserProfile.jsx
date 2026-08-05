import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import Navigation from '../components/Navigation.jsx';
import FreelancerProfileView from '../components/profile/FreelancerProfileView.jsx';
import ClientProfileView from '../components/profile/ClientProfileView.jsx';
import EditFreelancerProfileModal from '../components/profile/EditFreelancerProfileModal.jsx';
import EditClientProfileModal from '../components/profile/EditClientProfileModal.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { updateMe } from '../api/auth.api.js';
import { updateProfileSuccess } from '../store/authSlice.js';

export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser, getMe } = useAuth();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch target user profile
  const { data: profileUser, isLoading, isError, refetch } = useQuery({
    queryKey: ['userProfile', id],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/users/${id}`, { headers });
      return res.data?.user;
    },
  });

  const isOwner = currentUser && profileUser && currentUser._id === profileUser._id;

  const handleSaveProfile = async (payload) => {
    const res = await updateMe(payload);
    if (res.success) {
      dispatch(updateProfileSuccess(res.user));
      await getMe();
      await refetch();
      queryClient.invalidateQueries(['userProfile', id]);
    } else {
      throw new Error(res.message || 'Failed to save profile.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <Navigation />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-mono text-slate-400">Loading User Profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !profileUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <Navigation />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <span className="text-5xl">⚠️</span>
            <h3 className="text-lg font-bold text-slate-200">Profile Not Found</h3>
            <p className="text-sm text-slate-400">The profile might be private or does not exist.</p>
            <Link to="/" className="mt-4 inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-lg">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-10 flex-grow w-full">
        {profileUser.role === 'client' ? (
          <ClientProfileView
            user={profileUser}
            isOwner={isOwner}
            onEditClick={() => setShowEditModal(true)}
          />
        ) : (
          <FreelancerProfileView
            user={profileUser}
            isOwner={isOwner}
            onEditClick={() => setShowEditModal(true)}
          />
        )}
      </main>

      {/* EDIT MODALS */}
      {showEditModal && (
        profileUser.role === 'client' ? (
          <EditClientProfileModal
            user={profileUser}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveProfile}
          />
        ) : (
          <EditFreelancerProfileModal
            user={profileUser}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveProfile}
          />
        )
      )}

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <p>© 2026 SkillSphere Hyperlocal Freelance Ecosystem. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
