import {h} from "preact"
import {useState} from "preact/hooks"

import {Orientation, Popover} from "./Popover"

export const PopoverDemo = () => {
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)

  const Example = ({children}: {children: Orientation}) =>
    <Popover show onClose={() => 0} anchor={anchor} orientation={children}>
      <div style={{backgroundColor: "rgba(255, 255, 255, .5"}}>{children}</div>
    </Popover>

  return (
    <div style={{
      position: "fixed", zIndex: 9999999,
      width: "80vw", height: "80vh",
      top: "10vh", left: "10vw",
      backgroundColor: "rgba(0, 0, 0, .25)",
    }}>
      <div ref={setAnchor} style={{
        height: "40vh",
        width: "40vw",
        margin: "20vh 20vw",
        backgroundColor: "rgba(0, 255, 0, .5)",
      }} />

      <Example>{"above right" as const}</Example>
      <Example>{"above left" as const}</Example>
      <Example>{"below right" as const}</Example>
      <Example>{"below left" as const}</Example>
      <Example>{"left top" as const}</Example>
      <Example>{"left bottom" as const}</Example>
      <Example>{"right top" as const}</Example>
      <Example>{"right bottom" as const}</Example>

    </div>
  )
}
