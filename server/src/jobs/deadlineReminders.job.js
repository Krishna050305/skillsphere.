import cron from 'node-cron';
import Gig from '../models/Gig.js';
import { emitNotification } from '../sockets/notification.handler.js';

export const initDeadlineRemindersJob = () => {
  // Run every day at 8:00 AM (server time)
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running daily milestone deadline reminders job...');
    try {
      const now = new Date();
      const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      // Find all gigs that have milestones due within 48 hours and aren't fully paid
      const gigs = await Gig.find({
        status: { $in: ['assigned', 'in_progress'] },
        'milestones.dueDate': { $gte: now, $lte: in48Hours },
        'milestones.status': { $ne: 'paid' },
        assignedFreelancer: { $ne: null }
      });

      let remindersSent = 0;

      for (const gig of gigs) {
        // Iterate milestones to find the specific ones
        for (const milestone of gig.milestones) {
          if (
            milestone.dueDate &&
            milestone.dueDate >= now &&
            milestone.dueDate <= in48Hours &&
            milestone.status !== 'paid'
          ) {
            // Send notification
            await emitNotification(
              gig.assignedFreelancer,
              'milestone_reminder',
              {
                message: `Reminder: The milestone "${milestone.title}" for gig "${gig.title}" is due soon!`,
                gigId: gig._id,
                milestoneId: milestone._id,
                dueDate: milestone.dueDate
              }
            );
            remindersSent++;
          }
        }
      }

      console.log(`[Cron] Deadline reminders job completed. Sent ${remindersSent} reminders.`);
    } catch (err) {
      console.error('[Cron] Error in deadline reminders job:', err);
    }
  });
};
