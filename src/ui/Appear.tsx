import {JSX, VNode, cloneElement} from "preact"
import {useEffect, useState} from "preact/hooks"

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

export const Appear = ({children, show}: AppearProps) => {

  const [shouldBeMounted, setShouldBeMounted] = useState(show)
  const [shouldBeVisible, setShouldBeVisible] = useState(show)

  useEffect(() => {
    if (show && !shouldBeMounted) {
      setShouldBeMounted(true)
    } else if (!show) {
      setShouldBeVisible(false)
    }
  }, [show])

  if (!shouldBeMounted) {
    return null
  }
  return cloneElement(children, {
    ref: (elem: HTMLElement) => {
      if (show && elem && !shouldBeVisible) {
        // force browser to layout so CSS transition will trigger
        elem.clientHeight
        setShouldBeVisible(true)
      }
    },
    style: {
      transitionProperty: "opacity, transform",
      transformOrigin: "top center",
      ...children.props.style,
      ...(shouldBeVisible ? visible : hidden),
    },
    onTransitionend: () => {
      if (!show) {
        setShouldBeMounted(false)
      }
    },
  })
}
