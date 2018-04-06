import * as config from "./config.js";
import {domReady} from "./util.js";

const DATA_ATTRIBUTE_SUFFIX = "i18t";

const INTERPOLATION_REGEX = /\{([^}]*?)\}/g;

let locale;
let translations;

export function getLocale() {
  return locale;
}

async function setLocale(_locale) {
  locale = _locale;
  translations = await config.get(`localization/${locale}.js`);
  await translateDOM();
}

/**
 * Replace the content of all HTML elements with a localiation data-*
 * attribute in the document.
 * Also set the lang attribute of the body.
 */
async function translateDOM() {
  await domReady;
  document.body.setAttribute("lang", locale);
  const elements = document.querySelectorAll(`[data-${DATA_ATTRIBUTE_SUFFIX}]`);
  for (const elem of elements) {
    const result = translate(elem.dataset[DATA_ATTRIBUTE_SUFFIX]);
    if (typeof result === "string") {
      elem.innerHTML = result;
    }
  }
}

/**
 * Translate a language variable according to the configured locale
 * @param  {String} variable a key - nested keys may be separated by commas.
 * @return {mixed}
 */
export function translate(variable, ...values) {
  let result = translations;
  for (const key of variable.split(".")) {
    result = result[key];
    if (result === undefined) {
      console.warn(`Could not resolve localization variable ${variable}`);
      return variable;
    }
  }
  if (typeof result === "string") {
    return values.length ? interpolate(result, ...values) : result;
  } else {
    return JSON.stringify(result);
  }
}

/**
 * Subsitute values into a string. Inspired by Python's str.format method.
 * @param  {string} string
 * @param  {iterable|object} values
 * @return {string}
 */
function interpolate(string, ...values) {
  if (values.length === 1 && typeof values[0] === "object") {
    values = values[0];
  }
  let iter = (typeof values[Symbol.iterator] === "function"
              ? values : [])[Symbol.iterator]();
  return string.replace(INTERPOLATION_REGEX,
                        (_, key) => key ? values[key]
                                        : iter.next().value);
}

/**
 * Errors for our programming environment.
 * These do not inherit from JS's own Error as they do not need
 * to reveal details of the interpreter/runtime internals.
 *
 * Offers translation & interpolation.
 */
export class Exception {
  constructor(message, ...data) {
    this.message = message;
    this.data = data;
  }
  get translatedMessage() {
    return translate(this.message, ...this.data);
  }
}

config.get().then(cfg => setLocale(cfg.locale));
