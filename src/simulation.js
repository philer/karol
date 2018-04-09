import {Interpreter} from "./interpreter.js";
import {render} from "./graphics.js";

import {noop} from "./util.js";

const commandNames = {
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


export class Simulation {
  constructor(world, delay=100) {
    this.world = world;
    this.delay = delay;

    this._interpreter = new Interpreter(this, commandNames);

    this._useDelay = true;
    this._running = false;
    this._paused = false;
    this._unpausePromise = Promise.resolve();
    this._unpauseResolve = noop;
    this._interruptSleep = noop;
    this._execCallback = noop;
  }

  get isRunning() {
    return this._running;
  }

  get isPaused() {
    return this._paused;
  }

  get world() {
    return this._world;
  }

  set world(world) {
    this.stop();
    this._world = world;
    this.redraw();
  }

  onExecute(fn) {
    this._execCallback = fn;
  }

  pause() {
    if (!this._paused) {
      this._paused = true;
      this._unpausePromise = new Promise(resolve =>
                                         this._unpauseResolve = resolve);
    }
  }

  unpause() {
    if (this._paused) {
      this._paused = false;
      this._interruptSleep();
      this._unpauseResolve();
    }
  }

  togglePause() {
    this._paused ? this.pause() : this.unpause();
  }

  /**
   * Trigger graphics update
   */
  redraw() {
    render(this._world);
  }

  sleep(ms) {
    return new Promise(resolve => {
      this._interruptSleep = resolve;
      setTimeout(resolve, ms);
    });
  }

  /**
   * Perform a single step in the currently running code.
   */
  async step() {
    if (this._paused) {
      const useDelay = this._useDelay;
      this._useDelay = false;
      this.unpause();
      await this._unpausePromise;
      this.pause();
      this._useDelay = useDelay;
    } else {
      this._interruptSleep();
    }
  }

  /**
   * Execute a single native command (aka. method).
   * This method is called by a running program.
   * Waits until the simulation is unpaused (if necessary)
   * and after the execution waits for a specified delay
   * (unless suppressed).
   *
   * @param  {string}  command  name of the builtin
   * @param  {Boolean} ignoreDelay finish immediately
   * @param  {int}     line        number of code line
   * @return {Promise}
   */
  async execute(command, args=[], line=null) {
    this._execCallback(command, line);
    const result = this.evaluate(command, args, line);
    if (result === undefined) {
      this.redraw();
    }
    if (this._useDelay) {
      await this.sleep(this.delay);
      await this._unpausePromise;
    }
    return result;
  }

  /**
   * Execute a single native command (aka. method) and
   * redraw. Use this for commands that have a visual effect
   * on the world view.
   * @param  {String} command
   * @return {undefined}
   */
  runCommand(command) {
    this.evaluate(command);
    this.redraw();
  }

  /**
   * Execute a single native command (aka. method) and return
   * the result.
   * @param  {string} command name of the builtin
   * @return {mixed}             return value of the builtin
   */
  evaluate(command, args=[]) {
    return this.world[command](...args);
  }

  /**
   * Execute a program given as text
   * @param  {String} code
   * @return {Promise}
   */
  async run(code) {
    this.stop();
    this._useDelay = true;
    this._running = true;
    try {
      await this._interpreter.run(code);
      return this._interpreter.interrupted;
    } finally {
      this._running = false;
    }
  }

  stop() {
    if (this._running) {
      this._interpreter.interrupt();
      this._useDelay = false;
      this._interruptSleep();
      this.unpause();
    }
  }

}
