import {h} from "preact"
import {icon} from "@fortawesome/fontawesome-svg-core"

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

} from "@fortawesome/free-solid-svg-icons"


// Copy-paste all icons imported above into here.
// Yeah, I know...
const lookup = {

  // runtime controlls
  faPlay, faPause, faStop, faStepForward,
  faWalking, faRunning,

  // settings toggles
  faCog, faTimes,

  // touch controls
  faArrowUp, faArrowDown, faReply,
  faPlusCircle, faMinusCircle,

}


/** Turn FontAwesome's abstract tree into a component tree */
const convert = ({tag, attributes, children}) =>
  h(tag, attributes, ...(children || []).map(convert))

/** Special classes recognized by FontAwesome */
const classNames = new Set([
  "xs", "sm", "lg", "2x", "3x", "5x", "7x", "10x",
  "fw", "size", "rotate", "flip", "spin", "pulse",
])

/**
 * Render a FontAwesome icon. Examples:
 *
 *    <Icon faPlus />
 *    <Icon faPlus 2x fw transform={{ rotate: 90 }}/>
 */
export const Icon = props => {
  const {
    attributes = {},
    classes = [],
    styles, transform, mask, maskId, title, titleId,
    ...rest
  } = props

  let faIcon
  const additionalClasses = []

  if (rest.hasOwnProperty("class")) {
    additionalClasses.push(rest["class"])
    delete rest["class"]
  }

  // Using booleans as icon name & classes
  // Delete after use so they don't leak into attributes.
  for (const [key, value] of Object.entries(rest)) {
    if (value === true) {
      if (lookup.hasOwnProperty(key)) {
        faIcon = lookup[key]
        delete rest[key]
      } else if (classNames.has(key)) {
        additionalClasses.push(`fa-${key}`)
        delete rest[key]
      }
    }
  }

  return convert(icon(faIcon, {
    classes: [...classes, ...additionalClasses],
    attributes: {...attributes, ...rest},
    styles, transform, mask, maskId, title, titleId,
  }).abstract[0])
}
