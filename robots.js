
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


  /**
   * @param {string} robotsContent - robots.txt body
   * @returns {Map<string, Object>} - user-agent map
   */
  parseRobotsTxt = (robotsContent) => {
    const lines = robotsContent.split('\n');
    const agentRules = new Map();

    let currentUserAgents = [];
    let currentRules = {
      disallow: [],
      allow: [],
      crawlDelay: null,
      sitemap: []
    };

    for (let line of lines) {
      line = line.trim();

      if (!line || line.startsWith('#')) continue;

      const [rawKey, ...rest] = line.split(':');
      if (!rawKey || rest.length === 0) continue;

      const key = rawKey.trim().toLowerCase();
      const value = rest.join(':').trim();

      switch (key) {
        case 'user-agent':
          if (currentUserAgents.length) {
            currentUserAgents.forEach(agent => {
              if (!agentRules.has(agent)) {
                agentRules.set(agent, { ...currentRules });
              } else {
                const existing = agentRules.get(agent);
                existing.disallow.push(...currentRules.disallow);
                existing.allow.push(...currentRules.allow);
                if (currentRules.crawlDelay !== null) existing.crawlDelay = currentRules.crawlDelay;
                if (currentRules.sitemap.length) existing.sitemap.push(...currentRules.sitemap);
              }
            });
          }

          currentUserAgents = [value.toLowerCase()];
          currentRules = {
            disallow: [],
            allow: [],
            crawlDelay: null,
            sitemap: []
          };
          break;

        case 'disallow':
          currentRules.disallow.push(value);
          break;

        case 'allow':
          currentRules.allow.push(value);
          break;

        case 'crawl-delay':
          currentRules.crawlDelay = parseFloat(value);
          break;

        case 'sitemap':
          currentRules.sitemap.push(value);
          break;

        default:
          break;
      }
    }

    if (currentUserAgents.length) {
      currentUserAgents.forEach(agent => {
        if (!agentRules.has(agent)) {
          agentRules.set(agent, { ...currentRules });
        } else {
          const existing = agentRules.get(agent);
          existing.disallow.push(...currentRules.disallow);
          existing.allow.push(...currentRules.allow);
          if (currentRules.crawlDelay !== null) existing.crawlDelay = currentRules.crawlDelay;
          if (currentRules.sitemap.length) existing.sitemap.push(...currentRules.sitemap);
        }
      });
    }

    return agentRules;
  }
}











module.exports = {
  RobotsHandler
};
