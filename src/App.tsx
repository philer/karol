import {h, render} from "preact"
import {useContext, useEffect, useErrorBoundary, useState} from "preact/hooks"

import "./global.scss"

import {init as initGraphics} from "./graphics"
import {defaultSpec, load as loadSpec} from "./language/specification"
import {init as initLocalization, translate as t} from "./localization"
import {init as initEditor} from "./ui/Editor"
import {IconCircleNotch} from "./ui/Icon"
import {Logging, LoggingProvider} from "./ui/Logging"
import {Main} from "./ui/Main"
import {Translate} from "./ui/Translate"

import * as classes from "./App.module.css"
import {version} from "../package.json"


const initPromises = [
  loadSpec(),
  initLocalization(),
  initEditor(),
  initGraphics(),
] as const


function App() {
  const [spec, setSpec] = useState(defaultSpec)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>()

  useEffect(() => {
    Promise.all(initPromises)
      .then(([spec]) => setSpec(spec))
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  useErrorBoundary(setError)

  if (error) {
    console.error(error)
    return (
      <div class={classes.error}>
        <p>Looks like something went wrong. 🤔</p>
        <p>
          To continue, try reloading the page.
          <br />
          If the error doesn't go away, you can try an
          {" "}
          <a href="/karol-releases">older Karol Release</a>.
        </p>
        <p>
          To find out more, you can check the browser console (press F12).
          <br />
          If you think something is broken, please let me know on
          {" "}
          <a href="https://github.com/philer/karol/issues">Github</a>.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return <div class={classes.loading}><IconCircleNotch spin /></div>
  }

  return (
    <LoggingProvider>
      <LogWelcome />
      <Main spec={spec} />
    </LoggingProvider>
  )
}


const LogWelcome = () => {
  const log = useContext(Logging)

  useEffect(() => {
    log.info(
      <Translate
        version={version}
        older_release={<a href="/karol-releases">{t("older_release")}</a>}
      >welcome</Translate>,
    )
  }, [log])

  return null
}

// Clear old browser warning
document.getElementById("bad-browser-warning")?.remove()

// Go!
render(<App />, document.body)

