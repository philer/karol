import * as graphics from "./graphics.js";
import {sleep} from "./util.js";

const nativeSymbols = {
  "linksdrehen":   "turnLeft",
  "rechtsdrehen":  "turnRight",
  "schritt":       "step",
  "schrittzurück": "stepBackwards",
  "hinlegen":      "placeBlock",
  "aufheben":      "takeBlock",
  "markesetzen":   "placeMark",
  "markelöschen":  "takeMark",

  "istwand":       "isLookingAtEdge",
};

let world;
let delay_ms = 100;

export function setSpeed(speed) {
  delay_ms = Math.pow(10, 4 - speed);
}

export function redraw() {
  graphics.render(world);
}

export function setWorld(newWorld) {
  world = newWorld;
  redraw();
}

export async function execute(identifier, ignore_delay=false) {
  const methodName = nativeSymbols[identifier];
  if (!methodName) {
    throw new Error(`RunTime Error: ${identifier} is not defined.`);
  }
  world[methodName]();
  redraw();

  if (!ignore_delay) {
    await sleep(delay_ms);
  }
}

export function evaluate(identifier) {
  const methodName = nativeSymbols[identifier];
  if (!methodName) {
    throw new Error(`RunTime Error: ${identifier} is not defined.`);
  }
  return world[methodName]();
}
