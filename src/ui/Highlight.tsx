import {type JSX, h} from "preact"
import {useEffect, useMemo, useRef} from "preact/hooks"

import {highlight, Marks} from "../language/highlight"
import type {LanguageSpecification} from "../language/specification"
import {clsx} from "../util"
import type {ElementProps} from "../util/types"

import * as classes from "./Highlight.module.scss"

export type HighlightProps = ElementProps & {
  children: string,
  spec: LanguageSpecification
  marks?: Marks
}

/** Use a separate component to gain automatic memoization */
export const Highlight = ({children, spec, marks, ...props}: HighlightProps) => {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (marks && Object.keys(marks).length === 1) {
      const [line] = Object.keys(marks)
      codeRef.current?.children[+line - 1]?.scrollIntoView({block: "nearest"})
    }
  }, [codeRef.current, marks])

  const highlighted = useMemo(
    () => highlight(children, spec, marks),
    [children, spec, marks],
  )

  return (
    <code
      {...props}
      ref={codeRef}
      class={clsx("highlight", classes.root, props.class)}
      dangerouslySetInnerHTML={{__html: highlighted}}
      onCopy={cleanCopy}
    />
  )
}

/** Replace special characters added by syntax highlighting */
function cleanCopy(evt: JSX.TargetedClipboardEvent<HTMLElement>) {
  const selection = document.getSelection()
  if (selection && evt.clipboardData) {
    evt.clipboardData.setData("text/plain", selection.toString().replace(/·/g, " "))
    evt.preventDefault()
  }
}
