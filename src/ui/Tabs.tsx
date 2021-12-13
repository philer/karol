import {ComponentChild, Fragment, h, VNode} from "preact"
import {useState} from "preact/hooks"

import * as classes from "./Tabs.module.scss"

export type TabProps = {
  children: ComponentChild,
  title: string,
}

export const Tab = ({children}: TabProps) => <>{children}</>

export type TabsProps = {
  children: VNode<TabProps> | VNode<TabProps>[]
}

export const Tabs = ({children}: TabsProps) => {
  const childArray = Array.isArray(children) ? children : [children]
  const [selected, setSelected] = useState(0)
  return (
    <>
      <nav class={classes.tabs}>
        {childArray.map(({props, key}, idx) =>
          <button
            key={key || idx}
            disabled={idx === selected}
            onClick={() => setSelected(idx)}
          >{props.title}</button>,
        )}
      </nav>
      {childArray[selected]}
    </>
  )
}
