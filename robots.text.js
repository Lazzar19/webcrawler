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
    const result = await handeler.fetchRobotsTxt('malformed-url');
    expect(result).toBe("");
})

test('empty string if there is some network error', async () => {
    fetch.mockResolvedValue(new Error("Network error"));
    const result = await handler.fetchRobotsTxt('https://failed.com');
    expect(result).toBe('');
})


test('return empty string if body of robots.txt is empty', async() => {
    fetch.mockResolvedValue( {status:200, text: async() => ''} );
    const result = await handeler.fetchRobotsTxt('https://empty.com');
    expect(result).toBe("");
})

test('use correct protocol from URL (https)', async () => {
    const mockText = 'User-Agent: *\nDisalled: /';
    fetch.mockResolvedValue({status: 200, text: async() => mockText});

    const result = await handler.fetchRobotsTxt('https://secure-site.com');
    expect(result).toBe(mockText);
})


test('use correct protocol from URL (http)', async () => {
    const mockText = 'User-Agent: *\nDisalled: /';
    fetch.mockResolvedValue({status: 200, text: async() => mockText});

    const result = await handler.fetchRobotsTxt('https://non-secure-site.com');
    expect(result).toBe(mockText);
})

test('no re-fetch if cache is still valid', async () => {
    const cachedContent = 'User-Agent: *\n Disalled: /cached';
    hander.cache.set('https://cachetest.com', {
        content: cachedContent,
        timestamp: Date.now()
    })

    const result = await handler.fetchRobotsTxt('https://cachetest.com');
    expect(result).not.toHaveBeenCalled();
    expect(result).toBe(cachedContent);

})