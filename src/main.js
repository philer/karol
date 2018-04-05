import * as graphics from "./graphics.js";
import * as simulation from "./simulation.js";
import {Editor} from "./editor.js";

import {domReady, byId} from "./util.js";
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

let editor;

let widthInput;
let lengthInput;
let heightInput;

let fileInput;

let statusOutput;

function resetSimulation() {
  simulation.setWorldDimensions(+widthInput.value,
                                +lengthInput.value,
                                +heightInput.value);
}

function loadWorld() {
  readKdwFile(fileInput.files[0]).then(simulation.setWorld);
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


function initWorldControls() {

  widthInput = byId("width-input");
  lengthInput = byId("length-input");
  heightInput = byId("height-input");
  fileInput = byId("file-input");
  statusOutput = byId("status-text");

  const simSpeedInput = byId("world-simulation-speed");
  const showPlayerCheckbox = byId("world-show-player");
  const showFlatWorldCheckbox = byId("world-show-flat");

  // world creation/loading
  on("submit", byId("world-create-form"), resetSimulation);

  on("submit", byId("world-load-form"), loadWorld);
  on("change", fileInput, loadWorld);

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
        statusOutput.innerHTML = "";
        statusOutput.classList.remove("status-error");
      } catch (err) {
        statusOutput.innerHTML = err.message;
        statusOutput.classList.add("status-error");
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
      editor.markLine();
    }
  });

  on("click", stopButton, function() {
    simulation.stop();
    statusOutput.innerHTML = "STOPPED.";
  });

  on("click", stepButton, function() {
    simulation.step();
  });

  on("click", pauseButton, function() {
    simulation.pause();
    statusOutput.innerHTML = "PAUSED.";
    disable(pauseButton);
    enable(unpauseButton);
  });

  on("click", unpauseButton, function() {
    simulation.unpause();
    statusOutput.innerHTML = "RUNNING.";
    disable(unpauseButton);
    enable(pauseButton);
  });
}


/*** MAIN INIT ***/
(async function init() {
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
