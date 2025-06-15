
const {JSDOM} = require('jsdom');

async function crawlPage(baseURL,currentURL,pages) {

    const baseURLObject = new URL(baseURL);
    const currentURLObject = new URL(currentURL);
    if(baseURLObject.hostname !== currentURLObject.hostname) {
        return pages;
    }

    const normalizedCurrentURL = normalizeURL(currentURL);
    if(pages[normalizedCurrentURL] > 0) {
        pages[normalizedCurrentURL] ++;
        return pages;
    }

    pages[normalizedCurrentURL] = 1;

    console.log(`crawling page: ${currentURL}`);
    try {
        const response = await fetch(currentURL);

        if(response.status > 399) {
            console.log(`error in fatch with status code: ${response.status} on page ${currentURL}`);
            return pages;
        }

        const contentType = response.headers.get("content-type");
        if(!contentType.includes('text/html'))
        {
            console.log(`non html response, content-type: ${contentType}, on page ${currentURL}`);
            return pages;
        }
        //parse to html
        const htmlBody =  await response.text();
        const nextURLs = getURLs(htmlBody,baseURL);
        for(const nextURL of nextURLs) {
            pages = await crawlPage(baseURL,nextURL,pages);
        }

    } catch(err) {
        console.log(`error in fetch: ${err.message}, on page ${currentURL}`)
    }

    return pages;

}


function getURLs(htmlBody,baseURL) {
    const urls = [];
    const dom = new JSDOM(htmlBody);
    const linkElements = dom.window.document.querySelectorAll("a");
    for(const link of linkElements) {

        if(link.href.slice(0,1) == '/') { // first character /
            //relative
            try{
                const urlObject = new URL( `${baseURL}${link.href}`);
                urls.push(urlObject.href);
            } catch (err) {
                console.log(`error with relative url: ${err.message}`)
            }

           
        } else {

            //absolute
           try{
                const urlObject = new URL(link.href);
                urls.push(urlObject.href);
           } catch (err) {
            console.log(`erro with absolute url: ${err.message}`);
           }
        }
    }
    return urls;
}


function normalizeURL(urlString) {
    const urlObject = new URL(urlString);
    const hostPath =  `${urlObject.hostname}${urlObject.pathname}`;

    if(hostPath.length > 0 && hostPath.slice(-1) == '/') {
        return hostPath.slice(0,-1); // vraca substring od prvog do poslednjeg karaktera(bez poslednjeg)
    }
    return hostPath;
};

module.exports = {
    normalizeURL,
    getURLs,
    crawlPage
}