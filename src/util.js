/**
 * "No Operation" empty function - does nothing.
 * @return {undefined}
 */
export function noop() {}

/**
 * Convenience abbreviations for document element getters
 */
export const byId = document.getElementById.bind(document);
export const byClass = document.getElementsByClassName.bind(document);
export const byTag = document.getElementsByTagName.bind(document);

/**
 * Load JSON. Fails for local installations.
 *
 * https://mathiasbynens.be/notes/xhr-responsetype-json
 *
 * @param  {string} url
 * @return {Promise}
 */
export const getJSON = url => new Promise(function(resolve, reject) {
  const xhr = new XMLHttpRequest();
  xhr.open('get', url, true);
  xhr.responseType = 'json';
  xhr.onload = function() {
    if (xhr.status == 200) {
      resolve(xhr.response);
    } else {
      reject(xhr.status);
    }
  };
  xhr.send();
});


export const resolveUrl = (function() {
  if (URL) {
    return url => (new URL(url, document.location)).href;
  }
  return function compatibleUrlResolver(url) {
    const a = document.createElement("a");
    a.href = url;
    return a.href;
  };
})();

/**
 * sleep function for use with await
 * @param  {int} ms
 * @return {Promise}
 */
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Await a global event
 * @param  {String} evt event name
 * @return {Promise}
 */
export const event = evt => new Promise(resolve => addEventListener(evt, resolve));

/**
 * Promise fulfilled on DOMContentLoaded
 * @type {Promise}
 */
export const domReady = document.readyState === "loading"
                          ? event("DOMContentLoaded")
                          : Promise.resolve();

/**
 * Wrapper for Math.random to get ints
 * @param  {int} min
 * @param  {int} max
 * @return {int}
 */
export const rand = (min, max) => Math.floor(Math.random() * Math.floor(max)) + min;

/**
 * Turn a string into a hash (integer)
 * @param  {string} str
 * @return {int}
 */
export function hash(str) {
  // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
  let hash = 0, i = 0, len = str.length;
  while (i < len) {
    hash  = ((hash << 5) - hash + str.charCodeAt(i++)) << 0;
  }
  return hash;
}

/**
 * https://gist.github.com/blixt/f17b47c62508be59987b
 *
 * Creates a pseudo-random value generator. The seed must be an integer.
 *
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 */
export class Random {
  constructor(seed) {
    this._seed = seed % 2147483647;
    if (this._seed <= 0) {
      this._seed += 2147483646;
    }
  }

  /**
   * Returns a pseudo-random value between 1 and 2^32 - 2.
   */
  next() {
    return this._seed = this._seed * 16807 % 2147483647;
  }

  /**
   * Returns a pseudo-random floating point number in range [0, 1).
   */
  nextFloat() {
    return (this.next() - 1) / 2147483646;
  }
}
