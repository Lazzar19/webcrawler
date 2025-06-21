const {crawlPage} = require('./crawl.js');
const {printReport} = require("./report.js")

async function main() {

    if(process.argv.length < 3) {
        console.log("no website provided");
        process.exit(1);
    }    
    
    if(process.argv.length > 5) {
        console.log("to many command line arguments");
        process.exit(1);
    } 

    const maxDepth = parseInt(process.argv[3]) || 2;
    const maxPages = parseInt(process.argv[4]) || Infinity;


    console.log(`starting crawl of ${process.argv[2]}`);
    console.log(`Max depth: ${maxDepth}, Max pages: ${maxPages}`);
    let baseURL = process.argv[2];
    const pages = await crawlPage(baseURL,baseURL, {},0,maxDepth,maxPages );

    printReport(pages);

}

main();