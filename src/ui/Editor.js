import {h} from "preact"
import {useEffect, useMemo, useRef, useReducer, useState} from "preact/hooks"

import * as config from "../config"
import {elem, noop} from "../util"
import highlight from "../language/highlight"

const reducer = (state, action) => {
  switch (action.type) {
    case "updateValue": {
      return {
        ...state,
        value: action.value,
        highlighted: highlight(action.value),
      }
      // TODO? this.updateCaret()
    }
    case "updateCaret": {
      const {selectionStart, selectionEnd, selectionDirection} = action.event.target
      return {...state, selectionStart, selectionEnd, selectionDirection}
      // TODO? restart caret animation
      // https://css-tricks.com/restart-css-animation/
    }
    default: {
      throw new Error(`Unknown action type '${action.type}'`)
    }
  }
}

export const Editor = ({children = "", onChange = noop}) => {
  // TODO
  // const {indentation} = props.indentation ?? "    "
  // const unindentRegex = useMemo(
  //   () => new RegExp("^" + indentation.split("").join("?") + "?", "gm"),
  //   [indentation],
  // )

  // TODO? might not need a reducer
  const [{
    value,
    highlighted,
    selectionStart,
    selectionEnd,
    selectionDirection,
  }, dispatch] = useReducer(reducer, {
    value: children,
    highlighted: highlight(""),
    selectionStart: 1,
    selectionEnd: 0,
    selectionDirection: "none",
  })

  useEffect(
    () => typeof children === "string"
      && dispatch({type: "updateValue", value: children}),
    [children],
  )

  function updateValue({target: {value}}) {
    dispatch({type: "updateValue", value})
    onChange(value)
  }

  function updateCaret(event) {
    // TODO? maybe throttle
    setTimeout(() => dispatch({type: "updateCaret", event}), 10)
  }

  function onKeydown(event) {
    // TODO
    // if (event.key === "Tab" || event.keyCode === 9) {
    //   event.preventDefault()
    //   if (event.shiftKey) {
    //     unindent()
    //   } else {
    //     indent()
    //   }
    // }
    updateCaret(event)
  }

  const [isMouseDragging, setIsMouseDragging] = useState(false)
  function startMouseDragging(event) {
    setIsMouseDragging(true)
    updateCaret(event)
  }
  function stopMouseDragging(event) {
    setIsMouseDragging(false)
    updateCaret(event)
  }

  // TODO
  // function markLine(lineno) {
  //   for (const line of this.highlighted.getElementsByClassName("current")) {
  //     line.classList.remove("current")
  //   }
  //   const line = this.highlighted.children[lineno - 1]
  //   if (line) {
  //     line.classList.add("current")
  //   }
  //   // TODO scrollIntoView
  // }

  return (
    <div class="editor">
      <div class="editor-scrollbox">
        <div>
          <code
            class="editor-highlight"
            dangerouslySetInnerHTML={{__html: highlighted}}
          />

          <textarea
            class="editor-textarea"
            spellcheck={false}

            value={value}
            selectionStart={selectionStart}
            selectionEnd={selectionEnd}
            selectionDirection={selectionDirection}

            // Listening to both keydown & keypress because chrome doesn't trigger
            // keydown on arrow keys while firefox misplaces the cursor with
            // keypress.
            onKeydown={onKeydown}
            onKeypress={updateCaret}
            onInput={updateValue}

            // The selectionchange event is apparently not supported on textarea.
            // Instead we keep track of mouse movement while the button is down.
            onMousedown={startMouseDragging}
            onMouseup={stopMouseDragging}
            onMousemove={isMouseDragging ? updateCaret : undefined}
          />

          {/* Put caret layer behind the textarea so we can hide it via css when
            * textarea isn't focused
            */}
          <pre class="editor-caret-layer">
            {value.slice(0, selectionStart)}
            {selectionDirection === "forward" &&
              <span key="editor-selection" class="editor-selection">
                {value.slice(selectionStart, selectionEnd)}
              </span>
            }
            <span key="caret" class="editor-caret blink" />
            {selectionDirection === "backward" &&
              <span key="editor-selection" class="editor-selection">
                {value.slice(selectionStart, selectionEnd)}
              </span>
            }
            {value.slice(selectionEnd)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export class _Editor {

  indent() {
    const {value, selectionStart, selectionEnd, selectionDirection} = this.textarea
    const selection = value.slice(selectionStart, selectionEnd)

    if (selection.includes("\n")) {
      // Multi-line selection: Indent all affected lines.
      const firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1
      let lastLineEnd = value.indexOf("\n", selectionEnd)
      if (lastLineEnd < 0) lastLineEnd = value.length
      const lines = value.slice(firstLineStart, lastLineEnd)
        .replace(/^/gm, this.indentation)

      this.textarea.value = value.slice(0, firstLineStart)
                          + lines
                          + value.slice(lastLineEnd)

      this.textarea.selectionStart = selectionStart + this.indentation.length
      this.textarea.selectionEnd = firstLineStart + lines.length
                                 - (lastLineEnd - selectionEnd)
      this.textarea.selectionDirection = selectionDirection
    } else {
      // Single-line selection (also empty selection):
      // Insert a single indentation, replacing the selection.

      // When not using \t, indent to a full multiple of indentation length.
      let indentation = this.indentation
      if (indentation !== "\t") {
        const lineStart = value.lastIndexOf("\n", selectionStart) + 1
        const indentLen = indentation.length
                        - (selectionStart - lineStart) % indentation.length
        indentation = indentation.substr(0, indentLen)
      }
      this.textarea.value = value.slice(0, selectionStart)
                          + indentation
                          + value.slice(selectionEnd)

      this.textarea.selectionStart = this.textarea.selectionEnd
                                   = selectionStart + indentation.length
    }
    this.update()
  }

  unindent() {
    const {value, selectionStart, selectionEnd, selectionDirection} = this.textarea

    const firstLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1
    let lastLineEnd = value.indexOf("\n", selectionEnd)
    if (lastLineEnd < 0) lastLineEnd = value.length

    let firstLineUnindent = null // need this to find out how much was removed
    const lines = value.slice(firstLineStart, lastLineEnd)
      .replace(this.unindenRegex, match =>
        firstLineUnindent === null
          ? firstLineUnindent = match.length
          : "",
      )

    this.textarea.value = value.slice(0, firstLineStart)
                        + lines
                        + value.slice(lastLineEnd)

    this.textarea.selectionStart = Math.max(firstLineStart,
      selectionStart - firstLineUnindent)
    this.textarea.selectionEnd = Math.max(
      firstLineStart + lines.lastIndexOf("\n") + 1,
      selectionEnd - lastLineEnd + firstLineStart + lines.length,
    )
    this.textarea.selectionDirection = selectionDirection
    this.update()
  }
}

// Load editor theme css
config.get().then(({editor_theme}) => document.head.append(
  elem("link", {rel: "stylesheet", href: `css/editor-theme-${editor_theme || "bright"}.css`}),
))
