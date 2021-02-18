import {h, render, Fragment} from "preact"
import {useContext, useEffect, useState} from "preact/hooks"

import {Icon} from "./ui/Icon"

import {translate as t, init as initLocalization, Exception} from "./localization"
import * as graphics from "./graphics"
import {World /* checkKdwFormat, parseKdw, worldToKdwString */} from "./simulation/world"
import {run} from "./simulation/simulation"
import {Logging, LoggingProvider, LogOutput} from "./ui/Logging"
import {Editor} from "./ui/Editor"
import {WorldControls} from "./ui/WorldControls"
import {clamp, clsx} from "./util"

const MIN_SPEED = 1
const MAX_SPEED = 2.5

const initPromises = Promise.all([
  initLocalization(),
  graphics.init(),
])

const Separator = () => <i class="separator" />

const calculateDelay = speed => Math.pow(10, 4 - speed)

function App() {
  const {info, error} = useContext(Logging)

  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    initPromises.then(() => setIsLoading(false), console.error)
  }, [])

  const [code, setCode] = useState("")

  const [{width, length, height}, setSettings] = useState({
    width: 18,
    length: 7,
    height: 5,
  })
  const updateSetting = ({target: {name, min, max, value}}) =>
    setSettings(settings => ({...settings, [name]: clamp(min, max, value)}))

  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const toggleSettings = () => setIsSettingsVisible(visible => !visible)

  const [world, setWorld] = useState(new World(width, length, height))
  function resetWorld(evt) {
    evt?.preventDefault()
    setWorld(new World(width, length, height))
  }

  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState((MIN_SPEED + MAX_SPEED) / 2)
  function updateSpeed(value) {
    setSpeed(value)
    simulation?.setDelay(calculateDelay(value))
  }

  const [simulation, setSimulation] = useState(null)
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
      info("program.message.running")
      await simulation.finished
      info("program.message.finished")
      setSimulation(null)
    } catch (err) {
      if (err instanceof Exception) {
        error(err)
      } else {
        error(err.message)
        console.error(err)
      }
    }
  }
  function haltSimulation() {
    simulation.pause()
    info("program.message.canceled")
    setSimulation(null)
  }

  const [showFlat, setShowFlat] = useState(false)
  useEffect(() => graphics.showHeightNoise(!showFlat), [showFlat])
  const [showPlayer, setShowPlayer] = useState(true)
  useEffect(() => graphics.showPlayer(showPlayer), [showPlayer])
  useEffect(() => graphics.render(world), [world, showFlat, showPlayer])  // also initial

  if (isLoading) {
    return <span>Loading...</span>
  }

  return (
    <>
      <section class="panel editor-panel">
        <header><h2>{t("program.code")}</h2></header>

        <form class="editor-wrapper" onSubmit={evt => evt.preventDefault()}>
          <div class="editor-buttons">
            <button class="button">{t("program.save")}</button>
            <label class="button">
              <span>{t("program.load")}</span>
              <input type="file" class="hidden" id="program-file-input" />
            </label>
          </div>

          <Editor onChange={setCode} />

          <div class="editor-buttons">
            <button
              class="button run-button"
              disabled={simulation}
              onClick={runSimulation}
            >{t("program.run")}</button>
            <button
              class="button icon-button"
              disabled={!simulation || !isPaused}
              onClick={() => setIsPaused(false)}
            >
              <Icon faPlay />
            </button>
            <button
              class="button icon-button"
              disabled={!simulation || isPaused}
              onClick={() => setIsPaused(true)}
            >
              <Icon faPause />
            </button>
            <button
              class="button icon-button"
              disabled={!simulation}
              onClick={() => simulation?.step()}
            >
              <Icon faStepForward />
            </button>
            <button
              class="button icon-button"
              disabled={!simulation}
              onClick={haltSimulation}
            >
              <Icon faStop />
            </button>
          </div>
        </form>
      </section>

      <section class="panel world-panel">
        <header><h2>{t("world.world")}</h2></header>

        <div class="world-wrapper">
          <nav class="world-tools">
            <button class="button icon-button" onClick={toggleSettings}>
              <Icon faCog />
            </button>
            <Separator />
            <button class="button" onClick={resetWorld}>{t("world.new")}</button>
            {/*
            <Separator />
            <label class="button" for="world-file-input">{t("world.load")}</label>
            <input type="file" class="hidden" id="world-file-input" />
            <button class="button" id="world-save-button">{t("world.save")}</button>
            */}
            <Separator />
            <label class="button nohover">
              <span>{t("world.speed")}</span>:
              <input
                type="range"
                min={MIN_SPEED}
                max={MAX_SPEED}
                value={speed}
                step="any"
                onChange={evt => updateSpeed(evt.target.value)}
              />
            </label>
          </nav>

          <div class="world-canvas-container">

            <form
              class={clsx("world-settings", !isSettingsVisible && "hidden")}
              onSubmit={resetWorld}
            >
              <label>
                <span>{t("world.width")}</span>:
                <input type="number" name="width" min={1} max={100} value={width}
                  onChange={updateSetting} />
              </label>
              <label>
                <span>{t("world.length")}</span>:
                <input type="number" name="length" min={1} max={100} value={length}
                  onChange={updateSetting} />
              </label>
              <label>
                <span>{t("world.height")}</span>:
                <input type="number" name="height" min={1} max={25} value={height}
                  onChange={updateSetting} />
              </label>

              <Separator />

              <label>
                <input type="checkbox" checked={showFlat}
                  onChange={evt => setShowFlat(evt.target.checked)} />
                <span>{t("world.flat")}</span>
              </label>

              <Separator />

              <label>
                <input type="checkbox" checked={showPlayer}
                  onChange={evt => setShowPlayer(evt.target.checked)} />
                <span>{t("world.show_player")}</span>
              </label>

              <i class="expander" />

              <button class="world-settings-close" onClick={toggleSettings}>
                <Icon faTimes />
              </button>

              <input type="submit" class="hidden" />
            </form>

            <div class="world-canvas-box">
              <canvas
                class="world-canvas"
                ref={graphics.setCanvas}
                width="600"
                height="400"
              >
                Your Browser needs to support HTML5
              </canvas>
            </div>

            <WorldControls world={world} disabled={simulation !== null} />
          </div>

          <LogOutput />
        </div>
      </section>
    </>
  )
}


render(<LoggingProvider><App /></LoggingProvider>, document.body)
