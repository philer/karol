/** "No Operation" empty function - does nothing. */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {}

/** Return a single argument unchanged */
export const identity = <T = unknown>(x: T) => x


/** Turn an object into a valid CSS property list */
export const css = (mapping: Record<string, string>) =>
  Object.entries(mapping).map(entry => entry.join(":")).join(";")


/** Only include classes that are string - filter out the rest */
export const clsx = (...classes: any[]) =>
  classes.filter(Boolean).join(" ")


/** sleep function for use with await */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))


/** Wrap a function to automatically call evt.preventDefault() */
export const defaultPreventer = <E extends Event, T = any>(fn?: (evt: E) => T) => (evt: E) => {
  if (evt) {
    evt.preventDefault()
  }
  if (fn) {
    return fn(evt)
  }
}


/** Convert partial/relative URLs to full. */
export const resolveUrl = (url: string) =>
  new URL(url, document.location.href).href


/** Check if given argument is an Object (also not an Array). */
const isObject = (item: any) =>
  item && typeof item === "object" && !Array.isArray(item)

/**
 * Flatten nested objects in to objects with dotted keys.
 *
 * Example:
 *     > flattenKeys({foo: {bar: 42}})
 *     {"foo.bar": 42}
 */
export const flattenKeys = (obj: Record<string, any>) => {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (isObject(value)) {
      for (const [innerKey, innerValue] of Object.entries(flattenKeys(value))) {
        result[`${key}.${innerKey}`] = innerValue
      }
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * Apply a function to all key/value pairs in an object to create a new object.
 *
 * Example:
 *     > mapObject((key, value) => [key.toUpperCase(), value * 10], {a: 1, b: 2})
 *     {A: 10, B: 20}
 */
export const mapObject = <X extends Record<string, any>, Y extends Record<string, any>>(
  fn: (key: keyof X, value: X[keyof X]) => [keyof Y, Y[keyof Y]],
  obj: X,
) =>
    Object.fromEntries(Object.entries(obj).map(([key, value]) => fn(key, value)))


/**
 * Reverse keys and values of an object
 *
 * Example:
 *     > flipObject({a: "foo", b: "bar"})
 *     {foo: "a", bar: "b"}
 */
export const flipObject = (obj: Record<string, string>) =>
  mapObject((key, value) => [value, key], obj)


/** Join items with commas and a final word, e.g. "1, 2 and 3" */
export const commaList = (xs: any[], finalSeparator = " and ") =>
  xs.length < 3
    ? xs.join(finalSeparator)
    : xs.slice(0, -1).join(", ") + finalSeparator + xs[xs.length - 1]


/** Calculate sum of numbers in an array */
export const sum = (xs: number[]) => xs.reduce((x, acc) => x + acc, 0)


/** Combination of Math.min and Math.max -> restrict val in between min and max. */
export const clamp = (min: number, max: number, val: number) =>
  val < min ? min : val > max ? max : val


/** Wrapper for Math.random to get ints */
export const rand = (min: number, max: number) =>
  Math.floor(Math.random() * Math.floor(max)) + min


/** Turn a string into a hash (integer) */
export function hash(str: string) {
  // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
  for (let i = 0, hash = 0, len = str.length ; i < len ; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) << 0
  }
  return hash
}

/** Zip two arrays by the shortest length */
export const zip = <X, Y>(xs: X[], ys: Y[]): [X, Y][] =>
  xs.slice(0, ys.length)
    .map((x, idx) => [x, ys[idx]])


/** Create a DOM Element */
export function elem<T extends HTMLElement>(
  tagName: string,
  attributes: Record<string, any> = {},
  ...children: (string | Node)[]
) {
  const element = document.createElement(tagName)
  if (attributes instanceof Node || typeof attributes === "string") {
    element.append(attributes)
  } else {
    Object.assign(element, attributes)
  }
  element.append(...children)
  return element as T
}
