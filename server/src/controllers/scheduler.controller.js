import User from '../models/User.js';

/**
 * Get freelancer's availability slots.
 * If :id is provided, gets that user's slots, else gets req.user's slots.
 */
export const getAvailability = async (req, res) => {
  try {
    const targetId = req.params.id || req.user._id;
    const user = await User.findById(targetId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role !== 'freelancer' || !user.freelancerProfile) {
      return res.status(400).json({ success: false, message: 'User is not a freelancer or profile not initialized' });
    }

    return res.status(200).json({
      success: true,
      availabilitySlots: user.freelancerProfile.availabilitySlots || [],
    });
  } catch (error) {
    console.error('getAvailability error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update freelancer's availability slots. Replace existing.
 */
export const updateAvailability = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'freelancer') {
      return res.status(403).json({ success: false, message: 'Only freelancers can update availability' });
    }

    const { availabilitySlots } = req.body;
    if (!Array.isArray(availabilitySlots)) {
      return res.status(400).json({ success: false, message: 'availabilitySlots must be an array' });
    }

    // Basic validation of slots
    for (const slot of availabilitySlots) {
      if (!slot.day || !slot.startTime || !slot.endTime) {
        return res.status(400).json({ success: false, message: 'Each slot must have day, startTime, and endTime' });
      }
    }

    if (!user.freelancerProfile) {
      user.freelancerProfile = {};
    }

    user.freelancerProfile.availabilitySlots = availabilitySlots;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      availabilitySlots: user.freelancerProfile.availabilitySlots,
    });
  } catch (error) {
    console.error('updateAvailability error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Helper function to check if a specific time slot is available for a freelancer.
 * @param {String} freelancerId
 * @param {String} day e.g. "Monday"
 * @param {String} startTime e.g. "09:00"
 * @param {String} endTime e.g. "10:00"
 * @returns {Boolean} true if available, false otherwise
 */
export const isSlotAvailable = async (freelancerId, day, startTime, endTime) => {
  try {
    const user = await User.findById(freelancerId);
    if (!user || user.role !== 'freelancer' || !user.freelancerProfile) {
      return false;
    }

    const slots = user.freelancerProfile.availabilitySlots || [];
    
    // Simple exact match logic for this implementation
    const isMatch = slots.some(
      (slot) => slot.day === day && slot.startTime === startTime && slot.endTime === endTime
    );

    return isMatch;
  } catch (error) {
    console.error('isSlotAvailable error:', error);
    return false;
  }
};
