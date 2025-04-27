const express = require('express')
const serverless = require('serverless-http')
const axios = require('axios')
const cheerio = require('cheerio')
const app = express()
const router = express.Router();

const { getLastFridayOrNonHolidayDate, dateToUnixTimestampPlusADay, dateToUnixTimestamp, formatDateToMatchApiArgument } = require('./helpers.js');

router.get('/', (req, res) => {
    res.json('Welcome to the Parcel Tracker API')
})

router.get('/track/canadapost/:trackingNumber', async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      
      // Make a request to Canada Post's tracking page
      const url = `https://www.canadapost-postescanada.ca/track-reperage/en#/details/${trackingNumber}`;
      const response = await axios.get(url);
      const html = response.data;
      
      // Load the HTML with cheerio
      const $ = cheerio.load(html);
      
      // Extract core tracking data
      const status = $('.ed_summary .edd-text-size').text().trim() || null;
      const deliveryDateText = $('.ed_summary .edd-sub-text').text().trim();
      const estimatedDelivery = deliveryDateText ? deliveryDateText.replace(/\s+at\s+.*$/, '') : null;
      
      // Get last updated time - this is optional
      const lastUpdated = $('.update_date i').text().replace('Updated:', '').trim() || null;
      
      // Extract tracking history - this is essential
      const history = [];
      
      $('table#trackprogresstable tbody tr').each((index, element) => {
        const row = $(element);
        
        const date = row.find('td:nth-child(1)').text().trim();
        const time = row.find('td:nth-child(2)').text().trim();
        const activity = row.find('td:nth-child(3) div:first-child').text().trim();
        const locationText = row.find('td:nth-child(3) div:nth-child(2)').text().trim();
        
        if (date || activity) {
          history.push({
            date: date || null,
            time: time || null,
            location: locationText || null,
            activity: activity || null
          });
        }
      });
      
      // Last location is typically the most recent entry in history
      const lastLocation = history.length > 0 ? history[0].location : null;
      
      // Prepare the minimal consistent response
      const result = {
        success: true,
        courier: 'Canada Post',
        trackingNumber,
        data: {
          status,
          estimatedDelivery,
          lastUpdated,
          lastLocation,
          history
        },
        error: null
      };
      
      res.json(result);
      
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        courier: 'Canada Post',
        trackingNumber: req.params.trackingNumber,
        data: null,
        error: error.message
      });
    }
  });

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  

app.use('/.netlify/functions/stockinformation', router)



module.exports.handler=serverless(app)

//remove commented code from below for local testing
//module.exports = router;

