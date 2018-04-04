import * as graphics from "./graphics.js";
import * as simulation from "./simulation.js";
import {World} from "./world.js";
import editor from "./editor.js";

import getConfig from "./config.js";

import {byId} from "./util.js";
import {readKdwFile} from "./files.js";


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


const widthInput = byId("width-input");
const lengthInput = byId("length-input");
const heightInput = byId("height-input");
const fileInput = byId("file-input");
const simSpeedInput = byId("world-simulation-speed");
const showPlayerCheckbox = byId("world-show-player");
const showFlatWorldCheckbox = byId("world-show-flat");
const statusOutput = byId("status-text");
// const debugOutput = byId("debug-text");


function resetSimulation(evt) {
  if (evt) evt.preventDefault();
  simulation.setWorld(new World(+widthInput.value,
                                +lengthInput.value,
                                +heightInput.value));
}

function loadWorld(evt) {
  if (evt) evt.preventDefault();
  readKdwFile(fileInput.files[0]).then(simulation.setWorld);
}

function init(/* cfg */) {

  // world creation/loading
  byId("world-create-form").addEventListener("submit", resetSimulation);
  byId("world-load-form").addEventListener("submit", loadWorld);
  fileInput.addEventListener("change", loadWorld);

  // view settings
  showPlayerCheckbox.addEventListener("change", function() {
    graphics.showPlayer(showPlayerCheckbox.checked);
    simulation.redraw();
  });
  graphics.showPlayer(showPlayerCheckbox.checked);
  showFlatWorldCheckbox.addEventListener("change", function() {
    graphics.showHeightNoise(!showFlatWorldCheckbox.checked);
    simulation.redraw();
  });
  graphics.showHeightNoise(!showFlatWorldCheckbox.checked);

  simSpeedInput.addEventListener("change", function() {
    simulation.setDelay(Math.pow(10, 4 - simSpeedInput.value));
  });
  simulation.setDelay(Math.pow(10, 4 - simSpeedInput.value));

  let pending = false;

  // key controls
  addEventListener("keydown", async function(evt) {
    if (evt.defaultPrevented || evt.target instanceof HTMLTextAreaElement) {
      return;
    }
    const action = keyMap[evt.key];
    if (action) {
      evt.preventDefault();
      if (pending) return;
      pending = true;
      try {
        await simulation.execute(action.toLowerCase(), true);
        statusOutput.innerHTML = "";
        statusOutput.classList.remove("status-error");
      } catch (err) {
        statusOutput.innerHTML = err.message;
        statusOutput.classList.add("status-error");
      } finally {
        pending = false;
      }
    }
  });

  const runButton = byId("run-button");
  const stopButton = byId("stop-button");
  const stepButton = byId("step-button");
  const unpauseButton = byId("unpause-button");
  const pauseButton = byId("pause-button");

  const enable = (...btns) => btns.map(
                     btn => btn.removeAttribute("disabled"));
  const disable = (...btns) => btns.map(
                      btn => btn.setAttribute("disabled", "disabled"));

  disable(stopButton);
  disable(stepButton);
  disable(pauseButton);
  disable(unpauseButton);

  runButton.addEventListener("click", async function(evt) {
    evt.preventDefault();
    disable(runButton);
    enable(stopButton, stepButton, pauseButton);

    statusOutput.innerHTML = "";
    statusOutput.classList.remove("status-error");
    statusOutput.innerHTML = "RUNNING.";
    try {
      await simulation.run(editor.value);
    } catch (err) {
      statusOutput.innerHTML = err.message;
      statusOutput.classList.add("status-error");
    } finally {
      enable(runButton);
      disable(stopButton, stepButton, pauseButton, unpauseButton);
    }
  });

  stopButton.addEventListener("click", function(evt) {
    evt.preventDefault();
    simulation.stop();
    statusOutput.innerHTML = "STOPPED.";
  });

  stepButton.addEventListener("click", function(evt) {
    evt.preventDefault();
    simulation.step();
  });

  pauseButton.addEventListener("click", function(evt) {
    evt.preventDefault();
    simulation.pause();
    statusOutput.innerHTML = "PAUSED.";
    disable(pauseButton);
    enable(unpauseButton);
  });

  unpauseButton.addEventListener("click", function(evt) {
    evt.preventDefault();
    simulation.unpause();
    statusOutput.innerHTML = "RUNNING.";
    disable(unpauseButton);
    enable(pauseButton);
  });

  resetSimulation();

  // demo
  fetch("BOT.kdp")
    .then(response => response.text())
    .then(text => editor.value = text);

}

getConfig("config.js").then(cfg => graphics.init(cfg).then(init));
