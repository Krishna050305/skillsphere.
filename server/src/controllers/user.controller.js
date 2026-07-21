import User from '../models/User.js';
import { sanitizeUser } from '../utils/sanitize.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { recomputeEmbeddingForUser } from '../services/matching.service.js';

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
};

export const updateMe = async (req, res) => {
  try {
    const user = req.user;

    // 1. Role-specific profile updates
    if (user.role === 'freelancer') {
      if (req.body.freelancerProfile) {
        if (!user.freelancerProfile) {
          user.freelancerProfile = {};
        }

        const allowedFields = [
          'headline',
          'bio',
          'skills',
          'portfolio',
          'resumeUrl',
          'certifications',
          'workHistory',
          'hourlyRate',
          'availability',
          'availabilitySlots',
        ];

        for (const field of allowedFields) {
          if (req.body.freelancerProfile[field] !== undefined) {
            user.freelancerProfile[field] = req.body.freelancerProfile[field];
          }
        }
      }
    } else if (user.role === 'client') {
      if (req.body.clientProfile) {
        if (!user.clientProfile) {
          user.clientProfile = {};
        }

        const allowedFields = ['companyName', 'about'];

        for (const field of allowedFields) {
          if (req.body.clientProfile[field] !== undefined) {
            user.clientProfile[field] = req.body.clientProfile[field];
          }
        }
      }
    }

    // 2. Common editable fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.avatarUrl !== undefined) user.avatarUrl = req.body.avatarUrl;

    if (req.body.location) {
      if (req.body.location.city !== undefined) user.location.city = req.body.location.city;
      if (req.body.location.address !== undefined) user.location.address = req.body.location.address;
      if (req.body.location.coordinates !== undefined) {
        user.location.coordinates = req.body.location.coordinates;
      }
    }

    // Note: email, role, and status cannot be updated through this endpoint.
    await user.save();

    if (user.role === 'freelancer' && req.body.freelancerProfile) {
      recomputeEmbeddingForUser(user._id).catch(err => {
        console.error('Failed background embedding calculation for user:', err.message);
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating your profile',
      code: 'SERVER_ERROR',
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const sanitized = sanitizeUser(targetUser);

    // Omit email and phone unless the requester is the owner of the profile or an admin
    const requesterId = req.user ? req.user._id.toString() : null;
    const isOwner = requesterId === targetUser._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    // Increment profile views if viewer is not the owner
    if (!isOwner && targetUser.role === 'freelancer' && targetUser.freelancerProfile) {
      targetUser.freelancerProfile.profileViews = (targetUser.freelancerProfile.profileViews || 0) + 1;
      await targetUser.save();
    }

    if (!isOwner && !isAdmin) {
      delete sanitized.email;
      delete sanitized.phone;
    }

    return res.status(200).json({
      success: true,
      user: sanitized,
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving user details',
      code: 'SERVER_ERROR',
    });
  }
};

export const uploadPortfolioItem = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Only freelancers can upload portfolio items',
        code: 'FORBIDDEN',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio image/file is required',
        code: 'VALIDATION_ERROR',
      });
    }

    const { title, description, link } = req.body;
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio item title is required',
        code: 'VALIDATION_ERROR',
      });
    }

    // Upload to Cloudinary
    const fileUrl = await uploadToCloudinary(req.file.buffer, 'portfolios', req.file.originalname);

    if (!user.freelancerProfile) {
      user.freelancerProfile = { skills: [], portfolio: [], workHistory: [], availabilitySlots: [] };
    }

    // Limit check
    if (user.freelancerProfile.portfolio.length >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio cannot exceed 10 items',
        code: 'VALIDATION_ERROR',
      });
    }

    user.freelancerProfile.portfolio.push({
      title,
      imageUrl: fileUrl,
      link: link || '',
      description: description || '',
    });

    await user.save();

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Upload portfolio error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during portfolio upload',
      code: 'SERVER_ERROR',
    });
  }
};

export const uploadResume = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Only freelancers can upload a resume',
        code: 'FORBIDDEN',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resume file is required',
        code: 'VALIDATION_ERROR',
      });
    }

    // Upload to Cloudinary
    const fileUrl = await uploadToCloudinary(req.file.buffer, 'resumes', req.file.originalname);

    if (!user.freelancerProfile) {
      user.freelancerProfile = { skills: [], portfolio: [], workHistory: [], availabilitySlots: [] };
    }

    user.freelancerProfile.resumeUrl = fileUrl;
    await user.save();

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during resume upload',
      code: 'SERVER_ERROR',
    });
  }
};

// ==========================================
// 2FA Stub
// ==========================================

export const enable2FA = (req, res) => {
  return res.status(501).json({
    error: 'Google OAuth is not yet implemented',
    status: 'planned',
  });
};
