const { RobotsHandler } = require('./robots.js');


describe('fetchRobotsTxt', () => {
  let handler;

  beforeEach(() => {
    handler = new RobotsHandler();
    global.fetch = jest.fn()
  });

  test('empty string when robots.txt does not exist, 404 status', async () => {
    fetch.mockResolvedValue({ status: 404, text: async () => '' });
    const result = await handler.fetchRobotsTxt('https://nonexist.com');
    expect(result).toBe('');
  });

  test('return content when it is available', async () => {
    let mockText = `User-Agent: *\nDisallow: /private`;
    fetch.mockResolvedValue({ status: 200, text: async () => mockText });
    const result = await handler.fetchRobotsTxt('https://example.com');
    expect(result).toBe(mockText);
  });

  test('returns cached content within 1 hour', async () => {
    const cached = `Cached robots`;
    handler.cache.set('https://example.com', {
      content: cached,
      timestamp: Date.now()
    });
    const result = await handler.fetchRobotsTxt('https://example.com');
    expect(result).toBe(cached);
  });

  test('fetch again if cache expired', async () => {
    const old = 'Old cached';
    const fresh = 'Fresh fetched';
    handler.cache.set('https://example.com', {
      content: old,
      timestamp: Date.now() - (2 * 60 * 60 * 1000)
    });
    fetch.mockResolvedValue({ status: 200, text: async () => fresh });
    const result = await handler.fetchRobotsTxt('https://example.com');
    expect(result).toBe(fresh);
  });

  test('return empty string if status != 200 (403 example)', async () => {
    fetch.mockResolvedValue({ status: 403, text: async () => 'Forbidden' });
    const result = await handler.fetchRobotsTxt('https:/forbidden.com');
    expect(result).toBe('');
  });

  test('malformed URL input', async () => {
    const result = await handler.fetchRobotsTxt('malformed-url');
    expect(result).toBe('');
  });

  test('empty string if there is some network error', async () => {
    fetch.mockRejectedValue(new Error('Network error'));
    const result = await handler.fetchRobotsTxt('https://failed.com');
    expect(result).toBe('');
  });

  test('return empty string if body of robots.txt is empty', async () => {
    fetch.mockResolvedValue({ status: 200, text: async () => '' });
    const result = await handler.fetchRobotsTxt('https://empty.com');
    expect(result).toBe('');
  });

  test('use correct protocol from URL (https)', async () => {
    const mockText = 'User-Agent: *\nDisallow: /';
    fetch.mockResolvedValue({ status: 200, text: async () => mockText });
    const result = await handler.fetchRobotsTxt('https://secure-site.com');
    expect(result).toBe(mockText);
  });

  test('use correct protocol from URL (http)', async () => {
    const mockText = 'User-Agent: *\nDisallow: /';
    fetch.mockResolvedValue({ status: 200, text: async () => mockText });
    const result = await handler.fetchRobotsTxt('http://non-secure-site.com');
    expect(result).toBe(mockText);
  });

  test('no re-fetch if cache is still valid', async () => {
    const cachedContent = 'User-Agent: *\nDisallow: /cached';
    handler.cache.set('https://cachetest.com', {
      content: cachedContent,
      timestamp: Date.now()
    });
    const result = await handler.fetchRobotsTxt('https://cachetest.com');
    expect(result).toBe(cachedContent);
  });
});

describe('parseRobotsTxt', () => {
  let handler;

  beforeEach(() => {
    handler = new RobotsHandler();
  });

  test('successful parsing simple user-agent block', () => {
    const content = `
      User-agent: *
      Disallow: /admin/
      Allow: /public/
      Crawl-delay: 10
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.get('*').disallow).toEqual(['/admin/']);
    expect(parsed.get('*').allow).toEqual(['/public/']);
    expect(parsed.get('*').crawlDelay).toBe(10);
  });

  test('successful parsing multiple user-agent blocks', () => {
    const content = `
      User-agent: googlebot
      Disallow: /private/

      User-agent: bingbot
      Disallow: /secret/
      Crawl-delay: 5
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.get('googlebot').disallow).toEqual(['/private/']);
    expect(parsed.get('bingbot').disallow).toEqual(['/secret/']);
    expect(parsed.get('bingbot').crawlDelay).toBe(5);
  });

  test('sitemap parsing', () => {
    const content = `
      Sitemap: https://example.com/sitemap.xml
      User-agent: *
      Disallow: /tmp/
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.get('*').disallow).toEqual(['/tmp/']);
    // ako dodaš da se sitemap posebno vraća, ovde proveravaš parsed.sitemap
  });

  test('malformed/unknown directives', () => {
    const content = `
      User-agent: *
      Disallow: /admin/
      Allow: /public/
      Foo: invalid
      Crawl-delay: 5
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.get('*').disallow).toEqual(['/admin/']);
    expect(parsed.get('*').allow).toEqual(['/public/']);
    expect(parsed.get('*').crawlDelay).toBe(5);
  });

  test('ignores comments and empty lines in file', () => {
    const content = `
      # some comment
      User-agent: *
      
      Disallow: /admin/
      # another comment
      Allow: /public/
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.has('*')).toBe(true);
  });

  test('multiple agents in one block', () => {
    const content = `
      User-agent: googlebot
      User-agent: bingbot
      Disallow: /admin/
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.get('googlebot').disallow).toEqual(['/admin/']);
    expect(parsed.get('bingbot').disallow).toEqual(['/admin/']);
  });

  test('crawlDelay is decimal number', () => {
    const content = `
      User-agent: *
      Disallow: /block/
      Crawl-delay: 2.2
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.get('*').crawlDelay).toBeCloseTo(2.2);
  });

  test('disallow field being empty', () => {
    const content = `
      User-agent: *
      Disallow:
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.get('*').disallow).toEqual(['']);
  });

  test('directive with extra colons', () => {
    const content = `
      User-agent: *
      Disallow: /path:with:colon/
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.get('*').disallow).toEqual(['/path:with:colon/']);
  });

  test('case-insensitive user-agents', () => {
    const content = `
      User-agent: GoogleBot
      Disallow: /admin/

      User-agent: BingBot
      Disallow: /private/
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.has('googlebot')).toBe(true);
    expect(parsed.has('bingbot')).toBe(true);
  });

  test('multiple rules in a block', () => {
    const content = `
      User-agent: multibot
      Disallow: /path1/
      Disallow: /path2/
      Allow: /allowed1/
      Allow: /allowed2/
    `;
    const parsed = handler.parseRobotsTxt(content);
    const rules = parsed.get('multibot');
    expect(rules.disallow).toEqual(['/path1/', '/path2/']);
    expect(rules.allow).toEqual(['/allowed1/', '/allowed2/']);
  });

  test('empty robots.txt returns empty map', () => {
    const parsed = handler.parseRobotsTxt('');
    expect(parsed.size).toBe(0);
  });

  test('real-world style robots.txt', () => {
    const content = `
      User-agent: *
      Disallow: /admin/
      Disallow: /private/
      Disallow: /tmp/
      Allow: /public/
      Crawl-delay: 2

      User-agent: Googlebot
      Disallow: /admin/
      Allow: /
      Crawl-delay: 0.5

      User-agent: BingBot
      Disallow: /admin/
      Disallow: /search/
      Crawl-delay: 2
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.get('*').disallow).toEqual(['/admin/', '/private/', '/tmp/']);
    expect(parsed.get('*').allow).toEqual(['/public/']);
    expect(parsed.get('*').crawlDelay).toBe(2);
    expect(parsed.get('googlebot').allow).toEqual(['/']);
    expect(parsed.get('googlebot').crawlDelay).toBe(0.5);
    expect(parsed.get('bingbot').disallow).toEqual(['/admin/', '/search/']);
  });
});
