import {h} from "preact"
import {useCallback, useContext, useEffect} from "preact/hooks"

import {render} from "../graphics"
import {Exception} from "../localization"
import {Logging} from "./Logging"
import {IconPlusCircle, IconMinusCircle, IconReply, IconPlay} from "./Icon"
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

  const callWorldMethod = useCallback(method => evt => {
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
  }, [world, log])

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
  }, [disabled, callWorldMethod])

  return (
    <div class="world-controls">
      <div class="item-controls">
        <button onClick={callWorldMethod("placeBlock")} disabled={disabled}>
          <Sprite block />
          <IconPlusCircle sm />
        </button>
        <button onClick={callWorldMethod("takeBlock")} disabled={disabled}>
          <Sprite block />
          <IconMinusCircle sm />
        </button>
        <button onClick={callWorldMethod("placeMark")} disabled={disabled}>
          <Sprite mark />
          <IconPlusCircle sm />
        </button>
        <button onClick={callWorldMethod("takeMark")} disabled={disabled}>
          <Sprite mark />
          <IconMinusCircle sm />
        </button>
      </div>
      <div class="movement-controls">
        <button onClick={callWorldMethod("turnLeft")} disabled={disabled}>
          <IconReply />
        </button>
        <div>
          <button onClick={callWorldMethod("step")} disabled={disabled}>
            <IconPlay transform={{rotate: 270}} />
          </button>
          <button onClick={callWorldMethod("stepBackwards")} disabled={disabled}>
            <IconPlay transform={{rotate: 90}} />
          </button>
        </div>
        <button onClick={callWorldMethod("turnRight")} disabled={disabled}>
          <IconReply transform={{flipX: true}} />
        </button>
      </div>
    </div>
  )
}
