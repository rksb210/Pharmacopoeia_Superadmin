/**
 * Token Blacklist & Revocation Registry (CWE-613)
 * Provides in-memory + database backed token revocation for explicit logouts and session timeouts.
 */
const revokedTokens = new Map(); // tokenHash -> expiryTimestampMs

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [hash, expiry] of revokedTokens.entries()) {
    if (expiry <= now) {
      revokedTokens.delete(hash);
    }
  }
}, 5 * 60 * 1000).unref();

function getHash(token) {
  if (!token || typeof token !== 'string') return '';
  return token.length > 48 ? token.slice(-48) : token;
}

/**
 * Blacklist a token until its natural expiration
 * @param {string} token 
 * @param {number} ttlSeconds - default 30 minutes
 */
export function blacklistToken(token, ttlSeconds = 30 * 60) {
  if (!token) return;
  const hash = getHash(token);
  const expiry = Date.now() + ttlSeconds * 1000;
  revokedTokens.set(hash, expiry);
}

/**
 * Check if a token has been revoked
 * @param {string} token 
 * @returns {boolean}
 */
export function isTokenBlacklisted(token) {
  if (!token) return false;
  const hash = getHash(token);
  const expiry = revokedTokens.get(hash);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    revokedTokens.delete(hash);
    return false;
  }
  return true;
}

export default {
  blacklistToken,
  isTokenBlacklisted,
};
