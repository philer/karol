import {cloneElement, VNode} from "preact"
import {useEffect, useRef, useState} from "preact/hooks"

import {mergeRefs} from "../util/preact"
import type {DivProps} from "../util/types"


export type AppearProps = DivProps & {
  children: VNode<HTMLElement>
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
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (show && !shouldBeMounted) {
      setShouldBeMounted(true)
    } else if (!show) {
      setShouldBeVisible(false)
    }
  }, [show])

  function handleMount(elem: HTMLElement) {
    if (show && elem && !shouldBeVisible) {
      // force browser to layout so CSS transition will trigger
      elem.clientHeight
      setShouldBeVisible(true)
    }
  }

  if (!shouldBeMounted) {
    return null
  }
  return cloneElement(children, {
    ref: mergeRefs(children.ref, ref, handleMount),
    style: {
      transitionProperty: "opacity, transform",
      transformOrigin: "top center",
      ...children.props.style,
      ...(shouldBeVisible ? visible : hidden),
    },
    onTransitionend: (evt: TransitionEvent) => {
      if (!show && evt.target === ref.current) {
        setShouldBeMounted(false)
      }
    },
  })
}
