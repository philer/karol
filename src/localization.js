import * as config from "./config.js";
import {domReady} from "./util.js";

const DATA_ATTRIBUTE_SUFFIX = "i18t";

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
export function translate(variable) {
  let subtree = translations;
  for (const key of variable.split(".")) {
    subtree = subtree[key];
    if (subtree === undefined) {
      console.warn(`Could not resolve localization variable ${variable}`);
      return variable;
    }
  }
  return subtree;
}

config.get().then(cfg => setLocale(cfg.locale));
