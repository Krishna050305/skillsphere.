import Joi from 'joi';
import Gig from '../models/Gig.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Proposal from '../models/Proposal.js';
import { recomputeEmbeddingForGig } from '../services/matching.service.js';

// Validation schema for creating a gig
const createGigSchema = Joi.object({
  title: Joi.string().min(10).max(150).required(),
  description: Joi.string().min(30).max(5000).required(),
  requiredSkills: Joi.array().items(Joi.string().trim()).min(1).max(15).required(),
  budgetType: Joi.string().valid('fixed', 'hourly').required(),
  budgetMin: Joi.number().min(1).required(),
  budgetMax: Joi.number().min(Joi.ref('budgetMin')).optional(),
  isRemoteOk: Joi.boolean().default(false),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(), // [lng, lat]
    city: Joi.string().trim().optional(),
    address: Joi.string().trim().optional(),
  }).optional(),
  milestones: Joi.array().items(Joi.object({
    title: Joi.string().trim().required(),
    description: Joi.string().trim().optional(),
    amount: Joi.number().min(1).required(),
    dueDate: Joi.date().optional(),
    status: Joi.string().valid('pending', 'in_progress', 'submitted', 'approved', 'paid').default('pending'),
  })).max(10).optional(),
});

// Validation schema for updating a gig
const updateGigSchema = Joi.object({
  title: Joi.string().min(10).max(150).optional(),
  description: Joi.string().min(30).max(5000).optional(),
  requiredSkills: Joi.array().items(Joi.string().trim()).min(1).max(15).optional(),
  budgetType: Joi.string().valid('fixed', 'hourly').optional(),
  budgetMin: Joi.number().min(1).optional(),
  budgetMax: Joi.number().min(Joi.ref('budgetMin')).optional(),
  isRemoteOk: Joi.boolean().optional(),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    city: Joi.string().trim().optional(),
    address: Joi.string().trim().optional(),
  }).optional(),
  milestones: Joi.array().items(Joi.object({
    title: Joi.string().trim().required(),
    description: Joi.string().trim().optional(),
    amount: Joi.number().min(1).required(),
    dueDate: Joi.date().optional(),
    status: Joi.string().valid('pending', 'in_progress', 'submitted', 'approved', 'paid').required(),
  })).max(10).optional(),
  status: Joi.string().valid('draft', 'open', 'assigned', 'in_progress', 'completed', 'cancelled').optional(),
});

/**
 * Create a new Gig (Client only)
 */
export async function createGig(req, res, next) {
  try {
    const { error, value } = createGigSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => d.message),
      });
    }

    // Ensure fixed budget milestones sum does not exceed budgetMax
    if (value.budgetType === 'fixed' && value.budgetMax && value.milestones) {
      const sum = value.milestones.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      if (sum > value.budgetMax) {
        return res.status(400).json({
          success: false,
          message: 'For fixed budget gigs, the sum of milestone amounts must not exceed budgetMax.',
        });
      }
    }

    const gigData = {
      ...value,
      client: req.user._id,
      status: 'open', // Auto open on creation
    };

    if (value.location) {
      gigData.location = {
        type: 'Point',
        coordinates: value.location.coordinates,
        city: value.location.city,
        address: value.location.address,
      };
    }

    const gig = new Gig(gigData);
    await gig.save();

    // Recompute and cache embedding in background
    recomputeEmbeddingForGig(gig._id).catch(err => {
      console.error('Failed background embedding calculation for new gig:', err.message);
    });

    res.status(201).json({
      success: true,
      gig,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch a list of gigs with multi-filter query matching
 */
export async function getGigs(req, res, next) {
  try {
    const {
      page = 1,
      limit = 10,
      skill,
      minBudget,
      maxBudget,
      isRemoteOk,
      status,
      latitude,
      longitude,
      radius,
      search,
      sortBy = 'newest',
    } = req.query;

    const query = {};

    // 1. Status filter (default to open)
    query.status = status || 'open';

    // 2. Skill tag matching (case-insensitive array check)
    if (skill) {
      query.requiredSkills = { $in: [new RegExp('^' + skill.trim() + '$', 'i')] };
    }

    // 3. Budget range filters
    if (minBudget) {
      query.budgetMin = { $gte: Number(minBudget) };
    }
    if (maxBudget) {
      query.budgetMax = { $lte: Number(maxBudget) };
    }

    // 4. Remote ok matching
    if (isRemoteOk !== undefined) {
      query.isRemoteOk = isRemoteOk === 'true' || isRemoteOk === true;
    }

    // 5. Geospatial coordinates + radius filter ($centerSphere on 2dsphere index)
    if (latitude && longitude && radius) {
      const radiusInRadians = Number(radius) / 6378.1; // Earth radius in km is 6378.1
      query.location = {
        $geoWithin: {
          $centerSphere: [
            [Number(longitude), Number(latitude)],
            radiusInRadians,
          ],
        },
      };
    }

    // 6. Text keyword search filter (Atlas Search with $regex fallback)
    let isAtlasSearchUsed = false;
    let pipeline = [];

    if (search && search.trim()) {
      if (process.env.USE_ATLAS_SEARCH === 'true') {
        isAtlasSearchUsed = true;
        // Construct Atlas Search aggregation pipeline
        pipeline.push({
          $search: {
            index: 'gigs-search-index',
            text: {
              query: search,
              path: ['title', 'description', 'requiredSkills'],
            },
          },
        });
      } else {
        // Fallback case-insensitive regex search
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { requiredSkills: { $in: [new RegExp(search.trim(), 'i')] } },
        ];
      }
    }

    // Pagination bounds
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    // Sorting definition
    let sortObj = {};
    if (sortBy === 'budget') {
      sortObj = { budgetMax: -1, createdAt: -1 };
    } else if (sortBy === 'newest') {
      sortObj = { createdAt: -1 };
    } else {
      // Relevance sort defaults to newest when not using Atlas Search
      sortObj = { createdAt: -1 };
    }

    let gigs;
    let total;

    if (isAtlasSearchUsed) {
      // Complete Atlas Search aggregation with matching, paging and counts
      pipeline.push({ $match: query });
      
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Gig.aggregate(countPipeline);
      total = countResult[0]?.total || 0;

      pipeline.push({ $sort: sortObj });
      pipeline.push({ $skip: skipNum });
      pipeline.push({ $limit: limitNum });
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'client',
          foreignField: '_id',
          as: 'clientDetails',
        },
      });
      pipeline.push({ $unwind: '$clientDetails' });

      gigs = await Gig.aggregate(pipeline);
    } else {
      // Standard find queries
      total = await Gig.countDocuments(query);
      gigs = await Gig.find(query)
        .populate('client', 'name avatarUrl clientProfile')
        .sort(sortObj)
        .skip(skipNum)
        .limit(limitNum);
    }

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      gigs,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetch a single Gig by ID
 */
export async function getGigById(req, res, next) {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('client', 'name avatarUrl clientProfile location')
      .populate('assignedFreelancer', 'name avatarUrl freelancerProfile');

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found.',
      });
    }

    res.status(200).json({
      success: true,
      gig,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an existing Gig (Owner or Admin only)
 */
export async function updateGig(req, res, next) {
  try {
    const { error, value } = updateGigSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => d.message),
      });
    }

    const gig = await Gig.findById(req.params.id);
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
        message: 'You are not authorized to update this gig.',
      });
    }

    // Track text changes to trigger background embedding recalculation
    const titleChanged = value.title && value.title !== gig.title;
    const descChanged = value.description && value.description !== gig.description;
    const skillsChanged = value.requiredSkills && JSON.stringify(value.requiredSkills) !== JSON.stringify(gig.requiredSkills);

    // Apply updates
    Object.keys(value).forEach(key => {
      if (key === 'location') {
        gig.location = {
          type: 'Point',
          coordinates: value.location.coordinates,
          city: value.location.city,
          address: value.location.address,
        };
      } else {
        gig[key] = value[key];
      }
    });

    await gig.save();

    if (titleChanged || descChanged || skillsChanged) {
      recomputeEmbeddingForGig(gig._id).catch(err => {
        console.error('Failed background embedding update for gig:', err.message);
      });
    }

    res.status(200).json({
      success: true,
      gig,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a Gig (Owner or Admin only, if draft or open with 0 proposals)
 */
export async function deleteGig(req, res, next) {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found.',
      });
    }

    // Check authorization
    if (gig.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this gig.',
      });
    }

    // Can only delete draft or open gigs
    if (gig.status !== 'draft' && gig.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete a gig that is in '${gig.status}' status.`,
      });
    }

    // If open, check proposals count
    if (gig.status === 'open') {
      const proposalCount = await Proposal.countDocuments({ gig: gig._id });
      if (proposalCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete a gig that has active proposals.',
        });
      }
    }

    await Gig.findByIdAndDelete(gig._id);

    res.status(200).json({
      success: true,
      message: 'Gig deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Invite freelancer to Gig (Client owner only)
 */
export async function inviteFreelancer(req, res, next) {
  try {
    const { freelancerId } = req.body;
    if (!freelancerId) {
      return res.status(400).json({
        success: false,
        message: 'Freelancer ID is required.',
      });
    }

    const gig = await Gig.findById(req.params.id);
    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found.',
      });
    }

    // Check ownership
    if (gig.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the client owner of this gig can send invitations.',
      });
    }

    const freelancer = await User.findById(freelancerId);
    if (!freelancer || freelancer.role !== 'freelancer') {
      return res.status(404).json({
        success: false,
        message: 'Freelancer not found.',
      });
    }

    // Add to invited array if not present
    if (!gig.invitedFreelancers.includes(freelancerId)) {
      gig.invitedFreelancers.push(freelancerId);
      await gig.save();
    }

    // Trigger Notification
    await Notification.create({
      user: freelancerId,
      type: 'new_gig',
      payload: {
        gigId: gig._id,
        title: gig.title,
        clientName: req.user.name,
        message: `${req.user.name} invited you to apply for their gig: "${gig.title}"`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Freelancer invited successfully.',
      invitedFreelancers: gig.invitedFreelancers,
    });
  } catch (err) {
    next(err);
  }
}
