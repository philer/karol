import {Exception} from "../exception"


// Token types
export const IDENTIFIER = "IDENTIFIER" as const
export const INTEGER = "INTEGER" as const
export const NOT = "NOT" as const
export const IF = "IF" as const
export const THEN = "THEN" as const
export const ELSE = "ELSE" as const
export const WHILE = "WHILE" as const
export const DO = "DO" as const
export const REPEAT = "REPEAT" as const
export const TIMES = "TIMES" as const
export const PROGRAM = "PROGRAM" as const
export const ROUTINE = "ROUTINE" as const
export const LPAREN = "LPAREN" as const
export const RPAREN = "RPAREN" as const
export const LBRACKET = "LBRACKET" as const
export const RBRACKET = "RBRACKET" as const
// export const LBRACE = "LBRACE" as const  // comments
// export const RBRACE = "RBRACE" as const  // comments
export const LESS = "LESS" as const
export const GREATER = "GREATER" as const
export const EQUALS = "EQUALS" as const
export const ASTERISC = "ASTERISC" as const
export const SLASH = "SLASH" as const
export const HYPHENMINUS = "HYPHENMINUS" as const
export const PLUS = "PLUS" as const
export const DOT = "DOT" as const
export const COMMA = "COMMA" as const
export const COLON = "COLON" as const
export const SEMI = "SEMI" as const
export const SINGLEQUOTE = "SINGLEQUOTE" as const
export const DOUBLEQUOTE = "DOUBLEQUOTE" as const
export const WHITESPACE = "WHITESPACE" as const
export const COMMENT = "COMMENT" as const
export const EOF = "EOF" as const

export type TokenType =
  | "IDENTIFIER" | "INTEGER" | "NOT"
  | "IF" | "THEN" | "ELSE"
  | "WHILE" | "DO" | "REPEAT" | "TIMES"
  | "PROGRAM" | "ROUTINE"
  | "LPAREN" | "RPAREN" | "LBRACKET" | "RBRACKET" /* | LBRACE | RBRACE */
  | "LESS" | "GREATER" | "EQUALS"
  | "ASTERISC" | "SLASH" | "HYPHENMINUS" | "PLUS"
  | "DOT" | "COMMA" | "COLON" | "SEMI"
  | "SINGLEQUOTE" | "DOUBLEQUOTE"
  | "WHITESPACE" | "COMMENT" | "EOF"

const symbolToTokenType = new Map<string, TokenType>(Object.entries({
  "(": LPAREN,
  ")": RPAREN,
  "[": LBRACKET,
  "]": RBRACKET,
  // "{": LBRACE,  // comments
  // "}": RBRACE,  // comments
  "<": LESS,
  ">": GREATER,
  "=": EQUALS,
  "*": ASTERISC,
  "/": SLASH,
  "-": HYPHENMINUS,
  "+": PLUS,
  ".": DOT,
  ",": COMMA,
  ":": COLON,
  ";": SEMI,
  "'": SINGLEQUOTE,
  '"': DOUBLEQUOTE,
}))

export const keywordTokenTypes = [
  IF, THEN, ELSE,
  REPEAT, WHILE, DO,
  NOT, TIMES,
  PROGRAM, ROUTINE,
] as const

const keywordToTokenType = new Map<string, TokenType>(Object.entries({
  if: IF,
  then: THEN,
  else: ELSE,
  while: WHILE,
  do: DO,
  not: NOT,
  repeat: REPEAT,
  times: TIMES,
  program: PROGRAM,
  routine: ROUTINE,
}))

export const tokenTypeToLiteral = new Map<TokenType, string>(
  [...symbolToTokenType, ...keywordToTokenType].map(([literal, tokenType]) => [tokenType, literal]),
)

export function setKeywords(keywords: Map<string, TokenType>) {
  keywordToTokenType.clear()
  tokenTypeToLiteral.clear()
  symbolToTokenType.forEach((tokenType, symbol) => tokenTypeToLiteral.set(tokenType, symbol))
  for (const [keyword, tokenType] of keywords) {
    keywordToTokenType.set(keyword, tokenType)
    tokenTypeToLiteral.set(tokenType, keyword)
  }
}


export interface Token {
  type: TokenType
  value: string
  line: number
  column: number
}

/**
 * Iterable lexer
 */
export function* tokenize(
  text: string,
  yieldWhitespace = false,
  yieldComments = false,
): Generator<Token, Token> {
  const length = text.length

  const reSpaces = /\s+/y
  const reComment = /\{.*?\}/sy
  const reSinglelineComment = /\/\/.*/y
  const reInteger = /\d+/y

  // https://stackoverflow.com/questions/30225552/regex-for-diacritics/44586972
  // https://stackoverflow.com/questions/30798522/regular-expression-not-working-for-at-least-one-european-character
  const reWord = /[A-zÀ-ÖØ-öø-įĴ-őŔ-žǍ-ǰǴ-ǵǸ-țȞ-ȟȤ-ȳɃɆ-ɏḀ-ẞƀ-ƓƗ-ƚƝ-ơƤ-ƥƫ-ưƲ-ƶẠ-ỿ]+/y

  let position = 0
  let line = 1
  let column = 1

  let value = ""
  let match: RegExpExecArray | null
  let lines: string[]

  while (position < length) {

    // word (identifier / keyword)
    reWord.lastIndex = position
    if (match = reWord.exec(text)) {
      value = match[0]
      yield {type: keywordToTokenType.get(value.toLowerCase()) || IDENTIFIER,
        value, line, column}
      column += value.length
      position += value.length
      continue
    }

    // whitespace
    reSpaces.lastIndex = position
    if (match = reSpaces.exec(text)) {
      value = match[0]
      if (yieldWhitespace) {
        yield {type: WHITESPACE, value, line, column}
      }
      lines = value.split("\n")
      if (lines.length > 1) {
        line += lines.length - 1
        column = lines[lines.length - 1].length + 1
      } else {
        column += value.length
      }
      position += value.length
      continue
    }

    // multi-line comment
    reComment.lastIndex = position
    if (match = reComment.exec(text)) {
      value = match[0]
      if (yieldComments) {
        yield {type: COMMENT, value, line, column}
      }
      lines = value.split("\n")
      if (lines.length > 1) {
        line += lines.length - 1
        column = lines[lines.length - 1].length + 1
      } else {
        column += value.length
      }
      position += value.length
      continue
    }

    // single-line comment
    reSinglelineComment.lastIndex = position
    if (match = reSinglelineComment.exec(text)) {
      value = match[0]
      if (yieldComments) {
        yield {type: COMMENT, value, line, column}
      }
      column += value.length
      position += value.length
      continue
    }

    // special character (must be checked after // comments)
    value = text[position]
    if (symbolToTokenType.has(value)) {
      yield {type: symbolToTokenType.get(value) as TokenType, value, line, column}
      ++column
      ++position
      continue
    }

    // integer
    reInteger.lastIndex = position
    if (match = reInteger.exec(text)) {
      value = match[0]
      yield {type: INTEGER, value, line, column}
      column += value.length
      position += value.length
      continue
    }

    // found nothing useful
    throw new Exception("error.parser.token_read", {
      line,
      column,
      remainingText: text.slice(position),
    })
  }
  return {type: EOF, value: "", line, column}
}
