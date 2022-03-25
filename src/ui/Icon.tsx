/* eslint-disable sort-imports */
import {h, VNode} from "preact"
import {useMemo} from "preact/hooks"
import {AbstractElement, Attributes, icon, IconDefinition, IconParams} from "@fortawesome/fontawesome-svg-core"
import * as regular from "@fortawesome/free-regular-svg-icons"
// All icons used on the page need to be listed here.
// Only use single statement import when tree-shaking is available,
// see https://fontawesome.com/how-to-use/use-with-node-js#tree-shaking
import * as solid from "@fortawesome/free-solid-svg-icons"

export type ClassName =
  | "xs" | "sm" | "lg" | "x2" | "x3" | "x5" | "x7" | "x10"
  | "fw" | "size" | "rotate" | "flip" | "spin" | "pulse"

/** Special classes recognized by FontAwesome */
const classNames = new Set<ClassName>([
  "xs", "sm", "lg", "x2", "x3", "x5", "x7", "x10",
  "fw", "size", "rotate", "flip", "spin", "pulse",
])

// https://stackoverflow.com/a/64694571
export type PartialRecord<K extends string | number | symbol, T> = { [P in K]?: T }
export type IconProps = IconParams & PartialRecord<ClassName, boolean> & {
  class?: string
}

type IP = IconProps
export const IconArrowDown = (ip: IP) => <Icon faIcon={solid.faArrowDown} {...ip} />
export const IconArrowLeft = (ip: IP) => <Icon faIcon={solid.faArrowLeft} {...ip} />
export const IconArrowRight = (ip: IP) => <Icon faIcon={solid.faArrowRight} {...ip} />
export const IconArrowUp = (ip: IP) => <Icon faIcon={solid.faArrowUp} {...ip} />
export const IconCheck = (ip: IP) => <Icon faIcon={solid.faCheck} {...ip} />
export const IconCheckSquare = (ip: IP) => <Icon faIcon={solid.faCheckSquare} {...ip} />
export const IconChevronDown = (ip: IP) => <Icon faIcon={solid.faChevronDown} {...ip} />
export const IconChevronUp = (ip: IP) => <Icon faIcon={solid.faChevronUp} {...ip} />
export const IconCircleNotch = (ip: IP) => <Icon faIcon={solid.faCircleNotch} {...ip} />
export const IconCode = (ip: IP) => <Icon faIcon={solid.faCode} {...ip} />
export const IconCog = (ip: IP) => <Icon faIcon={solid.faCog} {...ip} />
export const IconCopy = (ip: IP) => <Icon faIcon={regular.faCopy} {...ip} />
export const IconGlobe = (ip: IP) => <Icon faIcon={solid.faGlobe} {...ip} />
export const IconKeyboard = (ip: IP) => <Icon faIcon={regular.faKeyboard} {...ip} />
export const IconMinus = (ip: IP) => <Icon faIcon={solid.faMinus} {...ip} />
export const IconMinusCircle = (ip: IP) => <Icon faIcon={solid.faMinusCircle} {...ip} />
export const IconPause = (ip: IP) => <Icon faIcon={solid.faPause} {...ip} />
export const IconPlay = (ip: IP) => <Icon faIcon={solid.faPlay} {...ip} />
export const IconPlus = (ip: IP) => <Icon faIcon={solid.faPlus} {...ip} />
export const IconPlusCircle = (ip: IP) => <Icon faIcon={solid.faPlusCircle} {...ip} />
export const IconQuestion = (ip: IP) => <Icon faIcon={solid.faQuestion} {...ip} />
export const IconReply = (ip: IP) => <Icon faIcon={solid.faReply} {...ip} />
export const IconRobot = (ip: IP) => <Icon faIcon={solid.faRobot} {...ip} />
export const IconRunning = (ip: IP) => <Icon faIcon={solid.faRunning} {...ip} />
export const IconSquare = (ip: IP) => <Icon faIcon={solid.faSquare} {...ip} />
export const IconStepForward = (ip: IP) => <Icon faIcon={solid.faStepForward} {...ip} />
export const IconStop = (ip: IP) => <Icon faIcon={solid.faStop} {...ip} />
export const IconTerminal = (ip: IP) => <Icon faIcon={solid.faTerminal} {...ip} />
export const IconTimes = (ip: IP) => <Icon faIcon={solid.faTimes} {...ip} />
export const IconToggleOff = (ip: IP) => <Icon faIcon={solid.faToggleOff} {...ip} />
export const IconToggleOn = (ip: IP) => <Icon faIcon={solid.faToggleOn} {...ip} />
export const IconWalking = (ip: IP) => <Icon faIcon={solid.faWalking} {...ip} />


/** Turn FontAwesome's abstract tree into a component tree */
const convert = ({tag, attributes, children}: { tag: string, attributes: Attributes, children?: AbstractElement[] }): VNode =>
  h(tag, attributes, ...(children || []).map(convert))

/**
 * Render a FontAwesome icon. Examples:
 *
 *    <Icon faPlus />
 *    <Icon faPlus 2x fw transform={{ rotate: 90 }}/>
 */
export const Icon = (props: IconProps & { faIcon: IconDefinition }) => {
  const {
    faIcon,
    class: _class,
    title, titleId, symbol,
    ...boolClasses
  } = props

  const classes = _class ? [_class] : []

  // Using booleans as icon classes
  for (const [key, value] of Object.entries(boolClasses)) {
    if (value === true && classNames.has(key as ClassName)) {
      const faKey = key.startsWith("x") ? key.slice(1) + "x" : key
      classes.push(`fa-${faKey}`)
    }
  }

  return useMemo(
    () => convert(icon(faIcon, {classes, title, titleId, symbol}).abstract[0]),
    [faIcon, ...classes, title, titleId, symbol],
  )
}
