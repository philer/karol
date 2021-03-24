import {ComponentChildren, Fragment, VNode, h} from "preact"
import {useEffect, useRef, useState} from "preact/hooks"

import {clamp, clsx, sum} from "../util"

import * as style from "./ResizeLayout.css"

const SEPARATOR_WIDTH = 1

export interface ResizePanelProps {
  key: string
  size?: number
  class?: string
  children?: ComponentChildren
}

export const ResizePanel = (_props: ResizePanelProps) => null

export interface ResizeLayoutProps {
  class?: string
  vertical?: true
  children: VNode<ResizePanelProps>[] | VNode<ResizePanelProps>
}

export const ResizeLayout = (props: ResizeLayoutProps) => {
  const {class: class_, vertical, children} = props

  const childArray = Array.isArray(children) ? children: [children]
  const n = childArray.length

  const panelRefs = useRef<HTMLDivElement[]>([])

  const draggingRef = useRef<HTMLDivElement | null>(null)
  const [draggingIdx, setDraggingIdx] = useState<number>(0)

  const getSizes = () => childArray.map(({props: {size = 1}}) => size)
  const [sizes, setSizes] = useState<number[]>(getSizes)

  useEffect(
    () => setSizes(getSizes()),
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

    // @ts-ignore
    const rect = (evt.currentTarget as HTMLDivElement).getBoundingClientRect()
    const cursorOffset = vertical
      ? evt.clientY - rect.top
      : evt.clientX - rect.left
    const containerSize = vertical ? rect.height : rect.width
    const availableSize = containerSize - (n - 1) * SEPARATOR_WIDTH

    const frontSize = clamp(1, availableSize - 1,
      cursorOffset - (draggingIdx + 0.5) * SEPARATOR_WIDTH)
    const rearSize = availableSize - frontSize

    const panelSizes = panelRefs.current.map(
      vertical ? div => div.offsetHeight : div => div.offsetWidth)

    const frontSizes = panelSizes.slice(0, draggingIdx + 1)
    const rearSizes = panelSizes.slice(draggingIdx + 1)
    const frontSum = sum(frontSizes)
    const rearSum = sum(rearSizes)

    setSizes([
      ...frontSizes.map(size => (size / frontSum) * frontSize),
      ...rearSizes.map(size => (size / rearSum) * rearSize),
    ])
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
      {childArray.map(({key, props}, idx, {length}) =>
        <Fragment key={key}>
          <div
            ref={div => div && (panelRefs.current[idx] = div)}
            class={clsx(style.panel, props.class)}
            style={{
              flex: `${sizes[idx]}px ${props.size ? "0 0" : "1 1"}`,
            }}
          >
            {props.children}
          </div>
          {idx < length - 1 && <div
            class={style.separator}
            onMouseDown={handleDragStart(idx)}
          >
            <div>{vertical ? "⋯" : "⋮"}</div>
          </div>
          }
        </Fragment>,
      )}
    </div>
  )
}
