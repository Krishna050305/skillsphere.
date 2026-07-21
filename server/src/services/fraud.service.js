import Review from '../models/Review.js';
import AdminLog from '../models/AdminLog.js';
import User from '../models/User.js';
import Proposal from '../models/Proposal.js';

/**
 * Helper to get a system admin or fallback user ID to satisfy the required admin ref in AdminLog
 */
const getSystemAdminId = async (fallbackId) => {
  const admin = await User.findOne({ role: 'admin' });
  if (admin) return admin._id;
  
  // Fallback to any user if no admin exists (e.g. initial dev database)
  const anyUser = await User.findOne({ role: 'client' }) || await User.findOne();
  return anyUser ? anyUser._id : fallbackId;
};

/**
 * Heuristic: checkReviewVelocity
 * Flags if the same reviewer has posted 3+ reviews in the last 10 minutes.
 * Writes an AdminLog entry with action 'fraud_flag' when triggered.
 * 
 * @param {String} reviewerId - ID of the reviewer
 */
export const checkReviewVelocity = async (reviewerId) => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const count = await Review.countDocuments({
    reviewer: reviewerId,
    createdAt: { $gte: tenMinutesAgo }
  });

  if (count >= 3) {
    const adminId = await getSystemAdminId(reviewerId);
    const adminLog = new AdminLog({
      admin: adminId,
      action: 'fraud_flag',
      targetType: 'User',
      targetId: reviewerId,
      metadata: {
        reason: 'Review velocity threshold exceeded (3+ reviews in 10 minutes)',
        reviewCount: count,
        timeWindowMinutes: 10
      }
    });
    await adminLog.save();
    console.log(`[FRAUD FLAG] Reviewer ${reviewerId} flagged for review velocity: ${count} reviews in last 10 mins.`);
  }
};

/**
 * Heuristic: checkRatingOutlier
 * Flags if a freelancer has all 5-star reviews but their proposal-to-hire conversion rate
 * (completed gigs / total proposals) is below a threshold (15%), suggesting reviews might be fake.
 * Writes an AdminLog entry with action 'fraud_flag' when triggered.
 * 
 * @param {String} userId - ID of the freelancer (reviewee)
 */
export const checkRatingOutlier = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'freelancer') return;

  const reviews = await Review.find({ reviewee: userId });
  if (reviews.length === 0) return;

  // Check if all reviews are 5 stars
  const allFiveStars = reviews.every(r => r.rating === 5);
  if (!allFiveStars) return;

  // Calculate conversion rate: completed gigs / total proposals
  const totalProposals = await Proposal.countDocuments({ freelancer: userId });
  if (totalProposals === 0) return;

  const completedGigs = user.freelancerProfile?.completedGigs || 0;
  const conversionRate = completedGigs / totalProposals;
  const threshold = 0.15; // 15% threshold

  if (conversionRate < threshold) {
    const adminId = await getSystemAdminId(userId);
    const adminLog = new AdminLog({
      admin: adminId,
      action: 'fraud_flag',
      targetType: 'User',
      targetId: userId,
      metadata: {
        reason: 'Rating outlier: 100% 5-star reviews with low proposal-to-hire conversion rate',
        conversionRate,
        completedGigs,
        totalProposals,
        threshold
      }
    });
    await adminLog.save();
    console.log(`[FRAUD FLAG] Freelancer ${userId} flagged for rating outlier: conversion rate ${conversionRate.toFixed(4)} with only 5-star reviews.`);
  }
};
