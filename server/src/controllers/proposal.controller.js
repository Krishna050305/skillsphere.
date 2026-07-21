import Joi from 'joi';
import Proposal from '../models/Proposal.js';
import Gig from '../models/Gig.js';
import Notification from '../models/Notification.js';
import { matchFreelancersToGig } from '../services/matching.service.js';

// Validation schema for creating a proposal
const createProposalSchema = Joi.object({
  gig: Joi.string().required(),
  coverLetter: Joi.string().min(50).max(2000).required(),
  bidAmount: Joi.number().min(1).required(),
  estimatedDays: Joi.number().min(1).max(365).required(),
});

// Validation schema for negotiation action
const negotiateSchema = Joi.object({
  action: Joi.string().valid('counter', 'accept').required(),
  amount: Joi.number().min(1).when('action', {
    is: 'counter',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  message: Joi.string().max(1000).trim().optional(),
});

/**
 * Submit a new proposal to a Gig (Freelancer only)
 */
export async function createProposal(req, res, next) {
  try {
    const { error, value } = createProposalSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => d.message),
      });
    }

    const gig = await Gig.findById(value.gig);
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found.',
      });
    }

    // 1. Verify gig is open
    if (gig.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit proposals for a gig in '${gig.status}' status.`,
      });
    }

    // 2. Prevent duplicate proposals
    const existing = await Proposal.findOne({ gig: gig._id, freelancer: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a proposal for this gig.',
      });
    }

    // 3. Snapshot matchScore from the matching service at submission time
    let matchScore = 0.0;
    try {
      const recommendations = await matchFreelancersToGig(gig._id);
      const myMatch = recommendations.find(r => r.freelancer._id.toString() === req.user._id.toString());
      if (myMatch) {
        matchScore = myMatch.score;
      }
    } catch (err) {
      console.error('Failed snapshotting match score:', err.message);
    }

    const proposal = new Proposal({
      ...value,
      freelancer: req.user._id,
      matchScore,
      status: 'pending',
    });

    await proposal.save();

    // Trigger Notification to client
    await Notification.create({
      user: gig.client,
      type: 'review_added', // Reusing review_added or similar for proposal submission alert
      payload: {
        gigId: gig._id,
        proposalId: proposal._id,
        message: `A new proposal was submitted by ${req.user.name} for your gig: "${gig.title}"`,
      },
    });

    res.status(201).json({
      success: true,
      proposal,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all proposals submitted for a specific Gig (Client owner or Admin only)
 */
export async function getProposalsForGig(req, res, next) {
  try {
    const { gigId } = req.params;
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found.',
      });
    }

    // Owner or admin authorization
    if (gig.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view proposals for this gig.',
      });
    }

    const proposals = await Proposal.find({ gig: gigId })
      .populate('freelancer', 'name email avatarUrl freelancerProfile location')
      .sort({ matchScore: -1 }); // Rank highest match score first by default

    res.status(200).json({
      success: true,
      proposals,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update proposal status (Accept, Reject, or Withdraw)
 */
export async function updateProposalStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected', 'withdrawn'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid proposal status. Must be accepted, rejected, or withdrawn.',
      });
    }

    const proposal = await Proposal.findById(id).populate('gig');
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found.',
      });
    }

    const gig = proposal.gig;

    // Withdraw flow (Freelancer only)
    if (status === 'withdrawn') {
      if (proposal.freelancer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the freelancer who submitted this proposal can withdraw it.',
        });
      }
      if (proposal.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot withdraw a proposal that is already ${proposal.status}.`,
        });
      }

      proposal.status = 'withdrawn';
      await proposal.save();

      return res.status(200).json({
        success: true,
        proposal,
      });
    }

    // Accept/Reject flow (Client owner or admin only)
    if (gig.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept or reject proposals on this gig.',
      });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Proposal has already been ${proposal.status}.`,
      });
    }

    if (status === 'accepted') {
      // 1. Accept this proposal
      proposal.status = 'accepted';
      await proposal.save();

      // 2. Assign Gig status
      gig.status = 'assigned';
      gig.assignedFreelancer = proposal.freelancer;
      await gig.save();

      // 3. Reject other pending proposals automatically
      await Proposal.updateMany(
        { gig: gig._id, _id: { $ne: proposal._id }, status: 'pending' },
        { $set: { status: 'rejected' } }
      );

      // Trigger Notification to the accepted freelancer
      await Notification.create({
        user: proposal.freelancer,
        type: 'proposal_accepted',
        payload: {
          gigId: gig._id,
          proposalId: proposal._id,
          message: `Congratulations! Your proposal for the gig "${gig.title}" has been accepted.`,
        },
      });
    } else if (status === 'rejected') {
      proposal.status = 'rejected';
      await proposal.save();
    }

    res.status(200).json({
      success: true,
      proposal,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Handle bidding negotiations/counter-offers
 */
export async function negotiateProposal(req, res, next) {
  try {
    const { id } = req.params;
    const { error, value } = negotiateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => d.message),
      });
    }

    const proposal = await Proposal.findById(id).populate('gig');
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found.',
      });
    }

    const gig = proposal.gig;

    // Verify user is either the client owner or the freelancer who made the proposal
    const isClient = req.user._id.toString() === gig.client.toString();
    const isFreelancer = req.user._id.toString() === proposal.freelancer.toString();

    if (!isClient && !isFreelancer && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to negotiate on this proposal.',
      });
    }

    const roleName = isClient ? 'client' : 'freelancer';

    if (value.action === 'counter') {
      // Push counter offer to history
      proposal.negotiationHistory.push({
        by: roleName,
        amount: value.amount,
        message: value.message || `Counter offer proposed.`,
        at: new Date(),
      });

      // Update proposal state back to pending if they counter
      proposal.status = 'pending';
      await proposal.save();

      // Notify the other party
      const recipient = isClient ? proposal.freelancer : gig.client;
      await Notification.create({
        user: recipient,
        type: 'new_gig', // Reusing available notification channel
        payload: {
          gigId: gig._id,
          proposalId: proposal._id,
          message: `A new counter offer of $${value.amount} was proposed by ${req.user.name} for "${gig.title}".`,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Counter offer submitted successfully.',
        proposal,
      });
    } else if (value.action === 'accept') {
      // Find the last counter offer proposed by the OTHER party
      const lastHistoryOffer = proposal.negotiationHistory
        .slice()
        .reverse()
        .find(h => h.by !== roleName);

      if (!lastHistoryOffer) {
        return res.status(400).json({
          success: false,
          message: 'No active counter offer to accept.',
        });
      }

      // Sync proposal budget amount
      proposal.bidAmount = lastHistoryOffer.amount;
      proposal.status = 'pending'; // Reset back to pending state so it is reviewable for acceptance

      proposal.negotiationHistory.push({
        by: roleName,
        amount: lastHistoryOffer.amount,
        message: value.message || `Counter offer of $${lastHistoryOffer.amount} accepted.`,
        at: new Date(),
      });

      await proposal.save();

      // Notify recipient
      const recipient = isClient ? proposal.freelancer : gig.client;
      await Notification.create({
        user: recipient,
        type: 'new_gig',
        payload: {
          gigId: gig._id,
          proposalId: proposal._id,
          message: `${req.user.name} accepted the counter offer of $${lastHistoryOffer.amount} for "${gig.title}".`,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Offer accepted successfully.',
        proposal,
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Get the logged-in freelancer's own proposal for a specific gig
 */
export async function getMyProposalForGig(req, res, next) {
  try {
    const { gigId } = req.params;
    const proposal = await Proposal.findOne({ gig: gigId, freelancer: req.user._id });
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found for this gig.',
      });
    }
    res.status(200).json({
      success: true,
      proposal,
    });
  } catch (err) {
    next(err);
  }
}

