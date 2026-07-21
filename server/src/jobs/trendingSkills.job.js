import cron from 'node-cron';
import Gig from '../models/Gig.js';
import TrendingSkills from '../models/TrendingSkills.js';

/**
 * Execute the aggregation pipeline to identify and weight trending skills
 */
export async function runTrendingSkillsAggregation() {
  console.log('Starting trending skills aggregation job...');
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const results = await Gig.aggregate([
      // 1. Filter gigs created in the last 14 days
      {
        $match: {
          createdAt: { $gte: fourteenDaysAgo },
        },
      },
      // 2. Split requiredSkills array into individual documents
      {
        $unwind: '$requiredSkills',
      },
      // 3. Project weight (weight double if created in the last 3 days)
      {
        $project: {
          skill: '$requiredSkills',
          weight: {
            $cond: {
              if: { $gte: ['$createdAt', threeDaysAgo] },
              then: 2,
              else: 1,
            },
          },
        },
      },
      // 4. Group by skill name and sum weights
      {
        $group: {
          _id: '$skill',
          count: { $sum: '$weight' },
        },
      },
      // 5. Sort descending by computed sum
      {
        $sort: { count: -1 },
      },
      // 6. Restrict to top 10 trends
      {
        $limit: 10,
      },
      // 7. Format output fields
      {
        $project: {
          _id: 0,
          name: '$_id',
          count: 1,
        },
      },
    ]);

    // Overwrite the current trending skills document
    await TrendingSkills.deleteMany({});
    await TrendingSkills.create({
      skills: results,
      updatedAt: new Date(),
    });

    console.log(`Trending skills aggregation complete. Aggregated ${results.length} skills.`);
  } catch (err) {
    console.error('Error running trending skills aggregation job:', err.message);
  }
}

/**
 * Initialize trending skills cron scheduler
 */
export function initTrendingSkillsJob() {
  // Schedule to run daily at midnight
  cron.schedule('0 0 * * *', () => {
    runTrendingSkillsAggregation();
  });

  // Run on initialization to ensure database has initial stats
  runTrendingSkillsAggregation();
}
