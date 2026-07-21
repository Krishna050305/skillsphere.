import User from '../models/User.js';
import Review from '../models/Review.js';

/**
 * Recalculates the freelancerProfile.reputationScore for a given user.
 * The reputation score is a weighted average of all reviews, where reviews 
 * from the last 90 days are weighted slightly higher (1.2x).
 * 
 * @param {String} userId - ID of the user (freelancer)
 * @returns {Promise<Number>} The updated reputation score
 */
export const recalculateScore = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Only calculate for freelancers
  if (user.role !== 'freelancer' && !user.freelancerProfile) {
    return 0;
  }

  const reviews = await Review.find({ reviewee: userId });
  if (reviews.length === 0) {
    if (user.freelancerProfile) {
      user.freelancerProfile.reputationScore = 0;
      await user.save();
    }
    return 0;
  }

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  let totalWeight = 0;
  let weightedSum = 0;

  for (const review of reviews) {
    const isRecent = review.createdAt >= ninetyDaysAgo;
    const weight = isRecent ? 1.2 : 1.0;
    
    weightedSum += review.rating * weight;
    totalWeight += weight;
  }

  const score = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
  // Round to 2 decimal places, and clamp between 0 and 5
  const roundedScore = Math.max(0, Math.min(5, Math.round(score * 100) / 100));

  if (!user.freelancerProfile) {
    user.freelancerProfile = {};
  }
  user.freelancerProfile.reputationScore = roundedScore;
  
  await user.save();
  return roundedScore;
};
