import {JSX, VNode, cloneElement} from "preact"

import type {DivProps} from "../util/types"

// import * as classes from "./Appear.module.scss"


export type AppearProps = DivProps & {
  children: VNode<{style?: JSX.CSSProperties}>
  show: boolean
}

const hidden = {
  opacity: 0,
  transform: "scale(.75)",
}
const visible = {
  opacity: 1,
  transform: "none",
}

export const Appear = ({children, show}: AppearProps) =>
  cloneElement(children, {
    style: {
      transitionProperty: "opacity, transform",
      transformOrigin: "top center",
      ...children.props.style,
      ...(show ? visible : hidden),
    },
  })
