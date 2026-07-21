import axios from 'axios';
import Gig from '../models/Gig.js';
import User from '../models/User.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

/**
 * Request text embedding from FastAPI microservice
 */
export async function getEmbedding(text) {
  if (!text || !text.trim()) {
    throw new Error('Text parameter is required for embedding generation.');
  }

  try {
    const res = await axios.post(`${ML_SERVICE_URL}/embed`, { text: text.trim() }, { timeout: 3000 });
    return res.data.embedding;
  } catch (err) {
    console.error('Failed to get embedding from ML service, generating mock:', err.message);
    
    // Fallback: stable mock embedding generation if ML service is unreachable
    const mockVector = [];
    let charSum = 0;
    for (let i = 0; i < text.length; i++) {
      charSum += text.charCodeAt(i);
    }
    for (let i = 0; i < 384; i++) {
      // Deterministic pseudo-random number based on text
      const seed = Math.sin(charSum + i) * 10000;
      mockVector.push(seed - Math.floor(seed));
    }
    // Normalize mock vector
    const norm = Math.sqrt(mockVector.reduce((sum, val) => sum + val * val, 0));
    return mockVector.map(v => (norm > 0 ? v / norm : 0));
  }
}

/**
 * Recomputes and saves embedding for a freelancer user
 */
export async function recomputeEmbeddingForUser(userId) {
  const user = await User.findById(userId);
  if (!user || user.role !== 'freelancer') {
    throw new Error('User not found or is not a freelancer.');
  }

  const profile = user.freelancerProfile || {};
  const skillsText = (profile.skills || []).map(s => s.name).join(' ');
  const textToEmbed = `${user.name} ${profile.headline || ''} ${profile.bio || ''} ${skillsText}`;

  console.log(`Recomputing embedding for user ${userId}...`);
  const vector = await getEmbedding(textToEmbed);
  
  user.freelancerProfile.embeddingVector = vector;
  await user.save();
  return vector;
}

/**
 * Recomputes and saves embedding for a gig
 */
export async function recomputeEmbeddingForGig(gigId) {
  const gig = await Gig.findById(gigId);
  if (!gig) {
    throw new Error('Gig not found.');
  }

  const skillsText = (gig.requiredSkills || []).join(' ');
  const textToEmbed = `${gig.title} ${gig.description} ${skillsText}`;

  console.log(`Recomputing embedding for gig ${gigId}...`);
  const vector = await getEmbedding(textToEmbed);

  gig.embeddingVector = vector;
  await gig.save();
  return vector;
}

/**
 * Recommends freelancers for a specific gig
 */
export async function matchFreelancersToGig(gigId) {
  const gig = await Gig.findById(gigId);
  if (!gig) {
    throw new Error('Gig not found.');
  }

  // 1. Lazy generate gig embedding if empty
  if (!gig.embeddingVector || gig.embeddingVector.length === 0) {
    gig.embeddingVector = await recomputeEmbeddingForGig(gigId);
  }

  // 2. Load active freelancers who have non-empty embeddings
  const freelancers = await User.find({
    role: 'freelancer',
    status: 'active',
    'freelancerProfile.embeddingVector': { $exists: true, $not: { $size: 0 } },
  });

  if (freelancers.length === 0) {
    return [];
  }

  // 3. Extract gig coordinates
  const gigLat = gig.location?.coordinates?.[1] || null;
  const gigLon = gig.location?.coordinates?.[0] || null;

  // 4. Formulate candidates list
  const candidates = freelancers.map(f => ({
    id: f._id.toString(),
    embedding: f.freelancerProfile.embeddingVector,
    reputation_score: f.freelancerProfile.reputationScore || 0,
    latitude: f.location?.coordinates?.[1] || null,
    longitude: f.location?.coordinates?.[0] || null,
  }));

  // 5. Query FastAPI match ranking service
  const matchRequest = {
    target_embedding: gig.embeddingVector,
    target_lat: gigLat,
    target_lon: gigLon,
    is_remote_ok: gig.isRemoteOk || false,
    candidates,
  };

  const matchRes = await axios.post(`${ML_SERVICE_URL}/match`, matchRequest);
  const results = matchRes.data.results;

  // 6. Join back to full user objects preserving rank order
  const freelancerMap = {};
  freelancers.forEach(f => {
    freelancerMap[f._id.toString()] = f;
  });

  return results
    .map(r => ({
      score: r.score,
      freelancer: freelancerMap[r.id],
    }))
    .filter(item => item.freelancer !== undefined);
}

/**
 * Recommends gigs for a specific freelancer
 */
export async function matchGigsToFreelancer(userId) {
  const user = await User.findById(userId);
  if (!user || user.role !== 'freelancer') {
    throw new Error('User not found or is not a freelancer.');
  }

  // 1. Lazy generate freelancer embedding if empty
  if (!user.freelancerProfile.embeddingVector || user.freelancerProfile.embeddingVector.length === 0) {
    user.freelancerProfile.embeddingVector = await recomputeEmbeddingForUser(userId);
  }

  // 2. Load open gigs with embeddings
  const gigs = await Gig.find({
    status: 'open',
    embeddingVector: { $exists: true, $not: { $size: 0 } },
  });

  if (gigs.length === 0) {
    return [];
  }

  // 3. Extract user coordinates
  const userLat = user.location?.coordinates?.[1] || null;
  const userLon = user.location?.coordinates?.[0] || null;

  // 4. Formulate candidates list
  const candidates = gigs.map(gig => {
    const isGigRemote = gig.isRemoteOk || false;
    const gigLat = gig.location?.coordinates?.[1] || null;
    const gigLon = gig.location?.coordinates?.[0] || null;

    return {
      id: gig._id.toString(),
      embedding: gig.embeddingVector,
      reputation_score: 0.0, // Gigs do not have rating score; default to 0.0
      // Smart workaround for remote candidate gigs: if remote, set coords to match user coords
      // so the distance decay is 0 (giving proximity score 1.0)
      latitude: isGigRemote ? userLat : gigLat,
      longitude: isGigRemote ? userLon : gigLon,
    };
  });

  // 5. Query FastAPI match ranking service
  const matchRequest = {
    target_embedding: user.freelancerProfile.embeddingVector,
    target_lat: userLat,
    target_lon: userLon,
    is_remote_ok: false, // Handle remote eligibility per gig inside candidate coordinates mapping
    candidates,
  };

  const matchRes = await axios.post(`${ML_SERVICE_URL}/match`, matchRequest);
  const results = matchRes.data.results;

  // 6. Join back to gig objects preserving rank order
  const gigMap = {};
  gigs.forEach(g => {
    gigMap[g._id.toString()] = g;
  });

  return results
    .map(r => ({
      score: r.score,
      gig: gigMap[r.id],
    }))
    .filter(item => item.gig !== undefined);
}
