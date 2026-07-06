import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const negotiationHistorySchema = new Schema({
  by: {
    type: String,
    enum: ['client', 'freelancer'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  message: {
    type: String,
    trim: true,
  },
  at: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const proposalSchema = new Schema({
  gig: {
    type: Schema.Types.ObjectId,
    ref: 'Gig',
    required: true,
  },
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coverLetter: {
    type: String,
    required: true,
    minlength: 50,
    maxlength: 2000,
    trim: true,
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 1,
  },
  estimatedDays: {
    type: Number,
    required: true,
    min: 1,
    max: 365,
  },
  matchScore: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending',
    index: true,
  },
  negotiationHistory: {
    type: [negotiationHistorySchema],
    default: [],
  },
}, {
  timestamps: true,
});

// Compound unique index (one proposal per freelancer per gig)
proposalSchema.index({ gig: 1, freelancer: 1 }, { unique: true });

const Proposal = mongoose.model('Proposal', proposalSchema);
export default Proposal;
