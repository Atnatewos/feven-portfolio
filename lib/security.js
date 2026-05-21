// File: lib/security.js
import { headers } from 'next/headers';

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_AUTH_MAX = 5;
const rateLimitStore = new Map();

/**
 * Rate limiter using in-memory Map.
 * Tracks requests per IP within a sliding window.
 * In production, replace with Redis or Upstash.
 * @param {number} [maxRequests=30] - Maximum requests allowed in the window
 * @returns {{ allowed: boolean, remaining: number, resetTime: number }}
 */
export function checkRateLimit(maxRequests = RATE_LIMIT_MAX_REQUESTS) {
  const headersList = headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const clientIp = forwardedFor?.split(',')[0]?.trim() || '127.0.0.1';
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimitStore.has(clientIp)) {
    rateLimitStore.set(clientIp, []);
  }

  const timestamps = rateLimitStore.get(clientIp).filter((ts) => ts > windowStart);
  timestamps.push(now);
  rateLimitStore.set(clientIp, timestamps);

  const remaining = Math.max(0, maxRequests - timestamps.length);
  const resetTime = now + RATE_LIMIT_WINDOW;

  if (timestamps.length > maxRequests) {
    return { allowed: false, remaining: 0, resetTime };
  }

  return { allowed: true, remaining, resetTime };
}

/**
 * Strict rate limiter for authentication endpoints.
 * Allows fewer requests to prevent brute force attacks.
 * @returns {{ allowed: boolean, remaining: number, resetTime: number }}
 */
export function checkAuthRateLimit() {
  return checkRateLimit(RATE_LIMIT_AUTH_MAX);
}

/**
 * Sanitizes a string input to prevent XSS attacks.
 * Removes HTML tags, trims whitespace, and limits length.
 * @param {string} input - Raw user input
 * @param {number} [maxLength=1000] - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes input for SQL-like contexts by escaping special characters.
 * Used as defense-in-depth alongside parameterized queries.
 * @param {string} input - Raw input
 * @param {number} [maxLength=500] - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeSqlInput(input, maxLength = 500) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/['"\\;]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates an email address format.
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email format is valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim());
}


/**
 * Validates a URL format for media links.
 * Accepts any http/https URL, Cloudinary URLs, and local paths starting with /.
 * This is intentionally permissive — the admin is trusted to add valid media.
 *
 * @param {string} url - URL to validate
 * @returns {boolean} Whether the URL is acceptable
 */
export function isValidMediaUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim();

  /*
   * Local paths starting with / are always allowed.
   * Example: /images/thumbnail.jpg, /feven-logo-black.svg
   */
  if (trimmed.startsWith('/')) {
    return true;
  }

  /*
   * Accept any http or https URL.
   * The admin is trusted to add valid media links.
   * If someone pastes a broken link, it just won't load on the public site.
   */
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }

  /*
   * Reject anything that's not a URL or local path.
   * This prevents accidental text input from being saved as a URL.
   */
  return false;
}

/**
 * Validates that a value is one of the allowed categories.
 * @param {string} value - Value to check
 * @param {string[]} allowed - Array of allowed values
 * @returns {boolean} Whether the value is allowed
 */
export function isAllowedCategory(value, allowed) {
  if (!value || !Array.isArray(allowed)) {
    return false;
  }
  return allowed.includes(value);
}

/**
 * Generates a CSRF token for form protection.
 * In production, store and validate these tokens.
 * @returns {string} Random token
 */
export function generateCsrfToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Cleans up expired rate limit entries periodically.
 * Prevents memory leaks from the rate limit store.
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const filtered = timestamps.filter((ts) => ts > windowStart);
    if (filtered.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, filtered);
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}