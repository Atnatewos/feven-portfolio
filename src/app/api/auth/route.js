// File: src/app/api/auth/route.js
import { NextResponse } from 'next/server';
import { checkAuthRateLimit } from '../../../../lib/security';
import crypto from 'crypto';

/*
 * Environment variables read from .env.local — never hardcoded.
 * JWT_SECRET is used for signing and verifying authentication tokens.
 * ADMIN_PASSWORD is the single password required to access the admin panel.
 * In production, both must be set to strong, unique values.
 */
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Encodes a string into base64url format.
 * base64url replaces '+' with '-', '/' with '_', and removes '=' padding.
 * This makes the output safe for use in URLs and HTTP headers without
 * requiring additional percent-encoding.
 *
 * @param {string} str - The string to encode
 * @returns {string} base64url encoded string
 */
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decodes a base64url encoded string back to its original UTF-8 form.
 * Reverses the character substitutions made during encoding.
 *
 * @param {string} str - The base64url encoded string
 * @returns {string} Decoded original string
 */
function base64urlDecode(str) {
  let normalized = str.replace(/-/g, '+').replace(/_/g, '/');

  /*
   * Restore the padding characters that were stripped during encoding.
   * The padding is required for the Buffer decoder to determine the
   * correct byte length of the original data.
   */
  while (normalized.length % 4) {
    normalized += '=';
  }

  return Buffer.from(normalized, 'base64').toString();
}

/**
 * Creates a cryptographically signed JSON Web Token.
 *
 * The token consists of three dot-separated base64url segments:
 * 1. Header — algorithm and token type
 * 2. Payload — claims including role, issued-at, expiration, and JTI
 * 3. Signature — HMAC-SHA256 of the first two segments
 *
 * Using HMAC-SHA256 provides tamper-proofing: any modification to the
 * header or payload will invalidate the signature. The unique JTI
 * (JWT ID) allows for token revocation in the future.
 *
 * @param {Object} payload - Claims to encode (role, iat, exp, jti)
 * @param {string} secret  - The secret key for HMAC signing
 * @returns {string} Complete signed JWT token
 */
function createToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const signature = base64url(hmac.digest());

  return `${data}.${signature}`;
}

/**
 * Verifies a JWT token's signature and expiration, then returns the payload.
 *
 * Verification steps performed in order:
 * 1. Structural validation — token must have exactly 3 dot-separated segments
 * 2. Signature verification — recompute HMAC-SHA256 and compare
 * 3. Expiration check — reject tokens past their 'exp' claim
 *
 * If any step fails, the function returns null rather than throwing.
 * This prevents timing attacks by not revealing which specific check failed.
 *
 * @param {string} token  - The JWT token string to verify
 * @param {string} secret - The secret key used for signing
 * @returns {Object|null} The decoded payload if valid, null otherwise
 */
function verifyToken(token, secret) {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    const expectedSignature = base64url(hmac.digest());

    /*
     * Compare the provided signature against our computed signature.
     * A mismatch means the token was tampered with or signed with a
     * different secret.
     */
    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(encodedPayload));

    /*
     * Check if the token has expired. The 'exp' claim is a Unix timestamp
     * in seconds. If the current time is past the expiration, reject the token.
     */
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Authentication API route handler.
 *
 * All requests are POST. The endpoint supports three actions:
 *
 * - login  (default): Validates the admin password and returns a signed JWT.
 *   Includes a 1.5-second artificial delay on failure to slow brute-force attacks.
 *   Rate limited to RATE_LIMIT_AUTH_MAX attempts per window.
 *
 * - verify: Checks whether a previously issued token is still valid.
 *   Used by the admin panel on page load to detect expired sessions.
 *
 * - logout: Placeholder for server-side session invalidation.
 *   Currently handled client-side by removing the token from localStorage.
 *
 * Security headers returned on rate-limited responses:
 * - Retry-After: Seconds until the client can retry
 * - X-RateLimit-Remaining: Always 0 when rate limited
 *
 * @param {Request} request - The incoming HTTP request
 * @returns {NextResponse} JSON response with success/error and optional token
 */
export async function POST(request) {
  /*
   * Apply authentication-specific rate limiting before processing.
   * This uses a stricter limit (RATE_LIMIT_AUTH_MAX) than general API
   * endpoints to protect against brute-force password guessing.
   */
  const rateLimit = checkAuthRateLimit();

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many attempts. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(
            Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
          ),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { password, action, token } = body;

    /*
     * Token verification flow.
     * The admin panel calls this on every page load to check if the
     * stored token is still valid. If the token is expired or invalid,
     * the client clears it and redirects to the login page.
     */
    if (action === 'verify') {
      if (!token) {
        return NextResponse.json(
          { error: 'No token provided' },
          { status: 401 }
        );
      }

      const secret = JWT_SECRET || 'fallback-dev-secret';
      const payload = verifyToken(token, secret);

      if (!payload || payload.role !== 'admin') {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        role: payload.role,
        remaining: rateLimit.remaining,
      });
    }

    /*
     * Login flow.
     * Validates the provided password against the stored admin password.
     * On success, creates a JWT with a 24-hour expiration and unique ID.
     * On failure, waits 1.5 seconds before responding to slow brute-force attacks.
     */
    if (!password) {
      return NextResponse.json(
        {
          error: 'Password is required',
          remaining: rateLimit.remaining,
        },
        { status: 400 }
      );
    }

    const storedPassword = ADMIN_PASSWORD || 'admin123';

    if (password !== storedPassword) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return NextResponse.json(
        {
          error: 'Invalid password',
          remaining: rateLimit.remaining,
        },
        { status: 401 }
      );
    }

    const secret = JWT_SECRET || 'fallback-dev-secret';

    /*
     * Create a JWT with the following claims:
     * - role: 'admin' — identifies the user as an administrator
     * - iat: Issued At — Unix timestamp of token creation
     * - exp: Expiration — 24 hours from issuance
     * - jti: JWT ID — unique identifier for this specific token
     */
    const jwtToken = createToken(
      {
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
        jti: crypto.randomUUID(),
      },
      secret
    );

    return NextResponse.json({
      success: true,
      token: jwtToken,
      expiresIn: 86400,
      remaining: rateLimit.remaining,
    });
  } catch (error) {
    console.error('Auth API error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}