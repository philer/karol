import {cloneElement, ComponentChild, h, toChildArray, VNode} from "preact"

import {clsx} from "../util"

import * as classes from "./Tooltip.module.css"

export type Direction = "above" | "below" | "left" | "right"

export interface TooltipProps extends Partial<Record<Direction, boolean>> {
  children: VNode<{class?: string}>
  tip: ComponentChild
}

export const Tooltip = ({children, tip, ...rest}: TooltipProps) => {
  const directionEntry = Object.entries(rest).find(([_, value]) => value === true)
  const direction = directionEntry ? directionEntry[0] as Direction : "below"
  return cloneElement(
    children,
    {class: clsx(classes.wrapper, children.props.class)},
    ...toChildArray(children.props.children),
    <span class={clsx(classes.tooltip, classes[direction])}>{tip}</span>,
  )
}
