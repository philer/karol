import {Exception} from "../localization"

import * as tokens from "./tokens"
// eslint-disable-next-line no-duplicate-imports
import {tokenize, TokenType} from "./tokens"

const VISUAL_SPACE = "·<wbr>"

/**
 * Map TokenTypes to css class names
 */
const ttClasses = Object.create(null)

ttClasses[tokens.IDENTIFIER] = "identifier"
ttClasses[tokens.INTEGER] =  "number"
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


/** Add syntax highlighting HTML tags to given code snippet. */
export function highlight(text: string, markLine: number | false = false): string {
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
    const remainingText = wrapSpaces(err.data[0].remainingText)
    const [currentLineTail, ...remainingLines] = remainingText.split("\n")
    htmlLines.push(currentLine + currentLineTail, ...remainingLines)
  }

  return htmlLines
    .map((line, idx) =>
      `<div class="line${idx === markLine ? " marked" : ""}">`
      +   `<span class="lineno">${idx + 1}</span>`
      +   `<span>${line}</span>`
      + `</div>`,
    )
    .join("")
}
