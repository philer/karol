import {render} from "../graphics"
import {BuiltinCall, run as runInterpreter, Value} from "../language/interpreter"
import {LanguageSpecification} from "../language/specification"
import {noop} from "../util"
import type {World} from "./world"

export interface RunProps {
  code: string
  spec: LanguageSpecification
  world: World
  delay: number
  onExecute: (call: BuiltinCall) => void
}

export function run(props: RunProps) {
  const {code, spec, world, onExecute = noop} = props
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

  const gen = runInterpreter(code, spec)

  function tick() {
    try {
      const {value, done} = gen.next(result)
      if (done) {
        return setFinished()
      }
      onExecute(value)
      const {identifier, args} = value
      result = world[spec.builtins[identifier]](...args as any) as Value
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
