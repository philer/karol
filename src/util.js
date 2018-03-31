
/**
 * Wrapper for fetch API for json files.
 * @param  {string} path
 * @return {Promise}
 */
export const fetchJson = path => fetch(path).then(response => response.json());

/**
 * sleep function for use with await
 * @param  {int} ms
 * @return {Promise}
 */
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


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
