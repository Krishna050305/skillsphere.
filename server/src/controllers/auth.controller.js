import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Joi from 'joi';
import User from '../models/User.js';
import { sanitizeUser } from '../utils/sanitize.js';
import {
  signAccessToken,
  signRefreshToken,
  blacklistRefreshToken,
  verifyRefreshToken,
} from '../utils/token.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

// ==========================================
// Joi Validation Schemas
// ==========================================

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one number, and one special character',
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('client', 'freelancer').required().messages({
    'any.required': 'Role is required',
  }),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required',
  }),
  phone: Joi.string().pattern(/^[+]?[\d\s\-()]{7,15}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Please enter a valid phone number',
  }),
  location: Joi.object({
    city: Joi.string().optional().allow('', null),
    address: Joi.string().optional().allow('', null),
    coordinates: Joi.array().items(Joi.number()).length(2).optional(),
  }).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token is required',
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one number, and one special character',
    'any.required': 'Password is required',
  }),
});

// ==========================================
// Controller Handlers
// ==========================================

export const register = async (req, res) => {
  try {
    const { email, password, role, name, phone, location } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email address is already registered',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Setup default location structure
    const userLocation = {
      type: 'Point',
      coordinates: (location && location.coordinates) || [77.5946, 12.9716], // Default coordinates (e.g. Bangalore)
      city: (location && location.city) || '',
      address: (location && location.address) || '',
    };

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user
    const newUser = new User({
      email,
      passwordHash,
      role,
      name,
      phone,
      location: userLocation,
      verificationToken,
      verificationTokenExpires,
      // Add empty sub-profiles based on role
      freelancerProfile: role === 'freelancer' ? { skills: [], portfolio: [], workHistory: [], availabilitySlots: [] } : null,
      clientProfile: role === 'client' ? {} : null,
    });

    await newUser.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
    }

    // Generate tokens
    const accessToken = signAccessToken({ id: newUser._id, role: newUser.role });
    const refreshToken = signRefreshToken({ id: newUser._id });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      success: true,
      token: accessToken,
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
      code: 'SERVER_ERROR',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Verify status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your account is currently ${user.status}`,
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address to log in',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      token: accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      code: 'SERVER_ERROR',
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
        code: 'TOKEN_INVALID',
      });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is invalid or has expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Your email has been successfully verified! You can now log in.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during email verification',
      code: 'SERVER_ERROR',
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 even if email doesn't exist for security reasons, so emails aren't enumerable.
      return res.status(200).json({
        success: true,
        message: 'If that email address exists, a reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpires;
    await user.save();

    // Send email
    try {
      await sendPasswordResetEmail(email, user.name, resetToken);
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr);
    }

    return res.status(200).json({
      success: true,
      message: 'If that email address exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing password reset request',
      code: 'SERVER_ERROR',
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user.passwordHash = passwordHash;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during password reset',
      code: 'SERVER_ERROR',
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is missing',
        code: 'TOKEN_INVALID',
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is invalid or blacklisted',
        code: 'TOKEN_INVALID',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Associated user not found or inactive',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Generate new access token
    const newAccessToken = signAccessToken({ id: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      token: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while refreshing token',
      code: 'SERVER_ERROR',
    });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      blacklistRefreshToken(token);
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during logout',
      code: 'SERVER_ERROR',
    });
  }
};

// ==========================================
// OAuth Stubs
// ==========================================

export const googleAuth = (req, res) => {
  return res.status(501).json({
    error: 'Google OAuth is not yet implemented',
    status: 'planned',
  });
};

export const googleAuthCallback = (req, res) => {
  return res.status(501).json({
    error: 'Google OAuth is not yet implemented',
    status: 'planned',
  });
};
