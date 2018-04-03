import highlight from "./highlight.js";
import {byId} from "./util.js";

class Editor {

  constructor() {
    this.textarea = byId("editor-textarea");
    this.highlighted = byId("editor-highlight");

    this.textarea.addEventListener("input", this.update.bind(this));
    //  more events: paste propertychange
  }

  get value() {
    return this.textarea.value;
  }
  set value(text) {
    this.textarea.value = text;
    this.update();
  }

  update() {
    this.highlighted.innerHTML = highlight(this.textarea.value);
    this.textarea.style.height = this.highlighted.offsetHeight + "px";
  }
}

export default new Editor();
