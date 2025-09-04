const fs = require("fs");
const path = require('path')
const os = require('os')


function printReport(pages)
{
    console.log(`==========`);
    console.log("REPORT");
    console.log(`==========`);

    const sortedPages = sortPages(pages);
    for(const sortedPage of sortedPages) {
        const pageURL = sortedPage[0];
        const hits = sortedPage[1];
        console.log(`Found ${hits} links to page ${pageURL}`);

    }
    console.log("\n\n");
    console.log(`==========`);
    console.log("END");
    console.log(`==========`);

    saveToCSV(pages);
}

function escapeCsvValue(value) {
    const valueString = String(value);
    const escaped = valueString.replace(/"/g,'""');
    return `"${escaped}"`;
}

function saveToCSV(pages) {
    const rows = [['URL', 'Count']]; //2d array
    for(const url in pages) {
        rows.push([url,pages[url]]);    
    }

    const csvContent = rows.map(row => row.map(escapeCsvValue).join(',')).join('\n');
    const desktopPath = path.join(os.homedir(), 'Desktop', 'crawResults.csv');

    //dir copy
    fs.writeFileSync('crawResults.csv',csvContent);

    //desktop copy
    fs.writeFileSync(desktopPath,csvContent);

    console.log("\n Results saved in crawlResult.csv file\n");

}


function sortPages(pages) {
    const pagesArr = Object.entries(pages);
    pagesArr.sort((a,b) => {
        aHits = a[1];
        bHits = b[1];
        return b[1] - a[1]; //descending order
    })

    return pagesArr;
}

module.exports = {
    sortPages,
    printReport
}