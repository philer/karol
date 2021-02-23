import {Fragment, h, render} from "preact"
import {useContext, useEffect, useState} from "preact/hooks"

import "./global.css"
import {Exception, init as initLocalization, translate as t} from "./localization"
import * as graphics from "./graphics"
import {run} from "./simulation/simulation"
import {Logging, LoggingProvider} from "./ui/Logging"
import {Editor} from "./ui/Editor"
import {World} from "./simulation/world"
import {WorldPanel} from "./ui/WorldPanel"
import {Tooltip} from "./ui/Tooltip"
import {defaultPreventer} from "./util"
import {readFile, saveTextAs} from "./util/files"
import type {ChangeEvent} from "./util/types"
import {
  IconPause,
  IconPlay,
  IconRunning,
  IconStepForward,
  IconStop,
  IconWalking,
} from "./ui/Icon"

import * as style from "./ui/EditorPanel.css"

const MIN_SPEED = 1
const MAX_SPEED = 2.5
const calculateDelay = (speed: number) => Math.pow(10, 4 - speed)


const initPromises = Promise.all([
  initLocalization(),
  graphics.init(),
])


function App() {
  const log = useContext(Logging)
  const [isLoading, setIsLoading] = useState(true)
  const [code, setCode] = useState("")
  const [markLine, setMarkLine] = useState<number | false>(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState((MIN_SPEED + MAX_SPEED) / 2)
  const [world, setWorld] = useState(new World(0, 0, 0))
  const [simulation, setSimulation] = useState<ReturnType<typeof run> | null>(null)

  useEffect(() => {
    initPromises.then(() => setIsLoading(false), console.error)
  }, [])

  function updateCode(text: string) {
    haltSimulation()
    setCode(text)
  }

  function saveProgram() {
    saveTextAs(code, t("program.default_filename"))
  }

  function loadProgram(evt: ChangeEvent) {
    haltSimulation()
    readFile((evt.currentTarget.files as FileList)[0]).then(setCode)
  }

  function updateWorld(newWorld: World) {
    haltSimulation()
    setWorld(newWorld)
  }

  function updateSpeed(value: number) {
    simulation?.setDelay(calculateDelay(value))
    setSpeed(value)
  }

  async function runSimulation() {
    try {
      const simulation = run({
        code,
        world,
        delay: calculateDelay(speed),
        onExecute: ({line}) => setMarkLine(line),
      })
      setSimulation(simulation)
      setIsPaused(false)
      log.info("simulation.message.running")
      await simulation.finished
      log.info("simulation.message.finished")
    } catch (err) {
      if (err instanceof Exception) {
        log.error(err)
      } else {
        log.error(err.message)
        console.error(err)
      }
    } finally {
      setSimulation(null)
      setMarkLine(false)
    }
  }

  function haltSimulation() {
    if (simulation) {
      simulation.pause()
      log.info("simulation.message.canceled")
      setSimulation(null)
      setMarkLine(false)
    }
  }

  function pauseSimulation() {
    simulation?.pause()
    setIsPaused(true)
    log.info("simulation.message.paused")
  }

  function resumeSimulation() {
    simulation?.resume()
    setIsPaused(false)
  }

  if (isLoading) {
    return <span>Loading...</span>
  }

  return (
    <>
      <section class={style.root}>
        <header><h2>{t("program.code")}</h2></header>

        <form class={style.wrapper} onSubmit={defaultPreventer()}>
          <div class={style.buttonRow}>
            <label class={style.button}>
              {t("program.load")}
              <input
                type="file"
                class="hidden"
                onChange={loadProgram}
              />
            </label>
            <button class={style.button} onClick={saveProgram}>
              {t("program.save")}
            </button>
          </div>

          <Editor
            class={style.editor}
            onChange={updateCode}
            markLine={markLine}
          >{code}</Editor>

          <div class={style.buttonRow}>

            {simulation
              ? <>
                  {isPaused
                    ? <button
                        class={`${style.button} ${style.iconButton}`}
                        onClick={resumeSimulation}
                      >
                        <IconPlay />
                      </button>
                    : <button
                        class={`${style.button} ${style.iconButton}`}
                        onClick={pauseSimulation}
                      >
                        <IconPause />
                      </button>
                  }
                  <button
                    class={`${style.button} ${style.iconButton}`}
                    disabled={!simulation}
                    onClick={() => simulation?.step()}
                  >
                    <IconStepForward />
                  </button>
                  <button
                    class={`${style.button} ${style.iconButton}`}
                    disabled={!simulation}
                    onClick={haltSimulation}
                  >
                    <IconStop />
                  </button>
                </>
              : <button
                  class={`${style.button} ${style.runButton}`}
                  onClick={runSimulation}
                  disabled={!code}
                >
                  {t("simulation.run")}
                </button>
            }

            <Tooltip above tip={t("simulation.speed")}>
              <label class={`${style.button} ${style.nohover}`}>
                <IconWalking lg fw />
                <input
                  type="range"
                  min={MIN_SPEED}
                  max={MAX_SPEED}
                  value={speed}
                  step="any"
                  onChange={evt => updateSpeed(+evt.currentTarget.value)}
                />
                <IconRunning lg fw />
              </label>
            </Tooltip>

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
