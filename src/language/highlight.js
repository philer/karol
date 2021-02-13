import {TokenIterator, TokenTypes as TT} from "./parser"

const VISUAL_SPACE = "·"

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

const transformWhitespace = text => text.replace(reSpaces, spaces =>
    `<span class="whitespace">${VISUAL_SPACE.repeat(spaces.length)}</span>`,
  )

function wrapToken(text, type) {
  if (type === TT.WHITESPACE) {
    return text  // already wrapped
  }
  return `<span class="token ${ttClasses[type]}">${text}</span>`
}

let lineno

const wrapLine = text => '<span class="line">'
                       +   '<span class="lineno">'
                       +     lineno++
                       +   '</span>'
                       +   '<span>'
                       +     text
                       +   '</span>'
                       + '</span>'

/**
 * Add syntax highlighting HTML tags to given code snippet.
 * @param  {String} text code
 * @return {String}      code with tokens wrapped in HTML tags
 */
export default function highlight(text) {
  const tokens = new TokenIterator(text, true, true)
  let html = ""
  let currentLine = ""
  lineno = 1
  try {
    for (const token of tokens) {
      if (token.type === TT.COMMENT || token.type === TT.WHITESPACE) {
        const [first, ...lines] = transformWhitespace(token.value).split("\n")
        currentLine += wrapToken(first, token.type)
        for (const line of lines) {
          html += wrapLine(currentLine)
          currentLine = wrapToken(line, token.type)
        }
      } else {
        currentLine += wrapToken(token.value, token.type)
      }
    }
  } catch (err) {
    return html + (currentLine + transformWhitespace(tokens.remainingText))
                  .split("\n").map(wrapLine).join("")
  }
  return html + wrapLine(currentLine)
}
