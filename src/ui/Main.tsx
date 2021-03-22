import {Fragment, h} from "preact"
import {useContext, useEffect, useState} from "preact/hooks"

import {Exception, translate as t} from "../localization"
import {run} from "../simulation/simulation"
import {World} from "../simulation/world"
import {Logging} from "./Logging"
import {Editor} from "./Editor"
import {ResizeLayout, ResizePanel} from "./ResizeLayout"
import {WorldPanel} from "./WorldPanel"
import {Tooltip} from "./Tooltip"
import {defaultPreventer} from "../util"
import {readFile, saveTextAs} from "../util/files"
import type {ChangeEvent} from "../util/types"
import {
  IconPause,
  IconPlay,
  IconRunning,
  IconStepForward,
  IconStop,
  IconWalking,
} from "./Icon"

import * as style from "./Main.module.css"

const MIN_SPEED = 1
const MAX_SPEED = 2.5
const calculateDelay = (speed: number) => Math.pow(10, 4 - speed)


export const Main = () => {
  const {info, error} = useContext(Logging)
  const [code, setCode] = useState("")
  const [markLine, setMarkLine] = useState<number | false>(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState((MIN_SPEED + MAX_SPEED) / 2)
  const [world, setWorld] = useState(new World(0, 0, 0))
  const [simulation, setSimulation] = useState<ReturnType<typeof run> | null>(null)

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
      info("simulation.message.running")
      await simulation.finished
      info("simulation.message.finished")
    } catch (err) {
      if (err instanceof Exception) {
        error(err)
      } else {
        error(err.message)
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
      info("simulation.message.canceled")
      setSimulation(null)
      setMarkLine(false)
    }
  }

  function pauseSimulation() {
    simulation?.pause()
    setIsPaused(true)
    info("simulation.message.paused")
  }

  function resumeSimulation() {
    simulation?.resume()
    setIsPaused(false)
    info("simulation.message.running")
  }

  useEffect(() => {
    document.title = `${simulation ? isPaused ? "⏸️" : "▶️" : ""} Karol`
  }, [simulation, isPaused])

  return (
    <ResizeLayout>
      <ResizePanel key="editor" size={400} class={style.panel}>
        <header><h2>{t("program.code")}</h2></header>

        <form class={style.panelInner} onSubmit={defaultPreventer()}>
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
                  onInput={evt => updateSpeed(+evt.currentTarget.value)}
                />
                <IconRunning lg fw />
              </label>
            </Tooltip>

          </div>
        </form>
      </ResizePanel>

      <ResizePanel key="world" class={style.panel}>
        <header><h2>{t("world.world")}</h2></header>

        <div class={style.panelInner}>
          <WorldPanel
            onChange={updateWorld}
            isSimulationRunning={simulation !== null}
          />
        </div>
      </ResizePanel>
    </ResizeLayout>
  )
}
