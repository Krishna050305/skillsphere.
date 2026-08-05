import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Building2, MapPin, Mail, Phone, Globe, Users, Briefcase, 
  DollarSign, Star, Edit3, ArrowRight, Clock, Tag
} from 'lucide-react';
import ReviewList from '../reviews/ReviewList.jsx';

export default function ClientProfileView({ user, isOwner, onEditClick }) {
  const [activeTab, setActiveTab] = useState('about'); // 'about', 'gigs', 'reviews'

  const cp = user.clientProfile || {};

  // Query gigs posted by this client
  const { data: gigsData, isLoading: loadingGigs } = useQuery({
    queryKey: ['clientGigs', user._id],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:5000/api/gigs?client=${user._id}&status=all`);
      return res.data;
    },
  });

  const gigsList = gigsData?.gigs || [];
  const openGigsCount = gigsList.filter(g => g.status === 'open').length;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* CLIENT HERO CARD */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -z-10 bg-amber-500/10 h-72 w-72 rounded-full blur-3xl" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar / Logo */}
          <div className="relative">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={cp.companyName || user.name}
                className="w-28 h-28 rounded-3xl border-2 border-amber-500/30 object-cover shadow-2xl"
              />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 flex items-center justify-center font-black text-4xl text-white shadow-2xl font-display">
                {(cp.companyName || user.name).charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
              <h1 className="text-3xl font-black text-slate-100 font-display">{cp.companyName || user.name}</h1>
              <span className="px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold uppercase tracking-wider w-fit mx-auto md:mx-0">
                CLIENT / EMPLOYER
              </span>
            </div>

            {cp.tagline ? (
              <p className="text-base font-semibold text-amber-400 font-sans">{cp.tagline}</p>
            ) : (
              <p className="text-xs text-slate-400 font-mono">Representative: {user.name}</p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs text-slate-400 font-mono pt-1">
              {cp.industry && (
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  {cp.industry}
                </span>
              )}
              {cp.companySize && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  {cp.companySize} employees
                </span>
              )}
              {user.location?.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {user.location.city}{user.location.address ? `, ${user.location.address}` : ''}
                </span>
              )}
              {cp.website && (
                <a
                  href={cp.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-amber-400 underline hover:text-amber-300"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Website
                </a>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {isOwner && (
            <button
              onClick={onEditClick}
              className="mt-4 md:mt-0 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-950/50 transition-all flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        {/* CLIENT STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl text-center md:text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 justify-center md:justify-start">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Gigs Posted
            </div>
            <p className="text-2xl font-black text-slate-100 font-display mt-1">{cp.gigsPosted || gigsList.length || 0}</p>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl text-center md:text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 justify-center md:justify-start">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Active Hiring Gigs
            </div>
            <p className="text-2xl font-black text-emerald-400 font-display mt-1">{openGigsCount}</p>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl text-center md:text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 justify-center md:justify-start">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Total Capital Spent
            </div>
            <p className="text-2xl font-black text-slate-100 font-display mt-1">${(cp.totalSpent || 0).toLocaleString()}</p>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl text-center md:text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 justify-center md:justify-start">
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> Direct Contact
            </div>
            <p className="text-xs font-mono font-bold text-slate-300 mt-2.5 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-800 gap-4 font-mono text-xs overflow-x-auto pb-1">
        {[
          { id: 'about', label: 'About Company', icon: Building2 },
          { id: 'gigs', label: `Posted Gigs (${gigsList.length})`, icon: Briefcase },
          { id: 'reviews', label: `Freelancer Reviews`, icon: Star },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-5 rounded-2xl flex items-center gap-2 font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: ABOUT */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Company Overview</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-sans">
              {cp.about || 'No company bio provided yet.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-500">Industry</span>
              <p className="text-sm font-bold text-slate-200">{cp.industry || 'Not specified'}</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-500">Company Size</span>
              <p className="text-sm font-bold text-slate-200">{cp.companySize ? `${cp.companySize} employees` : '1-10 employees'}</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-500">Official Website</span>
              {cp.website ? (
                <a href={cp.website} target="_blank" rel="noreferrer" className="text-sm font-bold text-amber-400 underline block truncate">
                  {cp.website}
                </a>
              ) : (
                <p className="text-sm font-bold text-slate-500">Not provided</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: POSTED GIGS */}
      {activeTab === 'gigs' && (
        <div className="space-y-6">
          {loadingGigs ? (
            <div className="p-12 text-center text-slate-400 font-mono text-sm">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading client job openings...
            </div>
          ) : gigsList.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {gigsList.map((gig) => (
                <div
                  key={gig._id}
                  className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                        gig.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        gig.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        gig.status === 'completed' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {gig.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Posted {new Date(gig.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-100">{gig.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{gig.description}</p>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {gig.requiredSkills?.map((skill, sIdx) => (
                        <span key={sIdx} className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-mono uppercase block">Budget</span>
                      <span className="text-base font-bold text-amber-400 font-mono">
                        ${gig.budgetMin} {gig.budgetMax ? `- $${gig.budgetMax}` : ''} ({gig.budgetType})
                      </span>
                    </div>

                    <Link
                      to={`/gigs/${gig._id}`}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      View Gig Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500">
              <p className="text-sm">No gigs posted by this client yet.</p>
              {isOwner && (
                <Link
                  to="/gigs/post"
                  className="mt-4 inline-block px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs"
                >
                  + Post a New Gig
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 md:p-8">
          <ReviewList userId={user._id} />
        </div>
      )}
    </div>
  );
}
