import {elem, resolveUrl} from "./util"

export type Config = {
  locale: string[]
  tile_theme: string
  player_theme: string
  editor_theme: string
  code: {
    locales: string[]
    caseSensitiveKeywords: boolean
    caseSensitiveIdentifiers: boolean
  },
}

/** Mapping of URLs to Promises, which will be resolved with data. */
const promises: Record<string, Promise<any>> = Object.create(null)

/** Mapping of URLs to the resolve function of each Promise. */
const resolvers: Record<string, (data: unknown) => void> = Object.create(null)

declare global {
  interface Window { config: <T = unknown>(data: T) => void }
}

/**
 * Global function will be called by JSONP style config files.
 * TODO: May need to adjust the name to something less prone to collisions.
 */
window.config = function setConfigData(data) {
  resolvers[(document.currentScript as HTMLScriptElement).src](Object.freeze(data))
}

/**
 * Load JSONP style configuration from .js files. This is necessary
 * so we can load config files in local context (file://).
 *
 * TODO? validation
 */
export function get<T = Config>(url="config.js"): Promise<T> {
  url = resolveUrl(url)
  if (url in promises) {
    return promises[url]
  }
  return promises[url] = new Promise((resolve, reject) => {
    const script = document.head.appendChild(elem("script", {
      src: url,
      onerror: reject,
    }))
    resolvers[url] = data => {
      delete resolvers[url]
      resolve(data)
      script.remove()
    }
  })
}
