import * as graphics from "./graphics.js";
import editor from "./editor.js";
import {Interpreter} from "./interpreter.js";

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

const interpreter = new Interpreter({execute, evaluate});

let world;
let delay = 100;
let useDelay = true;
let running = true;
let unpausePromise = Promise.resolve();
let unpauseResolve = function() {};
let interruptSleep;

const sleep = ms => new Promise(function(resolve) {
  interruptSleep = resolve;
  setTimeout(resolve, ms);
});


export function setWorld(newWorld) {
  world = newWorld;
  redraw();
}

/**
 * Trigger graphics update
 */
export function redraw() {
  graphics.render(world);
}

/**
 * Set delay between individual steps during code execution.
 * @param {int} newDelay
 */
export function setDelay(newDelay) {
  delay = newDelay;
}

export function pause() {
  if (running) {
    running = false;
    unpausePromise = new Promise(resolve => unpauseResolve = resolve);
  }
}

export function unpause() {
  running = true;
  unpauseResolve();
}

export function isPaused() {
  return !running;
}

export function togglePause() {
  (running ? pause : unpause)();
}

/**
 * Perform a single step in the currently running code.
 */
export async function step() {
  if (running) {
    interruptSleep();
  } else {
    const _useDelay = useDelay;
    useDelay = false;
    unpause();
    await unpausePromise;
    pause();
    useDelay = _useDelay;
  }
}

/**
 * Execute a single native command (aka. method).
 * Waits until the simulation is unpaused (if necessary)
 * and after the execution waits for a specified delay
 * (unless suppressed).
 *
 * @param  {string}  identifier  name of the builtin
 * @param  {Boolean} ignoreDelay finish immediately
 * @param  {int}     lineno      number of code line
 * @return {Promise}
 */
async function execute(identifier, ignoreDelay=false, lineno=null) {
  if (!running) {
    await unpausePromise;
  }
  if (lineno !== null) {
    // TODO should simulation know editor?
    editor.markLine(lineno);
  }
  evaluate(identifier);
  redraw();
  if (useDelay && !ignoreDelay) {
    await sleep(delay);
  }
}
export {execute};  // babel doesn't hoist properly

/**
 * Execute a single native command (aka. method) and return
 * the result.
 * @param  {string} identifier name of the builtin
 * @return {mixed}             return value of the builtin
 */
export function evaluate(identifier) {
  const methodName = nativeSymbols[identifier.toLowerCase()];
  if (!methodName) {
    throw new Error(`RunTime Error: ${identifier} is not defined.`);
  }
  return world[methodName]();
}

/**
 * Execute a program given as text
 * @param  {String} code
 * @return {Promise}
 */
export async function run(code) {
  useDelay = true;
  unpause();
  await interpreter.run(code);
}

export function stop() {
  useDelay = false;
  interpreter.interrupt();
  interruptSleep();
}
