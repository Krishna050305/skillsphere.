import React, { useState, useEffect } from 'react';
import { getReviewsForUser } from '../../api/reviews.api.js';

export default function ReviewList({ userId, reputationScore }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await getReviewsForUser(userId, page, 10);
      if (data.success) {
        setReviews(data.reviews || []);
        setPagination(data.pagination || null);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadReviews();
    }
  }, [userId, page]);

  // Helper to render star ratings
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5 text-sm text-amber-400">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={s <= rating ? 'drop-shadow-[0_0_4px_rgba(251,191,36,0.35)]' : 'text-slate-700'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const formattedScore = parseFloat(reputationScore || 0).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Reputation score banner */}
      <div className="bg-gradient-to-tr from-slate-900 via-indigo-950/20 to-purple-950/15 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <h3 className="text-base font-bold text-slate-100">Client Feedback & Reputation</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Reputation score is computed as a weighted average. Recent reviews are weighted 1.2x.
          </p>
        </div>

        {/* Big Score Widget */}
        <div className="flex items-center gap-4 bg-slate-900/80 px-6 py-4 rounded-2xl border border-slate-800/80">
          <div className="text-center">
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">
              {formattedScore}
            </span>
            <span className="text-xs font-semibold text-slate-500 block mt-0.5">out of 5.0</span>
          </div>
          <div className="h-10 w-[1px] bg-slate-800"></div>
          <div>
            {renderStars(Math.round(reputationScore || 0))}
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              ({reviews.length} total reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Reviews feed */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-200">Reviews ({reviews.length})</h4>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-xs">Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-8 text-center text-slate-500">
            <span className="text-xl mb-1 block">💬</span>
            <p className="text-xs font-semibold">No reviews yet</p>
            <p className="text-[10px] text-slate-650 mt-0.5">When users complete gigs, their reviews will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-2xl p-5 transition-all space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    {/* User Avatar */}
                    {review.reviewer?.avatarUrl ? (
                      <img
                        src={review.reviewer.avatarUrl}
                        alt={review.reviewer.name}
                        className="h-8 w-8 rounded-full border border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                        {review.reviewer?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-200">
                        {review.reviewer?.name || 'Deleted User'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-550 block">
                        {review.reviewer?.role || 'user'}
                      </span>
                    </div>
                  </div>

                  {/* Stars & Date */}
                  <div className="flex flex-col items-end gap-1">
                    {renderStars(review.rating)}
                    <span className="text-[9px] font-mono text-slate-500">
                      {new Date(review.createdAt).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <p className="text-xs text-slate-300 leading-relaxed break-words font-medium">
                  "{review.comment}"
                </p>

                {/* Verified transaction banner */}
                {review.gig && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-400/85">
                    <span className="text-xs">🛡️</span> Verified transaction:
                    <span className="font-semibold text-slate-350 hover:underline cursor-pointer">
                      {review.gig.title}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-[10px] font-bold border border-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-800 transition-colors"
                >
                  Prev
                </button>
                <span className="text-[10px] font-mono text-slate-500">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 py-1 text-[10px] font-bold border border-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-800 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
