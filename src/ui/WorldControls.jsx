import {h} from "preact"
import {useContext, useEffect} from "preact/hooks"

import {render} from "../graphics"
import {Exception} from "../localization"
import {Logging} from "./Logging"
import {Icon} from "./Icon"
import {Sprite} from "./Sprite"

const keyMap = {
  ArrowUp: "step",
  ArrowDown: "stepBackwards",
  ArrowLeft: "turnLeft",
  ArrowRight: "turnRight",

  w: "step",
  s: "stepBackwards",
  a: "turnLeft",
  d: "turnRight",

  h: "placeBlock",
  H: "takeBlock",
  m: "placeMark",
  M: "takeMark",
}

export const WorldControls = ({world, disabled}) => {

  const log = useContext(Logging)

  const callWorldMethod = method => evt => {
    evt.preventDefault()
    try {
      world[method]()
      render(world)
    } catch (err) {
      if (err instanceof Exception) {
        log.error(err.translatedMessage)
      } else {
        log.error(err.message)
        console.error(err)
      }
    }
  }

  useEffect(() => {
    if (disabled) {
      return
    }
    function onKeyDown(evt) {
      if (evt.defaultPrevented
        || evt.target instanceof HTMLTextAreaElement
        || evt.target instanceof HTMLInputElement
      ) {
        return
      }
      const method = keyMap[evt.key]
      if (method) {
        callWorldMethod(method)(evt)
      }
    }
    addEventListener("keydown", onKeyDown)
    return () => removeEventListener("keydown", onKeyDown)
  }, [world, disabled, log])

  return (
    <div class="world-controls">
      <div class="item-controls">
        <button onClick={callWorldMethod("placeBlock")} disabled={disabled}>
          <Sprite block />
          <Icon sm faPlusCircle />
        </button>
        <button onClick={callWorldMethod("takeBlock")} disabled={disabled}>
          <Sprite block />
          <Icon sm faMinusCircle />
        </button>
        <button onClick={callWorldMethod("placeMark")} disabled={disabled}>
          <Sprite mark />
          <Icon sm faPlusCircle />
        </button>
        <button onClick={callWorldMethod("takeMark")} disabled={disabled}>
          <Sprite mark />
          <Icon sm faMinusCircle />
        </button>
      </div>
      <div class="movement-controls">
        <button onClick={callWorldMethod("turnLeft")} disabled={disabled}>
          <Icon faReply />
        </button>
        <div>
          <button onClick={callWorldMethod("step")} disabled={disabled}>
            <Icon faPlay transform={{rotate: 270}} />
          </button>
          <button onClick={callWorldMethod("stepBackwards")} disabled={disabled}>
            <Icon faPlay transform={{rotate: 90}} />
          </button>
        </div>
        <button onClick={callWorldMethod("turnRight")} disabled={disabled}>
          <Icon faReply transform={{flipX: true}} />
        </button>
      </div>
    </div>
  )
}
