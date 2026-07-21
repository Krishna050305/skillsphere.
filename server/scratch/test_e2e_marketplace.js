import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Gig from '../src/models/Gig.js';
import Proposal from '../src/models/Proposal.js';
import Notification from '../src/models/Notification.js';
import { runTrendingSkillsAggregation } from '../src/jobs/trendingSkills.job.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsphere';
const API_BASE = 'http://localhost:5000/api';

async function runE2E() {
  console.log('=== STARTING END-TO-END SYSTEM INTEGRATION TEST ===');

  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  try {
    // 1. Cleanup old test data
    console.log('Cleaning up existing E2E test data...');
    await User.deleteMany({ email: /@e2etest\.com$/ });
    await Gig.deleteMany({ title: /\[E2E Test\]/ });
    await Proposal.deleteMany({});
    await Notification.deleteMany({});

    // 2. Register Client
    console.log('\nStep 1: Registering Client account...');
    const clientRegisterRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Client',
        email: 'client@e2etest.com',
        password: 'Password123!',
        phone: '+919876543210',
        role: 'client',
      }),
    });
    const clientData = await clientRegisterRes.json();
    if (!clientRegisterRes.ok) throw new Error(`Client registration failed: ${JSON.stringify(clientData)}`);
    console.log('Client registered successfully.');

    // 3. Register Freelancer
    console.log('\nStep 2: Registering Freelancer account...');
    const freelancerRegisterRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Freelancer',
        email: 'freelancer@e2etest.com',
        password: 'Password123!',
        phone: '+919876543211',
        role: 'freelancer',
      }),
    });
    const freelancerData = await freelancerRegisterRes.json();
    if (!freelancerRegisterRes.ok) throw new Error(`Freelancer registration failed: ${JSON.stringify(freelancerData)}`);
    console.log('Freelancer registered successfully.');

    // 4. Retrieve Verification Tokens directly from database & verify emails
    console.log('\nStep 3: Verifying email tokens directly via database...');
    const clientUserObj = await User.findOne({ email: 'client@e2etest.com' });
    const freelancerUserObj = await User.findOne({ email: 'freelancer@e2etest.com' });

    // Verify Client
    const verifyClientRes = await fetch(`${API_BASE}/auth/verify-email?token=${clientUserObj.verificationToken}`);
    const verifyClientData = await verifyClientRes.json();
    if (!verifyClientRes.ok) throw new Error(`Client email verification failed: ${JSON.stringify(verifyClientData)}`);
    console.log('Client email verified.');

    // Verify Freelancer
    const verifyFreelancerRes = await fetch(`${API_BASE}/auth/verify-email?token=${freelancerUserObj.verificationToken}`);
    const verifyFreelancerData = await verifyFreelancerRes.json();
    if (!verifyFreelancerRes.ok) throw new Error(`Freelancer email verification failed: ${JSON.stringify(verifyFreelancerData)}`);
    console.log('Freelancer email verified.');

    // 5. Complete Onboarding Profile updates via API
    console.log('\nStep 4: Onboarding profiles...');
    
    // Client Onboarding (headers: Authorization client token)
    const clientAuthToken = clientData.token;
    const clientOnboardRes = await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientAuthToken}`,
      },
      body: JSON.stringify({
        clientProfile: {
          companyName: 'E2E Tech Solutions',
          about: 'Building robust end-to-end cloud platforms.',
        },
        location: {
          coordinates: [72.8777, 19.0760], // Mumbai
          city: 'Mumbai',
          address: 'Bandra East',
        },
      }),
    });
    const clientOnboardData = await clientOnboardRes.json();
    if (!clientOnboardRes.ok) throw new Error(`Client onboarding failed: ${JSON.stringify(clientOnboardData)}`);
    console.log('Client onboarding complete.');

    // Freelancer Onboarding
    const freelancerAuthToken = freelancerData.token;
    const freelancerOnboardRes = await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerAuthToken}`,
      },
      body: JSON.stringify({
        freelancerProfile: {
          headline: 'Senior React & Node Fullstack Architect',
          bio: 'Over 8 years of experience building modern frontend applications and high throughput microservices.',
          skills: [
            { name: 'React', proficiency: 'expert' },
            { name: 'Node.js', proficiency: 'expert' },
          ],
          hourlyRate: 85,
        },
        location: {
          coordinates: [72.8777, 19.0760], // Mumbai
          city: 'Mumbai',
          address: 'Andheri West',
        },
      }),
    });
    const freelancerOnboardData = await freelancerOnboardRes.json();
    if (!freelancerOnboardRes.ok) throw new Error(`Freelancer onboarding failed: ${JSON.stringify(freelancerOnboardData)}`);
    console.log('Freelancer onboarding complete.');
    
    // Wait for freelancer embedding to compute
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 6. Client Posts a Gig
    console.log('\nStep 5: Posting a new Gig as Client...');
    const postGigRes = await fetch(`${API_BASE}/gigs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientAuthToken}`,
      },
      body: JSON.stringify({
        title: '[E2E Test] Senior React Developer Needed',
        description: 'Looking for a senior React engineer with strong experience in Node.js backends and real-time state synching.',
        requiredSkills: ['React', 'Node.js'],
        budgetType: 'fixed',
        budgetMin: 2000,
        budgetMax: 5000,
        isRemoteOk: false,
        location: {
          coordinates: [72.8777, 19.0760], // Mumbai
          city: 'Mumbai',
          address: 'Bandra East',
        },
        milestones: [
          { title: 'Milestone 1: UI Mockups', amount: 2000, dueDate: '2026-08-01' },
          { title: 'Milestone 2: Backend Wiring', amount: 3000, dueDate: '2026-09-01' },
        ],
      }),
    });
    const postGigData = await postGigRes.json();
    if (!postGigRes.ok) throw new Error(`Posting Gig failed: ${JSON.stringify(postGigData)}`);
    const gigId = postGigData.gig._id;
    console.log(`Gig posted successfully. ID: ${gigId}`);

    // Wait slightly to ensure background embeddings are fetched/cached
    console.log('Waiting for background embedding computation...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 7. Freelancer Queries the Gig Marketplace with filters & search text
    console.log('\nStep 6: Querying Gig Marketplace as Freelancer...');
    const marketplaceQueryRes = await fetch(`${API_BASE}/gigs?search=React&minBudget=1500&latitude=19.0760&longitude=72.8777&radius=50`, {
      headers: { Authorization: `Bearer ${freelancerAuthToken}` },
    });
    const marketplaceData = await marketplaceQueryRes.json();
    if (!marketplaceQueryRes.ok) throw new Error(`Marketplace query failed: ${JSON.stringify(marketplaceData)}`);
    console.log(`Marketplace search returned ${marketplaceData.gigs.length} matching gigs.`);
    const foundGig = marketplaceData.gigs.find(g => g._id === gigId);
    if (!foundGig) throw new Error('Posted gig was not found in filtered marketplace query!');
    console.log('✓ Success: Posted gig is visible in filtered search results.');

    // 8. Freelancer Submits a Proposal
    console.log('\nStep 7: Submitting proposal as Freelancer...');
    const proposalRes = await fetch(`${API_BASE}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerAuthToken}`,
      },
      body: JSON.stringify({
        gig: gigId,
        coverLetter: 'I am highly interested in this gig. I have built over 20 React applications using Express backends. Let us build this.',
        bidAmount: 4800,
        estimatedDays: 20,
      }),
    });
    const proposalData = await proposalRes.json();
    if (!proposalRes.ok) throw new Error(`Submitting proposal failed: ${JSON.stringify(proposalData)}`);
    const proposalId = proposalData.proposal._id;
    console.log(`Proposal submitted successfully. ID: ${proposalId}, MatchScore: ${proposalData.proposal.matchScore}`);

    // 9. Client Queries Recommended Freelancers for the Gig (AI recommendations verification)
    console.log('\nStep 8: Fetching AI recommended freelancers for Gig...');
    const recommendationsRes = await fetch(`${API_BASE}/gigs/${gigId}/recommended-freelancers`, {
      headers: { Authorization: `Bearer ${clientAuthToken}` },
    });
    const recsData = await recommendationsRes.json();
    if (!recommendationsRes.ok) throw new Error(`Fetching recommendations failed: ${JSON.stringify(recsData)}`);
    console.log(`Recommendations endpoint returned ${recsData.results.length} profiles.`);
    const recUser = recsData.results.find(r => r.freelancer._id.toString() === freelancerUserObj._id.toString());
    if (!recUser) throw new Error('Freelancer was not recommended for this gig!');
    console.log(`✓ Success: Freelancer recommended with Match Score: ${Math.round(recUser.score * 100)}%`);

    // 10. Client proposes counter-offer (Negotiation)
    console.log('\nStep 9: Client initiating negotiation (counter offer of $4200)...');
    const clientCounterRes = await fetch(`${API_BASE}/proposals/${proposalId}/negotiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientAuthToken}`,
      },
      body: JSON.stringify({
        action: 'counter',
        amount: 4200,
        message: 'Can we agree on $4200 instead of $4800 for the full milestone deliverable?',
      }),
    });
    const clientCounterData = await clientCounterRes.json();
    if (!clientCounterRes.ok) throw new Error(`Counter proposal failed: ${JSON.stringify(clientCounterData)}`);
    console.log('Counter offer submitted.');

    // 11. Freelancer accepts counter-offer
    console.log('\nStep 10: Freelancer accepting Client counter offer...');
    const flAcceptRes = await fetch(`${API_BASE}/proposals/${proposalId}/negotiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerAuthToken}`,
      },
      body: JSON.stringify({
        action: 'accept',
        message: 'Deal! I accept the counter offer of $4200.',
      }),
    });
    const flAcceptData = await flAcceptRes.json();
    if (!flAcceptRes.ok) throw new Error(`Freelancer acceptance failed: ${JSON.stringify(flAcceptData)}`);
    console.log(`Freelancer accepted counter offer. Updated Bid Amount: $${flAcceptData.proposal.bidAmount}`);

    // 12. Client accepts proposal to assign the gig
    console.log('\nStep 11: Client accepting proposal to assign the Gig...');
    const acceptProposalRes = await fetch(`${API_BASE}/proposals/${proposalId}/status`, {
      method: 'POST', // Wait, status update is a PATCH route in proposal.routes.js: router.patch('/:id/status', updateProposalStatus)
      // Let's verify what route we declared. In proposal.routes.js:
      // router.patch('/:id/status', updateProposalStatus);
      // Yes! It is a PATCH request! Let's send PATCH.
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientAuthToken}`,
      },
      body: JSON.stringify({
        status: 'accepted',
      }),
    });
    const acceptProposalData = await acceptProposalRes.json();
    if (!acceptProposalRes.ok) throw new Error(`Accepting proposal failed: ${JSON.stringify(acceptProposalData)}`);
    console.log('Proposal accepted. Gig assigned.');

    // Verify Gig is assigned and status is updated
    const finalGigObj = await Gig.findById(gigId);
    console.log(`Final Gig Status: ${finalGigObj.status}, Assigned Freelancer: ${finalGigObj.assignedFreelancer}`);
    if (finalGigObj.status !== 'assigned') throw new Error('Expected Gig status to be "assigned"!');

    console.log('\n=== E2E SYSTEM INTEGRATION TEST PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('E2E integration test failed:', err.message);
  } finally {
    // Cleanup seed data
    console.log('\nCleaning up E2E test data...');
    await User.deleteMany({ email: /@e2etest\.com$/ });
    await Gig.deleteMany({ title: /\[E2E Test\]/ });
    await Proposal.deleteMany({});
    await Notification.deleteMany({});

    await mongoose.disconnect();
    console.log('Disconnected from DB.');
  }
}

runE2E();
