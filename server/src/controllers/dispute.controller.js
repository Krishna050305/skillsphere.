import Joi from 'joi';
import Dispute from '../models/Dispute.js';
import Payment from '../models/Payment.js';
import Gig from '../models/Gig.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';
import { transition } from '../services/escrow.service.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// Joi schemas
export const createDisputeSchema = Joi.object({
  paymentId: Joi.string().hex().length(24).required(),
  reason: Joi.string().min(10).max(1000).required(),
});

export const resolveDisputeSchema = Joi.object({
  resolution: Joi.string().valid('released', 'refunded').required(),
  adminNotes: Joi.string().max(2000).optional().default(''),
});

/**
 * Client or freelancer raises a dispute on a payment in progress or review
 */
export async function createDispute(req, res, next) {
  try {
    const { error, value } = createDisputeSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { paymentId, reason } = value;

    // 1. Fetch Payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Verify authorized user
    const isClient = payment.client.toString() === req.user._id.toString();
    const isFreelancer = payment.freelancer.toString() === req.user._id.toString();
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not a participant in this payment.' });
    }

    // Verify payment state is eligible for dispute
    if (!['in_progress', 'submitted_for_review'].includes(payment.state)) {
      return res.status(400).json({
        success: false,
        message: `Cannot dispute a payment that is currently in '${payment.state}' state.`,
      });
    }

    // Check if a dispute already exists for this payment
    const existing = await Dispute.findOne({ payment: paymentId, status: 'open' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An active dispute already exists for this milestone.' });
    }

    // 2. Transition Payment to 'disputed' state
    await transition(payment, 'disputed', req.user._id);

    // 3. Create Dispute document
    const dispute = new Dispute({
      payment: payment._id,
      raisedBy: req.user._id,
      reason,
      status: 'open',
    });

    await dispute.save();

    res.status(201).json({
      success: true,
      message: 'Dispute raised successfully. Escrow funds are locked.',
      dispute,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Uploads evidence files for an active dispute
 */
export async function addEvidence(req, res, next) {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const dispute = await Dispute.findById(id).populate('payment');
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute record not found.' });
    }

    // Verify user is part of the dispute
    const payment = dispute.payment;
    const isClient = payment.client.toString() === req.user._id.toString();
    const isFreelancer = payment.freelancer.toString() === req.user._id.toString();
    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot upload evidence for this dispute.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No evidence file uploaded.' });
    }

    // Upload to Cloudinary
    let fileUrl;
    try {
      fileUrl = await uploadToCloudinary(req.file.buffer, 'disputes', req.file.originalname);
    } catch (uploadErr) {
      console.error('Evidence upload failed:', uploadErr);
      return res.status(500).json({ success: false, message: 'Failed to upload evidence file.' });
    }

    // Append evidence
    dispute.evidence.push({
      url: fileUrl,
      description: description || req.file.originalname,
    });

    // Automatically transition from 'open' to 'under_review' upon adding evidence (for admin notice)
    if (dispute.status === 'open') {
      dispute.status = 'under_review';
    }

    await dispute.save();

    res.status(200).json({
      success: true,
      message: 'Evidence added successfully.',
      dispute,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin resolves a dispute by releasing or refunding escrow funds
 */
export async function resolveDispute(req, res, next) {
  try {
    const { id } = req.params;
    const { error, value } = resolveDisputeSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { resolution, adminNotes } = value;

    // 1. Fetch Dispute & Payment
    const dispute = await Dispute.findById(id).populate('payment');
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute record not found.' });
    }

    if (['resolved_client', 'resolved_freelancer', 'resolved_split'].includes(dispute.status)) {
      return res.status(400).json({ success: false, message: 'Dispute is already resolved.' });
    }

    const payment = dispute.payment;
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Associated payment record not found.' });
    }

    // 2. Perform escrow transition based on resolution
    if (resolution === 'released') {
      // Release escrow to freelancer
      await transition(payment, 'released', req.user._id);

      // Update gig milestone status
      const gig = await Gig.findById(payment.gig);
      if (gig) {
        const milestone = gig.milestones.id(payment.milestone);
        if (milestone) {
          milestone.status = 'paid';
        }
        const allPaid = gig.milestones.every((m) => m.status === 'paid');
        if (allPaid) {
          gig.status = 'completed';
        }
        await gig.save();
      }

      // Update Freelancer earnings & completed status
      const freelancer = await User.findById(payment.freelancer);
      if (freelancer && freelancer.freelancerProfile) {
        freelancer.freelancerProfile.totalEarnings += (payment.amount - payment.platformFee);
        if (gig && gig.status === 'completed') {
          freelancer.freelancerProfile.completedGigs += 1;
        }
        await freelancer.save();
      }

      // Update Client spending
      const client = await User.findById(payment.client);
      if (client && client.clientProfile) {
        client.clientProfile.totalSpent += payment.amount;
        await client.save();
      }

      dispute.status = 'resolved_freelancer';
    } else if (resolution === 'refunded') {
      // Refund escrow to client
      await transition(payment, 'refunded', req.user._id);

      // Update gig milestone status back to pending
      const gig = await Gig.findById(payment.gig);
      if (gig) {
        const milestone = gig.milestones.id(payment.milestone);
        if (milestone) {
          milestone.status = 'pending';
          await gig.save();
        }
      }

      dispute.status = 'resolved_client';
    }

    // 3. Update Dispute fields
    dispute.adminNotes = adminNotes;
    dispute.resolvedBy = req.user._id;
    await dispute.save();

    // 4. Write Admin Log Entry
    const adminLog = new AdminLog({
      admin: req.user._id,
      action: 'resolve_dispute',
      targetType: 'Dispute',
      targetId: dispute._id,
      metadata: {
        resolution,
        paymentId: payment._id,
        adminNotes,
      },
    });

    await adminLog.save();

    res.status(200).json({
      success: true,
      message: `Dispute resolved successfully. Escrow funds were ${resolution}.`,
      dispute,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get disputes list (paginated, client/freelancer/admin filtering)
 */
export async function getDisputes(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.user.role !== 'admin') {
      // Find disputes where user is client or freelancer in the linked payment
      const myPayments = await Payment.find({
        $or: [{ client: req.user._id }, { freelancer: req.user._id }]
      }).select('_id');
      
      const myPaymentIds = myPayments.map((p) => p._id);
      query.payment = { $in: myPaymentIds };
    }

    const disputes = await Dispute.find(query)
      .populate({
        path: 'payment',
        populate: [
          { path: 'gig', select: 'title description' },
          { path: 'client', select: 'name email' },
          { path: 'freelancer', select: 'name email' }
        ]
      })
      .populate('raisedBy', 'name email role')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Dispute.countDocuments(query);

    res.status(200).json({
      success: true,
      disputes,
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
 * Get dispute details by ID
 */
export async function getDisputeById(req, res, next) {
  try {
    const { id } = req.params;
    const dispute = await Dispute.findById(id)
      .populate({
        path: 'payment',
        populate: [
          { path: 'gig', select: 'title description' },
          { path: 'client', select: 'name email' },
          { path: 'freelancer', select: 'name email' }
        ]
      })
      .populate('raisedBy', 'name email role')
      .populate('resolvedBy', 'name email');

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found.' });
    }

    // Verify authorized user
    const payment = dispute.payment;
    const isClient = payment.client._id.toString() === req.user._id.toString();
    const isFreelancer = payment.freelancer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isClient && !isFreelancer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    res.status(200).json({
      success: true,
      dispute,
    });
  } catch (err) {
    next(err);
  }
}
