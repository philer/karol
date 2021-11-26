import {Exception} from "../localization"
import {clsx} from "../util"

import * as tokens from "./tokens"
// eslint-disable-next-line no-duplicate-imports
import {TokenType, tokenize} from "./tokens"

const VISUAL_SPACE = "·<wbr>"

/**
 * Map TokenTypes to css class names
 */
const ttClasses = Object.create(null)

ttClasses[tokens.IDENTIFIER] = "identifier"
ttClasses[tokens.INTEGER] = "number"
ttClasses[tokens.COMMENT] = "comment"
ttClasses[tokens.WHITESPACE] = "whitespace";
[
  tokens.NOT,
  tokens.IF, tokens.THEN, tokens.ELSE,
  tokens.WHILE, tokens.DO, tokens.REPEAT, tokens.TIMES,
  tokens.PROGRAM, tokens.ROUTINE,
].forEach(tt => ttClasses[tt] = "keyword");
[
  tokens.LPAREN, tokens.RPAREN, tokens.LBRACKET, tokens.RBRACKET,
  /*tokens.LBRACE, tokens.RBRACE,*/  // comments
  tokens.LESS, tokens.GREATER, tokens.EQUALS,
  tokens.ASTERISC, tokens.SLASH, tokens.HYPHENMINUS, tokens.PLUS,
  tokens.DOT, tokens.COMMA, tokens.COLON, tokens.SEMI,
  tokens.SINGLEQUOTE, tokens.DOUBLEQUOTE,
].forEach(tt => ttClasses[tt] = "punctuation")


const reSpaces = / +/g

const wrapSpaces = (text: string) => text.replace(reSpaces, spaces =>
  `<span class="whitespace">${VISUAL_SPACE.repeat(spaces.length)}</span>`,
)

const wrapToken = (text: string, type: TokenType) =>
  type === tokens.WHITESPACE
    ? text  // already wrapped
    : `<span class="token ${ttClasses[type]}">${text}</span>`


export type Mark = "current" | "error"
export type Marks = Record<number, Mark>

/** Add syntax highlighting HTML tags to given code snippet. */
export function highlight(text: string, marks: Marks = {}): string {
  const htmlLines = []
  let currentLine = ""

  try {
    for (const {value, type} of tokenize(text, true, true)) {
      if (type === tokens.COMMENT || type === tokens.WHITESPACE) {
        const [first, ...lines] = wrapSpaces(value).split("\n")
        currentLine += wrapToken(first, type)
        for (const line of lines) {
          htmlLines.push(currentLine)
          currentLine = wrapToken(line, type)
        }
      } else {
        currentLine += wrapToken(value, type)
      }
    }
    htmlLines.push(currentLine)

  } catch (err) {
    if (!(err instanceof Exception)) {
      throw err
    }
    const {remainingText} = err.data[0]
    const [currentWord] = remainingText.split(/\s/, 1)
    const [currentLineTail, ...remainingLines]= wrapSpaces(
      remainingText.slice(currentWord.length),
    ).split("\n")
    htmlLines.push(
      currentLine + `<span class="error">${currentWord}</span>` + currentLineTail,
      ...remainingLines,
    )
  }

  return htmlLines
    .map((line, idx) =>
      `<div class="${clsx("line", marks[idx + 1] && "marked", marks[idx + 1])}">`
        + `<span class="lineno">${idx + 1}</span>`
        + `<span class="line-content">${line}</span>`
      + `</div>`,
    )
    .join("")
}
