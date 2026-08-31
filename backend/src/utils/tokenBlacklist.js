/**
 * In-memory JWT blacklist used to support stateless logout.
 * Tokens are stored by their `jti` claim until they expire.
 * NOTE: for multi-instance deployments swap this with Redis.
 */

const blacklist = new Map();

/**
 * Add a token's jti to the blacklist.
 * @param {string} jti - token id
 * @param {number} expiresInMs - ms until the token naturally expires
 */
export function blacklistToken(jti, expiresInMs) {
  if (!jti) return;
  blacklist.set(jti, Date.now() + expiresInMs);
  scheduleSweep();
}

/**
 * Check whether a jti is blacklisted.
 */
export function isBlacklisted(jti) {
  const expiry = blacklist.get(jti);
  if (expiry === undefined) return false;
  if (expiry <= Date.now()) {
    blacklist.delete(jti);
    return false;
  }
  return true;
}

function scheduleSweep() {
  if (globalThis.__blacklistSweeper) return;
  globalThis.__blacklistSweeper = setTimeout(() => {
    const now = Date.now();
    for (const [jti, expiry] of blacklist.entries()) {
      if (expiry <= now) blacklist.delete(jti);
    }
    globalThis.__blacklistSweeper = null;
  }, 60 * 60 * 1000);
}
