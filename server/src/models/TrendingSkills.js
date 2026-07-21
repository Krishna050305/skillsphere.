import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const skillTrendSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  count: {
    type: Number,
    required: true,
  },
}, { _id: false });

const trendingSkillsSchema = new Schema({
  skills: {
    type: [skillTrendSchema],
    default: [],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const TrendingSkills = mongoose.model('TrendingSkills', trendingSkillsSchema);
export default TrendingSkills;
