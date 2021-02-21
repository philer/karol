import {h} from "preact"
import {useEffect, useMemo, useRef, useState} from "preact/hooks"

import * as config from "../config"
import {elem, noop} from "../util"
import {highlight} from "../language/highlight"
import type {ChangeEvent} from "../util/types"

/**
 * How long we wait before assuming the browser has updated the textarea.
 * This value is weird and arbitrary but since textarea doesn't trigger a proper
 * change event I can't find a better solution right now.
 */
const TEXTAREA_UPDATE_DELAY = 5

export interface EditorProps {
  children: string
  indentation?: string
  onChange?: (text: string) => void
  markLine?: number | false
}

interface Selection {
  start: number
  end: number
  direction: "forward" | "backward" | "none"
}

export const Editor = ({
  children = "",
  indentation = "    ",
  onChange = noop,
  markLine = false,
}: EditorProps) => {

  const textareaRef = useRef<HTMLTextAreaElement>()
  const [value, setValue] = useState(children)
  const [isMouseDragging, setIsMouseDragging] = useState(false)
  const [selection, _setSelection] = useState<Selection>({
    start: 1,
    end: 0,
    direction: "none",
  })

  function updateValue({currentTarget: {value}}: ChangeEvent<HTMLTextAreaElement>) {
    setValue(value)
    onChange(value)
  }

  /** Update the textarea's value directly */
  function forceValue(text: string) {
    if (text !== value) {
      setValue(text)
      onChange(text)
      textareaRef.current.value = text
    }
  }

  useEffect(() => {
    typeof children === "string" && forceValue(children)
  }, [children])

  /** Wait for browser to update the textarea before setting the selection */
  const setSelection = (sel: Parameters<typeof _setSelection>[0]) => setTimeout(
    () => _setSelection(sel),
    TEXTAREA_UPDATE_DELAY,
  )

  function updateSelection(evt: MouseEvent | KeyboardEvent) {
    const target = evt.target as HTMLTextAreaElement
    setSelection(() => ({
      start: target.selectionStart,
      end: target.selectionEnd,
      direction: target.selectionDirection,
    }))
    const buttons = (evt as MouseEvent).buttons
    if (buttons !== undefined && !(buttons & 1)) {
      //MouseEvent without primary button pressed -> stop listening for drag
      setIsMouseDragging(false)
    }
  }

  function forceSelection(selection: Selection) {
    setSelection(selection)
    textareaRef.current.setSelectionRange(
      selection.start,
      selection.end,
      selection.direction,
    )
  }

  function onMouseDown(evt: MouseEvent) {
    setIsMouseDragging(true)
    updateSelection(evt)
  }

  function onKeyDown(evt: KeyboardEvent) {
    if (evt.key === "Tab") {
      evt.preventDefault()
      if (evt.shiftKey) {
        unindent(selection)
      } else {
        indent(selection)
      }
    } else {
      updateSelection(evt)
    }
  }

  function indent({start, end, direction}: Selection) {
    const selection = value.slice(start, end)

    if (selection.includes("\n")) {
      // Multi-line selection: Indent all affected lines.
      const firstLineStart = value.lastIndexOf("\n", start - 1) + 1
      let lastLineEnd = value.indexOf("\n", end)
      if (lastLineEnd < 0) {
        lastLineEnd = value.length
      }
      const lines = value
        .slice(firstLineStart, lastLineEnd)
        .replace(/^/gm, indentation)

      forceValue(value.slice(0, firstLineStart) + lines + value.slice(lastLineEnd))
      forceSelection({
        start: start + indentation.length,
        end: firstLineStart - (lastLineEnd - end) + lines.length,
        direction,
      })

    } else {
      // Single-line selection (also empty selection):
      // Insert a single indent, replacing the selection.
      let indent = indentation

      // When not using \t, indent to a full multiple of indentation length.
      if (indentation !== "\t") {
        const lineStart = value.lastIndexOf("\n", start) + 1
        const indentLen = indentation.length
                        - (start - lineStart) % indentation.length
        indent = indentation.substr(0, indentLen)
      }
      forceValue(value.slice(0, start) + indent + value.slice(end))
      forceSelection({
        start: start + indent.length,
        end: start + indent.length,
        direction,
      })
    }
  }

  const unindentRegex = useMemo(
    () => new RegExp("^" + indentation.split("").join("?") + "?", "gm"),
    [indentation],
  )

  function unindent({start, end, direction}: Selection) {
    const firstLineStart = value.lastIndexOf("\n", start - 1) + 1
    let lastLineEnd = value.indexOf("\n", end)
    if (lastLineEnd < 0) {
      lastLineEnd = value.length
    }

    // need this to find out how much was removed
    let firstLineRemoved = 0
    const lines = value
      .slice(firstLineStart, lastLineEnd)
      .replace(unindentRegex, (match, offset) => {
        if (offset === 0) {
          firstLineRemoved = match.length
        }
        return ""
      })

    forceValue(value.slice(0, firstLineStart) + lines + value.slice(lastLineEnd))
    forceSelection({
      start: Math.max(firstLineStart, start - firstLineRemoved),
      end: Math.max(
        firstLineStart + lines.lastIndexOf("\n") + 1,
        end - lastLineEnd + firstLineStart + lines.length,
      ),
      direction,
    })
  }

  return (
    <div class="editor">
      <div class="editor-scrollbox">
        <div>
          <Highlight markLine={markLine}>{value}</Highlight>

          <textarea
            ref={textareaRef}
            class="editor-textarea"
            spellcheck={false}

            // selectionStart={selection.start}
            // selectionEnd={selection.end}
            // selectionDirection={selection.direction}

            // Listening to both keydown & keypress because chrome doesn't trigger
            // keydown on arrow keys while firefox misplaces the cursor with
            // keypress.
            onKeyDown={onKeyDown}
            onKeyPress={updateSelection}
            onInput={updateValue}

            // The selectionchange event is apparently not supported on textarea.
            // Instead we keep track of mouse movement while the button is down.
            onMouseDown={onMouseDown}
            onMouseMove={isMouseDragging ? updateSelection : undefined}
          />

          {/* Put caret layer behind the textarea so we can hide it via css when
            * textarea isn't focused
            */}
          <pre class="editor-caret-layer">
            {value.slice(0, selection.start)}
            {selection.direction === "backward"
              && <span key="caret" class="editor-caret blink" />}
            <span key="editor-selection" class="editor-selection">
              {value.slice(selection.start, selection.end)}
            </span>
            {selection.direction === "forward"
              && <span key="caret" class="editor-caret blink" />}
            {value.slice(selection.end)}
          </pre>
        </div>
      </div>
    </div>
  )
}


/** Use a separate component to gain automatic memoization */
const Highlight = ({children, markLine}: {children: string, markLine: number | false}) =>
  <code
    class="editor-highlight"
    dangerouslySetInnerHTML={{__html: highlight(children, markLine)}}
  />


// Load editor theme css
config.get().then(({editor_theme}) => document.head.append(
  elem("link", {rel: "stylesheet", href: `css/editor-theme-${editor_theme || "bright"}.css`}),
))
