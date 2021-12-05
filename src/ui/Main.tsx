import {h} from "preact"
import {useContext, useEffect, useState} from "preact/hooks"

import {Exception} from "../exception"
import {translate as t} from "../localization"
import {run} from "../simulation/simulation"
import {World} from "../simulation/world"
import {Logging} from "./Logging"
import {Editor} from "./Editor"
import type {LanguageSpecification} from "../language/specification"
import type {Marks} from "../language/highlight"
import {ResizeLayout, ResizePanel} from "./ResizeLayout"
import {WorldPanel} from "./WorldPanel"
import {Tooltip} from "./Tooltip"
import {clsx, defaultPreventer} from "../util"
import {readFile, saveTextAs} from "../util/files"
import type {ChangeEvent} from "../util/types"
import {
  IconPause,
  IconPlay,
  IconQuestion,
  IconRunning,
  IconStepForward,
  IconStop,
  IconWalking,
} from "./Icon"
import * as buttonClasses from "../button.module.scss"
import * as classes from "./Main.module.scss"

const MIN_SPEED = 1
const MAX_SPEED = 2.5
const calculateDelay = (speed: number) => Math.pow(10, 4 - speed)


export const Main = ({spec}: {spec: LanguageSpecification}) => {
  const log = useContext(Logging)
  const [code, setCode] = useState("")
  const [editorMarks, setEditorMarks] = useState<Marks>({})
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState((MIN_SPEED + MAX_SPEED) / 2)
  const [world, setWorld] = useState(new World(0, 0, 0))
  const [simulation, setSimulation] = useState<ReturnType<typeof run> | null>(null)

  function updateCode(text: string) {
    haltSimulation()
    setCode(text)
    setEditorMarks({})
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
        spec,
        world,
        delay: calculateDelay(speed),
        onExecute: ({line}) => setEditorMarks({[line]: "current"}),
      })
      setSimulation(simulation)
      setIsPaused(false)
      log.info("simulation.message.running")
      await simulation.finished
      setEditorMarks({})
      log.info("simulation.message.finished")
    } catch (err) {
      if (err instanceof Exception) {
        log.error(err)
        if (typeof err.data?.line === "number") {
          setEditorMarks({[err.data.line]: "error"})
        }
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
      log.info("simulation.message.canceled")
      setSimulation(null)
      setEditorMarks({})
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
    log.info("simulation.message.running")
  }

  useEffect(() => {
    document.title = `${simulation ? isPaused ? "⏸️" : "▶️" : ""} Karol`
  }, [simulation, isPaused])

  return (
    <ResizeLayout>
      <ResizePanel key="editor" size="25em" minSize={300} class={classes.panel}>
        <header><h2>{t("program.code")}</h2></header>

        <form class={classes.panelInner} onSubmit={defaultPreventer()}>
          <div class={buttonClasses.buttonRow}>
            <label class={buttonClasses.button}>
              {t("program.load")}
              <input
                type="file"
                class="hidden"
                onChange={loadProgram}
              />
            </label>
            <button class={buttonClasses.button} onClick={saveProgram}>
              {t("program.save")}
            </button>
          </div>

          <Editor
            class={classes.editor}
            onChange={updateCode}
            languageSpec={spec}
            marks={editorMarks}
          >{code}</Editor>

          <div class={buttonClasses.buttonRow}>

            {simulation
              ? <span class={classes.runControls}>
                  {isPaused
                    ? <button
                        class={buttonClasses.iconButton}
                        onClick={resumeSimulation}
                      >
                        <IconPlay />
                      </button>
                    : <button
                        class={buttonClasses.iconButton}
                        onClick={pauseSimulation}
                      >
                        <IconPause />
                      </button>
                  }
                  <button
                    class={buttonClasses.iconButton}
                    disabled={!simulation}
                    onClick={() => simulation?.step()}
                  >
                    <IconStepForward />
                  </button>
                  <button
                    class={buttonClasses.iconButton}
                    disabled={!simulation}
                    onClick={haltSimulation}
                  >
                    <IconStop />
                  </button>
                </span>
              : <button
                  class={clsx(buttonClasses.button, classes.runButton)}
                  onClick={runSimulation}
                  disabled={!code}
                >
                  {t("simulation.run")}
                </button>
            }

            <Tooltip above tip={t("simulation.speed")}>
              <label class={clsx(buttonClasses.button, buttonClasses.nohover)}>
                <IconWalking lg fw />
                <input
                  type="range"
                  min={MIN_SPEED}
                  max={MAX_SPEED}
                  value={speed}
                  step="any"
                  onInput={evt => updateSpeed(+evt.currentTarget.value)}
                />
                <IconRunning lg fw />
              </label>
            </Tooltip>

          </div>
        </form>
      </ResizePanel>

      <ResizePanel key="world" class={classes.panel}>
        <header><h2>{t("world.world")}</h2></header>

        <div class={classes.panelInner}>
          <WorldPanel
            onChange={updateWorld}
            isSimulationRunning={simulation !== null}
          />
        </div>
      </ResizePanel>
    </ResizeLayout>
  )
}
