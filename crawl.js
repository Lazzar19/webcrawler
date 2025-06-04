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
}