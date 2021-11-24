import {ComponentChildren, Fragment, JSX, VNode, h} from "preact"
import {useEffect, useRef, useState} from "preact/hooks"

import {clamp, clsx} from "../util"

import * as style from "./ResizeLayout.module.css"

export type CSSUnit =
  | "%"
  | "em" | "rem" | "ex" | "ch" | "lh"
  | "vw" | "vh" | "vmin" | "vmax"
  | "px" | "pt" | "cm" | "pc" | "in" | "mm" | "Q"

export type CSSLength = `${number}${CSSUnit}`

export type ResizePanelProps = {
  key: string
  size?: number | CSSLength
  minSize?: number
  maxSize?: number
  class?: string
  children?: ComponentChildren
}

export const ResizePanel = (_props: ResizePanelProps) => null

type PanelSpec = {
  key: string
  size: number
  max: number
  min: number
  class?: string
  css: JSX.CSSProperties
  div: HTMLDivElement
  children: ComponentChildren
}

const maxGrow = (panels: PanelSpec[]) =>
  panels.reduce((acc, {size, max}) => acc + max - size, 0)

const maxShrink = (panels: PanelSpec[]) =>
  panels.reduce((acc, {size, min}) => acc + size - min, 0)

type DragState = {
  target: HTMLDivElement
  index: number
}

export type ResizeLayoutProps = {
  class?: string
  vertical?: true
  children: VNode<ResizePanelProps>[] | VNode<ResizePanelProps>
}

export const ResizeLayout = (props: ResizeLayoutProps) => {
  const {class: class_, vertical, children} = props
  const childArray = Array.isArray(children) ? children: [children]

  // We're maintaining most of our state in a PanelSpec[] array, which will be
  // mutated in place by various operations that need to be fast.
  // Using react state setters triggers re-renders, causing significant lag.
  const initPanels = () => childArray.map<PanelSpec>(
    ({key, props, props: {size, minSize, maxSize}}) => ({
      key,
      children: props.children,
      class: props.class,
      size: -1,
      min: minSize ?? 0,
      max: maxSize ?? Infinity,
      div: null as unknown as HTMLDivElement,
      css: {
        [`min-${vertical ? "height" : "width"}`]: minSize ? `${minSize}px` : "0",
        [`max-${vertical ? "height" : "width"}`]: maxSize ? `${maxSize}px` : "100%",
        flex: size === undefined
          ? "auto 1 1"
          : typeof size === "number" ? `${size}px 0 0` : `${size} 0 0`
        ,
      },
    }),
  )
  const [panels, setPanels] = useState(initPanels)
  useEffect(
    () => setPanels(initPanels()),
    [childArray.map(child => child.key).join(":")],
  )

  // We track panel sizes via ResizeObserver. A dedicated Map<div, PanelSpec>
  // allows quick updates.
  const [divsToPanels] = useState(() => new Map())
  const [resizeObserver] = useState(() => new ResizeObserver(entries => {
    for (const {target, contentRect} of entries) {
      const panel = divsToPanels.get(target as HTMLDivElement)
      if (panel) {
        panel.size = vertical ? contentRect.height : contentRect.width
      }
    }
  }))

  // Keep panels, resizeObserver and divsToPanel up-to-date with DOM state
  const setPanelDiv = (idx: number) => (div: HTMLDivElement) => {
    const panel = panels[idx]
    if (div) {
      resizeObserver.observe(div)
    }
    if (panel.div) {
      resizeObserver.unobserve(panel.div)
    }
    panel.div = div
    divsToPanels.set(div, panel)
  }

  // Track active dragging action
  const dragStateRef = useRef<DragState | null>(null)

  const handleDragStart = (index: number) => ({target}: MouseEvent) => {
    dragStateRef.current = {
      target: target as HTMLDivElement,
      index,
    }
  }

  const handleDragEnd = () => {
    dragStateRef.current = null
  }

  const handleDrag = (evt: MouseEvent) => {
    if (!dragStateRef.current) {
      return
    }
    if (!(evt.buttons & 1)) {
      return handleDragEnd()
    }

    const {target, index} = dragStateRef.current
    const separatorRect = target.getBoundingClientRect()

    const requestedDistance = vertical
      ? evt.clientY - separatorRect.top - .5 * separatorRect.height
      : evt.clientX - separatorRect.left - .5 * separatorRect.width

    const frontPanels = panels.slice(0, index)
    const rearPanels = panels.slice(index)

    const distance = requestedDistance < 0
      ? Math.max(-maxShrink(frontPanels), requestedDistance, -maxGrow(rearPanels))
      : Math.min(+maxGrow(frontPanels), requestedDistance, +maxShrink(rearPanels))

    let remaining = distance
    const updatePanel = (panel: PanelSpec) => {
      const size = clamp(panel.min, panel.max, panel.size + remaining)
      remaining += panel.size - size
      panel.size = size
      panel.css.flex = `${size}px 0 0`
      panel.div.style.setProperty("flex", panel.css.flex)
    }
    frontPanels.reverse().forEach(updatePanel)
    remaining = -distance
    rearPanels.slice(0, -1).forEach(updatePanel)
  }

  return (
    <div
      class={clsx(class_, style.container, vertical && style.vertical)}
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
            ref={setPanelDiv(idx)}
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
