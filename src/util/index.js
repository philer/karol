/**
 * "No Operation" empty function - does nothing.
 * @return {undefined}
 */
export function noop() {}

/**
 * Convenience abbreviations for document element getters
 */
export const byId = document.getElementById.bind(document)
export const byClass = document.getElementsByClassName.bind(document)
export const byTag = document.getElementsByTagName.bind(document)

/** Turn an object into a valid CSS property list */
export const css = mapping =>
  Object.entries(mapping).map(entry => entry.join(":")).join(";")

/**
 * sleep function for use with await
 * @param  {int} ms
 * @return {Promise}
 */
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Await a global event
 * @param  {String} evt event name
 * @return {Promise}
 */
export const event = evt => new Promise(resolve => addEventListener(evt, resolve))

/**
 * Promise fulfilled on DOMContentLoaded
 * @type {Promise}
 */
export const domReady = document.readyState === "loading"
  ? event("DOMContentLoaded")
  : Promise.resolve()

/**
 * Count how many times a character appears in a string.
 * @param  {String} char
 * @param  {String} str
 * @return {int}
 */
export function countOccurences(char, str) {
  let count = 0
  str.replace(char, () => {
    count++
    return char
  })
  return count
}


/**
 * Check if given argument is an Object (also not an Array).
 */
export function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item)
}

export function* zip(...iterables) {
  const iterators = iterables.map(it => it[Symbol.iterator]())
  let current = iterators.map(it => it.next())
  while (!current.some(item => item.done)) {
    yield current.map(item => item.value)
    current = iterators.map(it => it.next())
  }
}

export function unzip(tuples) {
  const trails = tuples[0].map(() => [])
  for (const tuple of tuples) {
    trails.forEach((trail, index) => {
      trail.push(tuple[index])
    })
  }
  return trails
}

export function objectFrom(entries) {
  const obj = {}
  for (const [name, value] of entries) {
    obj[name] = value
  }
  return obj
}

export function assignEntries(obj, entries) {
  for (const [name, value] of entries) {
    obj[name] = value
  }
  return obj
}

/**
 * Recursively merge objects into a target. Only merges objects,
 * everything else gets overwritten by later objects in the argument
 * list.
 * @param  {Object}    target
 * @param  {...[Object]} objects
 * @return {Object}
 */
export function mergeDeep(target, ...objects) {
  return objects.reduce((prev, obj) => {
    for (const key of Object.keys(obj)) {
      if (isObject(prev[key]) && isObject(obj[key])) {
        prev[key] = mergeDeep({}, prev[key], obj[key])
      } else {
        prev[key] = obj[key]
      }
    }
    return prev
  },
  target)
}

/**
 * Combination of Math.min and Math.max -> restrict val in between min and max.
 * @param  {mixed} min
 * @param  {mixed} max
 * @param  {mixed} val
 * @return {mixed}
 */
export const clamp = (min, max, val) => val < min ? min : val > max ? max : val

/**
 * Wrapper for Math.random to get ints
 * @param  {int} min
 * @param  {int} max
 * @return {int}
 */
export const rand = (min, max) => Math.floor(Math.random() * Math.floor(max)) + min

/**
 * Turn a string into a hash (integer)
 * @param  {string} str
 * @return {int}
 */
export function hash(str) {
  // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
  let hash = 0, i = 0, len = str.length
  while (i < len) {
    hash  = ((hash << 5) - hash + str.charCodeAt(i++)) << 0
  }
  return hash
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
    this._seed = seed % 2147483647
    if (this._seed <= 0) {
      this._seed += 2147483646
    }
  }

  /**
   * Returns a pseudo-random value between 1 and 2^32 - 2.
   */
  next() {
    return this._seed = this._seed * 16807 % 2147483647
  }

  /**
   * Returns a pseudo-random floating point number in range [0, 1).
   */
  nextFloat() {
    return (this.next() - 1) / 2147483646
  }
}
