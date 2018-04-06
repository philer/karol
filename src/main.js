import * as config from "./config.js";
import * as graphics from "./graphics.js";
import * as simulation from "./simulation.js";
import {Editor} from "./editor.js";

import {domReady, byId} from "./util.js";
import {readKdwFile} from "./files.js";

import "./icons.js";

const keyMap = {
  "ArrowLeft":  "LinksDrehen",
  "a":          "LinksDrehen",
  "ArrowRight": "RechtsDrehen",
  "d":          "RechtsDrehen",
  "ArrowUp":    "Schritt",
  "w":          "Schritt",
  "ArrowDown":  "SchrittZurück",
  "s":          "SchrittZurück",
  "h":          "Hinlegen",
  "H":          "Aufheben",
  "m":          "MarkeSetzen",
  "M":          "MarkeLöschen",
};

let editor;

let widthInput;
let lengthInput;
let heightInput;

let worldFileInput;

let outputElem;

function resetSimulation() {
  simulation.setWorldDimensions(+widthInput.value,
                                +lengthInput.value,
                                +heightInput.value);
}

function loadWorld() {
  readKdwFile(worldFileInput.files[0]).then(simulation.setWorld);
}

function on(eventName, target, fn) {
  target.addEventListener(eventName, function(evt) {
    evt.preventDefault();
    fn.apply(this, arguments);
  });
}

function enable(...btns) {
  btns.map(btn => btn.removeAttribute("disabled"));
}

function disable(...btns) {
  btns.map(btn => btn.setAttribute("disabled", "disabled"));
}

function info(message) {
  outputElem.innerHTML += `<p class="info-message">${message}</p>`;
  outputElem.scrollTop = outputElem.scrollHeight;
}

function error(message) {
  outputElem.innerHTML += `<p class="error-message">${message}</p>`;
  outputElem.scrollTop = outputElem.scrollHeight;
}

function initWorldControls() {

  widthInput = byId("width-input");
  lengthInput = byId("length-input");
  heightInput = byId("height-input");
  worldFileInput = byId("world-file-input");
  outputElem = byId("world-output");

  const simSpeedInput = byId("world-simulation-speed");
  const showPlayerCheckbox = byId("world-show-player");
  const showFlatWorldCheckbox = byId("world-show-flat");

  // world creation/loading
  on("click", byId("world-new-button"), resetSimulation);

  // on("click", byId("world-load-button"), loadWorld);
  // on("click", byId("world-save-button"), saveWorld);
  on("change", worldFileInput, loadWorld);

  // world view settings
  on("change", showPlayerCheckbox, function() {
    graphics.showPlayer(showPlayerCheckbox.checked);
    simulation.redraw();
  });
  graphics.showPlayer(showPlayerCheckbox.checked);

  on("change", showFlatWorldCheckbox, function() {
    graphics.showHeightNoise(!showFlatWorldCheckbox.checked);
    simulation.redraw();
  });
  graphics.showHeightNoise(!showFlatWorldCheckbox.checked);

  on("change", simSpeedInput, function() {
    simulation.setDelay(Math.pow(10, 4 - simSpeedInput.value));
  });
  simulation.setDelay(Math.pow(10, 4 - simSpeedInput.value));

  resetSimulation();


  // key controls
  addEventListener("keydown", async function(evt) {
    if (evt.defaultPrevented || evt.target instanceof HTMLTextAreaElement) {
      return;
    }
    const action = keyMap[evt.key];
    if (action) {
      evt.preventDefault();
      if (simulation.isRunning()) {
        return;
      }
      try {
        await simulation.runCommand(action);
      } catch (err) {
        error(err.message);
      }
    }
  });
}

function initEditorButtons() {

  const runButton = byId("run-button");
  const stopButton = byId("stop-button");
  const stepButton = byId("step-button");
  const unpauseButton = byId("unpause-button");
  const pauseButton = byId("pause-button");

  disable(stopButton, stepButton, pauseButton, unpauseButton);

  on("click", runButton, async function() {
    disable(runButton);
    enable(stopButton, stepButton, pauseButton);
    info("RUNNING...");
    const interrupted = await simulation.run(editor.value);
    info(interrupted ? "STOPPED" : "DONE");
    enable(runButton);
    disable(stopButton, stepButton, pauseButton, unpauseButton);
    editor.markLine();
  });

  on("click", stopButton, function() {
    simulation.stop();
  });

  on("click", stepButton, function() {
    simulation.step();
  });

  on("click", pauseButton, function() {
    simulation.pause();
    info("PAUSED");
    disable(pauseButton);
    enable(unpauseButton);
  });

  on("click", unpauseButton, function() {
    simulation.unpause();
    info("RUNNING...");
    disable(unpauseButton);
    enable(pauseButton);
  });
}



/*** MAIN INIT ***/
(async function init() {
  const editorTheme = (await config.get()).editor_theme || "bright";
  byId("editor-theme-stylesheet").href = `css/editor-theme-${editorTheme}.css`;

  await Promise.all([
    graphics.init(),
    domReady,
  ]);

  editor = new Editor(byId("editor"));
  simulation.onExecute((_, lineno) => editor.markLine(lineno));

  initWorldControls();
  initEditorButtons();

  // demo
  editor.value = await fetch("BOT.kdp").then(response => response.text());
})();
