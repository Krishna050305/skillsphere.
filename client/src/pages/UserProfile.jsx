import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Navigation from '../components/Navigation.jsx';
import ReviewList from '../components/reviews/ReviewList.jsx';

export default function UserProfile() {
  const { id } = useParams();

  // Fetch the target user's details
  const { data: profileUser, isLoading, isError } = useQuery({
    queryKey: ['userProfile', id],
    queryFn: async () => {
      const token = sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/users/${id}`, { headers });
      return res.data?.user;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <Navigation />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
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
            <span className="text-4xl">⚠️</span>
            <h3 className="text-lg font-bold text-slate-200">Profile Not Found</h3>
            <p className="text-sm text-slate-400">The profile might be private or does not exist.</p>
            <Link to="/" className="mt-4 inline-block bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl text-xs">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isFreelancer = profileUser.role === 'freelancer';
  const hasProfile = isFreelancer ? !!profileUser.freelancerProfile : !!profileUser.clientProfile;
  const score = isFreelancer ? (profileUser.freelancerProfile?.reputationScore || 0) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-12 flex-grow w-full space-y-8">
        {/* Profile Card */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_50%)] h-64 w-64 blur-2xl"></div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            {profileUser.avatarUrl ? (
              <img
                src={profileUser.avatarUrl}
                alt={profileUser.name}
                className="w-24 h-24 rounded-3xl border border-slate-700 object-cover shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center font-bold text-3xl text-white shadow-xl">
                {profileUser.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 justify-center md:justify-start">
                <h1 className="text-2xl font-black text-slate-100">{profileUser.name}</h1>
                <span className="px-3 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-750 text-[10px] font-mono uppercase tracking-wider w-fit mx-auto md:mx-0">
                  {profileUser.role}
                </span>
              </div>

              {isFreelancer && profileUser.freelancerProfile?.headline && (
                <p className="text-sm font-bold text-indigo-400">{profileUser.freelancerProfile.headline}</p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-400 font-mono">
                {profileUser.location?.city && (
                  <span>📍 {profileUser.location.city}</span>
                )}
                {isFreelancer && profileUser.freelancerProfile?.hourlyRate && (
                  <span>💵 ${profileUser.freelancerProfile.hourlyRate}/hr</span>
                )}
                <span>✉️ {profileUser.email}</span>
              </div>
            </div>
          </div>

          {/* Bio / Description */}
          {hasProfile && (
            <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
              <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest font-mono">Biography</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-sans">
                {isFreelancer
                  ? profileUser.freelancerProfile.bio || 'No bio provided.'
                  : profileUser.clientProfile.about || 'No company bio provided.'}
              </p>
            </div>
          )}

          {/* Skills */}
          {isFreelancer && profileUser.freelancerProfile?.skills?.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest font-mono">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profileUser.freelancerProfile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold bg-slate-850 text-slate-300 border border-slate-800 px-3 py-1 rounded-xl"
                  >
                    {skill.name} • <span className="text-[10px] text-slate-500 capitalize">{skill.proficiency}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews List Component */}
        {isFreelancer && (
          <div className="bg-slate-900/20 border border-slate-850/80 rounded-3xl p-6 md:p-8">
            <ReviewList userId={profileUser._id} reputationScore={score} />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        <p>© 2026 SkillSphere Hyperlocal Freelance Marketplace. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
