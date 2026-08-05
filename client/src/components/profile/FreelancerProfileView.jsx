import React, { useState } from 'react';
import { 
  User, MapPin, Mail, Phone, DollarSign, Star, CheckCircle, 
  Briefcase, Award, Eye, Calendar, ExternalLink, Download, Edit3, ShieldCheck
} from 'lucide-react';
import ReviewList from '../reviews/ReviewList.jsx';

export default function FreelancerProfileView({ user, isOwner, onEditClick }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'portfolio', 'experience', 'reviews'

  const fp = user.freelancerProfile || {};
  const score = fp.reputationScore || 0;
  const hourlyRate = fp.hourlyRate || 0;
  const availability = fp.availability || 'available';
  const skills = fp.skills || [];
  const portfolio = fp.portfolio || [];
  const workHistory = fp.workHistory || [];
  const certifications = fp.certifications || [];
  const resumeUrl = fp.resumeUrl;

  const availabilityBadge = {
    available: { label: 'Available for work', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    busy: { label: 'Busy (Limited Capacity)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    unavailable: { label: 'Unavailable', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
  }[availability] || { label: 'Available', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* FREELANCER HERO CARD */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -z-10 bg-emerald-500/10 h-72 w-72 rounded-full blur-3xl" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-28 h-28 rounded-3xl border-2 border-emerald-500/30 object-cover shadow-2xl"
              />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 flex items-center justify-center font-black text-4xl text-white shadow-2xl font-display">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            {fp.isVerifiedFreelancer && (
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-xl shadow-lg" title="Verified Freelancer">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
              <h1 className="text-3xl font-black text-slate-100 font-display">{user.name}</h1>
              <div className="flex items-center gap-2 justify-center">
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold uppercase tracking-wider">
                  FREELANCER
                </span>
                <span className={`px-3 py-0.5 rounded-full text-xs font-mono font-semibold border ${availabilityBadge.color}`}>
                  {availabilityBadge.label}
                </span>
              </div>
            </div>

            {fp.headline && (
              <p className="text-base font-semibold text-emerald-400 font-sans">{fp.headline}</p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs text-slate-400 font-mono pt-1">
              {user.location?.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {user.location.city}{user.location.address ? `, ${user.location.address}` : ''}
                </span>
              )}
              {hourlyRate > 0 && (
                <span className="flex items-center gap-1.5 font-bold text-slate-200">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  ${hourlyRate}/hr
                </span>
              )}
              {user.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {user.email}
                </span>
              )}
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  {user.phone}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {isOwner && (
            <button
              onClick={onEditClick}
              className="mt-4 md:mt-0 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        {/* FREELANCER STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl text-center md:text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 justify-center md:justify-start">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Completed Gigs
            </div>
            <p className="text-2xl font-black text-slate-100 font-display mt-1">{fp.completedGigs || 0}</p>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl text-center md:text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 justify-center md:justify-start">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Total Earnings
            </div>
            <p className="text-2xl font-black text-slate-100 font-display mt-1">${(fp.totalEarnings || 0).toLocaleString()}</p>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl text-center md:text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 justify-center md:justify-start">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Reputation Score
            </div>
            <p className="text-2xl font-black text-amber-400 font-display mt-1">{score > 0 ? `${score.toFixed(1)} / 5.0` : 'New'}</p>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl text-center md:text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 justify-center md:justify-start">
              <Eye className="w-3.5 h-3.5 text-cyan-400" /> Profile Views
            </div>
            <p className="text-2xl font-black text-slate-100 font-display mt-1">{fp.profileViews || 0}</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-800 gap-4 font-mono text-xs overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview & Skills', icon: User },
          { id: 'portfolio', label: `Portfolio (${portfolio.length})`, icon: Award },
          { id: 'experience', label: `Experience & Resume`, icon: Briefcase },
          { id: 'reviews', label: `Verified Reviews`, icon: Star },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-5 rounded-2xl flex items-center gap-2 font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Bio */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">About & Biography</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-sans">
              {fp.bio || 'No professional bio provided yet.'}
            </p>
          </div>

          {/* Skills Grid */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Skills & Proficiency</h3>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200"
                  >
                    <span>{skill.name}</span>
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-lg ${
                      skill.proficiency === 'expert' ? 'bg-emerald-500/20 text-emerald-400' :
                      skill.proficiency === 'intermediate' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {skill.proficiency}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No skills listed.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PORTFOLIO */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          {portfolio.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {portfolio.map((item, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-44 object-cover border-b border-slate-800" />
                  )}
                  <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-100">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:underline"
                      >
                        Visit Live Demo <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500">
              <p className="text-sm">No portfolio items added yet.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: EXPERIENCE & RESUME */}
      {activeTab === 'experience' && (
        <div className="space-y-6">
          {/* Resume Download Section */}
          {resumeUrl && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Official Resume / Curriculum Vitae</h4>
                  <p className="text-xs text-slate-400">Verified document uploaded by freelancer</p>
                </div>
              </div>
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Download PDF
              </a>
            </div>
          )}

          {/* Work History */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Work History & Experience</h3>
            {workHistory.length > 0 ? (
              <div className="space-y-6 relative border-l-2 border-slate-800 ml-3 pl-6">
                {workHistory.map((wh, idx) => (
                  <div key={idx} className="relative space-y-1">
                    <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-4 border-slate-950" />
                    <h4 className="text-sm font-bold text-slate-100">{wh.title}</h4>
                    <p className="text-xs font-semibold text-emerald-400">{wh.company}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {new Date(wh.from).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })} - {wh.to ? new Date(wh.to).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Present'}
                    </p>
                    {wh.description && (
                      <p className="text-xs text-slate-300 pt-1 leading-relaxed">{wh.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No work history records provided.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 md:p-8">
          <ReviewList userId={user._id} reputationScore={score} />
        </div>
      )}
    </div>
  );
}
