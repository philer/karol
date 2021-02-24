import {ComponentChild, Fragment, h} from "preact"

import {translate} from "../localization"

const interpolationRegex = /\{[^}]*?\}/g

export interface TranslateProps extends Record<string, ComponentChild> {
  children: string
}

export const Translate = ({children, ...data}: TranslateProps) => {
  const raw = translate(children)
  const parts: ComponentChild[] = raw.split(interpolationRegex)
  const keys = raw.match(interpolationRegex)
  if (!keys) {
    return <>raw</>
  }
  for (let i = 0 ; i < keys.length ; ++i) {
    parts.splice(2 * i + 1, 0, data[keys[i].slice(1, -1)])
  }
  return h(Fragment, null, parts)
}
