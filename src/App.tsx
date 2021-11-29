import {h, render} from "preact"
import {useContext, useEffect, useErrorBoundary, useState} from "preact/hooks"

import "./global.css"
import {init as initGraphics} from "./graphics"
import {init as initLocalization, translate as t} from "./localization"
import {init as initEditor} from "./ui/Editor"
import {Main} from "./ui/Main"
import {Logging, LoggingProvider} from "./ui/Logging"
import {Translate} from "./ui/Translate"
import {IconCircleNotch} from "./ui/Icon"
import {version} from "../package.json"

import * as style from "./App.module.css"


const initPromises = Promise.all([
  initGraphics(),
  initEditor(),
  initLocalization(),
])


function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    initPromises
      .then(() => setIsLoading(false))
      .catch(err => {
        console.error(err)
        setHasError(true)
      })
  }, [])

  useErrorBoundary(err => {
    console.error(err)
    setHasError(true)
  })

  if (hasError) {
    return (
      <div class={style.error}>
        <p>Something went wrong. 🤔</p>
        <p>
          You can check the browser console (F12) and let me know on{" "}
          <a href="https://github.com/philer/karol/issues">Github</a>.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return <div class={style.loading}><IconCircleNotch spin /></div>
  }

  return (
    <LoggingProvider>
      <LogWelcome />
      <Main />
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

