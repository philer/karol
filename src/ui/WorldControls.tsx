import {h} from "preact"
import {useCallback, useContext, useEffect} from "preact/hooks"

import {render} from "../graphics"
import {Exception, translate as t} from "../localization"
import type {World, WorldInteraction} from "../simulation/world"
import {Logging} from "./Logging"
import {IconMinusCircle, IconPlay, IconPlusCircle, IconReply} from "./Icon"
import {Sprite} from "./Sprite"
import {Tooltip} from "./Tooltip"

import * as style from "./WorldControls.css"

const keyMap: Record<string, keyof WorldInteraction> = {
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

export interface WorldControlsProps {
  world: World
  disabled?: boolean
}

export const WorldControls = ({world, disabled}: WorldControlsProps) => {

  const log = useContext(Logging)

  const callWorldMethod = useCallback(
    (method: keyof WorldInteraction) => (evt: KeyboardEvent | MouseEvent) => {
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
    },
    [world, log],
  )

  useEffect(() => {
    if (disabled) {
      return
    }
    function onKeyDown(evt: KeyboardEvent) {
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
    <>
      <div class={style.itemControls}>
        <Tooltip left tip={t("world.action.placeBlock")}>
          <button
            class={style.button}
            onClick={callWorldMethod("placeBlock")}
            disabled={disabled}
          ><Sprite block /><IconPlusCircle sm /></button>
        </Tooltip>
        <Tooltip left tip={t("world.action.takeBlock")}>
          <button
            class={style.button}
            onClick={callWorldMethod("takeBlock")}
            disabled={disabled}
          ><Sprite block /><IconMinusCircle sm /></button>
        </Tooltip>
        <Tooltip left tip={t("world.action.placeMark")}>
          <button
            class={style.button}
            onClick={callWorldMethod("placeMark")}
            disabled={disabled}
          ><Sprite mark /><IconPlusCircle sm /></button>
        </Tooltip>
        <Tooltip left tip={t("world.action.takeMark")}>
          <button
            class={style.button}
            onClick={callWorldMethod("takeMark")}
            disabled={disabled}
          ><Sprite mark /><IconMinusCircle sm /></button>
        </Tooltip>
      </div>
      <div class={style.movementControls}>
        <Tooltip left tip={t("world.action.turnLeft")}>
          <button
            class={style.button}
            onClick={callWorldMethod("turnLeft")}
            disabled={disabled}
          ><IconReply /></button></Tooltip>
        <div>
          <Tooltip above tip={t("world.action.step")}>
            <button
              class={style.button}
              onClick={callWorldMethod("step")}
              disabled={disabled}
            ><IconPlay transform={{rotate: 270}} /></button></Tooltip>
          <Tooltip below tip={t("world.action.stepBackwards")}>
            <button
              class={style.button}
              onClick={callWorldMethod("stepBackwards")}
              disabled={disabled}
            ><IconPlay transform={{rotate: 90}} /></button></Tooltip>
        </div>
        <Tooltip left tip={t("world.action.turnRight")}>
          <button
            class={style.button}
            onClick={callWorldMethod("turnRight")}
            disabled={disabled}
          ><IconReply transform={{flipX: true}} /></button></Tooltip>
      </div>
    </>
  )
}
