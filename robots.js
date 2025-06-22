
const { timeStamp } = require("console");
const { URL } = require("url");

class RobotsHandler {
  constructor() {
    this.cache = new Map();
  }

  /**
   * @param {string} siteURL - baseURL of the site
   * @returns {Promise<string>} - robots.txt
   */
  async fetchRobotsTxt(siteURL) {
    const baseURL = new URL(siteURL).origin; // e.g., https://example.com
    const robotsURL = `${baseURL}/robots.txt`;

    // Check cache
    if (this.cache.has(baseURL)) {
      const cached = this.cache.get(baseURL);
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - cached.timestamp < oneHour) {
        return cached.content;
      }
    }

    try {

        const controller = new AbortController();
        const timeout = setTimeout( () => controller.abort(), 10000);
        

        const response = await fetch(robotsURL, {
          method: 'GET',
          headers: {'User-Agent': "MyCrawlerBot/1.0"},
          signal: controller.signal,
        });

        clearTimeout();

        if(response.status === 200) {
          const data = response.text();
          this.cache.set(robotsURL, {
            content:data,
            timestamp: Date.now()
          });
          return data;
        } else {
          return ''; // no robots.txt file
        }

    } catch (error){ 
        console.warn(`Failed to fetch robots.txt from ${baseURL}`,error.message);
        return '';
    }
  }
}





module.exports = {
  RobotsHandler
};
