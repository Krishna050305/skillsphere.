import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  gig: {
    type: Schema.Types.ObjectId,
    ref: 'Gig',
    required: true,
    index: true,
  },
  proposal: {
    type: Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true,
    unique: true,
  },
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer value',
    },
  },
  comment: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 1500,
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
  flagReason: {
    type: String,
    trim: true,
    default: null,
  },
}, {
  timestamps: true,
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
