import * as config from "./config"
import {flattenKeys} from "./util"

// const DATA_ATTRIBUTE_SUFFIX = "i18t"

const INTERPOLATION_REGEX = /\{([^}]*?)\}/g

let locales: string[]
let translations: Record<string, string>

async function setLocales(_locales: string[]) {
  _locales = Array.isArray(_locales) ? _locales : [_locales]
  if (_locales.includes("auto")) {
    const browserLocale = navigator.language.split(/[_-]/)[0]
    _locales = _locales.map(locale => locale === "auto" ? browserLocale : locale)
  }

  locales = Array.from(new Set(_locales.filter(Boolean)))
  translations = Object.assign(Object.create(null), ...await Promise.all(
    locales
      .map(l => config.get(`localization/${l}.js`).then(flattenKeys))
      .reverse(),
  ))
}

/** Translate a language variable according to the configured locale. */
export function translate(variable: string, ...values: any[]) {
  if (!(variable in translations)) {
    console.warn(`Could not resolve localization variable ${variable}`)
    return variable
  }
  const result = translations[variable]
  if (typeof result === "string") {
    return values.length ? interpolate(result, values) : result
  } else {
    return JSON.stringify(result)
  }
}

/** Subsitute values into a string. Inspired by Python's str.format method. */
function interpolate(string: string, values: any[]) {
  if (values.length === 1 && typeof values[0] === "object") {
    values = values[0]
  }
  const iter = (typeof values[Symbol.iterator] === "function"
    ? values : [])[Symbol.iterator]()
  return string.replace(
    INTERPOLATION_REGEX,
    (_, key) => key ? values[key] : iter.next().value,
  )
}

/**
 * Errors for our programming environment.
 * These do not inherit from JS's own Error as they do not need
 * to reveal details of the interpreter/runtime internals.
 *
 * Offers translation & interpolation.
 */
export class Exception {
  message: string
  data: any[]
  constructor(message: string, ...data: any[]) {
    this.message = message
    this.data = data
  }
  get translatedMessage(): string {
    return translate(this.message, ...this.data)
  }
}

export const init = () => config.get().then(cfg => setLocales(cfg.locale))
