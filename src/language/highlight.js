import {TokenIterator, TokenTypes as TT} from "./parser"

const VISUAL_SPACE = "·<wbr>"

/**
 * Map TokenTypes to css class names
 */
const ttClasses = Object.create(null)

ttClasses[TT.IDENTIFIER] = "identifier"
ttClasses[TT.INTEGER] =  "number"
ttClasses[TT.COMMENT] = "comment"
ttClasses[TT.WHITESPACE] = "whitespace";
[
  TT.NOT,
  TT.IF, TT.THEN, TT.ELSE,
  TT.WHILE, TT.DO, TT.REPEAT, TT.TIMES,
  TT.PROGRAM, TT.ROUTINE,
].forEach(tt => ttClasses[tt] = "keyword");
[
  TT.LPAREN, TT.RPAREN, TT.LBRACKET, TT.RBRACKET, TT.LBRACE, TT.RBRACE,
  TT.LESS, TT.GREATER, TT.EQUALS,
  TT.ASTERISC, TT.SLASH, TT.HYPHENMINUS, TT.PLUS,
  TT.DOT, TT.COMMA, TT.COLON, TT.SEMI,
  TT.SINGLEQUOTE, TT.DOUBLEQUOTE,
].forEach(tt => ttClasses[tt] = "punctuation")


const reSpaces = / +/g

const wrapSpaces = text => text.replace(reSpaces, spaces =>
    `<span class="whitespace">${VISUAL_SPACE.repeat(spaces.length)}</span>`,
  )

 const wrapToken = (text, type) =>
  type === TT.WHITESPACE
    ? text  // already wrapped
    : `<span class="token ${ttClasses[type]}">${text}</span>`

const wrapLine = (line, idx) =>
    '<div class="line">'
  +   `<span class="lineno">${idx + 1}</span>`
  +   `<span>${line}</span>`
  + '</div>'

/**
 * Add syntax highlighting HTML tags to given code snippet.
 * @param  {String} text code
 * @return {String}      code with tokens wrapped in HTML tags
 */
export default function highlight(text) {
  const tokens = new TokenIterator(text, true, true)
  const htmlLines = []
  let currentLine = ""
  let value, type
  try {
    for ({value, type} of tokens) {
      if (type === TT.COMMENT || type === TT.WHITESPACE) {
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
  } catch (err) {
    console.error(err)
    htmlLines.push(currentLine)
    return htmlLines.map(wrapLine).join("")
      + wrapSpaces(tokens.remainingText)
          .split("\n").map(wrapLine).join("")
  }
  htmlLines.push(currentLine)
  return htmlLines.map(wrapLine).join("")
}
