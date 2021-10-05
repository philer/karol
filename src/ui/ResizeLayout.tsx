import {ComponentChildren, Fragment, JSX, VNode, h} from "preact"
import {useEffect, useRef, useState} from "preact/hooks"

import {clamp, clsx, zip} from "../util"

import * as style from "./ResizeLayout.module.css"

export type CSSUnit =
  | "%"
  | "em" | "rem" | "ex" | "ch" | "lh"
  | "vw" | "vh" | "vmin" | "vmax"
  | "px" | "pt" | "cm" | "pc" | "in" | "mm" | "Q"

export type CSSLength = `${number}${CSSUnit}`

export interface ResizePanelProps {
  key: string
  size?: number | CSSLength
  minSize?: number
  maxSize?: number
  class?: string
  children?: ComponentChildren
}

export const ResizePanel = (_props: ResizePanelProps) => null

interface PanelSpec {
  key: string
  size: number
  max: number
  min: number
  class?: string
  css: JSX.CSSProperties
  children: ComponentChildren
}

const maxGrow = (panels: PanelSpec[]) =>
  panels.reduce((acc, {size, max}) => acc + max - size, 0)

const maxShrink = (panels: PanelSpec[]) =>
  panels.reduce((acc, {size, min}) => acc + size - min, 0)

export interface ResizeLayoutProps {
  class?: string
  vertical?: true
  children: VNode<ResizePanelProps>[] | VNode<ResizePanelProps>
}

export const ResizeLayout = (props: ResizeLayoutProps) => {
  const {class: class_, vertical, children} = props
  const childArray = Array.isArray(children) ? children: [children]

  // const panelRefs = useRef<HTMLDivElement[]>([])

  const draggingRef = useRef<HTMLDivElement | null>(null)
  const [draggingIdx, setDraggingIdx] = useState<number>(0)
  const panelDivRefs = useRef<HTMLDivElement[]>([])

  // const getInitialSizes = () => childArray.map(({props: {size = 1}}) => size)
  // const [sizes, setSizes] = useState<number[]>(getInitialSizes)

  const initPanelSpecs = () => childArray.map<PanelSpec>(({key, props, props: {size, minSize, maxSize}}) => ({
    key,
    children: props.children,
    class: props.class,
    size: -1,
    min: minSize ?? 0,
    max: maxSize ?? Infinity,
    css: {
      [`min-${vertical ? "height" : "width"}`]: minSize ? `${minSize}px` : "0",
      [`max-${vertical ? "height" : "width"}`]: maxSize ? `${maxSize}px` : "100%",
      flex: size === undefined
        ? "auto 1 1"
        : typeof size === "number" ? `${size}px 0 0` : `${size} 0 0`
      ,
    },
  }))
  const [panels, setPanels] = useState<PanelSpec[]>(initPanelSpecs)

  useEffect(
    () => setPanels(initPanelSpecs()),
    [childArray.map(child => child.key).join(":")],
  )

  const handleDragStart = (idx: number) => ({target}: MouseEvent) => {
    draggingRef.current = target as HTMLDivElement
    setDraggingIdx(idx)
  }

  const handleDragEnd = () => {
    draggingRef.current = null
  }

  function handleDrag(evt: MouseEvent) {
    if (!(draggingRef.current && evt.buttons & 1)) {
      return
    }
    // if (evt.target !== draggingRef.current) {
    //   return
    // }

    const requestedDistance = vertical ? evt.movementY : evt.movementX

    for (const [panel, div] of zip(panels, panelDivRefs.current)) {
      panel.size = vertical ? div.offsetHeight : div.offsetWidth
    }

    const frontPanels = panels.slice(0, draggingIdx)
    const rearPanels = panels.slice(draggingIdx)

    const distance = requestedDistance < 0
      ? Math.max(-maxShrink(frontPanels), requestedDistance, -maxGrow(rearPanels))
      : Math.min(+maxGrow(frontPanels), requestedDistance, +maxShrink(rearPanels))

    let remaining = distance
    zip(panels, panelDivRefs.current).forEach(([panel, div], idx) => {
      const size = clamp(panel.min, panel.max, panel.size + remaining)
      remaining += panel.size - size
      panel.size = size
      panel.css.flex = `${size}px 0 0`
      div.style.setProperty("flex", panel.css.flex)
      if (idx === draggingIdx - 1) {
        remaining = -distance
      }
    })
  }

  const setPanelDivRef = (idx: number) => (div: HTMLDivElement) => {
    panelDivRefs.current[idx] = div
  }

  return (
    <div
      class={clsx(
        class_,
        style.container,
        vertical && style.vertical,
      )}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
    >
      {panels.map(({key, css, children, class: class_}, idx) =>
        <Fragment key={key}>
          {idx > 0 && (
            <div
              class={style.separator}
              onMouseDown={handleDragStart(idx)}
            >
              <div>{vertical ? "⋯" : "⋮"}</div>
            </div>
          )}
          <div
            ref={setPanelDivRef(idx)}
            class={clsx(style.panel, class_)}
            style={css}
          >
            {children}
          </div>
        </Fragment>,
      )}
    </div>
  )
}
