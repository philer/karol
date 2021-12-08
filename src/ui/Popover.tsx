import {ComponentChildren, h, JSX} from "preact"
import {useEffect, useRef, useState} from "preact/hooks"

import {clsx} from "../util"
import type {DivProps} from "../util/types"
import {Appear} from "./Appear"
import {IconTimes} from "./Icon"

import * as classes from "./Popover.module.scss"

export type Orientation =
  | `${"above" | "below"} ${"left" /*| "center"*/ | "right"}`
  | `${"left" | "right"} ${"top" /*| "center"*/ | "bottom"}`


export type PopoverProps = DivProps & {
  children: ComponentChildren
  title?: string
  show: boolean
  autoClose?: boolean
  onClose: () => void
  anchor?: HTMLElement | null
  orientation: Orientation
}


export const Popover = ({
  children,
  title,
  show,
  autoClose,
  onClose,
  anchor,
  orientation,
  ...divProps
}: PopoverProps) => {
  const ref = useRef<HTMLDivElement>(null)

  const [resizeObserver, setResizeObserver] = useState<ResizeObserver | null>(null)

  useEffect(() => {
    if (anchor) {
      const observer = new ResizeObserver(() => {
        if (ref.current) {
          Object.assign(ref.current.style, orientationStyle(anchor, orientation))
        }
      })
      observer.observe(anchor)
      setResizeObserver(observer)
    }
    return () => resizeObserver?.disconnect()
  }, [anchor, orientation, ref.current])

  useEffect(() => {
    if (autoClose && show) {
      const clickAwayListener = (evt: Event) => {
        if (evt.composedPath().indexOf(ref.current as HTMLElement) === -1) {
          onClose()
        }
      }
      document.addEventListener("click", clickAwayListener)
      return () => document.removeEventListener("click", clickAwayListener)
    }
  }, [autoClose, show, ref.current])

  if (!anchor) {
    return null
  }
  return (
    <Appear show={show}>
      <div
        {...divProps}
        ref={ref}
        class={clsx(classes.root, divProps.class)}
        style={orientationStyle(anchor, orientation)}
      >
        {title && (
          <header class={classes.header}>
            <h3>{title}</h3>
            <button class={classes.closeButton} onClick={onClose}>
              <IconTimes fw />
            </button>
          </header>
        )}
        {children}
      </div>
    </Appear>
  )
}

function orientationStyle(anchor: HTMLElement, orientation: Orientation): JSX.CSSProperties {
  const {offsetTop, offsetLeft, offsetHeight, offsetWidth} = anchor
  const {clientWidth, clientHeight} = anchor.offsetParent as HTMLElement
  const [first, second] = orientation.split(" ") as
    ["above"|"below"|"left"|"right", "left"|"right"|"top"|"bottom"]
  const firstProps = {
    above: {bottom: offsetTop + offsetHeight + "px"},
    below: {top: offsetTop + offsetHeight + "px"},
    left: {right: clientWidth - offsetLeft + "px"},
    right: {left: offsetLeft + offsetWidth + "px"},
  }
  const secondProps = {
    left: {left: offsetLeft + "px"},
    right: {right: clientWidth - offsetLeft - offsetWidth + "px"},
    top: {top: offsetTop + "px"},
    bottom: {bottom: clientHeight - offsetTop - offsetHeight + "px"},
  }
  const transformOriginsFirst = {above: "bottom", below: "top", left: "right", right: "left"}
  return {
    transformOrigin: transformOriginsFirst[first] + " " + second,
    ...firstProps[first],
    ...secondProps[second],
  }
}

