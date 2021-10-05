import {ComponentChildren, Fragment, JSX, VNode, h} from "preact"
import {useEffect, useRef, useState} from "preact/hooks"

import {clamp, clsx, zip} from "../util"

import * as style from "./ResizeLayout.module.css"

export interface ResizePanelProps {
  key: string
  size?: number
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

  const initPanelSpecs = () => childArray.map<PanelSpec>(({key, props, props: {minSize, maxSize}}) => ({
    key,
    children: props.children,
    class: props.class,
    size: props.size,
    min: minSize ?? 0,
    max: maxSize ?? Infinity,
    css: vertical
      ? {
        "min-height": minSize ? `${minSize}px` : "0",
        "max-height": maxSize ? `${maxSize}px` : "100%",
      } as JSX.CSSProperties
      : {
        "min-width": minSize ? `${minSize}px` : "0",
        "max-width": maxSize ? `${maxSize}px` : "100%",
      } as JSX.CSSProperties,
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

    let frontPanels = panels.slice(0, draggingIdx)
    let rearPanels = panels.slice(draggingIdx)

    const distance = requestedDistance < 0
      ? Math.max(-maxShrink(frontPanels), requestedDistance, -maxGrow(rearPanels))
      : Math.min(+maxGrow(frontPanels), requestedDistance, +maxShrink(rearPanels))

    let remaining = distance

    frontPanels = frontPanels.map(panel => {
      const size = clamp(panel.min, panel.max, panel.size + remaining)
      remaining += panel.size - size
      return {...panel, size}
    })

    remaining = -distance

    rearPanels = rearPanels.map(panel => {
      const size = clamp(panel.min, panel.max, panel.size + remaining)
      remaining += panel.size - size
      return {...panel, size}
    })

    setPanels([...frontPanels, ...rearPanels])
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
      {panels.map(({key, css, size, children, class: _class}, idx) =>
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
            class={clsx(style.panel, _class)}
            style={{...css, flex: idx === 0 || size === null ? "100% 1 1" : `${size}px 0 0`}}
          >
            {children}
          </div>
        </Fragment>,
      )}
    </div>
  )
}
