import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import Gig from '../src/models/Gig.js';
import Proposal from '../src/models/Proposal.js';
import Payment from '../src/models/Payment.js';
import Review from '../src/models/Review.js';
import { recomputeEmbeddingForUser, recomputeEmbeddingForGig } from '../src/services/matching.service.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsphere';

const FREELANCER_NAMES = [
  "Aarav Patel", "Aditi Sharma", "Rohan Verma", "Sneha Gupta", "Vikram Singh",
  "Priya Desai", "Rahul Joshi", "Ananya Rao", "Karan Mehta", "Neha Reddy",
  "Arjun Nair", "Kavya Iyer", "Siddharth Menon", "Divya Pillai", "Manish Tiwari",
  "Pooja Bhat", "Rajesh Khanna", "Swati Kulkarni", "Amitabh Das", "Ritu Agarwal",
  "Nikhil Jain", "Sonal Kapoor", "Varun Chauhan", "Shreya Mishra", "Gaurav Pandey"
];

const CLIENT_COMPANIES = [
  "TechNova Solutions", "GreenLeaf Organics", "UrbanNest Real Estate", "FinServe Analytics",
  "BlueWave Marketing", "HealthFirst Clinics", "EduSpark Learning", "Artisan Brews"
];

const SKILL_SETS = [
  ["React", "Node.js", "MongoDB", "Express"],
  ["UI/UX Design", "Figma", "Adobe XD", "Prototyping"],
  ["Copywriting", "SEO", "Content Strategy", "Blogging"],
  ["Digital Marketing", "Google Ads", "Social Media", "Analytics"],
  ["Python", "Machine Learning", "Data Analysis", "Pandas"],
  ["Mobile App Dev", "Flutter", "Dart", "Firebase"],
  ["Graphic Design", "Photoshop", "Illustrator", "Branding"],
  ["Video Editing", "Premiere Pro", "After Effects", "Animation"]
];

const REVIEWS = [
  { rating: 5, comment: "Incredible work! Delivered ahead of schedule and the quality was top-notch." },
  { rating: 4, comment: "Very good communication. The final output met our expectations with only minor revisions." },
  { rating: 5, comment: "A true professional. Understood our complex requirements perfectly." },
  { rating: 5, comment: "Great attention to detail. Will definitely hire again for future phases." },
  { rating: 5, comment: "Exceeded all our benchmarks. The code was clean, documented, and highly performant." }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Clear existing data
    await User.deleteMany({});
    await Gig.deleteMany({});
    await Proposal.deleteMany({});
    await Payment.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing collections');

    // 2. Create Admin
    const admin = new User({
      name: "System Admin",
      email: "admin@skillsphere.local",
      role: "admin",
      location: { type: "Point", coordinates: [73.8567, 18.5204] },
      isVerified: true
    });
    const salt = await bcrypt.genSalt(10);
    admin.passwordHash = await bcrypt.hash("Admin@123!", salt);
    await admin.save();
    console.log('Created Admin account');

    // 3. Create 8 Clients
    const clients = [];
    for (let i = 0; i < 8; i++) {
      const client = new User({
        name: `Client ${i + 1} Rep`,
        email: `client${i + 1}@example.com`,
        role: "client",
        location: { type: "Point", coordinates: [73.8567 + (Math.random() - 0.5) * 0.1, 18.5204 + (Math.random() - 0.5) * 0.1] },
        clientProfile: {
          companyName: CLIENT_COMPANIES[i],
          about: `Leading provider in the ${CLIENT_COMPANIES[i]} sector.`,
          totalSpent: 0,
          gigsPosted: 0
        },
        isVerified: true
      });
      client.passwordHash = await bcrypt.hash("Client@123!", salt);
      await client.save();
      clients.push(client);
    }
    console.log('Created 8 Client accounts');

    // 4. Create 25 Freelancers (Pune coordinates: ~18.5204 N, 73.8567 E)
    const freelancers = [];
    for (let i = 0; i < 25; i++) {
      const skills = SKILL_SETS[i % SKILL_SETS.length];
      const freelancer = new User({
        name: FREELANCER_NAMES[i],
        email: `freelancer${i + 1}@example.com`,
        role: "freelancer",
        // Clustered around Pune within ~30km (approx 0.27 degrees)
        location: {
          type: "Point",
          coordinates: [
            73.8567 + (Math.random() - 0.5) * 0.3,
            18.5204 + (Math.random() - 0.5) * 0.3
          ]
        },
        freelancerProfile: {
          headline: `Expert in ${skills[0]} and ${skills[1]}`,
          bio: `Passionate professional with 5+ years of experience delivering high-quality results in ${skills.join(', ')}.`,
          skills: skills.map(s => ({ name: s, proficiency: 'expert' })),
          hourlyRate: 15 + Math.floor(Math.random() * 50), // $15 - $64/hr
          availability: 'available',
          isVerifiedFreelancer: Math.random() > 0.3,
          reputationScore: 0,
          totalEarnings: 0,
          completedGigs: 0,
          profileViews: Math.floor(Math.random() * 100)
        },
        isVerified: true
      });
      freelancer.passwordHash = await bcrypt.hash("Freelancer@123!", salt);
      await freelancer.save();
      freelancers.push(freelancer);
    }
    console.log('Created 25 Freelancer accounts');

    // 5. Create 15 Gigs
    const gigs = [];
    const gigStatuses = ['open', 'open', 'open', 'open', 'assigned', 'assigned', 'assigned', 'completed', 'completed', 'completed', 'completed', 'completed', 'open', 'open', 'assigned'];
    
    for (let i = 0; i < 15; i++) {
      const client = clients[i % clients.length];
      const status = gigStatuses[i];
      const assignedFreelancer = (status === 'assigned' || status === 'completed') ? freelancers[i % freelancers.length] : null;
      
      const gigSkills = SKILL_SETS[i % SKILL_SETS.length];

      const gig = new Gig({
        client: client._id,
        title: `Need an expert for ${gigSkills[0]} project ${i + 1}`,
        description: `We are looking for a skilled professional to help us with a critical initiative involving ${gigSkills.join(', ')}. The ideal candidate will have proven experience and a strong portfolio.`,
        requiredSkills: gigSkills,
        budgetType: 'fixed',
        budgetMax: 500 + (i * 100),
        status: status,
        assignedFreelancer: assignedFreelancer ? assignedFreelancer._id : null,
        location: client.location, // Same as client
        isRemoteOk: true,
        approvedByAdmin: true,
        milestones: [
          { title: "Project Kickoff & Planning", amount: 100, status: status === 'completed' ? 'paid' : 'in_progress', progressPercent: status === 'completed' ? 100 : 50 },
          { title: "Final Delivery", amount: 400 + (i * 100), status: status === 'completed' ? 'paid' : 'pending', progressPercent: status === 'completed' ? 100 : 0 }
        ]
      });
      await gig.save();
      
      client.clientProfile.gigsPosted += 1;
      await client.save();
      gigs.push(gig);

      // Create lifecycle artifacts for the 5 completed gigs
      if (status === 'completed' && i >= 7 && i <= 11) { // Indexes 7, 8, 9, 10, 11 are completed
        const fl = freelancers[i % freelancers.length];
        
        // 1. Proposal
        const proposal = new Proposal({
          gig: gig._id,
          freelancer: fl._id,
          coverLetter: `Hi, I am highly interested in your ${gigSkills[0]} project. I can deliver exactly what you need and guarantee top quality results for this engagement since I have years of experience.`,
          bidAmount: gig.budgetMax,
          estimatedDays: 14,
          status: 'accepted'
        });
        await proposal.save();

        // 2. Payment (Released)
        const paymentAmount = gig.budgetMax;
        const platformFee = paymentAmount * 0.10;
        
        const payment = new Payment({
          gig: gig._id,
          milestone: gig.milestones[0]._id,
          client: client._id,
          freelancer: fl._id,
          amount: paymentAmount,
          platformFee: platformFee,
          currency: 'USD',
          state: 'released',
          stateHistory: [
            { state: 'created', at: new Date(Date.now() - 86400000 * 10), by: client._id },
            { state: 'funded', at: new Date(Date.now() - 86400000 * 9), by: client._id },
            { state: 'in_progress', at: new Date(Date.now() - 86400000 * 8), by: fl._id },
            { state: 'submitted_for_review', at: new Date(Date.now() - 86400000 * 2), by: fl._id },
            { state: 'released', at: new Date(Date.now() - 86400000 * 1), by: client._id }
          ],
          razorpayOrderId: `order_seed_${i}`,
          razorpayPaymentId: `pay_seed_${i}`
        });
        await payment.save();

        // Update Client & Freelancer balances
        client.clientProfile.totalSpent += paymentAmount;
        await client.save();

        fl.freelancerProfile.totalEarnings += (paymentAmount - platformFee);
        fl.freelancerProfile.completedGigs += 1;
        await fl.save();

        // 3. Review
        const reviewData = REVIEWS[i - 7];
        const review = new Review({
          gig: gig._id,
          proposal: proposal._id,
          reviewer: client._id,
          reviewee: fl._id,
          rating: reviewData.rating,
          comment: reviewData.comment
        });
        await review.save();
        
        // Update Reputation
        fl.freelancerProfile.reputationScore = reviewData.rating;
        await fl.save();
      }
    }
    console.log('Created 15 Gigs with proposals, payments, and reviews for completed ones');

    // 6. Generate Embeddings via ML Service hooks
    console.log('Generating embeddings by invoking ml-service (ensure ml-service is running on port 8000)...');
    try {
      let fCount = 0;
      for (const f of freelancers) {
        await recomputeEmbeddingForUser(f._id);
        fCount++;
      }
      console.log(`Generated embeddings for ${fCount} freelancers`);

      let gCount = 0;
      for (const g of gigs) {
        if (g.status === 'open') {
          await recomputeEmbeddingForGig(g._id);
          gCount++;
        }
      }
      console.log(`Generated embeddings for ${gCount} open gigs`);
    } catch (err) {
      console.error('\n⚠️ WARNING: Could not generate embeddings. Is the FastAPI ml-service running on port 8000?');
      console.error(err.message);
    }

    console.log('\n✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
