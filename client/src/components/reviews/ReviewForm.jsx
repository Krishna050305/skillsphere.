import React, { useState } from 'react';
import { createReview } from '../../api/reviews.api.js';

/**
 * ReviewForm component.
 * Handled as a sub-component on the Gig Detail page of a completed gig,
 * rather than a separate page/route, to enforce correct context visually and structurally.
 */
export default function ReviewForm({ proposalId, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment || comment.trim().length < 20) {
      setError('Your comment must be at least 20 characters long.');
      return;
    }
    if (comment.trim().length > 1500) {
      setError('Your comment cannot exceed 1500 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await createReview({
        proposalId,
        rating,
        comment: comment.trim()
      });

      if (data.success) {
        setSuccess(true);
        if (onReviewSubmitted) {
          // Fire success callback after 1.5 seconds
          setTimeout(() => {
            onReviewSubmitted(data.review);
          }, 1500);
        }
      } else {
        setError(data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.message || 'Failed to submit review. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl max-w-xl mx-auto w-full">
      <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
        <span>⭐</span> Leave a Review
      </h3>
      <p className="text-xs text-slate-400 mb-6 leading-relaxed">
        Provide feedback on your experience. Rating must be 1 to 5 stars, and the review must be detailed.
      </p>

      {success ? (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-semibold text-center animate-pulse">
          🎉 Review submitted successfully! Recalculating scores...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-350">Rating</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                >
                  <span
                    className={
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                        : 'text-slate-700'
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
              <span className="text-xs font-mono text-slate-400 ml-2">
                ({rating} out of 5)
              </span>
            </div>
          </div>

          {/* Comment textarea */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-355">Comment</label>
              <span className={`text-[10px] font-mono ${comment.length < 20 ? 'text-rose-450' : 'text-slate-500'}`}>
                {comment.length}/1500 (min 20)
              </span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What went well? What could be improved? (minimum 20 characters)"
              rows={4}
              maxLength={1500}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-indigo-500/80 rounded-2xl text-slate-100 text-sm font-medium outline-none transition-all placeholder:text-slate-650"
              required
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-400 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
              ⚠️ {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || comment.trim().length < 20}
            className={`w-full py-3 px-4 font-bold text-xs rounded-2xl transition-all cursor-pointer ${
              comment.trim().length < 20
                ? 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 hover:shadow-indigo-500/35'
            }`}
          >
            {loading ? 'Submitting review...' : 'Submit Review'}
          </button>
        </form>
      )}
    </div>
  );
}
