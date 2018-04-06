
import fontawesome from '@fortawesome/fontawesome';

// All icons used on the page need to be listed here.
// Only use single statement import when tree-shaking is available,
// see https://fontawesome.com/how-to-use/use-with-node-js#tree-shaking
import {
  faPlay,
  faPause,
  faStop,
  faStepForward,
  faCog,
  faTimes,
} from '@fortawesome/fontawesome-free-solid';

fontawesome.library.add(
  faPlay,
  faPause,
  faStop,
  faStepForward,
  faCog,
  faTimes,
);
