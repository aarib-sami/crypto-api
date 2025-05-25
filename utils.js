const axios = require('axios');
const cheerio = require('cheerio');


/**
 * Scrape trending cryptocurrencies from Coinranking
 * @returns {Promise<Array>} Array of trending cryptocurrency objects
 */
const scrapeTrendingCoins = async () => {
  const url = "https://coinranking.com/";
  
  const response = await axios.get(url, { 
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    }
  });
  
  const html = response.data;
  const $ = cheerio.load(html);
  
  // Array to store our results
  const trendingCoins = [];
  
  // Target each row in the trending coins table
  $("#trending-coins-table tbody tr").each((index, element) => {
    // Extract coin name
    const name = $(element).find(".coin-profile__name").text().trim();
    
    // Extract coin symbol
    const symbol = $(element).find(".coin-profile__symbol").text().trim();
    
    // Extract price
    const priceText = $(element).find("real-time-price").text().trim();
    
    // Remove whitespace and non-numeric characters, then parse as float
    const price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
    
    // Extract market cap - convert to number
    const marketCapText = $(element)
      .find(".hidden-tablet-landscape")
      .text()
      .trim();
    
    // Parse the market cap value using a custom function
    const marketCap = marketCapTextToNum(marketCapText);

    // Format the market cap from number to string
    const marketCapFormatted = marketCapNumToText(marketCap);
    
    // Extract 24h change - correctly handling the sign
    const changePercentageText = $(element)
      .find(".change__percentage")
      .text()
      .trim();
    
    // Parse the percentage value directly from the text (which includes the sign)
    // First, remove all non-numeric characters except for the decimal point and minus sign
    const changePercentage = parseFloat(changePercentageText.replace(/[^0-9.-]/g, ''));
        
    // Format the change percentage for display
    const formatted24hChange = changePercentage >= 0 ? `+${changePercentage.toFixed(2)}%` : `${changePercentage.toFixed(2)}%`;

    // Fix URL Construction
    const coinUrl = "https://coinranking.com" + $(element).find(".coin-profile").attr("href");

    // Extract image URL
    const imageUrl = $(element).find(".coin-profile__logo").attr("src");
    
    // Add to our results array
    trendingCoins.push({
      name,
      symbol,
      price,
      priceFormatted: `$${price}`,
      marketCap,
      marketCapFormatted,
      change24h: changePercentage,
      change24hFormatted: formatted24hChange,
      trending: true,
    });
  });
  
  return trendingCoins;
};

/**
 * Scrape trending categories from Coinranking
 * @returns {Promise<Array>} Array of trending category objects
 */
const scrapeTrendingCategories = async () => {
  const url = "https://coinranking.com/";
  
  const response = await axios.get(url, { 
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    }
  });
  
  const html = response.data;
  const $ = cheerio.load(html);
  
  // Array to store our results
  const trendingCategories = [];
  
  // Target each category item
  $(".trending-categories__item").each((index, element) => {
    // Extract category name
    const name = $(element).find(".category-profile__name").text().trim();
    
    // Extract market cap text
    const marketCapElement = $(element).find(".category-profile__symbol span:first-child").text().trim();
    
    // Format market cap text to number
    const marketCap = marketCapTextToNum(marketCapElement);

    // Format market cap from number to string
    const marketCapFormatted = marketCapNumToText(marketCap);
    
    // Extract change percentage
    const changePercentageText = $(element)
      .find(".change__percentage")
      .text()
      .trim();
    
    // Parse the percentage value
    const cleanedPercentage = changePercentageText.replace(/[^0-9.-]/g, '');
    const changePercentage = parseFloat(cleanedPercentage);
    
    // Determine if positive based on class
    const isPositive = $(element).find(".change__percentage").hasClass("change--positive");
    
    // Extract URL from href attribute
    const categoryUrl = $(element).attr("href");
    const fullUrl = categoryUrl.startsWith("http") ? categoryUrl : "https://coinranking.com" + categoryUrl;
    
    // Extract image URL
    const imageUrl = $(element).find(".category-profile__logo").attr("src");
    
    trendingCategories.push({
      name,
      marketCap,
      marketCapFormatted,
      change24h: changePercentage,
      change24hFormatted: `${isPositive ? '+' : ''}${changePercentage.toFixed(2)}%`,
    });
  });
  
  return trendingCategories;
};

/**
 * Scrape top gainers from Coinranking
 * @returns {Promise<Array>} Array of top gainers objects
 */
const scrapeTopGainers = async () => {
    // URL to scrape
    const url = "https://coinranking.com/coins/gainers"

    // Fetch the HTML content using axios
    const response = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
        });
    
    // Load the HTML into cheerio
    const html = response.data;
    const $ = cheerio.load(html);

    const topGainers = [];
    let gainerNum = 0;

    // Target each row in the top losers table
    $("#coins-table tbody tr").each((index, element) => {
        // Skip sponsored rows
        if ($(element).hasClass('table__sponsored-row')) {
            return true; 
        }
        
        // Get coin name
        const name = $(element).find('.coin-profile__name').text().trim();
        
        // Get coin symbol
        const symbol = $(element).find('.coin-profile__symbol').text().trim();
        
        // Get price
        let price = $(element).find('real-time-price').text().trim();
        // Remove whitespace and non-numeric characters, then parse as float
        price = parseFloat(price.replace(/[^\d.-]/g, ''));

        const priceFormatted = `$${price}`;

        // Get market cap text
        let marketCapText = $(element).find('.hidden-tablet-landscape').text().trim();
        let marketCap = marketCapTextToNum(marketCapText);
        marketCapText = marketCapNumToText(marketCap);

        // Get the 24h change text
        const changePercentageText = $(element).find('.change__percentage').text().trim();
        // Get the raw change percentage value
        const changePercentage = parseFloat(changePercentageText.replace(/[^0-9.-]/g, ''));

        // Get the URL
        const url = "https://coinranking.com" + $(element).find('.coin-profile').attr('href');

        // Get the image URL
        const imageUrl = $(element).find('.coin-profile__logo').attr('src');

        gainerNum++;

        topGainers.push({
            name,
            symbol,
            price,
            priceFormatted,
            marketCap,
            marketCapFormatted: marketCapText,
            change24h: changePercentage,
            change24hFormatted: changePercentageText,
        });

        if (gainerNum >= 10) {
            return false; // Stop after 10 gainers
        }
    });
    return topGainers;
};

/**
 * Scrape top losers
 * @returns {Promise<Array>} Array of top losers objects
 */
const scrapeTopLosers = async () => {
    // URL to scrape
    const url = "https://coinranking.com/coins/losers"

    // Fetch the HTML content using axios
    const response = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
        });
    
    // Load the HTML into cheerio
    const html = response.data;
    const $ = cheerio.load(html);

    const topLosers = [];
    let loserNum = 0;

    // Target each row in the top losers table
    $("#coins-table tbody tr").each((index, element) => {
        // Skip sponsored rows
        if ($(element).hasClass('table__sponsored-row')) {
            return true; 
        }
        
        // Get coin name
        const name = $(element).find('.coin-profile__name').text().trim();
        
        // Get coin symbol
        const symbol = $(element).find('.coin-profile__symbol').text().trim();
        
        // Get price
        let price = $(element).find('real-time-price').text().trim();
        // Remove whitespace and non-numeric characters, then parse as float
        price = parseFloat(price.replace(/[^\d.-]/g, ''));

        const priceFormatted = `$${price}`;

        // Get market cap text
        let marketCapText = $(element).find('.hidden-tablet-landscape').text().trim();
        let marketCap = marketCapTextToNum(marketCapText);
        marketCapText = marketCapNumToText(marketCap);

        // Get the 24h change text
        const changePercentageText = $(element).find('.change__percentage').text().trim();
        // Get the raw change percentage value
        const changePercentage = parseFloat(changePercentageText.replace(/[^0-9.-]/g, ''));

        // Get the URL
        const url = "https://coinranking.com" + $(element).find('.coin-profile').attr('href');

        // Get the image URL
        const imageUrl = $(element).find('.coin-profile__logo').attr('src');

        loserNum++;

        topLosers.push({
            name,
            symbol,
            price,
            priceFormatted,
            marketCap,
            marketCapFormatted: marketCapText,
            change24h: changePercentage,
            change24hFormatted: changePercentageText,
        });

        if (loserNum >= 10) {
            return false; // Stop after 10 losers
        }
    });
    return topLosers;
};


const allTimeHighs = async () => {
    // URL to scrape
    const url = "https://coinranking.com/coins/all-time-highs"

    // Fetch the HTML content using axios
    const response = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
        });
    
    // Load the HTML into cheerio
    const html = response.data;
    const $ = cheerio.load(html);

    const allTimeHighs = [];
    let highNum = 0;

    // Target each row in the top losers table
    $("#all-time-highs-table tbody tr").each((index, element) => {
        // Skip sponsored rows
        if ($(element).hasClass('table__sponsored-row')) {
            return true; 
        }
        
        // Get coin name
        const name = $(element).find('.coin-profile__name').text().trim();
        
        // Get coin symbol
        const symbol = $(element).find('.coin-profile__symbol').text().trim();
        
        // Get price
        let price = $(element).find('real-time-price').text().trim();
        // Remove whitespace and non-numeric characters, then parse as float
        price = parseFloat(price.replace(/[^\d.-]/g, ''));

        const priceFormatted = `$${price}`;

        // Get market cap text
        let marketCapText = $(element).find('.hidden-tablet-landscape').text().trim();
        let marketCap = marketCapTextToNum(marketCapText);
        marketCapText = marketCapNumToText(marketCap);

        // Get the 24h change text
        const changePercentageText = $(element).find('.change').text().trim();
        // Get the raw change percentage value
        const changePercentage = parseFloat(changePercentageText.replace(/[^0-9.-]/g, ''));

        // Get the all-time high value
        const allTimeHighText = $(element).find('.semibold').text().trim();
        const allTimeHigh = parseFloat(allTimeHighText.replace(/[^0-9.-]/g, ''));
        const allTimeHighFormatted = `$${allTimeHigh.toFixed(2)}`;

        // Get the URL
        const url = "https://coinranking.com" + $(element).find('.coin-profile').attr('href');

        // Get the image URL
        const imageUrl = $(element).find('.coin-profile__logo').attr('src');

        highNum++;

        allTimeHighs.push({
            name,
            symbol,
            price,
            priceFormatted,
            allTimeHigh,
            allTimeHighFormatted,
            change24h: changePercentage,
            change24hFormatted: changePercentageText,
        });

        if (highNum >= 10) {
            return false; // Stop after 10
        }
    });
    return allTimeHighs;
};


/**
 * Scrapes the BTC dominance
 * @returns Value of BTC dominance
 */
const scrapeBTCDominance = async () => {
    // URL to scrape
    const url = "https://coinranking.com/";
        
    // Fetch the HTML content using axios
    const response = await axios.get(url, { 
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      }
    });
    
    // Load the HTML into cheerio
    const html = response.data;
    
    // Parse the HTML using cheerio
    const $ = cheerio.load(html);
    
    // Default value in case we don't find it
    let btcDominanceValue = null;
    
    // Find the row containing BTC dominance by checking the th text content
    $("#stats .key-value-table tbody tr").each((index, element) => {
      const rowTitle = $(element).find("th").text().trim();
      if (rowTitle.includes("BTC dominance")) {
        const btcDominanceText = $(element).find(".key-value-table-auto-nav").text().trim();
        btcDominanceValue = parseFloat(btcDominanceText.replace(/[^0-9.-]/g, ''));
        // No need to continue the loop once we found what we're looking for
        return false;
      }
    });
        
    return {
      btcDominance: btcDominanceValue,
      btcDominanceFormatted: `${btcDominanceValue.toFixed(2)}%`,
    };
  };

/**
 * Formats market cap or large number values to user-friendly strings
 * @param {number} value - The value to format
 * @returns {string} Formatted string with appropriate units
 */
const marketCapNumToText = (value) => {
    if (value >= 1000000000000) {
      return `$${(value / 1000000000000).toFixed(2)} trillion`;
    } else if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)} billion`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)} million`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };  

/**
 * Converts market cap text to a numeric value
 * @param {string} marketCapText - The market cap text to convert
 * @returns {number} Numeric value of the market cap
 */
const marketCapTextToNum = (marketCapText) => {
    if (marketCapText.includes('trillion') || marketCapText.includes('T')) {
        return parseFloat(marketCapText.replace(/[^\d.-]/g, '')) * 1000000000000;
      } else if (marketCapText.includes('million') || marketCapText.includes('M')) {
        return parseFloat(marketCapText.replace(/[^\d.-]/g, '')) * 1000000;
      } else if (marketCapText.includes('billion') || marketCapText.includes('B')) {
        return parseFloat(marketCapText.replace(/[^\d.-]/g, '')) * 1000000000;
      } else {
        return parseFloat(marketCapText.replace(/[^\d.-]/g, ''));
      }
}

/**
 * Scrape detailed cryptocurrency information from LiveCoinWatch using name and symbol
 * @param {string} coinName - The name of the cryptocurrency (e.g., "Bitcoin")
 * @param {string} coinSymbol - The symbol of the cryptocurrency (e.g., "BTC")
 * @returns {Promise<Object>} Detailed cryptocurrency data
 */
const scrapeLiveCoinWatchCoinDetailsByNameAndSymbol = async (coinName, coinSymbol) => {
    try {
      // Format the name and symbol
      // Make first letter of each word uppercase
      let formattedName = coinName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
        
      formattedName = formattedName.slice(1);
      
      // Make symbol uppercase
      let formattedSymbol = coinSymbol.toUpperCase();
      formattedSymbol = formattedSymbol.slice(1);

      // LiveCoinWatch URL format
      const url = `https://www.livecoinwatch.com/price/${formattedName}-${formattedSymbol}`;
      
      console.log('URL:', url);

      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Extract basic information
      const name = $(".coin-name").text().trim();
      const symbol = $(".price-container .rate").text().trim();
      
      // Extract price
      const priceText = $(".cion-item.coin-price-large .price").text().trim();
      const price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
      
      // Extract market cap
      let marketCap = null;
      let marketCapFormatted = null;
      $(".cion-item").each((index, element) => {
        const label = $(element).find("label").text().trim().toLowerCase();
        if (label === "market cap") {
          marketCapFormatted = $(element).find("span.price").text().trim();
          marketCap = marketCapTextToNum(marketCapFormatted);
        }
      });
      
      // Extract volume
      let volume24h = null;
      let volume24hFormatted = null;
      $(".cion-item").each((index, element) => {
        const label = $(element).find("label").text().trim().toLowerCase();
        if (label === "volume") {
          volume24hFormatted = $(element).find("span.price").text().trim();
          volume24h = marketCapTextToNum(volume24hFormatted);
        }
      });
      
      // Extract all-time high
      let ath = null;
      let athFormatted = null;
      $(".cion-item").each((index, element) => {
        const label = $(element).find("label").text().trim().toLowerCase();
        if (label === "all time high") {
          athFormatted = $(element).find("span").text().trim();
          ath = parseFloat(athFormatted.replace(/[^\d.-]/g, ''));
        }
      });
      
      // Extract price changes
      const priceChanges = {
        "1h": null,
        "24h": null,
        "7d": null,
        "30d": null,
        "90d": null,
        "1y": null
      };
      
      $(".cion-item").each((index, element) => {
        const label = $(element).find("label").text().trim().toLowerCase();
        if (label === "1h usd") {
          const changeText = $(element).find("span.percent").first().text().trim();
          priceChanges["1h"] = parseFloat(changeText.replace(/[^0-9.-]/g, ''));
        } else if (label === "24h usd") {
          const changeText = $(element).find("span.percent").first().text().trim();
          priceChanges["24h"] = parseFloat(changeText.replace(/[^0-9.-]/g, ''));
        } else if (label === "7d usd") {
          const changeText = $(element).find("span.percent").first().text().trim();
          priceChanges["7d"] = parseFloat(changeText.replace(/[^0-9.-]/g, ''));
        } else if (label === "30d usd") {
          const changeText = $(element).find("span.percent").first().text().trim();
          priceChanges["30d"] = parseFloat(changeText.replace(/[^0-9.-]/g, ''));
        } else if (label === "90d usd") {
          const changeText = $(element).find("span.percent").first().text().trim();
          priceChanges["90d"] = parseFloat(changeText.replace(/[^0-9.-]/g, ''));
        } else if (label === "1y usd") {
          const changeText = $(element).find("span.percent").first().text().trim();
          priceChanges["1y"] = parseFloat(changeText.replace(/[^0-9.-]/g, ''));
        }
      });
      
      // Extract supply information
      let circulatingSupply = null;
      let circulatingSupplyFormatted = null;
      let totalSupply = null;
      let totalSupplyFormatted = null;
      let maxSupply = null;
      let maxSupplyFormatted = null;
      
      $(".cion-item").each((index, element) => {
        const label = $(element).find("label").text().trim().toLowerCase();
        if (label === "circ. supply") {
          circulatingSupplyFormatted = $(element).find("span.price").text().trim();
          circulatingSupply = parseFloat(circulatingSupplyFormatted.replace(/[^\d.-]/g, ''));
          // Check if supply has M, B, etc. and convert accordingly
          if (circulatingSupplyFormatted.includes('M')) {
            circulatingSupply *= 1000000;
          } else if (circulatingSupplyFormatted.includes('B')) {
            circulatingSupply *= 1000000000;
          }
        } else if (label === "total supply") {
          totalSupplyFormatted = $(element).find("span.price").text().trim();
          totalSupply = parseFloat(totalSupplyFormatted.replace(/[^\d.-]/g, ''));
          // Check if supply has M, B, etc. and convert accordingly
          if (totalSupplyFormatted.includes('M')) {
            totalSupply *= 1000000;
          } else if (totalSupplyFormatted.includes('B')) {
            totalSupply *= 1000000000;
          }
        } else if (label === "max supply") {
          maxSupplyFormatted = $(element).find("span.price").text().trim();
          maxSupply = parseFloat(maxSupplyFormatted.replace(/[^\d.-]/g, ''));
          // Check if supply has M, B, etc. and convert accordingly
          if (maxSupplyFormatted.includes('M')) {
            maxSupply *= 1000000;
          } else if (maxSupplyFormatted.includes('B')) {
            maxSupply *= 1000000000;
          }
        }
      });
      
      // Extract 24h trading range
      let range24h = null;
      let low24h = null;
      let high24h = null;
      
      $(".cion-item").each((index, element) => {
        const label = $(element).find("label").text().trim().toLowerCase();
        if (label === "24 hr range") {
          const rangeText = $(element).find("span").text().trim();
          range24h = parseFloat(rangeText.replace(/[^0-9.-]/g, ''));
        } else if (label === "24 hr low") {
          const lowText = $(element).find("span").text().trim();
          low24h = parseFloat(lowText.replace(/[^\d.-]/g, ''));
        } else if (label === "24 hr high") {
          const highText = $(element).find("span").text().trim();
          high24h = parseFloat(highText.replace(/[^\d.-]/g, ''));
        }
      });
      
      // Construct final result
      return {
        name,
        symbol,
        price,
        priceFormatted: priceText,
        marketCap,
        marketCapFormatted,
        volume24h,
        volume24hFormatted,
        allTimeHigh: ath,
        allTimeHighFormatted: athFormatted,
        priceChanges,
        supply: {
          circulating: circulatingSupply,
          circulatingFormatted: circulatingSupplyFormatted,
          total: totalSupply,
          totalFormatted: totalSupplyFormatted,
          max: maxSupply,
          maxFormatted: maxSupplyFormatted
        },
        trading24h: {
          range: range24h,
          low: low24h,
          high: high24h
        },
      };
    } catch (error) {
      console.error(`Error scraping LiveCoinWatch details for ${coinName} (${coinSymbol}):`, error.message);
      throw error;
    }
  };

  module.exports = {
    marketCapNumToText,
    marketCapTextToNum,
    scrapeTrendingCoins,
    scrapeTrendingCategories,
    scrapeTopGainers,
    scrapeTopLosers,
    allTimeHighs,
    scrapeBTCDominance,
    scrapeLiveCoinWatchCoinDetailsByNameAndSymbol,
  };
  