import {ComponentChild, JSX, h} from "preact"
import {useEffect, useRef, useState} from "preact/hooks"

import css from "./Resizable.module.css"

export type DivProps = JSX.HTMLAttributes<HTMLDivElement>

export type ResizableProps = DivProps & {
  top?: boolean
  left?: boolean
  right?: boolean
  bottom?: boolean
  children?: ComponentChild
}

type Direction = "top" | "left" | "right" | "bottom"
type DragState = {
  direction: Direction
  handle: HTMLDivElement
}


export const Resizable = (props: ResizableProps) => {
  const {
    top=false,
    left=false,
    right=false,
    bottom=false,
    children,
    ...divProps
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [style] = useState<JSX.CSSProperties>(() => ({
    display: "grid",
    gridTemplateRows: [
      top && "[top-row-start] 1px",
      "[center-row-start] 1fr [center-row-end]",
      bottom && "1px [bottom-row-end]",
    ].filter(Boolean).join(" "),
    gridTemplateColumns: [
      left && "[left-col-start] 1px",
      "[center-col-start] 1fr [center-col-end]",
      right && "1px [right-col-end]",
    ].filter(Boolean).join(" "),
  }))

  useEffect(() => {
    if (drag) {
      addEventListener("mousemove", handleDrag)
      return () => removeEventListener("mousemove", handleDrag)
    }
  }, [drag])

  const handleDragStart = (direction: Direction) => ({target}: MouseEvent) =>
    setDrag(target && {direction, handle: target as HTMLDivElement})

  const handleDragEnd = () =>
    setDrag(null)

  function handleDrag(evt: MouseEvent) {
    if (!(evt.buttons & 1)) {
      handleDragEnd()
    }
    if (!containerRef.current || !drag) {
      return
    }
    const rect = containerRef.current.getBoundingClientRect()
    const delta = evt.clientX - rect.right
    const width = rect.width + delta + "px"
    style.width = width
    containerRef.current.style.width = width
  }

  const Handle = ({direction}: {direction: Direction}) =>
    !props[direction] ? null : (
      <div class={css[direction]} onMouseDown={handleDragStart(direction)}>
        <div />
      </div>
    )

  return (
    <div {...divProps} ref={containerRef} style={style}>
      <Handle direction="top" />
      <Handle direction="left" />
      {children}
      <Handle direction="right" />
      <Handle direction="bottom" />
    </div>
  )
}
