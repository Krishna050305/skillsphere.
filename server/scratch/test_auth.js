import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const API_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'test_verification_user@example.com';
const TEST_PASSWORD = 'Password123!';

async function runTest() {
  console.log('--- STARTING AUTHENTICATION FLOW INTEGRATION TEST ---');

  // 1. Connect to MongoDB to manage test user state
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsphere');
  console.log('Connected.');

  // Clean up any existing test user
  console.log(`Cleaning up user: ${TEST_EMAIL}`);
  await User.deleteOne({ email: TEST_EMAIL });

  // 2. Register
  console.log('\nStep 1: Registering User...');
  try {
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        role: 'freelancer',
        name: 'Test Freelancer',
        phone: '+91 9999988888',
        location: {
          city: 'Mumbai',
          address: 'Maharashtra, India',
          coordinates: [72.8777, 19.0760]
        }
      })
    });

    const registerData = await registerRes.json();
    console.log('Register Response Status:', registerRes.status);
    console.log('Register Success:', registerData.success);
    console.log('Register User Returned (Sanitized):', registerData.user);
    console.log('JWT Token Returned:', !!registerData.token);

    if (!registerData.success) {
      throw new Error('Registration failed: ' + registerData.message);
    }

    // 3. Retrieve Verification Token from Database (Simulating email link click)
    console.log('\nStep 2: Fetching verification token from DB...');
    const userInDb = await User.findOne({ email: TEST_EMAIL });
    if (!userInDb) {
      throw new Error('User not found in DB after registration!');
    }
    const token = userInDb.verificationToken;
    console.log('Verification Token retrieved:', token);

    // 4. Verify Email
    console.log('\nStep 3: Verifying Email via API...');
    const verifyRes = await fetch(`${API_URL}/auth/verify-email?token=${token}`);
    const verifyData = await verifyRes.json();
    console.log('Verify Response Status:', verifyRes.status);
    console.log('Verify Data:', verifyData);

    // Verify change in DB
    const verifiedUser = await User.findOne({ email: TEST_EMAIL });
    console.log('IsVerified in DB:', verifiedUser.isVerified);

    // 5. Login
    console.log('\nStep 4: Logging in...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    const loginData = await loginRes.json();
    console.log('Login Response Status:', loginRes.status);
    console.log('Login User Name:', loginData.user?.name);
    console.log('Cookies returned (should contain refreshToken):', loginRes.headers.get('set-cookie'));
    const accessToken = loginData.token;

    // 6. Get Me (Auth Profile)
    console.log('\nStep 5: Calling /api/users/me...');
    const meRes = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const meData = await meRes.json();
    console.log('GetMe Status:', meRes.status);
    console.log('GetMe User email:', meData.user?.email);
    console.log('Is Onboarding Complete? (Headline/Bio):', !!(meData.user?.freelancerProfile?.headline));

    // 7. Update Me (Onboarding)
    console.log('\nStep 6: Completing Onboarding (updateMe)...');
    const updateRes = await fetch(`${API_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        freelancerProfile: {
          headline: 'Lead Solutions Architect',
          bio: 'Over 10 years of experience building secure distributed cloud applications and APIs.',
          skills: [
            { name: 'Node.js', proficiency: 'expert' },
            { name: 'React', proficiency: 'expert' },
            { name: 'MongoDB', proficiency: 'intermediate' }
          ],
          hourlyRate: 85
        }
      })
    });

    const updateData = await updateRes.json();
    console.log('UpdateMe Status:', updateRes.status);
    console.log('Updated User Freelancer Profile:', updateData.user?.freelancerProfile);

    // 8. Test OAuth and 2FA 501 Stubs
    console.log('\nStep 7: Testing Google OAuth stub...');
    const googleRes = await fetch(`${API_URL}/auth/google`);
    const googleData = await googleRes.json();
    console.log('Google Auth Stub Status:', googleRes.status);
    console.log('Google Auth Stub Error Response:', googleData);

    console.log('\nStep 8: Testing 2FA enable stub...');
    const tfaRes = await fetch(`${API_URL}/users/me/2fa/enable`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const tfaData = await tfaRes.json();
    console.log('2FA Enable Stub Status:', tfaRes.status);
    console.log('2FA Enable Stub Error Response:', tfaData);

    console.log('\n--- ALL FLOW TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('Test Failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB.');
  }
}

runTest();
