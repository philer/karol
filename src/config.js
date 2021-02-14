/**
 * Mapping of URLs to Promises, which will be resolved with data.
 * @type {Object}
 */
const promises = Object.create(null)

/**
 * Mapping of URLs to the resolve function of each Promise.
 * @type {Object}
 */
const resolvers = Object.create(null)

/**
 * Global function will be called by JSONP style config files.
 * TODO: May need to adjust the name to something less prone to collisions.
 * @param  {mixed} data whatever the config file defines
 */
window.config = function setConfigData(data) {
  resolvers[document.currentScript.src](Object.freeze(data))
}

/**
 * Load JSONP style configuration from .js files. This is necessary
 * so we can load config files in local context (file://).
 * @param  {String} url relative path to config .js file
 * @return {Promise}
 */
export function get(url="config.js") {
  url = resolveUrl(url)
  if (url in promises) {
    return promises[url]
  }
  return promises[url] = new Promise((resolve, reject) => {
    resolvers[url] = data => {
      delete resolvers[url]
      resolve(data)
    }
    const script = document.createElement("script")
    script.onload = () => script.remove()
    script.onerror = () => {
      reject()
      script.remove()
    }
    script.src = url
    document.head.appendChild(script)
  })
}

/**
 * Convert partial/relative URLs to full.
 * @param {string} url
 * @return {string}
 */
const resolveUrl = url => (new URL(url, document.location)).href
