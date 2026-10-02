// middleware/cacheMiddleware.js

// In-memory cache store: Key -> { data, status, createdAt }
const cache = new Map();

// Default Time-To-Live: 1 minute (60,000 milliseconds)
const DEFAULT_TTL_MS = 60 * 1000;

let getCurrentTime = () => Date.now();

/**
 * Allows overriding time provider function (useful for automated testing)
 */
function setTimeProvider(fn) {
  getCurrentTime = fn || (() => Date.now());
}

/**
 * Clears all entries from the cache.
 */
function clearCache() {
  cache.clear();
}

/**
 * Returns current size of the cache.
 */
function getCacheSize() {
  return cache.size;
}

/**
 * Express middleware to handle caching for GET endpoints.
 * @param {number} ttlMs Time to live in milliseconds (default: 60,000 ms / 1 minute)
 */
function cacheMiddleware(ttlMs = DEFAULT_TTL_MS) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = req.originalUrl || req.url;
    const cachedEntry = cache.get(cacheKey);
    const now = getCurrentTime();

    if (cachedEntry) {
      const age = now - cachedEntry.createdAt;
      if (age <= ttlMs) {
        // Cache HIT: valid within 1 minute TTL
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Status', 'HIT');
        return res.status(cachedEntry.status).json(cachedEntry.data);
      } else {
        // Cache EXPIRED: purge stale entry
        cache.delete(cacheKey);
      }
    }

    // Cache MISS: entry is missing or expired
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Cache-Status', 'MISS');

    // Intercept response json method to cache fresh data on successful 2xx response
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          data: body,
          status: res.statusCode,
          createdAt: getCurrentTime()
        });
      }
      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Middleware to invalidate cache upon successful data mutation (POST, PUT, PATCH, DELETE).
 */
function invalidateCacheMiddleware(req, res, next) {
  const originalJson = res.json;
  const originalSend = res.send;

  const performInvalidation = () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      clearCache();
    }
  };

  res.json = function (body) {
    performInvalidation();
    return originalJson.call(this, body);
  };

  res.send = function (body) {
    performInvalidation();
    return originalSend.call(this, body);
  };

  next();
}

module.exports = {
  cacheMiddleware: cacheMiddleware(),
  createCacheMiddleware: cacheMiddleware,
  invalidateCacheMiddleware,
  clearCache,
  getCacheSize,
  setTimeProvider
};
