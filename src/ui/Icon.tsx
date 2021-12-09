/* eslint-disable sort-imports */
import {h, VNode} from "preact"
import {AbstractElement, Attributes, icon, IconDefinition, IconParams} from "@fortawesome/fontawesome-svg-core"
import {
  faCopy,
  faKeyboard,
} from "@fortawesome/free-regular-svg-icons"
// All icons used on the page need to be listed here.
// Only use single statement import when tree-shaking is available,
// see https://fontawesome.com/how-to-use/use-with-node-js#tree-shaking
import {
  faArrowDown, 
  faArrowUp,
  faCheck,
  faCircleNotch,
  faCode,
  faCog,
  faGlobe,
  faMinusCircle,
  faPause, 
  faPlay,
  faPlusCircle,
  faQuestion,
  faReply,
  faRobot,
  faRunning,
  faStepForward,
  faStop,
  faTerminal,
  faTimes,
  faWalking,
} from "@fortawesome/free-solid-svg-icons"

export type ClassName =
  | "xs" | "sm" | "lg" | "2x" | "3x" | "5x" | "7x" | "10x"
  | "fw" | "size" | "rotate" | "flip" | "spin" | "pulse"

/** Special classes recognized by FontAwesome */
const classNames = new Set<ClassName>([
  "xs", "sm", "lg", "2x", "3x", "5x", "7x", "10x",
  "fw", "size", "rotate", "flip", "spin", "pulse",
])

// https://stackoverflow.com/a/64694571
export type PartialRecord<K extends string | number | symbol, T> = { [P in K]?: T }
export type IconProps = IconParams & PartialRecord<ClassName, boolean> & {
  class?: string
}

type IP = IconProps
export const IconArrowDown = (ip: IP) => <Icon faIcon={faArrowDown} {...ip} />
export const IconArrowUp = (ip: IP) => <Icon faIcon={faArrowUp} {...ip} />
export const IconCheck = (ip: IP) => <Icon faIcon={faCheck} {...ip} />
export const IconCircleNotch = (ip: IP) => <Icon faIcon={faCircleNotch} {...ip} />
export const IconCode = (ip: IP) => <Icon faIcon={faCode} {...ip} />
export const IconCog = (ip: IP) => <Icon faIcon={faCog} {...ip} />
export const IconCopy = (ip: IP) => <Icon faIcon={faCopy} {...ip} />
export const IconGlobe = (ip: IP) => <Icon faIcon={faGlobe} {...ip} />
export const IconKeyboard = (ip: IP) => <Icon faIcon={faKeyboard} {...ip} />
export const IconMinusCircle = (ip: IP) => <Icon faIcon={faMinusCircle} {...ip} />
export const IconPause = (ip: IP) => <Icon faIcon={faPause} {...ip} />
export const IconPlay = (ip: IP) => <Icon faIcon={faPlay} {...ip} />
export const IconPlusCircle = (ip: IP) => <Icon faIcon={faPlusCircle} {...ip} />
export const IconQuestion = (ip: IP) => <Icon faIcon={faQuestion} {...ip} />
export const IconReply = (ip: IP) => <Icon faIcon={faReply} {...ip} />
export const IconRobot = (ip: IP) => <Icon faIcon={faRobot} {...ip} />
export const IconRunning = (ip: IP) => <Icon faIcon={faRunning} {...ip} />
export const IconStepForward = (ip: IP) => <Icon faIcon={faStepForward} {...ip} />
export const IconStop = (ip: IP) => <Icon faIcon={faStop} {...ip} />
export const IconTerminal = (ip: IP) => <Icon faIcon={faTerminal} {...ip} />
export const IconTimes = (ip: IP) => <Icon faIcon={faTimes} {...ip} />
export const IconWalking = (ip: IP) => <Icon faIcon={faWalking} {...ip} />


/** Turn FontAwesome's abstract tree into a component tree */
const convert = ({tag, attributes, children}: {tag: string, attributes: Attributes, children?: AbstractElement[]}): VNode =>
  h(tag, attributes, ...(children || []).map(convert))

/**
 * Render a FontAwesome icon. Examples:
 *
 *    <Icon faPlus />
 *    <Icon faPlus 2x fw transform={{ rotate: 90 }}/>
 */
export const Icon = (props: IconProps & {faIcon: IconDefinition}) => {
  const {
    faIcon,
    attributes = {},
    classes: _classes = [],
    class: _class,
    styles, transform, mask, maskId, title, titleId, symbol,
    ...boolClasses
  } = props

  const classes = _classes
    ? Array.isArray(_classes) ? _classes : [_classes]
    : []

  if (_class) {
    classes.push(_class)
  }

  // Using booleans as icon classes
  for (const [key, value] of Object.entries(boolClasses)) {
    if (value === true && classNames.has(key as ClassName)) {
      classes.push(`fa-${key}`)
    }
  }

  return convert(icon(faIcon, {
    classes, attributes,
    styles, transform, mask, maskId, title, titleId, symbol,
  }).abstract[0])
}
