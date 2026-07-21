import Gig from '../models/Gig.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

/**
 * Update the 0-100 progress percentage for a specific milestone.
 * Independent of the escrow payment state.
 */
export const updateMilestoneProgress = async (req, res) => {
  try {
    const { gigId, milestoneId } = req.params;
    const { progressPercent } = req.body;
    const user = req.user;

    if (progressPercent === undefined || progressPercent < 0 || progressPercent > 100) {
      return res.status(400).json({ success: false, message: 'Invalid progress percentage (must be 0-100)' });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    // Verify authorized user (must be assigned freelancer)
    if (String(gig.assignedFreelancer) !== String(user._id)) {
      return res.status(403).json({ success: false, message: 'Only the assigned freelancer can update progress' });
    }

    const milestone = gig.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    milestone.progressPercent = progressPercent;
    await gig.save();

    return res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      milestone,
    });
  } catch (error) {
    console.error('updateMilestoneProgress error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Add a progress log note with an optional file to a milestone.
 */
export const addProgressLog = async (req, res) => {
  try {
    const { gigId, milestoneId } = req.params;
    const { note } = req.body;
    const user = req.user;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Note is required' });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    // Verify authorized user (must be assigned freelancer)
    if (String(gig.assignedFreelancer) !== String(user._id)) {
      return res.status(403).json({ success: false, message: 'Only the assigned freelancer can add progress logs' });
    }

    const milestone = gig.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    let fileUrl = '';
    if (req.file) {
      // Upload to Cloudinary if file is attached
      try {
        fileUrl = await uploadToCloudinary(req.file.buffer, 'progress_logs', req.file.originalname);
      } catch (uploadErr) {
        console.error('File upload failed:', uploadErr);
        return res.status(500).json({ success: false, message: 'Failed to upload attached file' });
      }
    }

    milestone.progressLogs.push({
      note,
      fileUrl,
      at: new Date(),
    });

    await gig.save();

    return res.status(200).json({
      success: true,
      message: 'Progress log added successfully',
      milestone,
    });
  } catch (error) {
    console.error('addProgressLog error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
