const { RobotsHandler } = require('./robots.js');
const fetch = require('node-fetch');
jest.mock('node-fetch');


describe('fetchRobotsTxt', () => {
    let handler;

    beforeEach(() => {
        handler = new RobotsHandler();
        fetch.mockReset()
    })

});

test('empty string when robots.txt does not exist, 404 status', async () => {
    fetch.mockResolvedValue( {status: 404, text: async () => ''} );
    const result  = await handler.fetchRobotsTxt('https://nonexist.com');
    expect(result).toBe('')
})


test('return content when it is available', async() => {
    let mockText = `User-Agent: *\nDisallow: /private`
    fetch.mockResolvedValue( {status: 200, text: async() => mockText});
    const result = await handler.fetchRobotsTxt('https://example.com');
    expect(result).toBe(mockText);
})

test('returns cached content within 1 hour', async () => {
    const cached = `Cached robots`;
    handler.cache.set('https://example.com', {
        content: cached,
        timestamp: Date.now()
    })

    const result = await handler.fetchRobotsTxt('https://example.com');
    expect(result).toBe(cached);

})

test('fetch again if cache expired', async () => {
    const old = 'Old cached';
    const fresh = 'Fresh fetched';
    handler.cache.set('https://example.com', {
        content: old,
        timestamp: Date.now() - (2 * 60 * 60 *1000) // 2 hours;
    })

    fetch.mockResolvedValue( {status: 200, text: async () => fresh} );
    const result = await handler.fetchRobotsTxt('https://example.com');
    expect(result).toBe(fresh)

})

test('return empty string if status != 200 (403 example)', async () => {
    fetch.mockResolvedValue( {status: 403, text: async() => 'Forbidden'} );
    const result =  await handler.fetchRobotsTxt("https:/forbidden.com");
    expect(result).toBe('');
})

test('malformed URL input', async () => {
    const result = await handler.fetchRobotsTxt('malformed-url');
    expect(result).toBe("");
})

test('empty string if there is some network error', async () => {
    fetch.mockResolvedValue(new Error("Network error"));
    const result = await handler.fetchRobotsTxt('https://failed.com');
    expect(result).toBe('');
})


test('return empty string if body of robots.txt is empty', async() => {
    fetch.mockResolvedValue( {status:200, text: async() => ''} );
    const result = await handler.fetchRobotsTxt('https://empty.com');
    expect(result).toBe("");
})

test('use correct protocol from URL (https)', async () => {
    const mockText = 'User-Agent: *\nDisallow: /';
    fetch.mockResolvedValue({status: 200, text: async() => mockText});

    const result = await handler.fetchRobotsTxt('https://secure-site.com');
    expect(result).toBe(mockText);
})


test('use correct protocol from URL (http)', async () => {
    const mockText = 'User-Agent: *\nDisallow: /';
    fetch.mockResolvedValue({status: 200, text: async() => mockText});

    const result = await handler.fetchRobotsTxt('https://non-secure-site.com');
    expect(result).toBe(mockText);
})

test('no re-fetch if cache is still valid', async () => {
    const cachedContent = 'User-Agent: *\n Disalled: /cached';
    handler.cache.set('https://cachetest.com', {
        content: cachedContent,
        timestamp: Date.now() 
    })

    const result = await handler.fetchRobotsTxt('https://cachetest.com');
    expect(fetch).not.toHaveBeenCalled();
    expect(result).toBe(cachedContent);

})


test('successfull parsing simple user-agent block', () => {
    let content = `
        User-agent: *
        Disallow: /admin/
        Allow: /pablic/
        Crawl-delay: 10
    
    `;

    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.agents.has('*')).toBe(true);
    const rules = parsed.agents.get('*');
    expect(rules.disallow).toEqual(['/admin']);
    expect(rules.allow).toEqual(['/pablic']);
    expect(rules.crawlDelay).toBe(10);

})

test('successfull parsing more than 1 user-agent block', () => {
    let content = `
        User-agent: googlebot
        Disallow: /private/


        User-agent: bingbot
        Disallow: /secret/
        Crawl-delay: 5
    `

    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.agents.has('googlebot')).toBe(true);
    expect(parsed.agents.has('bingbot')).toBe(true);

    expect(parsed.agents.get('googlebot').disallow).toEqual(['/private']);
    expect(parsed.agents.get('bingbot').disallow).toEqual(['/secret']);
    expect(parsed.agents.get('bingbot').crawlDelay).toBe(5);


})

test("sitemap parsing", () => {
    let content = `
        Sitemap: https://example.com/sitemap.xml
        User-agent: *
        Disallow: /tmp/
    `;

    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.sitemap).toEqual(['https://example.com/sitemap.xml']);
    expect(parsed.agents.get('*').disallow).toEqual(['/tmp']);
})


test('malformed/unknown directives', () => {
    const content = `
        User-agent: *
        Disallow: /admin/
        Allow: /public/
        Foo: invalid
        Crawl-delay: 5
    `;

    const parsed = handler.parseRobotsTxt(content);

    expect(parsed.agents.has('*')).toBe(true);
    expect(parsed.agents.get('*').disallow).toEqual(['/admin']);
    expect(parsed.agents.get('*').allow).toEqual(['/public']);
    expect(parsed.agents.get('*').crawlDelay).toBe(5);
})


test('ignores comments and empty lines in file', () => {
    const content = `
        # some text
        User-agent: *

        Disallow: /admin/
        # other text
        Allow: /public/
    `;

    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.agents.get('*')).toBe(true);

})

test('multiple agents in one block', () => {
    const content = `
        User-agent: googlebot
        User-agent: bingbot
        Disallow: /admin/
    
    `;

    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.agents.get('googlebot').disallow).toEqual(['/admin']);
    expect(parsed.agents.get('bingbot').disallow).toBe(['/admin']);

})

test('fallback to wildcard rules if agents can not be found', () => {
    const content = `
        User-agent: *
        Disallow: /block/
    `;

    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.agents.get('*')).toBe(true);
})


test('crawlDelay is decimal number', () => {
    const content = `
        User-agent: *
        Disallow: /block/
        Crawl-delay: 2.2
    `;

    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.agents.get('*').crawlDelay).toBeCloseTo(2.2);

})

test('disallow field being empty', () => {
    const content = `
        User-agent: *
        Disallow: 
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.agents.get("*").disallow).toEqual(['']);
})


test('directive with extra colons', () => {
    const content = `
        User-agent: *
        Disallow: /path:with:colon/
    `;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.agents.get('*').disallow).toEqual(['/path:with:colon']);
})


test('Case sensitive, format to lowercase', () => {
    const content = `
        User-agent: GoogleBot
        Disallow: /admin/

        User-agent: BingBot
        Disallow: /private/
    
    `;

    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.has('googlebot')).toBe(true);
    expect(parsed.has('bingbot')).toBe(true);
    expect(parsed.has('GoogleBot')).toBe(true);
    expect(parsed.has('BingBot')).toBe(true);

})

test('multiple rules', () => {
    const content = `
        User-agent: multibot
        Disallow: /path1/
        Disallow: /path2/
        Allow: /allowed1/
        Allow: /allowed2/
        Sitemap: https://example.com/sitemap.xml
    `;

    const parsed = handler.parseRobotsTxt(content);
    const rules = parsed.get('multibot')
    expect(rules.disallow).toEqual(['/path1/', '/path2/']);
    expect(rules.allow).toEqual(['/allowed1/', '/allowed2/']);
    expect(rules.sitemap).toEqual(['https://example.com/sitemap.xml']);

})

test('empty robots.txt file', () => {
    const content = ``;
    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.size).toBe(0)
})

test('typical real-life example of parsing robots.txt file', () => {
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
        Crawl-Delay: 2

        Sitemap: https://example.com/sitemap.xml
    `;

    const parsed = handler.parseRobotsTxt(content);
    expect(parsed.size).toBe(3);

    const wildCard = parsed.get('*');
    expect(wildCard.disallow).toEqual(['/admin/', '/private/','/tmp/']);
    expect(wildCard.allow).toEqual(['/public/']);
    expect(wildCard.crawlDelay).toBe(2);
    expect(wildCard.sitemap).toEqual(['https://example.com/sitemap.xml']);


    const googleBotParsed = parsed.get('googlebot');
    expect(googleBotParsed.disallow).toEqual(['/admin/']);
    expect(googleBotParsed.allow).toEqual(['/']);
    expect(googleBotParsed.crawlDelay).toBe(0.5);


    const bingBotParsed = parsed.get('bingbot');
    expect(bingBotParsed.disallow).toEqual(['/admin/']);
    expect(bingBotParsed.allow).toEqual('/search/');
    expect(bingBotParsed.crawlDelay).toBe(2);

})