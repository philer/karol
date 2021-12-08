import {h} from "preact"
import {useContext, useEffect, useRef, useState} from "preact/hooks"

import {Exception} from "../exception"
import type {Marks} from "../language/highlight"
import type {LanguageSpecification} from "../language/specification"
import {translate as t} from "../localization"
import {run} from "../simulation/simulation"
import {World} from "../simulation/world"
import {clsx, defaultPreventer} from "../util"
import {readFile, saveTextAs} from "../util/files"
import type {ChangeEvent} from "../util/types"
import {Editor} from "./Editor"
import {
  IconKeyboard,
  IconPause,
  IconPlay,
  IconQuestion,
  IconRunning,
  IconStepForward,
  IconStop,
  IconWalking,
} from "./Icon"
import {LanguageHelp} from "./LanguageHelp"
import {Logging} from "./Logging"
import {Popover} from "./Popover"
import {Resizable} from "./Resizable"
import {Tooltip} from "./Tooltip"
import {WorldPanel} from "./WorldPanel"

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
        log.error(err instanceof Error ? err.message : `${err}`)
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

  const [isLanguageHelpVisible, setIsLanguageHelpVisible] = useState(false)
  const editorPanelRef = useRef<HTMLFormElement>(null)

  return (
    <div class={classes.root}>
      <Resizable right class={classes.editorPanel}>
        <form onSubmit={defaultPreventer()} ref={editorPanelRef}>
          <header class={classes.row}>
            <h2><IconKeyboard lg /> {t("program.code")}</h2>
            <label class={classes.button}>
              {t("program.load")}
              <input
                type="file"
                class="hidden"
                onChange={loadProgram}
              />
            </label>
            <button class={classes.button} onClick={saveProgram}>
              {t("program.save")}
            </button>
            <button
              class={classes.iconButton}
              onClick={() => setIsLanguageHelpVisible(yes => !yes)}
            >
              <IconQuestion />
            </button>
            <Popover
              class={classes.help}
              show={isLanguageHelpVisible}
              onClose={() => setIsLanguageHelpVisible(false)}
              anchor={editorPanelRef.current}
              orientation="right top"
              title={t("program.help")}
            >
              <LanguageHelp spec={spec} />
            </Popover>
          </header>

          <Editor
            class={classes.editor}
            onChange={updateCode}
            languageSpec={spec}
            marks={editorMarks}
          >{code}</Editor>

          <div class={classes.row}>

            {simulation
              ? <span class={classes.runControls}>
                  {isPaused
                    ? <button
                        class={classes.iconButton}
                        onClick={resumeSimulation}
                      >
                        <IconPlay />
                      </button>
                    : <button
                        class={classes.iconButton}
                        onClick={pauseSimulation}
                      >
                        <IconPause />
                      </button>
                  }
                  <button
                    class={classes.iconButton}
                    disabled={!simulation}
                    onClick={() => simulation?.step()}
                  >
                    <IconStepForward />
                  </button>
                  <button
                    class={classes.iconButton}
                    disabled={!simulation}
                    onClick={haltSimulation}
                  >
                    <IconStop />
                  </button>
                </span>
              : <button
                  class={clsx(classes.button, classes.runButton)}
                  onClick={runSimulation}
                  disabled={!code}
                >
                  {t("simulation.run")}
                </button>
            }

            <Tooltip above tip={t("simulation.speed")}>
              <label class={clsx(classes.button, classes.nohover)}>
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
      </Resizable>

      <WorldPanel
        onChange={updateWorld}
        isSimulationRunning={simulation !== null}
      />
    </div>
  )
}
