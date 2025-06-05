const { normalize } = require('path');
const {normalizeURL,getURLs} = require('./crawl.js');
const {test,expect} = require("@jest/globals");

test('normalizeURL strip protocol https', () => {
    const input = 'https://blog.boot.dev/path';
    const actual = normalizeURL(input);
    const expected = 'blog.boot.dev/path';
    expect(actual).toEqual(expected);
})


test('normalizeURL strip trailing slash',() => {
    const input = 'https://blog.boot.dev/path/'; // dodata /
    const actual = normalizeURL(input);
    const expected = 'blog.boot.dev/path';
    expect(actual).toEqual(expected)
})

test('normalizeURL capitals', () => {
    const input = 'https://BLOG.boot.dev/path';
    const actual = normalizeURL(input);
    const expected = 'blog.boot.dev/path';
    expect(actual).toEqual(expected);
})


test('normalizeURL http', () => {
    const input = 'http://blog.boot.dev/path';
    const actual = normalizeURL(input);
    const expected = 'blog.boot.dev/path';
    expect(actual).toEqual(expected);
})


test('getURLsfromHTML absolute urls', () => {
    const inputBody = `
    <html>
        <body>
            <a href="https://blog.boot.dev/path/"
                Boot.dev BLOG
            </a>
        </body>
    </html>
    `
    const inputURL = 'https://blog.boot.dev/path/';
    const actual = getURLs(inputBody,inputURL);
    const expected = ['https://blog.boot.dev/path/'];
    expect(actual).toEqual(expected);
    
})


test('getURLsfromHTML relative urls', () => {
    const inputBody = `
    <html>
        <body>
            <a href="/path/"
                Boot.dev BLOG
            </a>
        </body>
    </html>
    `
    const inputURL = 'https://blog.boot.dev';
    const actual = getURLs(inputBody,inputURL);
    const expected = ['https://blog.boot.dev/path/'];
    expect(actual).toEqual(expected);
    
})

test('getURLsfromHTML both urls', () => {
    const inputBody = `
    <html>
        <body>

            <a href="https://blog.boot.dev/path1/"
                Boot.dev BLOG path 1
            </a>

            <a href="/path2/"
                Boot.dev BLOG path 2
            </a>


        </body>
    </html>
    `
    const inputURL = 'https://blog.boot.dev';
    const actual = getURLs(inputBody,inputURL);
    const expected = ['https://blog.boot.dev/path1/','https://blog.boot.dev/path2/'];
    expect(actual).toEqual(expected);
    
})


test('getURLsfromHTML invalid urls', () => {
    const inputBody = `
    <html>
        <body>
            <a href="invalid"
                Invalid url
            </a>
        </body>
    </html>
    `
    const inputURL = 'https://blog.boot.dev';
    const actual = getURLs(inputBody,inputURL);
    const expected = [];
    expect(actual).toEqual(expected);
    
})



