import * as config from "./config.js";
import {translate as t, Exception} from "./localization.js";
import * as graphics from "./graphics.js";
import * as simulation from "./simulation.js";
import {Editor} from "./editor.js";

import {domReady, byId, byClass, clamp} from "./util.js";
import {readFile, saveTextAs} from "./files.js";
import {checkKdwFormat, parseKdw, worldToKdwString} from "./world.js";

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

let outputElem;

function resetSimulation() {
  simulation.setWorldDimensions(...[widthInput, lengthInput, heightInput].map(
                                inp => clamp(+inp.min, +inp.max, +inp.value)));
}

function on(eventName, target, fn) {
  target.addEventListener(eventName, function(evt) {
    evt.preventDefault();
    fn.apply(this, arguments);
  });
}

function validateNumberInput() {
  const value = clamp(+this.min, +this.max, +this.value);
  if (+this.value !== value) {
    this.value = value;
  }
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
  outputElem = byId("world-output");

  const worldFileInput = byId("world-file-input");
  const simSpeedInput = byId("world-simulation-speed");
  const showPlayerCheckbox = byId("world-show-player");
  const showFlatWorldCheckbox = byId("world-show-flat");

  on("input", widthInput, validateNumberInput);
  on("input", lengthInput, validateNumberInput);
  on("input", heightInput, validateNumberInput);

  on("click", byId("world-new-button"), resetSimulation);
  on("submit", byClass("world-settings")[0], resetSimulation);

  on("click", byId("world-save-button"), function() {
    saveTextAs(worldToKdwString(simulation.getWorld()),
               t("world.default_filename"));
  });

  on("change", worldFileInput, async function() {
    const file = worldFileInput.files[0];
    // info(t("world.loading_from_file", file.name));
    const text = await readFile(file);
    if (checkKdwFormat(text)) {
      simulation.setWorld(parseKdw(text));
    } else {
      error(t("error.invalid_world_file"));
    }
  });

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
    if (evt.defaultPrevented
        || evt.target instanceof HTMLTextAreaElement
        || evt.target instanceof HTMLInputElement)
    {
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
        if (err instanceof Exception) {
          error(err.translatedMessage);
        } else {
          error(err.message);
          console.error(err);
        }
      }
    }
  });
}

function initEditorButtons() {
  const saveButton = byId("program-save-button");
  const programFileInput = byId("program-file-input");

  const runButton = byId("run-button");
  const stopButton = byId("stop-button");
  const stepButton = byId("step-button");
  const unpauseButton = byId("unpause-button");
  const pauseButton = byId("pause-button");

  disable(stopButton, stepButton, pauseButton, unpauseButton);

  on("click", runButton, async function() {
    disable(runButton);
    enable(stopButton, stepButton, pauseButton);
    info(t("program.message.running"));
    try {
      const interrupted = await simulation.run(editor.value);
      info(t(interrupted ? "program.message.canceled"
                         : "program.message.finished"));
    } catch (err) {
      if (err instanceof Exception) {
        error(err.translatedMessage);
      } else {
        error(err.message);
        console.error(err);
      }
    }
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
    info(t("program.message.paused"));
    disable(pauseButton);
    enable(unpauseButton);
  });

  on("click", unpauseButton, function() {
    simulation.unpause();
    info(t("program.message.running"));
    disable(unpauseButton);
    enable(pauseButton);
  });

  on("click", saveButton, function() {
    saveTextAs(editor.value, t("program.default_filename"));
  });

  on("change", programFileInput, async function() {
    const file = programFileInput.files[0];
    // info(t("program.loading_from_file", file.name));
    editor.value = await readFile(file);
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
  editor.value = await fetch("examples/BOT.kdp").then(response => response.text());
})();
