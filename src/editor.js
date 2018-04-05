import highlight from "./highlight.js";

export class Editor {

  constructor(root, indentation="    ") {
    this.indentation = indentation;
    this.unindenRegex = new RegExp("^" + indentation.split("").join("?") + "?",
                                   "gm");

    this.scrollbox = root.getElementsByClassName("editor-scrollbox")[0];
    this.highlighted = root.getElementsByClassName("editor-highlight")[0];
    const textarea =  this.textarea
                   = root.getElementsByClassName("editor-textarea")[0];
    const caretLayer = this.caretLayer
                     = root.getElementsByClassName("editor-caret-layer")[0];

    this.beforeCaret = caretLayer.appendChild(document.createElement("span"));
    this.caret = caretLayer.appendChild(document.createElement("span"));
    this.caret.classList.add("editor-caret");
    this.selection = caretLayer.appendChild(document.createElement("span"));
    this.selection.classList.add("editor-selection");

    // chrome ignores keypress
    textarea.addEventListener("keydown", evt => {
      if (evt.key === "Tab" || evt.keyCode === 9) {
         evt.preventDefault();
         if (evt.shiftKey) {
           this.unindent();
         } else {
           this.indent();
         }
      }
    });

    textarea.addEventListener("input", this.update.bind(this));
    //  more events: paste propertychange

    const updateCaret = this.updateCaret.bind(this);
    const deferredCaretUpdate = () => setTimeout(updateCaret, 0);
    // Listening to both because chrome doesn't trigger keydown on arrow keys
    // while firefox misplaces the cursor with keypress.
    textarea.addEventListener("keypress", deferredCaretUpdate);
    textarea.addEventListener("keydown", deferredCaretUpdate);

    // The selectionchange event is not supported on textarea, for some reason.
    // Instead we keep track of mouse movement while the button is down.
    textarea.addEventListener("mousedown", function() {
      this.addEventListener("mousemove", deferredCaretUpdate);
      deferredCaretUpdate();
    });
    textarea.addEventListener("mouseup", function() {
      this.removeEventListener("mousemove", deferredCaretUpdate);
      deferredCaretUpdate();
    });

    this.update();
    // updateCaret();
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
    this.updateCaret();
  }

  updateCaret() {
    const {value, selectionDirection, selectionEnd, selectionStart} = this.textarea;
    // const offset = selectionDirection === "forward" ? selectionEnd : selectionStart;
    // this.beforeCaret.innerHTML = this.textarea.value.slice(0, offset);
    this.beforeCaret.innerHTML = value.slice(0, selectionStart);

    // selection may be empty
    this.selection.innerHTML = value.slice(selectionStart, selectionEnd);
    this.caret.insertAdjacentElement(selectionDirection === "forward"
                                        ? "beforebegin" : "afterend",
                                     this.selection);

    // restart animation
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
    const line = this.highlighted.children[lineno - 1];
    if (line) {
      line.classList.add("current");
    }
    // this.gotoLine(lineno);
  }


  indent() {
    const {value, selectionStart, selectionEnd, selectionDirection} = this.textarea;
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
    const {value, selectionStart, selectionEnd, selectionDirection} = this.textarea;

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
