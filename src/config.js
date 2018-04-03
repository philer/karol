import {resolveUrl} from "./util.js";

const cache = Object.create(null);

/**
 * Global function will be called by JSONP style config files.
 * TODO: May need to adjust the name to something less prone to collisions.
 * @param  {mixed} data whatever the config file defines
 */
window.config = function setConfigData(data) {
  cache[document.currentScript.src] = data;
};

/**
 * Load JSONP style configuration from .js files. This is necessary
 * so we can load config files in local context (file://).
 * @param  {String} url relative path to config .js file
 * @return {Promise}
 */
export default function get(url) {
  url = resolveUrl(url);
  if (url in cache) {
    return Promise.resolve(cache[url]);
  }
  return new Promise(function(resolve, reject) {
    const script = document.createElement("script");
    script.onload = function() {
      resolve(cache[script.src]);
      script.remove();
    };
    script.onerror = function() {
      reject();
      script.remove();
    };
    document.head.appendChild(script);
    script.src = url;
  });
}

