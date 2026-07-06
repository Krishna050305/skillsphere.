import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const milestoneSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  dueDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'submitted', 'approved', 'paid'],
    required: true,
  },
});

const attachmentSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
  },
}, { _id: false });

const gigSchema = new Schema({
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 150,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    minlength: 30,
    maxlength: 5000,
    trim: true,
  },
  requiredSkills: {
    type: [{
      type: String,
      trim: true,
    }],
    required: true,
    validate: {
      validator: function(val) {
        return val && val.length >= 1 && val.length <= 15;
      },
      message: 'Required skills must contain between 1 and 15 skills',
    },
  },
  budgetType: {
    type: String,
    enum: ['fixed', 'hourly'],
    required: true,
  },
  budgetMin: {
    type: Number,
    min: 1,
  },
  budgetMax: {
    type: Number,
    validate: {
      validator: function(value) {
        if (this.budgetMin !== undefined && value !== undefined) {
          return value >= this.budgetMin;
        }
        return true;
      },
      message: 'budgetMax must be greater than or equal to budgetMin',
    },
  },
  milestones: {
    type: [milestoneSchema],
    default: [],
    validate: [
      {
        validator: function(milestones) {
          if (this.budgetType === 'fixed' && this.budgetMax !== undefined) {
            const sum = milestones.reduce((acc, curr) => acc + (curr.amount || 0), 0);
            return sum <= this.budgetMax;
          }
          return true;
        },
        message: 'For fixed budget gigs, the sum of milestone amounts must not exceed budgetMax',
      },
      {
        validator: function(milestones) {
          return milestones.length <= 10;
        },
        message: 'A gig can have at most 10 milestones',
      },
    ],
  },
  attachments: {
    type: [attachmentSchema],
    default: [],
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'open',
    index: true,
  },
  assignedFreelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  invitedFreelancers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  embeddingVector: {
    type: [Number],
    default: [],
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [lng, lat]
    },
  },
  isRemoteOk: {
    type: Boolean,
    default: false,
  },
  approvedByAdmin: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes
gigSchema.index({ location: '2dsphere' });
gigSchema.index({ createdAt: 1 });

const Gig = mongoose.model('Gig', gigSchema);
export default Gig;
