import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Gig from '../src/models/Gig.js';
import TrendingSkills from '../src/models/TrendingSkills.js';
import {
  matchFreelancersToGig,
  matchGigsToFreelancer,
  recomputeEmbeddingForUser,
  recomputeEmbeddingForGig,
} from '../src/services/matching.service.js';
import { runTrendingSkillsAggregation } from '../src/jobs/trendingSkills.job.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsphere';

async function runTest() {
  console.log('=== STARTING JOB MATCHING AND AGGREGATION TEST ===');

  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    // 1. Clean up existing test data
    console.log('Cleaning up existing matching test data...');
    await User.deleteMany({ email: /@testmatching\.com$/ });
    await Gig.deleteMany({ title: /\[Matching Test\]/ });
    await TrendingSkills.deleteMany({});

    // 2. Seed 5 Freelancers
    console.log('Seeding 5 freelancers...');
    const freelancersData = [
      {
        email: 'react_master@testmatching.com',
        name: 'React Master',
        role: 'freelancer',
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760], // Mumbai
          city: 'Mumbai',
          address: 'Andheri East, Mumbai, India',
        },
        isVerified: true,
        freelancerProfile: {
          headline: 'Expert React & Node.js Developer',
          bio: 'I specialize in full-stack React applications with Express backends and WebSockets. I deliver clean code.',
          skills: [
            { name: 'React', proficiency: 'expert' },
            { name: 'Node.js', proficiency: 'expert' },
            { name: 'Redux', proficiency: 'expert' },
          ],
          reputationScore: 4.8,
          hourlyRate: 80,
        },
      },
      {
        email: 'react_mid@testmatching.com',
        name: 'React Mid',
        role: 'freelancer',
        location: {
          type: 'Point',
          coordinates: [73.8567, 18.5204], // Pune (approx 120km away)
          city: 'Pune',
          address: 'Kothrud, Pune, India',
        },
        isVerified: true,
        freelancerProfile: {
          headline: 'Mid React Developer',
          bio: 'Front-end developer focused on React and JavaScript UI animations.',
          skills: [
            { name: 'React', proficiency: 'intermediate' },
            { name: 'JavaScript', proficiency: 'intermediate' },
          ],
          reputationScore: 3.5,
          hourlyRate: 45,
        },
      },
      {
        email: 'python_dev@testmatching.com',
        name: 'Python Dev',
        role: 'freelancer',
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760], // Mumbai
          city: 'Mumbai',
          address: 'Bandra, Mumbai, India',
        },
        isVerified: true,
        freelancerProfile: {
          headline: 'Senior Python & FastAPI Engineer',
          bio: 'Data pipeline automation and high-speed APIs in Python, FastAPI, Django, and NumPy.',
          skills: [
            { name: 'Python', proficiency: 'expert' },
            { name: 'FastAPI', proficiency: 'expert' },
          ],
          reputationScore: 4.9,
          hourlyRate: 90,
        },
      },
      {
        email: 'junior_css@testmatching.com',
        name: 'Junior CSS',
        role: 'freelancer',
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760], // Mumbai
          city: 'Mumbai',
          address: 'Colaba, Mumbai, India',
        },
        isVerified: true,
        freelancerProfile: {
          headline: 'Junior CSS/HTML Designer',
          bio: 'Responsive CSS styles, HTML forms, and landing page conversions.',
          skills: [
            { name: 'CSS', proficiency: 'beginner' },
            { name: 'HTML', proficiency: 'intermediate' },
          ],
          reputationScore: 2.0,
          hourlyRate: 25,
        },
      },
      {
        email: 'vue_remote@testmatching.com',
        name: 'Vue Remote',
        role: 'freelancer',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139], // Delhi (approx 1100km away)
          city: 'Delhi',
          address: 'Connaught Place, Delhi, India',
        },
        isVerified: true,
        freelancerProfile: {
          headline: 'Senior Vue.js Expert',
          bio: 'Frontend architecture using Vue 3, Pinia, and Nuxt.js framework.',
          skills: [
            { name: 'Vue', proficiency: 'expert' },
            { name: 'JavaScript', proficiency: 'expert' },
          ],
          reputationScore: 4.7,
          hourlyRate: 75,
        },
      },
    ];

    const freelancers = [];
    for (const fData of freelancersData) {
      const user = new User(fData);
      user.password = 'Password123!'; // Pass pre-save criteria
      await user.save();
      
      // Calculate and save initial embedding
      await recomputeEmbeddingForUser(user._id);
      
      freelancers.push(user);
      console.log(`Saved Freelancer: ${user.name}`);
    }

    // 3. Seed 1 Gig (Non-remote, Mumbai)
    console.log('\nSeeding 1 non-remote Mumbai gig...');
    const clientUser = new User({
      email: 'client_matching@testmatching.com',
      name: 'Test Client',
      role: 'client',
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760], // Mumbai
      },
    });
    clientUser.password = 'Password123!';
    await clientUser.save();

    const gig = new Gig({
      client: clientUser._id,
      title: '[Matching Test] Senior React Frontend Developer',
      description: 'We need an expert developer with advanced skills in React and Node.js to implement a high-performance web dashboard. Only local candidates will be considered.',
      requiredSkills: ['React', 'Node.js'],
      budgetType: 'fixed',
      budgetMin: 1000,
      budgetMax: 5000,
      status: 'open',
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760], // Mumbai
      },
      isRemoteOk: false, // Proximity matters!
    });
    await gig.save();

    // Recompute gig embedding
    await recomputeEmbeddingForGig(gig._id);
    console.log(`Saved Gig: ${gig.title}`);

    // 4. Run matchFreelancersToGig
    console.log('\n--- Running matchFreelancersToGig ---');
    const matchedFreelancers = await matchFreelancersToGig(gig._id);

    console.log('\nMatch Results (Ranked Descending):');
    matchedFreelancers.forEach((res, index) => {
      console.log(`${index + 1}. Freelancer: ${res.freelancer.name}`);
      console.log(`   Score: ${res.score}`);
      console.log(`   Reputation Rating: ${res.freelancer.freelancerProfile.reputationScore}/5`);
      console.log(`   Location: ${res.freelancer.location?.city || 'N/A'}`);
      console.log(`   Skills: ${res.freelancer.freelancerProfile.skills.map(s => s.name).join(', ')}`);
      console.log('----------------------------------------------------');
    });

    // Simple assertions/validations
    if (matchedFreelancers.length === 0) {
      throw new Error('Matching returned 0 results!');
    }
    const topMatch = matchedFreelancers[0].freelancer;
    if (topMatch.name !== 'React Master') {
      throw new Error(`Expected 'React Master' to be #1, but got '${topMatch.name}'`);
    }
    console.log('✓ SUCCESS: React Master ranked #1 correctly.');

    // 5. Test matchGigsToFreelancer
    console.log('\n--- Running matchGigsToFreelancer for React Master ---');
    const matchedGigs = await matchGigsToFreelancer(topMatch._id);
    console.log(`Ranked Gigs: ${matchedGigs.length}`);
    matchedGigs.forEach((res, index) => {
      console.log(`${index + 1}. Gig: ${res.gig.title}`);
      console.log(`   Score: ${res.score}`);
      console.log(`   Remote OK? ${res.gig.isRemoteOk}`);
    });

    // 6. Test Daily Aggregation Job
    console.log('\n--- Testing Daily Trending Skills Aggregation Job ---');
    // Simulate other gigs to verify double weights
    // Seed an older gig (10 days ago) and a newer gig (1 day ago)
    const oldGig = new Gig({
      client: clientUser._id,
      title: '[Matching Test] Old Angular Gig',
      description: 'Angular required developers...',
      requiredSkills: ['Angular'],
      budgetType: 'fixed',
      budgetMin: 500,
      budgetMax: 1000,
      status: 'open',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    });
    await oldGig.save();

    const newGig = new Gig({
      client: clientUser._id,
      title: '[Matching Test] New TypeScript Gig',
      description: 'TypeScript required developers...',
      requiredSkills: ['TypeScript', 'React'],
      budgetType: 'fixed',
      budgetMin: 500,
      budgetMax: 1000,
      status: 'open',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (last 3 days -> double weight!)
    });
    await newGig.save();

    console.log('Running trending skills aggregation...');
    await runTrendingSkillsAggregation();

    // Verify TrendingSkills collection
    const trends = await TrendingSkills.findOne();
    console.log('\nTrending Skills aggregated:');
    trends.skills.forEach((s) => {
      console.log(`Skill: ${s.name}, Score/Weight: ${s.count}`);
    });

    // Verify TypeScript has double weight (since it is mentioned in newGig in the last 3 days, count should be 2)
    const tsTrend = trends.skills.find(s => s.name === 'TypeScript');
    if (!tsTrend || tsTrend.count !== 2) {
      throw new Error(`Expected TypeScript to have count 2, but got ${tsTrend ? tsTrend.count : 'N/A'}`);
    }
    console.log('✓ SUCCESS: TypeScript double weight aggregation validated.');

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');
  } catch (error) {
    console.error('Test Failed:', error.message);
  } finally {
    // Cleanup seed data
    console.log('Cleaning up match test data...');
    await User.deleteMany({ email: /@testmatching\.com$/ });
    await Gig.deleteMany({ title: /\[Matching Test\]/ });
    await TrendingSkills.deleteMany({});
    
    await mongoose.disconnect();
    console.log('Disconnected from DB.');
  }
}

runTest();
