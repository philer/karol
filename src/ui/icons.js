
import fontawesome from '@fortawesome/fontawesome'

// All icons used on the page need to be listed here.
// Only use single statement import when tree-shaking is available,
// see https://fontawesome.com/how-to-use/use-with-node-js#tree-shaking
import {

  // runtime controlls
  faPlay, faPause, faStop, faStepForward,

  // settings toggles
  faCog, faTimes,

  // touch controls
  faArrowUp, faArrowDown, faReply,
  faPlusCircle, faMinusCircle,

} from '@fortawesome/fontawesome-free-solid'


// Copy-paste all icons imported above into here.
// Yeah, I know...
fontawesome.library.add(

  // runtime controlls
  faPlay, faPause, faStop, faStepForward,

  // settings toggles
  faCog, faTimes,

  // touch controls
  faArrowUp, faArrowDown, faReply,
  faPlusCircle, faMinusCircle,

)
