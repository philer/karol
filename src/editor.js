import highlight from "./highlight.js";
import {byClass} from "./util.js";

class Editor {

  constructor(root) {
    // this.root = root;
    this.scrollbox = root.getElementsByClassName("editor-scrollbox")[0];

    this.textarea = root.getElementsByClassName("editor-textarea")[0];
    this.highlighted = root.getElementsByClassName("editor-highlight")[0];

    const caretLayer = root.getElementsByClassName("editor-caret-layer")[0];
    this.beforeCaret = caretLayer.appendChild(document.createElement("span"));
    this.caret = caretLayer.appendChild(document.createElement("span"));
    this.caret.classList.add("editor-caret");

    this.textarea.addEventListener("input", this.update.bind(this));
    //  more events: paste propertychange

    const updateCaret = this.updateCaret.bind(this);
    const deferredCaretUpdate = () => setTimeout(updateCaret, 0);
    this.textarea.addEventListener("input", deferredCaretUpdate);

    // Split mousedown and mouseup since selection may not trigger click
    // and select may not be available.
    this.textarea.addEventListener("mousedown", deferredCaretUpdate);
    this.textarea.addEventListener("mouseup", deferredCaretUpdate);

    // Listening to both because chrome doesn't trigger keydown on arrow keys
    // while firefox misplaces the cursor with keypress.
    this.textarea.addEventListener("keypress", deferredCaretUpdate);
    this.textarea.addEventListener("keydown", deferredCaretUpdate);

    this.update();
    updateCaret();
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

  updateCaret() {
    const offset = this.textarea.selectionDirection === "forward"
                   ? this.textarea.selectionEnd
                   : this.textarea.selectionStart;
    this.beforeCaret.innerHTML = this.textarea.value.slice(0, offset);
    this.caret.classList.remove("blink");
    requestAnimationFrame(() => this.caret.classList.add("blink"));
  }

  // gotoLine(lineno) {
  //   const lineHeight = this.highlighted.children[0].offsetHeight;
  //   const topLine = this.scrollbox.scrollTop / lineHeight;
  //   this.highlighted.children[lineno - 1].scrollIntoView();
  // }

  markLine(lineno) {
    for (const line of this.highlighted.getElementsByClassName("current")) {
      line.classList.remove("current");
    }
    this.highlighted.children[lineno - 1].classList.add("current");
    // this.gotoLine(lineno);
  }
}

export default new Editor(byClass("editor")[0]);
