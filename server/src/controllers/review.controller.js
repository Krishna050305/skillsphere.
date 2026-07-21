import Review from '../models/Review.js';
import Proposal from '../models/Proposal.js';
import { recalculateScore } from '../services/reputation.service.js';
import { checkReviewVelocity, checkRatingOutlier } from '../services/fraud.service.js';
import { emitNotification } from '../sockets/notification.handler.js';

/**
 * Creates a review.
 * STRICTLY enforces:
 * 1. Referenced Proposal exists.
 * 2. Proposal belongs to the reviewer (either client or freelancer).
 * 3. The associated Gig has status 'completed'.
 * 4. The user has not reviewed this proposal yet.
 * Recalculates reputationScore and runs fraud velocity/outlier checks after saving.
 */
export const createReview = async (req, res, next) => {
  try {
    const { proposalId, rating, comment } = req.body;
    const reviewerId = req.user._id;

    if (!proposalId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'proposalId, rating, and comment are required fields'
      });
    }

    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    if (comment.trim().length < 20 || comment.trim().length > 1500) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be between 20 and 1500 characters'
      });
    }

    // 1. Fetch Proposal and populate its associated Gig
    const proposal = await Proposal.findById(proposalId).populate('gig');
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Referenced Proposal not found'
      });
    }

    const gig = proposal.gig;
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig associated with the proposal not found'
      });
    }

    // 2. Enforce Gig status === 'completed'
    if (gig.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Reviews can only be submitted for completed gigs (Current status: ${gig.status})`
      });
    }

    // 3. Enforce that the Proposal belongs to the reviewer/reviewee appropriately
    let revieweeId;
    if (reviewerId.toString() === gig.client.toString()) {
      // Client is reviewing freelancer
      revieweeId = proposal.freelancer;
    } else if (reviewerId.toString() === proposal.freelancer.toString()) {
      // Freelancer is reviewing client
      revieweeId = gig.client;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not a participant in this completed gig/proposal'
      });
    }

    // 4. Enforce one review per reviewer per proposal
    const existingReview = await Review.findOne({ proposal: proposalId, reviewer: reviewerId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this completed gig/proposal'
      });
    }

    // Create and save review
    const review = new Review({
      gig: gig._id,
      proposal: proposal._id,
      reviewer: reviewerId,
      reviewee: revieweeId,
      rating: ratingVal,
      comment: comment.trim()
    });

    await review.save();

    // Trigger score recalculation on the reviewee
    await recalculateScore(revieweeId);

    // Run fraud velocity detection on the reviewer
    await checkReviewVelocity(reviewerId);

    // Run fraud rating outlier detection on the reviewee
    await checkRatingOutlier(revieweeId);

    // Send real-time notification
    try {
      await emitNotification(revieweeId, 'review_added', {
        reviewerName: req.user.name,
        reviewerId: reviewerId,
        rating: ratingVal,
        commentPreview: comment.substring(0, 50),
        gigTitle: gig.title
      });
    } catch (notifError) {
      console.error('Failed to dispatch review notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    next(error);
  }
};

/**
 * Public endpoint to fetch all reviews for a user with pagination.
 */
export const getReviewsForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ reviewee: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewer', 'name avatarUrl role')
      .populate('gig', 'title');

    const total = await Review.countDocuments({ reviewee: userId });

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting reviews for user:', error);
    next(error);
  }
};
