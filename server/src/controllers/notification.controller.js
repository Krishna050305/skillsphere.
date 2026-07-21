import Notification from '../models/Notification.js';

/**
 * Fetches notifications for the logged-in user.
 * Sorted to show unread notifications first, then sorted by newest.
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: userId })
      .sort({ isRead: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ user: userId });
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    next(error);
  }
};

/**
 * Marks notifications as read.
 * If a notification ID is passed in req.params, it marks that specific notification.
 * Otherwise, it marks all unread notifications for the user as read.
 */
export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (id) {
      const notification = await Notification.findOneAndUpdate(
        { _id: id, user: userId },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      return res.json({
        success: true,
        message: 'Notification marked as read',
        notification
      });
    } else {
      // Mark all unread notifications as read
      const result = await Notification.updateMany(
        { user: userId, isRead: false },
        { $set: { isRead: true } }
      );

      return res.json({
        success: true,
        message: 'All notifications marked as read',
        modifiedCount: result.modifiedCount
      });
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    next(error);
  }
};
