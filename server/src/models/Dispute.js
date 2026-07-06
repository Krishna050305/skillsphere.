import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const evidenceSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, { _id: false });

const disputeSchema = new Schema({
  payment: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    index: true,
  },
  raisedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  evidence: {
    type: [evidenceSchema],
    default: [],
  },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved_client', 'resolved_freelancer', 'resolved_split'],
    default: 'open',
    index: true,
  },
  adminNotes: {
    type: String,
    trim: true,
    default: '',
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

const Dispute = mongoose.model('Dispute', disputeSchema);
export default Dispute;
