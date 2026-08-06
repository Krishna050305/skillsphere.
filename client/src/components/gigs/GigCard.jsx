import React from 'react';
import { Link } from 'react-router-dom';

export default function GigCard({ gig, matchScore }) {
  const {
    _id,
    title,
    description,
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
    if (!dateString) return 'recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const visibleSkills = requiredSkills.slice(0, 4);
  const remainingSkills = requiredSkills.length - 4;

  return (
    <div className="card p-6 flex flex-col justify-between relative group no-underline" style={{ background: 'var(--bg-card)' }}>
      {/* Match Score Badge */}
      {matchScore !== undefined && matchScore !== null && (
        <div className="absolute -top-3 right-4 badge badge-gold shadow-md text-xs font-bold font-mono">
          ★ Match {Math.round(matchScore * 100)}%
        </div>
      )}

      <div>
        {/* Title */}
        <div className="flex justify-between items-start gap-3 mb-2">
          <Link to={`/gigs/${_id}`} className="no-underline">
            <h3 className="text-base font-bold font-display hover:underline transition-colors leading-snug line-clamp-1" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h3>
          </Link>
          <span className="badge badge-green text-[10px] uppercase shrink-0">
            {gig.status || 'open'}
          </span>
        </div>

        {/* Client info & time */}
        <div className="flex items-center gap-2 text-xs mb-3 font-mono" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{client.name || 'Verified Client'}</span>
          <span>•</span>
          <span>{timeAgo(createdAt)}</span>
        </div>

        {/* Description preview (2 lines) */}
        <p className="text-xs line-clamp-2 mb-4 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {description}
        </p>

        {/* Required Skills tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {visibleSkills.map((skill, idx) => (
            <span key={idx} className="badge badge-green text-[10px]">
              {skill}
            </span>
          ))}
          {remainingSkills > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
              +{remainingSkills} more
            </span>
          )}
        </div>
      </div>

      {/* Footer details */}
      <div>
        <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-secondary)' }}>
          <div>
            <span className="text-[10px] uppercase font-mono block" style={{ color: 'var(--text-muted)' }}>Budget</span>
            <span className="text-sm font-extrabold font-display" style={{ color: 'var(--accent-secondary)' }}>
              ${budgetMin?.toLocaleString()}
              {budgetMax ? ` - $${budgetMax.toLocaleString()}` : '+'}
              {budgetType === 'hourly' && '/hr'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono block" style={{ color: 'var(--text-muted)' }}>Location</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {isRemoteOk ? '🌐 Remote OK' : `📍 ${location?.city || 'Hyperlocal'}`}
            </span>
          </div>
        </div>

        <Link
          to={`/gigs/${_id}`}
          className="mt-4 w-full block text-center btn-primary text-xs no-underline py-2.5"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}

