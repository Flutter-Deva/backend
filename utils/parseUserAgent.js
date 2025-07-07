// Function to parse user agent string and extract browser and OS
const parseUserAgent = (userAgent) => {
    const uaParser = require('ua-parser-js');
    const parsedUA = uaParser(userAgent);
    const browser = parsedUA.browser.name + ' ' + parsedUA.browser.major;
    const os = parsedUA.os.name + ' ' + parsedUA.os.version;
    return { browser, os };
  };
  
  module.exports = parseUserAgent;
  