const { sortPages } = require('./report.js');
const {test,expect} = require("@jest/globals");

test('sortPages for 2 pages',() => {

    const input = {
        'https://wagslane.dev/path': 1,  
        'https://example.com': 2,
    }

    const actual = sortPages(input);
    const expected = [
        ['https://example.com',2],
        ['https://wagslane.dev/path',1]
    ];
    expect(actual).toEqual(expected);

})


test('sortPages for 2 pages',() => {

    const input = {
        'https://wagslane.dev/path': 1,  
        'https://example.com/path2': 7,
        'https://example.com/path3': 3,
        'https://example.com/path4': 12,
        'https://example.com/path5': 14,
    }

    const actual = sortPages(input);
    const expected = [
        ['https://example.com/path5',14],
        ['https://example.com/path4',12],
        ['https://example.com/path2',7],
        ['https://example.com/path3',3],
        ['https://wagslane.dev/path',1]
    ];
    expect(actual).toEqual(expected);

})


