import * as graphics from "./graphics.js";
import * as actions from "./actions.js";

import {sleep, rand} from "./util.js";

const nativeSymbols = {
  "linksdrehen": actions.turnLeft,
  "rechtsdrehen": actions.turnRight,
  "schritt": actions.step,
  "schrittzurück": actions.stepBackwards,
  "hinlegen": actions.placeBlock,
  "aufheben": actions.takeBlock,
  "markesetzen": actions.placeMark,
  "markelöschen": actions.takeMark,

  "istwand": actions.isLookingAtEdge,
};

let world;
let delay_ms = 100;

export function setSpeed(speed) {
  delay_ms = Math.pow(10, 4 - speed);
}

export function redraw() {
  graphics.render(world);
  // document.getElementById("debug-text").innerHTML
  //      = JSON.stringify(world.player, undefined, "  ")
  //      + "\n"
  //      + JSON.stringify({world});
}

export function setWorld(newWorld) {
  world = newWorld;
  redraw();
}

export function setWorldDimensions(width, length, height) {
  world = createWorld(width, length, height);
  redraw();
}

function createWorld(width, length, height) {
  return {
    width, length, height,
    player: {x: 0, y: 0, orientation: 0},
    tiles: Array.from({length: width * length},
                      () => ({blocks: 0, mark: false})),
    seed: rand(Math.pow(-2, 16), Math.pow(2, 16)),
  };
}

export async function execute(identifier, ignore_delay=false) {
  const action = nativeSymbols[identifier];
  if (!action) {
    throw new Error(`RunTime Error: ${identifier} is not defined.`);
  }
  action(world);
  redraw();

  if (!ignore_delay) {
    await sleep(delay_ms);
  }
}

export function evaluate(identifier) {
  const action = nativeSymbols[identifier];
  if (!action) {
    throw new Error(`RunTime Error: ${identifier} is not defined.`);
  }
  return action(world);
}
