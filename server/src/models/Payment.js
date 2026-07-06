import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const stateHistorySchema = new Schema({
  state: {
    type: String,
    enum: ['created', 'funded', 'in_progress', 'submitted_for_review', 'released', 'disputed', 'refunded'],
    required: true,
  },
  at: {
    type: Date,
    default: Date.now,
  },
  by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { _id: false });

const paymentSchema = new Schema({
  gig: {
    type: Schema.Types.ObjectId,
    ref: 'Gig',
    required: true,
    index: true,
  },
  milestone: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  platformFee: {
    type: Number,
    required: true,
    min: 0,
  },
  razorpayOrderId: {
    type: String,
    trim: true,
    default: null,
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    default: null,
  },
  state: {
    type: String,
    enum: ['created', 'funded', 'in_progress', 'submitted_for_review', 'released', 'disputed', 'refunded'],
    default: 'created',
    index: true,
  },
  stateHistory: {
    type: [stateHistorySchema],
    default: [],
  },
}, {
  timestamps: true,
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
