import Joi from 'joi';

export const createGigSchema = Joi.object({
  title: Joi.string().min(10).max(150).required(),
  description: Joi.string().min(30).max(5000).required(),
  requiredSkills: Joi.array().items(Joi.string()).min(1).max(15).required(),
  budgetType: Joi.string().valid('fixed', 'hourly').required(),
  budgetMin: Joi.number().min(1).optional(),
  budgetMax: Joi.number().min(Joi.ref('budgetMin')).optional(),
  milestones: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      amount: Joi.number().min(1).required(),
      dueDate: Joi.date().optional()
    }).unknown(true)
  ).max(10).optional(),
  location: Joi.object().optional(),
  isRemoteOk: Joi.boolean().optional()
}).unknown(true);

export const updateGigSchema = Joi.object({
  title: Joi.string().min(10).max(150).optional(),
  description: Joi.string().min(30).max(5000).optional(),
  budgetMin: Joi.number().min(1).optional(),
  budgetMax: Joi.number().min(1).optional(),
}).unknown(true);

export const createProposalSchema = Joi.object({
  gigId: Joi.string().required(),
  coverLetter: Joi.string().min(50).required(),
  bidAmount: Joi.number().min(1).required(),
  estimatedDays: Joi.number().min(1).max(365).required()
}).unknown(true);

export const createReviewSchema = Joi.object({
  targetUserId: Joi.string().required(),
  gigId: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().min(10).required()
}).unknown(true);

export const createDisputeSchema = Joi.object({
  paymentId: Joi.string().required(),
  milestoneId: Joi.string().required(),
  reason: Joi.string().min(10).required()
}).unknown(true);

export const updateMeSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().allow('').optional(),
  location: Joi.object().optional(),
  freelancerProfile: Joi.object().optional(),
  clientProfile: Joi.object().optional()
}).unknown(true);
