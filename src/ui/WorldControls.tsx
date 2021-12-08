import {Fragment, h} from "preact"
import {useCallback, useContext, useEffect} from "preact/hooks"

import {render} from "../graphics"
import {Exception} from "../exception"
import {translate as t} from "../localization"
import type {Builtins, World} from "../simulation/world"
import {Logging} from "./Logging"
import {IconMinusCircle, IconPlay, IconPlusCircle, IconReply} from "./Icon"
import {Sprite} from "./Sprite"
import {Tooltip} from "./Tooltip"

import * as classes from "./WorldControls.module.scss"

const keyMap: Record<string, keyof Builtins> = {
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

  const callBuiltin = useCallback(
    (method: keyof Builtins) => (evt: KeyboardEvent | MouseEvent) => {
      evt.preventDefault()
      try {
        world[method]()
        render(world)
      } catch (err) {
        if (err instanceof Exception) {
          log.error(err)
        } else {
          log.error(err instanceof Error ? err.message : `${err}`)
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
        callBuiltin(method)(evt)
      }
    }
    addEventListener("keydown", onKeyDown)
    return () => removeEventListener("keydown", onKeyDown)
  }, [disabled, callBuiltin])

  return (
    <>
      <div class={classes.itemControls}>
        <Tooltip left tip={t("world.action.placeBlock")}>
          <button
            class={classes.button}
            onClick={callBuiltin("placeBlock")}
            disabled={disabled}
          ><Sprite block /><IconPlusCircle sm /></button>
        </Tooltip>
        <Tooltip left tip={t("world.action.takeBlock")}>
          <button
            class={classes.button}
            onClick={callBuiltin("takeBlock")}
            disabled={disabled}
          ><Sprite block /><IconMinusCircle sm /></button>
        </Tooltip>
        <Tooltip left tip={t("world.action.placeMark")}>
          <button
            class={classes.button}
            onClick={callBuiltin("placeMark")}
            disabled={disabled}
          ><Sprite mark /><IconPlusCircle sm /></button>
        </Tooltip>
        <Tooltip left tip={t("world.action.takeMark")}>
          <button
            class={classes.button}
            onClick={callBuiltin("takeMark")}
            disabled={disabled}
          ><Sprite mark /><IconMinusCircle sm /></button>
        </Tooltip>
      </div>
      <div class={classes.movementControls}>
        <Tooltip left tip={t("world.action.turnLeft")}>
          <button
            class={classes.button}
            onClick={callBuiltin("turnLeft")}
            disabled={disabled}
          ><IconReply /></button></Tooltip>
        <Tooltip above tip={t("world.action.step")}>
          <button
            class={classes.button}
            onClick={callBuiltin("step")}
            disabled={disabled}
          ><IconPlay transform={{rotate: 270}} /></button></Tooltip>
        <Tooltip left tip={t("world.action.stepBackwards")}>
          <button
            class={classes.button}
            onClick={callBuiltin("stepBackwards")}
            disabled={disabled}
          ><IconPlay transform={{rotate: 90}} /></button></Tooltip>
        <Tooltip left tip={t("world.action.turnRight")}>
          <button
            class={classes.button}
            onClick={callBuiltin("turnRight")}
            disabled={disabled}
          ><IconReply transform={{flipX: true}} /></button></Tooltip>
      </div>
    </>
  )
}
