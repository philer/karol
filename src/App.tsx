import {h, render} from "preact"
import {useContext, useEffect, useErrorBoundary, useState} from "preact/hooks"

import "./global.css"
import * as graphics from "./graphics"
import {init as initLocalization, translate as t} from "./localization"
import {Main} from "./ui/Main"
import {Logging, LoggingProvider} from "./ui/Logging"
import {Translate} from "./ui/Translate"
import {IconCircleNotch} from "./ui/Icon"
import {version} from "../package.json"

import * as style from "./App.css"


const initPromises = Promise.all([
  graphics.init(),
  initLocalization(),
])


function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const log = useContext(Logging)

  useEffect(() => {
    initPromises.then(() => {
      setIsLoading(false)
      log.info(
        <Translate
          version={version}
          older_release={<a href="/karol-releases">{t("older_release")}</a>}
        >welcome</Translate>,
      )
    }).catch(err => {
      console.error(err)
      setHasError(true)
    })
  }, [])

  useErrorBoundary(err => {
    console.error(err)
    setHasError(true)
  })

  if (isLoading) {
    return <div class={style.loading}><IconCircleNotch spin /></div>
  }

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

  return (
    <LoggingProvider>
      <Main />
    </LoggingProvider>
  )
}


render(<App />, document.body)
