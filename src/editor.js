import highlight from "./highlight.js";
import {byClass} from "./util.js";

class Editor {

  constructor(root, indentation="    ") {
    // this.root = root;
    this.indentation = indentation;
    this.unindenRegex = new RegExp("^" + indentation.split("").join("?") + "?",
                                   "gm");

    this.scrollbox = root.getElementsByClassName("editor-scrollbox")[0];

    this.textarea = root.getElementsByClassName("editor-textarea")[0];
    this.highlighted = root.getElementsByClassName("editor-highlight")[0];

    const caretLayer = root.getElementsByClassName("editor-caret-layer")[0];
    this.beforeCaret = caretLayer.appendChild(document.createElement("span"));
    this.caret = caretLayer.appendChild(document.createElement("span"));
    this.caret.classList.add("editor-caret");

    this.textarea.addEventListener("keypress", evt => {
      if (evt.keyCode === 9) {
         evt.preventDefault();
         if (evt.shiftKey) {
           this.unindent();
         } else {
           this.indent();
         }
      }
    });

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


  indent() {
    const {value,
           selectionStart,
           selectionEnd,
           selectionDirection} = this.textarea;
    const selection = value.slice(selectionStart, selectionEnd);

    if (selection.includes("\n")) {
      // Multi-line selection: Indent all affected lines.
      const firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      let lastLineEnd = value.indexOf("\n", selectionEnd);
      if (lastLineEnd < 0) lastLineEnd = value.length;
      const lines = value.slice(firstLineStart, lastLineEnd)
                        .replace(/^/gm, this.indentation);

      this.textarea.value = value.slice(0, firstLineStart)
                          + lines
                          + value.slice(lastLineEnd);

      this.textarea.selectionStart = selectionStart + this.indentation.length;
      this.textarea.selectionEnd = firstLineStart + lines.length
                                 - (lastLineEnd - selectionEnd);
      this.textarea.selectionDirection = selectionDirection;
    } else {
      // Single-line selection (also empty selection):
      // Insert a single indentation, replacing the selection.

      // When not using \t, indent to a full multiple of indentation length.
      let indentation = this.indentation;
      if (indentation !== "\t") {
        const lineStart = value.lastIndexOf("\n", selectionStart) + 1;
        const indentLen = indentation.length
                        - (selectionStart - lineStart) % indentation.length;
        indentation = indentation.substr(0, indentLen);
      }
      this.textarea.value = value.slice(0, selectionStart)
                          + indentation
                          + value.slice(selectionEnd);

      this.textarea.selectionStart = this.textarea.selectionEnd
                                   = selectionStart + indentation.length;
    }
    this.update();
  }

  unindent() {
    const {value,
           selectionStart,
           selectionEnd,
           selectionDirection} = this.textarea;

    const firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    let lastLineEnd = value.indexOf("\n", selectionEnd);
    if (lastLineEnd < 0) lastLineEnd = value.length;

    let firstLineUnindent = null; // need this to find out how much was removed
    const lines = value.slice(firstLineStart, lastLineEnd)
                      .replace(this.unindenRegex, function(match) {
                        if (firstLineUnindent === null) {
                          firstLineUnindent = match.length;
                        }
                        return '';
                      });

    this.textarea.value = value.slice(0, firstLineStart)
                        + lines
                        + value.slice(lastLineEnd);

    this.textarea.selectionStart = Math.max(firstLineStart,
                                            selectionStart - firstLineUnindent);
    this.textarea.selectionEnd = Math.max(
        firstLineStart + lines.lastIndexOf("\n") + 1,
        selectionEnd - lastLineEnd + firstLineStart + lines.length
    );
    this.textarea.selectionDirection = selectionDirection;
    this.update();
  }
}

export default new Editor(byClass("editor")[0]);
