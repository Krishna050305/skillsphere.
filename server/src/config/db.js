import mongoose from 'mongoose';

// Import all models to ensure their schemas and indexes are registered
import '../models/User.js';
import '../models/Gig.js';
import '../models/Proposal.js';
import '../models/Review.js';
import '../models/Message.js';
import '../models/Payment.js';
import '../models/Notification.js';
import '../models/Dispute.js';
import '../models/AdminLog.js';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsphere';
    console.log(`Connecting to MongoDB at: ${mongoURI}`);
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected successfully');
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Retry connection after 5 seconds in development
    setTimeout(connectDB, 5000);
  }
};
