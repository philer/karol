import * as config from "./config"
import {flattenKeys} from "./util"
import {keywordTokenTypes, setKeywords} from "./language/tokens"


const INTERPOLATION_REGEX = /\{([^}]*?)\}/g

const BROWSER_LOCALE = navigator.language.split(/[_-]/)[0]


let translations: Map<string, string>

async function setLocales(locales: string[]) {
  const promises = Array.from(new Set(Array.isArray(locales) ? locales : [locales]))
    .filter(Boolean)
    .reverse()
    .map(locale => locale.replace(/auto(?=-|$)/, BROWSER_LOCALE))
    .map(locale => config.get(`localization/${locale}.js`))
  const definitions = await Promise.all(promises)
  translations = new Map(definitions.map(flattenKeys).flatMap(Object.entries))
}


/** Translate a language variable according to the configured locale. */
export function translate(variable: string, ...values: any[]) {
  if (!translations.has(variable)) {
    console.warn(`Could not resolve localization variable ${variable}`)
    return variable
  }
  const result = translations.get(variable) as string
  return values.length ? interpolate(result, values) : result
}


/** Subsitute values into a string. Inspired by Python's str.format method. */
function interpolate(string: string, values: any[]) {
  if (values.length === 1 && typeof values[0] === "object") {
    values = values[0]
  }
  const iter = (values[Symbol.iterator] ? values : [])[Symbol.iterator]()
  return string.replace(
    INTERPOLATION_REGEX,
    (_, key) => key ? values[key] : iter.next().value,
  )
}


/** Load translations */
export async function init() {
  const {locale} = await config.get()
  await setLocales(locale)

  setKeywords(new Map(
    keywordTokenTypes.map(tt => [translate(`language.${tt}`), tt]),
  ))
}
