const https = require("https");
const http = require('http');
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

    return new Promise((resolve, reject) => {
      const protocol = robotsURL.startsWith('https:') ? https : http;

      const request = protocol.get(robotsURL, {
        timeout: 10000,
        headers: {
          'User-Agent': 'MyCrawlerBot/1.0'
        }
      }, (response) => {
        let data = '';
        response.setEncoding('utf8'); // ensure chunks are strings

        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          if (response.statusCode === 200) {
            this.cache.set(baseURL, {
              content: data,
              timestamp: Date.now()
            });
            resolve(data);
          } else {
            resolve(''); // not 200 -> treat as missing
          }
        });
      });

      request.on('error', (error) => {
        console.warn(`Failed to download robots.txt from ${baseURL}:`, error.message);
        resolve('');
      });

      request.on('timeout', () => {
        request.destroy();
        console.warn(`Timeout in downloading robots.txt from ${baseURL}`);
        resolve('');
      });
    });
  }
}

module.exports = {
  RobotsHandler
};
