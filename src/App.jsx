import {h, render, Fragment } from "preact"
import {useEffect, useRef, useState} from "preact/hooks"

import {Icon} from "./ui/icons"

import {translate as t, init as initLocalization, Exception} from "./localization"
import * as graphics from "./graphics"
import {World /* checkKdwFormat, parseKdw, worldToKdwString */} from "./simulation/world"
import {run} from "./simulation/simulation"
import {Editor} from "./ui/editor"
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

  const [world, setWorld] = useState(new World(width, height, length))
  const resetWorld = () => setWorld(new World(width, length, height))

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

  const [logMessages, setLogMessages] = useState([])
  const log = (level, message, ...data) => setLogMessages(logMessages => [
    ...logMessages,
    message instanceof Exception ? {...message, level} : {level, message, data},
  ])
  const info = (message, ...data) => log("info", message, ...data)
  const error = (message, ...data) => log("error", message, ...data)
  const logOutputRef = useRef()
  useEffect(
    () => setTimeout(
      logOutputRef.current?.scrollBy({top: 20, behavior: "smooth"}),
      50,
    ),
    [logMessages],
  )

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
                  onChange={evt => setShowPlayer(evt.target.value)} />
                <span>{t("world.show_player")}</span>
              </label>

              <i class="expander" />

              <button class="world-settings-close" onClick={toggleSettings}>
                <i class="fa fa-times" />
              </button>

              <input type="submit" class="hidden" />
            </form>

            <div>
              <canvas
                class="world-canvas"
                ref={graphics.setCanvas}
                width="600"
                height="400"
              >
                Your Browser needs to support HTML5
              </canvas>
            </div>

            {/*
            <div class="world-controls">
              <div class="movement-controls">
                <button id="world-turn-left">
                  <Icon faReply />
                </button>
                <div>
                  <button id="world-step">
                    <Icon faPlay transform={{rotate: 270}} />
                  </button>
                  <button id="world-step-backwards">
                    <Icon faPlay transform={{rotate: 90}} />
                  </button>
                </div>
                <button id="world-turn-right">
                  <Icon faReply transform={{flipX: true}} />
                </button>
              </div>
              <div class="item-controls">
                <button id="world-place-block">
                  <Icon sm faPlusCircle />
                </button>
                <button id="world-take-block">
                  <Icon sm faMinusCircle />
                </button>
                <button id="world-place-mark">
                  <Icon sm faPlusCircle />
                </button>
                <button id="world-take-mark">
                  <Icon sm faMinusCircle />
                </button>
              </div>
            </div>
            */}
          </div>

          <pre ref={logOutputRef} class="log-output">
            {logMessages.map(({level, message, data}, idx) =>
              // idx as key is fine as long as we only append
              <p key={idx} class={"log-" + level}>{t(message, ...data)}</p>,
            )}
          </pre>
        </div>
      </section>
    </>
  )
}


render(<App />, document.body)
