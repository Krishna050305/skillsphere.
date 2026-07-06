import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const skillSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  proficiency: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    required: true,
  },
}, { _id: false });

const portfolioSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
  },
  link: {
    type: String,
  },
  description: {
    type: String,
    trim: true,
  },
}, { _id: false });

const certificationSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  issuer: {
    type: String,
    required: true,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
  },
  fileUrl: {
    type: String,
  },
}, { _id: false });

const workHistorySchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  from: {
    type: Date,
    required: true,
  },
  to: {
    type: Date,
  },
  description: {
    type: String,
    trim: true,
  },
}, { _id: false });

const availabilitySlotSchema = new Schema({
  day: {
    type: String,
    required: true,
    trim: true,
  },
  startTime: {
    type: String,
    required: true,
    trim: true,
  },
  endTime: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false });

const freelancerProfileSchema = new Schema({
  headline: {
    type: String,
    maxlength: 100,
    trim: true,
  },
  bio: {
    type: String,
    maxlength: 1000,
    trim: true,
  },
  skills: {
    type: [skillSchema],
    default: [],
    validate: {
      validator: function(val) {
        return val.length <= 20;
      },
      message: 'Skills list cannot exceed 20 items',
    },
  },
  portfolio: {
    type: [portfolioSchema],
    default: [],
    validate: {
      validator: function(val) {
        return val.length <= 10;
      },
      message: 'Portfolio cannot exceed 10 items',
    },
  },
  resumeUrl: {
    type: String,
  },
  certifications: {
    type: [certificationSchema],
    default: [],
  },
  workHistory: {
    type: [workHistorySchema],
    default: [],
  },
  hourlyRate: {
    type: Number,
    min: 1,
    max: 10000,
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available',
  },
  availabilitySlots: {
    type: [availabilitySlotSchema],
    default: [],
  },
  isVerifiedFreelancer: {
    type: Boolean,
    default: false,
  },
  embeddingVector: {
    type: [Number],
    default: [],
  },
  reputationScore: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  completedGigs: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const clientProfileSchema = new Schema({
  companyName: {
    type: String,
    maxlength: 100,
    trim: true,
  },
  about: {
    type: String,
    trim: true,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  gigsPosted: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address',
    },
  },
  passwordHash: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    required: true,
    enum: ['client', 'freelancer', 'admin'],
    index: true,
  },
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
    trim: true,
  },
  avatarUrl: {
    type: String,
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[+]?[\d\s\-()]{7,15}$/.test(v);
      },
      message: 'Please enter a valid phone number',
    },
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
    city: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  verificationTokenExpires: {
    type: Date,
    default: null,
  },
  passwordResetToken: {
    type: String,
    default: null,
  },
  passwordResetExpires: {
    type: Date,
    default: null,
  },
  googleId: {
    type: String,
    default: null,
    index: { sparse: true },
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active',
    index: true,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  freelancerProfile: {
    type: freelancerProfileSchema,
    default: null,
  },
  clientProfile: {
    type: clientProfileSchema,
    default: null,
  },
}, {
  timestamps: true,
});

// 2dsphere index on location
userSchema.index({ location: '2dsphere' });

// Virtual for password validation
userSchema.virtual('password')
  .set(function(password) {
    this._password = password;
  })
  .get(function() {
    return this._password;
  });

// Pre-save hook for lowercase email and password validation
userSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  if (this._password) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(this._password)) {
      return next(new Error('Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.'));
    }
  }
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
