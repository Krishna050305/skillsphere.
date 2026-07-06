import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const adminLogSchema = new Schema({
  admin: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  targetType: {
    type: String,
    required: true,
    trim: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Index for createdAt
adminLogSchema.index({ createdAt: 1 });

const AdminLog = mongoose.model('AdminLog', adminLogSchema);
export default AdminLog;
