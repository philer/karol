import highlight from "./highlight.js";
import {byClass} from "./util.js";

class Editor {

  constructor(root) {
    // this.root = root;
    this.textarea = root.getElementsByClassName("editor-textarea")[0];
    this.highlighted = root.getElementsByClassName("editor-highlight")[0];
    this.scrollbox = root.getElementsByClassName("editor-scrollbox")[0];
    this.caretLayer = root.getElementsByClassName("editor-caret-layer")[0];
    this.caret = document.createElement("span");
    this.caret.classList.add("editor-caret");

    this.textarea.addEventListener("input", this.update.bind(this));
    //  more events: paste propertychange

    const updateCaret = this.updateCaret.bind(this);
    const deferredCaretUpdate = () => setTimeout(updateCaret, 0);
    this.textarea.addEventListener("click", deferredCaretUpdate);
    this.textarea.addEventListener("input", deferredCaretUpdate);
    this.textarea.addEventListener("keypress", deferredCaretUpdate);

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
    this.caretLayer.innerHTML = this.textarea.value;
    this.caretLayerText = this.caretLayer.firstChild;
    if (this.caretLayerText) {
      const offset = this.textarea.selectionDirection === "forward"
                   ? this.textarea.selectionEnd
                   : this.textarea.selectionStart;
      const range = document.createRange();
      range.setStart(this.caretLayerText, offset);
      range.insertNode(this.caret);
    } else {
      this.caretLayer.appendChild(this.caret);
    }
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
