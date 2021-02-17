import * as interpreter from "../language/interpreter"
import {render} from "../graphics"

import {noop} from "../util"

const commandNames = {
  "linksdrehen": "turnLeft",
  "rechtsdrehen": "turnRight",

  "istwand": "isLookingAtEdge",
  "nichtistwand": "isNotLookingAtEdge",
  "schritt": "step",
  "schrittzurück": "stepBackwards",
  "schrittzurueck": "stepBackwards",

  "istziegel": "isLookingAtBlock",
  "nichtistziegel": "isNotLookingAtBlock",
  "hinlegen": "placeBlock",
  "aufheben": "takeBlock",

  "istmarke": "isOnMark",
  "nichtistmarke": "isNotOnMark",
  "markesetzen": "placeMark",
  "markelöschen": "takeMark",
  "markeloeschen": "takeMark",
}

export function run(props) {
  const {
    code,
    world,
    onExecute = noop,
  } = props
  let {delay = 200} = props

  let setFinished, setError
  const finished = new Promise((resolve, reject) => {
    setFinished = resolve
    setError = reject
  })

  let timeoutId = "pending"
  let result

  const gen = interpreter.run(code, Object.keys(commandNames))

  function tick() {
    try {
      const {value, done} = gen.next(result)
      if (done) {
        return setFinished()
      }
      onExecute(value)
      const {identifier, args} = value
      result = world[commandNames[identifier]](...args)
      if (result === undefined) {
        render(world)
      }
      if (timeoutId) {
        // TODO Are there any drawbacks to using setInterval instead?
        timeoutId = setTimeout(tick, delay)
      }
    } catch (err) {
      setError(err)
    }
  }

  tick()

  function pause() {
    clearTimeout(timeoutId)
    timeoutId = undefined
  }

  function resume() {
    if (!timeoutId) {
      timeoutId = "pending"
      tick()
    }
  }

  function step() {
    const wasPaused = !timeoutId
    pause()
    tick()
    if (wasPaused) {
      pause()
    }
  }

  function setDelay(ms) {
    delay = ms
    // For a more fancy approach we could track the last execution time
    // and reset the pending timeout accordingly.
  }

  return {finished, pause, resume, step, setDelay}
}

