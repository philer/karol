import * as config from "./config"
import {translate as t, Exception} from "./localization"

import * as graphics from "./graphics"

import {run} from "./simulation/simulation"
import {World, checkKdwFormat, parseKdw, worldToKdwString} from "./simulation/world"

import {Editor} from "./ui/editor"
import "./ui/icons"

import {domReady, byId, byClass, clamp} from "./util"
import {readFile, saveTextAs} from "./util/files"


const keyMap = {
  ArrowLeft: "turnLeft",
  a: "turnLeft",
  ArrowRight: "turnRight",
  d: "turnRight",
  ArrowUp: "step",
  w: "step",
  ArrowDown: "stepBackwards",
  s: "stepBackwards",
  h: "placeBlock",
  H: "takeBlock",
  m: "placeMark",
  M: "takeMark",
}

let editor
let simulation
let world

let widthInput
let lengthInput
let heightInput

let runButton
let stopButton
let stepButton
let unpauseButton
let pauseButton
let simSpeedInput

let outputElem

function on(eventName, target, fn) {
  target.addEventListener(eventName, function(evt) {
    evt.preventDefault()
    fn.apply(this, arguments)
  })
}

function enable(...btns) {
  btns.map(btn => btn.removeAttribute("disabled"))
}

function disable(...btns) {
  btns.map(btn => btn.setAttribute("disabled", "disabled"))
}

function validateNumberInput() {
  const value = clamp(+this.min, +this.max, +this.value)
  if (+this.value !== value) {
    this.value = value
  }
}

function resetSimulation() {
  if (!simulation) {
    return
  }
  simulation.pause()
  simulation = null
  enable(runButton)
  disable(stopButton, stepButton, pauseButton, unpauseButton)
  editor.markLine()
}

function resetWorld() {
  resetSimulation()
  world = new World(...[widthInput, lengthInput, heightInput]
      .map(inp => clamp(+inp.min, +inp.max, +inp.value)))
}

async function callWorldMethod(action) {
  if (simulation) {
    return  // maybe allow it via config?
  }
  try {
    world[action]()
    graphics.render(world)
  } catch (err) {
    if (err instanceof Exception) {
      error(err.translatedMessage)
    } else {
      error(err.message)
      console.error(err)
    }
  }
}

function calculateDelay() {
  return Math.pow(10, 4 - simSpeedInput.value)
}

function initOutput() {
  outputElem = byId("world-output")
}

function info(message) {
  outputElem.innerHTML += `<p class="info-message">${message}</p>`
  outputElem.scrollTop = outputElem.scrollHeight
}

function error(message) {
  outputElem.innerHTML += `<p class="error-message">${message}</p>`
  outputElem.scrollTop = outputElem.scrollHeight
}


function initWorldSettings() {
  widthInput = byId("width-input")
  lengthInput = byId("length-input")
  heightInput = byId("height-input")

  const worldFileInput = byId("world-file-input")

  on("input", widthInput, validateNumberInput)
  on("input", lengthInput, validateNumberInput)
  on("input", heightInput, validateNumberInput)

  on("click", byId("world-new-button"), resetWorld)
  on("submit", byClass("world-settings")[0], resetWorld)

  on("click", byId("world-save-button"), () =>
    saveTextAs(worldToKdwString(world), t("world.default_filename")),
  )

  on("change", worldFileInput, async () => {
    const file = worldFileInput.files[0]
    const text = await readFile(file)
    if (checkKdwFormat(text)) {
      resetSimulation()
      world = parseKdw(text)
      widthInput.value = world.width
      lengthInput.value = world.length
      heightInput.value = world.height
    } else {
      error(t("error.invalid_world_file"))
    }
  })
}


function initGraphicsSettings() {
  const showPlayerCheckbox = byId("world-show-player")
  const showFlatWorldCheckbox = byId("world-show-flat")

  on("change", showPlayerCheckbox, () => {
    graphics.showPlayer(showPlayerCheckbox.checked)
    graphics.render(world)
  })
  graphics.showPlayer(showPlayerCheckbox.checked)

  on("change", showFlatWorldCheckbox, () => {
    graphics.showHeightNoise(!showFlatWorldCheckbox.checked)
    graphics.render(world)
  })
  graphics.showHeightNoise(!showFlatWorldCheckbox.checked)
}


function initWorldControls() {
  on("click", byId("world-step"), () => callWorldMethod("step"))
  on("click", byId("world-step-backwards"), () => callWorldMethod("stepBackwards"))
  on("click", byId("world-turn-left"), () => callWorldMethod("turnLeft"))
  on("click", byId("world-turn-right"), () => callWorldMethod("turnRight"))

  const placeBlockButton = byId("world-place-block")
  on("click", placeBlockButton, () => callWorldMethod("placeBlock"))
  placeBlockButton.insertAdjacentHTML("afterbegin", graphics.sprites.block.img())
  const takeBlockButton = byId("world-take-block")
  on("click", takeBlockButton, () => callWorldMethod("takeBlock"))
  takeBlockButton.insertAdjacentHTML("afterbegin", graphics.sprites.block.img())
  const placeMarkButton = byId("world-place-mark")
  on("click", placeMarkButton, () => callWorldMethod("placeMark"))
  placeMarkButton.insertAdjacentHTML("afterbegin", graphics.sprites.mark.img())
  const takeMarkButton = byId("world-take-mark")
  on("click", takeMarkButton, () => callWorldMethod("takeMark"))
  takeMarkButton.insertAdjacentHTML("afterbegin", graphics.sprites.mark.img())

  // key controls
  addEventListener("keydown", evt => {
    if (evt.defaultPrevented
        || evt.target instanceof HTMLTextAreaElement
        || evt.target instanceof HTMLInputElement)
    {
      return
    }
    const action = keyMap[evt.key]
    if (action) {
      evt.preventDefault()
      callWorldMethod(action)
    }
  })
}


function initEditorButtons() {
  const saveButton = byId("program-save-button")
  const programFileInput = byId("program-file-input")

  on("click", saveButton, () => {
    saveTextAs(editor.value, t("program.default_filename"))
  })
  on("change", programFileInput, async () => {
    resetSimulation()
    editor.value = await readFile(programFileInput.files[0])
  })
}


function initSimulationControls() {
  runButton = byId("run-button")
  stopButton = byId("stop-button")
  stepButton = byId("step-button")
  unpauseButton = byId("unpause-button")
  pauseButton = byId("pause-button")
  simSpeedInput = byId("world-simulation-speed")

  disable(stopButton, stepButton, pauseButton, unpauseButton)

  on("click", runButton, async () => {
    disable(runButton)
    enable(stopButton, stepButton, pauseButton)
    info(t("program.message.running"))
    try {
      simulation = run({
        code: editor.value,
        world,
        delay: calculateDelay(),
        onExecute: ({lineno}) => editor.markLine(lineno),
      })
      await simulation.finished
      info(t("program.message.finished"))
    } catch (err) {
      if (err instanceof Exception) {
        error(err.translatedMessage)
      } else {
        error(err.message)
        console.error(err)
      }
      info(t("program.message.canceled"))
    } finally {
      resetSimulation()
    }
  })

  on("click", stopButton, () => {
    resetSimulation()
    info(t("program.message.canceled"))
  })
  on("click", stepButton, () => {
    simulation.step()
  })
  on("click", pauseButton, () => {
    info(t("program.message.paused"))
    disable(pauseButton)
    enable(unpauseButton)
  })
  on("click", unpauseButton, () => {
    simulation.resume()
    info(t("program.message.running"))
    disable(unpauseButton)
    enable(pauseButton)
  })
  on("change", simSpeedInput, () => {
    if (simulation) {
      simulation.setDelay(calculateDelay())
    }
  })
}


/*** MAIN INIT ***/
(async function init() {
  const editorTheme = (await config.get()).editor_theme || "bright"
  byId("editor-theme-stylesheet").href = `css/editor-theme-${editorTheme}.css`

  await Promise.all([graphics.init(), domReady])

  initOutput()
  initWorldSettings()
  initGraphicsSettings()
  initWorldControls()
  initEditorButtons()
  initSimulationControls()

  resetWorld()
  graphics.render(world)

  editor = new Editor(byId("editor"))
})()
