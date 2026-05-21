// File: lib/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Cloudinary environment variables are not fully configured');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Generates an optimized image URL with responsive transformations.
 *
 * @param {string} publicId   - The Cloudinary public ID
 * @param {Object} [options]  - Transformation options
 * @param {number} [options.width]    - Desired width in pixels
 * @param {number} [options.height]   - Desired height in pixels
 * @param {string} [options.crop]     - Crop mode (fit, fill, crop, etc.)
 * @param {number} [options.quality]  - Image quality (1-100), defaults to 'auto'
 * @param {string} [options.format]   - Output format, defaults to 'auto'
 * @returns {string} Optimized Cloudinary URL
 */
export function getImageUrl(publicId, options = {}) {
  if (!publicId) {
    return '/images/placeholder.jpg';
  }

  const transforms = {
    quality: 'auto',
    fetchFormat: 'auto',
    ...options,
  };

  return cloudinary.url(publicId, transforms);
}

/**
 * Generates a responsive image srcSet for different screen sizes.
 * Returns both the URLs and the srcSet attribute string.
 *
 * @param {string} publicId - The Cloudinary public ID
 * @param {number[]} [widths] - Array of widths for the srcSet
 * @returns {Object} { srcSet: string, defaultUrl: string, sizes: string }
 */
export function getResponsiveImage(publicId, widths = [320, 640, 768, 1024, 1366, 1920]) {
  if (!publicId) {
    return {
      srcSet: '',
      defaultUrl: '/images/placeholder.jpg',
      sizes: '100vw',
    };
  }

  const srcSet = widths
    .map((width) => {
      const url = cloudinary.url(publicId, {
        width,
        quality: 'auto',
        fetchFormat: 'auto',
        crop: 'scale',
      });
      return `${url} ${width}w`;
    })
    .join(', ');

  const defaultUrl = cloudinary.url(publicId, {
    width: widths[Math.floor(widths.length / 2)],
    quality: 'auto',
    fetchFormat: 'auto',
  });

  return {
    srcSet,
    defaultUrl,
    sizes: '100vw',
  };
}

/**
 * Generates a mobile-optimized image URL (smaller, lower quality).
 * Used for hero images on mobile devices to reduce bandwidth.
 *
 * @param {string} publicId - The Cloudinary public ID
 * @returns {string} Mobile-optimized URL
 */
export function getMobileImageUrl(publicId) {
  if (!publicId) {
    return '/images/placeholder.jpg';
  }

  return cloudinary.url(publicId, {
    width: 768,
    quality: 'auto',
    fetchFormat: 'auto',
    crop: 'fill',
  });
}

/**
 * Generates a desktop-optimized image URL (full resolution).
 *
 * @param {string} publicId - The Cloudinary public ID
 * @returns {string} Desktop-optimized URL
 */
export function getDesktopImageUrl(publicId) {
  if (!publicId) {
    return '/images/placeholder.jpg';
  }

  return cloudinary.url(publicId, {
    width: 1920,
    quality: 'auto',
    fetchFormat: 'auto',
    crop: 'fill',
  });
}

/**
 * Generates a video URL with optimal streaming settings.
 *
 * @param {string} publicId - The Cloudinary public ID
 * @param {Object} [options] - Transformation options
 * @returns {string} Optimized video URL
 */
export function getVideoUrl(publicId, options = {}) {
  if (!publicId) {
    return null;
  }

  const transforms = {
    resource_type: 'video',
    quality: 'auto',
    fetchFormat: 'auto',
    ...options,
  };

  return cloudinary.url(publicId, transforms);
}

/**
 * Extracts the Cloudinary public ID from a full URL.
 * Useful for operations like deletion that require the public ID.
 *
 * @param {string} url - Full Cloudinary URL
 * @returns {string|null} The public ID, or null if not a Cloudinary URL
 */
export function extractPublicId(url) {
  if (!url) {
    return null;
  }

  const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/;
  const match = url.match(regex);

  return match ? match[1] : null;
}

/**
 * Generates a signed upload signature for direct client-side uploads.
 * The signature expires after 1 hour and is scoped to a specific folder.
 *
 * @param {string} [folder='fevens-portfolio'] - The Cloudinary folder for uploads
 * @returns {Object} { signature, timestamp, cloudName, apiKey, folder }
 */
export function generateUploadSignature(folder = 'fevens-portfolio') {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = { timestamp, folder };

  const signature = cloudinary.utils.api_sign_request(params, CLOUDINARY_API_SECRET);

  return {
    signature,
    timestamp,
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    folder,
  };
}

export { cloudinary };
export default cloudinary;