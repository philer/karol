import * as graphics from "./graphics.js";
import * as simulation from "./simulation.js";
import {World} from "./world.js";
import {Interpreter} from "./interpreter.js";

import {fetchJson} from "./util.js";
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


const byId = document.getElementById.bind(document);
const editor = byId("editor");
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
    simulation.setSpeed(+simSpeedInput.value);
  });
  simulation.setSpeed(+simSpeedInput.value);

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

  const interpreter = new Interpreter(simulation);

  byId("run-button").addEventListener("click", async function(evt) {
    evt.preventDefault();
    if (pending) return;
    pending = true;
    statusOutput.innerHTML = "";
    statusOutput.classList.remove("status-error");
    try {
      await interpreter.run(editor.value);
    } catch (err) {
      statusOutput.innerHTML = err.message;
      statusOutput.classList.add("status-error");
    } finally {
        pending = false;
      }
  });

  byId("stop-button").addEventListener("click", function(evt) {
    evt.preventDefault();
    interpreter.interrupt();
    statusOutput.innerHTML = "STOPPED.";
  });

  resetSimulation();

  // demo
  fetch("BOT.kdp")
    .then(response => response.text())
    .then(text => editor.value = text);

}

fetchJson("config.json").then(cfg => graphics.init(cfg).then(init));
