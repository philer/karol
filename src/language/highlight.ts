import {Exception} from "../exception"
import {clsx} from "../util"
import {tokenize} from "./tokenize"
import type {LanguageSpecification, TokenType} from "./specification"
// eslint-disable-next-line no-duplicate-imports
import {TokenType as tt} from "./specification"

const VISUAL_SPACE = "·<wbr>"

/**
 * Map TokenTypes to css class names
 */
const ttClasses = Object.create(null)

ttClasses[tt.IDENTIFIER] = "identifier"
ttClasses[tt.INTEGER] = "number"
ttClasses[tt.COMMENT] = "comment"
ttClasses[tt.WHITESPACE] = "whitespace";
[
  tt.NOT,
  tt.IF, tt.THEN, tt.ELSE,
  tt.WHILE, tt.DO, tt.REPEAT, tt.TIMES,
  tt.PROGRAM, tt.ROUTINE,
].forEach(tt => ttClasses[tt] = "keyword");
[
  tt.LPAREN, tt.RPAREN, tt.LBRACKET, tt.RBRACKET,
  /*tt.LBRACE, tt.RBRACE,*/  // comments
  tt.LESS, tt.GREATER, tt.EQUALS,
  tt.ASTERISC, tt.SLASH, tt.HYPHENMINUS, tt.PLUS,
  tt.DOT, tt.COMMA, tt.COLON, tt.SEMI,
  tt.SINGLEQUOTE, tt.DOUBLEQUOTE,
].forEach(tt => ttClasses[tt] = "punctuation")


const reSpaces = / +/g

const wrapSpaces = (text: string) => text.replace(reSpaces, spaces =>
  `<span class="whitespace">${VISUAL_SPACE.repeat(spaces.length)}</span>`,
)

const wrapToken = (text: string, type: TokenType, isBuiltin?: boolean) =>
  type === tt.WHITESPACE
    ? text  // already wrapped
    : `<span class="${
      clsx("token", ttClasses[type], isBuiltin && "builtin")
    }">${text}</span>`


export type Mark = "current" | "error"
export type Marks = Record<number, Mark>

/** Add syntax highlighting HTML tags to given code snippet. */
export function highlight(text: string, spec: LanguageSpecification, marks: Marks = {}): string {
  const htmlLines = []
  let currentLine = ""

  try {
    for (const {value, type, isBuiltin} of tokenize(text, spec, true, true)) {
      if (type === tt.COMMENT || type === tt.WHITESPACE) {
        const [first, ...lines] = wrapSpaces(value).split("\n")
        currentLine += wrapToken(first, type)
        for (const line of lines) {
          htmlLines.push(currentLine)
          currentLine = wrapToken(line, type)
        }
      } else {
        currentLine += wrapToken(value, type, isBuiltin)
      }
    }
    htmlLines.push(currentLine)

  } catch (err) {
    if (!(err instanceof Exception)) {
      throw err
    }
    if (err.data?.remainingLines) {
      const {remainingText} = err.data
      const [currentWord] = remainingText.split(/\s/, 1)
      const [currentLineTail, ...remainingLines]= wrapSpaces(
        remainingText.slice(currentWord.length),
      ).split("\n")
      htmlLines.push(
        currentLine + `<span class="error">${currentWord}</span>` + currentLineTail,
        ...remainingLines,
      )
    }
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
