import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['new_gig', 'proposal_accepted', 'payment_received', 'review_added', 'dispute_update', 'milestone_reminder'],
    required: true,
  },
  payload: {
    type: Schema.Types.Mixed,
    default: {},
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound index for user and isRead status
notificationSchema.index({ user: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
