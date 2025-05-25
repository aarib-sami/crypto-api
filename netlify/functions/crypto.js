// app.js - Main application file
const PORT = 8000;
const express = require('express');
const serverless = require('serverless-http'); // Fixed typo
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

router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-RapidAPI-Key, X-RapidAPI-Host');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// V1 API Routes
router.get('/v1/', (req, res) => {
    res.json('Welcome to the Crypto API v1.');
});

router.get("/v1/trending-coins", async (req, res) => {
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

router.get("/v1/trending-categories", async (req, res) => {
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

router.get("/v1/top-gainers", async (req, res) => {
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

router.get("/v1/top-losers", async (req, res) => {
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

router.get("/v1/all-time-highs", async (req, res) => {
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

router.get("/v1/btc-dominance", async (req, res) => {
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

module.exports.handler = serverless(app);