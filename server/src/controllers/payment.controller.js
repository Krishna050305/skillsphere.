import Joi from 'joi';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Gig from '../models/Gig.js';
import User from '../models/User.js';
import razorpay from '../config/razorpay.js';
import { transition } from '../services/escrow.service.js';

// Joi schemas
export const createOrderSchema = Joi.object({
  gigId: Joi.string().hex().length(24).required(),
  milestoneId: Joi.string().hex().length(24).required(),
});

export const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

/**
 * Creates a Razorpay Order and Payment document in state 'created'
 */
export async function createOrder(req, res, next) {
  try {
    const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { gigId, milestoneId } = value;

    // 1. Fetch Gig and verify ownership
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found.' });
    }

    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not the client owner of this gig.' });
    }

    if (!gig.assignedFreelancer) {
      return res.status(400).json({ success: false, message: 'Gig must be assigned to a freelancer before funding.' });
    }

    // 2. Fetch Milestone
    const milestone = gig.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found in this gig.' });
    }

    // 3. Prevent double funding if active payment exists
    const activePayment = await Payment.findOne({
      milestone: milestoneId,
      state: { $in: ['funded', 'in_progress', 'submitted_for_review', 'disputed', 'released'] },
    });

    if (activePayment) {
      return res.status(400).json({
        success: false,
        message: `Milestone is already funded or paid. (Current status: ${activePayment.state})`,
      });
    }

    // 4. Create Razorpay order
    const amountInPaise = Math.round(milestone.amount * 100);
    const options = {
      amount: amountInPaise,
      currency: 'INR', // INR test mode currency compatibility
      receipt: `receipt_m_${milestoneId.toString().substring(0, 10)}`,
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (rzpErr) {
      console.error('Razorpay Order creation error:', rzpErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order with external gateway.',
        error: rzpErr.message,
      });
    }

    // 5. Create Payment record in 'created' state
    const payment = new Payment({
      gig: gig._id,
      milestone: milestone._id,
      client: gig.client,
      freelancer: gig.assignedFreelancer,
      amount: milestone.amount,
      platformFee: Math.round(milestone.amount * 0.1 * 100) / 100, // 10% platform fee
      razorpayOrderId: order.id,
      state: 'created',
      stateHistory: [{ state: 'created', at: new Date(), by: req.user._id }],
    });

    await payment.save();

    res.status(201).json({
      success: true,
      payment,
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Razorpay verification callback to confirm funding transaction
 */
export async function verifyPayment(req, res, next) {
  try {
    const { error, value } = verifyPaymentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = value;

    // 1. Verify payment signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder');
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment verification signature.' });
    }

    // 2. Fetch payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found for this order.' });
    }

    if (payment.state !== 'created') {
      return res.status(400).json({ success: false, message: 'Payment order has already been verified or updated.' });
    }

    // 3. Transition to 'funded'
    payment.razorpayPaymentId = razorpay_payment_id;
    await transition(payment, 'funded', payment.client);

    // 4. Update Gig milestone status to 'in_progress' or remains pending until started
    const gig = await Gig.findById(payment.gig);
    if (gig) {
      const milestone = gig.milestones.id(payment.milestone);
      if (milestone) {
        milestone.status = 'in_progress';
        await gig.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and milestone funded successfully.',
      payment,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Freelancer marks milestone active/started
 */
export async function startMilestone(req, res, next) {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only the assigned freelancer can start this milestone.' });
    }

    await transition(payment, 'in_progress', req.user._id);

    // Sync gig milestone status
    const gig = await Gig.findById(payment.gig);
    if (gig) {
      const milestone = gig.milestones.id(payment.milestone);
      if (milestone) {
        milestone.status = 'in_progress';
        await gig.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Milestone transitioned to in progress.',
      payment,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Freelancer marks milestone work submitted
 */
export async function submitMilestone(req, res, next) {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only the assigned freelancer can submit work.' });
    }

    await transition(payment, 'submitted_for_review', req.user._id);

    // Sync gig milestone status
    const gig = await Gig.findById(payment.gig);
    if (gig) {
      const milestone = gig.milestones.id(payment.milestone);
      if (milestone) {
        milestone.status = 'submitted';
        await gig.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Milestone work submitted for review.',
      payment,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Client approves and releases payment from escrow
 */
export async function releasePayment(req, res, next) {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only the client can approve and release funds.' });
    }

    // 1. Transition state
    await transition(payment, 'released', req.user._id);

    // 2. Perform test-mode payout (mocking payout API)
    try {
      console.log(`[Test Mode Payout] Releasing $${payment.amount - payment.platformFee} to freelancer account (payout ID simulation).`);
    } catch (payErr) {
      console.error('External payout failed:', payErr);
    }

    // 3. Update Gig milestone status
    const gig = await Gig.findById(payment.gig);
    if (gig) {
      const milestone = gig.milestones.id(payment.milestone);
      if (milestone) {
        milestone.status = 'paid';
      }

      // Check if all milestones are paid, if so, automatically mark the gig as completed
      const allPaid = gig.milestones.every((m) => m.status === 'paid');
      if (allPaid) {
        gig.status = 'completed';
      }
      await gig.save();
    }

    // 4. Update Freelancer & Client statistics
    const freelancer = await User.findById(payment.freelancer);
    if (freelancer && freelancer.freelancerProfile) {
      freelancer.freelancerProfile.totalEarnings += (payment.amount - payment.platformFee);
      // Increment completed gigs count if the overall gig is now completed
      if (gig && gig.status === 'completed') {
        freelancer.freelancerProfile.completedGigs += 1;
      }
      await freelancer.save();
    }

    const client = await User.findById(payment.client);
    if (client && client.clientProfile) {
      client.clientProfile.totalSpent += payment.amount;
      await client.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment released successfully to the freelancer.',
      payment,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Refund payment to the client
 */
export async function refundPayment(req, res, next) {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Only client, freelancer or admin can initiate refund depending on current status
    const isClient = payment.client.toString() === req.user._id.toString();
    const isFreelancer = payment.freelancer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isClient && !isFreelancer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to refund this payment.' });
    }

    await transition(payment, 'refunded', req.user._id);

    // Update Gig milestone status back to pending
    const gig = await Gig.findById(payment.gig);
    if (gig) {
      const milestone = gig.milestones.id(payment.milestone);
      if (milestone) {
        milestone.status = 'pending';
        await gig.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully to the client.',
      payment,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves paginated payment history for the logged-in user
 */
export async function getPaymentHistory(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Filter by role
    const query = {};
    if (req.user.role === 'client') {
      query.client = req.user._id;
    } else if (req.user.role === 'freelancer') {
      query.freelancer = req.user._id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const payments = await Payment.find(query)
      .populate('gig', 'title description')
      .populate('client', 'name email')
      .populate('freelancer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      payments,
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
