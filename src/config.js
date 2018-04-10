/**
 * Mapping of URLs to Promises, which will be resolved with data.
 * @type {Object}
 */
const promises = Object.create(null);

/**
 * Mapping of URLs to the resolve function of each Promise.
 * @type {Object}
 */
const resolvers = Object.create(null);

/**
 * Global function will be called by JSONP style config files.
 * TODO: May need to adjust the name to something less prone to collisions.
 * @param  {mixed} data whatever the config file defines
 */
window.config = function setConfigData(data) {
  resolvers[getCurrentScriptSrc()](Object.freeze(data));
};

/**
 * Load JSONP style configuration from .js files. This is necessary
 * so we can load config files in local context (file://).
 * @param  {String} url relative path to config .js file
 * @return {Promise}
 */
export function get(url="config.js") {
  url = resolveUrl(url);
  if (url in promises) {
    return promises[url];
  }
  return promises[url] = new Promise(function(resolve, reject) {
    resolvers[url] = function resolveAndRemove(data) {
      delete resolvers[url];
      resolve(data);
    };
    const script = document.createElement("script");
    script.onload = function() {
      document.head.removeChild(script); // script.remove(); // IE sucks
    };
    script.onerror = function() {
      reject();
      document.head.removeChild(script); // script.remove(); // IE sucks
    };
    document.head.appendChild(script);
    script.src = url;
  });
}

/**
 * Browser compatible function for detecting the URL of the currently
 * executing script.
 * @return {string}
 */
const getCurrentScriptSrc = (function() {
  if (document.currentScript !== undefined) {
    // non-horrible browsers
    return function() { return document.currentScript.src; };
  }
  // IE bandaid. Did I mention IE is a horrible "browser"?
  const urlRegex = /(?:file|https?):\/\/.+?\/.+?\.js(?=\W)/g;
  return function() {
    try {
      throw new Error();
    } catch (error) {
      const urls = error.stack.match(urlRegex);
      return urls[urls.length - 1];
    }
  };
})();

/**
 * Browser compatible function for converting partial/relative URLs to full.
 * @param {string} url
 * @return {string}
 */
const resolveUrl = (function() {
  if (URL && URL.call) {
    return url => (new URL(url, document.location)).href;
  }
  const a = document.createElement("a");
  return function compatibleUrlResolver(url) {
    a.href = url;
    return a.href;
  };
})();
