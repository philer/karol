import {h, render, Fragment} from "preact"
import {useContext, useEffect, useState} from "preact/hooks"

import {translate as t, init as initLocalization, Exception} from "./localization"
import * as graphics from "./graphics"
import {run} from "./simulation/simulation"
import {Logging, LoggingProvider} from "./ui/Logging"
import {Editor} from "./ui/Editor"
import {WorldPanel} from "./ui/WorldPanel"
import {defaultPreventer} from "./util"
import {readFile, saveTextAs} from "./util/files"
import {
  IconPlay,
  IconPause,
  IconStepForward,
  IconStop,
  IconWalking,
  IconRunning,
} from "./ui/Icon"


const MIN_SPEED = 1
const MAX_SPEED = 2.5
const calculateDelay = speed => Math.pow(10, 4 - speed)


const initPromises = Promise.all([
  initLocalization(),
  graphics.init(),
])


function App() {
  const log = useContext(Logging)
  const [isLoading, setIsLoading] = useState(true)
  const [code, setCode] = useState("")
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState((MIN_SPEED + MAX_SPEED) / 2)
  const [simulation, setSimulation] = useState(null)

  useEffect(() => {
    initPromises.then(() => setIsLoading(false), console.error)
  }, [])

  function updateCode(text) {
    haltSimulation()
    setCode(text)
  }

  function saveProgram() {
    saveTextAs(code, t("program.default_filename"))
  }

  function loadProgram(evt) {
    haltSimulation()
    readFile(evt.target.files[0]).then(setCode)
  }

  const [world, setWorld] = useState(null)
  function updateWorld(newWorld) {
    haltSimulation()
    setWorld(newWorld)
  }

  function updateSpeed(value) {
    simulation?.setDelay(calculateDelay(value))
    setSpeed(value)
  }

  async function runSimulation() {
    try {
      const simulation = run({
        code,
        world,
        delay: calculateDelay(speed),
        // onExecute: ({lineno}) => editor.markLine(lineno),  // TODO
      })
      setSimulation(simulation)
      setIsPaused(false)
      log.info("program.message.running")
      await simulation.finished
      log.info("program.message.finished")
    } catch (err) {
      if (err instanceof Exception) {
        log.error(err)
      } else {
        log.error(err.message)
        console.error(err)
      }
    } finally {
      setSimulation(null)
    }
  }

  function haltSimulation() {
    if (simulation) {
      simulation.pause()
      log.info("program.message.canceled")
      setSimulation(null)
    }
  }

  function pauseSimulation() {
    simulation.pause()
    setIsPaused(true)
  }

  function resumeSimulation() {
    simulation.resume()
    setIsPaused(false)
  }

  if (isLoading) {
    return <span>Loading...</span>
  }

  return (
    <>
      <section class="panel editor-panel">
        <header><h2>{t("program.code")}</h2></header>

        <form class="editor-wrapper" onSubmit={defaultPreventer()}>
          <div class="editor-buttons">
            <label class="button">
              {t("program.load")}
              <input
                type="file"
                class="hidden"
                onChange={loadProgram}
              />
            </label>
            <button class="button" onClick={saveProgram}>
              {t("program.save")}
            </button>
          </div>

          <Editor onChange={updateCode}>{code}</Editor>

          <div class="editor-buttons">

            {simulation
              ? <>
                  {isPaused
                    ? <button class="button icon-button" onClick={resumeSimulation}>
                        <IconPlay />
                      </button>
                    : <button class="button icon-button" onClick={pauseSimulation}>
                        <IconPause />
                      </button>
                  }
                  <button
                    class="button icon-button"
                    disabled={!simulation}
                    onClick={() => simulation?.step()}
                  >
                    <IconStepForward />
                  </button>
                  <button
                    class="button icon-button"
                    disabled={!simulation}
                    onClick={haltSimulation}
                  >
                    <IconStop />
                  </button>
                </>
              : <button class="button run-button" onClick={runSimulation}>
                  {t("program.run")}
                </button>
            }

            <label class="button nohover">
              <IconWalking lg fw />
              <input
                type="range"
                min={MIN_SPEED}
                max={MAX_SPEED}
                value={speed}
                step="any"
                onChange={evt => updateSpeed(evt.target.value)}
              />
              <IconRunning lg fw />
            </label>

          </div>
        </form>
      </section>

      <WorldPanel
        onChange={updateWorld}
        isSimulationRunning={simulation !== null}
      />
    </>
  )
}


render(<LoggingProvider><App /></LoggingProvider>, document.body)
