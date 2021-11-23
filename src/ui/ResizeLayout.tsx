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

  const dragStateRef = useRef<DragState | null>(null)

  const initPanelSpecs = () => childArray.map<PanelSpec>(({key, props, props: {size, minSize, maxSize}}) => ({
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
  }))
  const [panels, setPanels] = useState<PanelSpec[]>(initPanelSpecs)

  useEffect(
    () => setPanels(initPanelSpecs()),
    [childArray.map(child => child.key).join(":")],
  )

  const setPanelDiv = (idx: number) => (div: HTMLDivElement) => {
    panels[idx].div = div
  }

  const handleDragStart = (index: number) => ({target}: MouseEvent) => {
    dragStateRef.current = {
      target: target as HTMLDivElement,
      index,
    }
  }

  const handleDragEnd = () => {
    dragStateRef.current = null
  }

  function handleDrag(evt: MouseEvent) {
    if (!dragStateRef.current) {
      return
    }
    if (!(evt.buttons & 1)) {
      return handleDragEnd()
    }

    const {target, index} = dragStateRef.current
    const separatorPosition = target.getBoundingClientRect()

    const requestedDistance = vertical
      ? evt.clientY - separatorPosition.top
      : evt.clientX - separatorPosition.left

    for (const panel of panels) {
      panel.size = vertical ? panel.div.offsetHeight : panel.div.offsetWidth
    }

    const frontPanels = panels.slice(0, index)
    const rearPanels = panels.slice(index)

    const distance = requestedDistance < 0
      ? Math.max(-maxShrink(frontPanels), requestedDistance, -maxGrow(rearPanels))
      : Math.min(+maxGrow(frontPanels), requestedDistance, +maxShrink(rearPanels))

    let remaining = distance
    frontPanels.reverse().concat(rearPanels).forEach((panel, idx) => {
      const size = clamp(panel.min, panel.max, panel.size + remaining)
      remaining += panel.size - size
      panel.size = size
      panel.css.flex = `${size}px 0 0`
      panel.div.style.setProperty("flex", panel.css.flex)
      if (idx === index - 1) {
        remaining = -distance
      }
    })
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
