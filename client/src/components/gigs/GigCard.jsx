import React from 'react';
import { Link } from 'react-router-dom';

export default function GigCard({ gig, matchScore }) {
  const {
    _id,
    title,
    budgetType,
    budgetMin,
    budgetMax,
    location,
    isRemoteOk,
    requiredSkills = [],
    createdAt,
    client = {},
  } = gig;

  // Format posted date
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 backdrop-blur-sm shadow-md hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between group h-full">
      {matchScore !== undefined && (
        <div className="absolute -top-3 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-mono text-xs font-black px-3 py-1 rounded-full shadow-lg border border-indigo-400">
          Match: {Math.round(matchScore * 100)}%
        </div>
      )}

      <div>
        <div className="flex justify-between items-start gap-4 mb-3">
          <Link to={`/gigs/${_id}`}>
            <h3 className="text-lg font-bold text-slate-100 hover:text-indigo-400 transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>
        </div>

        {/* Client Name & Time */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <span className="font-semibold text-slate-400">{client.name || 'Anonymous Client'}</span>
          <span>•</span>
          <span>{timeAgo(createdAt)}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {requiredSkills.map((skill, idx) => (
            <span
              key={idx}
              className="text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded-md hover:bg-slate-700 hover:text-white transition-colors"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div>
        {/* Budget and Location Details */}
        <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-mono">
              Budget ({budgetType})
            </span>
            <span className="text-sm font-bold text-indigo-400">
              ${budgetMin.toLocaleString()}
              {budgetMax ? ` - $${budgetMax.toLocaleString()}` : '+'}
              {budgetType === 'hourly' && '/hr'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-mono">
              Location
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {isRemoteOk ? '🌐 Remote OK' : `📍 ${location?.city || 'On-site'}`}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/gigs/${_id}`}
          className="mt-4 w-full block text-center bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-bold py-2 px-4 rounded-xl border border-slate-700/80 hover:border-indigo-500 transition-all duration-300"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
