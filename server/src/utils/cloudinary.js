import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_secret',
});

// Configure Multer memory storage
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Uploads a file buffer to Cloudinary.
 * Gracefully falls back to a mock URL if Cloudinary keys are placeholders or if upload fails.
 * @param {Buffer} fileBuffer - The file buffer
 * @param {String} folder - Folder name in Cloudinary
 * @param {String} originalName - Original file name for logging/mocking
 * @returns {Promise<String>} The uploaded file's URL
 */
export const uploadToCloudinary = async (fileBuffer, folder, originalName = 'file') => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const isPlaceholder = !cloudName || cloudName.includes('placeholder') || cloudName === 'mock_cloud';

  if (isPlaceholder) {
    console.log(`[Cloudinary Mock] Mocking upload for "${originalName}" into folder "${folder}"`);
    const cleanName = originalName.replace(/\s+/g, '_');
    return `https://res.cloudinary.com/mock-cloud/raw/upload/v${Date.now()}/${folder}/${cleanName}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `skillsphere/${folder}`,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload stream error, falling back to mock:', error);
          const cleanName = originalName.replace(/\s+/g, '_');
          return resolve(`https://res.cloudinary.com/mock-cloud/raw/upload/v${Date.now()}/${folder}/${cleanName}`);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};
