import {resolveUrl} from "./util"

/** Mapping of URLs to Promises, which will be resolved with data. */
const promises: Record<string, Promise<any>> = Object.create(null)

/** Mapping of URLs to the resolve function of each Promise. */
const resolvers: Record<string, (data: any) => void> = Object.create(null)

declare global {
  interface Window { config: <T = any>(data: T) => void }
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
export function get<T = any>(url="config.js"): Promise<T> {
  url = resolveUrl(url)
  if (url in promises) {
    return promises[url]
  }
  return promises[url] = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    resolvers[url] = data => {
      delete resolvers[url]
      resolve(data)
      script.remove()
    }
    script.addEventListener("error", reject)
    script.src = url
    document.head.appendChild(script)
  })
}
