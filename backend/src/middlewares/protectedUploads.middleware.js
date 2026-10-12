import path from 'path';
import { authenticate } from './auth.middleware.js';

// Public whitelist prefixes if any static assets need to be publicly served
const PUBLIC_WHITELIST = ['/public', '/images/public'];

/**
 * protectedUploads middleware
 * Restricts static file access to authenticated users only.
 * CWE-200 / CWE-284: Prevents Broken Access Control and Sensitive Information Disclosure
 * by ensuring confidential reports, registers, and study materials cannot be accessed anonymously.
 */
export const protectedUploads = (req, res, next) => {
  // Normalize path and neutralize directory traversal
  const safePath = path.normalize(req.path).replace(/\\/g, '/').replace(/^(\.\.[\/])+/g, '');

  // Check if requested path is explicitly public
  const isPublic = PUBLIC_WHITELIST.some((prefix) => safePath.startsWith(prefix));
  if (isPublic) {
    return next();
  }

  // Support token from query param (for direct browser tab downloads / links: ?token=... or ?auth=...)
  if (!req.headers.authorization && req.query) {
    const queryToken = req.query.token || req.query.auth || req.query.t;
    if (queryToken && typeof queryToken === 'string') {
      req.headers.authorization = `Bearer ${queryToken}`;
    }
  }

  // Execute authentication check
  authenticate(req, res, (err) => {
    if (err) return next(err);

    // Apply strict cache-control and security headers to prevent caching sensitive downloads
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    next();
  });
};
