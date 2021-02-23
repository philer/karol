import {h, cloneElement, toChildArray, ComponentChild, VNode} from "preact"

import {clsx} from "../util"

import style from "./Tooltip.css"

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
    {class: clsx(style.wrapper, children.props.class)},
    ...toChildArray(children.props.children),
    <span class={`${style.tooltip} ${style[direction]}`}>{tip}</span>,
  )
}
