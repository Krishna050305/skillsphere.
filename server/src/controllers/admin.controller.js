import Joi from 'joi';
import User from '../models/User.js';
import Gig from '../models/Gig.js';
import Payment from '../models/Payment.js';
import AdminLog from '../models/AdminLog.js';

// Joi Schemas for Admin
export const suspendUserSchema = Joi.object({
  status: Joi.string().valid('active', 'suspended', 'banned').required(),
});

export const verifyFreelancerSchema = Joi.object({
  isVerified: Joi.boolean().required(),
});

export const approveGigSchema = Joi.object({
  status: Joi.string().valid('open', 'cancelled').required(),
});

/**
 * Gets paginated and filterable list of users
 */
export async function getUsers(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Suspends or bans a user
 */
export async function suspendUser(req, res, next) {
  try {
    const { id } = req.params;
    const { error, value } = suspendUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const oldStatus = user.status;
    user.status = value.status;
    await user.save();

    // Log the administration action
    const log = new AdminLog({
      admin: req.user._id,
      action: 'suspend_user',
      targetType: 'User',
      targetId: user._id,
      metadata: {
        oldStatus,
        newStatus: value.status,
      },
    });
    await log.save();

    res.status(200).json({
      success: true,
      message: `User status changed from ${oldStatus} to ${value.status} successfully.`,
      user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Verifies freelancer profile
 */
export async function verifyFreelancer(req, res, next) {
  try {
    const { id } = req.params;
    const { error, value } = verifyFreelancerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const user = await User.findById(id);
    if (!user || user.role !== 'freelancer') {
      return res.status(404).json({ success: false, message: 'Freelancer not found.' });
    }

    if (!user.freelancerProfile) {
      return res.status(400).json({ success: false, message: 'Freelancer profile is not initialized.' });
    }

    user.freelancerProfile.isVerifiedFreelancer = value.isVerified;
    await user.save();

    const log = new AdminLog({
      admin: req.user._id,
      action: 'verify_freelancer',
      targetType: 'User',
      targetId: user._id,
      metadata: {
        isVerified: value.isVerified,
      },
    });
    await log.save();

    res.status(200).json({
      success: true,
      message: `Freelancer verification status set to ${value.isVerified} successfully.`,
      user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Moderates/approves/cancels a Gig
 */
export async function approveGig(req, res, next) {
  try {
    const { id } = req.params;
    const { error, value } = approveGigSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const gig = await Gig.findById(id);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found.' });
    }

    const oldStatus = gig.status;
    gig.status = value.status;
    await gig.save();

    const log = new AdminLog({
      admin: req.user._id,
      action: 'moderate_gig',
      targetType: 'Gig',
      targetId: gig._id,
      metadata: {
        oldStatus,
        newStatus: value.status,
      },
    });
    await log.save();

    res.status(200).json({
      success: true,
      message: `Gig status changed from ${oldStatus} to ${value.status} successfully.`,
      gig,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Computes platform analytics using optimized MongoDB aggregation pipelines
 */
export async function getAnalytics(req, res, next) {
  try {
    // 1. Total Platform Revenue (sum of platformFee across released payments)
    const revenueData = await Payment.aggregate([
      { $match: { state: 'released' } },
      { $group: { _id: null, totalRevenue: { $sum: '$platformFee' } } },
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // 2. Active Freelancer Count
    const activeFreelancers = await User.countDocuments({
      role: 'freelancer',
      status: 'active',
    });

    // 3. Top Gig Categories (group by requiredSkills)
    const topCategories = await Gig.aggregate([
      { $unwind: '$requiredSkills' },
      { $group: { _id: '$requiredSkills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // 4. Job Success Rate (completed gigs / total assigned/in-progress/completed gigs)
    const successRateData = await Gig.aggregate([
      {
        $match: {
          status: { $in: ['assigned', 'in_progress', 'completed'] },
        },
      },
      {
        $group: {
          _id: null,
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          rate: {
            $cond: [{ $eq: ['$totalCount', 0] }, 0, { $divide: ['$completedCount', '$totalCount'] }],
          },
        },
      },
    ]);
    const jobSuccessRate = successRateData.length > 0 ? successRateData[0].rate : 0;

    // 5. Daily Revenue Breakdown (for Recharts chart)
    const dailyRevenue = await Payment.aggregate([
      { $match: { state: 'released' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$platformFee' },
          volume: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalRevenue,
        activeFreelancers,
        topCategories,
        jobSuccessRate,
        dailyRevenue,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets paginated list of fraud logs
 */
export async function getFraudFlags(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { action: 'fraud_flag' };

    const logs = await AdminLog.find(query)
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AdminLog.countDocuments(query);

    res.status(200).json({
      success: true,
      flags: logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}
