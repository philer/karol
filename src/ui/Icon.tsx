/* eslint-disable sort-imports */
import {VNode, h} from "preact"
import {AbstractElement, Attributes, IconDefinition, IconParams, icon} from "@fortawesome/fontawesome-svg-core"

// All icons used on the page need to be listed here.
// Only use single statement import when tree-shaking is available,
// see https://fontawesome.com/how-to-use/use-with-node-js#tree-shaking
import {

  // runtime controlls
  faPlay, faPause, faStop, faStepForward,
  faWalking, faRunning,

  // settings toggles
  faCog, faTimes,

  // touch controls
  faArrowUp, faArrowDown, faReply,
  faPlusCircle, faMinusCircle,

  // miscellaneous
  faCircleNotch,
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

// runtime controlls
export const IconPlay = (props: IconProps) =>
  <Icon faIcon={faPlay} {...props} />
export const IconPause = (props: IconProps) =>
  <Icon faIcon={faPause} {...props} />
export const IconStop = (props: IconProps) =>
  <Icon faIcon={faStop} {...props} />
export const IconStepForward = (props: IconProps) =>
  <Icon faIcon={faStepForward} {...props} />
export const IconWalking = (props: IconProps) =>
  <Icon faIcon={faWalking} {...props} />
export const IconRunning = (props: IconProps) =>
  <Icon faIcon={faRunning} {...props} />

// settings toggles
export const IconCog = (props: IconProps) =>
  <Icon faIcon={faCog} {...props} />
export const IconTimes = (props: IconProps) =>
  <Icon faIcon={faTimes} {...props} />

// touch controls
export const IconArrowUp = (props: IconProps) =>
  <Icon faIcon={faArrowUp} {...props} />
export const IconArrowDown = (props: IconProps) =>
  <Icon faIcon={faArrowDown} {...props} />
export const IconReply = (props: IconProps) =>
  <Icon faIcon={faReply} {...props} />
export const IconPlusCircle = (props: IconProps) =>
  <Icon faIcon={faPlusCircle} {...props} />
export const IconMinusCircle = (props: IconProps) =>
  <Icon faIcon={faMinusCircle} {...props} />

// miscellaneous
export const IconCircleNotch = (props: IconProps) =>
  <Icon faIcon={faCircleNotch} {...props} />


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
