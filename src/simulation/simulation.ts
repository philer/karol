import {BuiltinCall, Value, run as runInterpreter} from "../language/interpreter"
import {render} from "../graphics"
import type {World, WorldInteraction} from "./world"
import {noop} from "../util"

const commandNames: Record<string, keyof WorldInteraction> = {
  linksdrehen: "turnLeft",
  rechtsdrehen: "turnRight",

  istwand: "isLookingAtEdge",
  nichtistwand: "isNotLookingAtEdge",
  schritt: "step",
  schrittzurück: "stepBackwards",
  schrittzurueck: "stepBackwards",

  istziegel: "isLookingAtBlock",
  nichtistziegel: "isNotLookingAtBlock",
  hinlegen: "placeBlock",
  aufheben: "takeBlock",

  istmarke: "isOnMark",
  nichtistmarke: "isNotOnMark",
  markesetzen: "placeMark",
  markelöschen: "takeMark",
  markeloeschen: "takeMark",
}

export interface RunProps {
  code: string
  delay: number
  world: World
  onExecute: (call: BuiltinCall) => void
}

export function run(props: RunProps) {
  const {code, world, onExecute = noop} = props
  let {delay = 200} = props

  let setFinished: (value?: never) => void
  let setError: (reason?: any) => void
  const finished = new Promise((resolve, reject) => {
    setFinished = resolve
    setError = reject
  })

  let isPaused = false
  let timeoutId: number
  let result: Value

  const gen = runInterpreter(code, Object.keys(commandNames))

  function tick() {
    try {
      const {value, done} = gen.next(result) as {value: BuiltinCall, done: boolean}
      if (done) {
        return setFinished()
      }
      onExecute(value)
      const {identifier, args} = value
      result = world[commandNames[identifier]](...args as any) as Value
      if (result === undefined) {
        render(world)
      }
      if (!isPaused) {
        // TODO Are there any drawbacks to using setInterval instead?
        timeoutId = window.setTimeout(tick, delay)
      }
    } catch (err) {
      setError(err)
    }
  }

  tick()

  function pause() {
    if (!isPaused) {
      clearTimeout(timeoutId)
      isPaused = true
    }
  }

  function resume() {
    if (isPaused) {
      isPaused = false
      tick()
    }
  }

  function step() {
    clearTimeout(timeoutId)
    tick()
  }

  function setDelay(ms: number) {
    delay = ms
    // For a more fancy approach we could track the last execution time
    // and reset the pending timeout accordingly.
  }

  return {finished, pause, resume, step, setDelay}
}
