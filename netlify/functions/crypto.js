// app.js - Main application file
const PORT = 8000;
const express = require('express');
const serverlress = require('serverless-http');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const router = express.Router();
const { scrapeTrendingCoins, scrapeTrendingCategories, scrapeTopGainers, scrapeBTCDominance, scrapeTopLosers, allTimeHighs, scrapeLiveCoinWatchCoinDetailsByNameAndSymbol} = require('../../utils');

// In-memory cache setup
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Generic cache wrapper function
 * @param {string} cacheKey - Unique key for the cache entry
 * @param {Function} scraperFunction - Function to fetch fresh data
 * @param {...any} args - Arguments to pass to the scraper function
 * @returns {Object} Cached or fresh data with cache metadata
 */
const getCachedData = async (cacheKey, scraperFunction, ...args) => {
  const cached = cache.get(cacheKey);
  
  // Check if we have valid cached data
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  // Fetch fresh data
  const freshData = await scraperFunction(...args);
  
  const responseData = {
    status: 'success',
    timestamp: new Date().toISOString(),
    data: freshData
  };

  // Store in cache
  cache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  });

  return responseData;
};

/**
 * Generic error handler with cache fallback
 * @param {string} cacheKey - Cache key to check for fallback data
 * @param {Error} error - The error that occurred
 * @param {Object} res - Express response object
 * @param {string} errorMessage - Custom error message
 */
const handleErrorWithCacheFallback = (cacheKey, error, res, errorMessage) => {
  console.error("Error:", error.message);
  
  // Return cached data if available during errors
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({
      ...cached.data,
      message: "Serving cached data due to fetch error"
    });
  }

  res.status(500).json({
    status: 'error',
    message: errorMessage,
    timestamp: new Date().toISOString(),
    error: error.message
  });
};

router.get('/', (req, res) => {
    res.json('Welcome to the Crypto API.');
});

router.get("/trending-coins", async (req, res) => {
  try {
    const result = await getCachedData('trending-coins', scrapeTrendingCoins);

    if (result.data.length === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: "No trending coins found",
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      ...result,
      count: result.data.length
    });
    
  } catch (error) {
    handleErrorWithCacheFallback('trending-coins', error, res, "Error fetching trending cryptocurrency data");
  }
});

router.get("/trending-categories", async (req, res) => {
  try {
    const result = await getCachedData('trending-categories', scrapeTrendingCategories);

    if (result.data.length === 0) {
      return res.status(404).json({ 
        status: 'error', 
        message: "No trending categories found",
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      ...result,
      count: result.data.length
    });
    
  } catch (error) {
    handleErrorWithCacheFallback('trending-categories', error, res, "Error fetching trending categories data");
  }
});

router.get("/top-gainers", async (req, res) => {
    try {
        const result = await getCachedData('top-gainers', scrapeTopGainers);
    
        if (result.data.length === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: "No top gainers found",
                timestamp: new Date().toISOString()
            });
        }
    
        res.json({
            ...result,
            count: result.data.length
        });
        
    } catch (error) {
        handleErrorWithCacheFallback('top-gainers', error, res, "Error fetching top gainers data");
    }
});

router.get("/top-losers", async (req, res) => {
    try {
        const result = await getCachedData('top-losers', scrapeTopLosers);
    
        if (result.data.length === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: "No top losers found",
                timestamp: new Date().toISOString()
            });
        }
    
        res.json({
            ...result,
            count: result.data.length
        });
        
    } catch (error) {
        handleErrorWithCacheFallback('top-losers', error, res, "Error fetching top losers data");
    }
});

router.get("/all-time-highs", async (req, res) => {
    try {
        const result = await getCachedData('all-time-highs', allTimeHighs);
    
        if (result.data.length === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: "No all-time highs data found",
                timestamp: new Date().toISOString()
            });
        }
    
        res.json({
            ...result,
            count: result.data.length
        });
        
    } catch (error) {
        handleErrorWithCacheFallback('all-time-highs', error, res, "Error fetching all-time highs data");
    }
});

router.get("/btc-dominance", async (req, res) => {
    try {
        const result = await getCachedData('btc-dominance', scrapeBTCDominance);
    
        if (!result.data.btcDominance) {
            return res.status(404).json({ 
                status: 'error', 
                message: "No BTC dominance data found",
                timestamp: new Date().toISOString()
            });
        }
    
        res.json(result);
        
    } catch (error) {
        handleErrorWithCacheFallback('btc-dominance', error, res, "Error fetching BTC dominance data");
    }
});

// Bonus: Cache status endpoint (useful for monitoring)
router.get("/cache-status", (req, res) => {
  const cacheInfo = [];
  
  for (const [key, value] of cache.entries()) {
    const age = Math.floor((Date.now() - value.timestamp) / 1000);
    const remainingTime = Math.max(0, Math.floor(CACHE_DURATION / 1000) - age);
    
    cacheInfo.push({
      key,
      ageSeconds: age,
      remainingSeconds: remainingTime,
      expired: age > (CACHE_DURATION / 1000)
    });
  }
  
  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    cacheDurationSeconds: CACHE_DURATION / 1000,
    totalCacheEntries: cache.size,
    cacheEntries: cacheInfo
  });
});

// Bonus: Clear cache endpoint (useful for testing)
router.delete("/cache", (req, res) => {
  const clearedCount = cache.size;
  cache.clear();
  
  res.json({
    status: 'success',
    message: `Cleared ${clearedCount} cache entries`,
    timestamp: new Date().toISOString()
  });
});

// Cache cleanup function - runs every 10 minutes
const cleanupCache = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 2) { // Clean entries older than 2x cache duration
      cache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cache cleanup: Removed ${cleanedCount} expired entries`);
  }
};

// Set up cache cleanup interval
setInterval(cleanupCache, 10 * 60 * 1000); // Every 10 minutes

app.use('/.netlify/functions/crypto', router); // path must route to lambda

module.exports.handler = serverlress(app);