import {World} from "./world.js";
import {Interpreter} from "./interpreter.js";
import * as graphics from "./graphics.js";

import {noop} from "./util.js";

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
let running = false;
let paused = false;
let unpausePromise = Promise.resolve();
let unpauseResolve = noop;
let interruptSleep = noop;
let execCallback = noop;

const sleep = ms => new Promise(function(resolve) {
  interruptSleep = resolve;
  setTimeout(resolve, ms);
});


export function setWorld(newWorld) {
  world = newWorld;
  redraw();
}

export function setWorldDimensions(width, length, height) {
  setWorld(new World(width, length, height));
}

export function isRunning() {
  return running;
}

export function isPaused() {
  return paused;
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

export function onExecute(fn) {
  execCallback = fn;
}

export function pause() {
  if (!paused) {
    paused = true;
    unpausePromise = new Promise(resolve => unpauseResolve = resolve);
  }
}

export function unpause() {
  if (paused) {
    paused = false;
    interruptSleep();
    unpauseResolve();
  }
}

export function togglePause() {
  (paused ? pause : unpause)();
}

/**
 * Perform a single step in the currently running code.
 */
export async function step() {
  if (!running) {
    return;
  }
  if (paused) {
    const _useDelay = useDelay;
    useDelay = false;
    unpause();
    await unpausePromise;
    pause();
    useDelay = _useDelay;
  } else {
    interruptSleep();
  }
}

/**
 * Execute a single native command (aka. method).
 * This method is called by a running program.
 * Waits until the simulation is unpaused (if necessary)
 * and after the execution waits for a specified delay
 * (unless suppressed).
 *
 * @param  {string}  identifier  name of the builtin
 * @param  {Boolean} ignoreDelay finish immediately
 * @param  {int}     lineno      number of code line
 * @return {Promise}
 */
async function execute(identifier, lineno=null) {
  await unpausePromise;
  if (!running) {
    return;
  }
  execCallback(identifier, lineno);
  evaluate(identifier);
  redraw();
  if (useDelay) {
    await sleep(delay);
  }
}

/**
 * Execute a single native command (aka. method) and
 * redraw. Use this for commands that have a visual effect
 * on the world view.
 * @param  {String} indentifier
 * @return {undefined}
 */
export function runCommand(indentifier) {
  evaluate(indentifier);
  redraw();
}

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
  running = true;
  unpause();
  await interpreter.run(code);
}

export function stop() {
  interpreter.interrupt();
  running = false;
  useDelay = false;
  unpause();
}
