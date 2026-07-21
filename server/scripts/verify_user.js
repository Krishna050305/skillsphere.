import mongoose from 'mongoose';
import User from '../src/models/User.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsphere';

async function verifyUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const user = await User.findOneAndUpdate(
      { email: 'krishplagad0503@gmail.com' },
      { isVerified: true },
      { new: true }
    );
    
    if (user) {
      console.log('Successfully verified user:', user.email);
    } else {
      console.log('User not found.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyUser();
