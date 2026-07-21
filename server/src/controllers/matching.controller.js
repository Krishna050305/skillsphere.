import { matchFreelancersToGig, matchGigsToFreelancer } from '../services/matching.service.js';
import { sanitizeUser } from '../utils/sanitize.js';

export async function getRecommendedFreelancersForGig(req, res, next) {
  try {
    const { id } = req.params;
    const recommendations = await matchFreelancersToGig(id);

    // Sanitize user profile objects
    const sanitized = recommendations.map(item => ({
      score: item.score,
      freelancer: sanitizeUser(item.freelancer),
    }));

    res.status(200).json({
      success: true,
      results: sanitized,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecommendedGigsForFreelancer(req, res, next) {
  try {
    const { id } = req.params;
    const recommendations = await matchGigsToFreelancer(id);

    res.status(200).json({
      success: true,
      results: recommendations,
    });
  } catch (err) {
    next(err);
  }
}
