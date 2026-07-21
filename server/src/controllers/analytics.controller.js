import User from '../models/User.js';
import Proposal from '../models/Proposal.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';

export const getFreelancerAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch user to get profile views and total earnings
    const user = await User.findById(userId);
    if (!user || user.role !== 'freelancer' || !user.freelancerProfile) {
      return res.status(400).json({ success: false, message: 'User is not a freelancer' });
    }

    const profileViews = user.freelancerProfile.profileViews || 0;
    const totalEarnings = user.freelancerProfile.totalEarnings || 0;

    // 2. Gig application count
    const applicationCount = await Proposal.countDocuments({ freelancer: userId });

    // 3. Average client rating
    const reviewData = await Review.aggregate([
      { $match: { targetUser: userId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
    ]);
    const avgRating = reviewData.length > 0 ? parseFloat(reviewData[0].avgRating.toFixed(1)) : 0;
    const reviewCount = reviewData.length > 0 ? reviewData[0].reviewCount : 0;

    // 4. Monthly revenue breakdown
    const monthlyRevenue = await Payment.aggregate([
      { $match: { freelancer: userId, state: 'released' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: { $subtract: ['$amount', '$platformFee'] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Format monthly revenue for charts (e.g., "Jan", "Feb")
    const formattedRevenue = monthlyRevenue.map(item => {
      const date = new Date(item._id + '-01'); // Append day to make it a valid date string
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        revenue: item.revenue
      };
    });

    return res.status(200).json({
      success: true,
      analytics: {
        profileViews,
        applicationCount,
        totalEarnings,
        avgRating,
        reviewCount,
        monthlyRevenue: formattedRevenue
      }
    });
  } catch (error) {
    console.error('getFreelancerAnalytics error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
